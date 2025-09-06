import { DatabaseManager } from '../database/manager.js'
import { logger } from '../utils/logger.js'

export class ToolHandlers {
  constructor() {
    this.dbManager = new DatabaseManager()
  }

  async handleConnectDatabase(args) {
    try {
      logger.info(`Connecting to ${args.type} database at ${args.host}:${args.port || 'default'}`)
      const result = await this.dbManager.connect(args)
      logger.info(`Successfully connected to database: ${result.name}`)
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              connection: result,
              message: `Successfully connected to ${args.type} database as '${result.name}'`
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Failed to connect to database: ${error.message}`)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }
        ],
        isError: true
      }
    }
  }

  async handleExecuteQuery(args) {
    try {
      logger.info(`Executing query on connection '${args.connection}': ${args.sql.substring(0, 100)}${args.sql.length > 100 ? '...' : ''}`)
      const result = await this.dbManager.executeQuery(args.connection, args.sql, args.params || [])
      logger.info(`Query executed successfully, returned ${result.rowCount} rows`)
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              data: result,
              query: args.sql,
              connection: args.connection
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Query execution failed: ${error.message}`)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              query: args.sql,
              connection: args.connection
            }, null, 2)
          }
        ],
        isError: true
      }
    }
  }

  async handleListConnections() {
    try {
      const connections = this.dbManager.listConnections()
      logger.info(`Listed ${connections.length} active connections`)
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              connections,
              count: connections.length
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Failed to list connections: ${error.message}`)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }
        ],
        isError: true
      }
    }
  }


  async handleTestConnection(args) {
    try {
      logger.info(`Testing connection '${args.connection}'`)
      const result = await this.dbManager.testConnection(args.connection)
      logger.info(`Connection test result: ${result.success ? 'success' : 'failed'}`)
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Connection test failed: ${error.message}`)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              connection: args.connection
            }, null, 2)
          }
        ],
        isError: true
      }
    }
  }

  async handleCloseConnection(args) {
    try {
      logger.info(`Closing connection '${args.connection}'`)
      const result = await this.dbManager.disconnect(args.connection)
      logger.info(`Successfully closed connection '${args.connection}'`)
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              result,
              message: `Connection '${args.connection}' closed successfully`
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Failed to close connection: ${error.message}`)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              connection: args.connection
            }, null, 2)
          }
        ],
        isError: true
      }
    }
  }

  async handleConnectionInfo(args) {
    try {
      logger.info(`Getting info for connection '${args.connection}'`)
      const info = this.dbManager.getConnectionInfo(args.connection)
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              info
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Failed to get connection info: ${error.message}`)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              connection: args.connection
            }, null, 2)
          }
        ],
        isError: true
      }
    }
  }

  async handleTool(name, args) {
    switch (name) {
      case 'connect_database':
        return this.handleConnectDatabase(args)
      case 'execute_query':
        return this.handleExecuteQuery(args)
      case 'list_connections':
        return this.handleListConnections(args)
      case 'test_connection':
        return this.handleTestConnection(args)
      case 'close_connection':
        return this.handleCloseConnection(args)
      case 'connection_info':
        return this.handleConnectionInfo(args)
      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Unknown tool: ${name}`
              }, null, 2)
            }
          ],
          isError: true
        }
    }
  }

  async cleanup() {
    logger.info('Cleaning up database connections...')
    await this.dbManager.disconnectAll()
    logger.info('Cleanup completed')
  }
}