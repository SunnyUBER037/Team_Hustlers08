# Atlas Chatbot - Deepseek AI via OpenRouter

A smart chatbot that answers questions about API actions defined in `atlas.json` using Deepseek AI through OpenRouter. Available in both **terminal** and **web interface** versions.

## Features

- 🤖 **AI-Powered**: Uses Deepseek AI via OpenRouter to provide intelligent responses
- 📊 **Context-Aware**: Automatically finds relevant actions from atlas.json based on your questions
- 💬 **Interactive**: Available as both terminal and modern web interface
- 🔍 **Smart Search**: Searches through action types and arguments to find relevant information
- 📚 **Comprehensive**: Covers all actions in your atlas.json file
- 🔧 **Configurable**: All settings stored in .env file
- 🎨 **Modern UI**: Beautiful web interface with syntax highlighting for code examples

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Your OpenRouter API Key**:
   
   Open the `.env` file in the project root and update your API key:
   ```env
   OPENROUTER_API_KEY=your-actual-openrouter-api-key-here
   ```

## Usage

### 🌐 Web Interface (Recommended)

Start the web server and open in your browser:

```bash
# Start the web server
npm run web

# Then open your browser to:
# http://localhost:3000
```

**Features:**
- Modern chat interface similar to popular messaging apps
- Syntax-highlighted code examples using Ace Editor
- Quick action buttons for common queries
- Responsive design for mobile and desktop
- Real-time typing indicators

### 💻 Terminal Interface

For command-line usage:

```bash
npm run chatbot
```

### Example Questions

Once the chatbot is running (web or terminal), you can ask questions like:

- "What actions are available for user management?"
- "How do I add client credits?"
- "What are the required arguments for account lockdown?"
- "Show me actions related to vehicles"
- "What optional arguments does addLeadV1 have?"
- "How do I create a new lead?"
- "What actions can I use for contact management?"

### Commands (Terminal only)

- `help` - Show example questions
- `exit` - Quit the chatbot

## Configuration

All configuration is stored in the `.env` file:

```env
# OpenRouter AI Configuration (for Deepseek access)
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_MODEL=deepseek/deepseek-r1-0528:free
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=1000

# Optional OpenRouter headers
SITE_URL=http://localhost:3000
SITE_NAME=Atlas Chatbot

# Server Configuration
PORT=3000

# Chatbot Configuration
MAX_RELEVANT_ACTIONS=10
CONTEXT_ACTION_LIMIT=20
```

## How It Works

1. **Data Loading**: The chatbot loads all actions from `atlas.json` on startup
2. **Query Processing**: When you ask a question, it searches for relevant actions
3. **AI Integration**: Your question + relevant action data is sent to Deepseek AI via OpenRouter
4. **Smart Response**: The AI provides helpful answers based on the atlas data
5. **Code Highlighting**: JSON examples are displayed with syntax highlighting (web interface)

## Atlas.json Structure

The chatbot understands actions with this structure:
```json
{
  "type": "actionName",
  "requiredArguments": [{"name": "ArgumentName"}],
  "optionalArguments": [{"name": "OptionalArg"}]
}
```

## API Endpoints (Web Server)

- `GET /` - Main chatbot interface
- `POST /api/chat` - Send message and get AI response
- `GET /api/health` - Server health check

## API Key Security

- ✅ Your API key is stored in `.env` file (not committed to git)
- ✅ The `.env` file is already in `.gitignore`
- ✅ Never share your API key publicly

## Troubleshooting

- **"API key not provided"**: Make sure you've updated the `OPENROUTER_API_KEY` in the `.env` file
- **"Error loading atlas.json"**: Ensure the atlas.json file exists in the project root
- **API errors**: Check that your OpenRouter API key is valid and has sufficient credits
- **Model errors**: The free Deepseek model has usage limits; consider upgrading if needed
- **Port conflicts**: Change the PORT in .env if 3000 is already in use

## Dependencies

- `express`: Web server framework
- `node-fetch`: For making HTTP requests to OpenRouter API
- `dotenv`: For loading environment variables from .env file
- `ace-editor`: For syntax highlighting in web interface (CDN)
- Built-in Node.js modules: `fs`, `path`, `readline`, `https`

## Scripts

- `npm run web` - Start web interface server
- `npm run chatbot` - Start terminal interface
- `npm run server` - Alias for web interface
- `npm start` - Start the original index.js

## OpenRouter vs Direct API

This chatbot uses OpenRouter to access Deepseek AI, which provides:
- ✅ Free tier available
- ✅ No need for separate Deepseek account
- ✅ Unified API for multiple AI models
- ✅ Better rate limiting and reliability 