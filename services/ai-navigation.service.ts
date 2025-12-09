/**
 * AI Navigation Service with Multi-Provider Support
 * Provides intelligent navigation and command interpretation
 * Supports: OpenRouter, Hugging Face, Groq, and offline fallback
 */

import { aiDataContextService } from './ai-data-context.service';

import { aiActionExecutorService } from './ai-action-executor.service';
import { aiSmartSearchService } from './ai-smart-search.service';
import { aiContextualHelpService } from './ai-contextual-help.service';
import { aiReportGeneratorService } from './ai-report-generator.service';
import { openRouterService } from './openrouter.service';
import { aiProactiveSuggestionsService } from './ai-proactive-suggestions.service';

export interface NavigationIntent {
    action: 'navigate' | 'search' | 'create' | 'update' | 'delete' | 'filter' | 'impersonate' | 'unknown';
    route: string;
    params?: Record<string, string>;
    entity?: 'product' | 'employee' | 'order' | 'customer' | 'job' | 'sale';
    confidence: number;
    originalQuery: string;
}

export interface AIResponse {
    message: string;
    intent?: NavigationIntent;
    suggestions?: string[];
}

class AINavigationService {
    private initialized = false;

    /**
     * Initialize the AI service (Multi-Provider)
     */
    async initialize(): Promise<void> {
        // OpenRouter is always ready with pre-configured key
        this.initialized = true;
        console.log('✅ AI service ready (OpenRouter)');
    }

    /**
     * Check if AI is ready
     */
    isReady(): boolean {
        return openRouterService.isReady();
    }

