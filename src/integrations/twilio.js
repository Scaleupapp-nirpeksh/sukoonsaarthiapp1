/**
 * Twilio Integration
 * Handles WhatsApp messaging through Twilio's API
 */

const twilio = require('twilio');
const { logger } = require('../middleware/logger');

// Initialize Twilio client with credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Create Twilio client (will be null in test environment)
let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
} else {
  logger.warn('Twilio credentials not found in environment variables');
}

/**
 * Send a WhatsApp message via Twilio
 * 
 * @param {string} to - Recipient phone number
 * @param {string} body - Message content
 * @returns {Promise<Object>} Twilio message object
 */
exports.sendWhatsAppMessage = async (to, body) => {
  try {
    if (!client) {
      logger.error('Twilio client not initialized');
      throw new Error('Twilio client not initialized');
    }
    
    // Ensure the phone number has WhatsApp prefix
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    // Send message via Twilio
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedTo
    });
    
    logger.info(`Sent WhatsApp message to ${to}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    logger.error(`Error sending WhatsApp message to ${to}:`, error);
    throw error;
  }
};

/**
 * Send a WhatsApp message with media via Twilio
 * 
 * @param {string} to - Recipient phone number
 * @param {string} body - Message content
 * @param {string} mediaUrl - URL of the media to send
 * @returns {Promise<Object>} Twilio message object
 */
exports.sendWhatsAppMessageWithMedia = async (to, body, mediaUrl) => {
  try {
    if (!client) {
      logger.error('Twilio client not initialized');
      throw new Error('Twilio client not initialized');
    }
    
    // Ensure the phone number has WhatsApp prefix
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    // Send message with media via Twilio
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedTo,
      mediaUrl: [mediaUrl]
    });
    
    logger.info(`Sent WhatsApp message with media to ${to}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    logger.error(`Error sending WhatsApp message with media to ${to}:`, error);
    throw error;
  }
};

/**
 * Get the content of media from a WhatsApp message
 * 
 * @param {string} mediaUrl - Twilio media URL
 * @returns {Promise<Buffer>} Media content as buffer
 */
exports.getMediaContent = async (mediaUrl) => {
  try {
    if (!client) {
      logger.error('Twilio client not initialized');
      throw new Error('Twilio client not initialized');
    }
    
    // Get media content from Twilio
    const response = await client.request({
      method: 'GET',
      uri: mediaUrl,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
      }
    });
    
    return Buffer.from(response.body);
  } catch (error) {
    logger.error(`Error retrieving media content from ${mediaUrl}:`, error);
    throw error;
  }
};

/**
 * Validate an incoming Twilio webhook request
 * 
 * @param {string} signature - X-Twilio-Signature header
 * @param {string} url - Full URL of the webhook
 * @param {Object} params - Request parameters
 * @returns {boolean} Whether the request is valid
 */
exports.validateWebhook = (signature, url, params) => {
  try {
    if (!client) {
      logger.warn('Twilio client not initialized, skipping webhook validation');
      return true;
    }
    
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    logger.error('Error validating Twilio webhook:', error);
    return false;
  }
};