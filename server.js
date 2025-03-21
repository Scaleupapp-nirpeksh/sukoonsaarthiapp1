/**
 * Main application entry point for Sukoon Saarthi App
 * WhatsApp-based elderly medication and health management platform
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./src/utils/errorHandler');
const { logger } = require('./src/middleware/logger');

// Import routes
const webhookRoutes = require('./src/api/routes/webhookRoutes');
const adminRoutes = require('./src/api/routes/adminRoutes');
const authRoutes = require('./src/api/routes/authRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) }})); // HTTP request logging

// Serve static files for admin panel
app.use(express.static('public'));

// Apply routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Sukoon Saarthi service is running' });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`Sukoon Saarthi server running on port ${PORT}`);
  console.log(`Sukoon Saarthi server running on port ${PORT}`);
});

module.exports = app; // Export for testing