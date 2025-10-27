# CLAUDE.md - Database MCP Server

## Architecture Overview

This Database MCP Server is designed as a Model Context Protocol (MCP) server that enables AI assistants like Claude to
connect to and query databases during conversations. The architecture follows clean layered architecture principles with
extensible driver patterns, providing reliable database operations through connection pooling and schema introspection.

### Clean Layered Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude/AI     │────│   MCP Protocol  │────│  Database MCP   │
│   Assistant     │    │   (JSON-RPC)    │    │     Server      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │   MCP Handler   │
                                              │   Coordinator   │
                                              └────────┬────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │ Database        │
                                              │ Manager         │
                                              └────────┬────────┘
                                                       │
                                    ┌────────────┼──────────────┼──────────────┼─────────────┐
                                    │            │              │              │             │
                              ┌─────┴─────┐ ┌──┴────┐  ┌───────┴───────┐ ┌──┴────┐  ┌─────┴─────┐
                              │PostgreSQL │ │ MySQL │  │   DynamoDB    │ │ Redis │  │  Future   │
                              │  Driver   │ │Driver │  │    Driver     │ │Driver │  │  Drivers  │
                              └─────┬─────┘ └──┬────┘  └───────┬───────┘ └──┬────┘  └─────┬─────┘
                                    │            │              │              │             │
                              ┌─────┴─────┐ ┌──┴────┐  ┌───────┴───────┐ ┌──┴────┐  ┌─────┴─────┐
                              │PostgreSQL │ │ MySQL │  │    AWS SDK    │ │ioredis│  │   Other   │
                              │Connection │ │Connect│  │    Client     │ │Client │  │ Databases │
                              │   Pool    │ │ Pool  │  │               │ │       │  │           │
                              └───────────┘ └───────┘  └───────────────┘ └───────┘  └───────────┘
```

## Clean Layered Architecture Components

### Infrastructure Layer

#### 1. CLI Entry Point (`bin/cli.js`)

- **Purpose**: Command-line interface and application bootstrap
- **Responsibilities**:
    - Parse command-line options and configuration files
    - Setup graceful shutdown handlers
    - Initialize and configure MCP server instance
    - Handle process lifecycle and logging
    - Load and display configuration status (connections are not established automatically)

#### 2. MCP Server (`src/server.js`)

- **Purpose**: Core MCP protocol handler
- **Responsibilities**:
    - Handle MCP JSON-RPC protocol communication
    - Process MCP requests (initialize, tools/list, tools/call)
    - Coordinate with tool handlers for business logic execution
    - Manage stdin/stdout communication with MCP clients
    - Handle error responses and notifications

#### 3. Driver System (`src/database/drivers/`)

- **Purpose**: Infrastructure layer - database-specific client implementations
- **Pattern**: Strategy pattern with factory
- **Responsibilities**:
    - Database connection management (PostgreSQL, MySQL, DynamoDB)
    - Connection pooling configuration and lifecycle (SQL databases)
    - AWS SDK client management (DynamoDB)
    - Query execution with parameter binding (SQL) and PartiQL (DynamoDB)
    - Schema introspection and metadata retrieval
    - No business logic - pure infrastructure

##### Supported Drivers

**SQL Databases:**
- **PostgreSQL** (`src/database/drivers/postgresql.js`): Full-featured PostgreSQL driver with connection pooling
- **MySQL** (`src/database/drivers/mysql.js`): MySQL driver with connection pooling

**NoSQL Databases:**
- **DynamoDB** (`src/database/drivers/dynamodb.js`): AWS DynamoDB driver with PartiQL query support
- **Redis** (`src/database/drivers/redis.js`): In-memory data store with Redis command support

### Business Logic Layer

#### 4. Database Manager (`src/database/manager.js`)

- **Purpose**: Central coordinator for all database connections
- **Pattern**: Manager pattern with registry
- **Responsibilities**:
    - Maintain named connection registry
    - Delegate operations to appropriate drivers
    - Connection lifecycle management
    - Resource cleanup and health monitoring
    - Connection testing and validation

### Coordination Layer

#### 5. Tool Definitions (`src/mcp/tools.js`)

- **Purpose**: Centralized tool schema definitions
- **Pattern**: Declarative configuration pattern
- **Responsibilities**:
    - Define tool names, descriptions, and input schemas
    - Specify required and optional parameters
    - Provide parameter validation rules and defaults

#### 6. Tool Handlers (`src/mcp/handlers.js`)

- **Purpose**: MCP tool implementations that coordinate business logic
- **Pattern**: Handler pattern with manager delegation
- **Responsibilities**:
    - Process MCP tool execution requests
    - Coordinate with database manager for operations
    - Format responses for MCP protocol
    - Handle errors gracefully and consistently
    - Provide structured logging for debugging

### Utilities

#### 7. Logger (`src/utils/logger.js`)

- **Purpose**: Structured logging with configurable levels
- **Responsibilities**:
    - Consistent error formatting and context
    - Query timing and performance metrics
    - MCP mode detection for appropriate log formatting

#### 8. Configuration (`src/utils/config.js`)

- **Purpose**: Environment and file-based configuration management
- **Responsibilities**:
    - Load configuration from multiple sources
    - Validate configuration parameters
    - Provide default values and environment variable support

## Clean Architecture Patterns

### 1. Layered Architecture

The system is organized into distinct layers with clear responsibilities:

```
┌─────────────────────────┐
│    Coordination Layer   │  ← MCP Handlers, Tool Definitions
├─────────────────────────┤
│   Business Logic Layer  │  ← Database Manager
├─────────────────────────┤
│   Infrastructure Layer  │  ← Drivers, Utilities, CLI
└─────────────────────────┘
```

### 2. Strategy Pattern (Database Drivers)

Each database type implements the same interface but with different connection logic:

```javascript
// Base interface for all database drivers
class BaseDriver {
	async connect() {
		throw new Error('Must implement')
	}

