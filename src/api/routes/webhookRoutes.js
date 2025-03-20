/**
 * Webhook routes for handling WhatsApp interactions via Twilio
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { validateWebhook } = require('../../middleware/auth');

/**
 * POST /api/webhook/message
 * Handles incoming WhatsApp messages from Twilio
 */
router.post('/message', validateWebhook, webhookController.handleIncomingMessage);

/**
 * POST /api/webhook/status
 * Handles message status updates (delivered, read, etc.)
 */
router.post('/status', validateWebhook, webhookController.handleStatusUpdate);

/**
 * POST /api/webhook/media
 * Handles media uploads (prescription photos, etc.)
 */
router.post('/media', validateWebhook, webhookController.handleMediaUpload);

module.exports = router;