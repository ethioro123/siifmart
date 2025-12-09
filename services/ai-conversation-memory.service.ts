/**
 * AI Conversation Memory Service
 * Maintains conversation history for context-aware responses
 */

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface ConversationContext {
    messages: ConversationMessage[];
    currentTopic?: string;
    lastIntent?: string;
    lastRoute?: string;
}

class AIConversationMemoryService {
    private conversations: Map<string, ConversationContext> = new Map();
    private maxMessages: number = 10; // Keep last 10 messages

    /**
     * Get conversation history for user
     */
    getConversation(userId: string): ConversationContext {
        if (!this.conversations.has(userId)) {
            this.conversations.set(userId, {
                messages: [],
            });
        }
        return this.conversations.get(userId)!;
    }

    /**
     * Add user message to conversation
     */
    addUserMessage(userId: string, message: string): void {
        const conversation = this.getConversation(userId);

        conversation.messages.push({
            role: 'user',
            content: message,
            timestamp: Date.now(),
        });

        // Keep only last N messages
        if (conversation.messages.length > this.maxMessages) {
            conversation.messages = conversation.messages.slice(-this.maxMessages);
        }

        this.conversations.set(userId, conversation);
    }

    /**
     * Add AI response to conversation
     */
    addAssistantMessage(userId: string, message: string): void {
        const conversation = this.getConversation(userId);

        conversation.messages.push({
            role: 'assistant',
            content: message,
            timestamp: Date.now(),
        });

        // Keep only last N messages
        if (conversation.messages.length > this.maxMessages) {
            conversation.messages = conversation.messages.slice(-this.maxMessages);
        }

        this.conversations.set(userId, conversation);
    }

    /**
     * Update conversation context
     */
    updateContext(userId: string, updates: Partial<ConversationContext>): void {
        const conversation = this.getConversation(userId);
        Object.assign(conversation, updates);
        this.conversations.set(userId, conversation);
    }

    /**
     * Get conversation summary for AI context
     */
    getConversationSummary(userId: string): string {
        const conversation = this.getConversation(userId);

        if (conversation.messages.length === 0) {
            return 'No previous conversation.';
        }

        const recentMessages = conversation.messages.slice(-5); // Last 5 messages
        const summary = recentMessages.map(msg =>
            `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
        ).join('\n');

        let context = `Recent conversation:\n${summary}`;

        if (conversation.currentTopic) {
            context += `\n\nCurrent topic: ${conversation.currentTopic}`;
        }

        if (conversation.lastRoute) {
            context += `\nLast visited: ${conversation.lastRoute}`;
        }

        return context;
    }

    /**
     * Detect if current message is a follow-up question
     */
    isFollowUpQuestion(userId: string, message: string): boolean {
        const conversation = this.getConversation(userId);

        if (conversation.messages.length === 0) {
            return false;
        }

        const lowerMessage = message.toLowerCase();

        // Follow-up indicators
        const followUpIndicators = [
            'it', 'them', 'that', 'this', 'those', 'these',
            'which one', 'what about', 'how about',
            'also', 'and', 'or',
        ];

        return followUpIndicators.some(indicator => lowerMessage.includes(indicator));
    }

    /**
     * Get context for follow-up questions
     */
    getFollowUpContext(userId: string): string | null {
        const conversation = this.getConversation(userId);

        if (conversation.messages.length < 2) {
            return null;
        }

        // Get last user message and AI response
        const lastMessages = conversation.messages.slice(-2);
        const lastUserMsg = lastMessages.find(m => m.role === 'user');
        const lastAIMsg = lastMessages.find(m => m.role === 'assistant');

        if (!lastUserMsg || !lastAIMsg) {
            return null;
        }

        return `Previous context:\nUser asked: "${lastUserMsg.content}"\nAI responded: "${lastAIMsg.content}"`;
    }

    /**
     * Clear conversation history
     */
    clearConversation(userId: string): void {
        this.conversations.delete(userId);
    }

    /**
     * Clear old conversations (cleanup)
     */
    clearOldConversations(maxAge: number = 3600000): void {
        const now = Date.now();

        for (const [userId, conversation] of this.conversations.entries()) {
            if (conversation.messages.length === 0) {
                this.conversations.delete(userId);
                continue;
            }

            const lastMessage = conversation.messages[conversation.messages.length - 1];
            if (now - lastMessage.timestamp > maxAge) {
                this.conversations.delete(userId);
            }
        }
    }
}

export const aiConversationMemoryService = new AIConversationMemoryService();

// Auto-cleanup old conversations every hour
setInterval(() => {
    aiConversationMemoryService.clearOldConversations();
}, 3600000);
