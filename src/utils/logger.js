import winston from 'winston'

const isMCPMode = process.env.MCP_MODE !== 'false' && !process.argv.includes('--standalone')

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
  silent: isMCPMode
})

export { logger }