    /**
     * Interpret user command and return navigation intent
     * Supports: Q&A, Actions, Search, Help, Navigation, Reports
     */
    async interpretCommand(command: string, userRole: string = 'admin', siteId?: string, currentPage?: string, previousMessages: any[] = []): Promise<NavigationIntent> {
        // 1. Check for simple navigation commands first (faster)
        const simpleRoute = this.checkSimpleNavigation(command);
        if (simpleRoute) {
            return {
                action: 'navigate',
                route: simpleRoute,
                confidence: 1.0,
                originalQuery: command
            };
        }

        try {
            // Fetch data context summary for RAG-lite
            const dataContext = await aiDataContextService.getDataContext(userRole, siteId || '');
            const dataSummary = aiDataContextService.getDataSummary(dataContext);

            // 🧠 Fetch Proactive Suggestions
            const proactiveSuggestions = aiProactiveSuggestionsService.getSuggestions();
            const suggestionsSummary = proactiveSuggestions.map(s => `- ${s.type.toUpperCase()}: ${s.title} - ${s.message}`).join('\n');

            const context = {
                role: userRole,
                page: currentPage,
                site: siteId,
                dataSummary: dataSummary,
                suggestions: suggestionsSummary // 🧠 Inject suggestions
            };
            const aiResult = await openRouterService.interpretCommand(command, context, previousMessages);

            if (aiResult.action === 'answer') {
                return {
                    action: 'unknown',
                    route: '',
                    params: { answer: aiResult.params.answer },
                    confidence: 1.0,
                    originalQuery: command
                };
            }

            // 3. Handle AI Actions (Convert to Confirmation Modal)
            if (['create_po', 'approve_po', 'check_stock', 'impersonate'].includes(aiResult.action)) {
                let actionDescription = '';
                let actionType = '';

                switch (aiResult.action) {
                    case 'create_po':
                        actionType = 'create_po';
                        const items = aiResult.params.items || [];

                        // 🧠 Hydrate parameters with real IDs
                        if (items.length > 0) {
                            const productName = items[0].name;
                            const product = dataContext.products?.find((p: any) =>
                                p.name.toLowerCase().includes(productName.toLowerCase())
                            );

                            // Resolve Site ID from Name (if provided)
                            let targetSiteId = siteId || 'ADMIN-001';
                            if (aiResult.params.siteName) {
                                const targetSite = dataContext.sites?.find((s: any) =>
                                    s.name.toLowerCase().includes(aiResult.params.siteName.toLowerCase())
                                );
                                if (targetSite) {
                                    targetSiteId = targetSite.id;
                                }
                            }

                            // Inject resolved IDs
                            aiResult.params.productId = product?.id || 'unknown-product-id';
                            aiResult.params.quantity = items[0].quantity || 1;
                            aiResult.params.supplierId = product?.supplier_id || 'SUP-001'; // Default supplier
                            aiResult.params.siteId = targetSiteId;

                            // Update description with found product name
                            actionDescription = `Create Purchase Order for ${aiResult.params.quantity} units of ${product?.name || productName} at ${aiResult.params.siteName || 'Current Site'}`;
                        } else {
                            actionDescription = `Create Purchase Order (No items specified)`;
                        }
                        break;
                    case 'approve_po':
                        actionType = 'approve_po';
                        if (aiResult.params.all) {
                            actionDescription = 'Approve ALL pending Purchase Orders';
                        } else {
                            actionDescription = `Approve Purchase Order ${aiResult.params.id || ''}`;
                        }
                        break;
                    case 'check_stock':
                        actionType = 'check_stock';
                        const query = aiResult.params.query || '';

                        // 🧠 SMART RESTOCK LOGIC
                        if (aiResult.params.createPO) {
                            // 1. Determine Site
                            let targetSiteId = siteId || 'HQ-001';
                            let targetSiteName = 'Current Site';

                            if (aiResult.params.siteName) {
                                const targetSite = dataContext.sites?.find((s: any) =>
                                    s.name.toLowerCase().includes(aiResult.params.siteName.toLowerCase())
                                );
                                if (targetSite) {
                                    targetSiteId = targetSite.id;
                                    targetSiteName = targetSite.name;
                                }
                            }

                            // 2. Find Low Stock Items for this Site
                            const lowStockItems = dataContext.products?.filter((p: any) =>
                                (p.siteId === targetSiteId || !p.siteId) && // Match site
                                p.stock < (p.reorder_point || 10) // Check low stock
                            ) || [];

                            if (lowStockItems.length > 0) {
                                // 3. Propose PO Creation
                                actionType = 'create_po';
                                actionDescription = `Create Restock Order for ${lowStockItems.length} low stock items at ${targetSiteName}`;

                                // Construct PO items
                                const poItems = lowStockItems.map((p: any) => ({
                                    name: p.name,
                                    quantity: (p.reorder_point || 10) * 2, // Suggest reorder quantity
                                    productId: p.id
                                }));

                                aiResult.params = {
                                    siteId: targetSiteId,
                                    supplierId: 'SUP-001', // Default
                                    items: poItems,
                                    description: actionDescription
                                };
                            } else {
                                // No low stock found
                                return {
                                    action: 'unknown',
                                    route: '/',
                                    params: {
                                        answer: `✅ Good news! There are no low stock items at ${targetSiteName} right now.`
                                    },
                                    confidence: 1.0,
                                    originalQuery: command
                                };
                            }
                        } else {
                            actionDescription = `Check stock levels for "${query}"`;
                        }
                        break;
                    case 'impersonate':
                        actionType = 'impersonate';
                        actionDescription = `Switch user role to ${aiResult.params.role}`;
                        break;
                }

                return {
                    action: 'unknown', // Prevent direct navigation
                    route: '/',
                    params: {
                        answer: `⚡ Action proposed: ${actionDescription}\n\nPlease confirm to proceed.`,
                        actionData: JSON.stringify({
                            type: actionType,
                            description: actionDescription,
                            params: aiResult.params
                        })
                    },
                    confidence: 1.0,
                    originalQuery: command
                };
            }

            return {
                action: aiResult.action,
                route: aiResult.params.route || '',
                params: aiResult.params,
                confidence: 1.0,
                originalQuery: command
            };
        } catch (e) {
            console.error('OpenRouter AI failed:', e);
            // Fallback to regex matching
            return this.interpretCommandRegex(command, userRole, siteId, currentPage);
        }
    }

    /**
     * Check for simple navigation commands to avoid API calls
     */
    private checkSimpleNavigation(command: string): string | null {
        const lowerCommand = command.toLowerCase();

        const routes: Record<string, string> = {
            'dashboard': '/dashboard',
            'inventory': '/inventory',
            'products': '/inventory',
            'stock': '/inventory',
            'pos': '/pos',
            'point of sale': '/pos',
            'sales': '/pos',
            'orders': '/procurement',
            'procurement': '/procurement',
            'purchases': '/procurement',
            'employees': '/employees',
            'staff': '/employees',
            'customers': '/customers',
            'clients': '/customers',
            'finance': '/finance',
            'accounting': '/finance',
            'settings': '/settings',
            'config': '/settings',
            'warehouse': '/wms',
            'wms': '/wms',
            'operations': '/wms'
        };

        for (const [key, route] of Object.entries(routes)) {
            if (lowerCommand.includes(`go to ${key}`) ||
                lowerCommand.includes(`navigate to ${key}`) ||
                lowerCommand.includes(`open ${key}`) ||
                lowerCommand === key) {
                return route;
            }
        }

        return null;
    }

