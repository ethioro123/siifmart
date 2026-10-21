import React, { useState, useEffect } from 'react';
import { Tag, ChevronDown, ChevronUp, Lock, Package, Thermometer } from 'lucide-react';
import { PRODUCT_CATEGORIES } from './utils';
import { CategorySpecificAttributes } from './CategorySpecificAttributes';
import { PackagingHierarchySection } from './PackagingHierarchySection';
import { DynamicPhysicalAttributesSection } from './DynamicPhysicalAttributesSection';
import { DynamicStorageHandlingSection } from './DynamicStorageHandlingSection';
import { getCategorySpecGroup } from './categoryAttributes';
import { getCategoryStorageDefaults } from './categoryLogistics';

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
                nextPkg.packQty = (!p.packaging.packQty || p.packaging.packQty === '1') ? '24' : p.packaging.packQty;
                nextPkg.caseSize = '';
                nextPkg.packageType = nextPkg.packageType || 'Case';
            } else if (level === 'bale') {
                nextPkg.packQty = (!p.packaging.packQty || p.packaging.packQty === '1') ? '12' : p.packaging.packQty;
                nextPkg.caseSize = '';
                nextPkg.packageType = 'Bale';
            } else if (level === 'two_tier') {
                nextPkg.packQty = (!p.packaging.packQty || p.packaging.packQty === '1') ? '6' : p.packaging.packQty;
                nextPkg.caseSize = (!p.packaging.caseSize || p.packaging.caseSize === '0') ? '4' : p.packaging.caseSize;
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

    const handleNetWeightChange = (val: string) => {
        setCustomItemSize(val);
        setCustomAttributes((p: any) => ({
            ...p,
            physical: { ...p.physical, netWeight: val },
            packaging: {
                ...p.packaging,
                unitSize: val && sizeType ? `${val}${sizeType}` : p.packaging?.unitSize
            }
        }));
        if (errors.size) setErrors(p => ({ ...p, size: '' }));
    };

    const packQtyNum = parseInt(customAttributes.packaging?.packQty) || 1;
    const caseSizeNum = parseInt(customAttributes.packaging?.caseSize) || 0;
    const multiplier = packagingLevel === 'two_tier' ? (packQtyNum * (caseSizeNum || 1)) : packagingLevel === 'single' ? 1 : packQtyNum;

    const specGroup = getCategorySpecGroup(selectedMainCategory, customAttributes.identity?.subcategory);
    const storageDefaults = getCategoryStorageDefaults(specGroup.id);
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
                    <Lock size={11} className="shrink-0 text-[var(--theme-accent)]" /> Walmart Item 360 / GS1 Standard
                </span>
            </div>

            <div className="rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-5 space-y-5 shadow-sm">
                
                {/* ── 1. ITEM IDENTITY & MERCHANDISING HIERARCHY ── */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        <Tag size={12} className="text-blue-500" />
                        <span>1. Item Identification & Merchandising</span>
                    </div>

                    <div className="grid grid-cols-6 gap-3.5">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Brand <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.brand ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold`}
                                placeholder="e.g. Amazon, Samsung, Brookside"
                                value={customItemBrand}
                                onChange={e => { setCustomItemBrand(e.target.value); if (errors.brand) setErrors(p => ({ ...p, brand: '' })); }}
                            />
                            {errors.brand && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.brand}</span>}
                        </div>
                        <div className="col-span-4 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Product Name / Consumer Description <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.name ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-semibold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70`}
                                placeholder="e.g. Kindle Paperwhite 16GB, Basmati Rice 5kg"
                                value={customItemName}
                                onChange={e => { setCustomItemName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
                            />
                            {errors.name && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.name}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3.5">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Category <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <select
                                    title="Category"
                                    className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.category ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer`}
                                    value={selectedMainCategory}
                                    onChange={e => { setSelectedMainCategory(e.target.value); if (errors.category) setErrors(p => ({ ...p, category: '' })); }}
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
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Subcategory</label>
                            <input
                                type="text"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold"
                                placeholder="e.g. E-Readers, Groceries"
                                value={customAttributes.identity?.subcategory || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, identity: { ...p.identity, subcategory: e.target.value } }))}
                            />
                        </div>
                        <div className="col-span-2 space-y-1">
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

                {/* ── 2. CATEGORY-SPECIFIC PRODUCT ATTRIBUTES ── */}
                <CategorySpecificAttributes
                    category={selectedMainCategory}
                    subcategory={customAttributes.identity?.subcategory}
                    customAttributes={customAttributes}
                    setCustomAttributes={setCustomAttributes}
                    errors={errors}
                    setErrors={setErrors}
                />

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
            </div>
        </div>
    );
};
