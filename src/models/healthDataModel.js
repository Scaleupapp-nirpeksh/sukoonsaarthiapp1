// src/models/healthDataModel.js
/**
 * Health Data Model
 * Defines the structure and operations for health monitoring data
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
const healthDataTable = process.env.DYNAMODB_HEALTH_DATA_TABLE || 'SukoonSaarthi_HealthData';

/**
 * Record health data for a user
 * 
 * @param {string} userId - User ID
 * @param {Object} healthData - Health data to record
 * @returns {Promise<Object>} Created health data record
 */
exports.recordHealthData = async (userId, healthData) => {
  try {
    const recordId = uuidv4();
    const timestamp = moment().toISOString();
    const recordDate = moment().format('YYYY-MM-DD');
    
    const record = {
      id: recordId,
      userId,
      recordDate,
      dataType: healthData.dataType, // e.g., 'blood_pressure', 'glucose', 'weight', 'symptoms'
      value: healthData.value, // The actual reading or data point
      unit: healthData.unit, // e.g., 'mmHg', 'mg/dL', 'kg'
      notes: healthData.notes || '',
      createdAt: timestamp,
      source: healthData.source || 'user_input' // Could be 'user_input', 'device', etc.
    };
    
    const params = {
      TableName: healthDataTable,
      Item: record
    };
    
    await dynamoDb.put(params).promise();
    logger.info(`Recorded health data for user ${userId}: ${healthData.dataType}`);
    
    return record;
  } catch (error) {
    logger.error(`Error recording health data for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get health data for a user within a date range
 * 
 * @param {string} userId - User ID
 * @param {string} dataType - Type of health data to retrieve (optional)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of health data records
 */
exports.getUserHealthData = async (userId, dataType, startDate, endDate) => {
  try {
    const params = {
      TableName: healthDataTable,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId AND recordDate BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':startDate': startDate || moment().subtract(30, 'days').format('YYYY-MM-DD'),
        ':endDate': endDate || moment().format('YYYY-MM-DD')
      }
    };
    
    // Add filter for data type if specified
    if (dataType) {
      params.FilterExpression = 'dataType = :dataType';
      params.ExpressionAttributeValues[':dataType'] = dataType;
    }
    
    const result = await dynamoDb.query(params).promise();
    return result.Items || [];
  } catch (error) {
    logger.error(`Error getting health data for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get latest health reading of a specific type
 * 
 * @param {string} userId - User ID
 * @param {string} dataType - Type of health data to retrieve
 * @returns {Promise<Object|null>} Latest health data record or null
 */
exports.getLatestHealthReading = async (userId, dataType) => {
  try {
    const endDate = moment().format('YYYY-MM-DD');
    const startDate = moment().subtract(90, 'days').format('YYYY-MM-DD');
    
    const params = {
      TableName: healthDataTable,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId AND recordDate BETWEEN :startDate AND :endDate',
      FilterExpression: 'dataType = :dataType',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':dataType': dataType,
        ':startDate': startDate,
        ':endDate': endDate
      },
      Limit: 10,
      ScanIndexForward: false // Descending order to get most recent first
    };
    
    const result = await dynamoDb.query(params).promise();
    
    // Get the most recent record
    if (result.Items && result.Items.length > 0) {
      // Sort by createdAt (ISO timestamp) to ensure we get the very latest
      result.Items.sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));
      return result.Items[0];
    }
    
    return null;
  } catch (error) {
    logger.error(`Error getting latest health reading for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Calculate health data trends for a user
 * 
 * @param {string} userId - User ID
 * @param {string} dataType - Type of health data to analyze
 * @param {number} [days=30] - Number of days to analyze
 * @returns {Promise<Object>} Trend analysis
 */
exports.analyzeHealthTrend = async (userId, dataType, days = 30) => {
  try {
    const endDate = moment().format('YYYY-MM-DD');
    const startDate = moment().subtract(days, 'days').format('YYYY-MM-DD');
    
    // Get health data for the period
    const healthData = await this.getUserHealthData(userId, dataType, startDate, endDate);
    
    if (!healthData || healthData.length === 0) {
      return {
        dataType,
        dataPoints: 0,
        trend: 'insufficient_data',
        average: null,
        min: null,
        max: null
      };
    }
    
    // Extract values (assuming numeric values)
    const values = healthData.map(record => parseFloat(record.value)).filter(val => !isNaN(val));
    
    if (values.length === 0) {
      return {
        dataType,
        dataPoints: 0,
        trend: 'insufficient_data',
        average: null,
        min: null,
        max: null
      };
    }
    
    // Calculate statistics
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Determine trend (very simple analysis)
    let trend = 'stable';
    if (values.length >= 3) {
      // Split into earlier and later periods
      const midpoint = Math.floor(values.length / 2);
      const earlierValues = values.slice(0, midpoint);
      const laterValues = values.slice(midpoint);
      
      const earlierAvg = earlierValues.reduce((acc, val) => acc + val, 0) / earlierValues.length;
      const laterAvg = laterValues.reduce((acc, val) => acc + val, 0) / laterValues.length;
      
      const changePercent = ((laterAvg - earlierAvg) / earlierAvg) * 100;
      
      if (changePercent > 5) {
        trend = 'increasing';
      } else if (changePercent < -5) {
        trend = 'decreasing';
      }
    }
    
    return {
      dataType,
      dataPoints: values.length,
      trend,
      average,
      min,
      max,
      unit: healthData[0].unit
    };
  } catch (error) {
    logger.error(`Error analyzing health trend for user ${userId}:`, error);
    throw error;
  }
};