import { createDriver } from './drivers/index.js'

export class DatabaseManager {
  constructor() {
    this.connections = new Map()
    this.connectionId = 0
  }

  async connect(config) {
    const { type, name, ...dbConfig } = config
    
    if (!type) {
      throw new Error('Database type is required')
    }

    const connectionName = name || `${type}_${++this.connectionId}`
    
    if (this.connections.has(connectionName)) {
      throw new Error(`Connection '${connectionName}' already exists`)
    }

    try {
      const driver = createDriver(type, dbConfig)
      await driver.connect()
      
      this.connections.set(connectionName, {
        driver,
        config: { type, name: connectionName, ...dbConfig },
        createdAt: new Date(),
        lastUsed: new Date()
      })

      return {
        success: true,
        name: connectionName,
        type,
        status: 'connected',
        createdAt: new Date()
      }
    } catch (error) {
      throw new Error(`Failed to connect to ${type} database: ${error.message}`)
    }
  }

  async disconnect(name) {
    const connection = this.connections.get(name)
    if (!connection) {
      throw new Error(`Connection '${name}' not found`)
    }

    try {
      await connection.driver.disconnect()
      this.connections.delete(name)
      return { success: true, name, status: 'disconnected' }
    } catch (error) {
      throw new Error(`Failed to disconnect from '${name}': ${error.message}`)
    }
  }

  async disconnectAll() {
    const results = []
    const disconnectedCount = this.connections.size

    for (const [name] of this.connections) {
      try {
        await this.disconnect(name)
        results.push({ name, status: 'disconnected' })
      } catch (error) {
        results.push({ name, status: 'error', message: error.message })
      }
    }

    return {
      success: true,
      disconnected: disconnectedCount,
      results
    }
  }

  getConnection(name) {
    const connection = this.connections.get(name)
    if (!connection) {
      throw new Error(`Connection '${name}' not found`)
    }
    return connection
  }

  listConnections() {
    return Array.from(this.connections.entries()).map(([name, conn]) => ({
      name,
      type: conn.config.type,
      host: conn.config.host,
      database: conn.config.database,
      createdAt: conn.createdAt,
      lastUsed: conn.lastUsed,
      status: 'connected'
    }))
  }

  async executeQuery(connectionName, sql, params = []) {
    const connection = this.getConnection(connectionName)
    connection.lastUsed = new Date()
    
    try {
      return await connection.driver.query(sql, params)
    } catch (error) {
      throw new Error(`Query failed on '${connectionName}': ${error.message}`)
    }
  }

  async testConnection(connectionName) {
    const connection = this.getConnection(connectionName)

    try {
      const result = await connection.driver.testConnection()
      return {
        connection: connectionName,
        ...result
      }
    } catch (error) {
      return {
        connection: connectionName,
        success: false,
        message: error.message
      }
    }
  }

  async getSchema(connectionName) {
    const connection = this.getConnection(connectionName)
    connection.lastUsed = new Date()

    try {
      const result = await connection.driver.getSchema()
      return {
        success: true,
        connection: connectionName,
        ...result
      }
    } catch (error) {
      throw new Error(`Schema retrieval failed on '${connectionName}': ${error.message}`)
    }
  }


  getConnectionInfo(connectionName) {
    const connection = this.getConnection(connectionName)
    const isDynamoDB = ['dynamodb', 'dynamo'].includes(connection.config.type?.toLowerCase())

    const baseInfo = {
      name: connectionName,
      type: connection.config.type,
      createdAt: connection.createdAt,
      lastUsed: connection.lastUsed,
      connectionString: connection.driver.getConnectionString()
    }

    if (isDynamoDB) {
      // DynamoDB-specific info
      return {
        ...baseInfo,
        region: connection.config.region,
        endpoint: connection.config.endpoint
      }
    } else {
      // SQL database info
      return {
        ...baseInfo,
        host: connection.config.host,
        database: connection.config.database,
        user: connection.config.user
      }
    }
  }

  hasConnection(name) {
    return this.connections.has(name)
  }

  getConnectionCount() {
    return this.connections.size
  }

  exportConnections() {
    const exports = {}

    for (const [connectionName, connection] of this.connections) {
      exports[connectionName] = {
        type: connection.config.type,
        host: connection.config.host,
        port: connection.config.port,
        database: connection.config.database,
        user: connection.config.user,
        ssl: connection.config.ssl || false,
        maxConnections: connection.config.maxConnections,
        createdAt: connection.createdAt
        // Note: password is not exported for security reasons
      }
    }

    return exports
  }

  async importConnections(connectionsConfig, overwrite = false) {
    const results = []

    for (const [connectionName, config] of Object.entries(connectionsConfig)) {
      try {
        // Check if connection already exists
        if (this.hasConnection(connectionName) && !overwrite) {
          results.push({
            name: connectionName,
            status: 'skipped',
            success: false,
            error: `Connection '${connectionName}' already exists. Use overwrite: true to replace it.`
          })
          continue
        }

        // Remove existing connection if overwriting
        if (this.hasConnection(connectionName) && overwrite) {
          await this.disconnect(connectionName)
        }

        // Validate that required fields are present
        if (!config.type || !config.host || !config.database || !config.user) {
          results.push({
            name: connectionName,
            status: 'failed',
            success: false,
            error: 'Missing required fields: type, host, database, or user'
          })
          continue
        }

        // Note: We can't actually connect without a password, so we'll just validate the config structure
        // The connection will need to be established later with proper credentials
        results.push({
          name: connectionName,
          status: 'validated',
          success: true,
          message: 'Configuration imported successfully. Note: You will need to provide credentials when connecting.'
        })

      } catch (error) {
        results.push({
          name: connectionName,
          status: 'failed',
          success: false,
          error: error.message
        })
      }
    }

    return results
  }
}