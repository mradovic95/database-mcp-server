# Database MCP Server

A Node.js Model Context Protocol (MCP) server that provides runtime database connections with support for multiple database types. This server allows AI assistants like Claude to connect to and query databases dynamically during conversations.

## Features

- **Multi-database support**: PostgreSQL, MySQL with easy extensibility
- **Runtime connections**: Connect to databases on-demand during conversations
- **Connection pooling**: Efficient connection management with configurable pool sizes
- **Schema introspection**: Get table and column information
- **Query execution**: Run SQL queries with parameter binding
- **Connection management**: List, test, and close database connections
- **NPX ready**: Easy installation and usage via NPX

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

## MCP Tools

The server provides the following tools for AI assistants:

### connect_database
Connect to a database with specified configuration.

**Parameters:**
- `type` (required): Database type (`postgresql`, `mysql`)
- `host` (required): Database host
- `database` (required): Database name
- `user` (required): Database user
- `password` (required): Database password
- `name` (optional): Connection name (auto-generated if not provided)
- `port` (optional): Database port (uses default for database type)
- `ssl` (optional): Use SSL connection
- `maxConnections` (optional): Maximum connections in pool

**Example:**
```json
{
  "type": "postgresql",
  "name": "myapp",
  "host": "localhost",
  "port": 5432,
  "database": "myapp_db",
  "user": "username",
  "password": "password",
  "ssl": false
}
```

### execute_query
Execute a SQL query on a connected database.

**Parameters:**
- `connection` (required): Connection name
- `sql` (required): SQL query to execute
- `params` (optional): Query parameters array

**Example:**
```json
{
  "connection": "myapp",
  "sql": "SELECT * FROM users WHERE created_at > $1 LIMIT $2",
  "params": ["2024-01-01", 10]
}
```

### list_connections
List all active database connections.

**Returns:**
- Array of connection objects with name, type, host, database, and status

### describe_schema
Get schema information (tables and columns) for a database connection.

**Parameters:**
- `connection` (required): Connection name

**Returns:**
- Object with table names as keys and table schema information as values

### test_connection
Test the connectivity of a database connection.

**Parameters:**
- `connection` (required): Connection name

**Returns:**
- Connection test result with success status and message

### close_connection
Close a database connection.

**Parameters:**
- `connection` (required): Connection name

### connection_info
Get detailed information about a specific connection.

**Parameters:**
- `connection` (required): Connection name

**Returns:**
- Connection details including name, type, host, database, user, and timestamps

## Configuration File

You can use a JSON configuration file to pre-define database connections:

```json
{
  "default": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "myapp",
    "user": "username",
    "password": "password",
    "ssl": false,
    "maxConnections": 10
  },
  "analytics": {
    "type": "mysql",
    "host": "analytics-db.example.com",
    "port": 3306,
    "database": "analytics",
    "user": "analytics_user",
    "password": "analytics_password",
    "ssl": true
  }
}
```

Save this as `database-config.json` in your working directory, or specify the path with `DATABASE_CONFIG_PATH`.

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

## Architecture

### Driver System
- **Base Driver**: Abstract class defining the interface for all database drivers
- **Database-specific drivers**: Implement connection, querying, and schema operations
- **Driver registry**: Manages available drivers and creates instances

### Connection Management
- **Database Manager**: Handles multiple named connections
- **Connection pooling**: Each connection uses a connection pool for efficiency
- **Resource cleanup**: Automatic cleanup on server shutdown

### MCP Integration
- **Tool definitions**: JSON schema definitions for all available tools
- **Tool handlers**: Business logic for each tool
- **Error handling**: Consistent error responses in MCP format

## Development

### Project Structure
```
database-mcp-server/
├── bin/cli.js                    # NPX entry point
├── src/
│   ├── server.js                 # Main MCP server
│   ├── database/
│   │   ├── manager.js            # Connection pool manager
│   │   └── drivers/
│   │       ├── base.js           # Abstract base driver
│   │       ├── postgresql.js     # PostgreSQL driver
│   │       ├── mysql.js          # MySQL driver
│   │       └── index.js          # Driver registry
│   ├── mcp/
│   │   ├── tools.js              # MCP tool definitions
│   │   └── handlers.js           # Tool request handlers
│   └── utils/
│       ├── logger.js             # Logging utility
│       └── config.js             # Configuration management
├── examples/
└── test/
```

### Adding New Database Drivers

1. **Create a new driver class** extending `BaseDriver`
2. **Implement required methods**: `connect()`, `query()`, `getSchema()`, `getConnectionString()`
3. **Register the driver** in `src/database/drivers/index.js`
4. **Add database-specific dependencies** to `package.json`

Example:
```javascript
import { BaseDriver } from './base.js'

export class NewDatabaseDriver extends BaseDriver {
  async connect() {
    // Implementation
  }
  
  async query(sql, params) {
    // Implementation
  }
  
  async getSchema() {
    // Implementation
  }
  
  getConnectionString() {
    // Implementation
  }
}
```

### Testing

```bash
npm test
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