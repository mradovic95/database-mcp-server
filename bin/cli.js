#!/usr/bin/env node

import {Command} from 'commander'
import {startServer} from '../src/server.js'
import {logger} from '../src/utils/logger.js'
import {getSupportedTypes} from '../src/database/drivers/index.js'

const program = new Command()

program
	.name('mcp-database-server')
	.description('Database MCP Server for AI integration\n\nA Model Context Protocol server for database connections and queries.\n\nSUPPORTED DATABASES:\n  ' + getSupportedTypes().join(', ') + '\n\nENVIRONMENT VARIABLES:\n  MCP_MODE                 Set to "false" to disable MCP mode\n  LOG_LEVEL               Set logging level (DEBUG, INFO, WARN, ERROR)\n  DATABASE_CONFIG_PATH    Path to database configuration file\n  DB_HOST                 Default database host\n  DB_PORT                 Default database port\n  DB_NAME                 Default database name\n  DB_USER                 Default database user\n  DB_PASSWORD             Default database password\n  DB_TYPE                 Default database type')
	.version('1.0.0')
	.option('--log-level <level>', 'Log level (error, warn, info, debug)', 'info')
	.option('--standalone', 'Run in standalone mode with console logging (default: MCP mode)')
	.action(async (options) => {
		try {
			// Setup logging level
			const logLevel = options.logLevel || 'info'
			if (logLevel) {
				process.env.LOG_LEVEL = logLevel.toLowerCase()
			}

			if (options.standalone) {
				process.env.MCP_MODE = 'false'
			}

			logger.info('Database MCP Server starting...', {logLevel, supportedTypes: getSupportedTypes()})

			// Create and start MCP server
			const server = await startServer()

			logger.info('Database MCP Server is ready and listening on stdio')

			// Log available tools in debug mode
			if (logLevel === 'debug') {
				logger.debug('Server status', {
					supportedDatabases: getSupportedTypes()
				})
			}

		} catch (error) {
			console.error('Failed to start server:', error.message)
			process.exit(1)
		}
	})

// Add command to show supported database types
program
	.command('types')
	.description('Show supported database types')
	.action(async () => {
		console.log('Supported Database Types:')
		console.log('========================')
		getSupportedTypes().forEach(type => {
			console.log(`- ${type}`)
		})
	})

// Parse command line arguments
program.parse()

// If no command was provided and no options were given, show help
const parsedOptions = program.opts()
const hasOptions = Object.keys(parsedOptions).length > 0
const hasCommand = program.args.length > 0

if (!hasOptions && !hasCommand && process.argv.length <= 2) {
	program.help()
}
