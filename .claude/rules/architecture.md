# Architecture Overview

This Database MCP Server is designed as a Model Context Protocol (MCP) server that enables AI assistants like Claude to
connect to and query databases during conversations. The architecture follows clean layered architecture principles with
extensible driver patterns, providing reliable database operations through connection pooling and schema introspection.

## Clean Layered Architecture

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
