import { POItem, Product } from '../../types';
import { getSellUnit } from '../../utils/units';
import { formatProductDisplayName } from './utils';
import { computeSellUnitsPerOrderUnit, computeCostPerSellUnit } from './createPOHelpers';
import { getCountrySkuPrefix, type Country } from '../../utils/localization';

interface BuildPOItemParams {
    products: Product[];
    existingItems: POItem[];
    editingItem: POItem | null;
    country?: Country;
    productType: 'catalog' | 'new';
    currentProductToAdd: string;
    currentQty: number;
    currentCost: number;
    currentRetailPrice: number;
    customItemName: string;
    customItemBrand: string;
    selectedMainCategory: string;
    customItemSize: string;
    customItemUnit: string;
    customItemImage: string;
    customAttributes: any;
    caseSize: number;
    pkgType: string;
}

export async function buildPOItem(params: BuildPOItemParams): Promise<{
    item?: POItem;
    errors?: Record<string, string>;
}> {
    const {
        products,
        existingItems,
        editingItem,
        country,
        productType,
        currentProductToAdd,
        currentQty,
        currentCost,
        currentRetailPrice,
        customItemName,
        customItemBrand,
        selectedMainCategory,
        customItemSize,
        customItemUnit,
        customItemImage,
        customAttributes,
        caseSize,
        pkgType,
    } = params;

    const newErrors: Record<string, string> = {};
    if (!currentQty || currentQty <= 0) newErrors.qty = 'Quantity is required';
    if (!currentCost || currentCost <= 0) newErrors.cost = 'Unit cost is required';
    if (!currentRetailPrice || currentRetailPrice <= 0) newErrors.retail = 'Retail price is required';

    if (productType === 'new') {
        if (!customItemName.trim()) newErrors.name = 'Product name is required';
        if (!customItemBrand.trim()) newErrors.brand = 'Brand is required';
        if (!selectedMainCategory) newErrors.category = 'Main category is required';
        if (!customAttributes.identity.subcategory) newErrors.subcategory = 'Sub-category is required';
        if (!customAttributes.physical.form) newErrors.form = 'Physical form is required';
        if (!customItemSize.trim()) newErrors.size = 'Measure is required';
        if (!customItemUnit) newErrors.unit = 'Unit is required';
        if (!customAttributes.packaging.packageType) newErrors.packageType = 'Primary container is required';
        if (!customAttributes.packaging.material) newErrors.material = 'Packaging material is required';
        if (!customAttributes.storage.inboundQcDirective) newErrors.qc = 'Inbound QC directive is required';

        if (!editingItem && customItemName.trim() && customItemBrand.trim()) {
            const normName = customItemName.trim().toLowerCase();
            const normBrand = customItemBrand.trim().toLowerCase();
            const normSize = customItemSize.trim().toLowerCase();
            const catalogCollision = products.find(p => {
                const pName = (p.name || '').trim().toLowerCase();
                const pBrand = (p.brand || '').trim().toLowerCase();
                const pSize = (p.size || '').trim().toLowerCase();
                return (
                    (pName === normName || pName === `${normBrand} ${normName}`) &&
                    (!pBrand || pBrand === normBrand) &&
                    (!normSize || !pSize || pSize === normSize)
                );
            });
            if (catalogCollision) {
                newErrors.name = `Matches existing catalog SKU (${catalogCollision.sku}) — use "Existing Item" tab`;
            }
        }
    } else if (!currentProductToAdd) {
        newErrors.search = 'Please select a product from catalog';
    } else {
        const selectedProd = products.find(p => p.id === currentProductToAdd);
        const duplicateInManifest = existingItems.find(
            item =>
                item !== editingItem &&
                (item.productId === currentProductToAdd ||
                    (selectedProd?.sku && item.sku && item.sku === selectedProd.sku))
        );
        if (duplicateInManifest && Math.abs(duplicateInManifest.unitCost - currentCost) > 0.001) {
            newErrors.search = `Already in manifest at ${duplicateInManifest.unitCost} — edit existing row to change unit cost`;
        }
    }

    if (Object.keys(newErrors).length > 0) {
        return { errors: newErrors };
    }

    let prod: Product | undefined;
    let name = customItemName.trim();
    let sku = '';
    const cat = selectedMainCategory || 'General';
    let image = customItemImage;
    let barcode = '';

    if (productType === 'catalog') {
        prod = products.find(p => p.id === currentProductToAdd);
        if (!prod) return { errors: { search: 'Selected product not found' } };
        name = formatProductDisplayName(prod);
        sku = prod.sku;
        image = prod.image;
        barcode = prod.barcode || '';
    } else {
        if (customItemBrand && !name.toLowerCase().startsWith(customItemBrand.toLowerCase())) {
            name = `${customItemBrand.trim()} ${name}`;
        }
        const skuPrefix = getCountrySkuPrefix(country);
        if (editingItem && editingItem.sku && !editingItem.sku.startsWith('CUSTOM-')) {
            sku = editingItem.sku;
            barcode = editingItem.barcode || sku;
        } else {
            try {
                const { generateUniqueSKU } = await import('../../utils/skuGenerator');
                sku = await generateUniqueSKU(cat, undefined, skuPrefix);
            } catch {
                const prefix = cat.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
                const randomDigits = Math.floor(10000 + Math.random() * 90000);
                sku = `${skuPrefix}-${prefix}-${randomDigits}`;
            }
            barcode = sku;
        }
    }

    const su = getSellUnit(customItemUnit);
    const derivedPackQty = parseInt(customAttributes.packaging.packQty) || 1;
    const isCaseOrPack = caseSize >= 1 || derivedPackQty > 1;
    const sellUnitsPerOrder = computeSellUnitsPerOrderUnit({
        packQuantity: derivedPackQty,
        customAttributes,
    });
    const derivedCostPerSellUnit = computeCostPerSellUnit(currentCost, sellUnitsPerOrder);

    const itemData: POItem = {
        productId: prod ? prod.id : editingItem?.productId || `CUSTOM-${Date.now()}`,
        productName: name,
        sku,
        category: cat,
        quantity: currentQty,
        unitCost: currentCost,
        totalCost: currentQty * currentCost,
        retailPrice: currentRetailPrice,
        costPerSellUnit: derivedCostPerSellUnit,
        image,
        brand: customItemBrand,
        size: customItemSize,
        unit: customItemUnit,
        packQuantity: derivedPackQty,
        caseSize: caseSize > 0 ? caseSize : undefined,
        orderUnit: isCaseOrPack ? pkgType || (caseSize >= 1 ? 'Case' : 'Pack') : su.unitLabel,
        barcode,
        identityType: productType === 'catalog' ? 'known' : 'new',
        isCustom: productType === 'new',
        description: customAttributes.descriptive.usage,
        minStock: 10,
        maxStock: 100,
        customAttributes: {
            ...customAttributes,
            identity: {
                ...customAttributes.identity,
                subcategory: customAttributes.identity.subcategory,
            },
        },
    };

    return { item: itemData };
}
