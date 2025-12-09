/**
 * AI Anomaly Detector Service
 * Detects unusual patterns and outliers in system data
 */

import { aiDataContextService } from './ai-data-context.service';
import { aiProactiveSuggestionsService } from './ai-proactive-suggestions.service';

export interface Anomaly {
    id: string;
    type: 'stock_drop' | 'sales_spike' | 'performance_drop' | 'unusual_activity';
    severity: 'high' | 'medium' | 'low';
    description: string;
    data: any;
    timestamp: number;
}

class AIAnomalyDetectorService {
    private checkInterval: number = 600000; // 10 minutes
    private intervalId: any = null;
    private history: Record<string, any[]> = {}; // Store historical data for comparison

    /**
     * Start monitoring for anomalies
     */
    startMonitoring(userRole: string, userSiteId: string): void {
        if (this.intervalId) return;

        // Initial check
        this.checkForAnomalies(userRole, userSiteId);

        // Periodic checks
        this.intervalId = setInterval(() => {
            this.checkForAnomalies(userRole, userSiteId);
        }, this.checkInterval);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Check for anomalies
     */
    private async checkForAnomalies(userRole: string, userSiteId: string): Promise<void> {
        try {
            const context = await aiDataContextService.getDataContext(userRole, userSiteId);

            // Check for rapid stock drops
            this.checkStockAnomalies(context.products);

            // Check for sales spikes (if we had real-time sales stream)
            // this.checkSalesAnomalies(context.sales);

        } catch (error) {
            console.error('Failed to check for anomalies:', error);
        }
    }

    /**
     * Check for unusual stock drops
     */
    private checkStockAnomalies(products: any[] | undefined): void {
        if (!products) return;

        products.forEach(product => {
            const historyKey = `stock_${product.id}`;
            const currentStock = product.stock;

            // Initialize history if needed
            if (!this.history[historyKey]) {
                this.history[historyKey] = [];
            }

            // Add current reading
            this.history[historyKey].push({ stock: currentStock, time: Date.now() });

            // Keep last 1 hour of data (assuming check every 10 min = 6 checks)
            if (this.history[historyKey].length > 6) {
                this.history[historyKey].shift();
            }

            // Analyze: Drop > 50% in last check
            const previousReading = this.history[historyKey][this.history[historyKey].length - 2];
            if (previousReading) {
                const drop = previousReading.stock - currentStock;
                const dropPercentage = (drop / previousReading.stock) * 100;

                if (dropPercentage > 50 && drop > 10) {
                    // ANOMALY DETECTED!
                    this.reportAnomaly({
                        id: `anomaly_stock_${product.id}_${Date.now()}`,
                        type: 'stock_drop',
                        severity: 'high',
                        description: `Rapid stock drop detected for ${product.name}: -${drop} units (${dropPercentage.toFixed(0)}%) in last 10 mins.`,
                        data: { productId: product.id, drop, dropPercentage },
                        timestamp: Date.now()
                    });
                }
            }
        });
    }

    /**
     * Report anomaly to Proactive Suggestions service
     */
    private reportAnomaly(anomaly: Anomaly): void {
        aiProactiveSuggestionsService.addExternalSuggestion({
            id: anomaly.id,
            type: 'alert',
            title: 'Anomaly Detected',
            message: anomaly.description,
            actions: [
                {
                    label: 'Investigate',
                    action: 'navigate',
                    params: { route: `/inventory?product=${anomaly.data.productId}` }
                },
                {
                    label: 'Dismiss',
                    action: 'dismiss'
                }
            ],
            priority: 10, // High priority
            timestamp: anomaly.timestamp,
            dismissed: false
        });
    }
}

export const aiAnomalyDetectorService = new AIAnomalyDetectorService();
