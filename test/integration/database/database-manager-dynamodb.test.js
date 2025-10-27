import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DatabaseManager } from '../../../src/database/manager.js'
import { dynamodbConfig } from '../setup/database-config.js'
import { randomUUID } from 'crypto'
import { CreateTableCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb'

describe('DatabaseManager DynamoDB Integration Tests', () => {
  let sut, testConnectionNames, testTables  // sut = System Under Test (DatabaseManager)

  beforeEach(() => {
    // Component initialization
    sut = new DatabaseManager()
    testConnectionNames = []
    testTables = []
  })

  afterEach(async () => {
    // Cleanup test tables and connections
    for (const connectionName of testConnectionNames) {
      try {
        if (sut.hasConnection(connectionName)) {
          const connection = sut.getConnection(connectionName)

          // Delete test tables
          for (const tableName of testTables) {
            try {
              await connection.driver.client.send(new DeleteTableCommand({ TableName: tableName }))
            } catch (error) {
              // Ignore table deletion errors (table might not exist)
            }
          }

          await sut.disconnect(connectionName)
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await sut.disconnectAll()
    testTables = []
  })

  describe('connect', () => {
    // Happy path tests first
    it('should connect successfully with valid DynamoDB configuration', async () => {
      // GIVEN - Valid DynamoDB configuration
      const connectionName = `dynamodb-test-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...dynamodbConfig, name: connectionName }

      // WHEN - Connection is established
      const result = await sut.connect(config)

      // THEN - Should return connection info
      expect(result.success).toBe(true)
      expect(result.name).toBe(connectionName)
      expect(result.type).toBe('dynamodb')
      expect(sut.hasConnection(connectionName)).toBe(true)
    })

    // Unhappy path tests second
    it('should throw error when invalid credentials provided', async () => {
      // GIVEN - Invalid endpoint (without local endpoint, invalid credentials would fail)
      const connectionName = `dynamodb-invalid-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const invalidConfig = {
        ...dynamodbConfig,
        name: connectionName,
        endpoint: 'http://localhost:9999' // Non-existent endpoint
      }

      // WHEN/THEN - Connection should fail
      await expect(sut.connect(invalidConfig)).rejects.toThrow()
    })

    it('should throw error when required configuration fields are missing', async () => {
      // GIVEN - Invalid configuration missing region
      const connectionName = `dynamodb-missing-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const invalidConfig = {
        type: 'dynamodb',
        name: connectionName,
        accessKeyId: 'test',
        secretAccessKey: 'test'
        // Missing region
      }

      // WHEN/THEN - Connection should fail
      await expect(sut.connect(invalidConfig)).rejects.toThrow(/Missing required DynamoDB configuration fields/)
    })
  })

  describe('executeQuery', () => {
    let connectionName, tableName

    beforeEach(async () => {
      // Setup active DynamoDB connection
      connectionName = `dynamodb-query-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...dynamodbConfig, name: connectionName }
      await sut.connect(config)

      // Create test table
      tableName = `TestTable_${randomUUID().replace(/-/g, '_')}`
      testTables.push(tableName)

      const connection = sut.getConnection(connectionName)
      await connection.driver.client.send(new CreateTableCommand({
        TableName: tableName,
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }))

      // Wait for table to be active
      await new Promise(resolve => setTimeout(resolve, 1000))
    })

    // Happy path tests first
    it('should execute PartiQL INSERT statement', async () => {
      // WHEN - PartiQL INSERT is executed
      const result = await sut.executeQuery(
        connectionName,
        `INSERT INTO "${tableName}" VALUE {'id': ?, 'name': ?, 'age': ?}`,
        ['user1', 'John Doe', 30]
      )

      // THEN - Should succeed
      expect(result.success).toBe(true)
    })

    it('should execute PartiQL SELECT statement', async () => {
      // GIVEN - Data inserted into table
      await sut.executeQuery(
        connectionName,
        `INSERT INTO "${tableName}" VALUE {'id': ?, 'name': ?}`,
        ['user1', 'Alice']
      )

      // WHEN - PartiQL SELECT is executed
      const result = await sut.executeQuery(
        connectionName,
        `SELECT * FROM "${tableName}" WHERE id = ?`,
        ['user1']
      )

      // THEN - Should return results
      expect(result.success).toBe(true)
      expect(result.rows.length).toBe(1)
      expect(result.rows[0].id).toBe('user1')
      expect(result.rows[0].name).toBe('Alice')
      expect(result.rowCount).toBe(1)
    })

    it('should execute PartiQL UPDATE statement', async () => {
      // GIVEN - Data inserted into table
      await sut.executeQuery(
        connectionName,
        `INSERT INTO "${tableName}" VALUE {'id': ?, 'name': ?}`,
        ['user1', 'Bob']
      )

      // WHEN - PartiQL UPDATE is executed
      const updateResult = await sut.executeQuery(
        connectionName,
        `UPDATE "${tableName}" SET name = ? WHERE id = ?`,
        ['Robert', 'user1']
      )

      // THEN - Should succeed
      expect(updateResult.success).toBe(true)

      // Verify update
      const selectResult = await sut.executeQuery(
        connectionName,
        `SELECT * FROM "${tableName}" WHERE id = ?`,
        ['user1']
      )
      expect(selectResult.rows[0].name).toBe('Robert')
    })

    it('should execute PartiQL DELETE statement', async () => {
      // GIVEN - Data inserted into table
      await sut.executeQuery(
        connectionName,
        `INSERT INTO "${tableName}" VALUE {'id': ?, 'name': ?}`,
        ['user1', 'Charlie']
      )

      // WHEN - PartiQL DELETE is executed
      const deleteResult = await sut.executeQuery(
        connectionName,
        `DELETE FROM "${tableName}" WHERE id = ?`,
        ['user1']
      )

      // THEN - Should succeed
      expect(deleteResult.success).toBe(true)

      // Verify deletion
      const selectResult = await sut.executeQuery(
        connectionName,
        `SELECT * FROM "${tableName}" WHERE id = ?`,
        ['user1']
      )
      expect(selectResult.rows.length).toBe(0)
    })

    // Unhappy path tests second
    it('should throw error when executing invalid PartiQL', async () => {
      // WHEN/THEN - Invalid PartiQL should fail
      await expect(sut.executeQuery(connectionName, 'INVALID PARTIQL')).rejects.toThrow()
    })

    it('should throw error when querying non-existent table', async () => {
      // WHEN/THEN - Query to non-existent table should fail
      await expect(
        sut.executeQuery(connectionName, 'SELECT * FROM "NonExistentTable" WHERE id = ?', ['test'])
      ).rejects.toThrow()
    })
  })

  describe('getSchema', () => {
    let connectionName, tableName

    beforeEach(async () => {
      // Setup active DynamoDB connection
      connectionName = `dynamodb-schema-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...dynamodbConfig, name: connectionName }
      await sut.connect(config)

      // Create test table with GSI
      tableName = `TestTable_${randomUUID().replace(/-/g, '_')}`
      testTables.push(tableName)

      const connection = sut.getConnection(connectionName)
      await connection.driver.client.send(new CreateTableCommand({
        TableName: tableName,
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'sortKey', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'sortKey', AttributeType: 'S' },
          { AttributeName: 'gsiKey', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TestGSI',
            KeySchema: [
              { AttributeName: 'gsiKey', KeyType: 'HASH' }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }))

      // Wait for table to be active
      await new Promise(resolve => setTimeout(resolve, 1000))
    })

    it('should retrieve DynamoDB table schema with key schema and indexes', async () => {
      // WHEN - Schema is retrieved
      const schema = await sut.getSchema(connectionName)

      // THEN - Should return table information
      expect(schema.tables).toBeDefined()
      expect(schema.tables.length).toBeGreaterThan(0)

      const testTable = schema.tables.find(t => t.name === tableName)
      expect(testTable).toBeDefined()
      expect(testTable.name).toBe(tableName)
      expect(testTable.status).toBe('ACTIVE')
      expect(testTable.keySchema.length).toBe(2)
      expect(testTable.keySchema[0].name).toBe('id')
      expect(testTable.keySchema[0].keyType).toBe('HASH')
      expect(testTable.keySchema[1].name).toBe('sortKey')
      expect(testTable.keySchema[1].keyType).toBe('RANGE')
      expect(testTable.attributes.length).toBe(3)
      expect(testTable.globalSecondaryIndexes.length).toBe(1)
      expect(testTable.globalSecondaryIndexes[0].name).toBe('TestGSI')
    })
  })

  describe('testConnection', () => {
    it('should return success for valid connection', async () => {
      // GIVEN - Active DynamoDB connection
      const connectionName = `dynamodb-test-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...dynamodbConfig, name: connectionName }
      await sut.connect(config)

      // WHEN - Connection is tested
      const result = await sut.testConnection(connectionName)

      // THEN - Should return success
      expect(result.success).toBe(true)
      expect(result.message).toBe('Connection successful')
    })
  })

  describe('disconnect', () => {
    it('should disconnect from DynamoDB successfully', async () => {
      // GIVEN - Active DynamoDB connection
      const connectionName = `dynamodb-disconnect-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...dynamodbConfig, name: connectionName }
      await sut.connect(config)

      // WHEN - Connection is disconnected
      await sut.disconnect(connectionName)

      // THEN - Connection should be removed
      expect(sut.hasConnection(connectionName)).toBe(false)
    })
  })

  describe('getConnectionInfo', () => {
    it('should return DynamoDB connection information', async () => {
      // GIVEN - Active DynamoDB connection
      const connectionName = `dynamodb-info-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...dynamodbConfig, name: connectionName }
      await sut.connect(config)

      // WHEN - Connection info is retrieved
      const info = sut.getConnectionInfo(connectionName)

      // THEN - Should return connection details
      expect(info.name).toBe(connectionName)
      expect(info.type).toBe('dynamodb')
      expect(info.connectionString).toContain('dynamodb://')
      expect(info.connectionString).toContain('us-east-1')
    })
  })
})
