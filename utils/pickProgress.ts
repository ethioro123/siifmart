/** Terminal pick outcomes include explicit shortages. */
export const isPickLineResolved = (line: { status?: string }): boolean =>
    ['picked', 'completed', 'short', 'discontinued'].includes((line.status || '').toLowerCase());

export const remainingPickQuantity = (line: { expectedQty?: number; pickedQty?: number; quantity?: number }): number =>
    Math.max(0, (line.expectedQty ?? line.quantity ?? 1) - (line.pickedQty ?? 0));

export const validatePickQuantity = (quantity: number, maximum: number): void => {
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > maximum + 0.000001) {
        throw new Error(`Enter a quantity greater than zero and no more than ${maximum}.`);
    }
};

/** A SKU may have several lots/bins at one facility; prefer the manifest record. */
export const resolvePickProduct = <T extends { id: string; sku?: string; siteId?: string; site_id?: string; location?: string }>(
    products: T[], line: { productId?: string; sku?: string; location?: string } | null | undefined, siteId?: string
): T | undefined => {
    if (!line || !siteId) return undefined;
    const scoped = products.filter(product => (product.siteId || product.site_id) === siteId);
    return scoped.find(product => product.id === line.productId)
        || scoped.find(product => product.sku === line.sku && !!line.location && product.location === line.location)
        || scoped.find(product => product.sku === line.sku);
};
