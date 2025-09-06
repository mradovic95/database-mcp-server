import mysql from 'mysql2/promise'
import { BaseDriver } from './base.js'

export class MySQLDriver extends BaseDriver {
  constructor(config) {
    super(config)
    this.type = 'mysql'
    this.defaultPort = 3306
  }

  async connect() {
    this.validateConfig()
    
    const poolConfig = {
      host: this.config.host,
      port: this.config.port || this.defaultPort,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      connectionLimit: this.config.maxConnections || 10,
      acquireTimeout: this.config.connectionTimeout || 5000,
      timeout: this.config.queryTimeout || 60000,
      ssl: this.config.ssl || false,
      charset: 'utf8mb4'
    }

    this.pool = mysql.createPool(poolConfig)
    
    const connection = await this.pool.getConnection()
    connection.release()
    
    return this
  }

  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      const [rows, fields] = await this.pool.execute(sql, params)
      return this.formatResults({ rows, fields })
    } catch (error) {
      throw new Error(`MySQL query error: ${error.message}`)
    }
  }


  getConnectionString() {
    const { host, port = this.defaultPort, database, user, password } = this.config
    return `mysql://${user}:${password}@${host}:${port}/${database}`
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }

  formatResults(result) {
    if (!result || !result.rows) {
      return { rows: [], rowCount: 0 }
    }
    
    return {
      rows: Array.isArray(result.rows) ? result.rows : [result.rows],
      rowCount: Array.isArray(result.rows) ? result.rows.length : 1,
      fields: result.fields
    }
  }
}