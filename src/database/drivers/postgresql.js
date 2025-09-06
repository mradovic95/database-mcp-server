import pkg from 'pg'
const { Pool } = pkg
import { BaseDriver } from './base.js'

export class PostgreSQLDriver extends BaseDriver {
  constructor(config) {
    super(config)
    this.type = 'postgresql'
    this.defaultPort = 5432
  }

  async connect() {
    this.validateConfig()
    
    const poolConfig = {
      host: this.config.host,
      port: this.config.port || this.defaultPort,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      max: this.config.maxConnections || 10,
      idleTimeoutMillis: this.config.idleTimeout || 30000,
      connectionTimeoutMillis: this.config.connectionTimeout || 5000,
      ssl: this.config.ssl || false
    }

    this.pool = new Pool(poolConfig)
    
    const client = await this.pool.connect()
    client.release()
    
    return this
  }

  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      const result = await this.pool.query(sql, params)
      return this.formatResults(result)
    } catch (error) {
      throw new Error(`PostgreSQL query error: ${error.message}`)
    }
  }


  getConnectionString() {
    const { host, port = this.defaultPort, database, user, password } = this.config
    return `postgresql://${user}:${password}@${host}:${port}/${database}`
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }
}