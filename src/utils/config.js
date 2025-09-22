import { readFileSync, existsSync } from 'fs'
import { logger } from './logger.js'

export class ConfigManager {
  constructor() {
    this.config = {}
    this.loadConfig()
  }

  loadConfig() {
    const configPaths = [
      './database-config.json',
      './config.json',
      process.env.DATABASE_CONFIG_PATH
    ].filter(Boolean)

    for (const path of configPaths) {
      if (existsSync(path)) {
        try {
          const fileContent = readFileSync(path, 'utf8')
          this.config = JSON.parse(fileContent)
          logger.info(`Configuration loaded from ${path}`)
          break
        } catch (error) {
          logger.warn(`Failed to load config from ${path}:`, error.message)
        }
      }
    }

    this.loadEnvironmentVariables()
  }

  loadEnvironmentVariables() {
    // Load default/single database environment variables
    const envConfig = {}

    if (process.env.DB_HOST) {
      envConfig.host = process.env.DB_HOST
    }
    if (process.env.DB_PORT) {
      envConfig.port = parseInt(process.env.DB_PORT, 10)
    }
    if (process.env.DB_NAME) {
      envConfig.database = process.env.DB_NAME
    }
    if (process.env.DB_USER) {
      envConfig.user = process.env.DB_USER
    }
    if (process.env.DB_PASSWORD) {
      envConfig.password = process.env.DB_PASSWORD
    }
    if (process.env.DB_TYPE) {
      envConfig.type = process.env.DB_TYPE
    }

    if (Object.keys(envConfig).length > 0) {
      this.config.default = { ...this.config.default, ...envConfig }
      logger.info('Default environment variables loaded into configuration')
    }

    // Load multiple database environment variables using {CONNECTION_NAME}_DB_{PARAMETER} pattern
    this.loadMultipleEnvironmentDatabases()
  }

  loadMultipleEnvironmentDatabases() {
    const envVars = process.env
    const dbConnections = {}

    // Find all environment variables matching the pattern {CONNECTION_NAME}_DB_{PARAMETER}
    const dbEnvPattern = /^([A-Z][A-Z0-9_]*)_DB_([A-Z_]+)$/

    for (const [envVar, value] of Object.entries(envVars)) {
      const match = envVar.match(dbEnvPattern)
      if (match) {
        const [, connectionName, parameter] = match
        const normalizedConnectionName = connectionName.toLowerCase()

        if (!dbConnections[normalizedConnectionName]) {
          dbConnections[normalizedConnectionName] = {}
        }

        // Map environment variable parameters to config parameters
        switch (parameter) {
          case 'TYPE':
            dbConnections[normalizedConnectionName].type = value
            break
          case 'HOST':
            dbConnections[normalizedConnectionName].host = value
            break
          case 'PORT':
            dbConnections[normalizedConnectionName].port = parseInt(value, 10)
            break
          case 'NAME':
            dbConnections[normalizedConnectionName].database = value
            break
          case 'USER':
            dbConnections[normalizedConnectionName].user = value
            break
          case 'PASSWORD':
            dbConnections[normalizedConnectionName].password = value
            break
          case 'SSL':
            dbConnections[normalizedConnectionName].ssl = value.toLowerCase() === 'true'
            break
          case 'MAX_CONNECTIONS':
            dbConnections[normalizedConnectionName].maxConnections = parseInt(value, 10)
            break
          case 'IDLE_TIMEOUT':
            dbConnections[normalizedConnectionName].idleTimeout = parseInt(value, 10)
            break
          case 'CONNECTION_TIMEOUT':
            dbConnections[normalizedConnectionName].connectionTimeout = parseInt(value, 10)
            break
          case 'ACQUIRE_TIMEOUT':
            dbConnections[normalizedConnectionName].acquireTimeout = parseInt(value, 10)
            break
          default:
            logger.warn(`Unknown database environment variable parameter: ${parameter} for connection ${connectionName}`)
        }
      }
    }

    // Add discovered connections to config
    const connectionCount = Object.keys(dbConnections).length
    if (connectionCount > 0) {
      for (const [connectionName, config] of Object.entries(dbConnections)) {
        // Don't overwrite existing file-based configurations
        if (!this.config[connectionName]) {
          this.config[connectionName] = config
        } else {
          // Merge with existing config, with env vars taking precedence
          this.config[connectionName] = { ...this.config[connectionName], ...config }
        }
      }
      logger.info(`Multiple database environment variables loaded: ${connectionCount} connections (${Object.keys(dbConnections).join(', ')})`)
    }
  }

  getConnectionConfig(name = 'default') {
    return this.config[name] || null
  }

  getAllConnections() {
    return Object.keys(this.config)
  }

  setConnectionConfig(name, config) {
    this.config[name] = config
  }

  hasConnection(name) {
    return name in this.config
  }

  validateConnectionConfig(config) {
    const required = ['type', 'host', 'database', 'user', 'password']
    const missing = required.filter(field => !config[field])

    if (missing.length > 0) {
      throw new Error(`Missing required configuration fields: ${missing.join(', ')}`)
    }

    return true
  }
}

export const configManager = new ConfigManager()
