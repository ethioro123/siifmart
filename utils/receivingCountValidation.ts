/** Validate physical counts without comparing or revealing expected quantities. */
export function hasValidReceivingCounts(splits: readonly { quantity: number }[]): boolean {
    return splits.length > 0 && splits.every(split => Number.isFinite(split.quantity) && split.quantity > 0);
}
