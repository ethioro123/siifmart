import React from 'react';
import { Tag, ChevronDown } from 'lucide-react';
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
            {/* ─── HEADER ──────────────────────────────────── */}
            <div className="flex items-center gap-2 pb-2 border-b border-[#2C5E3B]/20 dark:border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_8px_rgba(44,94,59,0.4)] dark:shadow-[0_0_8px_rgba(169,203,162,0.4)]" />
                <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-[0.2em]">Product & Procurement</span>
            </div>

            <div className="relative overflow-hidden rounded-xl p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C5E3B]/10 via-transparent to-[#8C6239]/10 dark:from-[#2C5E3B]/20 dark:via-transparent dark:to-[#8C6239]/20 opacity-30" />
                <div className="relative glass-panel rounded-xl p-5 space-y-5 shadow-sm dark:shadow-none">

                    {/* ── Identity ──────────────────────────────── */}
                    <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Brand <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">*</span></label>
                            <input type="text" className={`w-full bg-gray-50 dark:bg-black/40 border ${errors.brand ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-bold`} placeholder="Brand Name" value={customItemBrand} onChange={e => { setCustomItemBrand(e.target.value); if (errors.brand) setErrors(p => ({ ...p, brand: '' })); }} />
                            {errors.brand && <span className="text-[9px] text-red-500 ml-1 font-bold">{errors.brand}</span>}
                        </div>
                        <div className="col-span-4 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Product Name <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">*</span></label>
                            <input type="text" className={`w-full bg-gray-50 dark:bg-black/40 border ${errors.name ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white font-black focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600`} placeholder="Product Name" value={customItemName} onChange={e => { setCustomItemName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })); }} />
                            {errors.name && <span className="text-[9px] text-red-500 ml-1 font-bold">{errors.name}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Category <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">*</span></label>
                            <div className="relative">
                                <select title="Category" className={`w-full bg-gray-50 dark:bg-black/40 border ${errors.category ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none appearance-none font-bold`} value={selectedMainCategory} onChange={e => { setSelectedMainCategory(e.target.value); if (errors.category) setErrors(p => ({ ...p, category: '' })); }}>
                                    <option value="" className="bg-white dark:bg-gray-900 text-gray-500">Select...</option>
                                    {Object.entries(PRODUCT_CATEGORIES).map(([group, items]) => (
                                        <optgroup key={group} label={group} className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-300">
                                            {(items as string[]).map(c => <option key={c} value={c} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{c}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            </div>
                            {errors.category && <span className="text-[9px] text-red-500 ml-1 font-bold">{errors.category}</span>}
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Subcategory</label>
                            <input type="text" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-bold" placeholder="e.g. Organic" value={customAttributes.identity.subcategory} onChange={e => setCustomAttributes((p: any) => ({ ...p, identity: { ...p.identity, subcategory: e.target.value } }))} />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Variant</label>
                            <input type="text" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-bold" placeholder="e.g. Lemon" value={customAttributes.identity.variant} onChange={e => setCustomAttributes((p: any) => ({ ...p, identity: { ...p.identity, variant: e.target.value } }))} />
                        </div>
                    </div>

                    {/* ── Size & Packaging ──────────────────────── */}
                    <div className="grid grid-cols-6 gap-4 pt-3 border-t border-gray-100 dark:border-white/5">
                        {/* Size = Value + Type side by side */}
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Size <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">*</span></label>
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    title="Size value"
                                    placeholder="e.g. 500"
                                    className={`w-full bg-gray-50 dark:bg-black/40 border ${errors.size ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-l-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-bold`}
                                    value={customItemSize}
                                    onChange={e => handleSizeChange(e.target.value)}
                                />
                                <div className="relative min-w-[60px]">
                                    <select
                                        title="Size Type"
                                        className={`w-full h-full bg-gray-100 dark:bg-black/40 border ${errors.size && !sizeType ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-r-lg px-2 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none appearance-none font-black text-center`}
                                        value={sizeType}
                                        onChange={e => {
                                            setSizeType(e.target.value);
                                            if (errors.size) setErrors(p => ({ ...p, size: '' }));
                                        }}
                                    >
                                        <option value="" className="bg-white dark:bg-gray-900 text-gray-500">--</option>
                                        {SIZE_TYPES.map(t => <option key={t.value} value={t.value} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{t.label}</option>)}
                                    </select>
                                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                            {errors.size && <span className="text-[9px] text-red-500 ml-1 font-bold">{errors.size}</span>}
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Pack Type</label>
                            <div className="relative">
                                <select title="Package Type" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none appearance-none font-bold" value={customAttributes.packaging.packageType} onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packageType: e.target.value } }))}>
                                    <option value="" className="bg-white dark:bg-gray-900 text-gray-500">Select...</option>
                                    {PACKAGE_TYPES.map(t => <option key={t} value={t} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{t}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        {/* Pack/Case toggle — only show fields when enabled */}
                        <div className="col-span-2 flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-3 h-3 rounded border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-[#2C5E3B] dark:text-[#A9CBA2]"
                                    checked={(parseInt(customAttributes.packaging.packQty) > 1) || (parseInt(customAttributes.packaging.caseSize) > 1)}
                                    onChange={e => {
                                        if (!e.target.checked) {
                                            // Reset pack/case when unchecked
                                            setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packQty: '', caseSize: '' } }));
                                        } else {
                                            // Enable with default values to signal intent
                                            setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packQty: '6', caseSize: '' } }));
                                        }
                                    }}
                                />
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors font-black uppercase tracking-tight">Ships in packs / cases</span>
                            </label>
                        </div>
                    </div>

                    {/* ── Pack / Case Details (only when enabled) ── */}
                    {((parseInt(customAttributes.packaging.packQty) > 1) || (parseInt(customAttributes.packaging.caseSize) > 0)) && (
                        <div className="grid grid-cols-6 gap-4 pl-4 border-l-2 border-[#2C5E3B]/20 dark:border-white/10">
                            <div className="col-span-3 space-y-1">
                                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Pack Qty <span className="text-[8px] text-gray-400 dark:text-gray-600 normal-case font-bold">(units per pack)</span></label>
                                <input type="number" min="2" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-bold" placeholder="e.g. 6" value={customAttributes.packaging.packQty} onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, packQty: e.target.value } }))} />
                            </div>
                            <div className="col-span-3 space-y-1">
                                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Case Size <span className="text-[8px] text-gray-400 dark:text-gray-600 normal-case font-bold">(packs per case)</span></label>
                                <input type="number" min="1" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-bold" placeholder="e.g. 24" value={customAttributes.packaging.caseSize || ''} onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, caseSize: e.target.value } }))} />
                            </div>
                        </div>
                    )}

                    {/* ── Storage & Handling ────────────────────── */}
                    <div className="grid grid-cols-6 gap-4 pt-3 border-t border-gray-100 dark:border-white/5">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Storage</label>
                            <div className="relative">
                                <select title="Storage" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none appearance-none font-bold" value={customAttributes.storage.type} onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, type: e.target.value } }))}>
                                    {STORAGE_CONDITIONS.map(s => <option key={s} value={s} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{s}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Shelf Life</label>
                            <div className="flex gap-1">
                                <input type="number" min="0" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-2 text-xs text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 text-center font-bold" placeholder="--" value={customAttributes.storage.shelfLifeDays || ''} onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, shelfLifeDays: e.target.value } }))} />
                                <span className="flex items-center text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap font-bold">days</span>
                            </div>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Form</label>
                            <div className="relative">
                                <select title="Form" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none appearance-none font-bold" value={customAttributes.physical.form} onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, form: e.target.value } }))}>
                                    <option value="" className="bg-white dark:bg-gray-900 text-gray-500">--</option>
                                    {['Solid', 'Liquid', 'Powder', 'Gel', 'Paste', 'Granule'].map(f => <option key={f} value={f} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{f}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black ml-1">Material</label>
                            <div className="relative">
                                <select title="Material" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none appearance-none font-bold" value={customAttributes.packaging.material} onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, material: e.target.value } }))}>
                                    <option value="" className="bg-white dark:bg-gray-900 text-gray-500">--</option>
                                    {['Plastic', 'Glass', 'Paper', 'Cardboard', 'Metal', 'Aluminium', 'Fabric'].map(m => <option key={m} value={m} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{m}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="col-span-1 flex flex-col justify-end gap-2 pb-1">
                            <label className="flex items-center gap-1.5 cursor-pointer group">
                                <input type="checkbox" className="w-3 h-3 rounded border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-[#2C5E3B] dark:text-[#A9CBA2]" checked={customAttributes.packaging.isBreakable} onChange={e => setCustomAttributes((p: any) => ({ ...p, packaging: { ...p.packaging, isBreakable: e.target.checked } }))} />
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors font-black uppercase tracking-tight">Breakable</span>
                            </label>
                        </div>
                    </div>

                    {/* ── Flags ─────────────────────────────────── */}
                    <div className="flex flex-wrap gap-5 pt-2 border-t border-gray-100 dark:border-white/5">
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3 h-3 rounded border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-black/40 text-[#2C5E3B] dark:text-[#A9CBA2]" checked={customAttributes.storage.isLightSensitive} onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, isLightSensitive: e.target.checked } }))} />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors font-black uppercase tracking-tight">Light Sensitive</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3 h-3 rounded border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-black/40 text-red-600 dark:text-red-500" checked={customAttributes.storage.isHazardous} onChange={e => setCustomAttributes((p: any) => ({ ...p, storage: { ...p.storage, isHazardous: e.target.checked } }))} />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors font-black uppercase tracking-tight">Hazardous</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};
