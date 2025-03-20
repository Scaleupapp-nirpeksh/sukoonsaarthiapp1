// scripts/test-aws-connection.js
require('dotenv').config();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Debug credential loading
console.log('Checking environment variables:');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Found (not showing for security)' : 'Missing');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Found (not showing for security)' : 'Missing');
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);

// Explicitly configure AWS with credentials from .env
AWS.config.update({
  region: process.env.AWS_REGION,
  credentials: new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Test DynamoDB Connection
async function testDynamoDB() {
  console.log('\nTesting DynamoDB connection...');
  
  const tables = [
    process.env.DYNAMODB_USERS_TABLE || 'SukoonSaarthi_Users',
    process.env.DYNAMODB_MEDICATIONS_TABLE || 'SukoonSaarthi_Medications',
    process.env.DYNAMODB_HEALTH_DATA_TABLE || 'SukoonSaarthi_HealthData',
    process.env.DYNAMODB_SESSIONS_TABLE || 'SukoonSaarthi_Sessions'
  ];
  
  for (const table of tables) {
    try {
      // Test scan operation
      const params = {
        TableName: table,
        Limit: 1
      };
      
      const result = await dynamoDB.scan(params).promise();
      console.log(`✅ Connected to DynamoDB table: ${table}`);
      console.log(`  Items in table: ${result.Count}`);
    } catch (error) {
      console.error(`❌ Error connecting to DynamoDB table ${table}:`, error.message);
    }
  }
  
  // Test write operation on Users table
  try {
    const testUser = {
      id: `test-${uuidv4()}`,
      phoneNumber: '+1234567890',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    await dynamoDB.put({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'SukoonSaarthi_Users',
      Item: testUser
    }).promise();
    
    console.log('✅ Successfully wrote test user to DynamoDB');
    
    // Clean up test user
    await dynamoDB.delete({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'SukoonSaarthi_Users',
      Key: { id: testUser.id }
    }).promise();
    
    console.log('✅ Successfully deleted test user from DynamoDB');
  } catch (error) {
    console.error('❌ Error testing DynamoDB write operations:', error.message);
  }
}

// Test S3 Connection
async function testS3() {
  console.log('\nTesting S3 connection...');
  
  const bucketName = process.env.AWS_S3_BUCKET || 'sukoonsaarthi-prescriptions';
  const testFileName = `test-${uuidv4()}.txt`;
  const testFileContent = 'This is a test file for Sukoon Saarthi app.';
  
  try {
    // List all buckets to verify connection
    const listBucketsResponse = await s3.listBuckets().promise();
    console.log(`✅ Successfully connected to S3. Found ${listBucketsResponse.Buckets.length} buckets.`);
    
    // Check if our bucket exists
    const bucketExists = listBucketsResponse.Buckets.some(bucket => bucket.Name === bucketName);
    
    if (!bucketExists) {
      console.log(`❌ Bucket '${bucketName}' does not exist. Please create it in the AWS Console.`);
      return;
    }
    
    console.log(`✅ Found S3 bucket: ${bucketName}`);
    
    // Test upload
    await s3.putObject({
      Bucket: bucketName,
      Key: testFileName,
      Body: testFileContent,
      ContentType: 'text/plain'
    }).promise();
    
    console.log(`✅ Successfully uploaded test file to S3: ${testFileName}`);
    
    // Test download
    const downloadResult = await s3.getObject({
      Bucket: bucketName,
      Key: testFileName
    }).promise();
    
    const downloadedContent = downloadResult.Body.toString('utf-8');
    if (downloadedContent === testFileContent) {
      console.log('✅ Successfully downloaded and verified test file from S3');
    } else {
      console.error('❌ Downloaded file content does not match the uploaded content');
    }
    
    // Clean up test file
    await s3.deleteObject({
      Bucket: bucketName,
      Key: testFileName
    }).promise();
    
    console.log('✅ Successfully deleted test file from S3');
  } catch (error) {
    console.error('❌ Error testing S3 operations:', error.message);
  }
}

// Run tests
async function runTests() {
  try {
    await testDynamoDB();
    await testS3();
    console.log('\n✅ All AWS connection tests completed');
  } catch (error) {
    console.error('\n❌ Error during AWS connection tests:', error);
  }
}

runTests();