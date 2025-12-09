/**
 * Multi-Provider AI Service
 * Supports OpenRouter, Hugging Face, Groq, and offline fallback
 */

export type AIProvider = 'openrouter' | 'huggingface' | 'groq' | 'offline';

export interface AIResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    provider: AIProvider;
}

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

class AIProviderService {
    // Default OpenRouter API key (pre-configured for immediate use)
    private readonly DEFAULT_OPENROUTER_KEY = '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';

    private apiKeys: Record<AIProvider, string> = {
        openrouter: '',
        huggingface: '',
        groq: '',
        offline: 'N/A'
    };

    private currentProvider: AIProvider = 'openrouter'; // Default to OpenRouter

    private readonly endpoints = {
        openrouter: 'https://openrouter.ai/api/v1/chat/completions',
        huggingface: 'https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf',
        groq: 'https://api.groq.com/openai/v1/chat/completions'
    };

    private readonly models = {
        openrouter: 'meta-llama/llama-3.1-8b-instruct:free', // Free model
        huggingface: 'meta-llama/Llama-2-7b-chat-hf',
        groq: 'llama-3.1-8b-instant'
    };

    constructor() {
        // Load saved keys and provider from localStorage
        this.loadFromStorage();

        // If no OpenRouter key is saved, use the default one
        if (!this.apiKeys.openrouter) {
            this.apiKeys.openrouter = this.DEFAULT_OPENROUTER_KEY;
            this.saveToStorage(); // Save the default key
        }

        // If no provider is set or it's offline, switch to OpenRouter (since we have a key)
        if (!this.currentProvider || this.currentProvider === 'offline') {
            this.currentProvider = 'openrouter';
            this.saveToStorage(); // Save the provider choice
        }
    }

    private loadFromStorage() {
        const savedProvider = localStorage.getItem('siifmart_ai_provider') as AIProvider;
        if (savedProvider) {
            this.currentProvider = savedProvider;
        }

        const savedKeys = localStorage.getItem('siifmart_ai_keys');
        if (savedKeys) {
            try {
                this.apiKeys = { ...this.apiKeys, ...JSON.parse(savedKeys) };
            } catch (e) {
                console.error('Failed to load AI keys:', e);
            }
        }
    }

    private saveToStorage() {
        localStorage.setItem('siifmart_ai_provider', this.currentProvider);
        localStorage.setItem('siifmart_ai_keys', JSON.stringify(this.apiKeys));
    }

    setProvider(provider: AIProvider) {
        this.currentProvider = provider;
        this.saveToStorage();
    }

    getProvider(): AIProvider {
        return this.currentProvider;
    }

    setApiKey(provider: AIProvider, key: string) {
        this.apiKeys[provider] = key;
        this.saveToStorage();
    }

    getApiKey(provider: AIProvider): string {
        return this.apiKeys[provider];
    }

    hasKey(provider: AIProvider): boolean {
        return provider === 'offline' || !!this.apiKeys[provider];
    }

    getAvailableProviders(): AIProvider[] {
        return Object.keys(this.apiKeys).filter(p => this.hasKey(p as AIProvider)) as AIProvider[];
    }

    async chat(messages: AIMessage[]): Promise<AIResponse> {
        // Try current provider first
        if (this.currentProvider === 'offline' || !this.hasKey(this.currentProvider)) {
            return this.offlineFallback(messages);
        }

        try {
            switch (this.currentProvider) {
                case 'openrouter':
                    return await this.chatOpenRouter(messages);
                case 'huggingface':
                    return await this.chatHuggingFace(messages);
                case 'groq':
                    return await this.chatGroq(messages);
                default:
                    return this.offlineFallback(messages);
            }
        } catch (error) {
            console.error(`${this.currentProvider} failed, falling back to offline:`, error);
            return this.offlineFallback(messages);
        }
    }

    private async chatOpenRouter(messages: AIMessage[]): Promise<AIResponse> {
        const response = await fetch(this.endpoints.openrouter, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKeys.openrouter}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'SIIFMART'
            },
            body: JSON.stringify({
                model: this.models.openrouter,
                messages: messages,
                temperature: 0.3,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenRouter Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || '',
            usage: data.usage,
            provider: 'openrouter'
        };
    }

    private async chatHuggingFace(messages: AIMessage[]): Promise<AIResponse> {
        // Convert messages to Hugging Face format
        const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

        const response = await fetch(this.endpoints.huggingface, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKeys.huggingface}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 1024,
                    temperature: 0.3,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Hugging Face Error: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        const content = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;

        return {
            content: content || '',
            provider: 'huggingface'
        };
    }

