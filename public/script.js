class ChatBot {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        this.welcomeSection = document.getElementById('welcome-section');
        this.exampleButtons = document.getElementById('example-buttons');
        this.messageCount = 0;
        this.codeBlockCounter = 0;

        this.initializeEventListeners();
        // Generate examples immediately when the chatbot loads
        this.generateRandomExamples();
    }

    generateRandomExamples() {
        const allExamples = [
            {
                text: "How do I add a message to a user?",
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                       </svg>`
            },
            {
                text: "What is addClientCreditsV2?",
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                       </svg>`
            },
            {
                text: "Show me vehicle management actions",
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                        <path d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                       </svg>`
            },
            {
                text: "How do I add a lead?",
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <path d="M20 8v6M23 11h-6"/>
                       </svg>`
            },
            {
                text: "What actions are available for user management?",
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                       </svg>`
            },
            {
                text: "How do I add client credits?",
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                       </svg>`
            },
            {
                text: "What is addLeadV1?",
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <path d="M20 8v6M23 11h-6"/>
                       </svg>`
            },
            {
                text: "Show me payment related actions",
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                       </svg>`
            }
        ];

        // Shuffle and pick 4 random examples
        const shuffled = allExamples.sort(() => 0.5 - Math.random());
        const selectedExamples = shuffled.slice(0, 4);

        // Clear existing examples
        this.exampleButtons.innerHTML = '';

        // Create example buttons
        selectedExamples.forEach(example => {
            const button = document.createElement('button');
            button.className = 'example-query';
            button.innerHTML = `
                <div class="example-icon">${example.icon}</div>
                <span class="example-query-text">${example.text}</span>
                <div class="example-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14m-7-7 7 7-7 7"/>
                    </svg>
                </div>
            `;
            
            button.addEventListener('click', () => {
                this.userInput.value = example.text;
                this.sendMessage();
            });

            this.exampleButtons.appendChild(button);
        });

        console.log('✅ [Frontend] Generated 4 random example queries');
    }

    initializeEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter key press (but not Shift+Enter for multiline)
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
        });

        // Example query buttons - Fixed click handler
        document.querySelectorAll('.example-query').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const textSpan = btn.querySelector('.example-query-text');
                if (textSpan) {
                    const query = textSpan.textContent.trim();
                    this.userInput.value = query;
                    this.sendMessage();
                }
            });
        });
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        console.log('📤 [Frontend] Sending message:', message);

        // Hide welcome section after first message
        if (this.messageCount === 0) {
            this.welcomeSection.style.display = 'none';
        }

        // Add user message
        this.addMessage(message, 'user');
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        this.sendButton.disabled = true;

        // Show loading
        this.showLoading();

        try {
            console.log('🌐 [Frontend] Making API request to /api/chat');
            // Send to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            console.log('📡 [Frontend] API response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📥 [Frontend] Received API data:', data);
            console.log('🤖 [Frontend] Bot response:', data.response);
            
            // Hide loading
            this.hideLoading();
            
            // Add bot response
            this.addMessage(data.response, 'assistant');
            console.log('✅ [Frontend] Bot message added to chat');
            
        } catch (error) {
            console.error('❌ [Frontend] Error:', error);
            this.hideLoading();
            this.addMessage('Sorry, I encountered an error while processing your request. Please try again or check if the server is running.', 'assistant');
        }

        this.sendButton.disabled = false;
        this.messageCount++;
        
        // Generate new example queries for next time
        if (this.messageCount === 1) {
            setTimeout(() => {
                this.generateRandomExamples();
            }, 2000);
        }
    }

    addMessage(content, sender) {
        console.log(`💬 [Frontend] Adding ${sender} message, content length:`, content.length);
        console.log(`📄 [Frontend] Message content preview:`, content.substring(0, 200) + (content.length > 200 ? '...' : ''));
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? 'U' : 'A';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        // Process content for code blocks and formatting
        console.log('🔄 [Frontend] Starting content processing...');
        const processedContent = this.processMessageContent(content);
        console.log('✅ [Frontend] Content processing completed, processed length:', processedContent.length);
        
        messageText.innerHTML = processedContent;

        messageContent.appendChild(messageText);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Apply syntax highlighting to any new code blocks
        console.log('🎨 [Frontend] Scheduling syntax highlighting...');
        setTimeout(() => {
            console.log('🎨 [Frontend] Applying syntax highlighting...');
            this.applySyntaxHighlighting(messageContent);
        }, 100);
        
        console.log(`✅ [Frontend] ${sender} message added to chat successfully`);
    }

    processMessageContent(content) {
        console.log('🔄 [Frontend] Processing message content, length:', content.length);
        console.log('📝 [Frontend] Raw content:', content);
        
        // Convert markdown-style formatting
        let processed = content;
        
        // Handle JSON code blocks with proper formatting - improved regex to handle all variations
        processed = processed.replace(/```json\s*([\s\S]*?)\s*```/gi, (match, code) => {
            const blockId = `code-block-${++this.codeBlockCounter}`;
            console.log('🔍 [Frontend] Found JSON code block:', code.substring(0, 100) + '...');
            
            // Format JSON with proper indentation
            let formattedCode;
            try {
                const cleanCode = code.trim();
                const parsed = JSON.parse(cleanCode);
                formattedCode = JSON.stringify(parsed, null, 2);
                console.log('✅ [Frontend] Successfully parsed and formatted JSON');
            } catch (e) {
                console.log('⚠️ [Frontend] JSON parsing failed, using fallback formatting');
                // If parsing fails, just format it nicely with better fallback
                formattedCode = code.trim()
                    .replace(/,\s*(?=[\}\]])/g, ',') // Clean up trailing commas
                    .replace(/,/g, ',\n  ')
                    .replace(/{/g, '{\n  ')
                    .replace(/}/g, '\n}')
                    .replace(/\[/g, '[\n  ')
                    .replace(/\]/g, '\n]')
                    .replace(/:\s*/g, ': ')
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('\n');
            }
            
            return `
                <div class="code-block">
                    <div class="code-header">
                        <span class="code-language">JSON</span>
                        <button class="copy-button" onclick="copyCodeBlock('${blockId}')">Copy</button>
                    </div>
                    <pre id="${blockId}" class="code-content"><code class="language-json">${this.escapeHtml(formattedCode)}</code></pre>
                </div>
            `;
        });

        // Handle generic code blocks - improved regex
        processed = processed.replace(/```(\w+)?\s*([\s\S]*?)\s*```/g, (match, lang, code) => {
            const blockId = `code-block-${++this.codeBlockCounter}`;
            const language = lang || 'text';
            console.log(`🔍 [Frontend] Found ${language} code block`);
            
            return `
                <div class="code-block">
                    <div class="code-header">
                        <span class="code-language">${language.toUpperCase()}</span>
                        <button class="copy-button" onclick="copyCodeBlock('${blockId}')">Copy</button>
                    </div>
                    <pre id="${blockId}" class="code-content"><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>
                </div>
            `;
        });

        // Convert markdown formatting - improved to handle more cases
        processed = processed.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        processed = processed.replace(/^## (.*$)/gm, '<h2>$2</h2>');
        processed = processed.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Handle bold and italic text
        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
        processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // Convert lists - improved handling
        processed = processed.replace(/^[\s]*[-*+] (.*$)/gm, '<li>$1</li>');
        processed = processed.replace(/^[\s]*(\d+)\. (.*$)/gm, '<li>$2</li>');
        
        // Wrap consecutive <li> elements in <ul> - improved
        processed = processed.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');
        processed = processed.replace(/<\/ul>\s*<ul>/g, '');
        
        // Handle line breaks and paragraphs better
        // First, preserve existing HTML structure
        const hasStructure = processed.includes('<h') || processed.includes('<ul>') || processed.includes('<div class="code-block">');
        
        if (!hasStructure) {
            // Only apply paragraph formatting if no structure exists
            processed = processed.replace(/\n\n+/g, '</p><p>');
            processed = processed.replace(/\n/g, '<br>');
            processed = `<p>${processed}</p>`;
        } else {
            // Just handle line breaks within existing structure
            processed = processed.replace(/\n(?![<\s])/g, '<br>');
        }
        
        // Clean up any empty paragraphs
        processed = processed.replace(/<p><\/p>/g, '');
        processed = processed.replace(/<p>\s*<\/p>/g, '');
        
        console.log('✅ [Frontend] Processed content length:', processed.length);
        return processed;
    }

    applySyntaxHighlighting(container) {
        // Find all code elements and apply Prism highlighting
        const codeElements = container.querySelectorAll('code[class*="language-"]');
        console.log(`🎨 [Frontend] Applying syntax highlighting to ${codeElements.length} code blocks`);
        
        if (codeElements.length === 0) {
            console.log('ℹ️ [Frontend] No code blocks found for highlighting');
            return;
        }
        
        codeElements.forEach((codeElement, index) => {
            try {
                console.log(`🔍 [Frontend] Processing code block ${index + 1}:`, codeElement.className);
                
                // Apply Prism highlighting
                if (window.Prism && window.Prism.highlightElement) {
                    // Force re-highlight by removing existing highlighting
                    codeElement.removeAttribute('data-highlighted');
                    
                    // Apply highlighting
                    Prism.highlightElement(codeElement);
                    console.log(`✅ [Frontend] Applied Prism highlighting to code block ${index + 1}`);
                    
                    // Verify highlighting was applied
                    if (codeElement.querySelector('.token')) {
                        console.log(`🎯 [Frontend] Syntax highlighting tokens found in block ${index + 1}`);
                    } else {
                        console.log(`⚠️ [Frontend] No syntax highlighting tokens found in block ${index + 1}`);
                    }
                } else {
                    console.warn('⚠️ [Frontend] Prism.js not loaded or highlightElement not available');
                    
                    // Fallback: at least add some basic styling
                    codeElement.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace';
                    codeElement.style.fontSize = '14px';
                    codeElement.style.lineHeight = '1.4';
                }
            } catch (error) {
                console.error(`❌ [Frontend] Error applying syntax highlighting to block ${index + 1}:`, error);
            }
        });
        
        // Also check for any inline code elements
        const inlineCodeElements = container.querySelectorAll('code.inline-code');
        if (inlineCodeElements.length > 0) {
            console.log(`📝 [Frontend] Found ${inlineCodeElements.length} inline code elements`);
            inlineCodeElements.forEach(element => {
                element.style.backgroundColor = '#f4f4f4';
                element.style.padding = '2px 4px';
                element.style.borderRadius = '3px';
                element.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace';
                element.style.fontSize = '0.9em';
            });
        }
        
        console.log('🎨 [Frontend] Syntax highlighting process completed');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.id = 'loading-message';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'A';

        const loadingContent = document.createElement('div');
        loadingContent.className = 'message-content';
        
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
            <span style="color: #888888; font-size: 14px; margin-left: 8px;">Thinking...</span>
        `;

        loadingContent.appendChild(loadingIndicator);
        loadingDiv.appendChild(avatar);
        loadingDiv.appendChild(loadingContent);

        this.chatMessages.appendChild(loadingDiv);
        this.scrollToBottom();
    }

    hideLoading() {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Method to manually regenerate examples (can be called from console or button)
    regenerateExamples() {
        this.generateRandomExamples();
        console.log('🔄 [Frontend] Generated new example queries');
    }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 [Frontend] Initializing Atlas Chatbot...');
    window.chatbot = new ChatBot();
    console.log('✅ [Frontend] Atlas Chatbot initialized successfully');
});

// Global function to regenerate examples
function regenerateExamples() {
    if (window.chatbot) {
        window.chatbot.regenerateExamples();
    }
}

// Global function to copy code blocks
function copyCodeBlock(blockId) {
    const codeElement = document.getElementById(blockId);
    if (codeElement) {
        const text = codeElement.textContent;
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            const button = codeElement.parentElement.querySelector('.copy-button');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.color = '#00ff88';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
} 