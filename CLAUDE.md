# CLAUDE.md - Database MCP Server

## Architecture Overview

This Database MCP Server is designed as a Model Context Protocol (MCP) server that enables AI assistants like Claude to connect to and query databases during conversations. The architecture follows modern Node.js best practices with extensible, maintainable code.

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude/AI     │────│   MCP Protocol  │────│  Database MCP   │
│   Assistant     │    │   (JSON-RPC)    │    │     Server      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │ Connection      │
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

## Core Components

### 1. MCP Server (`src/server.js`)
- **Purpose**: Main entry point that handles MCP protocol communication
- **Responsibilities**: 
  - Register and expose MCP tools
  - Handle tool execution requests
  - Manage server lifecycle and error handling
  - Coordinate with tool handlers

### 2. Tool Handlers (`src/mcp/handlers.js`)
- **Purpose**: Business logic for each MCP tool
- **Pattern**: Command pattern implementation
- **Responsibilities**:
  - Execute database operations
  - Format responses for MCP protocol
  - Handle errors gracefully
  - Log operations for debugging

### 3. Database Manager (`src/database/manager.js`)
- **Purpose**: Central coordinator for all database connections
- **Pattern**: Singleton-like manager pattern
- **Responsibilities**:
  - Maintain named connection registry
  - Delegate operations to appropriate drivers
  - Connection lifecycle management
  - Resource cleanup

### 4. Driver System (`src/database/drivers/`)
- **Purpose**: Database-specific implementations
- **Pattern**: Strategy pattern with factory
- **Components**:
  - `base.js`: Abstract base class defining interface
  - `postgresql.js`: PostgreSQL-specific implementation
  - `mysql.js`: MySQL-specific implementation
  - `index.js`: Driver factory and registry

### 5. Utilities (`src/utils/`)
- **Logger**: Structured logging with levels
- **Config**: Environment and file-based configuration

## Design Patterns Used

### 1. Strategy Pattern (Drivers)
Each database type implements the same interface but with different connection logic:
```javascript
class BaseDriver {
  async connect() { throw new Error('Must implement') }
  async query() { throw new Error('Must implement') }
  async getSchema() { throw new Error('Must implement') }
}
```

### 2. Factory Pattern (Driver Creation)
```javascript
export function createDriver(type, config) {
  const DriverClass = SUPPORTED_DRIVERS[type.toLowerCase()]
  return new DriverClass(config)
}
```

### 3. Command Pattern (Tool Handlers)
Each tool is a command with consistent interface:
```javascript
async handleTool(name, args) {
  switch (name) {
    case 'connect_database': return this.handleConnectDatabase(args)
    // ...
  }
}
```

### 4. Registry Pattern (Connection Management)
```javascript
class DatabaseManager {
  constructor() {
    this.connections = new Map() // Registry of active connections
  }
}
```

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

1. **Create Driver Class**:
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
}
```

2. **Register Driver**:
```javascript
// src/database/drivers/index.js
import { MongoDBDriver } from './mongodb.js'

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

### Adding New MCP Tools

1. **Define Tool Schema**:
```javascript
// src/mcp/tools.js
{
  name: "backup_database",
  description: "Create a backup of the database",
  inputSchema: {
    type: "object",
    properties: {
      connection: { type: "string" },
      outputPath: { type: "string" }
    },
    required: ["connection", "outputPath"]
  }
}
```

2. **Implement Handler**:
```javascript
// src/mcp/handlers.js
async handleBackupDatabase(args) {
  try {
    const connection = this.dbManager.getConnection(args.connection)
    const result = await connection.driver.backup(args.outputPath)
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

## Testing Strategy

### Unit Tests
- **Driver testing**: Mock database connections, test query formatting
- **Manager testing**: Test connection lifecycle, error handling
- **Handler testing**: Mock database operations, verify MCP responses

### Integration Tests
- **Database integration**: Test with real database instances
- **MCP protocol**: Test tool execution via MCP client
- **Error scenarios**: Network failures, invalid credentials, etc.

### Example Test Structure:
```javascript
// test/drivers/postgresql.test.js
import { PostgreSQLDriver } from '../../src/database/drivers/postgresql.js'

describe('PostgreSQLDriver', () => {
  it('should connect successfully with valid config', async () => {
    const driver = new PostgreSQLDriver(validConfig)
    await expect(driver.connect()).resolves.toBeDefined()
  })
  
  it('should throw error with invalid config', async () => {
    const driver = new PostgreSQLDriver(invalidConfig)
    await expect(driver.connect()).rejects.toThrow()
  })
})
```

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
async healthCheck() {
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

This architecture provides a solid foundation for a production-ready database MCP server while maintaining simplicity and extensibility.