    /**
     * Fallback for command interpretation using regex and keyword matching.
     */
    private async interpretCommandRegex(command: string, userRole?: string, userSiteId?: string, currentPage?: string): Promise<NavigationIntent> {
        const lowerCommand = command.toLowerCase();

        // 📚 CONTEXTUAL HELP
        if (lowerCommand === 'help' || lowerCommand.includes('how do i')) {
            const help = aiContextualHelpService.getQuickHelp(currentPage || '/');
            return {
                action: 'unknown',
                route: '/',
                params: { answer: help },
                confidence: 1.0,
                originalQuery: command
            };
        }

        // 🔍 SMART SEARCH
        if (lowerCommand.startsWith('find ') || lowerCommand.startsWith('search ')) {
            const dataContext = await aiDataContextService.getDataContext(userRole || '', userSiteId || '');
            const results = await aiSmartSearchService.search(command, dataContext);

            if (results.length > 0) {
                const resultText = results.slice(0, 5).map((r, i) =>
                    `${i + 1}. ${r.title} - ${r.subtitle}`
                ).join('\n');

                return {
                    action: 'search',
                    route: results[0].route,
                    params: {
                        answer: `🔍 Found ${results.length} results:\n\n${resultText}\n\nNavigating to top result...`,
                        searchResults: JSON.stringify(results)
                    },
                    confidence: 1.0,
                    originalQuery: command
                };
            }
        }

        // 📊 REPORT & FORECAST GENERATION
        if (lowerCommand.includes('report') || lowerCommand.includes('summary') || lowerCommand.includes('forecast') || lowerCommand.includes('predict')) {
            let reportType = 'sales';
            if (lowerCommand.includes('inventory') || lowerCommand.includes('stock')) reportType = 'inventory';
            if (lowerCommand.includes('performance') || lowerCommand.includes('staff') || lowerCommand.includes('employee')) reportType = 'performance';

            // Pass 'forecast' keyword if present to trigger predictive engine
            if (lowerCommand.includes('forecast') || lowerCommand.includes('predict')) {
                reportType += '_forecast';
            }

            const report = await aiReportGeneratorService.generateReport(reportType);

            return {
                action: 'unknown', // Use unknown so it doesn't navigate away
                route: currentPage || '/',
                confidence: 0.95,
                params: {
                    reportData: JSON.stringify(report),
                    answer: `Here is the ${report.title} you requested.\n\n${report.summary}`
                },
                originalQuery: command
            };
        }

        // ⚡ SMART ACTIONS (Super Admin Only)
        if (userRole === 'super_admin') {
            const action = aiActionExecutorService.parseCommand(command);
            if (action) {
                return {
                    action: 'unknown',
                    route: '/',
                    params: {
                        answer: `⚡ Action detected: ${action.description}\n\nPlease confirm the details below to proceed.`,
                        actionData: JSON.stringify(action)
                    },
                    confidence: 1.0,
                    originalQuery: command
                };
            }
        }

        // 👻 GHOST MODE (Impersonation - Super Admin Only)
        if (userRole === 'super_admin' && (lowerCommand.startsWith('impersonate ') || lowerCommand.startsWith('view as ') || lowerCommand.startsWith('login as '))) {
            const targetName = command.replace(/impersonate |view as |login as /i, '').trim();

            return {
                action: 'impersonate',
                route: '/',
                params: {
                    targetUser: targetName,
                    answer: `👻 Initiating Ghost Mode for user: ${targetName}...`
                },
                confidence: 1.0,
                originalQuery: command
            };
        }

        // 🎯 SUPER ADMIN Q&A MODE
        if (userRole === 'super_admin' && this.isQuestion(command)) {
            return this.handleQuestion(command, userRole, userSiteId);
        }

        // 🧭 REGULAR NAVIGATION - Use fallback (no WebLLM anymore)
        return this.fallbackIntent(command);
    }

    /**
     * Check if command is a question (super admin only)
     */
    private isQuestion(command: string): boolean {
        const lowerCommand = command.toLowerCase().trim();

        // Question indicators
        const questionStarters = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'explain', 'tell me', 'describe'];
        const hasQuestionMark = command.includes('?');
        const startsWithQuestion = questionStarters.some(starter => lowerCommand.startsWith(starter));

