# Database MCP Server

A Model Context Protocol (MCP) server that provides AI systems with seamless integration to database systems using
connection pooling and query execution. This server exposes database operations as MCP tools, enabling AI assistants to
interact with databases programmatically.

## Features

- **Multiple Database Connections**: Manage connections to multiple database servers simultaneously
- **Dynamic Connection Management**: Add and remove database connections at runtime
- **Comprehensive Query Operations**: Execute SQL queries with parameter binding and result formatting
- **Schema Introspection**: Get table, column, and relationship information from databases
- **Connection Pooling**: Efficient connection management with configurable pool sizes and connection limits
- **Multi-database Support**: PostgreSQL, MySQL, DynamoDB, Redis with extensible driver architecture
- **Health Monitoring**: Automatic connection health checks and database status monitoring
- **Configuration Management**: Load connections from config files with on-demand connection
- **Resource Management**: Automatic cleanup and connection lifecycle management
- **MCP Protocol Compliance**: Full compatibility with MCP-enabled AI systems
- **CLI Interface**: Easy command-line management and testing

### AI-Powered Database Management

With this MCP server, you can ask your AI assistant natural language questions and get instant results:

**📊 Schema Exploration & Discovery**

- *"Show me all tables in the database"* → Get comprehensive table and column information
- *"What's the structure of the users table?"* → View table schema, columns, and relationships
- *"Give me all tables connected to the product table"* → Discover database relationships
- *"Show me all user roles and privileges for this database"* → Database security and access control analysis

**🔍 Data Analysis & Queries**

- *"Get the first 10 users from the users table"* → Execute SELECT queries with results
- *"Count how many orders were created today"* → Aggregate queries with date filtering
- *"Find all customers with orders over $1000"* → Complex JOIN queries across tables
- *"Show me the schema for all tables containing 'user' in the name"* → Pattern-based schema discovery

**🔗 Connection Management**

- *"Connect to my PostgreSQL production database"* → Establish connection from config
- *"Show me all my database connections"* → Display available configurations
- *"Test if my staging database is responding"* → Connection health verification
- *"Switch to the analytics database connection"* → Dynamic connection switching

**💾 Database Operations & Monitoring**

- *"Execute this SQL query on the reporting database"* → Direct SQL execution with results
- *"Check the connection status of all my databases"* → Health monitoring across connections
- *"Close the connection to the development database"* → Resource management
- *"What database types are supported?"* → Compatibility information

**🔄 Backup & Migration**

- *"Export all my database connections for backup"* → Save connection configurations to backup file
- *"Import connections from my staging environment to production setup"* → Migrate database configurations
- *"Backup my current database setup before making changes"* → Create configuration snapshot
- *"Copy connection settings from development to my local environment"* → Clone environment configurations

### Currently Supported Databases

**SQL Databases:**
- **PostgreSQL** - Full-featured relational database with connection pooling
- **MySQL** - Popular relational database with connection pooling

**NoSQL Databases:**
- **DynamoDB** - AWS managed NoSQL database with PartiQL query support
- **Redis** - In-memory data store with support for strings, hashes, lists, sets, and sorted sets

## Getting Started

### Installation

#### Via NPX (Recommended)

Run directly without installation:

```bash
npx mcp-database-server
```

#### Via npm

```bash
npm install -g mcp-database-server
database-mcp-server
```

### Claude Integration

#### Claude Desktop Configuration

Add the Database MCP server to your Claude Desktop by editing the MCP configuration file:

**macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

##### Option 1: Environment Variables (Recommended for Security)

```json
{
	"mcpServers": {
		"database": {
			"command": "npx",
			"args": [
				"mcp-database-server"
			],
			"env": {
				"DB_HOST": "localhost",
				"DB_PORT": "5432",
				"DB_TYPE": "postgresql",
				"DB_NAME": "myapp_db",
				"DB_USER": "username",
				"DB_PASSWORD": "password"
			}
		}
	}
}
```

