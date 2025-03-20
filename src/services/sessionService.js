/**
 * Session Service
 * Manages user conversation sessions and states
 */

const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { logger } = require('../middleware/logger');

// In a production environment, this would be stored in DynamoDB or Redis
// For now, we'll use an in-memory store for development
const sessionStore = {};

// Session timeout in minutes (from .env)
const SESSION_TIMEOUT = process.env.SESSION_TIMEOUT_MINUTES || 30;

/**
 * Create a new session for a user
 * 
 * @param {string} phoneNumber - User's phone number
 * @returns {Object} New session object
 */
exports.createSession = async (phoneNumber) => {
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    phoneNumber,
    currentState: 'START',
    data: {},
    registrationInProgress: false,
    language: null,
    createdAt: moment().toISOString(),
    updatedAt: moment().toISOString(),
    expiresAt: moment().add(SESSION_TIMEOUT, 'minutes').toISOString()
  };
  
  sessionStore[phoneNumber] = session;
  logger.info(`Created new session for ${phoneNumber}: ${sessionId}`);
  
  return session;
};

/**
 * Get an existing session or create a new one
 * 
 * @param {string} phoneNumber - User's phone number
 * @returns {Object} Session object
 */
exports.getOrCreateSession = async (phoneNumber) => {
  let session = sessionStore[phoneNumber];
  
  // Check if session exists and is valid
  if (session) {
    // Check if session has expired
    if (moment().isAfter(moment(session.expiresAt))) {
      logger.info(`Session expired for ${phoneNumber}, creating new session`);
      session = await this.createSession(phoneNumber);
    } else {
      // Extend session expiry time
      session.expiresAt = moment().add(SESSION_TIMEOUT, 'minutes').toISOString();
      session.updatedAt = moment().toISOString();
      sessionStore[phoneNumber] = session;
    }
  } else {
    // Create new session
    session = await this.createSession(phoneNumber);
  }
  
  return session;
};

/**
 * Update an existing session
 * 
 * @param {Object} session - Session object to update
 * @returns {Object} Updated session object
 */
exports.updateSession = async (session) => {
  if (!session || !session.phoneNumber) {
    throw new Error('Invalid session object');
  }
  
  // Update timestamps
  session.updatedAt = moment().toISOString();
  session.expiresAt = moment().add(SESSION_TIMEOUT, 'minutes').toISOString();
  
  // Save to store
  sessionStore[session.phoneNumber] = session;
  logger.info(`Updated session for ${session.phoneNumber}: ${session.id}`);
  
  return session;
};

/**
 * Clear a user's session
 * 
 * @param {string} phoneNumber - User's phone number
 * @returns {boolean} Success indicator
 */
exports.clearSession = async (phoneNumber) => {
  if (sessionStore[phoneNumber]) {
    delete sessionStore[phoneNumber];
    logger.info(`Cleared session for ${phoneNumber}`);
    return true;
  }
  return false;
};

/**
 * Store data in the session
 * 
 * @param {string} phoneNumber - User's phone number
 * @param {string} key - Data key
 * @param {any} value - Data value
 * @returns {Object} Updated session
 */
exports.setSessionData = async (phoneNumber, key, value) => {
  const session = await this.getOrCreateSession(phoneNumber);
  
  if (!session.data) {
    session.data = {};
  }
  
  session.data[key] = value;
  return this.updateSession(session);
};

/**
 * Get data from the session
 * 
 * @param {string} phoneNumber - User's phone number
 * @param {string} key - Data key
 * @returns {any} Stored data value or null
 */
exports.getSessionData = async (phoneNumber, key) => {
  const session = await this.getOrCreateSession(phoneNumber);
  
  if (!session.data) {
    return null;
  }
  
  return session.data[key] || null;
};

/**
 * Set the current conversation state for a user
 * 
 * @param {string} phoneNumber - User's phone number
 * @param {string} state - New state
 * @returns {Object} Updated session
 */
exports.setSessionState = async (phoneNumber, state) => {
  const session = await this.getOrCreateSession(phoneNumber);
  session.currentState = state;
  return this.updateSession(session);
};

/**
 * Get the current conversation state for a user
 * 
 * @param {string} phoneNumber - User's phone number
 * @returns {string} Current state
 */
exports.getSessionState = async (phoneNumber) => {
  const session = await this.getOrCreateSession(phoneNumber);
  return session.currentState;
};

/**
 * Clean up expired sessions (would be called by a scheduled job)
 */
exports.cleanupExpiredSessions = async () => {
  const now = moment();
  let count = 0;
  
  Object.keys(sessionStore).forEach(phoneNumber => {
    const session = sessionStore[phoneNumber];
    if (now.isAfter(moment(session.expiresAt))) {
      delete sessionStore[phoneNumber];
      count++;
    }
  });
  
  if (count > 0) {
    logger.info(`Cleaned up ${count} expired sessions`);
  }
  
  return count;
};