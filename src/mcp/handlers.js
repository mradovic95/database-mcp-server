import { DatabaseManager } from '../database/manager.js'
import { logger } from '../utils/logger.js'
import { configManager } from '../utils/config.js'

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

  async handleConnectFromConfig(args) {
    try {
      const configName = args.configName || 'default'
      const connectionName = args.connectionName || configName
      
      logger.info(`Connecting to database using config '${configName}' as connection '${connectionName}'`)
      
      const config = configManager.getConnectionConfig(configName)
      if (!config) {
        throw new Error(`Configuration '${configName}' not found in config file`)
      }

      configManager.validateConnectionConfig(config)
      
      const connectionConfig = {
        ...config,
        name: connectionName
      }
      
      const result = await this.dbManager.connect(connectionConfig)
      logger.info(`Successfully connected to database using config '${configName}': ${result.name}`)
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              connection: result,
              configUsed: configName,
              message: `Successfully connected to ${config.type} database as '${result.name}' using config '${configName}'`
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Failed to connect using config: ${error.message}`)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              configName: args.configName || 'default'
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

  async handleShowConfigurations() {
    try {
      logger.info('Retrieving all available configurations')
      const configNames = configManager.getAllConnections()

      const configurations = {}
      for (const name of configNames) {
        const config = configManager.getConnectionConfig(name)
        if (config) {
          configurations[name] = {
            type: config.type,
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            ssl: config.ssl || false,
            maxConnections: config.maxConnections
          }
        }
      }

      logger.info(`Found ${configNames.length} available configurations`)

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              configurations,
              count: configNames.length,
              message: `Found ${configNames.length} database configuration${configNames.length === 1 ? '' : 's'} available for use with connect_from_config`
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Failed to retrieve configurations: ${error.message}`)
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

  async handleExportConnections() {
    try {
      logger.info('Exporting database connections')
      const connections = this.dbManager.exportConnections()
      logger.info(`Exported ${Object.keys(connections).length} connection configurations`)

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              connections,
              exportedAt: new Date().toISOString(),
              count: Object.keys(connections).length,
              message: `Exported ${Object.keys(connections).length} database connection${Object.keys(connections).length === 1 ? '' : 's'}. Note: Passwords are not included for security reasons.`
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Failed to export connections: ${error.message}`)
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

  async handleImportConnections(args) {
    try {
      logger.info(`Importing database connections with overwrite: ${args.overwrite || false}`)
      const results = await this.dbManager.importConnections(args.connections, args.overwrite)
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      logger.info(`Import completed: ${successful} successful, ${failed} failed`)

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              importResults: results,
              importedAt: new Date().toISOString(),
              summary: {
                total: results.length,
                successful,
                failed,
                skipped: results.filter(r => r.status === 'skipped').length
              },
              message: `Import completed: ${successful} successful, ${failed} failed. Note: Imported configurations are validated but not connected - you'll need to provide passwords when connecting.`
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      logger.error(`Failed to import connections: ${error.message}`)
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

  async handleTool(name, args) {
    switch (name) {
      case 'connect_database':
        return this.handleConnectDatabase(args)
      case 'connect_from_config':
        return this.handleConnectFromConfig(args)
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
      case 'show_configurations':
        return this.handleShowConfigurations(args)
      case 'export_connections':
        return this.handleExportConnections(args)
      case 'import_connections':
        return this.handleImportConnections(args)
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