**🔒 Security Note**: Environment variables are more secure than configuration files since AI agents can potentially
access the file system, but environment variables are isolated to the MCP server process.

##### Option 1b: Multiple Databases via Environment Variables (Secure Multi-DB Setup)

```json
{
	"mcpServers": {
		"database": {
			"command": "npx",
			"args": [
				"mcp-database-server"
			],
			"env": {
				"PROD_DB_TYPE": "postgresql",
				"PROD_DB_HOST": "prod-db.company.com",
				"PROD_DB_PORT": "5432",
				"PROD_DB_NAME": "production_db",
				"PROD_DB_USER": "prod_user",
				"PROD_DB_PASSWORD": "prod_password",
				"PROD_DB_SSL": "true",
				"DEV_DB_TYPE": "mysql",
				"DEV_DB_HOST": "localhost",
				"DEV_DB_PORT": "3306",
				"DEV_DB_NAME": "development_db",
				"DEV_DB_USER": "dev_user",
				"DEV_DB_PASSWORD": "dev_password",
				"STAGING_DB_TYPE": "postgresql",
				"STAGING_DB_HOST": "staging-db.company.com",
				"STAGING_DB_PORT": "5432",
				"STAGING_DB_NAME": "staging_db",
				"STAGING_DB_USER": "staging_user",
				"STAGING_DB_PASSWORD": "staging_password"
			}
		}
	}
}
```

**Environment Variable Pattern**: Use `{CONNECTION_NAME}_DB_{PARAMETER}` format where:

- `{CONNECTION_NAME}` is the unique identifier for your database (e.g., PROD, DEV, STAGING)
- `{PARAMETER}` is the database parameter (TYPE, HOST, PORT, NAME, USER, PASSWORD, SSL, etc.)

**🔒 Security Benefit**: This approach keeps all sensitive credentials in environment variables while supporting multiple
databases without configuration files.

##### Option 2: Configuration File (Multiple Databases)

```json
{
	"mcpServers": {
		"database": {
			"command": "npx",
			"args": [
				"mcp-database-server"
			],
			"env": {
				"DATABASE_CONFIG_PATH": "/path/to/your/database-config.json"
			}
		}
	}
}
```

#### Claude Code Configuration

Add to your `.mcp.json` file in your project root:

##### Option 1: Environment Variables (Recommended for Security)

```json
{
	"mcpServers": {
		"database": {
			"command": "npx",
			"args": [
				"mcp-database-server"
			],
			"env": {
				"DB_HOST": "localhost",
				"DB_PORT": "5432",
				"DB_TYPE": "postgresql",
				"DB_NAME": "myapp_db",
				"DB_USER": "username",
				"DB_PASSWORD": "password"
			}
		}
	}
}
```

**🔒 Security Note**: Environment variables are more secure than configuration files since AI agents can potentially
access the file system, but environment variables are isolated to the MCP server process.

##### Option 1b: Multiple Databases via Environment Variables (Secure Multi-DB Setup)

```json
{
	"mcpServers": {
		"database": {
			"command": "npx",
			"args": [
				"mcp-database-server"
			],
			"env": {
				"PROD_DB_TYPE": "postgresql",
				"PROD_DB_HOST": "prod-db.company.com",
				"PROD_DB_PORT": "5432",
				"PROD_DB_NAME": "production_db",
				"PROD_DB_USER": "prod_user",
				"PROD_DB_PASSWORD": "prod_password",
				"PROD_DB_SSL": "true",
				"DEV_DB_TYPE": "mysql",
				"DEV_DB_HOST": "localhost",
				"DEV_DB_PORT": "3306",
				"DEV_DB_NAME": "development_db",
				"DEV_DB_USER": "dev_user",
				"DEV_DB_PASSWORD": "dev_password",
				"ANALYTICS_DB_TYPE": "postgresql",
				"ANALYTICS_DB_HOST": "analytics-db.company.com",
				"ANALYTICS_DB_PORT": "5432",
				"ANALYTICS_DB_NAME": "analytics_db",
				"ANALYTICS_DB_USER": "analytics_user",
				"ANALYTICS_DB_PASSWORD": "analytics_password"
			}
		}
	}
}
```