	async query() {
		throw new Error('Must implement')
	}

	async getSchema() {
		throw new Error('Must implement')
	}

	getConnectionString() {
		throw new Error('Must implement')
	}
}

// Database-specific implementations
class PostgreSQLDriver extends BaseDriver {
	async connect() {
		// PostgreSQL-specific connection logic using pg
	}
}

class MySQLDriver extends BaseDriver {
	async connect() {
		// MySQL-specific connection logic using mysql2
	}
}
```

### 3. Factory Pattern (Driver Creation)

```javascript
export function createDriver(type, config) {
	const DriverClass = SUPPORTED_DRIVERS[type.toLowerCase()]
	if (!DriverClass) {
		throw new Error(`Unsupported database type: ${type}`)
	}
	return new DriverClass(config)
}
```

### 4. Registry Pattern (Connection Management)

```javascript
class DatabaseManager {
	constructor() {
		this.connections = new Map() // Registry of driver instances
	}

	addConnection(name, driver) {
		this.connections.set(name, driver)
	}

	getConnection(name) {
		return this.connections.get(name)
	}
}
```

### 5. Declarative Configuration Pattern (Tool Definitions)

Tools are defined declaratively separate from implementation:

```javascript
export const TOOLS = [
	{
		name: "connect_database",
		description: "Connect to a database with the specified configuration",
		inputSchema: {
			type: "object",
			properties: {
				type: {type: "string", description: "Database type (postgresql, mysql)"},
				name: {type: "string", description: "Connection name (optional)"},
				host: {type: "string", description: "Database host"},
				database: {type: "string", description: "Database name"},
				user: {type: "string", description: "Database user"},
				password: {type: "string", description: "Database password"},
				port: {type: "number", description: "Database port (optional)"},
				ssl: {type: "boolean", description: "Use SSL connection (optional)"},
				maxConnections: {type: "number", description: "Maximum connections in pool (optional)"},
				idleTimeout: {type: "number", description: "Idle connection timeout in milliseconds (optional)"},
				connectionTimeout: {type: "number", description: "Connection timeout in milliseconds (optional)"},
				acquireTimeout: {type: "number", description: "Connection acquire timeout in milliseconds (optional)"}
			},
			required: ["type", "host", "database", "user", "password"]
		}
	},
	{
		name: "connect_from_config",
		description: "Connect to a database using a named configuration from config file",
		inputSchema: {
			type: "object",
			properties: {
				configName: {type: "string", description: "Name of the connection configuration"},
				connectionName: {type: "string", description: "Custom name for this connection (optional)"}
			}
		}
	},
	{
		name: "execute_query",
		description: "Execute a SQL query on a connected database",
		inputSchema: {
			type: "object",
			properties: {
				connection: {type: "string", description: "Connection name"},
				sql: {type: "string", description: "SQL query to execute"},
				params: {type: "array", description: "Query parameters"}
			},
			required: ["connection", "sql"]
		}
	},
	{
		name: "list_connections",
		description: "List all active database connections"
	},
	{
		name: "test_connection",
		description: "Test the connectivity of a database connection",
		inputSchema: {
			type: "object",
			properties: {
				connection: {type: "string", description: "Connection name"}
			},
			required: ["connection"]
		}
	},
	{
		name: "close_connection",
		description: "Close a database connection",
		inputSchema: {
			type: "object",
			properties: {
				connection: {type: "string", description: "Connection name"}
			},
			required: ["connection"]
		}
	},
	{
		name: "connection_info",
		description: "Get detailed information about a specific connection"
	},
	{
		name: "show_configurations",
		description: "Show all database configurations available in the config file"
	},
	{
		name: "export_connections",
		description: "Export connection configurations for backup or migration"
	},
	{
		name: "import_connections",
		description: "Import connection configurations from backup",
		inputSchema: {
			type: "object",
			properties: {
				connections: {type: "object", description: "Connection configurations to import"},
				overwrite: {type: "boolean", description: "Whether to overwrite existing connections"}
			},
			required: ["connections"]
		}
	}
]
```

## Configuration System

### Configuration Loading Strategy

The Database MCP Server follows a configuration-first, connect-on-demand approach:

- **No Auto-Connect**: Configuration is loaded at startup but connections are NOT established automatically
- **On-Demand Connection**: Use `connect_database` tool to establish connections as needed
- **Multiple Sources**: Configuration loaded from multiple file paths and environment variables
- **Multiple Database Support**: Configure multiple databases using environment variable patterns
- **Validation**: Configuration validation before connection attempts
- **Transparency**: Clear configuration loading order and precedence

### Configuration Flow

```
1. Server Startup
   ↓
