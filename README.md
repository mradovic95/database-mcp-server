# Database MCP Server

A Model Context Protocol (MCP) server that provides AI systems with seamless integration to database systems using connection pooling and query execution. This server exposes database operations as MCP tools, enabling AI assistants to interact with databases programmatically.

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
- *"Which tables have foreign key relationships?"* → Discover database relationships

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

## Installation

### Via NPX (Recommended)
```bash
npx @mihailoradovi/database-mcp-server
```

### Via npm
```bash
npm install -g @mihailoradovi/database-mcp-server
database-mcp-server
```

## Supported Databases

- **PostgreSQL** (`postgresql`, `postgres`, `pg`)
- **MySQL** (`mysql`, `mysql2`)

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
                                    ┌─────────────────┼─────────────────┐
                                    │                 │                 │
                              ┌─────┴─────┐  ┌────────┴────────┐ ┌─────┴─────┐
                              │PostgreSQL │  │     MySQL       │ │  Future   │
                              │  Driver   │  │    Driver       │ │  Drivers  │
                              └─────┬─────┘  └────────┬────────┘ └─────┬─────┘
                                    │                 │                 │
                              ┌─────┴─────┐  ┌────────┴────────┐ ┌─────┴─────┐
                              │PostgreSQL │  │     MySQL       │ │   Other   │
                              │Connection │  │   Connection    │ │ Databases │
                              │   Pool    │  │     Pool        │ │           │
                              └───────────┘  └─────────────────┘ └───────────┘
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
- **🔄 Strategy Pattern**: Database drivers implement common interface with specific implementations
- **🎯 Single Responsibility**: Each component has a focused, well-defined purpose
- **🧪 Testable Design**: Clean abstractions enable comprehensive testing
- **📈 Scalable**: Easy to extend with new database drivers and operations
- **🛡️ Reliable**: Connection pooling and health monitoring for production use

## Usage

### Starting the Server

```bash
# Start with default settings
npx @mihailoradovi/database-mcp-server

# Start with debug logging
LOG_LEVEL=DEBUG npx @mihailoradovi/database-mcp-server

# Set log level via command line
npx @mihailoradovi/database-mcp-server --log-level DEBUG
```

### Environment Variables

- `LOG_LEVEL`: Set logging level (DEBUG, INFO, WARN, ERROR)
- `DATABASE_CONFIG_PATH`: Path to database configuration file
- `DB_HOST`: Default database host
- `DB_PORT`: Default database port
- `DB_NAME`: Default database name
- `DB_USER`: Default database user
- `DB_PASSWORD`: Default database password
- `DB_TYPE`: Default database type

## Configuration

### Environment Variables

