import React from 'react';
import { Tag, ChevronDown, Lock, Package, Scale, Layers, Thermometer, ShieldAlert, Globe } from 'lucide-react';
import { PRODUCT_CATEGORIES, PACKAGE_TYPES, STORAGE_CONDITIONS, isConsumableCategory } from './utils';

/* ─────────────── NET CONTENT / PHYSICAL UoM (GS1 Standard) ──────────── */

const NET_CONTENT_UNITS = [
    { value: 'g', label: 'g (Gram)', group: 'Weight' },
    { value: 'kg', label: 'kg (Kilogram)', group: 'Weight' },
    { value: 'ml', label: 'ml (Millilitre)', group: 'Volume' },
    { value: 'L', label: 'L (Litre)', group: 'Volume' },
    { value: 'oz', label: 'oz (Ounce)', group: 'Weight' },
    { value: 'lb', label: 'lb (Pound)', group: 'Weight' },
    { value: 'fl oz', label: 'fl oz (Fluid Ounce)', group: 'Volume' },
    { value: 'pcs', label: 'pcs (Pieces / Count)', group: 'Count' },
] as const;

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
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Model / MPN</label>
                            <input
                                type="text"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold"
                                placeholder="e.g. B08KTZ8249"
                                value={customAttributes.identity?.modelNumber || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, identity: { ...p.identity, modelNumber: e.target.value } }))}
                            />
                        </div>
                        <div className="col-span-1 space-y-1">
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

                {/* ── 2. PHYSICAL PRODUCT SPECIFICATIONS (CONSUMER ITEM) ── */}
                <div className="space-y-3 pt-3 border-t border-[var(--theme-border-subtle)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            <Scale size={12} className="text-emerald-500" />
                            <span>2. Physical Specifications (Consumer Unit / Each)</span>
                        </div>
                        <span className="text-[9px] text-[var(--theme-text-secondary)] font-medium">
                            Pure content specs strictly separated from logistics packaging
                        </span>
                    </div>

                    <div className="grid grid-cols-6 gap-3.5">
                        {/* Net Content / Net Weight */}
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                                Net Content / Net Weight {isConsumableCategory(selectedMainCategory) ? <span className="text-rose-500">*</span> : <span className="text-[9px] text-[var(--theme-text-secondary)] font-normal normal-case">(e.g. 217g, 1kg)</span>}
                            </label>
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    title="Net Content Value"
                                    placeholder="e.g. 217"
                                    className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.size ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-l-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70`}
                                    value={customItemSize}
                                    onChange={e => handleNetWeightChange(e.target.value)}
                                />
                                <div className="relative min-w-[75px]">
                                    <select
                                        title="Net Content Unit"
                                        className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.size && !sizeType ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-r-xl px-2 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-bold text-center cursor-pointer`}
                                        value={sizeType}
                                        onChange={e => {
                                            setSizeType(e.target.value);
                                            if (errors.size) setErrors(p => ({ ...p, size: '' }));
                                        }}
                                    >
                                        <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">--</option>
                                        {NET_CONTENT_UNITS.map(t => <option key={t.value} value={t.value} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{t.label}</option>)}
                                    </select>
                                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                                </div>
                            </div>
                            <span className="text-[9px] text-[var(--theme-text-secondary)] block ml-1">Actual product weight/volume without packaging</span>
                            {errors.size && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.size}</span>}
                        </div>

                        {/* Gross Weight */}
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Gross Weight (kg)</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold"
                                placeholder="e.g. 0.28"
                                value={customAttributes.physical?.grossWeight || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, grossWeight: e.target.value } }))}
                            />
                            <span className="text-[9px] text-[var(--theme-text-secondary)] block ml-1">With consumer box</span>
                        </div>

                        {/* Dimensions */}
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Dimensions (L×W×H cm)</label>
                            <input
                                type="text"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold"
                                placeholder="e.g. 16.0 × 11.5 × 0.8"
                                value={customAttributes.physical?.dims || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, dims: e.target.value } }))}
                            />
                            <span className="text-[9px] text-[var(--theme-text-secondary)] block ml-1">For shelf cube allocation</span>
                        </div>

                        {/* Form / State */}
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Physical Form</label>
                            <div className="relative">
                                <select
                                    title="Physical Form"
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer appearance-none"
                                    value={customAttributes.physical?.form || ''}
                                    onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, form: e.target.value } }))}
                                >
                                    <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select...</option>
                                    {['Device / Hardware', 'Solid', 'Liquid', 'Powder', 'Gel', 'Paste', 'Granule'].map(f => <option key={f} value={f} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{f}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 3. SUPPLY CHAIN PACKAGING HIERARCHY (GS1 STANDARD) ── */}
                <div className="space-y-3 pt-3 border-t border-[var(--theme-border-subtle)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            <Layers size={12} className="text-amber-500" />
                            <span>3. Supply Chain Packaging Hierarchy (GS1 Logistics Standard)</span>
                        </div>
                        <div className="px-2.5 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[9px] font-mono font-bold text-[var(--theme-accent)]">
                            {packagingLevel === 'single' ? '1 Order Unit = 1 Consumer Each (1:1)' : `1 Order Unit = ${multiplier} Consumer Eaches (×${multiplier})`}
                        </div>
                    </div>

                    {/* Packaging Level Selector Pills */}
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'single', label: 'Single Consumer Unit', sub: '1:1 Individual Each' },
                            { id: 'case', label: 'Master Case / Carton', sub: 'Wholesale shipping case' },
                            { id: 'bale', label: 'Bulk Bale / Bundle', sub: 'Commodity bale (e.g. 12 pk)' },
                            { id: 'two_tier', label: '2-Tier Master Case', sub: 'Inner packs in master case' },
                        ].map(tier => (
                            <button
                                key={tier.id}
                                type="button"
                                onClick={() => setPackagingLevel(tier.id as any)}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                    packagingLevel === tier.id
                                        ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-accent)] shadow-sm'
                                        : 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)] hover:border-[var(--theme-border-subtle)]'
                                }`}
                            >
                                <div className={`text-xs font-bold ${packagingLevel === tier.id ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-primary)]'}`}>
                                    {tier.label}
                                </div>
                                <div className="text-[9px] text-[var(--theme-text-secondary)] font-medium mt-0.5">
                                    {tier.sub}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Container Type + Multipliers */}
                    <div className="grid grid-cols-6 gap-3.5 pt-1">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Package Container Type</label>
                            <div className="relative">
                                <select 
                                    title="Package Container Type" 
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer" 
                                    value={customAttributes.packaging?.packageType || ''} 
                                    onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packageType: e.target.value } }))}
                                >
                                    <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select Container...</option>
                                    {PACKAGE_TYPES.map(t => <option key={t} value={t} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{t}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                        </div>

                        {packagingLevel !== 'single' && (
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                                    Pack Qty <span className="text-[9px] text-[var(--theme-text-secondary)] normal-case font-medium">(units per package)</span>
                                </label>
                                <input
                                    type="number"
                                    min="2"
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70"
                                    placeholder="e.g. 12 or 24"
                                    value={customAttributes.packaging?.packQty || ''}
                                    onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packQty: e.target.value } }))}
                                />
                            </div>
                        )}

                        {packagingLevel === 'two_tier' && (
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                                    Case Size <span className="text-[9px] text-[var(--theme-text-secondary)] normal-case font-medium">(inner packs per case)</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70"
                                    placeholder="e.g. 4"
                                    value={customAttributes.packaging?.caseSize || ''}
                                    onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, caseSize: e.target.value } }))}
                                />
                            </div>
                        )}

                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Packaging Material</label>
                            <div className="relative">
                                <select
                                    title="Packaging Material"
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer appearance-none"
                                    value={customAttributes.packaging?.material || ''}
                                    onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, material: e.target.value } }))}
                                >
                                    <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select Material...</option>
                                    {['Paper / Cardboard', 'Plastic', 'Glass', 'Metal', 'Aluminium', 'Fabric', 'Wood'].map(m => <option key={m} value={m} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{m}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 4. STORAGE, INBOUND QC & HANDLING COMPLIANCE ── */}
                <div className="space-y-3 pt-3 border-t border-[var(--theme-border-subtle)]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        <Thermometer size={12} className="text-purple-500" />
                        <span>4. Storage, Inbound QC & Handling Directives</span>
                    </div>

                    <div className="grid grid-cols-6 gap-3.5">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Storage Temperature</label>
                            <div className="relative">
                                <select
                                    title="Storage Temperature"
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer appearance-none"
                                    value={customAttributes.storage?.type || 'Ambient (Dry)'}
                                    onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, type: e.target.value } }))}
                                >
                                    {STORAGE_CONDITIONS.map(s => <option key={s} value={s} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{s}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Shelf Life (Days)</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70"
                                placeholder="e.g. 365 (or leave blank if non-perishable)"
                                value={customAttributes.storage?.shelfLifeDays || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, shelfLifeDays: e.target.value, isPerishable: Boolean(e.target.value && parseInt(e.target.value) > 0) } }))}
                            />
                        </div>

                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Max Stack Limit</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70"
                                placeholder="e.g. 5 cartons high"
                                value={customAttributes.storage?.stackLimit || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, stackLimit: e.target.value } }))}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-5 pt-2">
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-[var(--theme-border)] accent-[var(--theme-accent)]"
                                checked={Boolean(customAttributes.packaging?.isBreakable)}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, isBreakable: e.target.checked } }))}
                            />
                            <span className="text-xs text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] font-semibold transition-colors">Breakable Packaging</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-[var(--theme-border)] accent-[var(--theme-accent)]"
                                checked={Boolean(customAttributes.storage?.isFragile)}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, isFragile: e.target.checked } }))}
                            />
                            <span className="text-xs text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] font-semibold transition-colors">Fragile Merchandise</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-[var(--theme-border)] accent-[var(--theme-accent)]"
                                checked={Boolean(customAttributes.storage?.isLightSensitive)}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, isLightSensitive: e.target.checked } }))}
                            />
                            <span className="text-xs text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] font-semibold transition-colors">Light Sensitive</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-rose-300 accent-rose-500"
                                checked={Boolean(customAttributes.storage?.isHazardous)}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, isHazardous: e.target.checked } }))}
                            />
                            <span className="text-xs text-rose-500 font-semibold">Hazardous Material</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};
