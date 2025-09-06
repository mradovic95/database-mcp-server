export class BaseDriver {
  constructor(config) {
    this.config = config
    this.pool = null
    this.type = null
  }

  async connect() {
    throw new Error('connect method must be implemented by subclass')
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }

  async query(sql, params = []) {
    throw new Error('query method must be implemented by subclass')
  }

  async testConnection() {
    try {
      await this.query('SELECT 1')
      return { success: true, message: 'Connection successful' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }


  formatResults(result) {
    if (!result || !result.rows) {
      return { rows: [], rowCount: 0 }
    }
    return {
      rows: result.rows,
      rowCount: result.rowCount || result.rows.length
    }
  }

  validateConfig() {
    const required = ['host', 'database', 'user', 'password']
    const missing = required.filter(field => !this.config[field])
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration fields: ${missing.join(', ')}`)
    }
  }

  getConnectionString() {
    throw new Error('getConnectionString method must be implemented by subclass')
  }
}