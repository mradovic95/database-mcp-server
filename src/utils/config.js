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
      logger.info('Environment variables loaded into configuration')
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
