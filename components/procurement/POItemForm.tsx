import React, { useState, useEffect } from 'react';
import { POItem, Product } from '../../types';
import { Package, Plus } from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { generateSequentialSKU } from '../../utils/skuGenerator';
import { getSellUnit } from '../../utils/units';
import { ItemPreviewCard } from './ItemPreviewCard';
import { BuyingAttributes } from './BuyingAttributes';
import { SellingAttributes } from './SellingAttributes';
import { POItemOrderDetails } from './POItemOrderDetails';
import { CatalogItemSection } from './CatalogItemSection';
import { POItemFormActions } from './POItemFormActions';
import { isConsumableCategory, getPOItemCategorySpecsSummary } from './utils';
import { resolveSmartProductAttributes } from '../../utils/groceryAttributes';
import type { Country } from '../../utils/localization';

const createDefaultCustomAttributes = () => ({
    identity: { variant: '', type: '', subcategory: '', modelNumber: '' },
    physical: { netWeight: '', grossWeight: '', volume: '', unit: '', sizeType: '', dims: '', color: '', form: '', texture: '' },
    packaging: { unitSize: '', packQty: '', caseSize: '', packagingLevel: '', material: '', isBreakable: false, packageType: '' },
    storage: { type: 'Ambient', isPerishable: false, stackLimit: '', isHazardous: false, isFragile: false, isLightSensitive: false, inboundQcDirective: '' },
    commercial: { isWeighted: false, sellBy: 'Unit', priceType: 'Fixed', isBundleEligible: false, isReturnable: true },
    descriptive: { usage: '', audience: '', ingredients: '', keyFeatures: '', scent: '', flavor: '', strength: '' },
    categorySpecific: {} as Record<string, any>
});

interface POItemFormProps {
    products: Product[];
    country?: Country;
    currencySymbol?: string;
    onAdd: (item: POItem) => void;
    onUpdate: (item: POItem) => void;
    onCancelEdit: () => void;
    editingItem: POItem | null;
}

