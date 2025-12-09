
/**
 * Groq AI Service
 * Provides blazing fast cloud-based inference using Groq's LPU.
 * 100% Free tier available.
 */

export interface GroqResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

class GroqService {
    private apiKey: string = ''; // User needs to set this
    private baseUrl: string = 'https://api.groq.com/openai/v1/chat/completions';
    private model: string = 'llama-3.1-8b-instant'; // Fast and smart

    constructor() {
        // Try to load from localStorage if available
        const savedKey = localStorage.getItem('siifmart_groq_key');
        if (savedKey) {
            this.apiKey = savedKey;
        }
    }

    setApiKey(key: string) {
        this.apiKey = key;
        localStorage.setItem('siifmart_groq_key', key);
    }

    getApiKey(): string {
        return this.apiKey;
    }

    hasKey(): boolean {
        return !!this.apiKey;
    }

    async chat(messages: { role: 'system' | 'user' | 'assistant', content: string }[]): Promise<GroqResponse> {
        if (!this.apiKey) {
            throw new Error('Groq API Key is missing. Please add it in Settings.');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.3, // Low temperature for precise commands
                    max_tokens: 1024,
                    top_p: 1,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return {
                content: data.choices[0]?.message?.content || '',
                usage: data.usage
            };

        } catch (error) {
            console.error('Groq Service Error:', error);
            throw error;
        }
    }

    /**
     * Interpret a natural language command using Groq
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

EXAMPLES:

User: "What is inventory management?"
JSON: { "action": "answer", "params": { "answer": "Inventory management is the process of ordering, storing, using, and selling a company's inventory. This includes managing raw materials, components, and finished products, as well as warehousing and processing such items. In SIIFMART, you can manage inventory through the Inventory page where you can track stock levels, create products, and monitor transfers." } }

User: "How does the warehouse system work?"
JSON: { "action": "answer", "params": { "answer": "The SIIFMART warehouse system (WMS) manages four key operations: PICK (selecting items from inventory), PACK (preparing items for shipment), PUTAWAY (storing received items), and DISPATCH (shipping completed orders). Each operation has dedicated workflows and job assignments to ensure efficient warehouse operations." } }

User: "Go to inventory"
JSON: { "action": "navigate", "params": { "route": "/inventory" } }

User: "Tell me a joke"
JSON: { "action": "answer", "params": { "answer": "Why did the inventory manager break up with the spreadsheet? Because it had too many issues with commitment... to accurate stock counts! 😄" } }

User: "Order 50 Cokes"
JSON: { "action": "create_po", "params": { "items": [{ "name": "Cokes", "quantity": 50 }] } }

User: "What's the weather?"
JSON: { "action": "answer", "params": { "answer": "I don't have access to real-time weather data, but I can help you with anything related to SIIFMART operations, inventory management, or business questions!" } }

REMEMBER: Use 'answer' action for ALL questions, explanations, and conversations. Be helpful and engaging!
`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: command }
        ];

        // @ts-ignore
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
            console.error('Failed to parse Groq response:', e);
            return {
                action: 'answer',
                params: { answer: "I'm having trouble processing that request. Could you rephrase it?" }
            };
        }
    }
}

export const groqService = new GroqService();
