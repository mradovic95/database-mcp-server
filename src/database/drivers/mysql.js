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
      return this.formatResults({ rows, fields, insertId: rows.insertId })
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

  async getSchema() {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      const [tablesResult] = await this.pool.execute(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `)

      const tables = []

      for (const table of tablesResult) {
        const [columnsResult] = await this.pool.execute(`
          SELECT
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [table.TABLE_NAME])

        tables.push({
          name: table.TABLE_NAME,
          columns: columnsResult.map(col => ({
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE,
            nullable: col.IS_NULLABLE === 'YES',
            default: col.COLUMN_DEFAULT
          }))
        })
      }

      return { tables }
    } catch (error) {
      throw new Error(`MySQL schema error: ${error.message}`)
    }
  }

  formatResults(result) {
    if (!result || !result.rows) {
      return { success: true, rows: [], rowCount: 0 }
    }

    return {
      success: true,
      rows: Array.isArray(result.rows) ? result.rows : [result.rows],
      rowCount: Array.isArray(result.rows) ? result.rows.length : 1,
      insertId: result.insertId,
      fields: result.fields
    }
  }
}