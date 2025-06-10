const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const https = require('https');

// Load environment variables from .env file
require('dotenv').config();

// Disable SSL certificate verification for development (fixes SSL issues)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create an agent that ignores SSL certificate errors only for API requests
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

class AtlasChatbotServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        // Initialize chatbot properties
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
        this.model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1-0528:free';
        this.temperature = parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7;
        this.maxTokens = parseInt(process.env.OPENROUTER_MAX_TOKENS) || 1000;
        this.siteUrl = process.env.SITE_URL || 'http://localhost:3000';
        this.siteName = process.env.SITE_NAME || 'Atlas Chatbot';
        this.maxRelevantActions = parseInt(process.env.MAX_RELEVANT_ACTIONS) || 10;
        this.contextActionLimit = parseInt(process.env.CONTEXT_ACTION_LIMIT) || 20;
        
        this.atlasData = null;
        this.loadAtlasData();
        this.setupMiddleware();
        this.setupRoutes();
    }

    loadAtlasData() {
        try {
            const atlasPath = path.join(__dirname, '..', 'atlas.json');
            const rawData = fs.readFileSync(atlasPath, 'utf8');
            this.atlasData = JSON.parse(rawData);
            console.log(`✅ Loaded ${this.atlasData.result.length} actions from atlas.json`);
        } catch (error) {
            console.error('❌ Error loading atlas.json:', error.message);
            process.exit(1);
        }
    }

    setupMiddleware() {
        // Parse JSON bodies
        this.app.use(express.json());
        
        // Serve static files from public directory
        this.app.use(express.static(path.join(__dirname, '..', 'public')));
    }

    setupRoutes() {
        // Serve the main page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
        });

        // Chat API endpoint
        this.app.post('/api/chat', async (req, res) => {
            try {
                const { message } = req.body;
                console.log('\n🔍 [API] Received user query:', message);
                
                if (!message || message.trim() === '') {
                    console.log('❌ [API] Empty message received');
                    return res.status(400).json({ error: 'Message is required' });
                }

                const response = await this.processQuery(message);
                console.log('\n🤖 [API] Generated response:', response);
                console.log('\n📤 [API] Sending response to frontend...');
                
                res.json({ response });
            } catch (error) {
                console.error('❌ [API] Error processing chat request:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                actionsLoaded: this.atlasData ? this.atlasData.result.length : 0 
            });
        });
    }

    async callOpenRouterAPI(messages) {
        try {
            console.log('🔑 [API] Using API key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
            console.log('🌐 [API] Calling URL:', this.baseURL);
            console.log('🤖 [API] Using model:', this.model);
            console.log('💬 [API] Messages:', JSON.stringify(messages, null, 2));

            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': this.siteUrl,
                    'X-Title': this.siteName,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: this.temperature,
                    max_tokens: this.maxTokens
                }),
                agent: httpsAgent
            });

            console.log('📡 [API] Response status:', response.status);
            console.log('📡 [API] Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [API] Error response body:', errorText);
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📥 [API] Full response data:', JSON.stringify(data, null, 2));
            
            // Check if the response contains an error (OpenRouter error format)
            if (data.error) {
                console.error('❌ [API] OpenRouter returned error:', data.error);
                throw new Error(`OpenRouter API Error: ${data.error.message || 'Unknown error'} (Code: ${data.error.code || 'N/A'})`);
            }
            
            // Check if the response has the expected structure
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('❌ [API] Invalid response structure:', data);
                throw new Error('Invalid response structure from API - missing choices or message');
            }

            const content = data.choices[0].message.content;
            console.log('✅ [API] Successfully extracted content:', content ? `${content.substring(0, 100)}...` : 'Empty content');
            
            // Check if content is empty or null
            if (!content || content.trim() === '') {
                console.warn('⚠️ [API] Received empty content from API');
                console.log('🔍 [API] Full message object:', JSON.stringify(data.choices[0].message, null, 2));
                
                // Try to extract from reasoning field if available (deepseek-r1 uses this)
                if (data.choices[0].message.reasoning) {
                    console.log('🔄 [API] Using reasoning field as fallback');
                    const reasoningContent = data.choices[0].message.reasoning;
                    
                    // For deepseek-r1, sometimes the actual response is buried in the reasoning
                    // Try to extract a more useful response from reasoning
                    if (reasoningContent.includes('```json') || reasoningContent.includes('Action:')) {
                        return reasoningContent;
                    } else {
                        // Generate a helpful response based on reasoning content
                        return this.generateResponseFromReasoning(reasoningContent);
                    }
                }
                
                // Return a helpful message if content is truly empty
                return 'I apologize, but I received an empty response from the AI service. Please try rephrasing your question or try again.';
            }
            
            return content;
        } catch (error) {
            console.error('❌ Error calling OpenRouter API:', error.message);
            console.error('❌ Full error:', error);
            
            // Return a more helpful error message based on the type of error
            if (error.message.includes('unable to get local issuer certificate') || error.message.includes('UNABLE_TO_GET_ISSUER_CERT_LOCALLY')) {
                return 'Sorry, I encountered a network security error. This might be a temporary issue. Please try again in a moment.';
            } else if (error.message.includes('OpenRouter API Error')) {
                return 'Sorry, the AI service is experiencing technical difficulties. Please try again later.';
            } else if (error.message.includes('Invalid response structure')) {
                return 'Sorry, I received an unexpected response from the AI service. Please try again.';
            } else {
                return 'Sorry, I encountered an error while processing your request. Please check your API key and try again.';
            }
        }
    }

    generateResponseFromReasoning(reasoningContent) {
        // Extract useful information from reasoning content
        console.log('🧠 [API] Generating response from reasoning content');
        
        // Look for action mentions in reasoning
        const actionMatches = reasoningContent.match(/addClientCreditsV2|addMessageV1|addLeadV1|addContactUserV1/gi);
        if (actionMatches) {
            const action = actionMatches[0];
            return `Based on your query, you should use the **${action}** action. This action helps with the functionality you're looking for. Please check the atlas.json file for the exact required and optional arguments for this action.

### Example Usage:
\`\`\`json
{
  "type": "${action}",
  "arguments": {
    // Add required arguments here based on atlas.json
  }
}
\`\`\`

For specific argument details, please refer to your atlas.json file or ask about the specific action.`;
        }
        
        // If no specific action found, provide general help
        return `I understand you're looking for help with API actions. Based on the available actions in your atlas.json file, here are some common ones you might find useful:

- **addClientCreditsV2**: Add credits to a client account
- **addMessageV1**: Add a message to a user
- **addLeadV1**: Add a new lead to the system
- **addContactUserV1**: Add a contact user

Please specify which action you'd like to know more about, or describe what you're trying to accomplish.`;
    }

    createSystemPrompt() {
        const actionTypes = this.atlasData.result.map(action => action.type).slice(0, this.contextActionLimit);
        
        return `You are an AI assistant that helps users understand and work with API actions from an atlas.json file. 

The atlas.json contains ${this.atlasData.result.length} different action types, each with required and optional arguments.

Here are some example action types available:
${actionTypes.join(', ')}

Each action has:
- type: The name/identifier of the action
- requiredArguments: Array of arguments that must be provided
- optionalArguments: Array of arguments that can be optionally provided

CRITICAL INSTRUCTIONS - You MUST follow this format exactly:

1. Always start your response with a clear heading using ### 
2. Always provide a complete JSON example using markdown code blocks
3. Be concise but comprehensive
4. Use this exact structure:

### Action: [actionName]
**Purpose**: [Brief description]
**Required Arguments**: [List them clearly]
**Optional Arguments**: [List common ones]
**Example Usage**:
\`\`\`json
{
  "type": "actionName",
  "arguments": {
    "requiredArg1": "example_value",
    "requiredArg2": "example_value",
    "optionalArg1": "example_value"
  }
}
\`\`\`

When users ask about actions, provide helpful information about what the action does, required arguments, optional arguments, and always include a working JSON example.

Be helpful, accurate, and always include practical examples. Focus on being direct and useful.`;
    }

    findRelevantActions(query) {
        const queryLower = query.toLowerCase();
        const relevantActions = this.atlasData.result.filter(action => {
            return action.type.toLowerCase().includes(queryLower) ||
                   action.requiredArguments.some(arg => arg.name.toLowerCase().includes(queryLower)) ||
                   action.optionalArguments.some(arg => arg.name.toLowerCase().includes(queryLower));
        });

        return relevantActions.slice(0, this.maxRelevantActions);
    }

    async processQuery(userQuery) {
        console.log(`🤔 Processing query: ${userQuery.substring(0, 50)}${userQuery.length > 50 ? '...' : ''}`);
        
        // Find relevant actions
        const relevantActions = this.findRelevantActions(userQuery);
        console.log(`📊 Found ${relevantActions.length} relevant actions`);
        
        // Create system prompt
        const systemPrompt = this.createSystemPrompt();
        
        // Create messages for the API
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
        ];

        try {
            console.log('🚀 Calling OpenRouter API...');
            const response = await this.callOpenRouterAPI(messages);
            console.log(`✅ Generated response for query: ${userQuery.substring(0, 50)}${userQuery.length > 50 ? '...' : ''}`);
            console.log('📝 Response length:', response.length, 'characters');
            return response;
        } catch (error) {
            console.error('❌ Error calling OpenRouter API:', error);
            return "I apologize, but I'm having trouble connecting to the AI service right now. Please try again later.";
        }
    }

    start() {
        // Check if API key is provided
        if (!this.apiKey || this.apiKey === 'your-openrouter-api-key-here') {
            console.error('❌ Please set your OpenRouter API key in the .env file');
            process.exit(1);
        }

        this.app.listen(this.port, () => {
            console.log(`🚀 Atlas Chatbot Server running at http://localhost:${this.port}`);
            console.log(`💡 Open your browser and navigate to the URL above`);
            console.log(`📊 Loaded ${this.atlasData.result.length} API actions`);
        });
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Server shutting down gracefully...');
    process.exit(0);
});

// Start the server
if (require.main === module) {
    const server = new AtlasChatbotServer();
    server.start();
}

module.exports = AtlasChatbotServer; 