2. Load Config Files (database-config.json, config.json, or DATABASE_CONFIG_PATH)
   ↓
3. Load Single Database Environment Variables (DB_HOST, DB_PORT, DB_TYPE, etc.)
   ↓
4. Load Multiple Database Environment Variables ({CONNECTION_NAME}_DB_{PARAMETER})
   ↓
5. Display Configuration Status
   ↓
6. Server Ready (no connections established)
   ↓
7. AI Uses connect_database Tool
   ↓
8. Connection Established On-Demand
```

### Environment Variable Patterns

#### Single Database Configuration (Legacy)
```bash
export DB_TYPE=postgresql
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=my_database
export DB_USER=db_user
export DB_PASSWORD=db_password
```

#### Multiple Database Configuration (Recommended)
Use the pattern `{CONNECTION_NAME}_DB_{PARAMETER}` to configure multiple databases:

```bash
# Production Database
export PROD_DB_TYPE=postgresql
export PROD_DB_HOST=prod-db.company.com
export PROD_DB_PORT=5432
export PROD_DB_NAME=production_db
export PROD_DB_USER=prod_user
export PROD_DB_PASSWORD=prod_password
export PROD_DB_SSL=true
export PROD_DB_MAX_CONNECTIONS=20

# Development Database
export DEV_DB_TYPE=mysql
export DEV_DB_HOST=localhost
export DEV_DB_PORT=3306
export DEV_DB_NAME=dev_db
export DEV_DB_USER=dev_user
export DEV_DB_PASSWORD=dev_password
export DEV_DB_SSL=false

