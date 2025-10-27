import { DynamoDBClient, ListTablesCommand, DescribeTableCommand, ExecuteStatementCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { BaseDriver } from './base.js'

export class DynamoDBDriver extends BaseDriver {
  constructor(config) {
    super(config)
    this.type = 'dynamodb'
    this.client = null
  }

  async connect() {
    this.validateConfig()

    const clientConfig = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      }
    }

    // Support for local DynamoDB endpoint (DynamoDB Local or LocalStack)
    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint
    }

    // Support for custom connection timeout
    if (this.config.connectionTimeout) {
      clientConfig.requestHandler = {
        requestTimeout: this.config.connectionTimeout
      }
    }

    this.client = new DynamoDBClient(clientConfig)

    // Test connection by listing tables
    try {
      await this.client.send(new ListTablesCommand({ Limit: 1 }))
    } catch (error) {
      this.client = null
      throw new Error(`Failed to connect to DynamoDB: ${error.message}`)
    }

    return this
  }

  async query(sql, params = []) {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      // Support PartiQL queries for SQL-like interface
      // Convert array params to named parameters if needed
      let statement = sql
      let parameters = []

      if (params && params.length > 0) {
        // Convert positional parameters to DynamoDB attribute values
        parameters = params.map(param => {
          if (typeof param === 'object' && param !== null) {
            return marshall(param)
          }
          // For simple types, wrap in appropriate DynamoDB type
          if (typeof param === 'string') return { S: param }
          if (typeof param === 'number') return { N: String(param) }
          if (typeof param === 'boolean') return { BOOL: param }
          return { S: String(param) }
        })
      }

      const command = new ExecuteStatementCommand({
        Statement: statement,
        Parameters: parameters.length > 0 ? parameters : undefined
      })

      const response = await this.client.send(command)

      // Convert DynamoDB items to plain JavaScript objects
      const rows = response.Items ? response.Items.map(item => unmarshall(item)) : []

      return this.formatResults({
        rows,
        rowCount: rows.length
      })
    } catch (error) {
      throw new Error(`DynamoDB query error: ${error.message}`)
    }
  }

  async disconnect() {
    if (this.client) {
      // DynamoDB client doesn't require explicit disconnect
      // but we'll destroy the client reference
      this.client.destroy()
      this.client = null
    }
  }

  async testConnection() {
    try {
      if (!this.client) {
        return { success: false, message: 'Client not initialized' }
      }

      // Test by listing tables
      await this.client.send(new ListTablesCommand({ Limit: 1 }))
      return { success: true, message: 'Connection successful' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  async getSchema() {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      // List all tables
      const listTablesResponse = await this.client.send(new ListTablesCommand({}))
      const tableNames = listTablesResponse.TableNames || []

      const tables = []

      // Get detailed information for each table
      for (const tableName of tableNames) {
        const describeResponse = await this.client.send(
          new DescribeTableCommand({ TableName: tableName })
        )

        const table = describeResponse.Table

        // Extract key schema
        const keySchema = table.KeySchema.map(key => ({
          name: key.AttributeName,
          keyType: key.KeyType // HASH or RANGE
        }))

        // Extract attribute definitions
        const attributes = table.AttributeDefinitions.map(attr => ({
          name: attr.AttributeName,
          type: attr.AttributeType // S (String), N (Number), B (Binary)
        }))

        // Extract Global Secondary Indexes
        const globalSecondaryIndexes = (table.GlobalSecondaryIndexes || []).map(gsi => ({
          name: gsi.IndexName,
          keySchema: gsi.KeySchema.map(key => ({
            name: key.AttributeName,
            keyType: key.KeyType
          })),
          projection: gsi.Projection.ProjectionType,
          status: gsi.IndexStatus
        }))

        // Extract Local Secondary Indexes
        const localSecondaryIndexes = (table.LocalSecondaryIndexes || []).map(lsi => ({
          name: lsi.IndexName,
          keySchema: lsi.KeySchema.map(key => ({
            name: key.AttributeName,
            keyType: key.KeyType
          })),
          projection: lsi.Projection.ProjectionType
        }))

        tables.push({
          name: tableName,
          status: table.TableStatus,
          itemCount: table.ItemCount,
          sizeBytes: table.TableSizeBytes,
          keySchema,
          attributes,
          globalSecondaryIndexes,
          localSecondaryIndexes,
          createdAt: table.CreationDateTime
        })
      }

      return { tables }
    } catch (error) {
      throw new Error(`DynamoDB schema error: ${error.message}`)
    }
  }

  validateConfig() {
    // DynamoDB requires different fields than SQL databases
    const required = ['region', 'accessKeyId', 'secretAccessKey']
    const missing = required.filter(field => !this.config[field])

    if (missing.length > 0) {
      throw new Error(`Missing required DynamoDB configuration fields: ${missing.join(', ')}`)
    }

    // Validate region format (basic check)
    const regionPattern = /^[a-z]{2}-[a-z]+-\d{1}$/
    if (!regionPattern.test(this.config.region) && !this.config.endpoint) {
      // Allow invalid region format if custom endpoint is provided (for local development)
      throw new Error(`Invalid AWS region format: ${this.config.region}`)
    }
  }

  getConnectionString() {
    const { region, endpoint } = this.config
    if (endpoint) {
      return `dynamodb://${region}@${endpoint}`
    }
    return `dynamodb://${region}`
  }

  // Helper method to execute native DynamoDB operations
  // This can be used for operations not supported by PartiQL
  async executeNativeOperation(operation, params) {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      const response = await this.client.send(operation)
      return response
    } catch (error) {
      throw new Error(`DynamoDB native operation error: ${error.message}`)
    }
  }

  // Helper to marshall JavaScript objects to DynamoDB format
  marshallItem(item) {
    return marshall(item, {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true
    })
  }

  // Helper to unmarshall DynamoDB items to JavaScript objects
  unmarshallItem(item) {
    return unmarshall(item)
  }
}
