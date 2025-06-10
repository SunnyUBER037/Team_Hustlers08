const fs = require('fs');
const path = require('path');
const readline = require('readline');
const fetch = require('node-fetch');
const https = require('https');

// Load environment variables from .env file
require('dotenv').config();

// Create an agent that ignores SSL certificate errors only for API requests
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

class AtlasChatbot {
    constructor() {
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

    async callOpenRouterAPI(messages) {
        try {
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
                agent: httpsAgent // Use the custom agent only for this request
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('❌ Error calling OpenRouter API:', error.message);
            return 'Sorry, I encountered an error while processing your request. Please check your API key and try again.';
        }
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

When users ask about actions, provide helpful information about:
- What the action does (infer from the name)
- Required arguments needed
- Optional arguments available
- Usage examples or suggestions

Be helpful, concise, and accurate. If you need specific details about an action that aren't clear from the name, ask for clarification.`;
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
        console.log('\n🤔 Processing your question...\n');

        // Find relevant actions based on the query
        const relevantActions = this.findRelevantActions(userQuery);
        
        let contextInfo = '';
        if (relevantActions.length > 0) {
            contextInfo = `\n\nRelevant actions from atlas.json:\n${JSON.stringify(relevantActions, null, 2)}`;
        }

        const messages = [
            {
                role: 'system',
                content: this.createSystemPrompt()
            },
            {
                role: 'user',
                content: userQuery + contextInfo
            }
        ];

        const response = await this.callOpenRouterAPI(messages);
        return response;
    }

    async startChat() {
        console.log('🚀 Atlas Chatbot powered by Deepseek AI via OpenRouter');
        console.log('💡 Ask me anything about the actions in atlas.json!');
        console.log('📝 Type "exit" to quit, "help" for examples\n');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askQuestion = () => {
            rl.question('You: ', async (input) => {
                const query = input.trim();

                if (query.toLowerCase() === 'exit') {
                    console.log('\n👋 Goodbye!');
                    rl.close();
                    return;
                }

                if (query.toLowerCase() === 'help') {
                    console.log('\n📚 Example questions you can ask:');
                    console.log('• "What actions are available for user management?"');
                    console.log('• "How do I add client credits?"');
                    console.log('• "What are the required arguments for account lockdown?"');
                    console.log('• "Show me actions related to vehicles"');
                    console.log('• "What optional arguments does addLeadV1 have?"\n');
                    askQuestion();
                    return;
                }

                if (!query) {
                    askQuestion();
                    return;
                }

                try {
                    const response = await this.processQuery(query);
                    console.log(`\n🤖 Assistant: ${response}\n`);
                } catch (error) {
                    console.error('❌ Error:', error.message);
                }

                askQuestion();
            });
        };

        askQuestion();
    }
}

// Main execution
async function main() {
    // Check if API key is provided in .env file
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your-openrouter-api-key-here') {
        console.error('❌ Please set your OpenRouter API key in the .env file:');
        console.error('   1. Open the .env file in the project root');
        console.error('   2. Replace the OPENROUTER_API_KEY value with your actual API key');
        console.error('   3. Save the file and run the chatbot again');
        process.exit(1);
    }

    console.log('🔑 OpenRouter API key loaded from .env file, initializing chatbot...\n');
    
    const chatbot = new AtlasChatbot();
    await chatbot.startChat();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Chatbot shutting down gracefully...');
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AtlasChatbot; 