# Analytics Database
export ANALYTICS_DB_TYPE=postgresql
export ANALYTICS_DB_HOST=analytics.company.com
export ANALYTICS_DB_PORT=5432
export ANALYTICS_DB_NAME=analytics_db
export ANALYTICS_DB_USER=analytics_user
export ANALYTICS_DB_PASSWORD=analytics_password
export ANALYTICS_DB_MAX_CONNECTIONS=10
export ANALYTICS_DB_IDLE_TIMEOUT=30000
export ANALYTICS_DB_CONNECTION_TIMEOUT=15000
export ANALYTICS_DB_ACQUIRE_TIMEOUT=20000
```

**Environment Variable Pattern Rules:**
- `{CONNECTION_NAME}` must be uppercase letters, numbers, and underscores
- `{CONNECTION_NAME}` becomes the connection name (converted to lowercase)
- **SQL Database Parameters**: TYPE, HOST, PORT, NAME, USER, PASSWORD, SSL, MAX_CONNECTIONS, IDLE_TIMEOUT, CONNECTION_TIMEOUT, ACQUIRE_TIMEOUT
- **DynamoDB Parameters**: TYPE, REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY, ENDPOINT (optional)
- **Redis Parameters**: TYPE, HOST, PORT, PASSWORD (optional), DATABASE (0-15), TLS (optional)
- Invalid patterns are ignored (e.g., `prod_DB_TYPE`, `DB_PROD_TYPE`, `INVALID_PROD_TYPE`)

#### DynamoDB Configuration

DynamoDB uses AWS credentials instead of traditional database connection parameters:

```bash
# DynamoDB Configuration
export DYNAMO_DB_TYPE=dynamodb
export DYNAMO_DB_REGION=us-east-1
export DYNAMO_DB_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
export DYNAMO_DB_SECRET_ACCESS_KEY=your-secret-access-key

# Optional: For local development with DynamoDB Local
export DYNAMO_LOCAL_DB_TYPE=dynamodb
export DYNAMO_LOCAL_DB_REGION=us-east-1
export DYNAMO_LOCAL_DB_ACCESS_KEY_ID=test
export DYNAMO_LOCAL_DB_SECRET_ACCESS_KEY=test
export DYNAMO_LOCAL_DB_ENDPOINT=http://localhost:8000
```

**DynamoDB Configuration Differences:**
- **Authentication**: Uses AWS credentials (accessKeyId, secretAccessKey) instead of user/password
- **Region**: AWS region is required (e.g., us-east-1, eu-west-1)
- **Endpoint**: Optional custom endpoint for local development (DynamoDB Local/LocalStack)
- **Query Language**: Supports PartiQL (SQL-compatible query language for DynamoDB)
- **Schema**: Tables with partition keys, sort keys, and secondary indexes

#### Redis Configuration

Redis uses a simpler configuration model:

```bash
# Redis Configuration
export CACHE_DB_TYPE=redis
export CACHE_DB_HOST=localhost
export CACHE_DB_PORT=6379
export CACHE_DB_PASSWORD=secret
export CACHE_DB_DATABASE=0

# Redis with TLS
export SECURE_CACHE_DB_TYPE=redis
export SECURE_CACHE_DB_HOST=redis.example.com
export SECURE_CACHE_DB_PORT=6380
export SECURE_CACHE_DB_PASSWORD=secret
export SECURE_CACHE_DB_DATABASE=0
export SECURE_CACHE_DB_TLS=true
```

**Redis Configuration Differences:**
- **Authentication**: Optional password-based authentication (no username)
- **Database Selection**: Redis supports 16 databases (0-15) per instance
- **Commands**: Uses native Redis commands (GET, SET, HGET, LPUSH, etc.) instead of SQL
- **Schema**: No predefined schema - key-value store with data structures
- **Connection**: Single connection or connection pooling via ioredis

**Security Benefits:**
- Keep sensitive credentials in environment variables
- Support multiple databases without configuration files
- Environment-based configuration management
- No credentials stored in version control
- AWS IAM integration for DynamoDB

### Configuration Benefits

This approach provides several benefits:

- **Security**: No automatic connections reduce attack surface
- **Flexibility**: Connect only to needed databases
- **Resource Efficiency**: Avoid unnecessary connection overhead
- **Control**: Explicit connection management

## Development Best Practices

### Code Organization

- **Feature-based structure**: Group related functionality together
- **Clear separation of concerns**: Each module has a single responsibility
- **Dependency injection**: Pass dependencies rather than importing globally
- **Interface segregation**: Small, focused interfaces

### Error Handling

- **Consistent error format**: All errors follow the same structure
- **Graceful degradation**: Server continues operating despite individual failures
- **Detailed logging**: Comprehensive error information for debugging
- **Resource cleanup**: Ensure connections are properly closed

### Security

- **No credential persistence**: Credentials only in memory during active connections
- **Parameter binding**: Prevent SQL injection through parameterized queries
- **Connection isolation**: Each connection is independent
- **SSL support**: Secure connections when configured

### Performance

- **Connection pooling**: Reuse database connections efficiently
- **Lazy loading**: Connect only when needed
- **Resource limits**: Configurable pool sizes
- **Connection lifecycle**: Automatic cleanup of unused connections

## Extending the Server

### Adding New Database Types

The server now supports PostgreSQL, MySQL, and DynamoDB. To add additional database types (e.g., MongoDB, Redis), follow these steps:

1. **Create Driver Class**:

```javascript
// src/database/drivers/mongodb.js
import {BaseDriver} from './base.js'

