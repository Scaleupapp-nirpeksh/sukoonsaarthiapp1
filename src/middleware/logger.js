/**
 * Logger Middleware
 * Centralized logging setup using Winston
 */

const winston = require('winston');
const { format, transports } = winston;

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'sukoon-saarthi' },
  transports: [
    // Write to all logs with level 'info' and below to combined.log
    new transports.File({ filename: 'logs/combined.log' }),
    
    // Write all logs with level 'error' and below to error.log
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    
    // Console logging based on environment
    ...(process.env.NODE_ENV !== 'production'
      ? [
          // Colorized console logs in development
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.printf(
                info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
              )
            )
          })
        ]
      : [
          // Plain console logs in production
          new transports.Console({
            format: format.combine(
              format.printf(
                info => `${info.timestamp} ${info.level}: ${info.message}`
              )
            )
          })
        ])
  ]
});

/**
 * HTTP request logging middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log once request is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};

module.exports = {
  logger,
  requestLogger
};