**Environment Variable Pattern**: Use `{CONNECTION_NAME}_DB_{PARAMETER}` format where:

- `{CONNECTION_NAME}` is the unique identifier for your database (e.g., PROD, DEV, ANALYTICS)
- `{PARAMETER}` is the database parameter (TYPE, HOST, PORT, NAME, USER, PASSWORD, SSL, etc.)

**🔒 Security Benefit**: This approach keeps all sensitive credentials in environment variables while supporting multiple
databases without configuration files.

##### Option 2: Configuration File (Multiple Databases)

```json
{
	"mcpServers": {
		"database": {
			"command": "npx",
			"args": [
				"mcp-database-server"
			],
			"env": {
				"DATABASE_CONFIG_PATH": "./database-config.json"
			}
		}
	}
}
```

**For both options above, when using a configuration file, create a `database-config.json` file:**

```json
{
	"development": {
		"type": "postgresql",
		"host": "localhost",
		"port": 5432,
		"database": "dev_db",
		"user": "dev_user",
		"password": "dev_pass"
	},
	"staging": {
		"type": "mysql",
		"host": "staging-db.company.com",
		"port": 3306,
		"database": "staging_db",
		"user": "stage_user",
		"password": "stage_pass"
	}
}
```

After configuration, restart Claude Desktop or reload Claude Code to enable database management capabilities.

### Usage

#### Starting the Server

```bash
# Start with default settings (MCP mode - silent)
npx mcp-database-server

# Start in standalone mode with console logging
npx mcp-database-server --standalone

# Start standalone with debug logging
npx mcp-database-server --standalone --log-level DEBUG
```

## Configuration

### Connection Parameters

- `type` (required): Database type (`postgresql`, `mysql`)
- `host` (required): Database hostname or IP address
- `database` (required): Database name
- `user` (required): Database user
- `password` (required): Database password
- `port` (optional): Database port (uses default for database type)
- `ssl` (optional): Enable SSL/TLS connection (default: false)
- `maxConnections` (optional): Maximum connections in pool (default: 5)
- `idleTimeout` (optional): Idle connection timeout in milliseconds (default: 60000)
- `connectionTimeout` (optional): Connection timeout in milliseconds (default: 5000)
- `acquireTimeout` (optional): Connection acquire timeout in milliseconds (default: 5000)

### Environment Variables

#### Standard Environment Variables

| Variable               | Description                         | Default           |
|------------------------|-------------------------------------|-------------------|
| `LOG_LEVEL`            | Set logging level                   | `INFO`            |
| `DATABASE_CONFIG_PATH` | Path to database configuration file | Auto-detected     |
| `DB_HOST`              | Default database hostname           | `localhost`       |
| `DB_PORT`              | Default database port               | Database-specific |
| `DB_NAME`              | Default database name               | `""`              |
| `DB_USER`              | Default database user               | `""`              |
| `DB_PASSWORD`          | Default database password           | `""`              |
| `DB_TYPE`              | Default database type               | `postgresql`      |

#### Multiple Database Environment Variables

For multiple database connections, use the pattern `{CONNECTION_NAME}_DB_{PARAMETER}`:

**SQL Database Parameters:**

