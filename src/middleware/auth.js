/**
 * Authentication Middleware
 * Handles JWT authentication and Twilio webhook validation
 */

const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const { logger } = require('./logger');
const { unauthorized } = require('../utils/errorHandler');

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Twilio credentials
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

/**
 * Validate JWT tokens for API authentication
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(unauthorized('Authentication token is required'));
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add decoded user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(unauthorized('Token has expired'));
    }
    
    if (error.name === 'JsonWebTokenError') {
      return next(unauthorized('Invalid token'));
    }
    
    logger.error('Auth middleware error:', error);
    return next(unauthorized('Authentication failed'));
  }
};

/**
 * Validate admin role for admin-only routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(unauthorized('Admin access required'));
    }
    
    next();
  } catch (error) {
    logger.error('Admin validation error:', error);
    return next(unauthorized('Authentication failed'));
  }
};

/**
 * Validate incoming Twilio webhook requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateWebhook = (req, res, next) => {
  try {
    // Skip validation in development mode if configured
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_WEBHOOK_VALIDATION === 'true') {
      logger.warn('Skipping Twilio webhook validation in development mode');
      return next();
    }
    
    // Get Twilio signature from headers
    const twilioSignature = req.headers['x-twilio-signature'];
    
    if (!twilioSignature) {
      logger.warn('Missing Twilio signature');
      return res.status(403).send('Forbidden');
    }
    
    // Build full URL for validation
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const url = `${protocol}://${host}${req.originalUrl}`;
    
    // Check if request is valid
    const isValid = twilio.validateRequest(
      TWILIO_AUTH_TOKEN,
      twilioSignature,
      url,
      req.body
    );
    
    if (!isValid) {
      logger.warn('Invalid Twilio signature');
      return res.status(403).send('Forbidden');
    }
    
    next();
  } catch (error) {
    logger.error('Webhook validation error:', error);
    return res.status(500).send('Internal Server Error');
  }
};

/**
 * Generate a new JWT token
 * 
 * @param {Object} payload - Token payload data
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
exports.generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};