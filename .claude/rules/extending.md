# Extending the Server

## Adding New Database Types

The server now supports PostgreSQL, MySQL, and DynamoDB. To add additional database types (e.g., MongoDB, Redis), follow these steps:

### 1. Create Driver Class

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

### 2. Register Driver

```javascript
// src/database/drivers/index.js
import {MongoDBDriver} from './mongodb.js'

export const SUPPORTED_DRIVERS = {
	mongodb: MongoDBDriver,
	mongo: MongoDBDriver,
	// ... existing drivers
}
```

### 3. Add Dependencies

```json
// package.json
{
	"dependencies": {
		"mongodb": "^6.0.0"
	}
}
```

### 4. Update Configuration Manager (if needed)

For databases with unique configuration parameters (like DynamoDB's AWS credentials), update `src/utils/config.js` to handle new environment variable patterns.

**Reference Implementation**: See `src/database/drivers/dynamodb.js` for a complete example of a NoSQL driver with AWS SDK integration.

## Adding New MCP Tools

### 1. Define Tool Schema

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

### 2. Implement Handler

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