| Variable Pattern               | Description                             | Example                           |
|--------------------------------|-----------------------------------------|-----------------------------------|
| `{NAME}_DB_TYPE`               | Database type for named connection      | `PROD_DB_TYPE=postgresql`         |
| `{NAME}_DB_HOST`               | Database hostname for named connection  | `PROD_DB_HOST=prod-db.com`        |
| `{NAME}_DB_PORT`               | Database port for named connection      | `PROD_DB_PORT=5432`               |
| `{NAME}_DB_NAME`               | Database name for named connection      | `PROD_DB_NAME=production`         |
| `{NAME}_DB_USER`               | Database user for named connection      | `PROD_DB_USER=prod_user`          |
| `{NAME}_DB_PASSWORD`           | Database password for named connection  | `PROD_DB_PASSWORD=secret`         |
| `{NAME}_DB_SSL`                | Enable SSL for named connection         | `PROD_DB_SSL=true`                |
| `{NAME}_DB_MAX_CONNECTIONS`    | Max connections for named connection    | `PROD_DB_MAX_CONNECTIONS=10`      |
| `{NAME}_DB_IDLE_TIMEOUT`       | Idle timeout for named connection       | `PROD_DB_IDLE_TIMEOUT=60000`      |
| `{NAME}_DB_CONNECTION_TIMEOUT` | Connection timeout for named connection | `PROD_DB_CONNECTION_TIMEOUT=5000` |
| `{NAME}_DB_ACQUIRE_TIMEOUT`    | Acquire timeout for named connection    | `PROD_DB_ACQUIRE_TIMEOUT=5000`    |

**DynamoDB Parameters:**

| Variable Pattern                | Description                          | Example                                   |
|---------------------------------|--------------------------------------|-------------------------------------------|
| `{NAME}_DB_TYPE`                | Database type (must be dynamodb)     | `DYNAMO_DB_TYPE=dynamodb`                 |
| `{NAME}_DB_REGION`              | AWS region                           | `DYNAMO_DB_REGION=us-east-1`              |
| `{NAME}_DB_ACCESS_KEY_ID`       | AWS access key ID                    | `DYNAMO_DB_ACCESS_KEY_ID=AKIAXXXXX`       |
| `{NAME}_DB_SECRET_ACCESS_KEY`   | AWS secret access key                | `DYNAMO_DB_SECRET_ACCESS_KEY=secret`      |
| `{NAME}_DB_ENDPOINT`            | Custom endpoint (optional)           | `DYNAMO_DB_ENDPOINT=http://localhost:8000`|

**Redis Parameters:**

| Variable Pattern                | Description                          | Example                                   |
|---------------------------------|--------------------------------------|-------------------------------------------|
| `{NAME}_DB_TYPE`                | Database type (must be redis)        | `CACHE_DB_TYPE=redis`                     |
| `{NAME}_DB_HOST`                | Redis hostname                       | `CACHE_DB_HOST=localhost`                 |
| `{NAME}_DB_PORT`                | Redis port                           | `CACHE_DB_PORT=6379`                      |
| `{NAME}_DB_PASSWORD`            | Redis password (optional)            | `CACHE_DB_PASSWORD=secret`                |
| `{NAME}_DB_DATABASE`            | Redis database number (0-15)         | `CACHE_DB_DATABASE=0`                     |
| `{NAME}_DB_TLS`                 | Enable TLS connection (optional)     | `CACHE_DB_TLS=true`                       |

**Examples:**

```bash
# Production PostgreSQL database
export PROD_DB_TYPE=postgresql
export PROD_DB_HOST=prod-db.company.com
export PROD_DB_PORT=5432
export PROD_DB_NAME=production_db
export PROD_DB_USER=prod_user
export PROD_DB_PASSWORD=prod_password
export PROD_DB_SSL=true

# Development MySQL database
export DEV_DB_TYPE=mysql
export DEV_DB_HOST=localhost
export DEV_DB_PORT=3306
export DEV_DB_NAME=dev_db
export DEV_DB_USER=dev_user
export DEV_DB_PASSWORD=dev_password

# Analytics PostgreSQL database
export ANALYTICS_DB_TYPE=postgresql
export ANALYTICS_DB_HOST=analytics-db.company.com
export ANALYTICS_DB_PORT=5432
export ANALYTICS_DB_NAME=analytics_db
export ANALYTICS_DB_USER=analytics_user
export ANALYTICS_DB_PASSWORD=analytics_password

# DynamoDB database
export DYNAMO_DB_TYPE=dynamodb
export DYNAMO_DB_REGION=us-east-1
export DYNAMO_DB_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
export DYNAMO_DB_SECRET_ACCESS_KEY=your-secret-access-key

# DynamoDB Local (for development)
export DYNAMO_LOCAL_DB_TYPE=dynamodb
export DYNAMO_LOCAL_DB_REGION=us-east-1
export DYNAMO_LOCAL_DB_ACCESS_KEY_ID=test
export DYNAMO_LOCAL_DB_SECRET_ACCESS_KEY=test
export DYNAMO_LOCAL_DB_ENDPOINT=http://localhost:8000

# Redis cache
export CACHE_DB_TYPE=redis
export CACHE_DB_HOST=localhost
export CACHE_DB_PORT=6379
export CACHE_DB_PASSWORD=secret
export CACHE_DB_DATABASE=0
```

