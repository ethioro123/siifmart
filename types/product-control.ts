export type SellMode = 'count' | 'weight' | 'volume';
export type UnitScope = 'single' | 'custom' | 'all';
export interface UnitConfig {
    sellMode: SellMode; sellUnit: string; physicalQty: string; physicalUnit: string;
    packOf: string; caseOf: string; label: string; scope?: UnitScope; selectedSiteIds?: string[];
}
export type PricingScope = 'single' | 'all' | 'custom';
export interface PricingConfig {
    price: number; costPrice: number; salePrice: number; isOnSale: boolean;
    competitorPrice: number; scope: PricingScope; selectedSiteIds: string[];
}
export interface StockConfig { minStock: string; maxStock: string }
export interface ProfileConfig { name: string; brand: string; description: string }
