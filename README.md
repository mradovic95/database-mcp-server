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
- **Multi-database Support**: PostgreSQL, MySQL with extensible driver architecture
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

- **PostgreSQL**
- **MySQL**

## Getting Started

### Installation

#### Via NPX (Recommended)

Run directly without installation:

```bash
npx @mihailoradovi/database-mcp-server
```

#### Via npm

```bash
npm install -g @mihailoradovi/database-mcp-server
database-mcp-server
```

### Claude Integration

#### Claude Desktop Configuration

Add the Database MCP server to your Claude Desktop by editing the MCP configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
	"mcpServers": {
		"database": {
			"command": "npx",
			"args": [
				"@mihailoradovi/database-mcp-server"
			]
		}
	}
}
```

#### Claude Web (via MCP Proxy)

For Claude Web integration, you can use an MCP proxy:

```bash
# Install and run an MCP proxy
npx @modelcontextprotocol/server-proxy
```

### Usage

#### Starting the Server

```bash
# Start with default settings (MCP mode - silent)
npx @mihailoradovi/database-mcp-server

# Start in standalone mode with console logging
npx @mihailoradovi/database-mcp-server --standalone

# Start standalone with debug logging
npx @mihailoradovi/database-mcp-server --standalone --log-level DEBUG
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

### Configuration File Format

The configuration file supports multiple database connections:

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
npx @mihailoradovi/database-mcp-server

# With debug logging
LOG_LEVEL=DEBUG npx @mihailoradovi/database-mcp-server

# Set log level via command line
npx @mihailoradovi/database-mcp-server --log-level DEBUG

# Show configuration status
npx @mihailoradovi/database-mcp-server config

# List available tools
npx @mihailoradovi/database-mcp-server tools
```

### Test Connection

```bash
# Test specific connection
npx @mihailoradovi/database-mcp-server test --type postgresql --host db.example.com --port 5432 --database myapp --user dbuser --password dbpass
```

### List Available Tools

```bash
npx @mihailoradovi/database-mcp-server tools
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

- **No credential storage**: Credentials are only held in memory during active connections
- **Connection isolation**: Each named connection is isolated from others
- **Parameter binding**: All queries support parameter binding to prevent SQL injection
- **SSL support**: Both PostgreSQL and MySQL drivers support SSL connections
- **Resource limits**: Configurable connection pool limits

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
LOG_LEVEL=DEBUG npx @mihailoradovi/database-mcp-server
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

- **GitHub Issues**: https://github.com/mihailoradovi/database-mcp-server/issues
- **Documentation**: See the examples directory for usage examples
- **MCP Protocol**: https://modelcontextprotocol.io