export class MongoDBDriver extends BaseDriver {
	async connect() {
		// MongoDB-specific connection logic
		// Example: Initialize MongoDB client, test connection
	}

	async query(query, params) {
		// MongoDB query execution
		// Example: Execute query using MongoDB driver
	}

	async getSchema() {
		// MongoDB schema introspection
		// Example: List collections and their schemas
	}

	validateConfig() {
		// Custom validation for MongoDB (host, port, database)
		const required = ['host', 'database']
		const missing = required.filter(field => !this.config[field])
		if (missing.length > 0) {
			throw new Error(`Missing required MongoDB configuration fields: ${missing.join(', ')}`)
		}
	}

	getConnectionString() {
		// Return connection string for display
		const { host, port = 27017, database } = this.config
		return `mongodb://${host}:${port}/${database}`
	}
}
```

2. **Register Driver**:

```javascript
// src/database/drivers/index.js
import {MongoDBDriver} from './mongodb.js'

export const SUPPORTED_DRIVERS = {
	mongodb: MongoDBDriver,
	mongo: MongoDBDriver,
	// ... existing drivers
}
```

3. **Add Dependencies**:

```json
// package.json
{
	"dependencies": {
		"mongodb": "^6.0.0"
	}
}
```

4. **Update Configuration Manager** (if needed):

For databases with unique configuration parameters (like DynamoDB's AWS credentials), update `src/utils/config.js` to handle new environment variable patterns.

**Reference Implementation**: See `src/database/drivers/dynamodb.js` for a complete example of a NoSQL driver with AWS SDK integration.

### Adding New MCP Tools

1. **Define Tool Schema**:

```javascript
// src/mcp/tools.js
{
	name: "backup_database",
		description
:
	"Create a backup of the database",
		inputSchema
:
	{
		type: "object",
			properties
	:
		{
			connection: {
				type: "string"
			}
		,
			outputPath: {
				type: "string"
			}
		}
	,
		required: ["connection", "outputPath"]
	}
}
```

2. **Implement Handler**:

```javascript
// src/mcp/handlers.js
async
handleBackupDatabase(args)
{
	try {
		const connection = this.dbManager.getConnection(args.connection)
		const result = await connection.driver.backup(args.outputPath)
		return {
			content: [{
				type: "text",
				text: JSON.stringify({success: true, result}, null, 2)
			}]
		}
	} catch (error) {
		return {
			content: [{
				type: "text",
				text: JSON.stringify({success: false, error: error.message}, null, 2)
			}],
			isError: true
		}
	}
}
```

## Testing Strategy

This project prioritizes **integration testing with real databases** using Docker Compose to validate actual database
behavior rather than mocked interactions. This approach ensures tests catch real-world database edge cases, connection
pooling issues, and database-specific SQL dialect behaviors.

### Testing Philosophy

**🎯 Integration-First Approach**:

- Test against real PostgreSQL and MySQL database instances using Docker Compose
- Validate actual database behavior, connection pooling, and transaction handling
- Catch timing issues, constraint violations, and database-specific quirks
- Ensure reliability in production environments with real connection scenarios

**📋 Test Categories**:

```
test/
├── integration/           # Primary focus - Real database testing
│   ├── setup/database-config.js  # Test database configurations
│   └── database/         # DatabaseManager with real databases
│       ├── database-manager-postgresql.test.js    # PostgreSQL-specific tests
│       └── database-manager-mysql.test.js         # MySQL-specific tests
└── drivers/              # Future - Driver-specific unit tests
```

### Integration Testing Rules

#### **1. Real Database Testing**

- **ALWAYS** use Docker Compose with actual PostgreSQL and MySQL instances
- Test DatabaseManager as the primary interface (it proxies all driver functionality)
- Separate database-specific tests for PostgreSQL and MySQL unique features
- Cross-database tests for multi-database scenarios and export/import functionality

#### **2. Test Data Isolation**

- Use **unique table/schema names** per test to avoid cross-contamination:

```javascript
beforeEach(() => {
  const testId = randomUUID().replace(/-/g, '_')
  testTableName = `test_table_${testId}`
  connectionName = `test_connection_${testId}`
})
```

Each table, connection, or database object should always be unique, so tests cannot interfere with each other.

#### **3. Database Manager Focus**

Since the DatabaseManager proxies all driver functionality and handlers are just wrappers, focus testing on:

- **DatabaseManager**: Core business logic with real databases
- **Database-specific drivers**: PostgreSQL vs MySQL behavior differences
- **Cross-database scenarios**: Multiple connections, export/import, mixed operations

### Concrete Assertions

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

### Test Setup and Commands

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

### Test Writing Standards

#### **Test Organization and Naming**

**File Naming Convention**:

```
test/integration/database/database-manager-postgresql.test.js     # PostgreSQL-specific tests
test/integration/database/database-manager-mysql.test.js        # MySQL-specific tests
```

#### **Test Suite Structure**

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

#### **Database-Specific Test Examples**

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

## Monitoring and Observability

### Logging Strategy

- **Structured logging**: JSON format for machine parsing
- **Log levels**: DEBUG, INFO, WARN, ERROR
- **Contextual information**: Include connection names, query snippets, timing
- **Security**: Never log credentials or sensitive data

### Metrics to Track

- Connection pool utilization
- Query execution times
- Error rates by database type
- Active connection counts
- Tool usage patterns

### Health Checks

```javascript
// Example health check endpoint
async
healthCheck()
{
	const connections = this.dbManager.listConnections()
	const results = await Promise.allSettled(
		connections.map(conn => this.dbManager.testConnection(conn.name))
	)

	return {
		status: results.every(r => r.status === 'fulfilled') ? 'healthy' : 'degraded',
		connections: results.length,
		timestamp: new Date().toISOString()
	}
}
```

## Deployment Considerations

### NPX Distribution

- **Executable permissions**: Ensure CLI script has proper permissions
- **Shebang**: Use `#!/usr/bin/env node` for cross-platform compatibility
- **Package.json bin**: Proper binary configuration for NPX

