import { PostgreSQLDriver } from './postgresql.js'
import { MySQLDriver } from './mysql.js'

export const SUPPORTED_DRIVERS = {
  postgresql: PostgreSQLDriver,
  postgres: PostgreSQLDriver,
  pg: PostgreSQLDriver,
  mysql: MySQLDriver,
  mysql2: MySQLDriver
}

export function createDriver(type, config) {
  const driverType = type.toLowerCase()
  const DriverClass = SUPPORTED_DRIVERS[driverType]
  
  if (!DriverClass) {
    const supportedTypes = Object.keys(SUPPORTED_DRIVERS).join(', ')
    throw new Error(`Unsupported database type: ${type}. Supported types: ${supportedTypes}`)
  }
  
  return new DriverClass(config)
}

export function getSupportedTypes() {
  return Object.keys(SUPPORTED_DRIVERS)
}

export { PostgreSQLDriver, MySQLDriver }