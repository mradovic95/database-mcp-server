#!/usr/bin/env node

import { startServer } from '../src/server.js'
import { logger } from '../src/utils/logger.js'
import { getSupportedTypes } from '../src/database/drivers/index.js'

function showUsage() {
  console.log(`
Database MCP Server v1.0.0

A Model Context Protocol server for database connections and queries.

USAGE:
  npx @mihailoradovi/database-mcp-server [options]

OPTIONS:
  --help, -h        Show this help message
  --version, -v     Show version information
  --log-level       Set log level (DEBUG, INFO, WARN, ERROR)
  --standalone      Run in standalone mode with console logging (default: MCP mode)

SUPPORTED DATABASES:
  ${getSupportedTypes().join(', ')}

EXAMPLES:
  # Start the server (MCP mode - silent by default)
  npx @mihailoradovi/database-mcp-server

  # Start in standalone mode with console logging
  npx @mihailoradovi/database-mcp-server --standalone

  # Start standalone with debug logging
  npx @mihailoradovi/database-mcp-server --standalone --log-level DEBUG

ENVIRONMENT VARIABLES:
  MCP_MODE                  Set to 'false' to disable MCP mode (default: true)
  LOG_LEVEL                 Set logging level (DEBUG, INFO, WARN, ERROR)
  DATABASE_CONFIG_PATH      Path to database configuration file
  DB_HOST                   Default database host
  DB_PORT                   Default database port
  DB_NAME                   Default database name
  DB_USER                   Default database user
  DB_PASSWORD               Default database password
  DB_TYPE                   Default database type

For more information, visit: https://github.com/mihailoradovi/database-mcp-server
`)
}

function showVersion() {
  console.log('Database MCP Server v1.0.0')
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage()
    return
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    showVersion()
    return
  }

  const logLevelIndex = args.indexOf('--log-level')
  if (logLevelIndex !== -1 && args[logLevelIndex + 1]) {
    process.env.LOG_LEVEL = args[logLevelIndex + 1].toLowerCase()
  }

  try {
    logger.info('Database MCP Server starting...')
    await startServer()
  } catch (error) {
    logger.error('Failed to start server:', error)
    console.error('Error: Failed to start Database MCP Server')
    console.error(error.message)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Unhandled error in main:', error)
    process.exit(1)
  })
}