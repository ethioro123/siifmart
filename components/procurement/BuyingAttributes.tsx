import React from 'react';
import { Tag, ChevronDown, Lock } from 'lucide-react';
import { PRODUCT_CATEGORIES, PACKAGE_TYPES, STORAGE_CONDITIONS } from './utils';

/* ─────────────── SIZE TYPES (Package Label) ──────────── */

const SIZE_TYPES = [
    { value: 'g', label: 'g', group: 'Weight' },
    { value: 'kg', label: 'kg', group: 'Weight' },
    { value: 'ml', label: 'ml', group: 'Volume' },
    { value: 'L', label: 'L', group: 'Volume' },
    { value: 'pcs', label: 'pcs', group: 'Count' },
    { value: 'pk', label: 'pk', group: 'Count' },
] as const;

/* ─────────────────────── TYPES ─────────────────────── */

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

/* ─────────────────────── COMPONENT ─────────────────── */

export const BuyingAttributes: React.FC<BuyingAttributesProps> = ({
    customItemBrand, setCustomItemBrand,
    customItemName, setCustomItemName,
    selectedMainCategory, setSelectedMainCategory,
    customItemSize, setCustomItemSize,
    customAttributes, setCustomAttributes,
    errors, setErrors,
}) => {
    // Size type tracks the unit shown on the product label (g, kg, ml, L, pcs, pk)
    const sizeType = customAttributes.physical?.sizeType || '';

    const setSizeType = (type: string) => {
        setCustomAttributes((p: any) => ({
            ...p,
            physical: { ...p.physical, sizeType: type },
            // Auto-populate packaging unit size from value + type
            packaging: {
                ...p.packaging,
                unitSize: customItemSize && type ? `${customItemSize}${type}` : p.packaging.unitSize
            }
        }));
    };

    const handleSizeChange = (val: string) => {
        setCustomItemSize(val);
        setCustomAttributes((p: any) => ({
            ...p,
            physical: { ...p.physical, netWeight: val },
            packaging: {
                ...p.packaging,
                unitSize: val && sizeType ? `${val}${sizeType}` : p.packaging.unitSize
            }
        }));
        if (errors.size) setErrors(p => ({ ...p, size: '' }));
    };

    return (
        <div className="space-y-4">
            {/* ─── HEADER ──────────────────────────────────── */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border-subtle)]">
                <span className="text-[10px] text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider">
                    Product Specification & Merchandising
                </span>
                <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={11} className="shrink-0 text-[var(--theme-accent)]" /> Master Merchandising Spec
                </span>
            </div>

            <div className="rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-5 space-y-4 shadow-sm">
                {/* ── Identity ──────────────────────────────── */}
                <div className="grid grid-cols-6 gap-3.5">
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Brand <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.brand ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold`}
                            placeholder="Brand Name"
                            value={customItemBrand}
                            onChange={e => { setCustomItemBrand(e.target.value); if (errors.brand) setErrors(p => ({ ...p, brand: '' })); }}
                        />
                        {errors.brand && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.brand}</span>}
                    </div>
                    <div className="col-span-4 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Product Name <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.name ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-semibold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70`}
                            placeholder="Full Product Description"
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
                            placeholder="e.g. Organic, Premium"
                            value={customAttributes.identity.subcategory}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, identity: { ...p.identity, subcategory: e.target.value } }))}
                        />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Variant</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold"
                            placeholder="e.g. Lemon, Original"
                            value={customAttributes.identity.variant}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, identity: { ...p.identity, variant: e.target.value } }))}
                        />
                    </div>
                </div>

                {/* ── Size & Packaging ──────────────────────── */}
                <div className="grid grid-cols-6 gap-3.5 pt-3 border-t border-[var(--theme-border-subtle)]">
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Size <span className="text-rose-500">*</span></label>
                        <div className="flex gap-1">
                            <input
                                type="number"
                                min="0"
                                step="any"
                                title="Size value"
                                placeholder="e.g. 500"
                                className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.size ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-l-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold`}
                                value={customItemSize}
                                onChange={e => handleSizeChange(e.target.value)}
                            />
                            <div className="relative min-w-[70px]">
                                <select
                                    title="Size Type"
                                    className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.size && !sizeType ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-r-xl px-2 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-bold text-center cursor-pointer`}
                                    value={sizeType}
                                    onChange={e => {
                                        setSizeType(e.target.value);
                                        if (errors.size) setErrors(p => ({ ...p, size: '' }));
                                    }}
                                >
                                    <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">--</option>
                                    {SIZE_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{t.label}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                        </div>
                        {errors.size && <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors.size}</span>}
                    </div>
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Pack Type</label>
                        <div className="relative">
                            <select 
                                title="Package Type" 
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer" 
                                value={customAttributes.packaging.packageType} 
                                onChange={e => {
                                    const val = e.target.value;
                                    const isBulk = ['Bale', 'Carton', 'Case', 'Box', 'Bundle', 'Crate', 'Sack', 'Tray', 'Multipack'].includes(val);
                                    setCustomAttributes((p: any) => ({
                                        ...p,
                                        packaging: {
                                            ...p.packaging,
                                            packageType: val,
                                            packQty: isBulk && (!p.packaging.packQty || p.packaging.packQty === '1') ? '12' : p.packaging.packQty
                                        }
                                    }));
                                }}
                            >
                                <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select Type...</option>
                                {PACKAGE_TYPES.map(t => <option key={t} value={t} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{t}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        </div>
                    </div>
                    <div className="col-span-2 flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-[var(--theme-border)] accent-[var(--theme-accent)]"
                                checked={(parseInt(customAttributes.packaging.packQty) > 1) || (parseInt(customAttributes.packaging.caseSize) > 0) || ['Bale', 'Carton', 'Case', 'Box', 'Bundle', 'Crate', 'Sack', 'Tray', 'Multipack'].includes(customAttributes.packaging?.packageType)}
                                onChange={e => {
                                    if (!e.target.checked) {
                                        setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packQty: '', caseSize: '' } }));
                                    } else {
                                        setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packQty: '12', caseSize: '' } }));
                                    }
                                }}
                            />
                            <span className="text-xs text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] transition-colors font-semibold">Ships in packs / cases</span>
                        </label>
                    </div>
                </div>

                {/* ── Pack / Case Details ── */}
                {((parseInt(customAttributes.packaging.packQty) > 1) || (parseInt(customAttributes.packaging.caseSize) > 0) || ['Bale', 'Carton', 'Case', 'Box', 'Bundle', 'Crate', 'Sack', 'Tray', 'Multipack'].includes(customAttributes.packaging?.packageType)) && (
                    <div className="grid grid-cols-6 gap-3.5 pl-4 border-l-2 border-[var(--theme-accent)]/30">
                        <div className="col-span-3 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                                Pack Qty <span className="text-[9px] text-[var(--theme-text-secondary)] normal-case font-medium">(units per {customAttributes.packaging?.packageType?.toLowerCase() || 'pack'})</span>
                            </label>
                            <input
                                type="number"
                                min="2"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70"
                                placeholder="e.g. 12"
                                value={customAttributes.packaging.packQty}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packQty: e.target.value } }))}
                            />
                        </div>
                        <div className="col-span-3 space-y-1">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                                Case Size <span className="text-[9px] text-[var(--theme-text-secondary)] normal-case font-medium">(packs per case)</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70"
                                placeholder="e.g. 24"
                                value={customAttributes.packaging.caseSize || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, caseSize: e.target.value } }))}
                            />
                        </div>
                    </div>
                )}

                {/* ── Storage & Handling ────────────────────── */}
                <div className="grid grid-cols-6 gap-3.5 pt-3 border-t border-[var(--theme-border-subtle)]">
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Storage</label>
                        <div className="relative">
                            <select
                                title="Storage"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer"
                                value={customAttributes.storage.type}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, type: e.target.value } }))}
                            >
                                {STORAGE_CONDITIONS.map(s => <option key={s} value={s} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{s}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        </div>
                    </div>
                    <div className="col-span-1 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Shelf Life</label>
                        <div className="flex gap-1 items-center">
                            <input
                                type="number"
                                min="0"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all text-center"
                                placeholder="--"
                                value={customAttributes.storage.shelfLifeDays || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, shelfLifeDays: e.target.value } }))}
                            />
                            <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium">d</span>
                        </div>
                    </div>
                    <div className="col-span-1 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Form</label>
                        <div className="relative">
                            <select
                                title="Form"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer"
                                value={customAttributes.physical.form}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, form: e.target.value } }))}
                            >
                                <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">--</option>
                                {['Solid', 'Liquid', 'Powder', 'Gel', 'Paste', 'Granule'].map(f => <option key={f} value={f} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{f}</option>)}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        </div>
                    </div>
                    <div className="col-span-1 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Material</label>
                        <div className="relative">
                            <select
                                title="Material"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer"
                                value={customAttributes.packaging.material}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, material: e.target.value } }))}
                            >
                                <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">--</option>
                                {['Plastic', 'Glass', 'Paper', 'Cardboard', 'Metal', 'Aluminium', 'Fabric'].map(m => <option key={m} value={m} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{m}</option>)}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        </div>
                    </div>
                    <div className="col-span-1 flex flex-col justify-end pb-2">
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-[var(--theme-border)] accent-[var(--theme-accent)]"
                                checked={customAttributes.packaging.isBreakable}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, isBreakable: e.target.checked } }))}
                            />
                            <span className="text-xs text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] font-semibold transition-colors">Breakable</span>
                        </label>
                    </div>
                </div>

                {/* ── Flags ─────────────────────────────────── */}
                <div className="flex flex-wrap gap-5 pt-3 border-t border-[var(--theme-border-subtle)]">
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                        <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-[var(--theme-border)] accent-[var(--theme-accent)]"
                            checked={customAttributes.storage.isLightSensitive}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, isLightSensitive: e.target.checked } }))}
                        />
                        <span className="text-xs text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] font-semibold transition-colors">Light Sensitive</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                        <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-rose-300 accent-rose-500"
                            checked={customAttributes.storage.isHazardous}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, isHazardous: e.target.checked } }))}
                        />
                        <span className="text-xs text-rose-500 font-semibold">Hazardous</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
