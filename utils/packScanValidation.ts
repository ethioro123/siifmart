const normalizePackIdentifier = (value: string): string =>
    value.replace(/[-/\s]/g, '').toUpperCase();

export const matchesPackItemScan = (
    scannedValue: string,
    item: { sku?: string | null } | null | undefined,
    product?: { sku?: string | null; barcode?: string | null } | null
): boolean => {
    const scanned = normalizePackIdentifier(scannedValue.trim());
    if (!scanned || !item) return false;

    return [item.sku, product?.sku, product?.barcode]
        .filter((identifier): identifier is string => Boolean(identifier?.trim()))
        .some(identifier => normalizePackIdentifier(identifier) === scanned);
};

export const isExactPackQuantity = (quantity: number, required: number): boolean =>
    Number.isFinite(quantity) && quantity > 0 && Number.isFinite(required) && required > 0 && Math.abs(quantity - required) <= 0.001;
