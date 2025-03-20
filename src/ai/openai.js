/**
 * OpenAI Integration
 * Handles interactions with OpenAI API for intelligent features
 */

const { OpenAI } = require('openai');
const { logger } = require('../middleware/logger');

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Check for potential interactions between medications
 * 
 * @param {Array} medications - Array of medication objects
 * @param {string} language - User's preferred language (en/hi)
 * @returns {Promise<Object>} Interaction analysis result
 */
exports.checkMedicationInteractions = async (medications, language = 'en') => {
  try {
    if (!medications || medications.length < 2) {
      return {
        hasInteractions: false,
        interactions: [],
        summary: language === 'en' 
          ? 'No potential interactions to check with a single medication.'
          : 'एक ही दवा के साथ जांचने के लिए कोई संभावित इंटरैक्शन नहीं है।'
      };
    }
    
    // Format medication list for the prompt
    const medicationList = medications
      .map(med => `${med.name} (${med.dosage})`)
      .join(', ');
    
    // Create system prompt
    const systemPrompt = `You are a medication interaction analysis assistant. 
    You will be given a list of medications, and your job is to:
    1. Identify potential interactions between these medications
    2. Categorize each interaction as: Severe, Moderate, or Mild
    3. Explain the nature of each interaction in simple terms
    4. Provide a brief summary of the overall interaction profile
    
    Keep your response factual and avoid unnecessary medical jargon. Format your response as JSON.
    
    The response should have the following fields:
    - hasInteractions: boolean
    - interactions: array of interaction objects
    - summary: string with overall assessment
    
    Each interaction object should have:
    - medications: array of medication names involved
    - severity: "severe", "moderate", or "mild"
    - description: simple explanation
    
    Respond in ${language === 'en' ? 'English' : 'Hindi'}.`;
    
    // Create user prompt
    const userPrompt = `Please analyze these medications for potential interactions: ${medicationList}`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // Use appropriate model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1 // Low temperature for more factual responses
    });
    
    // Parse and return the result
    const result = JSON.parse(response.choices[0].message.content);
    logger.info(`Completed medication interaction check for ${medications.length} medications`);
    
    return result;
  } catch (error) {
    logger.error('Error checking medication interactions:', error);
    
    // Return a safe fallback response
    return {
      hasInteractions: false,
      interactions: [],
      summary: language === 'en'
        ? 'Unable to check for interactions at this time. Please consult your doctor or pharmacist.'
        : 'इस समय इंटरैक्शन की जांच करने में असमर्थ। कृपया अपने डॉक्टर या फार्मासिस्ट से परामर्श करें।'
    };
  }
};

/**
 * Extract medication information from a prescription image
 * 
 * @param {string} prescriptionText - OCR text from the prescription image
 * @param {string} language - User's preferred language (en/hi)
 * @returns {Promise<Array>} Array of extracted medication objects
 */
exports.extractMedicationsFromPrescription = async (prescriptionText, language = 'en') => {
  try {
    // Create system prompt
    const systemPrompt = `You are a prescription analysis assistant.
    You will be given text extracted from a prescription image using OCR.
    Your job is to identify medications along with their dosage, frequency, and duration.
    
    Format your response as a JSON array of medication objects. Each object should have:
    - name: the medication name
    - dosage: the dosage amount (e.g., "500mg")
    - frequency: how often to take (e.g., "twice daily")
    - duration: how long to take (e.g., "7 days" or "ongoing")
    - instructions: any special instructions
    
    If any field cannot be determined, use null.
    Respond in ${language === 'en' ? 'English' : 'Hindi'}.`;
    
    // Create user prompt
    const userPrompt = `Extract medications from this prescription text: ${prescriptionText}`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // Use appropriate model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1 // Low temperature for more factual responses
    });
    
    // Parse and return the result
    const result = JSON.parse(response.choices[0].message.content);
    logger.info(`Extracted medication information from prescription`);
    
    return result.medications || [];
  } catch (error) {
    logger.error('Error extracting medications from prescription:', error);
    return [];
  }
};

/**
 * Generate contextual health recommendations
 * 
 * @param {Object} user - User object with health data
 * @param {Array} medications - User's medications
 * @param {string} language - User's preferred language (en/hi)
 * @returns {Promise<string>} Personalized health recommendations
 */
exports.generateHealthRecommendations = async (user, medications, language = 'en') => {
  try {
    // Create system prompt
    const systemPrompt = `You are a health companion for elderly users.
    You will be given information about a user, including their age, health conditions, and medications.
    Provide 3-5 simple, practical health recommendations specific to their situation.
    
    Your recommendations should:
    1. Be easy to understand and implement
    2. Consider their medications and health conditions
    3. Focus on general wellness, not medical advice
    4. Be appropriate for their age
    
    Keep your response concise, practical, and supportive.
    Respond in ${language === 'en' ? 'English' : 'Hindi'}.`;
    
    // Format medications for the prompt
    const medicationList = medications
      .map(med => `${med.name} (${med.dosage}, ${med.frequency})`)
      .join(', ');
    
    // Create user prompt
    const userPrompt = `User information:
    Age: ${user.age}
    Health conditions: ${user.healthInfo.conditions || 'None specified'}
    Medications: ${medicationList || 'None'}
    Recent health data: ${JSON.stringify(user.healthInfo.recentData || {})}
    
    Please provide personalized health recommendations for this user.`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // Use appropriate model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7 // Slightly higher temperature for varied recommendations
    });
    
    // Return the recommendations
    return response.choices[0].message.content;
  } catch (error) {
    logger.error('Error generating health recommendations:', error);
    
    // Return a safe fallback response
    return language === 'en'
      ? 'Stay hydrated, take your medications as prescribed, and try to get regular light exercise. Consider speaking with your doctor during your next visit for more personalized advice.'
      : 'हाइड्रेटेड रहें, अपनी दवाओं को निर्धारित के अनुसार लें, और नियमित हल्के व्यायाम करने का प्रयास करें। अधिक व्यक्तिगत सलाह के लिए अपनी अगली मुलाकात के दौरान अपने डॉक्टर से बात करने पर विचार करें।';
  }
};

/**
 * Process voice message and convert to text
 * 
 * @param {Buffer} audioData - Audio data from WhatsApp voice message
 * @param {string} language - Expected language (en/hi)
 * @returns {Promise<string>} Transcribed text
 */
exports.transcribeVoiceMessage = async (audioData, language = 'en') => {
  try {
    // Create a temporary file from the audio buffer
    const tempFile = Buffer.from(audioData);
    
    // Call OpenAI Whisper API
    const response = await openai.audio.transcriptions.create({
      file: tempFile,
      model: 'whisper-1',
      language: language === 'hi' ? 'hi' : 'en',
      response_format: 'text'
    });
    
    logger.info('Transcribed voice message successfully');
    return response;
  } catch (error) {
    logger.error('Error transcribing voice message:', error);
    return language === 'en'
      ? "I couldn't understand the voice message. Could you please type your message instead?"
      : "मैं वॉयस मैसेज को समझ नहीं पाया। क्या आप अपना संदेश टाइप कर सकते हैं?";
  }
};