export const POItemForm: React.FC<POItemFormProps> = ({
    products, country, currencySymbol = 'ETB',
    onAdd, onUpdate, onCancelEdit, editingItem
}) => {
    const { showToast } = useStore();

    // Form & Search State
    const [productType, setProductType] = useState<'catalog' | 'new'>('catalog');
    const [currentProductToAdd, setCurrentProductToAdd] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Custom Item Fields
    const [customItemName, setCustomItemName] = useState('');
    const [customItemBrand, setCustomItemBrand] = useState('');
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [customItemSize, setCustomItemSize] = useState('');
    const [customItemUnit, setCustomItemUnit] = useState('');
    const [customItemImage, setCustomItemImage] = useState('');

    // Enterprise Attributes State (6-Layer Model)
    const [customAttributes, setCustomAttributes] = useState(createDefaultCustomAttributes);

    // Quantity, Cost & Retail Price
    const [currentQty, setCurrentQty] = useState(0);
    const [currentCost, setCurrentCost] = useState(0);
    const [currentRetailPrice, setCurrentRetailPrice] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedCatalogProduct = productType === 'catalog' ? products.find(p => p.id === currentProductToAdd) : null;
    const activePackaging = selectedCatalogProduct?.customAttributes?.packaging || (selectedCatalogProduct as any)?.custom_attributes?.packaging || customAttributes.packaging;
    const packagingLevel = activePackaging?.packagingLevel || (parseInt(activePackaging?.caseSize) > 0 ? 'two_tier' : parseInt(activePackaging?.packQty) > 1 ? 'case' : 'single');
    const caseSize = packagingLevel === 'single' ? 0 : (parseInt(activePackaging?.caseSize) || 0);
    const packQty = packagingLevel === 'single' ? 1 : (parseInt(activePackaging?.packQty) || selectedCatalogProduct?.packQuantity || (selectedCatalogProduct as any)?.pack_quantity || 1);
    const pkgType = activePackaging?.packageType || '';
    const hasCases = caseSize >= 1 && caseSize > 0;
    const hasPacks = packQty > 1 && !hasCases;
    const orderUnitName = pkgType || (hasCases ? 'Case' : hasPacks ? 'Pack' : 'Unit');
    const unitsPerOrderUnit = hasCases ? caseSize * packQty : hasPacks ? packQty : 1;
    const totalUnits = currentQty * unitsPerOrderUnit;
    const showConversion = currentQty > 0 && unitsPerOrderUnit > 1;
    const unitSuffix = hasCases
        ? `(${pkgType || 'cases'} — ${caseSize} pack${caseSize !== 1 ? 's' : ''} × ${packQty} unit${packQty !== 1 ? 's' : ''})`
        : hasPacks
        ? `(${pkgType ? `${pkgType}s of ${packQty}` : `packs of ${packQty}`})`
        : '';

    // Populate form when editing
    useEffect(() => {
        if (editingItem) {
            setProductType(editingItem.identityType === 'known' ? 'catalog' : 'new');
            setCurrentProductToAdd(editingItem.productId || '');
            setCurrentQty(editingItem.quantity);
            setCurrentCost(editingItem.unitCost);
            setCurrentRetailPrice(editingItem.retailPrice || 0);

            if (editingItem.productId && editingItem.identityType === 'known') {
                const existing = products.find(p => p.id === editingItem.productId);
                if (existing) setSearchTerm(existing.name);
            }

            let cleanName = editingItem.productName;
            const brand = editingItem.brand || '';
            if (brand) {
                const regex = new RegExp(`^${brand}\\s*`, 'i');
                if (regex.test(cleanName)) {
                    cleanName = cleanName.replace(regex, '').trim();
                }
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
        } else {
            resetForm();
        }
    }, [editingItem]);
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
        setCustomAttributes((prev: any) => ({
            ...prev,
            identity: { ...prev.identity, subcategory: smart.subcategory || '', variant: smart.variant || '', ...(pAttrs.identity || {}) },
            physical: { ...prev.physical, form: smart.physicalForm || '', ...(pAttrs.physical || {}) },
            packaging: { ...prev.packaging, material: smart.packagingMaterial || '', packageType: smart.packageType || '', packQty: String(smart.packQty || 1), ...(pAttrs.packaging || {}) },
            storage: { ...prev.storage, type: smart.storageType, isPerishable: smart.isPerishable, isFragile: smart.isFragile, inboundQcDirective: smart.inboundQcDirective || '', ...(pAttrs.storage || {}) },
            commercial: { ...prev.commercial, isHalal: smart.isHalal, requiresBatchTracking: smart.requiresBatch, requiresSerialTracking: smart.requiresSerial, ...(pAttrs.commercial || {}) },
            descriptive: { ...prev.descriptive, ...(pAttrs.descriptive || {}) },
            categorySpecific: { ...prev.categorySpecific, ...(pAttrs.categorySpecific || {}) },
        }));
    };

    const handleAddItem = async () => {
        setErrors({});
        const newErrors: Record<string, string> = {};

        // Common validation
        if (!currentQty || currentQty <= 0) newErrors.qty = "Required";
        if (currentCost < 0) newErrors.cost = "Invalid";
        if (currentRetailPrice < 0) newErrors.retail = "Invalid";

        let productId = '';
        let productName = '';
        let itemSku = '';
        let finalBrand = customItemBrand || undefined;
        let finalSize = customItemSize || undefined;
        let finalUnit = customItemUnit || undefined;
        let finalCategory = selectedMainCategory || undefined;
        let finalImage = customItemImage || undefined;
        let finalCustomAttributes = customAttributes;
        let finalPackQty = parseInt(customAttributes.packaging.packQty) || 1;
        let finalDescription: string | undefined = undefined;

        if (productType === 'new') {
            if (!customItemBrand?.trim()) newErrors.brand = "Required";
            if (!customItemName?.trim()) newErrors.name = "Required";
            if (isConsumableCategory(selectedMainCategory) && !customItemSize?.trim()) {
                newErrors.size = "Required";
            }
            if (!customItemUnit) newErrors.unit = "Required";
            if (!selectedMainCategory) newErrors.category = "Required";

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                showToast("Please fill in all required fields (marked in red).", 'error');
                return;
            }

            const nameParts: string[] = [];
            const brandTrimmed = customItemBrand?.trim() || '';
            if (brandTrimmed) nameParts.push(brandTrimmed);

            let cleanCustomName = customItemName?.trim() || '';
            if (brandTrimmed) {
                const regex = new RegExp(`^${brandTrimmed}\\s*`, 'i');
                if (regex.test(cleanCustomName)) {
                    cleanCustomName = cleanCustomName.replace(regex, '').trim();
                }
            }
            if (cleanCustomName) nameParts.push(cleanCustomName);
            productName = nameParts.join(' ');

            productId = editingItem?.productId || `CUSTOM-${Date.now()}`;
            itemSku = editingItem?.sku || await generateSequentialSKU(selectedMainCategory || 'General', products, country);

            const catSpecs = getPOItemCategorySpecsSummary({
                category: selectedMainCategory,
                subcategory: customAttributes.identity?.subcategory,
                customAttributes
            });

            const descParts = [
                customAttributes.identity.variant ? `Variant: ${customAttributes.identity.variant}` : '',
                catSpecs.summaryText || '',
                customAttributes.physical.form ? `Form: ${customAttributes.physical.form}` : '',
                customAttributes.packaging.material ? `Pkg: ${customAttributes.packaging.material}` : '',
                customAttributes.storage.type !== 'Ambient' ? `Storage: ${customAttributes.storage.type}` : '',
                customAttributes.storage.isHazardous ? '[HAZARDOUS]' : '',
                customAttributes.storage.isFragile ? '[FRAGILE]' : '',
                customAttributes.commercial.isBundleEligible ? '[BUNDLE]' : '',
                customAttributes.descriptive.usage ? `Usage: ${customAttributes.descriptive.usage}` : '',
                customAttributes.descriptive.scent ? `Scent: ${customAttributes.descriptive.scent}` : '',
                customAttributes.descriptive.flavor ? `Flavor: ${customAttributes.descriptive.flavor}` : ''
            ].filter(Boolean);
            finalDescription = descParts.join(' | ') || undefined;
        } else {
            if (!currentProductToAdd) newErrors.search = "Please select a product";
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                showToast("Please select a product and enter quantity/cost.", 'error');
                return;
            }

            const product = products.find(p => p.id === currentProductToAdd);
            if (!product) {
                showToast("Selected product not found. Please search again.", 'error');
                return;
            }
            productId = product.id;
            productName = product.name;
            itemSku = product.sku || await generateSequentialSKU(product.category || 'General', products, country);
            finalBrand = product.brand || undefined;
            finalSize = product.size || undefined;
            finalUnit = product.unit || undefined;
            finalCategory = product.category || undefined;
            finalImage = product.image || undefined;
            const baseAttrs = product.customAttributes || (product as Record<string, any>)['custom_attributes'] || {};
            finalCustomAttributes = {
                ...baseAttrs,
                ...customAttributes,
                identity: { ...(baseAttrs.identity || {}), ...(customAttributes.identity || {}) },
                physical: { ...(baseAttrs.physical || {}), ...(customAttributes.physical || {}) },
                packaging: { ...(baseAttrs.packaging || {}), ...(customAttributes.packaging || {}) },
                storage: { ...(baseAttrs.storage || {}), ...(customAttributes.storage || {}) },
                commercial: { ...(baseAttrs.commercial || {}), ...(customAttributes.commercial || {}) },
                descriptive: { ...(baseAttrs.descriptive || {}), ...(customAttributes.descriptive || {}) },
                categorySpecific: { ...(baseAttrs.categorySpecific || {}), ...(customAttributes.categorySpecific || {}) },
            };
            finalPackQty = product.packQuantity || (product as Record<string, any>)['pack_quantity'] || parseInt(finalCustomAttributes?.packaging?.packQty) || 1;
            const catSpecs = getPOItemCategorySpecsSummary({
                category: finalCategory || '',
                subcategory: finalCustomAttributes.identity?.subcategory,
                customAttributes: finalCustomAttributes
            });
            finalDescription = product.description || catSpecs.summaryText || undefined;
        }

        const isSingleLevel = (finalCustomAttributes?.packaging?.packagingLevel === 'single') || (finalPackQty <= 1 && (!caseSize || caseSize <= 0));
        const resolvedPackageType = finalCustomAttributes?.packaging?.packageType || pkgType || (isSingleLevel ? 'Retail Box' : undefined);

        const newItem: POItem = {
            productId,
            productName,
            sku: itemSku,
            quantity: currentQty,
            unitCost: currentCost,
            retailPrice: currentRetailPrice,
            totalCost: currentCost * currentQty,
            image: finalImage,
            brand: finalBrand,
            size: finalSize,
            unit: finalUnit,
            category: finalCategory,
            identityType: productType === 'catalog' ? 'known' : 'new',
            packQuantity: isSingleLevel ? 1 : finalPackQty,
            packageType: resolvedPackageType,
            caseSize: isSingleLevel ? undefined : (caseSize || parseInt(finalCustomAttributes?.packaging?.caseSize) || undefined),
            description: finalDescription,
            customAttributes: {
                ...finalCustomAttributes,
                packaging: {
                    ...finalCustomAttributes?.packaging,
                    packageType: resolvedPackageType,
                    packagingLevel: isSingleLevel ? 'single' : (caseSize > 0 ? 'two_tier' : finalPackQty > 1 ? 'case' : 'single'),
                    packQty: isSingleLevel ? '1' : String(finalPackQty)
                }
            }
        };

        if (editingItem) {
            onUpdate(newItem);
        } else {
            onAdd(newItem);
        }
        resetForm();
    };

    /* ═══════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════ */

    return (
        <div id="po-item-form-container" className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <h3 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Plus size={15} />
                </div>
                {editingItem ? 'Edit Product Item' : 'Add Products'}
            </h3>

            {/* ─── Type Toggle ───────────────────────────── */}
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
                    onClick={() => setProductType('new')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${productType === 'new' ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]'}`}
                >
                    CUSTOM ITEM
                </button>
            </div>

            {/* ─── Preview Banner ────────────────────────── */}
            {(productType === 'new' || Boolean(selectedCatalogProduct)) && (
                <div className="mb-6 relative z-10">
                    <ItemPreviewCard
                        name={productType === 'catalog' && selectedCatalogProduct ? selectedCatalogProduct.name : customItemName}
                        brand={customItemBrand || selectedCatalogProduct?.brand || ''}
                        size={customItemSize || selectedCatalogProduct?.size || ''}
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

            {/* ─── Form Body ────────────────────────────── */}
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
                    /* ═══ CUSTOM: STRUCTURED SPEC & PRICING ═════ */
                    <div className="space-y-6">
                        {/* 1. Master Product Specs */}
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

                        {/* 2. Order Quantity & Wholesale Cost */}
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

                        {/* 3. Selling & Retail Panel (Margin % & Shelf Price) */}
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

                {/* ─── ACTION BUTTON ─── */}
                <POItemFormActions
                    editingItem={editingItem}
                    onCancelEdit={onCancelEdit}
                    onSubmit={handleAddItem}
                />
            </div>
        </div>
    );
};
