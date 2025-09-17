import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DatabaseManager } from '../../../src/database/manager.js'
import { mysqlConfig } from '../setup/database-config.js'
import { randomUUID } from 'crypto'

describe('DatabaseManager MySQL Integration Tests', () => {
  let sut, testConnectionNames  // sut = System Under Test (DatabaseManager)

  beforeEach(() => {
    // Component initialization
    sut = new DatabaseManager()
    testConnectionNames = []
  })

  afterEach(async () => {
    // Cleanup test connections and resources
    for (const connectionName of testConnectionNames) {
      try {
        if (sut.hasConnection(connectionName)) {
          await sut.disconnect(connectionName)
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await sut.disconnectAll()
  })

  describe('connect', () => {
    // Happy path tests first
    it('should connect successfully with valid MySQL configuration', async () => {
      // GIVEN - Valid MySQL configuration
      const connectionName = `mysql-test-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...mysqlConfig, name: connectionName }

      // WHEN - Connection is established
      const result = await sut.connect(config)

      // THEN - Should return connection info
      expect(result.success).toBe(true)
      expect(result.name).toBe(connectionName)
      expect(result.type).toBe('mysql')
      expect(sut.hasConnection(connectionName)).toBe(true)
    })

    // Unhappy path tests second
    it('should throw error when invalid credentials provided', async () => {
      // GIVEN - Invalid credentials
      const connectionName = `mysql-invalid-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const invalidConfig = { ...mysqlConfig, name: connectionName, password: 'wrongpassword' }

      // WHEN/THEN - Connection should fail
      await expect(sut.connect(invalidConfig)).rejects.toThrow()
    })
  })

  describe('executeQuery', () => {
    let connectionName

    beforeEach(async () => {
      // Setup active MySQL connection
      connectionName = `mysql-query-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...mysqlConfig, name: connectionName }
      await sut.connect(config)
    })

    // Happy path tests first
    it('should execute simple SELECT query', async () => {
      // WHEN - Simple query is executed
      const result = await sut.executeQuery(connectionName, 'SELECT ? as message', ['Hello MySQL'])

      // THEN - Should return results
      expect(result.success).toBe(true)
      expect(result.rows.length).toBe(1)
      expect(result.rows[0].message).toBe('Hello MySQL')
      expect(result.rowCount).toBe(1)
    })

    it('should execute CREATE TABLE and INSERT operations', async () => {
      const tableName = `test_table_${randomUUID().replace(/-/g, '_')}`

      // WHEN - Table created and data inserted
      await sut.executeQuery(connectionName, `CREATE TEMPORARY TABLE ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100))`)

      const insertResult = await sut.executeQuery(connectionName, `INSERT INTO ${tableName} (name) VALUES (?)`, ['Test Record'])

      // THEN - Should succeed
      expect(insertResult.success).toBe(true)
      expect(insertResult.rowCount).toBe(1)
      expect(insertResult.insertId).toBeDefined()
    })

    // Unhappy path tests second
    it('should throw error when executing invalid SQL', async () => {
      // WHEN/THEN - Invalid SQL should fail
      await expect(sut.executeQuery(connectionName, 'INVALID SQL')).rejects.toThrow()
    })
  })

  describe('testConnection', () => {
    // Happy path tests first
    it('should return success for healthy connection', async () => {
      // GIVEN - Active connection
      const connectionName = `mysql-health-${randomUUID()}`
      testConnectionNames.push(connectionName)
      await sut.connect({ ...mysqlConfig, name: connectionName })

      // WHEN - Connection is tested
      const result = await sut.testConnection(connectionName)

      // THEN - Should report healthy
      expect(result.success).toBe(true)
      expect(result.connection).toBe(connectionName)
    })

    // Unhappy path tests second
    it('should throw error for non-existent connection', async () => {
      // WHEN/THEN - Test should fail
      await expect(sut.testConnection('non-existent')).rejects.toThrow()
    })
  })

  describe('getSchema', () => {
    let connectionName

    beforeEach(async () => {
      // Setup active MySQL connection
      connectionName = `mysql-schema-${randomUUID()}`
      testConnectionNames.push(connectionName)
      await sut.connect({ ...mysqlConfig, name: connectionName })
    })

    // Happy path tests first
    it('should retrieve database schema', async () => {
      // Create test table (not temporary - they don't show in schema for MySQL)
      const tableName = `schema_test_${randomUUID().replace(/-/g, '_')}`
      await sut.executeQuery(connectionName, `CREATE TABLE ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100))`)

      try {
        // WHEN - Schema is retrieved
        const schema = await sut.getSchema(connectionName)

        // THEN - Should return schema info
        expect(schema.success).toBe(true)
        expect(Array.isArray(schema.tables)).toBe(true)

        const testTable = schema.tables.find(table => table.name === tableName)
        expect(testTable).toBeDefined()
        expect(testTable.columns.length).toBe(2)
      } finally {
        // Clean up the test table
        try {
          await sut.executeQuery(connectionName, `DROP TABLE IF EXISTS ${tableName}`)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    })

    // Unhappy path tests second
    it('should throw error for non-existent connection', async () => {
      // WHEN/THEN - Schema retrieval should fail
      await expect(sut.getSchema('non-existent')).rejects.toThrow()
    })
  })

  describe('exportConnections', () => {
    // Happy path tests first
    it('should export active connections', async () => {
      // GIVEN - Active connection
      const connectionName = `mysql-export-${randomUUID()}`
      testConnectionNames.push(connectionName)
      await sut.connect({ ...mysqlConfig, name: connectionName })

      // WHEN - Connections are exported
      const exported = sut.exportConnections()

      // THEN - Should export connection without password
      expect(exported[connectionName]).toBeDefined()
      expect(exported[connectionName].type).toBe('mysql')
      expect(exported[connectionName]).not.toHaveProperty('password')
    })
  })

  describe('importConnections', () => {
    // Happy path tests first
    it('should validate connection configurations', async () => {
      // GIVEN - Valid connection config
      const connections = {
        'test-mysql': {
          type: 'mysql',
          host: 'localhost',
          database: 'testdb',
          user: 'testuser'
        }
      }

      // WHEN - Connections are imported
      const results = await sut.importConnections(connections)

      // THEN - Should validate successfully
      expect(results.length).toBe(1)
      expect(results[0].success).toBe(true)
      expect(results[0].status).toBe('validated')
    })

    // Unhappy path tests second
    it('should reject invalid configurations', async () => {
      // GIVEN - Invalid config
      const connections = {
        'invalid': { host: 'localhost' } // missing required fields
      }

      // WHEN - Invalid connections are imported
      const results = await sut.importConnections(connections)

      // THEN - Should reject
      expect(results[0].success).toBe(false)
      expect(results[0].status).toBe('failed')
    })
  })

  describe('disconnect', () => {
    // Happy path tests first
    it('should disconnect active connection', async () => {
      // GIVEN - Active connection
      const connectionName = `mysql-disconnect-${randomUUID()}`
      testConnectionNames.push(connectionName)
      await sut.connect({ ...mysqlConfig, name: connectionName })

      // WHEN - Connection is disconnected
      const result = await sut.disconnect(connectionName)

      // THEN - Should succeed and remove connection
      expect(result.success).toBe(true)
      expect(sut.hasConnection(connectionName)).toBe(false)
    })

    // Unhappy path tests second
    it('should throw error for non-existent connection', async () => {
      // WHEN/THEN - Disconnect should fail
      await expect(sut.disconnect('non-existent')).rejects.toThrow()
    })
  })

  describe('disconnectAll', () => {
    // Happy path tests first
    it('should disconnect all connections', async () => {
      // GIVEN - Multiple active connections
      const connectionName1 = `mysql-all1-${randomUUID()}`
      const connectionName2 = `mysql-all2-${randomUUID()}`
      testConnectionNames.push(connectionName1, connectionName2)

      await sut.connect({ ...mysqlConfig, name: connectionName1 })
      await sut.connect({ ...mysqlConfig, name: connectionName2 })

      // WHEN - All connections are disconnected
      const result = await sut.disconnectAll()

      // THEN - Should disconnect all
      expect(result.success).toBe(true)
      expect(result.disconnected).toBe(2)
      expect(sut.getConnectionCount()).toBe(0)
    })
  })

  describe('hasConnection and getConnectionCount', () => {
    // Happy path tests first
    it('should track connection state correctly', async () => {
      // GIVEN - No connections initially
      expect(sut.getConnectionCount()).toBe(0)
      expect(sut.hasConnection('test')).toBe(false)

      // WHEN - Connection is added
      const connectionName = `mysql-state-${randomUUID()}`
      testConnectionNames.push(connectionName)
      await sut.connect({ ...mysqlConfig, name: connectionName })

      // THEN - Should track connection
      expect(sut.getConnectionCount()).toBe(1)
      expect(sut.hasConnection(connectionName)).toBe(true)
    })
  })
})