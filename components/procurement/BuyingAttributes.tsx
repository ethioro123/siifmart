import type { POItemFormDraft } from './POItemForm';
import React, { useState, useEffect } from 'react';
import { Tag, ChevronDown, ChevronUp, Lock, Package, Thermometer } from 'lucide-react';
import { PRODUCT_CATEGORIES } from './utils';
import { CategorySpecificAttributes } from './CategorySpecificAttributes';
import { PackagingHierarchySection } from './PackagingHierarchySection';
import { DynamicPhysicalAttributesSection } from './DynamicPhysicalAttributesSection';
import { DynamicStorageHandlingSection } from './DynamicStorageHandlingSection';
import { getCategorySpecGroup } from './categoryAttributes';
import { getCategoryStorageDefaults, getCategoryPackagingDefaults } from './categoryLogistics';

export interface BuyingAttributesProps {
    customItemBrand: string;
    setCustomItemBrand: (v: string) => void;
    customItemName: string;
    setCustomItemName: (v: string) => void;
    selectedMainCategory: string;
    setSelectedMainCategory: (v: string) => void;
    customItemSize: string;
    setCustomItemSize: (v: string) => void;
    customAttributes: any;
    setCustomAttributes: React.Dispatch<React.SetStateAction<any>>;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const BuyingAttributes: React.FC<BuyingAttributesProps> = ({
    customItemBrand, setCustomItemBrand,
    customItemName, setCustomItemName,
    selectedMainCategory, setSelectedMainCategory,
    customItemSize, setCustomItemSize,
    customAttributes, setCustomAttributes,
    errors, setErrors,
}) => {
    // Physical net content unit (g, kg, ml, L, oz, lb, pcs)
    const sizeType = customAttributes.physical?.sizeType || '';

    // Packaging hierarchy level: 'single' (1:1 Each) | 'case' (Wholesale Case) | 'bale' (Bale/Bundle) | 'two_tier' (Inner Pack + Case)
    const packagingLevel = customAttributes.packaging?.packagingLevel ||
        ((parseInt(customAttributes.packaging?.caseSize) > 0) ? 'two_tier' :
        (customAttributes.packaging?.packageType === 'Bale') ? 'bale' :
        (parseInt(customAttributes.packaging?.packQty) > 1) ? 'case' : 'single');

    const setPackagingLevel = (level: 'single' | 'case' | 'bale' | 'two_tier') => {
        setCustomAttributes((p: any) => {
            const nextPkg = { ...p.packaging, packagingLevel: level };
            if (level === 'single') {
                nextPkg.packQty = '1';
                nextPkg.caseSize = '';
                if (!nextPkg.packageType || nextPkg.packageType === 'Bale' || nextPkg.packageType === 'Case') {
                    nextPkg.packageType = 'Retail Box';
                }
            } else if (level === 'case') {
                nextPkg.packQty = (!p.packaging.packQty || p.packaging.packQty === '1') ? '' : p.packaging.packQty;
                nextPkg.caseSize = '';
                nextPkg.packageType = nextPkg.packageType || 'Case';
            } else if (level === 'bale') {
                nextPkg.packQty = (!p.packaging.packQty || p.packaging.packQty === '1') ? '' : p.packaging.packQty;
                nextPkg.caseSize = '';
                nextPkg.packageType = 'Bale';
            } else if (level === 'two_tier') {
                nextPkg.packQty = (!p.packaging.packQty || p.packaging.packQty === '1') ? '' : p.packaging.packQty;
                nextPkg.caseSize = (!p.packaging.caseSize || p.packaging.caseSize === '0') ? '' : p.packaging.caseSize;
                nextPkg.packageType = nextPkg.packageType || 'Master Case';
            }
            return { ...p, packaging: nextPkg };
        });
    };

    const setSizeType = (type: string) => {
        setCustomAttributes((p: any) => ({
            ...p,
            physical: { ...p.physical, sizeType: type },
            packaging: {
                ...p.packaging,
                unitSize: customItemSize && type ? `${customItemSize}${type}` : p.packaging?.unitSize
            }
        }));
    };

    const specGroup = getCategorySpecGroup(selectedMainCategory, customAttributes.identity?.subcategory);
    const storageDefaults = getCategoryStorageDefaults(specGroup.id);

    const handleNetWeightChange = (val: string) => {
        setCustomItemSize(val);
        const fallbackSizeType = sizeType || (specGroup.id === 'beverages' ? 'ml' : 'g');
        setCustomAttributes((p: any) => {
            const effSizeType = p.physical?.sizeType || (val ? fallbackSizeType : '');
            return {
                ...p,
                physical: { ...p.physical, netWeight: val, sizeType: effSizeType },
                packaging: {
                    ...p.packaging,
                    unitSize: val && effSizeType ? `${val}${effSizeType}` : p.packaging?.unitSize
                }
            };
        });
        if (errors.size) setErrors(p => ({ ...p, size: '' }));
    };

    const handleCategoryChange = (newCategory: string) => {
        setSelectedMainCategory(newCategory);
        if (errors.category) setErrors(p => ({ ...p, category: '' }));
        if (!newCategory) return;

        const nextGroup = getCategorySpecGroup(newCategory, customAttributes.identity?.subcategory);
        const nextStorageDefaults = getCategoryStorageDefaults(nextGroup.id);
        const nextPkgDefaults = getCategoryPackagingDefaults(nextGroup.id);

        setCustomAttributes((p: any) => ({
            ...p,
            packaging: {
                ...p.packaging,
                material: p.packaging?.material || nextPkgDefaults.defaultMaterial || 'Paper / Cardboard',
                packageType: p.packaging?.packageType || nextPkgDefaults.containers[0] || '',
            },
            storage: {
                ...p.storage,
                requirementsConfirmed: false,
                type: nextStorageDefaults.defaultStorage,
                isPerishable: nextStorageDefaults.defaultPerishable,
                shelfLifeDays: nextStorageDefaults.defaultShelfLife || '',
                inboundQcDirective: p.storage?.inboundQcDirective || nextStorageDefaults.inboundDirectives[0] || '',
            }
        }));
    };

    const packQtyNum = Number(customAttributes.packaging?.packQty) || 0;
    const caseSizeNum = Number(customAttributes.packaging?.caseSize) || 0;
    const multiplier = packagingLevel === 'two_tier' ? (packQtyNum * caseSizeNum) : packagingLevel === 'single' ? 1 : packQtyNum;

    const [showStorageSection, setShowStorageSection] = useState(false);

    useEffect(() => {
        if (storageDefaults.defaultPerishable || errors.shelfLifeDays) {
            setShowStorageSection(true);
        }
    }, [storageDefaults.defaultPerishable, errors.shelfLifeDays]);

    return (
        <div className="space-y-4">
            {/* ─── ENTERPRISE HEADER ──────────────────────────── */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border-subtle)]">
                <span className="text-[10px] text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={13} className="text-[var(--theme-accent)]" /> Product Master & Item Specifications
                </span>
                <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={11} className="shrink-0 text-[var(--theme-accent)]" /> Product specifications
                </span>
            </div>

            <div className="rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-5 space-y-5 shadow-sm">
                
                {/* ── 1. ITEM IDENTITY & MERCHANDISING HIERARCHY ── */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        <Tag size={12} className="text-blue-500" />
                        <span>1. Item Identification & Merchandising</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3.5">
                        <div className="col-span-full sm:col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Brand { !customAttributes.identity?.unbranded && <span className="text-rose-500">*</span> }</label>
                            <input
                                type="text"
                                className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.brand ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold`}
                                placeholder="e.g. Amazon, Samsung, Brookside"
                                aria-label="Brand"
                                disabled={Boolean(customAttributes.identity?.unbranded)}
                                value={customItemBrand}
                                onChange={e => { setCustomItemBrand(e.target.value); setCustomAttributes((previous: POItemFormDraft['customAttributes']) => ({ ...previous, storage: { ...previous.storage, requirementsConfirmed: false } })); if (errors.brand) setErrors(p => ({ ...p, brand: '' })); }}
                            />
                            <label className="flex min-h-11 items-center gap-2 text-xs text-[var(--theme-text-secondary)]"><input type="checkbox" checked={Boolean(customAttributes.identity?.unbranded)} onChange={event => {
                                const unbranded = event.target.checked;
                                if (unbranded) setCustomItemBrand('');
                                setCustomAttributes((previous: POItemFormDraft['customAttributes']) => ({ ...previous, identity: { ...previous.identity, unbranded } }));
                                setErrors(previous => ({ ...previous, brand: '' }));
                            }} />Unbranded product</label>
                            {errors.brand && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.brand}</span>}
                        </div>
                        <div className="col-span-full sm:col-span-4 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Product Name / Consumer Description <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.name ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-semibold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70`}
                                aria-label="Product name"
                                placeholder="e.g. Kindle Paperwhite 16GB, Basmati Rice 5kg"
                                value={customItemName}
                                onChange={e => { setCustomItemName(e.target.value); setCustomAttributes((previous: POItemFormDraft['customAttributes']) => ({ ...previous, storage: { ...previous.storage, requirementsConfirmed: false } })); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
                            />
                            {errors.name && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.name}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3.5">
                        <div className="col-span-full sm:col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Category <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <select
                                    title="Category"
                                    className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.category ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer`}
                                    value={selectedMainCategory}
                                    onChange={e => handleCategoryChange(e.target.value)}
                                >
                                    <option value="" className="text-[var(--theme-text-secondary)] bg-[var(--theme-bg-panel)]">Select Category...</option>
                                    {Object.entries(PRODUCT_CATEGORIES).map(([group, items]) => (
                                        <optgroup key={group} label={group} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                                            {(items as string[]).map(c => <option key={c} value={c} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{c}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                            {errors.category && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.category}</span>}
                        </div>
                        <div className="col-span-full sm:col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Subcategory</label>
                            <input
                                type="text"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold"
                                placeholder="e.g. E-Readers, Groceries"
                                value={customAttributes.identity?.subcategory || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, identity: { ...p.identity, subcategory: e.target.value } }))}
                            />
                        </div>
                        <div className="col-span-full sm:col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Variant / Style</label>
                            <input
                                type="text"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold"
                                placeholder="e.g. Black, 16GB"
                                value={customAttributes.identity?.variant || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, identity: { ...p.identity, variant: e.target.value } }))}
                            />
                        </div>
                    </div>
                </div>

                <details className="rounded-xl border border-[var(--theme-border)] p-3" open={Boolean(Object.keys(errors).some(key => key.startsWith('category')))}>
                    <summary className="min-h-11 cursor-pointer text-sm font-medium text-[var(--theme-text-primary)]">Category-specific details</summary>
                {/* ── 2. CATEGORY-SPECIFIC PRODUCT ATTRIBUTES ── */}
                <CategorySpecificAttributes
                    category={selectedMainCategory}
                    subcategory={customAttributes.identity?.subcategory}
                    customAttributes={customAttributes}
                    setCustomAttributes={setCustomAttributes}
                    errors={errors}
                    setErrors={setErrors}
                />

                </details>
                {/* ── 3. PHYSICAL PRODUCT SPECIFICATIONS (DYNAMIC PER CATEGORY) ── */}
                <DynamicPhysicalAttributesSection
                    selectedMainCategory={selectedMainCategory}
                    customItemSize={customItemSize}
                    setCustomItemSize={setCustomItemSize}
                    sizeType={sizeType}
                    setSizeType={setSizeType}
                    customAttributes={customAttributes}
                    setCustomAttributes={setCustomAttributes}
                    errors={errors}
                    setErrors={setErrors}
                    handleNetWeightChange={handleNetWeightChange}
                />

                {/* ── 4. SUPPLY CHAIN PACKAGING HIERARCHY (GS1 STANDARD) ── */}
                <PackagingHierarchySection
                    packagingLevel={packagingLevel}
                    setPackagingLevel={setPackagingLevel}
                    customAttributes={customAttributes}
                    setCustomAttributes={setCustomAttributes}
                    multiplier={multiplier}
                    selectedMainCategory={selectedMainCategory}
                    errors={errors}
                    setErrors={setErrors}
                />

                {/* ── 5. STORAGE, INBOUND QC & HANDLING COMPLIANCE (COLLAPSIBLE) ── */}
                <div className="pt-2 border-t border-[var(--theme-border-subtle)]">
                    <button
                        type="button"
                        onClick={() => setShowStorageSection(prev => !prev)}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-subtle)]/80 border border-[var(--theme-border)] text-left transition-all cursor-pointer"
                    >
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                            <Thermometer size={12} className="text-purple-500" />
                            <span>5. Storage, Inbound QC & Handling Directives</span>
                            {storageDefaults.defaultPerishable && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold">
                                    Required for Perishables
                                </span>
                            )}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-text-secondary)]">
                            {showStorageSection ? 'Hide' : 'Configure'}
                            {showStorageSection ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </span>
                    </button>
                    {showStorageSection && (
                        <div className="mt-2">
                            <DynamicStorageHandlingSection
                                selectedMainCategory={selectedMainCategory}
                                customAttributes={customAttributes}
                                setCustomAttributes={setCustomAttributes}
                                errors={errors}
                                setErrors={setErrors}
                            />
                        </div>
                    )}
                </div>
                <label className="flex min-h-11 items-start gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3 text-sm text-[var(--theme-text-primary)]">
                    <input data-po-field="storageConfirmation" type="checkbox" className="mt-1" checked={Boolean(customAttributes.storage?.requirementsConfirmed)} onChange={event => {
                        const requirementsConfirmed = event.target.checked;
                        setCustomAttributes((previous: POItemFormDraft['customAttributes']) => ({ ...previous, storage: { ...previous.storage, requirementsConfirmed } }));
                        setErrors(previous => ({ ...previous, storageConfirmation: '' }));
                    }} />I have checked the product’s storage, handling and shelf-life requirements against its label or supplier specification.
                </label>
                {errors.storageConfirmation && <p role="alert" className="text-sm text-[var(--theme-text-primary)]">{errors.storageConfirmation}</p>}
            </div>
        </div>
    );
};
