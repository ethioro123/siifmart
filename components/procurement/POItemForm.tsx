import React, { useState, useEffect } from 'react';
import { POItem, Product } from '../../types';
import { Plus } from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { getSellUnit } from '../../utils/units';
import { ItemPreviewCard } from './ItemPreviewCard';
import { BuyingAttributes } from './BuyingAttributes';
import { SellingAttributes } from './SellingAttributes';
import { POItemOrderDetails } from './POItemOrderDetails';
import { CatalogItemSection } from './CatalogItemSection';
import { POItemFormActions } from './POItemFormActions';
import { formatProductDisplayName } from './utils';
import { resolveSmartProductAttributes } from '../../utils/groceryAttributes';
import { buildPOItem } from './buildPOItem';
import { computeSellUnitsPerOrderUnit, resolveOrderUnitLabels } from './createPOHelpers';
import type { Country } from '../../utils/localization';

const createDefaultCustomAttributes = () => ({
    identity: { variant: '', type: '', subcategory: '', modelNumber: '' },
    physical: { netWeight: '', grossWeight: '', volume: '', unit: '', sizeType: '', dims: '', color: '', form: '', texture: '' },
    packaging: { unitSize: '', packQty: '', caseSize: '', packagingLevel: '', material: '', isBreakable: false, packageType: '' },
    storage: { type: 'Ambient', isPerishable: false, stackLimit: '', isHazardous: false, isFragile: false, isLightSensitive: false, inboundQcDirective: '', shelfLifeDays: '' },
    commercial: { isWeighted: false, sellBy: 'Unit', priceType: 'Fixed', isBundleEligible: false, isReturnable: true },
    descriptive: { usage: '', audience: '', ingredients: '', keyFeatures: '', scent: '', flavor: '', strength: '' },
    categorySpecific: {} as Record<string, any>
});

interface POItemFormProps {
    products: Product[];
    existingItems?: POItem[];
    initialProduct?: Product | null;
    country?: Country;
    currencySymbol?: string;
    onAdd: (item: POItem) => void;
    onUpdate: (item: POItem) => void;
    onCancelEdit: () => void;
    editingItem: POItem | null;
    onDirtyChange?: (isDirty: boolean) => void;
}

