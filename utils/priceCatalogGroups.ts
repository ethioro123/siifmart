import type { Product } from '../types';
export interface PriceCatalogGroup {
    locationCount: number; recordCount: number; minPrice: number; maxPrice: number;
    priceVariants: number; saleLocations: number; minMargin: number | null; maxMargin: number | null;
}
export function priceCatalogGroup(product: Product): PriceCatalogGroup | undefined {
    return (product as Product & { price_group?: PriceCatalogGroup }).price_group;
}
export function wholeRange(min: number | null, max: number | null, suffix = ''): string {
    if (min === null || max === null) return 'Unavailable';
    const low = Math.round(min).toLocaleString();
    const high = Math.round(max).toLocaleString();
    return min === max ? `${low}${suffix}` : `${low}–${high}${suffix}`;
}
