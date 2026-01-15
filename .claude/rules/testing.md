# Testing Strategy

This project prioritizes **integration testing with real databases** using Docker Compose to validate actual database
behavior rather than mocked interactions. This approach ensures tests catch real-world database edge cases, connection
pooling issues, and database-specific SQL dialect behaviors.

## Testing Philosophy

**Integration-First Approach**:

- Test against real PostgreSQL and MySQL database instances using Docker Compose
- Validate actual database behavior, connection pooling, and transaction handling
- Catch timing issues, constraint violations, and database-specific quirks
- Ensure reliability in production environments with real connection scenarios

**Test Categories**:

```
test/
├── integration/           # Primary focus - Real database testing
│   ├── setup/database-config.js  # Test database configurations
│   └── database/         # DatabaseManager with real databases
│       ├── database-manager-postgresql.test.js    # PostgreSQL-specific tests
│       └── database-manager-mysql.test.js         # MySQL-specific tests
└── drivers/              # Future - Driver-specific unit tests
```

## Integration Testing Rules

### 1. Real Database Testing

- **ALWAYS** use Docker Compose with actual PostgreSQL and MySQL instances
- Test DatabaseManager as the primary interface (it proxies all driver functionality)
- Separate database-specific tests for PostgreSQL and MySQL unique features
- Cross-database tests for multi-database scenarios and export/import functionality

### 2. Test Data Isolation

- Use **unique table/schema names** per test to avoid cross-contamination:

```javascript
beforeEach(() => {
  const testId = randomUUID().replace(/-/g, '_')
  testTableName = `test_table_${testId}`
  connectionName = `test_connection_${testId}`
})
```

Each table, connection, or database object should always be unique, so tests cannot interfere with each other.

### 3. Database Manager Focus

Since the DatabaseManager proxies all driver functionality and handlers are just wrappers, focus testing on:

- **DatabaseManager**: Core business logic with real databases
- **Database-specific drivers**: PostgreSQL vs MySQL behavior differences
- **Cross-database scenarios**: Multiple connections, export/import, mixed operations

## Concrete Assertions

**Always use definite assertions in tests, never vague type checks or loose comparisons.** Tests should validate exact
expected values and concrete ranges rather than just checking types or using imprecise comparisons. For example, use
`expect(result.rowCount).toBe(2)` instead of `expect(result.rowCount).toBeGreaterThan(0)`, and
`expect(connection.isConnected()).toBe(true)` instead of `expect(connection.isConnected()).toBeTruthy()`. When ranges are
necessary, use concrete bounds like `expect(queryTime).toBeGreaterThan(10)` and `expect(queryTime).toBeLessThan(5000)`.

This approach ensures tests provide clear pass/fail criteria and catch regressions definitively. Concrete assertions
also serve as living documentation, clearly communicating the expected database behavior to developers reading the tests.

**Benefits of concrete assertions:**

- Eliminate ambiguity in test results
- Make test failures more actionable by showing exact mismatches
- Prevent tests from accidentally passing when they should fail
- Provide precise specifications of expected database behavior
- Serve as executable documentation for the codebase

## Test Setup and Commands

**Complete Test Automation (Recommended):**

```bash
# Full automated test cycle - start databases, run tests, cleanup
npm run test:full
```

**Manual Test Environment Setup:**

```bash
# Start PostgreSQL and MySQL via Docker Compose
npm run test:setup

# Run integration tests (with databases running)
npm run test:integration

# Stop databases when done
npm run test:teardown
```

**Alternative - Manual Docker Compose:**

```bash
# Start databases
docker-compose -f docker-compose.test.yml up -d

# Wait for databases to be ready
./scripts/wait-for-databases.sh

# Run tests
npm run test:integration

# Stop databases
docker-compose -f docker-compose.test.yml down
```

**Development Testing:**

```bash
npm test           # All tests (currently runs vitest)
```

## Test Writing Standards

### Test Organization and Naming

**File Naming Convention**:

```
test/integration/database/database-manager-postgresql.test.js     # PostgreSQL-specific tests
test/integration/database/database-manager-mysql.test.js        # MySQL-specific tests
```

