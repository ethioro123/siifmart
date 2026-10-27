/** Purchase amounts retain cents; whole-number rounding belongs to selling prices. */
export function purchaseAmount(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
export function orderCostFromSellUnit(costPerSellUnit: number, sellUnitsPerOrder: number): number {
    if (!Number.isFinite(costPerSellUnit) || costPerSellUnit < 0 || !Number.isFinite(sellUnitsPerOrder) || sellUnitsPerOrder <= 0) throw new Error('Valid recorded cost and order conversion are required.');
    return purchaseAmount(costPerSellUnit * sellUnitsPerOrder);
}
