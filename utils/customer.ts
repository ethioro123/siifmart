
/**
 * Customer Intelligence & Analytics Utilities
 * RFM Scoring, Lifetime Value, Churn Prediction, Segmentation
 */

import { Customer, SaleRecord } from '../types';

// ============================================================================
// RFM ANALYSIS
// ============================================================================

export interface RFMScore {
    recency: number; // 1-5 (5 = most recent)
    frequency: number; // 1-5 (5 = most frequent)
    monetary: number; // 1-5 (5 = highest spend)
    total: number; // Sum of above
    segment: 'Champions' | 'Loyal' | 'Potential' | 'At Risk' | 'Lost' | 'New';
}

/**
 * Calculate RFM score for a customer
 * Recency: How recently did the customer purchase?
 * Frequency: How often do they purchase?
 * Monetary: How much do they spend?
 */
export function calculateRFM(
    customer: Customer,
    sales: SaleRecord[]
): RFMScore {
    const now = new Date();
    const customerSales = sales.filter(s => s.customerId === customer.id);

    // Recency: Days since last purchase
    const lastPurchase = new Date(customer.lastVisit);
    const daysSinceLastPurchase = Math.floor(
        (now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24)
    );
    const recency = scoreRecency(daysSinceLastPurchase);

    // Frequency: Number of purchases
    const frequency = scoreFrequency(customerSales.length);

    // Monetary: Total spend
    const monetary = scoreMonetary(customer.totalSpent);

    const total = recency + frequency + monetary;
    const segment = determineSegment(recency, frequency, monetary);

    return { recency, frequency, monetary, total, segment };
}

function scoreRecency(days: number): number {
    if (days <= 7) return 5;    // Purchased within a week
    if (days <= 30) return 4;   // Purchased within a month
    if (days <= 90) return 3;   // Purchased within 3 months
    if (days <= 180) return 2;  // Purchased within 6 months
    return 1;                    // Purchased over 6 months ago
}

function scoreFrequency(purchases: number): number {
    if (purchases >= 20) return 5;  // Very frequent
    if (purchases >= 10) return 4;  // Frequent
    if (purchases >= 5) return 3;   // Regular
    if (purchases >= 2) return 2;   // Occasional
    return 1;                        // One-time
}

function scoreMonetary(totalSpent: number): number {
    if (totalSpent >= 10000) return 5;  // VIP
    if (totalSpent >= 5000) return 4;   // High value
    if (totalSpent >= 1000) return 3;   // Medium value
    if (totalSpent >= 500) return 2;    // Low value
    return 1;                            // Very low value
}

function determineSegment(r: number, f: number, m: number): RFMScore['segment'] {
    const total = r + f + m;

    // Champions: High R, F, M
    if (total >= 13 && r >= 4 && f >= 4 && m >= 4) return 'Champions';

    // Loyal: High F, good M, decent R
    if (f >= 4 && m >= 3 && r >= 3) return 'Loyal';

    // Potential: Good R, low F
    if (r >= 4 && f <= 2) return 'New';

    // At Risk: Low R, but good F and M historically
    if (r <= 2 && f >= 3 && m >= 3) return 'At Risk';

    // Lost: Very low R
    if (r === 1) return 'Lost';

    // Potential: Everything else
    return 'Potential';
}

// ============================================================================
// CUSTOMER LIFETIME VALUE (CLV)
// ============================================================================

/**
 * Calculate Customer Lifetime Value
 * CLV = (Average Purchase Value × Purchase Frequency × Customer Lifespan)
 */
export function calculateCLV(
    customer: Customer,
    sales: SaleRecord[],
    estimatedLifespanYears: number = 3
): number {
    const customerSales = sales.filter(s => s.customerId === customer.id);

    if (customerSales.length === 0) return 0;

    // Average purchase value
    const avgPurchaseValue = customer.totalSpent / customerSales.length;

    // Purchase frequency (purchases per year)
    const firstPurchase = new Date(Math.min(...customerSales.map(s => new Date(s.date).getTime())));
    const daysSinceFirst = Math.floor((Date.now() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24));
    const yearsActive = Math.max(daysSinceFirst / 365, 0.1); // Minimum 0.1 to avoid division by zero
    const purchaseFrequency = customerSales.length / yearsActive;

    // CLV = Average Purchase Value × Purchase Frequency × Lifespan
    const clv = avgPurchaseValue * purchaseFrequency * estimatedLifespanYears;

    return Math.round(clv);
}

