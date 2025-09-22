import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ConfigManager } from '../../src/utils/config.js'

describe('ConfigManager Unit Tests', () => {
  // Setup variables
  let sut, originalEnv

  beforeEach(() => {
    // Component initialization
    originalEnv = { ...process.env }

    // Clear relevant environment variables
    delete process.env.DB_HOST
    delete process.env.DB_PORT
    delete process.env.DB_NAME
    delete process.env.DB_USER
    delete process.env.DB_PASSWORD
    delete process.env.DB_TYPE

    // Clear any existing multi-db environment variables
    Object.keys(process.env).forEach(key => {
      if (key.match(/^[A-Z][A-Z0-9_]*_DB_[A-Z_]+$/)) {
        delete process.env[key]
      }
    })

    sut = new ConfigManager()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('getConnectionConfig()', () => {
    it('should return null when connection does not exist', () => {
      // GIVEN - ConfigManager with no connections
      // (Already set up in beforeEach)

      // WHEN - Getting non-existent connection config
      const result = sut.getConnectionConfig('nonexistent')

      // THEN - Should return null
      expect(result).toBe(null)
    })

    it('should return default connection config when no name specified', () => {
      // GIVEN - Default database environment variables
      process.env.DB_TYPE = 'postgresql'
      process.env.DB_HOST = 'localhost'
      process.env.DB_NAME = 'test_db'
      process.env.DB_USER = 'test_user'
      process.env.DB_PASSWORD = 'test_password'
      process.env.DB_PORT = '5432'
      sut = new ConfigManager()

      // WHEN - Getting connection config without name
      const result = sut.getConnectionConfig()

      // THEN - Should return default connection config
      expect(result).toEqual({
        type: 'postgresql',
        host: 'localhost',
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
        port: 5432
      })
    })

    it('should return specific connection config when name provided', () => {
      // GIVEN - Named database environment variables
      process.env.PROD_DB_TYPE = 'mysql'
      process.env.PROD_DB_HOST = 'prod-db.com'
      process.env.PROD_DB_NAME = 'production'
      process.env.PROD_DB_USER = 'prod_user'
      process.env.PROD_DB_PASSWORD = 'prod_pass'
      process.env.PROD_DB_PORT = '3306'
      sut = new ConfigManager()

      // WHEN - Getting specific connection config
      const result = sut.getConnectionConfig('prod')

      // THEN - Should return correct connection config
      expect(result).toEqual({
        type: 'mysql',
        host: 'prod-db.com',
        database: 'production',
        user: 'prod_user',
        password: 'prod_pass',
        port: 3306
      })
    })
  })

  describe('getAllConnections()', () => {
    it('should return empty array when no connections configured', () => {
      // GIVEN - ConfigManager with no connections
      // (Already set up in beforeEach)

      // WHEN - Getting all connections
      const result = sut.getAllConnections()

      // THEN - Should return empty array
      expect(result).toEqual([])
    })

    it('should return array of connection names when connections exist', () => {
      // GIVEN - Multiple database connections
      process.env.PROD_DB_TYPE = 'postgresql'
      process.env.PROD_DB_HOST = 'prod.com'
      process.env.PROD_DB_NAME = 'prod_db'
      process.env.PROD_DB_USER = 'user'
      process.env.PROD_DB_PASSWORD = 'pass'

      process.env.DEV_DB_TYPE = 'mysql'
      process.env.DEV_DB_HOST = 'dev.com'
      process.env.DEV_DB_NAME = 'dev_db'
      process.env.DEV_DB_USER = 'user'
      process.env.DEV_DB_PASSWORD = 'pass'
      sut = new ConfigManager()

      // WHEN - Getting all connections
      const result = sut.getAllConnections()

      // THEN - Should return connection names
      expect(result).toContain('prod')
      expect(result).toContain('dev')
      expect(result).toHaveLength(2)
    })
  })

  describe('hasConnection()', () => {
    it('should return false when connection does not exist', () => {
      // GIVEN - ConfigManager with no connections
      // (Already set up in beforeEach)

      // WHEN - Checking for non-existent connection
      const result = sut.hasConnection('nonexistent')

      // THEN - Should return false
      expect(result).toBe(false)
    })

    it('should return true when connection exists', () => {
      // GIVEN - Database connection configured
      process.env.TEST_DB_TYPE = 'postgresql'
      process.env.TEST_DB_HOST = 'test.com'
      process.env.TEST_DB_NAME = 'test_db'
      process.env.TEST_DB_USER = 'user'
      process.env.TEST_DB_PASSWORD = 'pass'
      sut = new ConfigManager()

      // WHEN - Checking for existing connection
      const result = sut.hasConnection('test')

      // THEN - Should return true
      expect(result).toBe(true)
    })
  })

  describe('setConnectionConfig()', () => {
    it('should add new connection configuration', () => {
      // GIVEN - ConfigManager with no connections
      const newConfig = {
        type: 'postgresql',
        host: 'new-host.com',
        database: 'new_db',
        user: 'new_user',
        password: 'new_pass'
      }

      // WHEN - Setting new connection config
      sut.setConnectionConfig('new', newConfig)

      // THEN - Should have the new connection
      expect(sut.hasConnection('new')).toBe(true)
      expect(sut.getConnectionConfig('new')).toEqual(newConfig)
      expect(sut.getAllConnections()).toContain('new')
    })

    it('should overwrite existing connection configuration', () => {
      // GIVEN - Existing connection configuration
      process.env.EXISTING_DB_TYPE = 'mysql'
      process.env.EXISTING_DB_HOST = 'old-host.com'
      process.env.EXISTING_DB_NAME = 'old_db'
      process.env.EXISTING_DB_USER = 'old_user'
      process.env.EXISTING_DB_PASSWORD = 'old_pass'
      sut = new ConfigManager()

      const newConfig = {
        type: 'postgresql',
        host: 'new-host.com',
        database: 'new_db',
        user: 'new_user',
        password: 'new_pass'
      }

      // WHEN - Overwriting existing connection config
      sut.setConnectionConfig('existing', newConfig)

      // THEN - Should have the updated connection
      expect(sut.getConnectionConfig('existing')).toEqual(newConfig)
      expect(sut.getConnectionConfig('existing').type).toBe('postgresql')
      expect(sut.getConnectionConfig('existing').host).toBe('new-host.com')
    })
  })

  describe('validateConnectionConfig()', () => {
    it('should return true for valid configuration', () => {
      // GIVEN - Valid connection configuration
      const validConfig = {
        type: 'postgresql',
        host: 'localhost',
        database: 'test_db',
        user: 'test_user',
        password: 'test_password'
      }

      // WHEN - Validating configuration
      const result = sut.validateConnectionConfig(validConfig)

      // THEN - Should return true
      expect(result).toBe(true)
    })

    it('should throw error when required field is missing', () => {
      // GIVEN - Invalid configuration missing required field
      const invalidConfig = {
        type: 'postgresql',
        host: 'localhost',
        database: 'test_db',
        user: 'test_user'
        // Missing password
      }

      // WHEN/THEN - Validating configuration should throw error
      expect(() => sut.validateConnectionConfig(invalidConfig)).toThrow('Missing required configuration fields: password')
    })

    it('should throw error when multiple required fields are missing', () => {
      // GIVEN - Invalid configuration missing multiple required fields
      const invalidConfig = {
        type: 'postgresql'
        // Missing host, database, user, password
      }

      // WHEN/THEN - Validating configuration should throw error
      expect(() => sut.validateConnectionConfig(invalidConfig)).toThrow('Missing required configuration fields: host, database, user, password')
    })
  })

  describe('loadMultipleEnvironmentDatabases()', () => {
    it('should parse multiple database connections from environment variables', () => {
      // GIVEN - Multiple database environment variables
      process.env.PROD_DB_TYPE = 'postgresql'
      process.env.PROD_DB_HOST = 'prod-db.company.com'
      process.env.PROD_DB_PORT = '5432'
      process.env.PROD_DB_NAME = 'production_db'
      process.env.PROD_DB_USER = 'prod_user'
      process.env.PROD_DB_PASSWORD = 'prod_password'
      process.env.PROD_DB_SSL = 'true'

      process.env.DEV_DB_TYPE = 'mysql'
      process.env.DEV_DB_HOST = 'localhost'
      process.env.DEV_DB_PORT = '3306'
      process.env.DEV_DB_NAME = 'dev_db'
      process.env.DEV_DB_USER = 'dev_user'
      process.env.DEV_DB_PASSWORD = 'dev_password'
      process.env.DEV_DB_SSL = 'false'

      // WHEN - ConfigManager is instantiated
      sut = new ConfigManager()

      // THEN - Should have both database connections configured
      const allConnections = sut.getAllConnections()
      expect(allConnections).toContain('prod')
      expect(allConnections).toContain('dev')
      expect(allConnections).toHaveLength(2)

      // AND - Should parse production database configuration correctly
      const prodConfig = sut.getConnectionConfig('prod')
      expect(prodConfig).toEqual({
        type: 'postgresql',
        host: 'prod-db.company.com',
        port: 5432,
        database: 'production_db',
        user: 'prod_user',
        password: 'prod_password',
        ssl: true
      })

      // AND - Should parse development database configuration correctly
      const devConfig = sut.getConnectionConfig('dev')
      expect(devConfig).toEqual({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'dev_db',
        user: 'dev_user',
        password: 'dev_password',
        ssl: false
      })
    })

    it('should handle connection pool and timeout parameters correctly', () => {
      // GIVEN - Database environment variables with advanced parameters
      process.env.ANALYTICS_DB_TYPE = 'postgresql'
      process.env.ANALYTICS_DB_HOST = 'analytics.company.com'
      process.env.ANALYTICS_DB_PORT = '5432'
      process.env.ANALYTICS_DB_NAME = 'analytics_db'
      process.env.ANALYTICS_DB_USER = 'analytics_user'
      process.env.ANALYTICS_DB_PASSWORD = 'analytics_password'
      process.env.ANALYTICS_DB_MAX_CONNECTIONS = '10'
      process.env.ANALYTICS_DB_IDLE_TIMEOUT = '30000'
      process.env.ANALYTICS_DB_CONNECTION_TIMEOUT = '15000'
      process.env.ANALYTICS_DB_ACQUIRE_TIMEOUT = '20000'

      // WHEN - ConfigManager is instantiated
      sut = new ConfigManager()

      // THEN - Should parse all parameters correctly
      const analyticsConfig = sut.getConnectionConfig('analytics')
      expect(analyticsConfig).toEqual({
        type: 'postgresql',
        host: 'analytics.company.com',
        port: 5432,
        database: 'analytics_db',
        user: 'analytics_user',
        password: 'analytics_password',
        maxConnections: 10,
        idleTimeout: 30000,
        connectionTimeout: 15000,
        acquireTimeout: 20000
      })
    })

    it('should ignore invalid environment variable patterns', () => {
      // GIVEN - Invalid environment variable patterns
      process.env.INVALID_PROD_TYPE = 'postgresql'  // Missing _DB_
      process.env.PROD_TYPE = 'postgresql'          // Missing _DB_
      process.env.DB_PROD_TYPE = 'postgresql'       // Wrong prefix order
      process.env.prod_DB_TYPE = 'postgresql'       // Lowercase connection name

      // Valid pattern
      process.env.VALID_DB_TYPE = 'postgresql'
      process.env.VALID_DB_HOST = 'valid-host.com'
      process.env.VALID_DB_NAME = 'valid_db'
      process.env.VALID_DB_USER = 'valid_user'
      process.env.VALID_DB_PASSWORD = 'valid_password'

      // WHEN - ConfigManager is instantiated
      sut = new ConfigManager()

      // THEN - Should only have the valid connection
      const allConnections = sut.getAllConnections()
      expect(allConnections).toContain('valid')
      expect(allConnections).not.toContain('invalid')
      expect(allConnections).not.toContain('prod')
      expect(allConnections).toHaveLength(1)

      // AND - Should parse valid connection correctly
      const validConfig = sut.getConnectionConfig('valid')
      expect(validConfig.type).toBe('postgresql')
      expect(validConfig.host).toBe('valid-host.com')
    })

    it('should handle combination of single and multiple database environment variables', () => {
      // GIVEN - Both single database and multiple database environment variables
      process.env.DB_HOST = 'default-host.com'
      process.env.DB_TYPE = 'mysql'
      process.env.DB_NAME = 'default_db'
      process.env.DB_USER = 'default_user'
      process.env.DB_PASSWORD = 'default_password'

      process.env.SPECIAL_DB_TYPE = 'postgresql'
      process.env.SPECIAL_DB_HOST = 'special-host.com'
      process.env.SPECIAL_DB_NAME = 'special_db'
      process.env.SPECIAL_DB_USER = 'special_user'
      process.env.SPECIAL_DB_PASSWORD = 'special_password'

      // WHEN - ConfigManager is instantiated
      sut = new ConfigManager()

      // THEN - Should have both default and special connections
      const allConnections = sut.getAllConnections()
      expect(allConnections).toContain('default')
      expect(allConnections).toContain('special')
      expect(allConnections).toHaveLength(2)

      // AND - Should configure default connection correctly
      const defaultConfig = sut.getConnectionConfig('default')
      expect(defaultConfig.type).toBe('mysql')
      expect(defaultConfig.host).toBe('default-host.com')

      // AND - Should configure special connection correctly
      const specialConfig = sut.getConnectionConfig('special')
      expect(specialConfig.type).toBe('postgresql')
      expect(specialConfig.host).toBe('special-host.com')
    })
  })
})