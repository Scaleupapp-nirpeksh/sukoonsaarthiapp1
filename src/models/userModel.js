/**
 * User Model
 * Defines the structure and operations for user data
 */

const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const AWS = require('aws-sdk');
const { logger } = require('../middleware/logger');

// Initialize DynamoDB client
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

// Table name from environment variable
const usersTable = process.env.DYNAMODB_USERS_TABLE || 'SukoonSaarthi_Users';

/**
 * Create a new user in DynamoDB
 * 
 * @param {Object} userData - User data object
 * @returns {Promise<Object>} Created user object
 */
exports.createUser = async (userData) => {
  try {
    const userId = uuidv4();
    const timestamp = moment().toISOString();
    
    const user = {
      id: userId,
      phoneNumber: userData.phoneNumber,
      name: userData.name,
      age: userData.age,
      language: userData.language || 'en',
      healthInfo: userData.healthInfo || {},
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true,
      subscriptionTier: 'free', // Default to free tier
      subscriptionExpiresAt: moment().add(30, 'days').toISOString(), // Free trial period
    };
    
    const params = {
      TableName: usersTable,
      Item: user
    };
    
    await dynamoDb.put(params).promise();
    logger.info(`Created new user: ${userId}`);
    
    return user;
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Find a user by phone number
 * 
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<Object|null>} User object or null if not found
 */
exports.findUserByPhone = async (phoneNumber) => {
  try {
    const params = {
      TableName: usersTable,
      IndexName: 'PhoneNumberIndex', // Assuming a GSI on phoneNumber
      KeyConditionExpression: 'phoneNumber = :phoneNumber',
      ExpressionAttributeValues: {
        ':phoneNumber': phoneNumber
      }
    };
    
    const result = await dynamoDb.query(params).promise();
    
    if (result.Items && result.Items.length > 0) {
      return result.Items[0];
    }
    
    return null;
  } catch (error) {
    // In development mode without DynamoDB, return null instead of error
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`Development mode: findUserByPhone returning null for ${phoneNumber}`);
      return null;
    }
    
    logger.error(`Error finding user by phone ${phoneNumber}:`, error);
    throw error;
  }
};

/**
 * Update a user's information
 * 
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user object
 */
exports.updateUser = async (userId, updates) => {
  try {
    const timestamp = moment().toISOString();
    
    // Build update expression
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues = {
      ':updatedAt': timestamp
    };
    
    // Add each update field to the expression
    Object.keys(updates).forEach((key) => {
      if (key !== 'id' && key !== 'createdAt') { // Don't allow updating these fields
        updateExpression += `, ${key} = :${key}`;
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });
    
    const params = {
      TableName: usersTable,
      Key: { id: userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamoDb.update(params).promise();
    logger.info(`Updated user: ${userId}`);
    
    return result.Attributes;
  } catch (error) {
    logger.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

/**
 * Add a caregiver relationship to a user
 * 
 * @param {string} userId - User ID
 * @param {Object} caregiverData - Caregiver data
 * @returns {Promise<Object>} Updated user with caregiver
 */
exports.addCaregiverToUser = async (userId, caregiverData) => {
  try {
    const timestamp = moment().toISOString();
    const caregiverId = uuidv4();
    
    const caregiver = {
      id: caregiverId,
      phoneNumber: caregiverData.phoneNumber,
      name: caregiverData.name,
      relationship: caregiverData.relationship,
      permissions: caregiverData.permissions || ['VIEW_MEDICATIONS', 'VIEW_HEALTH'],
      createdAt: timestamp
    };
    
    const params = {
      TableName: usersTable,
      Key: { id: userId },
      UpdateExpression: 'SET updatedAt = :updatedAt, caregivers = list_append(if_not_exists(caregivers, :empty_list), :caregiver)',
      ExpressionAttributeValues: {
        ':updatedAt': timestamp,
        ':caregiver': [caregiver],
        ':empty_list': []
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamoDb.update(params).promise();
    logger.info(`Added caregiver ${caregiverId} to user ${userId}`);
    
    return result.Attributes;
  } catch (error) {
    logger.error(`Error adding caregiver to user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get all users (for admin purposes)
 * 
 * @param {number} limit - Maximum number of users to retrieve
 * @returns {Promise<Array>} Array of user objects
 */
exports.getAllUsers = async (limit = 100) => {
  try {
    const params = {
      TableName: usersTable,
      Limit: limit
    };
    
    const result = await dynamoDb.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    logger.error('Error getting all users:', error);
    throw error;
  }
};