# Configuration System

## Configuration Loading Strategy

The Database MCP Server follows a configuration-first, connect-on-demand approach:

- **No Auto-Connect**: Configuration is loaded at startup but connections are NOT established automatically
- **On-Demand Connection**: Use `connect_database` tool to establish connections as needed
- **Multiple Sources**: Configuration loaded from multiple file paths and environment variables
- **Multiple Database Support**: Configure multiple databases using environment variable patterns
- **Validation**: Configuration validation before connection attempts
- **Transparency**: Clear configuration loading order and precedence

## Configuration Flow

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

## Environment Variable Patterns

### Single Database Configuration (Legacy)
```bash
export DB_TYPE=postgresql
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=my_database
export DB_USER=db_user
export DB_PASSWORD=db_password
```

### Multiple Database Configuration (Recommended)
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

### DynamoDB Configuration

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

### Redis Configuration

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

## Configuration Benefits

This approach provides several benefits:

- **Security**: No automatic connections reduce attack surface
- **Flexibility**: Connect only to needed databases
- **Resource Efficiency**: Avoid unnecessary connection overhead
- **Control**: Explicit connection management
