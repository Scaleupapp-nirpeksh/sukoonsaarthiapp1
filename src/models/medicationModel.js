/**
 * Medication Model
 * Defines the structure and operations for medication data
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
const medicationsTable = process.env.DYNAMODB_MEDICATIONS_TABLE || 'SukoonSaarthi_Medications';

/**
 * Create a new medication for a user
 * 
 * @param {string} userId - User ID
 * @param {Object} medicationData - Medication data
 * @returns {Promise<Object>} Created medication object
 */
exports.createMedication = async (userId, medicationData) => {
  try {
    const medicationId = uuidv4();
    const timestamp = moment().toISOString();
    
    const medication = {
      id: medicationId,
      userId,
      name: medicationData.name,
      dosage: medicationData.dosage,
      frequency: medicationData.frequency,
      schedule: medicationData.schedule || [],
      duration: medicationData.duration, // Days or "ongoing"
      startDate: medicationData.startDate || timestamp,
      endDate: medicationData.endDate, // Optional, can be calculated from duration and startDate
      instructions: medicationData.instructions || '',
      prescriptionId: medicationData.prescriptionId, // Reference to S3 prescription image if any
      createdAt: timestamp,
      updatedAt: timestamp,
      active: true
    };
    
    const params = {
      TableName: medicationsTable,
      Item: medication
    };
    
    await dynamoDb.put(params).promise();
    logger.info(`Created medication ${medicationId} for user ${userId}`);
    
    return medication;
  } catch (error) {
    logger.error(`Error creating medication for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get all medications for a user
 * 
 * @param {string} userId - User ID
 * @param {boolean} activeOnly - Whether to return only active medications
 * @returns {Promise<Array>} Array of medication objects
 */
exports.getUserMedications = async (userId, activeOnly = true) => {
  try {
    const params = {
      TableName: medicationsTable,
      IndexName: 'UserIdIndex', // Assuming a GSI on userId
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    if (activeOnly) {
      params.FilterExpression = 'active = :active';
      params.ExpressionAttributeValues[':active'] = true;
    }
    
    const result = await dynamoDb.query(params).promise();
    return result.Items || [];
  } catch (error) {
    logger.error(`Error getting medications for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get a specific medication by ID
 * 
 * @param {string} medicationId - Medication ID
 * @returns {Promise<Object|null>} Medication object or null if not found
 */
exports.getMedicationById = async (medicationId) => {
  try {
    const params = {
      TableName: medicationsTable,
      Key: { id: medicationId }
    };
    
    const result = await dynamoDb.get(params).promise();
    return result.Item || null;
  } catch (error) {
    logger.error(`Error getting medication ${medicationId}:`, error);
    throw error;
  }
};

/**
 * Update a medication
 * 
 * @param {string} medicationId - Medication ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated medication object
 */
exports.updateMedication = async (medicationId, updates) => {
  try {
    const timestamp = moment().toISOString();
    
    // Build update expression
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues = {
      ':updatedAt': timestamp
    };
    
    // Add each update field to the expression
    Object.keys(updates).forEach((key) => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt') { // Don't allow updating these fields
        updateExpression += `, ${key} = :${key}`;
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });
    
    const params = {
      TableName: medicationsTable,
      Key: { id: medicationId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamoDb.update(params).promise();
    logger.info(`Updated medication: ${medicationId}`);
    
    return result.Attributes;
  } catch (error) {
    logger.error(`Error updating medication ${medicationId}:`, error);
    throw error;
  }
};

/**
 * Mark a medication as inactive/discontinued
 * 
 * @param {string} medicationId - Medication ID
 * @returns {Promise<Object>} Updated medication object
 */
exports.deactivateMedication = async (medicationId) => {
  try {
    const timestamp = moment().toISOString();
    
    const params = {
      TableName: medicationsTable,
      Key: { id: medicationId },
      UpdateExpression: 'SET updatedAt = :updatedAt, active = :active',
      ExpressionAttributeValues: {
        ':updatedAt': timestamp,
        ':active': false
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamoDb.update(params).promise();
    logger.info(`Deactivated medication: ${medicationId}`);
    
    return result.Attributes;
  } catch (error) {
    logger.error(`Error deactivating medication ${medicationId}:`, error);
    throw error;
  }
};

/**
 * Record a medication adherence event
 * 
 * @param {string} medicationId - Medication ID
 * @param {string} userId - User ID
 * @param {boolean} taken - Whether medication was taken
 * @param {string} [scheduledTime] - The scheduled time for this medication
 * @param {string} [notes] - Optional notes about the adherence
 * @returns {Promise<Object>} Created adherence record
 */
exports.recordAdherence = async (medicationId, userId, taken, scheduledTime, notes = '') => {
  try {
    const adherenceId = uuidv4();
    const timestamp = moment().toISOString();
    
    const adherence = {
      id: adherenceId,
      medicationId,
      userId,
      taken,
      scheduledTime: scheduledTime || timestamp,
      actualTime: timestamp,
      notes,
      createdAt: timestamp
    };
    
    // We'll store adherence records in a separate table in production
    // For now, we'll update the medication record with an adherence array
    const params = {
      TableName: medicationsTable,
      Key: { id: medicationId },
      UpdateExpression: 'SET updatedAt = :updatedAt, adherence = list_append(if_not_exists(adherence, :empty_list), :adherence)',
      ExpressionAttributeValues: {
        ':updatedAt': timestamp,
        ':adherence': [adherence],
        ':empty_list': []
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamoDb.update(params).promise();
    logger.info(`Recorded adherence for medication ${medicationId}`);
    
    return adherence;
  } catch (error) {
    logger.error(`Error recording adherence for medication ${medicationId}:`, error);
    throw error;
  }
};

/**
 * Get adherence records for a specific medication
 * 
 * @param {string} medicationId - Medication ID
 * @param {number} [days=7] - Number of days to look back
 * @returns {Promise<Array>} Array of adherence records
 */
exports.getMedicationAdherence = async (medicationId, days = 7) => {
  try {
    const params = {
      TableName: medicationsTable,
      Key: { id: medicationId },
      ProjectionExpression: 'adherence'
    };
    
    const result = await dynamoDb.get(params).promise();
    
    if (!result.Item || !result.Item.adherence) {
      return [];
    }
    
    // Filter adherence records for the specified time period
    const startDate = moment().subtract(days, 'days').toISOString();
    return result.Item.adherence.filter(record => record.createdAt >= startDate);
  } catch (error) {
    logger.error(`Error getting adherence for medication ${medicationId}:`, error);
    throw error;
  }
};

/**
 * Calculate adherence statistics for a user's medications
 * 
 * @param {string} userId - User ID
 * @param {number} [days=7] - Number of days to calculate for
 * @returns {Promise<Object>} Adherence statistics
 */
exports.calculateAdherenceStats = async (userId, days = 7) => {
  try {
    // Get all active medications for the user
    const medications = await this.getUserMedications(userId, true);
    
    if (!medications || medications.length === 0) {
      return {
        adherencePercentage: 0,
        totalScheduled: 0,
        totalTaken: 0,
        medications: []
      };
    }
    
    let totalScheduled = 0;
    let totalTaken = 0;
    const medicationStats = [];
    
    // Calculate adherence for each medication
    for (const medication of medications) {
      const adherenceRecords = await this.getMedicationAdherence(medication.id, days);
      
      const scheduledCount = adherenceRecords.length;
      const takenCount = adherenceRecords.filter(record => record.taken).length;
      
      totalScheduled += scheduledCount;
      totalTaken += takenCount;
      
      medicationStats.push({
        medicationId: medication.id,
        medicationName: medication.name,
        scheduledCount,
        takenCount,
        adherencePercentage: scheduledCount > 0 ? Math.round((takenCount / scheduledCount) * 100) : 0
      });
    }
    
    return {
      adherencePercentage: totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0,
      totalScheduled,
      totalTaken,
      medications: medicationStats
    };
  } catch (error) {
    logger.error(`Error calculating adherence stats for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get upcoming medication schedules for a user
 * 
 * @param {string} userId - User ID
 * @param {number} [hours=24] - Hours to look ahead
 * @returns {Promise<Array>} Array of upcoming medication schedules
 */
exports.getUpcomingMedications = async (userId, hours = 24) => {
  try {
    // Get all active medications for the user
    const medications = await this.getUserMedications(userId, true);
    
    if (!medications || medications.length === 0) {
      return [];
    }
    
    const now = moment();
    const endTime = moment().add(hours, 'hours');
    const upcoming = [];
    
    // Check each medication's schedule
    for (const medication of medications) {
      if (!medication.schedule || medication.schedule.length === 0) {
        continue;
      }
      
      // Process each scheduled time
      for (const scheduleItem of medication.schedule) {
        // Skip if the medication has ended
        if (medication.endDate && moment(medication.endDate).isBefore(now)) {
          continue;
        }
        
        // Calculate the next occurrence of this schedule
        const [hour, minute] = scheduleItem.time.split(':').map(Number);
        let nextOccurrence = moment().hour(hour).minute(minute).second(0);
        
        // If it's already past this time today, move to tomorrow
        if (nextOccurrence.isBefore(now)) {
          nextOccurrence = nextOccurrence.add(1, 'day');
        }
        
        // If within our window, add to upcoming list
        if (nextOccurrence.isBefore(endTime)) {
          upcoming.push({
            medicationId: medication.id,
            medicationName: medication.name,
            dosage: medication.dosage,
            scheduledTime: nextOccurrence.toISOString(),
            formattedTime: nextOccurrence.format('h:mm A'),
            instructions: medication.instructions
          });
        }
      }
    }
    
    // Sort by scheduled time
    return upcoming.sort((a, b) => moment(a.scheduledTime).diff(moment(b.scheduledTime)));
  } catch (error) {
    logger.error(`Error getting upcoming medications for user ${userId}:`, error);
    throw error;
  }
};