import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { TOOLS } from './mcp/tools.js'
import { ToolHandlers } from './mcp/handlers.js'
import { logger } from './utils/logger.js'
import { getSupportedTypes } from './database/drivers/index.js'

class DatabaseMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mcp-database-server',
        version: '1.0.0',
        description: 'MCP server for database connections and queries'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    )

    this.toolHandlers = new ToolHandlers()
    this.setupHandlers()
    this.setupErrorHandlers()
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Listing available tools')
      return {
        tools: TOOLS.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      }
    })

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params
      logger.debug(`Tool called: ${name}`)
      
      try {
        const result = await this.toolHandlers.handleTool(name, args || {})
        return result
      } catch (error) {
        logger.error(`Tool execution error for ${name}:`, error)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Tool execution failed: ${error.message}`,
                tool: name
              }, null, 2)
            }
          ],
          isError: true
        }
      }
    })
  }

  setupErrorHandlers() {
    this.server.onerror = (error) => {
      logger.error('[MCP Server] Error occurred:', error)
    }

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...')
      await this.shutdown()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...')
      await this.shutdown()
      process.exit(0)
    })

    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception:', error)
      await this.shutdown()
      process.exit(1)
    })

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason)
      await this.shutdown()
      process.exit(1)
    })
  }

  async start() {
    const transport = new StdioServerTransport()
    logger.info('Starting Database MCP Server...')
    logger.info(`Supported database types: ${getSupportedTypes().join(', ')}`)
    
    await this.server.connect(transport)
    logger.info('Database MCP Server started and ready for connections')
  }

  async shutdown() {
    logger.info('Shutting down Database MCP Server...')
    try {
      await this.toolHandlers.cleanup()
      logger.info('Database MCP Server shutdown complete')
    } catch (error) {
      logger.error('Error during shutdown:', error)
    }
  }
}

export { DatabaseMCPServer }

export async function startServer() {
  const server = new DatabaseMCPServer()
  await server.start()
  return server
}