### Test Suite Structure

* GIVEN/WHEN/THEN Structure - Always structure tests using clear GIVEN/WHEN/THEN comments for readability
* sut - **System Under Test** - Name convention for variable which represents component being tested (alternatively use descriptive names like `dbManager` for DatabaseManager)
* Tests for same method should always be grouped together (happy path, unhappy path, edge cases, etc)

```javascript
describe('[DatabaseType] Integration Tests', () => {
  // Setup variables
  let dbManager, testConnectionNames  // dbManager = System Under Test (or use 'sut')

  beforeEach(() => {
    // Component initialization
    dbManager = new DatabaseManager()
    testConnectionNames = []
  })

  afterEach(async () => {
    // Cleanup test connections
    for (const connectionName of testConnectionNames) {
      try {
        if (dbManager.hasConnection(connectionName)) {
          await dbManager.disconnect(connectionName)
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await dbManager.disconnectAll()
  })

  describe('Connection Management', () => {
    // Happy path tests first
    it('should connect successfully with valid [database] configuration', async () => {
      // GIVEN - Valid database configuration
      const connectionName = `test-${randomUUID()}`
      testConnectionNames.push(connectionName)
      const config = { ...databaseConfig, name: connectionName }

      // WHEN - Connection is established
      const result = await dbManager.connect(config)

      // THEN - Should return connection info
      expect(result.success).toBe(true)
      expect(result.name).toBe(connectionName)
      expect(result.type).toBe('postgresql') // or 'mysql'
    })

    // Unhappy path tests second
    it('should throw error when invalid credentials provided', async () => {
      // GIVEN - Invalid credentials
      const invalidConfig = { ...databaseConfig, password: 'wrongpassword' }

      // WHEN/THEN - Connection should fail
      await expect(dbManager.connect(invalidConfig)).rejects.toThrow()
    })
  })

  describe('Query Execution', () => {
    // Database-specific query tests
    // PostgreSQL: $1, $2 parameters
    // MySQL: ? parameters
    // Transaction handling
    // Schema operations
  })
})
```

### Database-Specific Test Examples

**PostgreSQL Tests (`postgresql.test.js`)**:
```javascript
it('should execute parameterized query with PostgreSQL syntax', async () => {
  // GIVEN - Active PostgreSQL connection
  // WHEN - PostgreSQL parameterized query executed
  const result = await dbManager.executeQuery(
    connectionName,
    'SELECT $1::text as message, $2::int as number',
    ['Hello PostgreSQL', 42]
  )
  // THEN - Should return correct results
  expect(result.rows[0].message).toBe('Hello PostgreSQL')
  expect(result.rows[0].number).toBe(42)
})
```

**MySQL Tests (`mysql.test.js`)**:
```javascript
it('should execute parameterized query with MySQL syntax', async () => {
  // GIVEN - Active MySQL connection
  // WHEN - MySQL parameterized query executed
  const result = await dbManager.executeQuery(
    connectionName,
    'SELECT ? as message, ? as number',
    ['Hello MySQL', 42]
  )
  // THEN - Should return correct results with MySQL quirks
  expect(result.rows[0].message).toBe('Hello MySQL')
  expect(result.rows[0].number).toBe(42)
  expect(result.insertId).toBeDefined() // MySQL-specific
})
```

**Database-Specific Tests**:
```javascript
it('should handle multiple concurrent connections across database types', async () => {
  // GIVEN - PostgreSQL and MySQL configurations
  // WHEN - Both connections established
  // THEN - Should manage both connection types simultaneously
})
```

This testing strategy is specifically designed for testing database operations with real external systems rather than mocked dependencies. The key principles focus on:

1. **Integration-first approach** with real PostgreSQL and MySQL instances
2. **Database Manager focus** since it proxies all driver functionality
3. **Database-specific testing** for PostgreSQL vs MySQL differences
4. **Concrete assertions** rather than vague type checks
5. **Test data isolation** using unique identifiers
6. **GIVEN/WHEN/THEN structure** for clear test organization
7. **Systematic error handling** testing alongside happy paths
8. **Automated test environment setup** using Docker Compose
