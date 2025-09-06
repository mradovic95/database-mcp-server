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
      return { name, status: 'disconnected' }
    } catch (error) {
      throw new Error(`Failed to disconnect from '${name}': ${error.message}`)
    }
  }

  async disconnectAll() {
    const results = []
    for (const [name] of this.connections) {
      try {
        await this.disconnect(name)
        results.push({ name, status: 'disconnected' })
      } catch (error) {
        results.push({ name, status: 'error', message: error.message })
      }
    }
    return results
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
        name: connectionName,
        ...result
      }
    } catch (error) {
      return {
        name: connectionName,
        success: false,
        message: error.message
      }
    }
  }


  getConnectionInfo(connectionName) {
    const connection = this.getConnection(connectionName)
    return {
      name: connectionName,
      type: connection.config.type,
      host: connection.config.host,
      database: connection.config.database,
      user: connection.config.user,
      createdAt: connection.createdAt,
      lastUsed: connection.lastUsed
    }
  }

  hasConnection(name) {
    return this.connections.has(name)
  }

  getConnectionCount() {
    return this.connections.size
  }
}