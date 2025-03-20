/**
 * Message Builder Utility
 * Generates formatted WhatsApp messages for different scenarios
 */

// Messages in English
const messages = {
    en: {
      welcome: "👋 Welcome to *Sukoon Saarthi*! Your health companion.\n\nI'm here to help you manage your medications and monitor your health.",
      registration_welcome: (name) => `Hello ${name || 'there'}! Welcome to *Sukoon Saarthi* - your personal health assistant.\n\nLet's take a moment to set up your account.`,
      language_selection: "Please select your preferred language:\n\n1. English\n2. हिंदी (Hindi)",
      language_selection_error: "I didn't understand that choice. Please select a language:\n\n1. English\n2. हिंदी (Hindi)",
      age_question: "Great! Now, please tell me your age in years.",
      age_error: "Please enter a valid age between 1 and 120.",
      main_menu: "What would you like to do today?\n\n1. Manage Medications 💊\n2. Track Health 📈\n3. View Reports 📋\n4. Family Settings 👪\n5. Help",
      help_menu: "Here's how I can help you:\n\n• Add medication: Type 'add medication'\n• Check schedule: Type 'schedule'\n• Record health: Type 'health'\n• Family access: Type 'family'\n• Talk to support: Type 'support'",
      not_implemented: "This feature is coming soon! Thank you for your patience.",
      generic_error: "I'm sorry, I couldn't process that. Please try again or type 'help' for assistance.",
      medication_add_start: "Let's add a new medication. You can either:\n\n1. Take a photo of your prescription\n2. Enter medication details manually",
    },
    // Hindi translations
    hi: {
      welcome: "👋 *सुकून साथी* में आपका स्वागत है! आपका स्वास्थ्य साथी।\n\nमैं आपकी दवाओं और स्वास्थ्य की निगरानी में आपकी मदद करने के लिए यहां हूं।",
      registration_welcome: (name) => `नमस्ते ${name || 'वहाँ'}! *सुकून साथी* में आपका स्वागत है - आपका व्यक्तिगत स्वास्थ्य सहायक।\n\nआइए अपना खाता सेटअप करने के लिए कुछ समय लें।`,
      language_selection: "कृपया अपनी पसंदीदा भाषा चुनें:\n\n1. English\n2. हिंदी",
      language_selection_error: "मैं उस विकल्प को नहीं समझा। कृपया एक भाषा चुनें:\n\n1. English\n2. हिंदी",
      age_question: "बढ़िया! अब, कृपया मुझे अपनी उम्र वर्षों में बताएं।",
      age_error: "कृपया 1 से 120 के बीच एक वैध उम्र दर्ज करें।",
      main_menu: "आज आप क्या करना चाहेंगे?\n\n1. दवाएं प्रबंधित करें 💊\n2. स्वास्थ्य ट्रैक करें 📈\n3. रिपोर्ट देखें 📋\n4. परिवार सेटिंग्स 👪\n5. मदद",
      help_menu: "मैं आपकी इस प्रकार मदद कर सकता हूं:\n\n• दवा जोड़ें: 'दवा जोड़ें' टाइप करें\n• शेड्यूल जांचें: 'शेड्यूल' टाइप करें\n• स्वास्थ्य रिकॉर्ड करें: 'स्वास्थ्य' टाइप करें\n• परिवार पहुंच: 'परिवार' टाइप करें\n• सहायता से बात करें: 'सहायता' टाइप करें",
      not_implemented: "यह सुविधा जल्द ही आ रही है! आपके धैर्य के लिए धन्यवाद।",
      generic_error: "मुझे खेद है, मैं उसे प्रोसेस नहीं कर सका। कृपया फिर से प्रयास करें या सहायता के लिए 'मदद' टाइप करें।",
      medication_add_start: "चलिए एक नई दवा जोड़ते हैं। आप या तो:\n\n1. अपने नुस्खे की एक फोटो ले सकते हैं\n2. दवा विवरण मैन्युअल रूप से दर्ज कर सकते हैं",
    }
  };
  
  /**
   * Build registration welcome message
   * 
   * @param {string} name - User's WhatsApp profile name
   * @returns {string} Formatted welcome message
   */
  exports.buildRegistrationWelcome = (name) => {
    return messages.en.registration_welcome(name);
  };
  
  /**
   * Build language selection message
   * 
   * @param {boolean} isError - Whether there was an error in previous selection
   * @returns {string} Language selection prompt
   */
  exports.buildLanguageSelection = (isError = false) => {
    return isError ? messages.en.language_selection_error : messages.en.language_selection;
  };
  
  /**
   * Build age question message
   * 
   * @param {string} language - User's preferred language (en/hi)
   * @returns {string} Age question prompt
   */
  exports.buildAgeQuestion = (language) => {
    return messages[language]?.age_question || messages.en.age_question;
  };
  
  /**
   * Build main menu message
   * 
   * @param {string} language - User's preferred language (en/hi)
   * @returns {string} Main menu options
   */
  exports.buildMainMenu = (language) => {
    return messages[language]?.main_menu || messages.en.main_menu;
  };
  
  /**
   * Build help menu message
   * 
   * @param {string} language - User's preferred language (en/hi)
   * @returns {string} Help menu options
   */
  exports.buildHelpMenu = (language) => {
    return messages[language]?.help_menu || messages.en.help_menu;
  };
  
  /**
   * Build generic error message
   * 
   * @param {string} language - User's preferred language (en/hi)
   * @returns {string} Generic error message
   */
  exports.buildGenericError = (language) => {
    return messages[language]?.generic_error || messages.en.generic_error;
  };
  
  /**
   * Build "not implemented yet" message
   * 
   * @param {string} language - User's preferred language (en/hi)
   * @returns {string} Not implemented message
   */
  exports.buildNotImplementedYet = (language) => {
    return messages[language]?.not_implemented || messages.en.not_implemented;
  };
  
  /**
   * Build medication add start message
   * 
   * @param {string} language - User's preferred language (en/hi)
   * @returns {string} Medication add start message
   */
  exports.buildMedicationAddStart = (language) => {
    return messages[language]?.medication_add_start || messages.en.medication_add_start;
  };
  
  /**
   * Build a medication reminder message
   * 
   * @param {string} language - User's preferred language (en/hi)
   * @param {Object} medication - Medication object
   * @param {string} time - Time of medication
   * @returns {string} Medication reminder message
   */
  exports.buildMedicationReminder = (language, medication, time) => {
    const message = {
      en: `⏰ *Medication Reminder*\n\nIt's time to take your medication: *${medication.name}*\n\nDosage: ${medication.dosage}\nTime: ${time}\n\nPlease reply with "taken" after you've taken your medication.`,
      hi: `⏰ *दवा रिमाइंडर*\n\nआपकी दवा लेने का समय हो गया है: *${medication.name}*\n\nखुराक: ${medication.dosage}\nसमय: ${time}\n\nकृपया अपनी दवा लेने के बाद "ले लिया" के साथ जवाब दें।`
    };
    
    return message[language] || message.en;
  };
  
  /**
   * Build a caregiver alert message
   * 
   * @param {string} language - Caregiver's preferred language (en/hi)
   * @param {Object} elderly - Elderly user object
   * @param {Object} medication - Medication object
   * @param {string} missedTime - Time the medication was missed
   * @returns {string} Caregiver alert message
   */
  exports.buildCaregiverMedicationAlert = (language, elderly, medication, missedTime) => {
    const message = {
      en: `🚨 *Medication Alert*\n\n${elderly.name} missed their scheduled medication: *${medication.name}*\n\nDosage: ${medication.dosage}\nScheduled time: ${missedTime}\n\nYou may want to check in with them.`,
      hi: `🚨 *दवा अलर्ट*\n\n${elderly.name} ने अपनी निर्धारित दवा याद की: *${medication.name}*\n\nखुराक: ${medication.dosage}\nनिर्धारित समय: ${missedTime}\n\nआप उनसे संपर्क करना चाह सकते हैं।`
    };
    
    return message[language] || message.en;
  };
  
  /**
   * Build a health report message
   * 
   * @param {string} language - User's preferred language (en/hi)
   * @param {Object} healthData - Health data object
   * @returns {string} Health report message
   */
  exports.buildHealthReport = (language, healthData) => {
    // This is a simplified version, actual implementation would format healthData in a readable way
    const message = {
      en: `📊 *Weekly Health Report*\n\nHere's a summary of your health this week:\n\nBlood Pressure: ${healthData.bp || 'Not recorded'}\nBlood Sugar: ${healthData.sugar || 'Not recorded'}\nWeight: ${healthData.weight || 'Not recorded'}\n\nMedication Adherence: ${healthData.adherencePercentage}%`,
      hi: `📊 *साप्ताहिक स्वास्थ्य रिपोर्ट*\n\nइस सप्ताह आपके स्वास्थ्य का सारांश यहां है:\n\nरक्तचाप: ${healthData.bp || 'दर्ज नहीं'}\nरक्त शर्करा: ${healthData.sugar || 'दर्ज नहीं'}\nवजन: ${healthData.weight || 'दर्ज नहीं'}\n\nदवा अनुपालन: ${healthData.adherencePercentage}%`
    };
    
    return message[language] || message.en;
  };