**🔒 Security Advantage**: This pattern allows you to configure multiple databases securely using only environment
variables, avoiding the need for configuration files that AI agents might access.

### Configuration File Format

The configuration file supports multiple database connections:

#### SQL Databases (PostgreSQL, MySQL)

```json
{
	"connection_name": {
		"type": "postgresql",
		"host": "database-host",
		"port": 5432,
		"database": "database_name",
		"user": "username",
		"password": "password",
		"ssl": false,
		"maxConnections": 5,
		"idleTimeout": 60000,
		"connectionTimeout": 5000,
		"acquireTimeout": 5000
	}
}
```

#### DynamoDB

```json
{
	"dynamodb_connection": {
		"type": "dynamodb",
		"region": "us-east-1",
		"accessKeyId": "AKIAXXXXXXXXXXXXXXXX",
		"secretAccessKey": "your-secret-access-key",
		"endpoint": "http://localhost:8000"
	}
}
```

**DynamoDB Configuration Parameters:**
- `type`: Must be "dynamodb" or "dynamo"
- `region`: AWS region (required, e.g., "us-east-1", "eu-west-1")
- `accessKeyId`: AWS access key ID (required)
- `secretAccessKey`: AWS secret access key (required)
- `endpoint`: Custom endpoint URL (optional, for local development with DynamoDB Local)

#### Redis

```json
{
	"redis_connection": {
		"type": "redis",
		"host": "localhost",
		"port": 6379,
		"password": "secret",
		"database": 0,
		"tls": false
	}
}
```

**Redis Configuration Parameters:**
- `type`: Must be "redis"
- `host`: Redis hostname (required)
- `port`: Redis port (optional, default: 6379)
- `password`: Redis password (optional)
- `database`: Redis database number 0-15 (optional, default: 0)
- `tls`: Enable TLS/SSL connection (optional, default: false)

### Configuration Loading Behavior

Configuration is loaded automatically in **priority order** - the system uses the **first existing file** and stops
looking:

1. `./database-config.json` (highest priority)
2. `./config.json`
3. Path specified in `DATABASE_CONFIG_PATH` environment variable (lowest priority)

**Important:** Only **one configuration file** is loaded - there's no merging between files.

### Environment Variables vs Configuration Files

Environment variables work differently from configuration files:

- **Configuration files**: Define named connections (e.g., "production", "staging")
- **Environment variables**: Always create a "default" connection that supplements any file-based config

### Configuration Examples

#### Example 1: File Priority

```bash
# If both files exist:
./database-config.json  ← This file is loaded
./config.json           ← This file is ignored
```

#### Example 2: Environment Variables + File

**File: `database-config.json`**

```json
{
	"production": {
		"type": "postgresql",
		"host": "prod-db.com",
		"port": 5432,
		"database": "prod_db",
		"user": "prod_user",
		"password": "prod_pass",
		"ssl": true
	}
}
```

**Environment Variables:**

```bash
export DB_HOST=localhost
export DB_USER=dev_user
export DB_PASSWORD=dev_pass
export DB_NAME=dev_db
```

**Result:** Two connections available:

- `production` (from file)
- `default` (from environment variables)

## MCP Tools

The server exposes the following tools for AI interaction:

### Connection Management

#### `connect_database`

Connect to a database with specified configuration.