/**
 * Calculate predicted CLV with churn consideration
 */
export function calculatePredictedCLV(
    customer: Customer,
    sales: SaleRecord[],
    churnRate: number = 0.2 // 20% annual churn
): number {
    const customerSales = sales.filter(s => s.customerId === customer.id);

    if (customerSales.length === 0) return 0;

    const avgPurchaseValue = customer.totalSpent / customerSales.length;
    const avgPurchaseFrequency = customerSales.length / Math.max(1,
        Math.floor((Date.now() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24 * 365))
    );

    // Predicted CLV = (Avg Purchase × Frequency × Retention Rate) / Churn Rate
    const retentionRate = 1 - churnRate;
    const predictedCLV = (avgPurchaseValue * avgPurchaseFrequency * retentionRate) / churnRate;

    return Math.round(predictedCLV);
}

// ============================================================================
// CHURN PREDICTION
// ============================================================================

export interface ChurnRisk {
    risk: 'High' | 'Medium' | 'Low';
    score: number; // 0-100
    reasons: string[];
}

/**
 * Predict customer churn risk
 */
export function predictChurnRisk(
    customer: Customer,
    sales: SaleRecord[]
): ChurnRisk {
    const reasons: string[] = [];
    let score = 0;

    const customerSales = sales.filter(s => s.customerId === customer.id);
    const daysSinceLastPurchase = Math.floor(
        (Date.now() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Factor 1: Recency (40% weight)
    if (daysSinceLastPurchase > 180) {
        score += 40;
        reasons.push('No purchase in 6+ months');
    } else if (daysSinceLastPurchase > 90) {
        score += 25;
        reasons.push('No purchase in 3+ months');
    } else if (daysSinceLastPurchase > 60) {
        score += 15;
        reasons.push('No purchase in 2+ months');
    }

    // Factor 2: Declining purchase frequency (30% weight)
    const recentPurchases = customerSales.filter(s =>
        new Date(s.date) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    ).length;
    const olderPurchases = customerSales.filter(s => {
        const date = new Date(s.date);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        return date >= sixMonthsAgo && date < ninetyDaysAgo;
    }).length;

    if (olderPurchases > recentPurchases * 2) {
        score += 30;
        reasons.push('Purchase frequency declining');
    } else if (olderPurchases > recentPurchases) {
        score += 15;
        reasons.push('Slight decline in purchases');
    }

    // Factor 3: Declining spend (20% weight)
    const recentSpend = customerSales
        .filter(s => new Date(s.date) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
        .reduce((sum, s) => sum + s.total, 0);
    const avgSpend = customer.totalSpent / Math.max(customerSales.length, 1);
    const recentAvgSpend = recentSpend / Math.max(recentPurchases, 1);

    if (recentAvgSpend < avgSpend * 0.5) {
        score += 20;
        reasons.push('Spending significantly decreased');
    } else if (recentAvgSpend < avgSpend * 0.75) {
        score += 10;
        reasons.push('Spending slightly decreased');
    }

    // Factor 4: Low loyalty points usage (10% weight)
    if (customer.loyaltyPoints > 1000 && recentPurchases === 0) {
        score += 10;
        reasons.push('High loyalty points but no recent redemption');
    }

    // Determine risk level
    let risk: ChurnRisk['risk'];
    if (score >= 70) risk = 'High';
    else if (score >= 40) risk = 'Medium';
    else risk = 'Low';

    return { risk, score, reasons };
}

// ============================================================================
// CUSTOMER SEGMENTATION
// ============================================================================

export type CustomerSegment =
    | 'VIP'
    | 'Loyal'
    | 'Promising'
    | 'New'
    | 'At Risk'
    | 'Lost'
    | 'Hibernating';

export interface CustomerSegmentation {
    segment: CustomerSegment;
    description: string;
    recommendedAction: string;
}

/**
 * Segment customer based on behavior
 */
export function segmentCustomer(
    customer: Customer,
    sales: SaleRecord[]
): CustomerSegmentation {
    const rfm = calculateRFM(customer, sales);
    const churn = predictChurnRisk(customer, sales);
    const clv = calculateCLV(customer, sales);

    // VIP: High CLV, Champions or Loyal
    if (clv > 5000 && (rfm.segment === 'Champions' || rfm.segment === 'Loyal')) {
        return {
            segment: 'VIP',
            description: 'High-value, frequent customers',
            recommendedAction: 'Provide exclusive perks, personal service, early access to products'
        };
    }

    // Loyal: Good frequency and recency
    if (rfm.segment === 'Loyal' || (rfm.frequency >= 4 && rfm.recency >= 3)) {
        return {
            segment: 'Loyal',
            description: 'Regular customers with consistent purchases',
            recommendedAction: 'Reward loyalty, encourage referrals, upsell premium products'
        };
    }

    // At Risk: Previously good customers showing churn signs
    if (churn.risk === 'High' && customer.totalSpent > 1000) {
        return {
            segment: 'At Risk',
            description: 'Valuable customers at risk of churning',
            recommendedAction: 'Send win-back campaigns, offer special discounts, request feedback'
        };
    }

    // Lost: High churn risk, long time since purchase
    if (rfm.segment === 'Lost' || churn.risk === 'High') {
        return {
            segment: 'Lost',
            description: 'Customers who have stopped purchasing',
            recommendedAction: 'Reactivation campaigns, deep discounts, survey for feedback'
        };
    }

    // New: Recent first purchase, low frequency
    if (rfm.segment === 'New' || (rfm.recency >= 4 && rfm.frequency <= 2)) {
        return {
            segment: 'New',
            description: 'Recent customers with potential',
            recommendedAction: 'Onboarding emails, product recommendations, first-purchase incentives'
        };
    }

    // Promising: Good potential but needs nurturing
    if (rfm.recency >= 3 && rfm.monetary >= 3) {
        return {
            segment: 'Promising',
            description: 'Customers with growth potential',
            recommendedAction: 'Engagement campaigns, loyalty program enrollment, personalized offers'
        };
    }

    // Hibernating: Previously active, now dormant
    return {
        segment: 'Hibernating',
        description: 'Inactive customers who may return',
        recommendedAction: 'Re-engagement campaigns, special comeback offers'
    };
}

// ============================================================================
// PURCHASE PATTERN ANALYSIS
// ============================================================================

export interface PurchasePattern {
    avgDaysBetweenPurchases: number;
    preferredCategories: string[];
    avgBasketSize: number;
    avgTransactionValue: number;
    peakPurchaseDay: string;
    peakPurchaseHour: number;
}

/**
 * Analyze customer purchase patterns
 */
export function analyzePurchasePattern(
    customer: Customer,
    sales: SaleRecord[],
    products: any[]
): PurchasePattern {
    const customerSales = sales.filter(s => s.customerId === customer.id);

    if (customerSales.length === 0) {
        return {
            avgDaysBetweenPurchases: 0,
            preferredCategories: [],
            avgBasketSize: 0,
            avgTransactionValue: 0,
            peakPurchaseDay: 'Unknown',
            peakPurchaseHour: 0
        };
    }

    // Average days between purchases
    const sortedSales = [...customerSales].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let totalDaysBetween = 0;
    for (let i = 1; i < sortedSales.length; i++) {
        const days = Math.floor(
            (new Date(sortedSales[i].date).getTime() - new Date(sortedSales[i - 1].date).getTime())
            / (1000 * 60 * 60 * 24)
        );
        totalDaysBetween += days;
    }
    const avgDaysBetweenPurchases = sortedSales.length > 1
        ? Math.round(totalDaysBetween / (sortedSales.length - 1))
        : 0;

    // Preferred categories
    const categoryCount: Record<string, number> = {};
    for (const sale of customerSales) {
        for (const item of sale.items) {
            const product = products.find(p => p.id === item.id);
            if (product) {
                categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
            }
        }
    }
    const preferredCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

    // Average basket size (items per transaction)
    const totalItems = customerSales.reduce((sum, sale) =>
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const avgBasketSize = Math.round(totalItems / customerSales.length);

    // Average transaction value
    const avgTransactionValue = Math.round(customer.totalSpent / customerSales.length);

    // Peak purchase day
    const dayCount: Record<string, number> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const sale of customerSales) {
        const day = days[new Date(sale.date).getDay()];
        dayCount[day] = (dayCount[day] || 0) + 1;
    }
    const peakPurchaseDay = Object.entries(dayCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Peak purchase hour
    const hourCount: Record<number, number> = {};
    for (const sale of customerSales) {
        const hour = new Date(sale.date).getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
    }
    const peakPurchaseHour = parseInt(
        Object.entries(hourCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '0'
    );

    return {
        avgDaysBetweenPurchases,
        preferredCategories,
        avgBasketSize,
        avgTransactionValue,
        peakPurchaseDay,
        peakPurchaseHour
    };
}

// ============================================================================
// PRODUCT RECOMMENDATIONS
// ============================================================================

/**
 * Generate product recommendations for customer
 * Based on purchase history and similar customers
 */
export function generateRecommendations(
    customer: Customer,
    sales: SaleRecord[],
    allProducts: any[],
    maxRecommendations: number = 5
): any[] {
    const customerSales = sales.filter(s => s.customerId === customer.id);

    // Get products customer has purchased
    const purchasedProductIds = new Set(
        customerSales.flatMap(sale => sale.items.map(item => item.id))
    );

    // Get categories customer prefers
    const categoryCount: Record<string, number> = {};
    for (const sale of customerSales) {
        for (const item of sale.items) {
            const product = allProducts.find(p => p.id === item.id);
            if (product) {
                categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
            }
        }
    }

    // Recommend products from preferred categories that customer hasn't bought
    const recommendations = allProducts
        .filter(product =>
            !purchasedProductIds.has(product.id) &&
            categoryCount[product.category] > 0 &&
            product.status === 'active'
        )
        .sort((a, b) => {
            // Sort by category preference and price
            const aCategoryScore = categoryCount[a.category] || 0;
            const bCategoryScore = categoryCount[b.category] || 0;
            return bCategoryScore - aCategoryScore;
        })
        .slice(0, maxRecommendations);

    return recommendations;
}

// ============================================================================
// LOYALTY TIER MANAGEMENT
// ============================================================================

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

/**
 * Calculate appropriate loyalty tier for customer
 */
export function calculateLoyaltyTier(customer: Customer, sales: SaleRecord[]): LoyaltyTier {
    const clv = calculateCLV(customer, sales);
    const customerSales = sales.filter(s => s.customerId === customer.id);

    // Platinum: CLV > $10,000 or 50+ purchases
    if (clv > 10000 || customerSales.length >= 50) {
        return 'Platinum';
    }

    // Gold: CLV > $5,000 or 20+ purchases
    if (clv > 5000 || customerSales.length >= 20) {
        return 'Gold';
    }

    // Silver: CLV > $1,000 or 5+ purchases
    if (clv > 1000 || customerSales.length >= 5) {
        return 'Silver';
    }

    // Bronze: Everyone else
    return 'Bronze';
}

/**
 * Check if customer should be promoted to next tier
 */
export function shouldPromoteTier(
    customer: Customer,
    sales: SaleRecord[]
): { shouldPromote: boolean; newTier?: LoyaltyTier; reason?: string } {
    const currentTier = customer.tier;
    const calculatedTier = calculateLoyaltyTier(customer, sales);

    if (calculatedTier !== currentTier) {
        const tierOrder: LoyaltyTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];
        const currentIndex = tierOrder.indexOf(currentTier);
        const calculatedIndex = tierOrder.indexOf(calculatedTier);

        if (calculatedIndex > currentIndex) {
            return {
                shouldPromote: true,
                newTier: calculatedTier,
                reason: `Customer qualifies for ${calculatedTier} tier based on purchase history`
            };
        }
    }

    return { shouldPromote: false };
}
