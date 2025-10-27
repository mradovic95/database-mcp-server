import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DatabaseManager } from '../../../src/database/manager.js'
import { redisConfig } from '../setup/database-config.js'
import { randomUUID } from 'crypto'

describe('DatabaseManager Redis Integration Tests', () => {
  let sut, testConnectionNames, testKeys  // sut = System Under Test (DatabaseManager)

  beforeEach(() => {
    // Component initialization
    sut = new DatabaseManager()
    testConnectionNames = []
    testKeys = []
  })

  afterEach(async () => {
    // Cleanup test keys and connections
    for (const connectionName of testConnectionNames) {
      try {
        if (sut.hasConnection(connectionName)) {
          const connection = sut.getConnection(connectionName)

          // Delete test keys
          if (testKeys.length > 0) {
            try {
              await connection.driver.client.del(...testKeys)
            } catch (error) {
              // Ignore key deletion errors
            }
          }

          await sut.disconnect(connectionName)
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await sut.disconnectAll()
    testKeys = []
  })

  describe('connect', () => {
    // Happy path tests first
    it('should connect successfully with valid Redis configuration', async () => {
      // GIVEN - Valid Redis configuration
      const connectionName = `redis-test-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }

      // WHEN - Connection is established
      const result = await sut.connect(config)

      // THEN - Should return connection info
      expect(result.success).toBe(true)
      expect(result.name).toBe(connectionName)
      expect(result.type).toBe('redis')
      expect(sut.hasConnection(connectionName)).toBe(true)
    })

    // Unhappy path tests second
    it('should throw error when invalid password provided', async () => {
      // GIVEN - Invalid password
      const connectionName = `redis-invalid-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const invalidConfig = {
        ...redisConfig,
        name: connectionName,
        password: 'wrongpassword'
      }

      // WHEN/THEN - Connection should fail
      await expect(sut.connect(invalidConfig)).rejects.toThrow()
    })

    it('should throw error when required configuration fields are missing', async () => {
      // GIVEN - Invalid configuration missing host
      const connectionName = `redis-missing-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const invalidConfig = {
        type: 'redis',
        name: connectionName
        // Missing host
      }

      // WHEN/THEN - Connection should fail
      await expect(sut.connect(invalidConfig)).rejects.toThrow(/Missing required Redis configuration fields/)
    })
  })

  describe('executeQuery - String Operations', () => {
    let connectionName

    beforeEach(async () => {
      // Setup active Redis connection
      connectionName = `redis-query-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)
    })

    // Happy path tests first
    it('should execute SET command', async () => {
      const key = `test:set:${randomUUID()}`
      testKeys.push(key)

      // WHEN - SET command is executed
      const result = await sut.executeQuery(connectionName, 'SET', [key, 'value123'])

      // THEN - Should succeed
      expect(result.success).toBe(true)
      expect(result.result).toBe('OK')
      expect(result.command).toBe('SET')
    })

    it('should execute GET command', async () => {
      const key = `test:get:${randomUUID()}`
      testKeys.push(key)

      // GIVEN - Key with value
      await sut.executeQuery(connectionName, 'SET', [key, 'hello-redis'])

      // WHEN - GET command is executed
      const result = await sut.executeQuery(connectionName, 'GET', [key])

      // THEN - Should return value
      expect(result.success).toBe(true)
      expect(result.result).toBe('hello-redis')
      expect(result.command).toBe('GET')
    })

    it('should execute INCR command', async () => {
      const key = `test:counter:${randomUUID()}`
      testKeys.push(key)

      // WHEN - INCR command is executed
      const result1 = await sut.executeQuery(connectionName, 'INCR', [key])
      const result2 = await sut.executeQuery(connectionName, 'INCR', [key])

      // THEN - Should increment counter
      expect(result1.success).toBe(true)
      expect(result1.result).toBe(1)
      expect(result2.result).toBe(2)
    })

    it('should support array command format', async () => {
      const key = `test:array:${randomUUID()}`
      testKeys.push(key)

      // WHEN - Command provided as array
      const result = await sut.executeQuery(connectionName, ['SET', key, 'array-format'])

      // THEN - Should succeed
      expect(result.success).toBe(true)
      expect(result.result).toBe('OK')
    })
  })

  describe('executeQuery - Hash Operations', () => {
    let connectionName

    beforeEach(async () => {
      connectionName = `redis-hash-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)
    })

    it('should execute HSET and HGET commands', async () => {
      const key = `test:user:${randomUUID()}`
      testKeys.push(key)

      // WHEN - HSET command is executed
      const setResult = await sut.executeQuery(connectionName, 'HSET', [key, 'name', 'John', 'age', '30'])

      // THEN - Should succeed
      expect(setResult.success).toBe(true)
      expect(setResult.result).toBe(2) // 2 fields set

      // WHEN - HGET command is executed
      const getResult = await sut.executeQuery(connectionName, 'HGET', [key, 'name'])

      // THEN - Should return value
      expect(getResult.success).toBe(true)
      expect(getResult.result).toBe('John')
    })

    it('should execute HGETALL command', async () => {
      const key = `test:profile:${randomUUID()}`
      testKeys.push(key)

      // GIVEN - Hash with multiple fields
      await sut.executeQuery(connectionName, 'HSET', [key, 'name', 'Alice', 'email', 'alice@example.com'])

      // WHEN - HGETALL command is executed
      const result = await sut.executeQuery(connectionName, 'HGETALL', [key])

      // THEN - Should return all fields
      expect(result.success).toBe(true)
      expect(Array.isArray(result.result)).toBe(true)
      expect(result.result).toContain('name')
      expect(result.result).toContain('Alice')
      expect(result.result).toContain('email')
      expect(result.result).toContain('alice@example.com')
    })
  })

  describe('executeQuery - List Operations', () => {
    let connectionName

    beforeEach(async () => {
      connectionName = `redis-list-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)
    })

    it('should execute LPUSH and LRANGE commands', async () => {
      const key = `test:queue:${randomUUID()}`
      testKeys.push(key)

      // WHEN - LPUSH command is executed
      const pushResult = await sut.executeQuery(connectionName, 'LPUSH', [key, 'item1', 'item2', 'item3'])

      // THEN - Should succeed
      expect(pushResult.success).toBe(true)
      expect(pushResult.result).toBe(3) // 3 items pushed

      // WHEN - LRANGE command is executed
      const rangeResult = await sut.executeQuery(connectionName, 'LRANGE', [key, '0', '-1'])

      // THEN - Should return all items
      expect(rangeResult.success).toBe(true)
      expect(Array.isArray(rangeResult.result)).toBe(true)
      expect(rangeResult.result.length).toBe(3)
      expect(rangeResult.rows.length).toBe(3) // Also available as rows
    })
  })

  describe('executeQuery - Set Operations', () => {
    let connectionName

    beforeEach(async () => {
      connectionName = `redis-set-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)
    })

    it('should execute SADD and SMEMBERS commands', async () => {
      const key = `test:tags:${randomUUID()}`
      testKeys.push(key)

      // WHEN - SADD command is executed
      const addResult = await sut.executeQuery(connectionName, 'SADD', [key, 'tag1', 'tag2', 'tag3'])

      // THEN - Should succeed
      expect(addResult.success).toBe(true)
      expect(addResult.result).toBe(3) // 3 members added

      // WHEN - SMEMBERS command is executed
      const membersResult = await sut.executeQuery(connectionName, 'SMEMBERS', [key])

      // THEN - Should return all members
      expect(membersResult.success).toBe(true)
      expect(Array.isArray(membersResult.result)).toBe(true)
      expect(membersResult.result.length).toBe(3)
    })
  })

  describe('executeQuery - Sorted Set Operations', () => {
    let connectionName

    beforeEach(async () => {
      connectionName = `redis-zset-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)
    })

    it('should execute ZADD and ZRANGE commands', async () => {
      const key = `test:leaderboard:${randomUUID()}`
      testKeys.push(key)

      // WHEN - ZADD command is executed
      const addResult = await sut.executeQuery(connectionName, 'ZADD', [key, '100', 'player1', '200', 'player2', '150', 'player3'])

      // THEN - Should succeed
      expect(addResult.success).toBe(true)
      expect(addResult.result).toBe(3) // 3 members added

      // WHEN - ZRANGE command is executed (ascending order)
      const rangeResult = await sut.executeQuery(connectionName, 'ZRANGE', [key, '0', '-1'])

      // THEN - Should return sorted members
      expect(rangeResult.success).toBe(true)
      expect(Array.isArray(rangeResult.result)).toBe(true)
      expect(rangeResult.result[0]).toBe('player1') // Lowest score first
      expect(rangeResult.result[2]).toBe('player2') // Highest score last
    })
  })

  describe('executeQuery - Error Handling', () => {
    let connectionName

    beforeEach(async () => {
      connectionName = `redis-error-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)
    })

    it('should throw error when executing invalid command', async () => {
      // WHEN/THEN - Invalid command should fail
      await expect(sut.executeQuery(connectionName, 'INVALIDCMD', ['arg'])).rejects.toThrow()
    })

    it('should throw error on type mismatch', async () => {
      const key = `test:string:${randomUUID()}`
      testKeys.push(key)

      // GIVEN - Key with string value
      await sut.executeQuery(connectionName, 'SET', [key, 'string-value'])

      // WHEN/THEN - Trying to use list command on string key should fail
      await expect(sut.executeQuery(connectionName, 'LPUSH', [key, 'item'])).rejects.toThrow()
    })
  })

  describe('getSchema', () => {
    let connectionName

    beforeEach(async () => {
      connectionName = `redis-schema-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)
    })

    it('should retrieve Redis database schema information', async () => {
      // GIVEN - Some test data
      const testPrefix = `schema-test-${randomUUID()}`
      const keys = [
        `${testPrefix}:user:1`,
        `${testPrefix}:user:2`,
        `${testPrefix}:session:abc`
      ]
      testKeys.push(...keys)

      for (const key of keys) {
        await sut.executeQuery(connectionName, 'SET', [key, 'value'])
      }

      // WHEN - Schema is retrieved
      const schema = await sut.getSchema(connectionName)

      // THEN - Should return database information
      expect(schema.database).toBe(0)
      expect(schema.keyCount).toBeGreaterThan(0)
      expect(schema.serverInfo).toBeDefined()
      expect(schema.serverInfo.version).toBeDefined()
      expect(schema.serverInfo.uptime).toBeGreaterThan(0)
      expect(schema.keyPatterns).toBeDefined()
      expect(Array.isArray(schema.keyPatterns)).toBe(true)
      expect(schema.typeDistribution).toBeDefined()
      expect(schema.typeDistribution.string).toBeGreaterThan(0)
    })
  })

  describe('testConnection', () => {
    it('should return success for valid connection', async () => {
      // GIVEN - Active Redis connection
      const connectionName = `redis-test-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)

      // WHEN - Connection is tested
      const result = await sut.testConnection(connectionName)

      // THEN - Should return success
      expect(result.success).toBe(true)
      expect(result.message).toBe('Connection successful')
    })
  })

  describe('disconnect', () => {
    it('should disconnect from Redis successfully', async () => {
      // GIVEN - Active Redis connection
      const connectionName = `redis-disconnect-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)

      // WHEN - Connection is disconnected
      await sut.disconnect(connectionName)

      // THEN - Connection should be removed
      expect(sut.hasConnection(connectionName)).toBe(false)
    })
  })

  describe('getConnectionInfo', () => {
    it('should return Redis connection information', async () => {
      // GIVEN - Active Redis connection
      const connectionName = `redis-info-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...redisConfig, name: connectionName }
      await sut.connect(config)

      // WHEN - Connection info is retrieved
      const info = sut.getConnectionInfo(connectionName)

      // THEN - Should return connection details
      expect(info.name).toBe(connectionName)
      expect(info.type).toBe('redis')
      expect(info.host).toBe('localhost')
      expect(info.port).toBe(6379)
      expect(info.database).toBe(0)
      expect(info.connectionString).toContain('redis://')
    })
  })
})
