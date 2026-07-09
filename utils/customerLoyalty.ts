import { Customer, SaleRecord } from '../types';
import { calculateCLV } from './customer';

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
