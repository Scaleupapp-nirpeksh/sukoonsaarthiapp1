// test-env-path.js
const path = require('path');
const fs = require('fs');
console.log("Starting dotenv test with explicit path...");

// Check if .env file exists
const envPath = path.resolve(process.cwd(), '.env');
console.log("Looking for .env at:", envPath);
console.log("File exists:", fs.existsSync(envPath));

try {
  require('dotenv').config({ path: envPath });
  console.log("Dotenv config executed with explicit path");
} catch (error) {
  console.error("Error loading dotenv:", error);
}

console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Found' : 'Missing');
console.log('Test completed');