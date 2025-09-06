export const TOOLS = [
  {
    name: "connect_database",
    description: "Connect to a database with the specified configuration",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Database type (postgresql, mysql)",
          enum: ["postgresql", "postgres", "pg", "mysql", "mysql2"]
        },
        name: {
          type: "string",
          description: "Connection name (optional, will be auto-generated if not provided)"
        },
        host: {
          type: "string",
          description: "Database host"
        },
        port: {
          type: "number",
          description: "Database port (optional, uses default for database type)"
        },
        database: {
          type: "string",
          description: "Database name"
        },
        user: {
          type: "string",
          description: "Database user"
        },
        password: {
          type: "string",
          description: "Database password"
        },
        ssl: {
          type: "boolean",
          description: "Use SSL connection (optional)"
        },
        maxConnections: {
          type: "number",
          description: "Maximum number of connections in pool (optional)"
        }
      },
      required: ["type", "host", "database", "user", "password"]
    }
  },
  {
    name: "execute_query",
    description: "Execute a SQL query on a connected database",
    inputSchema: {
      type: "object",
      properties: {
        connection: {
          type: "string",
          description: "Connection name"
        },
        sql: {
          type: "string",
          description: "SQL query to execute"
        },
        params: {
          type: "array",
          description: "Query parameters (optional)",
          items: {
            type: ["string", "number", "boolean", "null"]
          }
        }
      },
      required: ["connection", "sql"]
    }
  },
  {
    name: "list_connections",
    description: "List all active database connections",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "test_connection",
    description: "Test the connectivity of a database connection",
    inputSchema: {
      type: "object",
      properties: {
        connection: {
          type: "string",
          description: "Connection name"
        }
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
        connection: {
          type: "string",
          description: "Connection name"
        }
      },
      required: ["connection"]
    }
  },
  {
    name: "connection_info",
    description: "Get detailed information about a specific connection",
    inputSchema: {
      type: "object",
      properties: {
        connection: {
          type: "string",
          description: "Connection name"
        }
      },
      required: ["connection"]
    }
  }
]