### Environment Configuration

- **12-factor app**: Configuration via environment variables
- **Secrets management**: Use secure credential storage in production
- **Configuration validation**: Validate all config on startup

### Process Management

- **Graceful shutdown**: Handle SIGTERM/SIGINT signals
- **Resource cleanup**: Close all database connections on exit
- **Error recovery**: Restart on unhandled errors

## Common Pitfalls and Solutions

### 1. Connection Leaks

**Problem**: Not properly closing database connections
**Solution**:

```javascript
// Always cleanup in finally blocks
try {
	const result = await connection.query(sql)
	return result
} finally {
	if (connection) connection.release()
}
```

### 2. Blocking Operations

**Problem**: Long-running queries blocking the event loop
**Solution**: Use connection pools and proper async/await patterns

### 3. Memory Leaks

**Problem**: Accumulating connections or cached data
**Solution**: Implement proper cleanup and resource limits

### 4. Error Propagation

**Problem**: Swallowing errors or poor error context
**Solution**:

```javascript
// Maintain error context through the stack
try {
	await operation()
} catch (error) {
	throw new Error(`Operation failed for connection '${name}': ${error.message}`)
}
```

## Future Enhancements

### Planned Features

1. **Query result caching** for repeated operations
2. **Connection pooling optimization** with usage analytics
3. **Bulk operations** for large data sets
4. **Transaction support** for multi-query operations
5. **Database migration tools** via MCP
6. **Performance monitoring** with query analysis

### Scalability Considerations

- **Horizontal scaling**: Multiple server instances
- **Load balancing**: Distribute connections across instances
- **Configuration management**: Centralized config for multiple instances
- **Service discovery**: Dynamic database endpoint resolution

This architecture provides a solid foundation for a production-ready database MCP server while maintaining simplicity
and extensibility.
