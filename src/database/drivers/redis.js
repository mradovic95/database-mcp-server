import Redis from 'ioredis'
import { BaseDriver } from './base.js'

export class RedisDriver extends BaseDriver {
  constructor(config) {
    super(config)
    this.type = 'redis'
    this.defaultPort = 6379
    this.client = null
  }

  async connect() {
    this.validateConfig()

    const redisConfig = {
      host: this.config.host,
      port: this.config.port || this.defaultPort,
      password: this.config.password,
      db: this.config.database || 0,
      connectionName: this.config.name || 'mcp-database-server',
      connectTimeout: this.config.connectionTimeout || 5000,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null // Stop retrying
        }
        return Math.min(times * 100, 3000) // Exponential backoff
      }
    }

    // Add TLS configuration if enabled
    if (this.config.tls) {
      redisConfig.tls = {
        rejectUnauthorized: this.config.rejectUnauthorized !== false
      }
    }

    // Create Redis client
    this.client = new Redis(redisConfig)

    // Test connection by sending PING
    try {
      await this.client.ping()
    } catch (error) {
      await this.client.quit()
      this.client = null
      throw new Error(`Failed to connect to Redis: ${error.message}`)
    }

    return this
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit()
      } catch (error) {
        // Force close if graceful quit fails
        this.client.disconnect()
      }
      this.client = null
    }
  }

  async query(command, params = []) {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      let cmd, args

      // Support multiple input formats:
      // 1. Array format: ['GET', 'key']
      // 2. String + array: 'GET', ['key']
      // 3. String only: 'PING'
      if (Array.isArray(command)) {
        [cmd, ...args] = command
      } else {
        cmd = command
        args = params
      }

      if (!cmd || typeof cmd !== 'string') {
        throw new Error('Command must be a string or array starting with command name')
      }

      // Execute Redis command
      const startTime = Date.now()
      const result = await this.client.call(cmd.toUpperCase(), ...args)
      const executionTime = Date.now() - startTime

      // Format results similar to SQL drivers
      return this.formatResults({
        result,
        command: cmd.toUpperCase(),
        args,
        executionTime
      })
    } catch (error) {
      throw new Error(`Redis command error: ${error.message}`)
    }
  }

  formatResults(data) {
    // Override base formatResults for Redis-specific formatting
    return {
      success: true,
      result: data.result,
      command: data.command,
      args: data.args,
      executionTime: data.executionTime,
      // For consistency with SQL drivers, also provide rows format when result is array
      ...(Array.isArray(data.result) ? {
        rows: data.result,
        rowCount: data.result.length
      } : {})
    }
  }

  async testConnection() {
    try {
      if (!this.client) {
        return { success: false, message: 'Client not initialized' }
      }

      const pong = await this.client.ping()
      if (pong === 'PONG') {
        return { success: true, message: 'Connection successful' }
      }
      return { success: false, message: 'Unexpected PING response' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  async getSchema() {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      // Get database size
      const dbSize = await this.client.dbsize()

      // Get Redis server info
      const infoString = await this.client.info()
      const info = this.parseRedisInfo(infoString)

      // Sample keys by scanning (limit to prevent blocking)
      const keyPatterns = await this.sampleKeyPatterns()

      // Get key type distribution
      const typeDistribution = await this.getKeyTypeDistribution()

      return {
        database: this.config.database || 0,
        keyCount: dbSize,
        serverInfo: {
          version: info.redis_version,
          mode: info.redis_mode,
          os: info.os,
          uptime: parseInt(info.uptime_in_seconds),
          connectedClients: parseInt(info.connected_clients),
          usedMemory: info.used_memory_human,
          usedMemoryPeak: info.used_memory_peak_human
        },
        keyPatterns,
        typeDistribution
      }
    } catch (error) {
      throw new Error(`Redis schema error: ${error.message}`)
    }
  }

  parseRedisInfo(infoString) {
    const info = {}
    const lines = infoString.split('\r\n')

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':')
        if (key && value) {
          info[key] = value
        }
      }
    }

    return info
  }

  async sampleKeyPatterns(maxPatterns = 10, maxKeysPerPattern = 5) {
    const patterns = new Map()
    let cursor = '0'
    let iterations = 0
    const maxIterations = 100 // Prevent infinite loop

    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'COUNT',
        100
      )
      cursor = nextCursor

      for (const key of keys) {
        // Extract pattern (e.g., "user:123" -> "user:*")
        const pattern = this.extractPattern(key)

        if (!patterns.has(pattern)) {
          patterns.set(pattern, {
            pattern,
            count: 0,
            sampleKeys: []
          })
        }

        const patternData = patterns.get(pattern)
        patternData.count++

        if (patternData.sampleKeys.length < maxKeysPerPattern) {
          patternData.sampleKeys.push(key)
        }
      }

      iterations++
      if (patterns.size >= maxPatterns || iterations >= maxIterations) {
        break
      }
    } while (cursor !== '0')

    return Array.from(patterns.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxPatterns)
  }

  extractPattern(key) {
    // Extract pattern from key
    // Examples:
    // "user:123" -> "user:*"
    // "session:abc:def" -> "session:*"
    // "counter" -> "counter"

    const parts = key.split(':')
    if (parts.length === 1) {
      return key // No pattern, just the key itself
    }

    // Replace numeric or UUID-like parts with *
    const patternParts = parts.map((part, index) => {
      if (index === 0) return part // Keep first part as-is
      // If part looks like a number or UUID, replace with *
      if (/^\d+$/.test(part) || /^[0-9a-f-]{36}$/i.test(part) || /^[0-9a-f]{24}$/i.test(part)) {
        return '*'
      }
      return part
    })

    return patternParts.join(':')
  }

  async getKeyTypeDistribution() {
    const types = {
      string: 0,
      hash: 0,
      list: 0,
      set: 0,
      zset: 0,
      stream: 0,
      other: 0
    }

    let cursor = '0'
    let iterations = 0
    const maxIterations = 50 // Limit to prevent blocking
    const maxKeys = 1000

    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'COUNT',
        100
      )
      cursor = nextCursor

      for (const key of keys) {
        const type = await this.client.type(key)
        if (types[type] !== undefined) {
          types[type]++
        } else {
          types.other++
        }

        if (Object.values(types).reduce((a, b) => a + b, 0) >= maxKeys) {
          break
        }
      }

      iterations++
      if (iterations >= maxIterations) {
        break
      }
    } while (cursor !== '0')

    return types
  }

  validateConfig() {
    // Redis requires host
    const required = ['host']
    const missing = required.filter(field => !this.config[field])

    if (missing.length > 0) {
      throw new Error(`Missing required Redis configuration fields: ${missing.join(', ')}`)
    }

    // Validate database number (0-15)
    if (this.config.database !== undefined) {
      const db = parseInt(this.config.database, 10)
      if (isNaN(db) || db < 0 || db > 15) {
        throw new Error('Redis database must be a number between 0 and 15')
      }
    }
  }

  getConnectionString() {
    const { host, port = this.defaultPort, database = 0 } = this.config
    const hasPassword = !!this.config.password
    const protocol = this.config.tls ? 'rediss' : 'redis'

    if (hasPassword) {
      return `${protocol}://***@${host}:${port}/${database}`
    }
    return `${protocol}://${host}:${port}/${database}`
  }

  // Helper method to execute multiple commands in a pipeline (optional enhancement)
  async pipeline(commands) {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.')
    }

    try {
      const pipeline = this.client.pipeline()

      for (const [cmd, ...args] of commands) {
        pipeline.call(cmd.toUpperCase(), ...args)
      }

      const results = await pipeline.exec()

      return {
        success: true,
        results: results.map(([err, result], index) => ({
          success: !err,
          result: result,
          error: err ? err.message : null,
          command: commands[index][0]
        }))
      }
    } catch (error) {
      throw new Error(`Redis pipeline error: ${error.message}`)
    }
  }
}
