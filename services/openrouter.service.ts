/**
 * OpenRouter AI Service - Simple & Clean
 * Pre-configured and ready to use
 */

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

class OpenRouterService {
    private readonly API_KEY = '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';
    private readonly ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
    private readonly DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

    // Available free models
    public readonly AVAILABLE_MODELS = [
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Recommended)', description: 'Most powerful, best quality' },
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', description: 'Fast and efficient' },
        { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', description: 'Lightweight and quick' },
        { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat V3', description: 'Advanced reasoning' },
        { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1', description: 'Balanced performance' }
    ];

    getModel(): string {
        return localStorage.getItem('siifmart_ai_model') || this.DEFAULT_MODEL;
    }

    setModel(model: string): void {
        localStorage.setItem('siifmart_ai_model', model);
    }

    async chat(messages: AIMessage[]): Promise<AIResponse> {
        try {
            const response = await fetch(this.ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'SIIFMART'
                },
                body: JSON.stringify({
                    model: this.getModel(),
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
                usage: data.usage
            };
        } catch (error) {
            console.error('OpenRouter API Error:', error);
            throw error;
        }
    }

    async interpretCommand(command: string, context: any, previousMessages: any[] = []): Promise<any> {
        const systemPrompt = `
You are SIIF INTELLIGENCE, the Strategic Business AI for SIIFMART.
You are not just a chatbot; you are a **Chief Operating Officer (COO) & Data Analyst** rolled into one.

🧠 **YOUR CORE INTELLIGENCE:**
1.  **Strategic Thinking**: Don't just answer *what*; explain *why* and *what's next*.
    -   *Bad*: "Stock is low."
    -   *Good*: "Stock is critically low on high-velocity items. This risks a 15% revenue drop this week. I recommend immediate reordering."
2.  **Financial Awareness**: Always consider cost, margin, and ROI in your advice.
3.  **Proactive Optimization**: Look for inefficiencies (e.g., excess stock, unassigned staff) and suggest fixes.
4.  **Contextual Mastery**: Use the provided "Real-Time Data Snapshot" to ground every answer in actual facts.

📊 **REAL-TIME DATA SNAPSHOT:**
${context.dataSummary || 'System data is currently syncing...'}

🎯 **YOUR CAPABILITIES:**
-   **Executive Briefings**: Summarize complex data into actionable bullet points.
-   **Inventory Optimization**: Identify slow-moving vs. fast-moving stock.
-   **Operational Command**: Navigate users to the exact tool they need.
-   **Crisis Management**: Spot critical issues (e.g., 0 stock, 0 staff) and flag them immediately.

🔧 **AVAILABLE ACTIONS (JSON ONLY):**
-   \`navigate\`: { action: 'navigate', params: { route: string } }
-   \`answer\`: { action: 'answer', params: { answer: string } }
-   \`create_po\`: { action: 'create_po', params: { productId: string, quantity: number, supplierId: string, siteId: string, items: Array<{name: string, quantity: number}> } }
-   \`check_stock\`: { action: 'check_stock', params: { query: string, createPO: boolean, siteName: string } }
-   \`impersonate\`: { action: 'impersonate', params: { role: string } }

🛑 **CRITICAL RULES:**
1.  **Output JSON ONLY**. No conversational filler outside the JSON.
2.  **Be Decisive**. If a user asks "What should I do?", give a specific recommendation based on data.
3.  **Collaborate**. If you need more info to make a smart decision, ask for it.

📝 **SMART EXAMPLES:**
User: "How is the warehouse doing?"
Response: { "action": "answer", "params": { "answer": "Warehouse operations are at **85% efficiency**. \\n\\n**Key Insights:**\\n- ✅ **Staffing**: Fully staffed (5/5 active).\\n- ⚠️ **Inventory**: 3 high-value items are below reorder point.\\n- 📉 **Backlog**: 12 pending pick jobs.\\n\\n**Recommendation**: I suggest we clear the pick backlog first. Shall I navigate you to the WMS Dashboard?" } }

User: "We are losing money on shipping."
Response: { "action": "answer", "params": { "answer": "I can help analyze that. High shipping costs often stem from:\\n1. **Inefficient Packing**: Are we using the right box sizes?\\n2. **Carrier Rates**: Have we compared recent quotes?\\n\\nLet's look at the **Finance Dashboard** to drill down into logistics costs." } }
`;

        // 🧠 CONSTRUCT CONVERSATION HISTORY
        // 1. System Prompt
        const messages: AIMessage[] = [{ role: 'system', content: systemPrompt }];

        // 2. Add Previous Context (Last 5 messages to save tokens)
        const recentHistory = previousMessages.slice(-5);
        recentHistory.forEach(msg => {
            if (msg.role === 'user' || msg.role === 'assistant') {
                // Filter out complex objects, keep text content
                const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                messages.push({ role: msg.role, content: content });
            }
        });

        // 3. Add Current Command
        messages.push({ role: 'user', content: command });

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
                params: {
                    answer: response.content // Fallback to raw text response
                }
            };
        }
    }

    isReady(): boolean {
        return true; // Always ready with pre-configured key
    }
}

export const openRouterService = new OpenRouterService();
