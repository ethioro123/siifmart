import { POItem, Product } from '../../types';
import { getSellUnit } from '../../utils/units';
import { formatProductDisplayName, isConsumableCategory, getCategorySpecGroup } from './utils';
import { getCategoryPackagingDefaults, getCategoryStorageDefaults } from './categoryLogistics';
import { generateSequentialSKU } from '../../utils/skuGenerator';
import type { Country } from '../../utils/localization';

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

    const specGroup = getCategorySpecGroup(selectedMainCategory, customAttributes.identity?.subcategory);
    const domainId = specGroup.id;
    const pkgDefaults = getCategoryPackagingDefaults(domainId);
    const storageDefaults = getCategoryStorageDefaults(domainId);

    if (productType === 'new') {
        if (!customItemName.trim()) newErrors.name = 'Product name is required';
        if (!customItemBrand.trim()) newErrors.brand = 'Brand is required';
        if (!selectedMainCategory) newErrors.category = 'Main category is required';
        if (!customItemUnit) newErrors.unit = 'Sell unit is required';

        const requiresSize =
            isConsumableCategory(selectedMainCategory) ||
            domainId === 'apparel' ||
            domainId === 'beverages';
        if (requiresSize && !customItemSize.trim()) {
            newErrors.size = domainId === 'apparel' ? 'Size / fitment is required' : 'Net content / measure is required';
        }

        const packagingLevel =
            customAttributes.packaging?.packagingLevel ||
            (parseInt(customAttributes.packaging?.caseSize) > 0
                ? 'two_tier'
                : customAttributes.packaging?.packageType === 'Bale'
                ? 'bale'
                : parseInt(customAttributes.packaging?.packQty) > 1
                ? 'case'
                : 'single');

        if (packagingLevel !== 'single') {
            const pq = parseInt(customAttributes.packaging?.packQty) || 0;
            if (pq < 2) {
                newErrors.packQty = 'Enter at least 2 units per pack/case';
            }
        }
        if (packagingLevel === 'two_tier') {
            const cs = parseInt(customAttributes.packaging?.caseSize) || 0;
            if (cs < 1) {
                newErrors.caseSize = 'Enter at least 1 inner pack per case';
            }
        }

        const isPerishable =
            customAttributes.storage?.isPerishable !== undefined
                ? Boolean(customAttributes.storage.isPerishable)
                : storageDefaults.defaultPerishable;
        if (isPerishable) {
            const shelfDays = parseInt(customAttributes.storage?.shelfLifeDays) || 0;
            if (shelfDays <= 0) {
                newErrors.shelfLifeDays = 'Shelf life (days) is required for perishable items';
            }
        }

        if (!editingItem && customItemName.trim() && customItemBrand.trim()) {
            const normName = customItemName.trim().toLowerCase();
            const normBrand = customItemBrand.trim().toLowerCase();
            const sizeType = (customAttributes.physical?.sizeType || '').trim().toLowerCase();
            const rawSize = customItemSize.trim().toLowerCase();
            const normSize = sizeType && rawSize && !rawSize.endsWith(sizeType) ? `${rawSize}${sizeType}` : rawSize;
            const catalogCollision = products.find(p => {
                const pName = (p.name || '').trim().toLowerCase();
                const pBrand = (p.brand || '').trim().toLowerCase();
                const pSize = (p.size || '').trim().toLowerCase();
                return (
                    (pName === normName || pName === `${normBrand} ${normName}`) &&
                    (!pBrand || pBrand === normBrand) &&
                    (!normSize || !pSize || pSize === normSize || pSize === rawSize)
                );
            });
            if (catalogCollision) {
                newErrors.name = `Matches existing catalog SKU (${catalogCollision.sku}) — use "Catalog Search" tab`;
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

    if (productType === 'catalog') {
        prod = products.find(p => p.id === currentProductToAdd);
        if (!prod) return { errors: { search: 'Selected product not found' } };
        name = formatProductDisplayName(prod);
        sku = prod.sku;
        image = prod.image;
    } else {
        if (customItemBrand && !name.toLowerCase().startsWith(customItemBrand.toLowerCase())) {
            name = `${customItemBrand.trim()} ${name}`;
        }
        if (editingItem && editingItem.sku && !editingItem.sku.startsWith('CUSTOM-')) {
            sku = editingItem.sku;
        } else {
            sku = await generateSequentialSKU(cat, products, country);
        }
    }

    const su = getSellUnit(customItemUnit || 'UNIT');
    const derivedPackQty = parseInt(customAttributes.packaging?.packQty) || 1;
    const isCaseOrPack = caseSize >= 1 || derivedPackQty > 1;
    const resolvedPackageType = isCaseOrPack
        ? pkgType || pkgDefaults.containers[0] || (caseSize >= 1 ? 'Case' : 'Pack')
        : pkgType || pkgDefaults.containers[0] || su.code;

    const rawSize = customItemSize.trim();
    const sizeType = (customAttributes.physical?.sizeType || '').trim();
    const formattedSize =
        rawSize && sizeType && !rawSize.toLowerCase().endsWith(sizeType.toLowerCase())
            ? `${rawSize}${sizeType}`
            : rawSize;

    const resolvedCustomAttributes = {
        ...customAttributes,
        identity: {
            ...customAttributes.identity,
            subcategory: customAttributes.identity?.subcategory || cat,
        },
        physical: {
            ...customAttributes.physical,
            netWeight: customAttributes.physical?.netWeight || rawSize,
            sizeType: sizeType || customAttributes.physical?.sizeType || '',
            form: customAttributes.physical?.form || (domainId === 'beverages' ? 'Liquid' : 'Solid'),
        },
        packaging: {
            ...customAttributes.packaging,
            packageType: resolvedPackageType,
            material: customAttributes.packaging?.material || pkgDefaults.defaultMaterial || 'Paper / Cardboard',
            unitSize: formattedSize || customAttributes.packaging?.unitSize || '',
        },
        storage: {
            ...customAttributes.storage,
            type: customAttributes.storage?.type || storageDefaults.defaultStorage || 'Ambient (Dry)',
            isPerishable:
                customAttributes.storage?.isPerishable !== undefined
                    ? customAttributes.storage.isPerishable
                    : storageDefaults.defaultPerishable,
            shelfLifeDays:
                customAttributes.storage?.shelfLifeDays || storageDefaults.defaultShelfLife || '',
            inboundQcDirective:
                customAttributes.storage?.inboundQcDirective ||
                storageDefaults.inboundDirectives[0] ||
                'Standard Receiving Audit',
        },
    };

    const itemData: POItem = {
        productId: prod ? prod.id : editingItem?.productId || `CUSTOM-${Date.now()}`,
        productName: name,
        sku,
        category: cat,
        quantity: currentQty,
        unitCost: currentCost,
        totalCost: currentQty * currentCost,
        retailPrice: currentRetailPrice,
        image,
        brand: customItemBrand,
        size: formattedSize,
        unit: customItemUnit || 'UNIT',
        packQuantity: derivedPackQty,
        packageType: resolvedPackageType,
        caseSize: caseSize > 0 ? caseSize : undefined,
        identityType: productType === 'catalog' ? 'known' : 'new',
        description: customAttributes.descriptive?.usage,
        minStock: 10,
        maxStock: 100,
        customAttributes: resolvedCustomAttributes,
    };

    return { item: itemData };
}
