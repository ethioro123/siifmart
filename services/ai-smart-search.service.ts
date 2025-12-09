/**
 * AI Smart Search Service
 * Provides semantic and fuzzy search across all entities
 */

interface SearchResult {
    type: 'product' | 'employee' | 'customer' | 'order' | 'site' | 'job';
    id: string;
    title: string;
    subtitle: string;
    description: string;
    route: string;
    relevance: number;
    data: any;
}

class AISmartSearchService {
    /**
     * Perform smart search across all entities
     */
    async search(query: string, context: any): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const lowerQuery = query.toLowerCase();

        // Search products
        if (context.products) {
            context.products.forEach((product: any) => {
                const relevance = this.calculateRelevance(query, [
                    product.name,
                    product.category,
                    product.sku,
                    product.description
                ]);

                if (relevance > 0.3) {
                    results.push({
                        type: 'product',
                        id: product.id,
                        title: product.name,
                        subtitle: `${product.category} • ${product.sku}`,
                        description: `Stock: ${product.stock} units • Price: $${product.price}`,
                        route: `/inventory?product=${product.id}`,
                        relevance,
                        data: product
                    });
                }
            });
        }

        // Search employees
        if (context.employees) {
            context.employees.forEach((employee: any) => {
                const relevance = this.calculateRelevance(query, [
                    employee.name,
                    employee.role,
                    employee.department,
                    employee.email
                ]);

                if (relevance > 0.3) {
                    results.push({
                        type: 'employee',
                        id: employee.id,
                        title: employee.name,
                        subtitle: `${employee.role} • ${employee.department}`,
                        description: employee.email,
                        route: `/employees?employee=${employee.id}`,
                        relevance,
                        data: employee
                    });
                }
            });
        }

        // Search sites
        if (context.sites) {
            context.sites.forEach((site: any) => {
                const relevance = this.calculateRelevance(query, [
                    site.name,
                    site.code,
                    site.type,
                    site.address
                ]);

                if (relevance > 0.3) {
                    results.push({
                        type: 'site',
                        id: site.id,
                        title: site.name,
                        subtitle: `${site.type} • ${site.code}`,
                        description: site.address,
                        route: `/settings?site=${site.id}`,
                        relevance,
                        data: site
                    });
                }
            });
        }

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);

        return results.slice(0, 10); // Top 10 results
    }

    /**
     * Calculate relevance score using fuzzy matching
     */
    private calculateRelevance(query: string, fields: (string | undefined)[]): number {
        const lowerQuery = query.toLowerCase();
        let maxScore = 0;

        fields.forEach(field => {
            if (!field) return;

            const lowerField = field.toLowerCase();

            // Exact match
            if (lowerField === lowerQuery) {
                maxScore = Math.max(maxScore, 1.0);
                return;
            }

            // Starts with
            if (lowerField.startsWith(lowerQuery)) {
                maxScore = Math.max(maxScore, 0.9);
                return;
            }

            // Contains
            if (lowerField.includes(lowerQuery)) {
                maxScore = Math.max(maxScore, 0.7);
                return;
            }

            // Fuzzy match
            const fuzzyScore = this.fuzzyMatch(lowerQuery, lowerField);
            maxScore = Math.max(maxScore, fuzzyScore);
        });

        return maxScore;
    }

    /**
     * Fuzzy string matching (Levenshtein-based)
     */
    private fuzzyMatch(query: string, target: string): number {
        if (query.length === 0) return 0;
        if (target.length === 0) return 0;

        // Simple fuzzy matching
        const queryWords = query.split(' ');
        const targetWords = target.split(' ');

        let matches = 0;
        queryWords.forEach(qWord => {
            targetWords.forEach(tWord => {
                if (tWord.includes(qWord) || qWord.includes(tWord)) {
                    matches++;
                }
            });
        });

        return Math.min(matches / queryWords.length, 1.0) * 0.6;
    }

    /**
     * Get search suggestions based on query
     */
    getSuggestions(query: string): string[] {
        const lowerQuery = query.toLowerCase();
        const suggestions: string[] = [];

        // Product-related suggestions
        if (lowerQuery.includes('product') || lowerQuery.includes('item')) {
            suggestions.push('Search all products');
            suggestions.push('Find low stock products');
            suggestions.push('Search by category');
        }

        // Employee-related suggestions
        if (lowerQuery.includes('employee') || lowerQuery.includes('staff') || lowerQuery.includes('worker')) {
            suggestions.push('Search all employees');
            suggestions.push('Find warehouse staff');
            suggestions.push('Search by department');
        }

        // Location-related suggestions
        if (lowerQuery.includes('warehouse') || lowerQuery.includes('store') || lowerQuery.includes('site')) {
            suggestions.push('Search all sites');
            suggestions.push('Find warehouses');
            suggestions.push('Find stores');
        }

        return suggestions;
    }
}

export const aiSmartSearchService = new AISmartSearchService();