export const POItemForm: React.FC<POItemFormProps> = ({
    products, existingItems = [], initialProduct = null, country, currencySymbol = 'ETB',
    onAdd, onUpdate, onCancelEdit, editingItem, onDirtyChange
}) => {
    const { showToast } = useStore();

    const [productType, setProductType] = useState<'catalog' | 'new'>('catalog');
    const [currentProductToAdd, setCurrentProductToAdd] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [customItemName, setCustomItemName] = useState('');
    const [customItemBrand, setCustomItemBrand] = useState('');
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [customItemSize, setCustomItemSize] = useState('');
    const [customItemUnit, setCustomItemUnit] = useState('');
    const [customItemImage, setCustomItemImage] = useState('');
    const [customAttributes, setCustomAttributes] = useState(createDefaultCustomAttributes);

    const [currentQty, setCurrentQty] = useState(0);
    const [currentCost, setCurrentCost] = useState(0);
    const [currentRetailPrice, setCurrentRetailPrice] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedCatalogProduct = productType === 'catalog' ? products.find(p => p.id === currentProductToAdd) : null;
    const activePackaging = selectedCatalogProduct?.customAttributes?.packaging || (selectedCatalogProduct as any)?.custom_attributes?.packaging || customAttributes.packaging;
    const packagingLevel = activePackaging?.packagingLevel || (parseInt(activePackaging?.caseSize) > 0 ? 'two_tier' : activePackaging?.packageType === 'Bale' ? 'bale' : parseInt(activePackaging?.packQty) > 1 ? 'case' : 'single');
    const caseSize = packagingLevel === 'single' ? 0 : (parseInt(activePackaging?.caseSize) || 0);
    const packQty = packagingLevel === 'single' ? 1 : (parseInt(activePackaging?.packQty) || selectedCatalogProduct?.packQuantity || (selectedCatalogProduct as any)?.pack_quantity || 1);
    const pkgType = activePackaging?.packageType || '';
    const hasCases = caseSize >= 1 && caseSize > 0;
    const hasPacks = packQty > 1 && !hasCases;
    const { orderUnitName, unitSuffix } = resolveOrderUnitLabels(packagingLevel, hasCases, hasPacks, caseSize, packQty);
    const unitsPerOrderUnit = computeSellUnitsPerOrderUnit(
        customAttributes.physical?.netWeight || customItemSize || '',
        customAttributes.physical?.sizeType || '',
        customItemUnit || 'UNIT',
        packQty,
        caseSize
    );
    const totalUnits = Math.round(currentQty * unitsPerOrderUnit * 100) / 100;
    const showConversion = currentQty > 0 && unitsPerOrderUnit > 1;
    const activeSizeType = customAttributes.physical?.sizeType || '';
    const formattedCustomSize = customItemSize
        ? (activeSizeType && !customItemSize.toLowerCase().endsWith(activeSizeType.toLowerCase())
            ? `${customItemSize}${activeSizeType}`
            : customItemSize)
        : '';

    useEffect(() => {
        const isDirty = Boolean(
            (productType === 'catalog' && currentProductToAdd) ||
            (productType === 'new' && (customItemName.trim() || customItemBrand.trim())) ||
            currentQty > 0
        );
        onDirtyChange?.(isDirty);
    }, [productType, currentProductToAdd, customItemName, customItemBrand, currentQty, onDirtyChange]);

    const resetForm = () => {
        setProductType('catalog');
        setCurrentProductToAdd('');
        setSearchTerm('');
        setIsSearchOpen(false);
        setCustomItemName('');
        setSelectedMainCategory('');
        setCustomItemBrand('');
        setCustomItemSize('');
        setCustomItemUnit('');
        setCustomItemImage('');
        setCurrentQty(0);
        setCurrentCost(0);
        setCurrentRetailPrice(0);
        setErrors({});
        setCustomAttributes(createDefaultCustomAttributes());
    };

    const handleSelectCatalogProduct = (p: Product) => {
        const smart = resolveSmartProductAttributes(p, products, currencySymbol);
        setSelectedMainCategory(p.category || '');
        setCustomItemBrand(smart.brand || p.brand || '');
        setCustomItemName(p.name);
        setCustomItemSize(smart.netContent || p.size || '');
        setCustomItemUnit(p.unit || '');
        setCustomItemImage(p.image || '');

        const pAttrs = p.customAttributes || (p as any).custom_attributes || {};
        const pCaseSize = parseInt(pAttrs.packaging?.caseSize) || 0;
        const pPackQty = parseInt(pAttrs.packaging?.packQty) || p.packQuantity || (p as any).pack_quantity || smart.packQty || 1;
        const pUnitsPerOrder = pCaseSize >= 1 ? pCaseSize * pPackQty : (pPackQty > 1 ? pPackQty : 1);

        // Catalog costPrice is stored per sellable unit; scale to order-unit cost when ordering by pack/case
        const rawCost = p.costPrice || 0;
        const rawRetail = p.price || 0;
        const orderUnitCost = (pUnitsPerOrder > 1 && rawCost > 0 && (rawRetail === 0 || rawCost <= rawRetail))
            ? Math.round(rawCost * pUnitsPerOrder * 100) / 100
            : rawCost;
        setCurrentCost(orderUnitCost);
        setCurrentRetailPrice(rawRetail);

        setCustomAttributes((prev: any) => ({
            ...prev,
            identity: { ...prev.identity, subcategory: smart.subcategory || '', variant: smart.variant || '', ...(pAttrs.identity || {}) },
            physical: { ...prev.physical, form: smart.physicalForm || '', ...(pAttrs.physical || {}) },
            packaging: { ...prev.packaging, material: smart.packagingMaterial || '', packageType: smart.packageType || '', packQty: String(pPackQty || 1), ...(pAttrs.packaging || {}) },
            storage: { ...prev.storage, type: smart.storageType, isPerishable: smart.isPerishable, isFragile: smart.isFragile, inboundQcDirective: smart.inboundQcDirective || '', ...(pAttrs.storage || {}) },
            commercial: { ...prev.commercial, isHalal: smart.isHalal, requiresBatchTracking: smart.requiresBatch, requiresSerialTracking: smart.requiresSerial, ...(pAttrs.commercial || {}) },
            descriptive: { ...prev.descriptive, ...(pAttrs.descriptive || {}) },
            categorySpecific: { ...prev.categorySpecific, ...(pAttrs.categorySpecific || {}) },
        }));
    };

    useEffect(() => {
        if (initialProduct && !editingItem) {
            setProductType('catalog');
            setCurrentProductToAdd(initialProduct.id);
            setSearchTerm(formatProductDisplayName(initialProduct) || initialProduct.name);
            handleSelectCatalogProduct(initialProduct);
            setCurrentQty(prev => (prev > 0 ? prev : 1));
        }
    }, [initialProduct?.id]);

    useEffect(() => {
        if (editingItem) {
            setProductType(editingItem.identityType === 'known' ? 'catalog' : 'new');
            setCurrentProductToAdd(editingItem.productId || '');
            setCurrentQty(editingItem.quantity);
            setCurrentCost(editingItem.unitCost);
            setCurrentRetailPrice(editingItem.retailPrice || 0);

            if (editingItem.productId && editingItem.identityType === 'known') {
                const existing = products.find(p => p.id === editingItem.productId);
                if (existing) setSearchTerm(formatProductDisplayName(existing) || existing.name);
            }

            let cleanName = editingItem.productName;
            const brand = editingItem.brand || '';
            if (brand) {
                const regex = new RegExp(`^${brand}\\s*`, 'i');
                if (regex.test(cleanName)) cleanName = cleanName.replace(regex, '').trim();
            }

            setCustomItemName(cleanName);
            setCustomItemBrand(brand);
            setSelectedMainCategory(editingItem.category || '');
            setCustomItemSize(editingItem.size || '');
            setCustomItemUnit(editingItem.unit || '');
            setCustomItemImage(editingItem.image || '');

            if (editingItem.customAttributes) {
                const ca = editingItem.customAttributes;
                setCustomAttributes(prev => ({
                    ...prev,
                    identity: { ...prev.identity, ...ca.identity },
                    physical: { ...prev.physical, ...ca.physical },
                    packaging: { ...prev.packaging, ...ca.packaging },
                    storage: { ...prev.storage, ...ca.storage },
                    commercial: { ...prev.commercial, ...ca.commercial },
                    descriptive: { ...prev.descriptive, ...ca.descriptive },
                    categorySpecific: { ...prev.categorySpecific, ...((ca as any)?.categorySpecific || {}) },
                }));
            } else {
                setCustomAttributes(createDefaultCustomAttributes());
            }
        } else if (!initialProduct) {
            resetForm();
        }
    }, [editingItem]);

    const handleAddItem = async () => {
        setErrors({});
        const result = await buildPOItem({
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
            pkgType
        });

        if (result.errors) {
            setErrors(result.errors);
            if (result.errors.search) {
                showToast(result.errors.search, 'error');
            } else if (productType === 'new') {
                showToast("Please fill in all required product specifications and pricing fields.", 'error');
            } else {
                showToast("Please select a product and enter valid quantity, cost, and retail price.", 'error');
            }
            return;
        }

        if (result.item) {
            if (editingItem) {
                onUpdate(result.item);
            } else {
                onAdd(result.item);
            }
            resetForm();
        }
    };

    return (
        <div id="po-item-form-container" className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <h3 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Plus size={15} />
                </div>
                {editingItem ? 'Edit Product Item' : 'Add Products'}
            </h3>

            <div className="flex gap-3 mb-5 border-b border-[var(--theme-border-subtle)] pb-3.5 relative z-10">
                <button
                    type="button"
                    onClick={() => setProductType('catalog')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${productType === 'catalog' ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]'}`}
                >
                    CATALOG SEARCH
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setProductType('new');
                        if (!customItemUnit) setCustomItemUnit('UNIT');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${productType === 'new' ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]'}`}
                >
                    CUSTOM ITEM
                </button>
            </div>

            {(productType === 'new' || Boolean(selectedCatalogProduct)) && (
                <div className="mb-6 relative z-10">
                    <ItemPreviewCard
                        name={productType === 'catalog' && selectedCatalogProduct ? selectedCatalogProduct.name : customItemName}
                        brand={customItemBrand || selectedCatalogProduct?.brand || ''}
                        size={formattedCustomSize || selectedCatalogProduct?.size || ''}
                        unit={customItemUnit || selectedCatalogProduct?.unit || ''}
                        category={selectedMainCategory || selectedCatalogProduct?.category || ''}
                        description={selectedCatalogProduct?.description || ''}
                        cost={currentCost}
                        retailPrice={currentRetailPrice}
                        image={customItemImage || selectedCatalogProduct?.image || ''}
                        sku={selectedCatalogProduct?.sku}
                        currencySymbol={currencySymbol}
                        customAttributes={customAttributes}
                        orderUnitName={orderUnitName}
                        unitsPerOrderUnit={unitsPerOrderUnit}
                    />
                </div>
            )}

            <div className="relative z-10 space-y-6">
                {productType === 'catalog' ? (
                    <CatalogItemSection
                        products={products}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        isSearchOpen={isSearchOpen}
                        setIsSearchOpen={setIsSearchOpen}
                        currentProductToAdd={currentProductToAdd}
                        setCurrentProductToAdd={setCurrentProductToAdd}
                        selectedCatalogProduct={selectedCatalogProduct}
                        selectedMainCategory={selectedMainCategory}
                        customAttributes={customAttributes}
                        setCustomAttributes={setCustomAttributes}
                        currentQty={currentQty}
                        setCurrentQty={setCurrentQty}
                        currentCost={currentCost}
                        setCurrentCost={setCurrentCost}
                        currentRetailPrice={currentRetailPrice}
                        setCurrentRetailPrice={setCurrentRetailPrice}
                        setCustomItemUnit={setCustomItemUnit}
                        onSelectProduct={handleSelectCatalogProduct}
                        unitsPerOrderUnit={unitsPerOrderUnit}
                        totalUnits={totalUnits}
                        showConversion={showConversion}
                        unitSuffix={unitSuffix}
                        orderUnitName={orderUnitName}
                        sellUnit={customItemUnit ? getSellUnit(customItemUnit).shortLabel : 'unit'}
                        currencySymbol={currencySymbol}
                        errors={errors}
                        setErrors={setErrors}
                    />
                ) : (
                    <div className="space-y-6">
                        <BuyingAttributes
                            customItemBrand={customItemBrand}
                            setCustomItemBrand={setCustomItemBrand}
                            customItemName={customItemName}
                            setCustomItemName={setCustomItemName}
                            selectedMainCategory={selectedMainCategory}
                            setSelectedMainCategory={setSelectedMainCategory}
                            customItemSize={customItemSize}
                            setCustomItemSize={setCustomItemSize}
                            customAttributes={customAttributes}
                            setCustomAttributes={setCustomAttributes}
                            errors={errors}
                            setErrors={setErrors}
                        />
                        <POItemOrderDetails
                            currentQty={currentQty}
                            setCurrentQty={setCurrentQty}
                            currentCost={currentCost}
                            setCurrentCost={setCurrentCost}
                            currentRetailPrice={currentRetailPrice}
                            setCurrentRetailPrice={setCurrentRetailPrice}
                            unitsPerOrderUnit={unitsPerOrderUnit}
                            totalUnits={totalUnits}
                            showConversion={showConversion}
                            unitSuffix={unitSuffix}
                            orderUnitName={orderUnitName}
                            sellUnit={customItemUnit ? getSellUnit(customItemUnit).shortLabel : 'unit'}
                            currencySymbol={currencySymbol}
                            showRetailInput={false}
                            errors={errors}
                            setErrors={setErrors}
                            selectedMainCategory={selectedMainCategory}
                            customAttributes={customAttributes}
                        />
                        <SellingAttributes
                            customItemUnit={customItemUnit}
                            setCustomItemUnit={setCustomItemUnit}
                            currentRetailPrice={currentRetailPrice}
                            setCurrentRetailPrice={setCurrentRetailPrice}
                            currentCost={currentCost}
                            customItemSize={customItemSize}
                            sizeType={customAttributes.physical?.sizeType || ''}
                            customAttributes={customAttributes}
                            setCustomAttributes={setCustomAttributes}
                            currencySymbol={currencySymbol}
                            selectedMainCategory={selectedMainCategory}
                            errors={errors}
                            setErrors={setErrors}
                        />
                    </div>
                )}

                <POItemFormActions
                    editingItem={editingItem}
                    onCancelEdit={onCancelEdit}
                    onSubmit={handleAddItem}
                />
            </div>
        </div>
    );
};
