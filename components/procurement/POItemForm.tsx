import React, { useState, useEffect } from 'react';
import { POItem, Product } from '../../types';
import { Plus, Package, Save, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { generateSequentialSKU } from '../../utils/skuGenerator';
import { getSellUnit } from '../../utils/units';
import { ItemPreviewCard } from './ItemPreviewCard';
import { BuyingAttributes } from './BuyingAttributes';
import { SellingAttributes } from './SellingAttributes';
import { CatalogSearch } from './CatalogSearch';

interface POItemFormProps {
    products: Product[];
    onAdd: (item: POItem) => void;
    onUpdate: (item: POItem) => void;
    onCancelEdit: () => void;
    editingItem: POItem | null;
}

export const POItemForm: React.FC<POItemFormProps> = ({
    products,
    onAdd,
    onUpdate,
    onCancelEdit,
    editingItem
}) => {
    const { showToast } = useStore();

    // Form State
    const [productType, setProductType] = useState<'catalog' | 'new'>('catalog');
    const [currentProductToAdd, setCurrentProductToAdd] = useState('');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Filter products for catalog search — handled inside CatalogSearch component

    // Custom Item Fields
    const [customItemName, setCustomItemName] = useState('');
    const [customItemBrand, setCustomItemBrand] = useState('');
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [customItemSize, setCustomItemSize] = useState('');
    const [customItemUnit, setCustomItemUnit] = useState('');
    const [customItemImage, setCustomItemImage] = useState('');

    // Enterprise Attributes State (6-Layer Model)
    const [customAttributes, setCustomAttributes] = useState({
        identity: { variant: '', type: '', subcategory: '' },
        physical: { netWeight: '', grossWeight: '', volume: '', unit: '', sizeType: '', dims: '', color: '', form: '', texture: '' },
        packaging: { unitSize: '', packQty: '', caseSize: '', packagingLevel: '', material: '', isBreakable: false, packageType: '' },
        storage: { type: 'Ambient', isPerishable: false, stackLimit: '', isHazardous: false, isFragile: false, isLightSensitive: false },
        commercial: { isWeighted: false, sellBy: 'Unit', priceType: 'Fixed', isBundleEligible: false, isReturnable: true },
        descriptive: { usage: '', audience: '', ingredients: '', keyFeatures: '', scent: '', flavor: '', strength: '' }
    });

    // Buying: Order Qty + Unit Cost
    const [currentQty, setCurrentQty] = useState(0);
    const [currentCost, setCurrentCost] = useState(0);
    // Selling: Retail Price
    const [currentRetailPrice, setCurrentRetailPrice] = useState(0);

    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});

    const caseSize = parseInt(customAttributes.packaging?.caseSize) || 0;
    const packQty = parseInt(customAttributes.packaging?.packQty) || 1;
    // hasCases: caseSize >= 1 means the order unit IS a case (even 1 pack/case is still a case-level order)
    const hasCases = caseSize >= 1 && caseSize > 0;
    // hasPacks: only when there's no case layer — ordering loose packs directly
    const hasPacks = packQty > 1 && !hasCases;
    // Build a descriptive suffix so the user always knows exactly what they're ordering
    const unitSuffix = hasCases
        ? `(cases — ${caseSize} pack${caseSize !== 1 ? 's' : ''} × ${packQty} unit${packQty !== 1 ? 's' : ''})`
        : hasPacks
        ? `(packs of ${packQty})`
        : '';
    const unitsPerOrderUnit = hasCases ? caseSize * packQty : hasPacks ? packQty : 1;
    const totalUnits = currentQty * unitsPerOrderUnit;
    const showConversion = currentQty > 0 && unitsPerOrderUnit > 1;

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
                }));
            } else {
                setCustomAttributes({
                    identity: { variant: '', type: '', subcategory: '' },
                    physical: { netWeight: '', grossWeight: '', volume: '', unit: '', sizeType: '', dims: '', color: '', form: '', texture: '' },
                    packaging: { unitSize: '', packQty: '', caseSize: '', packagingLevel: '', material: '', isBreakable: false, packageType: '' },
                    storage: { type: 'Ambient', isPerishable: false, stackLimit: '', isHazardous: false, isFragile: false, isLightSensitive: false },
                    commercial: { isWeighted: false, sellBy: 'Unit', priceType: 'Fixed', isBundleEligible: false, isReturnable: true },
                    descriptive: { usage: '', audience: '', ingredients: '', keyFeatures: '', scent: '', flavor: '', strength: '' }
                });
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
        setCustomAttributes({
            identity: { variant: '', type: '', subcategory: '' },
            physical: { netWeight: '', grossWeight: '', volume: '', unit: '', sizeType: '', dims: '', color: '', form: '', texture: '' },
            packaging: { unitSize: '', packQty: '', caseSize: '', packagingLevel: '', material: '', isBreakable: false, packageType: '' },
            storage: { type: 'Ambient', isPerishable: false, stackLimit: '', isHazardous: false, isFragile: false, isLightSensitive: false },
            commercial: { isWeighted: false, sellBy: 'Unit', priceType: 'Fixed', isBundleEligible: false, isReturnable: true },
            descriptive: { usage: '', audience: '', ingredients: '', keyFeatures: '', scent: '', flavor: '', strength: '' }
        });
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
            if (!customItemSize?.trim()) newErrors.size = "Required";
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
            itemSku = editingItem?.sku || await generateSequentialSKU(selectedMainCategory || 'General');

            const descParts = [
                customAttributes.identity.variant ? `Variant: ${customAttributes.identity.variant}` : '',
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
            itemSku = product.sku || await generateSequentialSKU(product.category || 'General');
            finalBrand = product.brand || undefined;
            finalSize = product.size || undefined;
            finalUnit = product.unit || undefined;
            finalCategory = product.category || undefined;
            finalImage = product.image || undefined;
            finalCustomAttributes = product.customAttributes || (product as any).custom_attributes || customAttributes;
            finalPackQty = product.packQuantity || (product as any).pack_quantity || parseInt(finalCustomAttributes?.packaging?.packQty) || 1;
            finalDescription = product.description || undefined;
        }

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
            packQuantity: finalPackQty,
            description: finalDescription,
            customAttributes: finalCustomAttributes
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
        <div id="po-item-form-container" className="glass-panel p-5 relative overflow-hidden group shadow-sm dark:shadow-none">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#2C5E3B] to-[#1E3B24] dark:from-[#A9CBA2] dark:to-[#7A9E83] opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Package size={80} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
            </div>

            <h3 className="text-sm font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 relative z-10 transition-colors">
                <div className="p-1.5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 rounded-lg">
                    <Plus size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                </div>
                {editingItem ? 'EDIT PRODUCT' : 'ADD PRODUCTS'}
            </h3>

            {/* ─── Type Toggle ───────────────────────────── */}
            <div className="flex gap-6 mb-6 border-b border-gray-100 dark:border-white/5 pb-4 relative z-10">
                <label className="flex items-center cursor-pointer gap-3 group/toggle">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${productType === 'catalog' ? 'border-[#2C5E3B] dark:border-[#A9CBA2]' : 'border-gray-300 dark:border-gray-600'}`}>
                        {productType === 'catalog' && <div className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2]" />}
                    </div>
                    <input type="radio" checked={productType === 'catalog'} onChange={() => setProductType('catalog')} className="hidden" />
                    <span className={`text-xs font-black tracking-widest ${productType === 'catalog' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>CATALOG</span>
                </label>
                <label className="flex items-center cursor-pointer gap-3 group/toggle">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${productType === 'new' ? 'border-[#2C5E3B] dark:border-[#A9CBA2]' : 'border-gray-300 dark:border-gray-600'}`}>
                        {productType === 'new' && <div className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2]" />}
                    </div>
                    <input type="radio" checked={productType === 'new'} onChange={() => setProductType('new')} className="hidden" />
                    <span className={`text-xs font-black tracking-widest ${productType === 'new' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>CUSTOM</span>
                </label>
            </div>

            {/* ─── Preview Banner ────────────────────────── */}
            {productType === 'new' && (
                <div className="mb-6 relative z-10">
                    <ItemPreviewCard
                        name={customItemName}
                        brand={customItemBrand}
                        size={customItemSize}
                        unit={customItemUnit}
                        category={selectedMainCategory}
                        description=""
                        price={currentCost}
                        image={customItemImage}
                        customAttributes={customAttributes}
                    />
                </div>
            )}

            {/* ─── Form Body ────────────────────────────── */}
            <div className="relative z-10 space-y-6">
                {productType === 'catalog' ? (
                    /* ═══ CATALOG SEARCH ═════════════════════ */
                    <CatalogSearch
                        products={products}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        isSearchOpen={isSearchOpen}
                        setIsSearchOpen={setIsSearchOpen}
                        currentProductToAdd={currentProductToAdd}
                        setCurrentProductToAdd={setCurrentProductToAdd}
                        setCurrentCost={setCurrentCost}
                        setCurrentRetailPrice={setCurrentRetailPrice}
                        setCustomItemUnit={setCustomItemUnit}
                        errors={errors}
                        setErrors={setErrors}
                    />
                ) : (
                    /* ═══ CUSTOM: TWO SIDE-BY-SIDE PANELS ═════ */
                    <div className="space-y-6">
                        {/* ─── BUYING PANEL (Blue) ────────────── */}
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

                        {/* ─── SELLING PANEL (Green) ──────────── */}
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
                            errors={errors}
                            setErrors={setErrors}
                        />
                    </div>
                )}

                {/* ─── ORDER ROW (Buying: Qty + Cost) + Submit ── */}
                <div className="grid grid-cols-12 gap-4 relative z-10 pt-4 border-t border-gray-100 dark:border-white/5">
                    <div className="col-span-4 space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 block">
                            Order Qty{' '}
                            {unitSuffix
                                ? <span className="text-[#2C5E3B]/70 dark:text-[#A9CBA2]/70 normal-case font-bold text-[9px]">{unitSuffix}</span>
                                : null
                            }{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="1"
                            min="1"
                            className={`w-full bg-white dark:bg-black/40 border ${errors.qty ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white font-mono focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 text-center font-black shadow-sm`}
                            value={currentQty || ''}
                            onChange={e => { const val = parseInt(e.target.value) || 0; setCurrentQty(val); if (errors.qty) setErrors({ ...errors, qty: '' }); }}
                            placeholder="0"
                        />
                        {showConversion && (
                            <span className="text-[9px] text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60 block text-center">
                                = {totalUnits.toLocaleString()} sellable units
                            </span>
                        )}
                        {errors.qty && <span className="text-[9px] text-red-500 block text-center">{errors.qty}</span>}
                    </div>
                    <div className="col-span-4 space-y-1">
                        {/* Label clarifies WHAT the cost refers to: per case, per pack, or per unit */}
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 block">
                            Cost{hasCases ? ' / Case' : hasPacks ? ' / Pack' : ' / Unit'}{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            className={`w-full bg-white dark:bg-black/40 border ${errors.cost ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white font-mono focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 text-center font-black shadow-sm`}
                            value={currentCost || ''}
                            onChange={e => { setCurrentCost(parseFloat(e.target.value) || 0); if (errors.cost) setErrors({ ...errors, cost: '' }); }}
                            placeholder="0.00"
                        />
                        {/* Show cost per sellable unit when ordering in cases/packs */}
                        {currentCost > 0 && unitsPerOrderUnit > 1 && (
                            <span className="text-[9px] text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60 block text-center">
                                = {(currentCost / unitsPerOrderUnit).toFixed(2)} / unit
                            </span>
                        )}
                        {errors.cost && <span className="text-[9px] text-red-500 block text-center">{errors.cost}</span>}
                    </div>
                    {/* Margin indicator */}
                    {productType !== 'new' && (
                        <div className="col-span-4 space-y-1 relative">
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 block">
                                Retail{customItemUnit && getSellUnit(customItemUnit).category !== 'count' ? ` /${getSellUnit(customItemUnit).shortLabel}` : ''} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                {(() => {
                                    // Use cost-per-sell-unit for margin calc, not raw currentCost (which is per case/pack)
                                    const costPerUnit = unitsPerOrderUnit > 1
                                        ? currentCost / unitsPerOrderUnit
                                        : currentCost;
                                    if (!currentRetailPrice || !costPerUnit) return null;
                                    const marginPct = ((currentRetailPrice - costPerUnit) / currentRetailPrice) * 100;
                                    const badgeClass = marginPct >= 40
                                        ? 'bg-green-500/20 text-green-500 dark:text-green-400 border border-green-500/30'
                                        : marginPct >= 20
                                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                        : 'bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30';
                                    return (
                                        <div className={`absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
                                            {parseFloat(marginPct.toFixed(2))}%
                                        </div>
                                    );
                                })()}
                                <input
                                    type="number"
                                    className={`w-full bg-white dark:bg-black/40 border ${errors.retail ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-lg py-3 text-sm text-gray-900 dark:text-white font-mono focus:border-green-500/50 dark:focus:border-green-400/50 text-center font-black shadow-sm ${currentRetailPrice > 0 && currentCost > 0 ? 'pl-14 pr-2' : 'px-4'}`}
                                    value={currentRetailPrice || ''}
                                    onChange={e => { setCurrentRetailPrice(Math.round(parseFloat(e.target.value) || 0)); if (errors.retail) setErrors({ ...errors, retail: '' }); }}
                                    placeholder="0"
                                />
                            </div>
                            {errors.retail && <span className="text-[9px] text-red-500 block text-center">{errors.retail}</span>}
                        </div>
                    )}

                    {/* Submit */}
                    <div className={`${productType === 'new' ? 'col-span-4' : 'col-span-12'} flex items-end`}>
                        {editingItem ? (
                            <div className="flex w-full gap-2 font-black">
                                <button onClick={onCancelEdit} className="w-1/3 py-3 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-lg transition-all shadow-sm">Cancel</button>
                                <button onClick={handleAddItem} className="w-2/3 py-3 bg-[#2C5E3B] hover:bg-[#1E3B24] dark:bg-[#A9CBA2] dark:hover:bg-[#A9CBA2]/90 text-white dark:text-black font-black rounded-lg transition-all flex items-center justify-center gap-2 shadow-md dark:shadow-[0_4px_12px_rgba(169,203,162,0.15)]">
                                    <Save size={16} /> Update
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleAddItem} className="w-full py-3 bg-[#2C5E3B] hover:bg-[#1E3B24] dark:bg-[#A9CBA2] dark:hover:bg-[#A9CBA2]/90 text-white dark:text-black font-black rounded-lg transition-all flex items-center justify-center gap-2 shadow-md dark:shadow-[0_4px_12px_rgba(169,203,162,0.15)]">
                                <Plus size={16} /> Add Item
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