```json
{
	"name": "connect_database",
	"arguments": {
		"type": "postgresql",
		"name": "myapp",
		"host": "localhost",
		"port": 5432,
		"database": "myapp_db",
		"user": "username",
		"password": "password",
		"ssl": false,
		"maxConnections": 5,
		"idleTimeout": 60000,
		"connectionTimeout": 5000,
		"acquireTimeout": 5000
	}
}
```

**Parameters:**

- `type` (required): Database type (`postgresql`, `postgres`, `pg`, `mysql`, `mysql2`)
- `host` (required): Database hostname or IP address
- `database` (required): Database name
- `user` (required): Database user
- `password` (required): Database password
- `name` (optional): Connection name (auto-generated if not provided)
- `port` (optional): Database port (uses default for database type)
- `ssl` (optional): Use SSL connection (default: false)
- `maxConnections` (optional): Maximum connections in pool (default: 5)
- `idleTimeout` (optional): Idle connection timeout in milliseconds (default: 60000)
- `connectionTimeout` (optional): Connection timeout in milliseconds (default: 5000)
- `acquireTimeout` (optional): Connection acquire timeout in milliseconds (default: 5000)

#### `connect_from_config`

Connect to a database using a named configuration from config file.

```json
{
	"name": "connect_from_config",
	"arguments": {
		"configName": "production",
		"connectionName": "prod-db"
	}
}
```

**Parameters:**

- `configName` (optional): Name of the connection configuration (defaults to "default")
- `connectionName` (optional): Custom name for this connection (will use configName if not provided)

#### `list_connections`

List all active database connections.

```json
{
	"name": "list_connections"
}
```

**Returns:**

- Array of connection objects with name, type, host, database, and status

#### `test_connection`

Test the connectivity of a database connection.

```json
{
	"name": "test_connection",
	"arguments": {
		"connection": "myapp"
	}
}
```

**Parameters:**

- `connection` (required): Connection name

**Returns:**

- Connection test result with success status and message

#### `close_connection`

Close a database connection.

```json
{
	"name": "close_connection",
	"arguments": {
		"connection": "myapp"
	}
}
```

**Parameters:**

- `connection` (required): Connection name

#### `connection_info`

Get detailed information about a specific connection.

```json
{
	"name": "connection_info",
	"arguments": {
		"connection": "myapp"
	}
}
```

**Parameters:**

- `connection` (required): Connection name

**Returns:**

- Connection details including name, type, host, database, user, and timestamps

### Query Operations

#### `execute_query`

Execute a SQL query on a connected database.

```json
{
	"name": "execute_query",
	"arguments": {
		"connection": "myapp",
		"sql": "SELECT * FROM users WHERE created_at > $1 LIMIT $2",
		"params": [
			"2024-01-01",
			10
		]
	}
}
```

**Parameters:**

- `connection` (required): Connection name
- `sql` (required): SQL query to execute
- `params` (optional): Query parameters array for parameterized queries

**Returns:**

- Query results with data, row count, and execution metadata

### Configuration Management

#### `show_configurations`

Show all database configurations available in the config file that can be used with connect_from_config.

```json
{
	"name": "show_configurations"
}
```

**Returns:**

- Object containing all available configurations with their details (excluding passwords)

### Backup and Migration

#### `export_connections`

Export connection configurations for backup or migration.

```json
{
	"name": "export_connections"
}
```

**Returns:**

- Object containing all active connection configurations with metadata (excluding passwords for security)

#### `import_connections`

Import connection configurations from backup.

```json
{
	"name": "import_connections",
	"arguments": {
		"connections": {
			"imported_db": {
				"type": "postgresql",
				"host": "new-server.example.com",
				"port": 5432,
				"database": "imported_db",
				"user": "db_user",
				"ssl": true
			},
			"another_db": {
				"type": "mysql",
				"host": "mysql.example.com",
				"port": 3306,
				"database": "app_db",
				"user": "mysql_user"
			}
		},
		"overwrite": false
	}
}
```

**Parameters:**