    private async chatGroq(messages: AIMessage[]): Promise<AIResponse> {
        const response = await fetch(this.endpoints.groq, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKeys.groq}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.models.groq,
                messages: messages,
                temperature: 0.3,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Groq Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || '',
            usage: data.usage,
            provider: 'groq'
        };
    }

    private offlineFallback(messages: AIMessage[]): AIResponse {
        const userMessage = messages[messages.length - 1]?.content.toLowerCase() || '';

        // Simple pattern matching for common commands
        let response = "I'm running in offline mode with limited capabilities. ";

        // Navigation patterns
        if (userMessage.includes('go to') || userMessage.includes('navigate') || userMessage.includes('open')) {
            if (userMessage.includes('inventory')) {
                return {
                    content: JSON.stringify({ action: 'navigate', params: { route: '/inventory' } }),
                    provider: 'offline'
                };
            } else if (userMessage.includes('procurement') || userMessage.includes('purchase')) {
                return {
                    content: JSON.stringify({ action: 'navigate', params: { route: '/procurement' } }),
                    provider: 'offline'
                };
            } else if (userMessage.includes('pos') || userMessage.includes('point of sale')) {
                return {
                    content: JSON.stringify({ action: 'navigate', params: { route: '/pos' } }),
                    provider: 'offline'
                };
            } else if (userMessage.includes('warehouse') || userMessage.includes('wms')) {
                return {
                    content: JSON.stringify({ action: 'navigate', params: { route: '/wms' } }),
                    provider: 'offline'
                };
            } else if (userMessage.includes('dashboard') || userMessage.includes('home')) {
                return {
                    content: JSON.stringify({ action: 'navigate', params: { route: '/dashboard' } }),
                    provider: 'offline'
                };
            } else if (userMessage.includes('employee')) {
                return {
                    content: JSON.stringify({ action: 'navigate', params: { route: '/employees' } }),
                    provider: 'offline'
                };
            } else if (userMessage.includes('customer')) {
                return {
                    content: JSON.stringify({ action: 'navigate', params: { route: '/customers' } }),
                    provider: 'offline'
                };
            } else if (userMessage.includes('finance') || userMessage.includes('financial')) {
                return {
                    content: JSON.stringify({ action: 'navigate', params: { route: '/finance' } }),
                    provider: 'offline'
                };
            } else if (userMessage.includes('settings') || userMessage.includes('setting')) {
                return {
                    content: JSON.stringify({ action: 'navigate', params: { route: '/settings' } }),
                    provider: 'offline'
                };
            }
        }

        // Help/Info patterns
        if (userMessage.includes('help') || userMessage.includes('what can you do')) {
            response += "I can help you navigate the system. Try commands like 'go to inventory' or 'open warehouse'. For advanced AI features, please configure an AI provider in Settings.";
        } else if (userMessage.includes('hello') || userMessage.includes('hi')) {
            response += "Hello! I'm SIIF INTELLIGENCE. I'm currently in offline mode. I can help with basic navigation. For full AI capabilities, please add an API key in Settings.";
        } else {
            response += "To enable full AI capabilities, please configure an AI provider (OpenRouter, Hugging Face, or Groq) in Settings.";
        }

        return {
            content: JSON.stringify({
                action: 'answer',
                params: { answer: response }
            }),
            provider: 'offline'
        };
    }

    /**
     * Interpret a natural language command
     */
    async interpretCommand(command: string, context: any): Promise<any> {
        const systemPrompt = `
You are SIIF INTELLIGENCE, an advanced AI assistant for SIIFMART - a comprehensive retail and warehouse management system.

You are helpful, knowledgeable, and can assist with:
- Answering questions about business operations, retail, inventory, warehousing, etc.
- Navigating the system
- Executing system commands
- Providing insights and recommendations
- General conversation and assistance

AVAILABLE SYSTEM ACTIONS:
- navigate: { action: 'navigate', params: { route: string } }
- create_po: { action: 'create_po', params: { items: [{ name: string, quantity: number }], supplier?: string } }
- approve_po: { action: 'approve_po', params: { id?: string, all?: boolean } }
- check_stock: { action: 'check_stock', params: { query: string } }
- impersonate: { action: 'impersonate', params: { targetUser: string } }
- answer: { action: 'answer', params: { answer: string } } (for ANY question, conversation, or general assistance)

SYSTEM ROUTES:
- /dashboard - Main dashboard
- /inventory - Product inventory management
- /procurement - Purchase orders and suppliers
- /pos - Point of Sale system
- /wms - Warehouse operations (PICK, PACK, PUTAWAY, DISPATCH)
- /employees - Employee management
- /customers - Customer management
- /finance - Financial reports and expenses
- /settings - System settings

CONTEXT:
User Role: ${context.role}
Current Page: ${context.page}

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown, no explanations, no extra text.
2. For ANY question, explanation request, or general conversation → use 'answer' action
3. For navigation requests → use 'navigate' action
4. For system commands (create PO, approve, etc.) → use the appropriate action
5. Be helpful, friendly, and conversational in your answers
6. If unsure, use 'answer' action to respond or ask for clarification

REMEMBER: Use 'answer' action for ALL questions, explanations, and conversations. Be helpful and engaging!
`;

        const messages: AIMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: command }
        ];

        const response = await this.chat(messages);

        try {
            // Clean up response if it contains markdown code blocks
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            return JSON.parse(cleanContent);
        } catch (e) {
            console.error('Failed to parse AI response:', e);
            return {
                action: 'answer',
                params: { answer: "I'm having trouble processing that request. Could you rephrase it?" }
            };
        }
    }
}

export const aiProviderService = new AIProviderService();
