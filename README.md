# Sukoon Saarthi App

A WhatsApp-based medication management and health monitoring platform for elderly users and caregivers.

## Overview

Sukoon Saarthi is a conversational healthcare assistant designed specifically for elderly users in India. The platform operates entirely through WhatsApp, making it accessible without requiring the installation of additional apps. It focuses on medication management, basic health monitoring, and caregiver coordination.

### Key Features

- **Medication Management**: Track prescriptions, set reminders, and monitor adherence
- **Health Monitoring**: Log symptoms and vital signs with trend visualization
- **Caregiver Coordination**: Family oversight, alerts, and proxy commands
- **WhatsApp Integration**: Simple access via familiar messaging platform
- **Bilingual Support**: Available in Hindi and English
- **AI Intelligence**: Medication interaction checking, contextual health advice

## Architecture

The application follows a service-oriented architecture with the following components:

- **WhatsApp Interface**: Using Twilio's API for messaging
- **Node.js Backend**: Express-based API services
- **AI Services**: OpenAI integration for intelligent features
- **AWS Integration**: S3 for storage, Textract for OCR, DynamoDB for data
- **Admin Dashboard**: For monitoring and user management

## Getting Started

### Prerequisites

- Node.js 16+
- AWS Account
- Twilio Account with WhatsApp Business API access
- OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/sukoonsaarthiapp.git
   cd sukoonsaarthiapp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Configure your environment variables in the `.env` file.

5. Run the setup script:
   ```
   npm run setup
   ```

6. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

```
sukoonsaarthiapp/
│
├── src/                    # Application source code
│   ├── api/                # API controllers and routes
│   ├── services/           # Business logic services
│   ├── ai/                 # AI and ML components
│   ├── integrations/       # External service integrations
│   ├── models/             # Data models
│   ├── utils/              # Utility functions
│   ├── middleware/         # Express middleware
│   ├── config/             # Configuration files
│   └── admin/              # Admin panel backend
│
├── public/                 # Admin panel frontend
├── scripts/                # Utility scripts
├── tests/                  # Test suites
└── docs/                   # Documentation
```

## Deployment

The application is designed to be deployed on Render, but can be deployed to any Node.js hosting environment.

1. Configure environment variables in your hosting platform
2. Deploy the application:
   ```
   npm run deploy
   ```

## Development

### Running Tests

```
npm test
```

### Linting

```
npm run lint
```

## License

This project is proprietary and confidential.

## Acknowledgments

- [Twilio](https://www.twilio.com/) - WhatsApp Business API
- [OpenAI](https://openai.com/) - AI capabilities
- [AWS](https://aws.amazon.com/) - Cloud infrastructure