- `connections` (required): Object containing connection configurations to import
- `overwrite` (optional): Whether to overwrite existing connections with same name (default: false)

**Returns:**

- Import results with success/failure status for each connection and summary statistics

**Note:** Imported configurations are validated but not automatically connected. You'll need to provide passwords when
establishing connections using `connect_database` with the imported configuration details.

## Command Line Interface

### Start Server

```bash
# Basic start
npx mcp-database-server

# With debug logging
LOG_LEVEL=DEBUG npx mcp-database-server

# Set log level via command line
npx mcp-database-server --log-level DEBUG

# Show configuration status
npx mcp-database-server config

# List available tools
npx mcp-database-server tools
```

### Test Connection

```bash
# Test specific connection
npx mcp-database-server test --type postgresql --host db.example.com --port 5432 --database myapp --user dbuser --password dbpass
```

### List Available Tools

```bash
npx mcp-database-server tools
```

## Architecture & Project Structure

### Clean Layered Architecture

The Database MCP Server follows clean layered architecture principles with extensible driver patterns:

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
                                    ┌─────────────────-┼─────────────────┐
                                    │                  │                 │
                              ┌─────┴─────┐  ┌────────-┴────────┐ ┌─────-┴─────┐
                              │PostgreSQL │  │     MySQL        │ │  Future    │
                              │  Driver   │  │    Driver        │ │  Drivers   │
                              └─────┬─────┘  └────────┬────────-┘ └─────┬─────-┘
                                    │                 │                 │
                              ┌─────┴─────┐  ┌────────┴────────┐ ┌─────-┴─────┐
                              │PostgreSQL │  │     MySQL       │ │   Other    │
                              │Connection │  │   Connection    │ │ Databases  │
                              │   Pool    │  │     Pool        │ │            │
                              └───────────┘  └─────────────────┘ └───────────-┘
```

### Project Structure

```
database-mcp-server/
├── 📁 bin/
│   └── cli.js                     # Command-line interface entry point
├── 📁 src/
│   ├── 📁 database/               # Database layer
│   │   ├── manager.js             # Connection pool manager
│   │   └── 📁 drivers/            # Database-specific implementations
│   │       ├── base.js            # Abstract base driver
│   │       ├── postgresql.js      # PostgreSQL driver
│   │       ├── mysql.js           # MySQL driver
│   │       └── index.js           # Driver factory and registry
│   ├── 📁 mcp/                    # MCP protocol layer
│   │   ├── tools.js               # MCP tool definitions
│   │   └── handlers.js            # Tool implementation handlers
│   ├── 📁 utils/                  # Shared utilities
│   │   ├── logger.js              # Structured logging
│   │   └── config.js              # Configuration management
│   └── server.js                  # MCP server entry point
├── 📁 examples/                   # Usage examples
├── 📁 test/                       # Test suite
├── package.json                   # Project metadata and dependencies
├── CLAUDE.md                      # Development documentation
└── README.md                      # User documentation
```

### Architecture Benefits

- **🏗️ Clean Separation**: Infrastructure, business logic, and coordination layers
- **🔄 Extensible Drivers**: Uses inheritance to support different database types with shared functionality
- **🔓 Open/Closed Principle**: Open for extension (new drivers) but closed for modification (core unchanged)
- **🎯 Single Responsibility**: Each component has a focused, well-defined purpose
- **🧪 Testable Design**: Clean abstractions enable comprehensive testing
- **📈 Scalable**: Easy to extend with new database drivers and operations
- **🛡️ Reliable**: Connection pooling and health monitoring for production use

## Development

### Adding New Database Drivers

1. **Create driver class** extending `BaseDriver` in `src/database/drivers/`
2. **Implement required methods**: `connect()`, `query()`, `getSchema()`, `getConnectionString()`
3. **Register driver** in `src/database/drivers/index.js`
4. **Add database-specific dependencies** to `package.json`

Example:

```javascript
// src/database/drivers/mongodb.js
import {BaseDriver} from './base.js'