        return hasQuestionMark || startsWithQuestion;
    }

    /**
     * Handle Q&A for super admin (with data context)
     */
    private async handleQuestion(question: string, userRole?: string, userSiteId?: string): Promise<NavigationIntent> {
        try {
            // Try to answer with data first
            const dataContext = await aiDataContextService.getDataContext(userRole || 'super_admin', userSiteId || '');
            const dataAnswer = await aiDataContextService.answerDataQuestion(question, dataContext);

            if (dataAnswer) {
                // Direct data answer available
                return {
                    action: 'unknown',
                    route: '/',
                    params: { answer: dataAnswer },
                    confidence: 1.0,
                    originalQuery: question
                };
            }

            // If no data answer, return a helpful message
            return {
                action: 'unknown',
                route: '/',
                params: { answer: 'I couldn\'t find a specific answer to that question. Try asking about sales, inventory, or employees.' },
                confidence: 0.5,
                originalQuery: question
            };
        } catch (error) {
            console.error('Q&A failed:', error);
            return {
                action: 'unknown',
                route: '/',
                params: { answer: 'Sorry, I encountered an error answering your question.' },
                confidence: 0.1,
                originalQuery: question
            };
        }
    }

    /**
     * Build Q&A prompt for super admin
     */
    private buildQAPrompt(question: string, dataSummary?: string): string {
        let prompt = `You are an AI assistant for SIIFMART, an enterprise retail and warehouse management system.

System Overview:
- Multi-site retail chain with warehouses and stores
- Features: Inventory, POS, Warehouse Operations (WMS), Procurement, Employee Management, Finance
- Roles: Super Admin, Admin, Managers, Warehouse Staff, Store Staff
- Technology: React frontend, Supabase backend, role-based access control`;

        if (dataSummary) {
            prompt += `\n\nCurrent System Data:\n${dataSummary}`;
        }

        prompt += `\n\nUser Question: "${question}"

Provide a clear, concise, and helpful answer. If the question is about:
- Features: Explain what they do and how to use them
- Processes: Describe step-by-step workflows
- Permissions: Explain role-based access
- Technical: Provide system architecture details
- Data: Explain what data is tracked and how

Keep answers professional, accurate, and specific to SIIFMART.

Answer:`;

        return prompt;
    }

    /**
     * Get contextual suggestions based on user role and current page
     */
    async getContextualSuggestions(userRole: string, currentPage: string): Promise<string[]> {
        const suggestions = this.getRoleSuggestions(userRole);
        const pageSuggestions = this.getPageSuggestions(currentPage);

        return [...new Set([...suggestions, ...pageSuggestions])].slice(0, 6);
    }

    /**
     * Smart search across all entities
     */
    async smartSearch(query: string, entities: any[]): Promise<any[]> {
        // Simple keyword matching for now
        // Can be enhanced with AI-powered semantic search
        const lowerQuery = query.toLowerCase();

        return entities.filter(entity => {
            const searchableText = JSON.stringify(entity).toLowerCase();
            return searchableText.includes(lowerQuery);
        }).slice(0, 10);
    }

    /**
     * Build navigation prompt for AI
     */
    private buildNavigationPrompt(command: string, userRole?: string): string {
        return `You are a navigation assistant for SIIFMART, an enterprise retail management system.

User Role: ${userRole || 'unknown'}
User Command: "${command}"

Available Routes:
- /dashboard - Main dashboard
- /inventory - Product inventory management
- /procurement - Purchase orders and suppliers
- /pos - Point of Sale system
- /wms - Warehouse operations (PICK, PACK, PUTAWAY, DISPATCH)
- /employees - Employee management
- /customers - Customer management
- /finance - Financial reports and expenses
- /settings - System settings

Interpret the user's command and respond with ONLY a JSON object in this format:
{
  "action": "navigate|search|create|filter",
  "route": "/path",
  "params": {"key": "value"},
  "entity": "product|employee|order|customer|job",
  "confidence": 0.0-1.0
}

Examples:
"show inventory" -> {"action":"navigate","route":"/inventory","confidence":0.95}
"find Sara" -> {"action":"search","route":"/employees","params":{"q":"Sara"},"entity":"employee","confidence":0.9}
"create PO" -> {"action":"create","route":"/procurement","entity":"order","confidence":0.85}

Respond with JSON only, no explanation:`;
    }

    /**
     * Parse AI response into navigation intent
     */
    private parseNavigationIntent(aiResponse: string, originalQuery: string): NavigationIntent {
        try {
            // Extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.fallbackIntent(originalQuery);
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                action: parsed.action || 'navigate',
                route: parsed.route || '/',
                params: parsed.params || {},
                entity: parsed.entity,
                confidence: parsed.confidence || 0.5,
                originalQuery
            };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return this.fallbackIntent(originalQuery);
        }
    }

    /**
     * Fallback intent when AI fails
     */
    private fallbackIntent(query: string): NavigationIntent {
        const lowerQuery = query.toLowerCase();

        // Simple keyword matching as fallback
        const intentMap: Record<string, Partial<NavigationIntent>> = {
            'inventory': { route: '/inventory', action: 'navigate' },
            'product': { route: '/inventory', action: 'navigate' },
            'stock': { route: '/inventory', action: 'navigate' },
            'order': { route: '/procurement', action: 'navigate' },
            'po': { route: '/procurement', action: 'navigate' },
            'purchase': { route: '/procurement', action: 'navigate' },
            'employee': { route: '/employees', action: 'navigate' },
            'staff': { route: '/employees', action: 'navigate' },
            'customer': { route: '/customers', action: 'navigate' },
            'pos': { route: '/pos', action: 'navigate' },
            'sale': { route: '/pos', action: 'navigate' },
            'warehouse': { route: '/wms', action: 'navigate' },
            'wms': { route: '/wms', action: 'navigate' },
            'pick': { route: '/wms?tab=PICK', action: 'navigate' },
            'pack': { route: '/wms?tab=PACK', action: 'navigate' },
            'dashboard': { route: '/dashboard', action: 'navigate' },
            'finance': { route: '/finance', action: 'navigate' },
            'settings': { route: '/settings', action: 'navigate' },
        };

        for (const [keyword, intent] of Object.entries(intentMap)) {
            if (lowerQuery.includes(keyword)) {
                return {
                    action: intent.action as any || 'navigate',
                    route: intent.route || '/',
                    params: {},
                    confidence: 0.6,
                    originalQuery: query
                };
            }
        }

        return {
            action: 'unknown',
            route: '/',
            params: {},
            confidence: 0.1,
            originalQuery: query
        };
    }

    /**
     * Get role-based suggestions
     */
    private getRoleSuggestions(role: string): string[] {
        const suggestions: Record<string, string[]> = {
            warehouse_manager: [
                'Show pending picks',
                'View low stock items',
                'Check job assignments',
                'Open WMS dashboard'
            ],
            dispatcher: [
                'Assign new job',
                'View active jobs',
                'Check employee availability',
                'Open dispatch board'
            ],
            picker: [
                'My pending jobs',
                'Start next pick',
                'View completed jobs',
                'Check my performance'
            ],
            pos: [
                'Open POS',
                'View today\'s sales',
                'Check shift summary',
                'Find customer'
            ],
            manager: [
                'View store dashboard',
                'Check today\'s sales',
                'Manage employees',
                'View inventory'
            ],
            admin: [
                'View all sites',
                'Check system logs',
                'Manage employees',
                'View reports'
            ],
            super_admin: [
                'View Central dashboard',
                'Check all sites',
                'System settings',
                'View analytics'
            ]
        };

        return suggestions[role] || [
            'Go to dashboard',
            'View inventory',
            'Check orders',
            'Find employee'
        ];
    }

    /**
     * Get page-specific suggestions
     */
    private getPageSuggestions(page: string): string[] {
        const suggestions: Record<string, string[]> = {
            '/inventory': ['Add new product', 'Check low stock', 'Search products'],
            '/procurement': ['Create PO', 'View pending orders', 'Manage suppliers'],
            '/wms': ['View pending picks', 'Assign jobs', 'Check dispatch queue'],
            '/employees': ['Add employee', 'View performance', 'Check attendance'],
            '/pos': ['New sale', 'View receipts', 'Check shift'],
            '/dashboard': ['View reports', 'Check alerts', 'Go to inventory']
        };

        return suggestions[page] || [];
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        // No cleanup needed for Groq (stateless API calls)
        this.initialized = false;
        console.log('🧹 AI service cleaned up');
    }
}

// Export singleton instance
export const aiNavigationService = new AINavigationService();
