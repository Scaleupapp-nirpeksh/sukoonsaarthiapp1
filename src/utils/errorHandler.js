/**
 * Error Handler Utility
 * Centralized error handling and logging
 */

const { logger } = require('../middleware/logger');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express middleware for handling errors
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Get error details
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || {};
  
  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${message}`, {
      path: req.path,
      method: req.method,
      error: err.stack,
      details
    });
  } else {
    logger.warn(`[${statusCode}] ${message}`, {
      path: req.path,
      method: req.method,
      details
    });
  }
  
  // Send response to client
  res.status(statusCode).json({
    error: {
      status: statusCode,
      message,
      ...(process.env.NODE_ENV === 'development' && { details, stack: err.stack })
    }
  });
};

/**
 * Async handler to wrap async route handlers
 * Eliminates the need for try/catch blocks in routes
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create a new API error
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {APIError} New API error
 */
const createError = (message, statusCode = 500, details = {}) => {
  return new APIError(message, statusCode, details);
};

// Common error creators
const badRequest = (message, details = {}) => createError(message, 400, details);
const unauthorized = (message = 'Unauthorized', details = {}) => createError(message, 401, details);
const forbidden = (message = 'Forbidden', details = {}) => createError(message, 403, details);
const notFound = (message = 'Resource not found', details = {}) => createError(message, 404, details);
const internalError = (message = 'Internal Server Error', details = {}) => createError(message, 500, details);

module.exports = {
  APIError,
  errorHandler,
  asyncHandler,
  createError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  internalError
};