export class MongoDBDriver extends BaseDriver {
	async connect() {
		// MongoDB-specific connection logic
	}

	async query(query, params) {
		// MongoDB query execution
	}

	async getSchema() {
		// MongoDB schema introspection
	}

	getConnectionString() {
		// MongoDB connection string format
	}
}
```

### Adding New MCP Tools

1. **Define tool schema** in `src/mcp/tools.js`
2. **Implement handler method** in `src/mcp/handlers.js`
3. **Add tests** for new functionality

Example:

```javascript
// src/mcp/handlers.js
async
handleNewTool(args)
{
	try {
		const connection = this.dbManager.getConnection(args.connection)
		const result = await connection.driver.newOperation(args.param)

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

### Testing

This project uses **integration-first testing** with real PostgreSQL and MySQL databases via Docker Compose, ensuring
tests catch real-world database behaviors, connection pooling issues, and database-specific quirks.

**🎯 Testing Philosophy**: Test against actual database instances rather than mocks to validate production-ready
reliability.

```bash
# Complete automated test cycle (recommended)
npm run test:full

# Manual test environment setup
npm run test:setup       # Start PostgreSQL + MySQL containers
npm run test:integration # Run integration tests
npm run test:teardown    # Stop containers

# Standard testing commands
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage
```

**Test Structure**:

- **Integration tests**: DatabaseManager with real databases (PostgreSQL/MySQL specific)
- **Concrete assertions**: Use exact values (`expect(result.rowCount).toBe(2)`) vs vague checks
- **Test isolation**: Unique table/connection names per test to prevent interference

## Security Considerations

### Credential Security

- **Environment Variables vs Configuration Files**:
    - **🔒 Environment Variables (Recommended)**: More secure since they're isolated to the MCP server process and not
      accessible via filesystem
    - **⚠️ Configuration Files**: AI agents can potentially read configuration files through the filesystem, exposing
      sensitive credentials
    - **Best Practice**: Use environment variables for production environments and sensitive credentials

- **No persistent credential storage**: Database credentials are only held in memory during active connections and are
  never persisted to disk
- **Runtime credential management**: Passwords can be provided dynamically via `connect_database` tool calls without
  being stored in configuration

### Connection Security

- **Connection isolation**: Each named connection is completely isolated from others, preventing cross-connection data
  access
- **SSL/TLS support**: Both PostgreSQL and MySQL drivers support encrypted connections when SSL is enabled
- **Parameter binding**: All SQL queries use parameterized statements to prevent SQL injection attacks
- **Resource limits**: Configurable connection pool limits prevent resource exhaustion attacks

### AI Agent Security Considerations

- **File system access**: AI agents using this MCP server may have access to read files in the working directory
- **Query inspection**: AI agents can see and modify SQL queries before execution
- **Connection information**: Connection metadata (excluding passwords) is visible to AI agents
- **Credential isolation**: Use environment variables to keep sensitive credentials outside of AI agent filesystem
  access

### Production Security Recommendations

1. **Use environment variables** for all sensitive configuration data
2. **Enable SSL connections** for all database connections in production
3. **Implement database-level access controls** and use dedicated database users with minimal required privileges
4. **Monitor query execution** and implement query logging for audit trails
5. **Use connection pooling limits** to prevent resource exhaustion
6. **Regularly rotate database credentials** and update environment variables accordingly

## Troubleshooting

### Common Issues

1. **Connection refused**: Check if the database server is running and accessible
2. **Authentication failed**: Verify username and password
3. **SSL errors**: Ensure SSL configuration matches database requirements
4. **Port conflicts**: Verify the database port is correct
5. **Network issues**: Check firewall and network connectivity

### Debug Mode

Enable debug logging for detailed information:

```bash
LOG_LEVEL=DEBUG npx mcp-database-server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- **GitHub Issues**: https://github.com/mradovic95/database-mcp-server/issues
- **Documentation**: See the examples directory for usage examples
- **MCP Protocol**: https://modelcontextprotocol.io
