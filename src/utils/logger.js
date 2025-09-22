import winston from 'winston'

const isMCPMode = process.env.MCP_MODE !== 'false' && !process.argv.includes('--standalone')

// Create a silent logger for MCP mode that doesn't attempt to write anything
const logger = winston.createLogger({
  level: isMCPMode ? 'silent' : (process.env.LOG_LEVEL?.toLowerCase() || 'info'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: isMCPMode ? [] : [
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug', 'verbose', 'silly']
    })
  ],
  // Prevent winston from complaining about no transports in MCP mode
  silent: isMCPMode
})

// Override all logging methods in MCP mode to be completely silent
if (isMCPMode) {
  const noOp = () => {}
  logger.error = noOp
  logger.warn = noOp
  logger.info = noOp
  logger.debug = noOp
  logger.verbose = noOp
  logger.silly = noOp
  logger.log = noOp
}

export { logger }