| Variable                | Description                         | Default       |
|-------------------------|-------------------------------------|---------------|
| `LOG_LEVEL`            | Set logging level                   | `INFO`        |
| `DATABASE_CONFIG_PATH` | Path to database configuration file | Auto-detected |
| `DB_HOST`              | Default database hostname           | `localhost`   |
| `DB_PORT`              | Default database port               | Database-specific |
| `DB_NAME`              | Default database name               | `""`          |
| `DB_USER`              | Default database user               | `""`          |
| `DB_PASSWORD`          | Default database password           | `""`          |
| `DB_TYPE`              | Default database type               | `postgresql`  |

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
    "maxConnections": 10
  }
}
```

### Configuration Loading Behavior

Configuration is loaded automatically in **priority order** - the system uses the **first existing file** and stops looking:

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

### Connection Parameters

- `type` (required): Database type (`postgresql`, `mysql`)
- `host` (required): Database hostname or IP address
- `database` (required): Database name
- `user` (required): Database user
- `password` (required): Database password
- `port` (optional): Database port (uses default for database type)
- `ssl` (optional): Enable SSL/TLS connection (default: false)
- `maxConnections` (optional): Maximum connections in pool (default: 10)

## Claude Integration

### Claude Desktop Configuration

Add the Database MCP server to your Claude Desktop by editing the MCP configuration file:

**macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

#### Option 1: Environment Variables (Simple)
```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["@mihailoradovi/database-mcp-server"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "myapp",
        "DB_USER": "username",
        "DB_PASSWORD": "password",
        "DB_TYPE": "postgresql"
      }
    }
  }
}
```

#### Option 2: Configuration File (Multiple Databases)
```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["@mihailoradovi/database-mcp-server"],
      "env": {
        "DATABASE_CONFIG_PATH": "/path/to/your/database-config.json"
      }
    }
  }
}
```

### Claude Code Configuration

Add to your `.mcp.json` file in your project root:

#### Option 1: Environment Variables (Simple)
```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["@mihailoradovi/database-mcp-server"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "myapp",
        "DB_USER": "username",
        "DB_PASSWORD": "password"
      }
    }
  }
}
```

#### Option 2: Configuration File (Multiple Databases)
```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["@mihailoradovi/database-mcp-server"],
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
    "database": "stage_db",
    "user": "stage_user",
    "password": "stage_pass",
    "ssl": true
  }
}
```

After configuration, restart Claude Desktop or reload Claude Code to enable database management capabilities.

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
    "maxConnections": 10
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
- `maxConnections` (optional): Maximum connections in pool (default: 10)

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
    "params": ["2024-01-01", 10]
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

**Note:** Imported configurations are validated but not automatically connected. You'll need to provide passwords when establishing connections using `connect_database` with the imported configuration details.

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

## Database Setup

### Quick PostgreSQL Setup with Docker

```bash
# Run PostgreSQL with sample database
docker run -d \
  --name postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_PASSWORD=testpass \
  -e POSTGRES_DB=testdb \
  postgres:latest

# Database available at localhost:5432
```

### Quick MySQL Setup with Docker

```bash
# Run MySQL with sample database
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=testdb \
  -e MYSQL_USER=testuser \
  -e MYSQL_PASSWORD=testpass \
  mysql:latest

# Database available at localhost:3306
```

### Database Configuration

The server supports multiple database types with their respective connection libraries:

- **PostgreSQL**: Uses `pg` (node-postgres) for connection pooling and query execution
- **MySQL**: Uses `mysql2` for connection pooling and prepared statements

## Example Conversation Flow

1. **Connect to a database:**
   ```
   User: "Connect to my PostgreSQL database at localhost:5432, database 'myapp', user 'admin', password 'secret'"
   ```

2. **Explore the schema:**
   ```
   User: "Show me all tables in the database"
   ```

3. **Execute queries:**
   ```
   User: "Get the first 10 users from the users table"
   User: "Count how many orders were created today"
   ```

4. **Manage connections:**
   ```
   User: "List all database connections"
   User: "Test the myapp connection"
   User: "Close the myapp connection"
   ```

5. **Backup and migration:**
   ```
   User: "Export all my database configurations for backup"
   User: "Import connections from my development environment"
   ```

## Development

### Architecture Benefits

- **Clean layered architecture**: Infrastructure, business logic, and coordination layers
- **Strategy pattern**: Database drivers implement common interface with specific implementations
- **Single responsibility**: Each component has focused, well-defined purpose
- **Testable design**: Clean abstractions enable comprehensive testing
- **Scalable**: Easy to extend with new database drivers and operations
- **Connection pooling**: Reliable connection management with health monitoring

### Adding New Database Drivers

1. **Create driver class** extending `BaseDriver` in `src/database/drivers/`
2. **Implement required methods**: `connect()`, `query()`, `getSchema()`, `getConnectionString()`
3. **Register driver** in `src/database/drivers/index.js`
4. **Add database-specific dependencies** to `package.json`

Example:
```javascript
// src/database/drivers/mongodb.js
import { BaseDriver } from './base.js'

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
async handleNewTool(args) {
  try {
    const connection = this.dbManager.getConnection(args.connection)
    const result = await connection.driver.newOperation(args.param)

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: true, result }, null, 2)
      }]
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: false, error: error.message }, null, 2)
      }],
      isError: true
    }
  }
}
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests (requires database setup)
npm run test:integration
```

### Linting

```bash
npm run lint
```

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

## Changelog

### v1.0.0
- Initial release
- PostgreSQL and MySQL support
- Connection pooling and management
- Schema introspection
- MCP tool integration
- NPX distribution ready
