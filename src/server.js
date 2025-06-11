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
        this.maxTokens = parseInt(process.env.OPENROUTER_MAX_TOKENS) || 500; // Reduced for testing continuation
        this.siteUrl = process.env.SITE_URL || 'http://localhost:3000';
        this.siteName = process.env.SITE_NAME || 'Atlas Chatbot';
        this.maxRelevantActions = parseInt(process.env.MAX_RELEVANT_ACTIONS) || 10;
        this.contextActionLimit = parseInt(process.env.CONTEXT_ACTION_LIMIT) || 20;
        
        // Add continuation state management
        this.continuationStates = new Map(); // Store continuation contexts by session ID
        
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
                const { message, conversationHistory = [], sessionId } = req.body;
                console.log('\n🔍 [API] Received user query:', message);
                console.log('📚 [API] Conversation history length:', conversationHistory.length);
                console.log('🔑 [API] Session ID:', sessionId || 'none');
                
                if (!message || message.trim() === '') {
                    console.log('❌ [API] Empty message received');
                    return res.status(400).json({ error: 'Message is required' });
                }

                // Check if this is a continuation request
                const isContinuation = message.toLowerCase().includes('continue') || message.toLowerCase().includes('more');
                let continuationContext = null;
                
                if (isContinuation && sessionId && this.continuationStates.has(sessionId)) {
                    continuationContext = this.continuationStates.get(sessionId);
                    console.log('🔄 [API] Continuation request detected');
                }

                const result = await this.processQuery(message, conversationHistory, continuationContext, sessionId);
                console.log('\n🤖 [API] Generated response length:', result.response.length);
                console.log('\n📤 [API] Sending response to frontend...');
                
                res.json(result);
            } catch (error) {
                console.error('❌ [API] Error processing chat request:', error);
                res.status(500).json({ 
                    response: 'Sorry, I encountered an error while processing your request. Please try again.',
                    hasMore: false,
                    wasCutOff: false,
                    finishReason: 'error'
                });
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

            const choice = data.choices[0];
            const content = choice.message.content;
            const finishReason = choice.finish_reason;
            const wasCutOff = finishReason === 'length';
            
            console.log('✅ [API] Successfully extracted content:', content ? `${content.substring(0, 100)}...` : 'Empty content');
            console.log('🔚 [API] Finish reason:', finishReason);
            if (wasCutOff) {
                console.log('⚠️ [API] Response was cut off due to length limit');
            }
            
            // Check if content is empty or null
            if (!content || content.trim() === '') {
                console.warn('⚠️ [API] Received empty content from API');
                console.log('🔍 [API] Full message object:', JSON.stringify(choice.message, null, 2));
                
                // Try to extract from reasoning field if available (deepseek-r1 uses this)
                if (choice.message.reasoning) {
                    console.log('🔄 [API] Using reasoning field as fallback');
                    const reasoningContent = choice.message.reasoning;
                    
                    // For deepseek-r1, sometimes the actual response is buried in the reasoning
                    // Try to extract a more useful response from reasoning
                    if (reasoningContent.includes('```json') || reasoningContent.includes('Action:')) {
                        return { content: reasoningContent, wasCutOff: false, finishReason };
                    } else {
                        // Generate a helpful response based on reasoning content
                        const generatedContent = this.generateResponseFromReasoning(reasoningContent);
                        return { content: generatedContent, wasCutOff: false, finishReason };
                    }
                }
                
                // Return a helpful message if content is truly empty
                const fallbackContent = 'I apologize, but I received an empty response from the AI service. Please try rephrasing your question or try again.';
                return { content: fallbackContent, wasCutOff: false, finishReason };
            }
            
            return { content, wasCutOff, finishReason };
        } catch (error) {
            console.error('❌ Error calling OpenRouter API:', error.message);
            console.error('❌ Full error:', error);
            
            // Return a more helpful error message based on the type of error
            let errorContent;
            if (error.message.includes('unable to get local issuer certificate') || error.message.includes('UNABLE_TO_GET_ISSUER_CERT_LOCALLY')) {
                errorContent = 'Sorry, I encountered a network security error. This might be a temporary issue. Please try again in a moment.';
            } else if (error.message.includes('OpenRouter API Error')) {
                errorContent = 'Sorry, the AI service is experiencing technical difficulties. Please try again later.';
            } else if (error.message.includes('Invalid response structure')) {
                errorContent = 'Sorry, I received an unexpected response from the AI service. Please try again.';
            } else {
                errorContent = 'Sorry, I encountered an error while processing your request. Please check your API key and try again.';
            }
            
            return { content: errorContent, wasCutOff: false, finishReason: 'error' };
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

    findRelevantActions(query) {
        console.log(`🔍 [Search] Providing comprehensive action context for AI analysis`);
        
        const allActions = this.atlasData.result;
        const queryLower = query.toLowerCase();
        
        // Start with a diverse set of commonly used actions
        const coreActions = [
            'addClientCreditsV2', 'addMessageV1', 'addLeadV1', 'addContactUserV1', 
            'accountLockdownV1', 'addUserNoteV1', 'addSystemNoteV1', 'addTripNoteV1',
            'removeClientCreditsV1', 'performUserActionV1', 'createCaseV1', 'applyResolutionV2',
            'adjustFareV2', 'banClientV1', 'createAssociatedContactV1'
        ];
        
        // Find actions that contain words from the user's query
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
        const queryMatchedActions = allActions.filter(action => {
            const actionType = action.type.toLowerCase();
            return queryWords.some(word => actionType.includes(word));
        });
        
        // Combine core actions with query-matched actions
        const selectedActionTypes = new Set([...coreActions]);
        queryMatchedActions.forEach(action => selectedActionTypes.add(action.type));
        
        // Get the actual action objects
        const selectedActions = Array.from(selectedActionTypes)
            .map(type => allActions.find(action => action.type === type))
            .filter(Boolean);
        
        // If we have too many, prioritize query matches + core actions
        if (selectedActions.length > 60) {
            const priorityActions = [
                ...queryMatchedActions.slice(0, 30),
                ...allActions.filter(action => coreActions.includes(action.type))
            ];
            const uniqueActions = Array.from(
                new Map(priorityActions.map(action => [action.type, action])).values()
            );
            console.log(`📊 [Search] Providing ${uniqueActions.length} priority actions (query matches + core actions)`);
            return uniqueActions.slice(0, 60);
        }
        
        // Fill remaining slots with random diverse actions if needed
        if (selectedActions.length < 50) {
            const remainingActions = allActions.filter(action => !selectedActionTypes.has(action.type));
            const additionalCount = Math.min(50 - selectedActions.length, remainingActions.length);
            const randomActions = remainingActions
                .sort(() => 0.5 - Math.random())
                .slice(0, additionalCount);
            selectedActions.push(...randomActions);
        }
        
        console.log(`📊 [Search] Providing ${selectedActions.length} actions for AI analysis`);
        console.log(`🎯 [Search] Includes ${queryMatchedActions.length} query-matched actions and ${coreActions.length} core actions`);
        
        return selectedActions;
    }

    createSystemPrompt(availableActions = []) {
        return `You are an intelligent API assistant that helps users understand and work with actions from an atlas.json file containing ${this.atlasData.result.length} different API actions.

AVAILABLE ACTIONS FOR THIS REQUEST:
${JSON.stringify(availableActions, null, 2)}

YOUR CAPABILITIES:
- Analyze user queries to understand their intent and needs
- Intelligently select the most relevant actions from the available set
- Adapt your response format based on what the user is asking for
- Provide practical, actionable information with real examples

RESPONSE GUIDELINES:

**For LIST/OVERVIEW requests**: Provide concise bullet points or numbered lists
**For SPECIFIC action questions**: Give detailed explanations with full JSON examples  
**For HOW-TO questions**: Focus on the most relevant actions with step-by-step guidance
**For GENERAL questions**: Provide helpful overviews and suggest related actions

RESPONSE FORMATS:

For lists, use:
• **actionName** - Brief description of what it does

For detailed actions, use:
### Action: actionName
**Purpose**: Clear description
**Required Arguments**: List with brief explanations
**Optional Arguments**: Most useful optional arguments
**Example Usage**:
\`\`\`json
{
  "type": "actionName",
  "arguments": {
    "requiredArg": "realistic_example_value",
    "optionalArg": "helpful_example"
  }
}
\`\`\`

IMPORTANT:
- Understand the user's actual intent (are they asking for a list, specific help, or exploration?)
- Select only the most relevant actions - don't try to cover everything
- Provide realistic, practical examples that users can actually use
- Be conversational and helpful, not robotic
- If the user asks for "top X" actions, interpret this contextually (most useful, most common, etc.)

Analyze the user's query and respond appropriately with the most helpful information.`;
    }

    async processQuery(userQuery, conversationHistory = [], continuationContext = null, sessionId = null) {
        console.log(`🤔 Processing query: ${userQuery.substring(0, 50)}${userQuery.length > 50 ? '...' : ''}`);
        
        let systemPrompt, availableActions;
        
        if (continuationContext) {
            // This is a continuation request
            console.log('🔄 [Continuation] Resuming from previous context');
            systemPrompt = continuationContext.systemPrompt;
            availableActions = continuationContext.availableActions;
            
            // Modify the user query to indicate continuation
            userQuery = `Please continue from where you left off. The user said: "${userQuery}". Continue providing the detailed explanation you were in the middle of.`;
        } else {
            // Get a diverse set of actions for the AI to analyze
            availableActions = this.findRelevantActions(userQuery);
            console.log(`📊 Providing ${availableActions.length} actions for AI analysis`);
            
            // Create system prompt with available actions for AI to intelligently select from
            systemPrompt = this.createSystemPrompt(availableActions);
        }
        
        // Create messages for the API, including conversation history
        const messages = [
            { role: "system", content: systemPrompt }
        ];
        
        // Add conversation history (limit to last 10 exchanges to avoid token limits)
        const recentHistory = conversationHistory.slice(-10);
        messages.push(...recentHistory);
        
        // Add current user query
        messages.push({ role: "user", content: userQuery });
        
        console.log(`💬 [API] Total messages in context: ${messages.length} (including ${recentHistory.length} history messages)`);

        try {
            console.log('🚀 Calling OpenRouter API...');
            const apiResult = await this.callOpenRouterAPI(messages);
            const { content, wasCutOff, finishReason } = apiResult;
            
            console.log(`✅ Generated response for query: ${userQuery.substring(0, 50)}${userQuery.length > 50 ? '...' : ''}`);
            console.log('📝 Response length:', content.length, 'characters');
            
            let finalResponse = content;
            let hasMore = false;
            
            // Handle cut-off responses
            if (wasCutOff && sessionId) {
                console.log('✂️ [Continuation] Response was cut off, setting up continuation');
                hasMore = true;
                
                // Store continuation context
                this.continuationStates.set(sessionId, {
                    systemPrompt: systemPrompt,
                    availableActions: availableActions,
                    originalQuery: continuationContext ? continuationContext.originalQuery : userQuery,
                    timestamp: Date.now()
                });
                
                // Add continuation notice to response
                finalResponse += '\n\n---\n**⏭️ Response was cut off. Type "continue" or "more" to see the rest.**';
                
                // Clean up old continuation states (older than 1 hour)
                this.cleanupOldContinuationStates();
            } else if (sessionId && this.continuationStates.has(sessionId)) {
                // Response completed, clean up continuation state
                this.continuationStates.delete(sessionId);
            }
            
            return {
                response: finalResponse,
                hasMore: hasMore,
                wasCutOff: wasCutOff,
                finishReason: finishReason
            };
        } catch (error) {
            console.error('❌ Error calling OpenRouter API:', error);
            return {
                response: "I apologize, but I'm having trouble connecting to the AI service right now. Please try again later.",
                hasMore: false,
                wasCutOff: false,
                finishReason: 'error'
            };
        }
    }

    cleanupOldContinuationStates() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [sessionId, state] of this.continuationStates.entries()) {
            if (state.timestamp < oneHourAgo) {
                console.log(`🧹 [Cleanup] Removing old continuation state for session: ${sessionId}`);
                this.continuationStates.delete(sessionId);
            }
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