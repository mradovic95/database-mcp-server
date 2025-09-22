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
      max: this.config.maxConnections || 5,
      idleTimeoutMillis: this.config.idleTimeout || 60000,
      connectionTimeoutMillis: this.config.connectionTimeout || 5000,
      acquireTimeoutMillis: this.config.acquireTimeout || 5000,
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

  async getSchema() {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      const tablesResult = await this.pool.query(`
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_schema = 'public' OR table_schema LIKE 'pg_temp_%'
        ORDER BY table_name
      `)

      const tables = []

      for (const table of tablesResult.rows) {
        const columnsResult = await this.pool.query(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = $2
          ORDER BY ordinal_position
        `, [table.table_name, table.table_schema])

        tables.push({
          name: table.table_name,
          columns: columnsResult.rows.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default
          }))
        })
      }

      return { tables }
    } catch (error) {
      throw new Error(`PostgreSQL schema error: ${error.message}`)
    }
  }
}