/**
 * Webhook Controller
 * Handles incoming WhatsApp messages and interactions through Twilio
 */

const { logger } = require('../../middleware/logger');
const sessionService = require('../../services/sessionService');
const userService = require('../../services/userService');
const languageService = require('../../services/languageService');
const messageBuilder = require('../../utils/messageBuilder');
const twilioClient = require('../../integrations/twilio');

/**
 * Process incoming WhatsApp messages
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleIncomingMessage = async (req, res) => {
  try {
    // Extract message details from Twilio webhook
    const { From, Body, ProfileName, WaId } = req.body;
    
    logger.info(`Received message from ${From}: ${Body}`);
    
    // Standardize the phone number (remove WhatsApp prefix)
    const phoneNumber = From.replace('whatsapp:', '');
    
    // Get or create user session
    const session = await sessionService.getOrCreateSession(phoneNumber);
    
    // Check if user exists or needs registration
    let user = await userService.findUserByPhone(phoneNumber);
    let response;
    
    if (!user && !session.registrationInProgress) {
      // Start registration flow for new users
      response = messageBuilder.buildRegistrationWelcome(ProfileName);
      session.currentState = 'REGISTRATION_START';
      session.registrationInProgress = true;
      await sessionService.updateSession(session);
    } else if (session.registrationInProgress) {
      // Continue registration flow
      response = await handleRegistrationFlow(session, Body, ProfileName);
    } else {
      // Handle commands for registered users
      response = await handleUserCommands(user, session, Body, phoneNumber);
    }
    
    // Send response via Twilio
    await twilioClient.sendWhatsAppMessage(phoneNumber, response);
    
    // Return success to Twilio
    return res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling incoming message:', error);
    return res.status(500).send('Error processing message');
  }
};

/**
 * Handle message status updates (delivered, read, etc.)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleStatusUpdate = async (req, res) => {
  try {
    const { MessageSid, MessageStatus, To } = req.body;
    
    logger.info(`Message ${MessageSid} to ${To} status: ${MessageStatus}`);
    
    // Update message status in our system if needed
    
    return res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling status update:', error);
    return res.status(500).send('Error processing status update');
  }
};

/**
 * Handle incoming media uploads (prescription photos, etc.)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleMediaUpload = async (req, res) => {
  try {
    const { From, MediaUrl0, MediaContentType0 } = req.body;
    
    logger.info(`Received media from ${From}: ${MediaUrl0} (${MediaContentType0})`);
    
    // Process the media based on session state and user context
    // Will be implemented in future
    
    return res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling media upload:', error);
    return res.status(500).send('Error processing media');
  }
};

/**
 * Handle registration flow based on current session state
 * 
 * @param {Object} session - User session object
 * @param {string} message - Message text from user
 * @param {string} profileName - WhatsApp profile name
 * @returns {string} Response message to send
 */
async function handleRegistrationFlow(session, message, profileName) {
  switch (session.currentState) {
    case 'REGISTRATION_START':
      // Ask for preferred language
      session.currentState = 'REGISTRATION_LANGUAGE';
      await sessionService.updateSession(session);
      return messageBuilder.buildLanguageSelection();
      
    case 'REGISTRATION_LANGUAGE':
      // Process language selection and ask for age
      const languageChoice = message.trim().toLowerCase();
      if (languageChoice === '1' || languageChoice === 'english') {
        session.language = 'en';
      } else if (languageChoice === '2' || languageChoice === 'hindi') {
        session.language = 'hi';
      } else {
        // Invalid selection, ask again
        return messageBuilder.buildLanguageSelection(true);
      }
      
      session.currentState = 'REGISTRATION_AGE';
      await sessionService.updateSession(session);
      return messageBuilder.buildAgeQuestion(session.language);
      
    // Additional registration steps would be implemented here
    
    default:
      return messageBuilder.buildGenericError(session.language || 'en');
  }
}

/**
 * Handle commands from registered users
 * 
 * @param {Object} user - User object from database
 * @param {Object} session - User session object
 * @param {string} message - Message text from user
 * @param {string} phoneNumber - User's phone number
 * @returns {string} Response message to send
 */
async function handleUserCommands(user, session, message, phoneNumber) {
  // Check if this is a caregiver proxy command
  if (message.startsWith('for:')) {
    // Will implement proxy command handling in future
    return messageBuilder.buildNotImplementedYet(user.language || 'en');
  }
  
  // Handle regular commands based on message content and session state
  const command = message.trim().toLowerCase();
  
  switch (command) {
    case 'help':
      return messageBuilder.buildHelpMenu(user.language || 'en');
      
    case 'add medication':
    case 'med':
    case '1': // Assuming 1 is the medication menu option
      session.currentState = 'MEDICATION_ADD_START';
      await sessionService.updateSession(session);
      return messageBuilder.buildMedicationAddStart(user.language || 'en');
      
    // Additional command handlers would be implemented here
    
    default:
      // Default response when no command is recognized
      return messageBuilder.buildMainMenu(user.language || 'en');
  }
}