import type { Product } from '../../../types';
import { formatStockDisplay, getEffectivePackageSize, getSellUnit } from '../../../utils/units';

type TransferProduct = Partial<Pick<Product,
    'id' | 'sku' | 'name' | 'image' | 'price' | 'category' | 'brand' | 'barcode' | 'unit' | 'size' |
    'packQuantity' | 'packageType' | 'customAttributes' | 'stock' | 'costPrice' | 'retailPrice' |
    'pack_quantity' | 'package_type' | 'custom_attributes'
>>;

export const getTransferQuantityConfig = (product?: TransferProduct | null) => {
    const unit = getSellUnit(product?.unit);
    const custom = product?.customAttributes || product?.custom_attributes || {};
    const sellBy = custom?.commercial?.sellBy;
    const isWeighted = custom?.commercial?.isWeighted === true;
    const parsedSize = Number.parseFloat(String(product?.size ?? ''));
    const hasSize = Number.isFinite(parsedSize) && parsedSize > 0;
    const isMeasureUnit = unit.category === 'weight' || unit.category === 'volume';
    const isLooseMeasure = isMeasureUnit && (sellBy === 'Weight' || sellBy === 'Volume' || isWeighted || !hasSize);
    const packageSize = hasSize ? getEffectivePackageSize(unit.code, product?.size) : 1;
    const packQuantity = product?.packQuantity || product?.pack_quantity;
    const quantityLabel = isLooseMeasure
        ? unit.shortLabel
        : unit.category === 'count' && unit.code !== 'UNIT'
            ? unit.shortLabel
            : packQuantity && packQuantity > 1
                ? 'pk'
                : isMeasureUnit && hasSize ? 'pack' : 'ea';

    return {
        unit,
        isLooseMeasure,
        isPackagedMeasure: isMeasureUnit && hasSize && !isLooseMeasure,
        packageSize,
        quantityLabel,
        step: isLooseMeasure ? unit.step : 1,
        min: isLooseMeasure ? unit.step : 1,
        allowDecimal: isLooseMeasure && unit.allowDecimal
    };
};

export const formatTransferStock = (stock: number, product?: TransferProduct | null): string =>
    formatStockDisplay(stock, product ? { ...product, size: getTransferPackageSizeLabel(product) || product.size } : product, { showPackaging: true });

export const getTransferPackageSizeLabel = (product?: TransferProduct | null): string => {
    if (!product?.size) return '';
    const size = String(product.size).trim();
    if (/[a-zA-Z]+$/.test(size)) return size;
    const unit = getSellUnit(product.unit);
    if (unit.category !== 'weight' && unit.category !== 'volume') return size;
    const normalized = getEffectivePackageSize(unit.code, size);
    return `${normalized}${unit.shortLabel}`;
};

export const getTransferRemainingStock = (
    stock: number,
    requestedQty: number,
    product?: TransferProduct | null,
    measureMode = false
): number => {
    const config = getTransferQuantityConfig(product);
    if (measureMode && config.isPackagedMeasure) {
        return stock * config.packageSize - requestedQty;
    }
    return stock - requestedQty;
};

export const toTransferStockQuantity = (
    requestedQty: number,
    product?: TransferProduct | null,
    measureMode = false
): number => {
    const config = getTransferQuantityConfig(product);
    if (measureMode && config.isPackagedMeasure) {
        return requestedQty / config.packageSize;
    }
    return requestedQty;
};

export const toTransferMeasureQuantity = (stockQty: number, product?: TransferProduct | null): number => {
    const config = getTransferQuantityConfig(product);
    return config.isPackagedMeasure ? stockQty * config.packageSize : stockQty;
};

export const normalizeTransferEntry = (value: string, product?: TransferProduct | null, measureMode = false): number => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    const config = getTransferQuantityConfig(product);
    const step = measureMode && config.isPackagedMeasure ? config.unit.step : config.step;
    if (!config.allowDecimal && !(measureMode && config.isPackagedMeasure && config.unit.allowDecimal)) return Math.floor(parsed);
    const precision = Math.max(0, Math.ceil(-Math.log10(step)));
    const scale = 10 ** precision;
    return Math.round(parsed * scale) / scale;
};

export const buildTransferLineItem = (product: Product | undefined, quantity: number) => {
    const config = getTransferQuantityConfig(product);
    return {
        productId: product?.id || '',
        sku: product?.sku || '',
        name: product?.name || '',
        image: product?.image || '',
        price: product?.price ?? 0,
        retailPrice: product?.retailPrice ?? product?.price ?? 0,
        costPrice: product?.costPrice ?? 0,
        category: product?.category || 'General',
        brand: product?.brand || '',
        unit: product?.unit || 'UNIT',
        size: product?.size || '',
        packQuantity: product?.packQuantity,
        packageType: product?.packageType,
        customAttributes: product?.customAttributes,
        barcode: product?.barcode || '',
        expectedQty: quantity,
        requestedMeasureQty: config.isLooseMeasure
            ? quantity
            : undefined,
        pickedQty: 0,
        status: 'Pending' as const
    };
};
