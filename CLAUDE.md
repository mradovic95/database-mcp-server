# Database MCP Server

Model Context Protocol (MCP) server enabling AI assistants to connect to and query databases.

## Quick Reference

**Commands:**
- `npm test` - Run all tests
- `npm run test:full` - Full test cycle with Docker databases
- `npm run test:setup` - Start test databases
- `npm run test:teardown` - Stop test databases

**Key Files:**
- `bin/cli.js` - CLI entry point
- `src/server.js` - MCP protocol handler
- `src/database/manager.js` - Connection coordinator
- `src/database/drivers/` - Database-specific implementations (PostgreSQL, MySQL, DynamoDB, Redis)
- `src/mcp/tools.js` - Tool definitions
- `src/mcp/handlers.js` - Tool implementations
- `src/utils/config.js` - Configuration loading
- `src/utils/logger.js` - Structured logging

## Supported Databases

| Database | Driver | Query Language |
|----------|--------|----------------|
| PostgreSQL | pg | SQL with $1, $2 params |
| MySQL | mysql2 | SQL with ? params |
| DynamoDB | AWS SDK | PartiQL |
| Redis | ioredis | Native commands |

## Documentation

Detailed documentation is split into focused rule files in `.claude/rules/`:

- **architecture.md** - System architecture, layers, and design patterns
- **configuration.md** - Configuration system, environment variables
- **development.md** - Code organization, error handling, security
- **testing.md** - Testing strategy, standards, examples
- **extending.md** - Adding new drivers and tools
- **operations.md** - Monitoring, deployment, common pitfalls
