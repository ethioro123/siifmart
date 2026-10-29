import React from 'react';
import { Scale, ChevronDown, Sparkles, Box, Droplets, Shirt, Cpu, UtensilsCrossed } from 'lucide-react';
import { getCategorySpecGroup } from './categoryAttributes';
import { isConsumableCategory, NET_CONTENT_UNITS } from './utils';

export interface DynamicPhysicalAttributesSectionProps {
    selectedMainCategory: string;
    customItemSize: string;
    setCustomItemSize: (v: string) => void;
    sizeType: string;
    setSizeType: (v: string) => void;
    customAttributes: any;
    setCustomAttributes: React.Dispatch<React.SetStateAction<any>>;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    handleNetWeightChange: (val: string) => void;
}

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size / Free Size', '28', '30', '32', '34', '36', '38', '40', '42'];
const BEVERAGE_CONTAINERS = ['PET Plastic Bottle', 'Aluminium Sleek Can', 'Standard Aluminium Can', 'Glass Bottle', 'Tetra Pak Carton', 'Bulk Jug / Cask'];
const KITCHEN_MATERIALS = ['Food-Grade Stainless Steel', 'Ceramic / Porcelain', 'Tempered Glass', 'Cast Iron', 'BPA-Free Plastic / Silicone', 'Natural Wood / Bamboo'];

export const DynamicPhysicalAttributesSection: React.FC<DynamicPhysicalAttributesSectionProps> = ({
    selectedMainCategory,
    customItemSize,
    setCustomItemSize,
    sizeType,
    setSizeType,
    customAttributes,
    setCustomAttributes,
    errors,
    setErrors,
    handleNetWeightChange
}) => {
    const specGroup = getCategorySpecGroup(selectedMainCategory, customAttributes.identity?.subcategory);
    const domainId = specGroup.id;
    const isConsumable = isConsumableCategory(selectedMainCategory);

    // Dynamic section titles and icons
    const getDomainHeader = () => {
        switch (domainId) {
            case 'apparel':
                return {
                    title: '3. Physical Specifications (Garment Sizing & Fitment)',
                    subtitle: 'Apparel sizing, fabric composition, and garment net weight',
                    icon: Shirt,
                    colorClass: 'text-indigo-500'
                };
            case 'beverages':
                return {
                    title: '3. Physical Specifications (Liquid Volume & Container)',
                    subtitle: 'Net liquid volume, container type, and gross bottle weight',
                    icon: Droplets,
                    colorClass: 'text-cyan-500'
                };
            case 'electronics':
                return {
                    title: '3. Physical Specifications (Hardware Dimensions & Form Factor)',
                    subtitle: 'Device dimensions, unit weight, and physical finish',
                    icon: Cpu,
                    colorClass: 'text-[var(--theme-status-info-text)]'
                };
            case 'homewares_kitchen':
                return {
                    title: '3. Physical Specifications (Dimensions, Capacity & Material)',
                    subtitle: 'Cookware / tableware dimensions, volume capacity, and primary material',
                    icon: UtensilsCrossed,
                    colorClass: 'text-[var(--theme-status-warning-text)]'
                };
            default:
                return {
                    title: '3. Physical Specifications (Consumer Unit / Each)',
                    subtitle: 'Pure content specs strictly separated from logistics packaging',
                    icon: Scale,
                    colorClass: 'text-[var(--theme-status-success-text)]'
                };
        }
    };

    const header = getDomainHeader();
    const HeaderIcon = header.icon;

    return (
        <div className="space-y-3 pt-3 border-t border-[var(--theme-border-subtle)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                    <HeaderIcon size={12} className={header.colorClass} />
                    <span>{header.title}</span>
                </div>
                <span className="text-[9px] text-[var(--theme-text-secondary)] font-medium">
                    {header.subtitle}
                </span>
            </div>

            {/* ═══ APPAREL & FASHION ARCHETYPE ═══ */}
            {domainId === 'apparel' && (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
                    {/* Apparel Size / Fitment */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                            Size / Fitment <span className="text-[var(--theme-status-danger-text)]">*</span>
                        </label>
                        <div className="relative">
                            <select
                                data-po-field="size" title="Apparel Size"
                                className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.size ? 'border-[var(--theme-status-danger-border)]' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer`}
                                value={customAttributes.identity?.variant || customAttributes.categorySpecific?.apparelSize || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setCustomItemSize(val);
                                    setCustomAttributes((p: any) => ({
                                        ...p,
                                        identity: { ...p.identity, variant: val },
                                        categorySpecific: { ...(p.categorySpecific || {}), apparelSize: val }
                                    }));
                                    if (errors.size) setErrors(p => ({ ...p, size: '' }));
                                }}
                            >
                                <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select Size...</option>
                                {APPAREL_SIZES.map(s => <option key={s} value={s} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{s}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        </div>
                        {errors.size && <span className="text-[9px] text-[var(--theme-status-danger-text)] ml-1 font-semibold">{errors.size}</span>}
                    </div>

                    {/* Colorway / Pattern */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Colorway / Pattern</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none font-semibold placeholder:text-[var(--theme-text-secondary)]/70"
                            placeholder="e.g. Jet Black, Heather Grey, Navy"
                            value={customAttributes.physical?.color || ''}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, color: e.target.value } }))}
                        />
                    </div>

                    {/* Fiber / Composition */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Fiber / Material</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none font-semibold placeholder:text-[var(--theme-text-secondary)]/70"
                            placeholder="e.g. 100% Combed Cotton, Denim, Linen"
                            value={customAttributes.categorySpecific?.fabricMaterial || customAttributes.physical?.form || ''}
                            onChange={e => {
                                const val = e.target.value;
                                setCustomAttributes((p: any) => ({
                                    ...p,
                                    physical: { ...p.physical, form: val },
                                    categorySpecific: { ...(p.categorySpecific || {}), fabricMaterial: val }
                                }));
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ═══ BEVERAGES ARCHETYPE ═══ */}
            {domainId === 'beverages' && (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
                    {/* Net Liquid Volume */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                            Net Volume <span className="text-[var(--theme-status-danger-text)]">*</span>
                        </label>
                        <div className="flex gap-1">
                            <input
                                type="number"
                                min="0"
                                step="any"
                                title="Net Liquid Volume"
                                placeholder="e.g. 500"
                                className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.size ? 'border-[var(--theme-status-danger-border)]' : 'border-[var(--theme-border)]'} rounded-l-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none`}
                                data-po-field="size" value={customItemSize}
                                onChange={e => handleNetWeightChange(e.target.value)}
                            />
                            <div className="relative min-w-[70px]">
                                <select
                                    title="Volume Unit"
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-r-xl px-2 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-bold text-center cursor-pointer"
                                    value={sizeType || 'ml'}
                                    onChange={e => {
                                        setSizeType(e.target.value);
                                        if (errors.size) setErrors(p => ({ ...p, size: '' }));
                                    }}
                                >
                                    <option value="ml">ml</option>
                                    <option value="L">L</option>
                                    <option value="fl oz">fl oz</option>
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                        </div>
                        {errors.size && <span className="text-[9px] text-[var(--theme-status-danger-text)] ml-1 font-semibold">{errors.size}</span>}
                    </div>

                    {/* Container Format */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Container Type</label>
                        <div className="relative">
                            <select
                                title="Container Format"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer"
                                value={customAttributes.categorySpecific?.containerType || customAttributes.physical?.form || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setCustomAttributes((p: any) => ({
                                        ...p,
                                        physical: { ...p.physical, form: val },
                                        categorySpecific: { ...(p.categorySpecific || {}), containerType: val }
                                    }));
                                }}
                            >
                                <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select Container...</option>
                                {BEVERAGE_CONTAINERS.map(c => <option key={c} value={c} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{c}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        </div>
                    </div>

                    {/* Gross Packed Weight */}
                    <div className="col-span-1 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Gross Wt (kg)</label>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-semibold outline-none"
                            placeholder="e.g. 0.55"
                            value={customAttributes.physical?.grossWeight || ''}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, grossWeight: e.target.value } }))}
                        />
                    </div>

                    {/* Bottle Dimensions */}
                    <div className="col-span-1 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Height (cm)</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-semibold outline-none"
                            placeholder="e.g. 22.5"
                            value={customAttributes.physical?.dims || ''}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, dims: e.target.value } }))}
                        />
                    </div>
                </div>
            )}

            {/* ═══ ELECTRONICS ARCHETYPE ═══ */}
            {domainId === 'electronics' && (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
                    {/* Device Dimensions */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Device Dimensions (L×W×H cm)</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-semibold outline-none"
                            placeholder="e.g. 14.6 × 7.0 × 0.8"
                            value={customAttributes.physical?.dims || ''}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, dims: e.target.value } }))}
                        />
                    </div>

                    {/* Unit Net Weight */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Device Weight</label>
                        <div className="flex gap-1">
                            <input
                                type="number"
                                min="0"
                                step="any"
                                title="Device Weight"
                                placeholder="e.g. 172"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-l-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold outline-none"
                                data-po-field="size" value={customItemSize}
                                onChange={e => handleNetWeightChange(e.target.value)}
                            />
                            <div className="relative min-w-[65px]">
                                <select
                                    title="Weight Unit"
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-r-xl px-2 text-xs text-[var(--theme-text-primary)] outline-none appearance-none font-bold text-center cursor-pointer"
                                    value={sizeType || 'g'}
                                    onChange={e => setSizeType(e.target.value)}
                                >
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="oz">oz</option>
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Colorway / Finish */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Colorway / Finish</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-semibold outline-none"
                            placeholder="e.g. Space Gray, Titanium, Midnight"
                            value={customAttributes.physical?.color || ''}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, color: e.target.value } }))}
                        />
                    </div>
                </div>
            )}

            {/* ═══ HOMEWARES & KITCHEN ARCHETYPE ═══ */}
            {domainId === 'homewares_kitchen' && (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
                    {/* Item Dimensions */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Dimensions (L×W×H cm / Dia)</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-semibold outline-none"
                            placeholder="e.g. 28 × 28 × 12 cm, 28cm Dia"
                            value={customAttributes.physical?.dims || ''}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, dims: e.target.value } }))}
                        />
                    </div>

                    {/* Capacity / Volume */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Capacity / Size</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-semibold outline-none"
                            placeholder="e.g. 5 Litre Pot, 500ml Container"
                            value={customAttributes.categorySpecific?.capacitySize || customAttributes.physical?.netWeight || ''}
                            onChange={e => {
                                const val = e.target.value;
                                setCustomItemSize(val);
                                setCustomAttributes((p: any) => ({
                                    ...p,
                                    physical: { ...p.physical, netWeight: val },
                                    categorySpecific: { ...(p.categorySpecific || {}), capacitySize: val }
                                }));
                            }}
                        />
                    </div>

                    {/* Primary Material */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Primary Material</label>
                        <div className="relative">
                            <select
                                title="Primary Material"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer"
                                value={customAttributes.categorySpecific?.materialType || customAttributes.physical?.form || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setCustomAttributes((p: any) => ({
                                        ...p,
                                        physical: { ...p.physical, form: val },
                                        categorySpecific: { ...(p.categorySpecific || {}), materialType: val }
                                    }));
                                }}
                            >
                                <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select Material...</option>
                                {KITCHEN_MATERIALS.map(m => <option key={m} value={m} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{m}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ STANDARD CONSUMABLES & DEFAULT ARCHETYPE ═══ */}
            {!['apparel', 'beverages', 'electronics', 'homewares_kitchen'].includes(domainId) && (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
                    {/* Net Content / Net Weight */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                            Net Content / Weight {isConsumable ? <span className="text-[var(--theme-status-danger-text)]">*</span> : <span className="text-[9px] text-[var(--theme-text-secondary)] font-normal normal-case">(e.g. 500g, 1kg)</span>}
                        </label>
                        <div className="flex gap-1">
                            <input
                                type="number"
                                min="0"
                                step="any"
                                title="Net Content Value"
                                placeholder="e.g. 500"
                                className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.size ? 'border-[var(--theme-status-danger-border)]' : 'border-[var(--theme-border)]'} rounded-l-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono font-bold focus:border-[var(--theme-accent)] outline-none transition-all`}
                                data-po-field="size" value={customItemSize}
                                onChange={e => handleNetWeightChange(e.target.value)}
                            />
                            <div className="relative min-w-[75px]">
                                <select
                                    title="Net Content Unit"
                                    className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors.size && !sizeType ? 'border-[var(--theme-status-danger-border)]' : 'border-[var(--theme-border)]'} rounded-r-xl px-2 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-bold text-center cursor-pointer`}
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
                        {errors.size && <span className="text-[9px] text-[var(--theme-status-danger-text)] ml-1 font-semibold">{errors.size}</span>}
                    </div>

                    {/* Gross Weight */}
                    <div className="col-span-1 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Gross Wt (kg)</label>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono focus:border-[var(--theme-accent)] outline-none font-semibold"
                            placeholder="e.g. 0.55"
                            value={customAttributes.physical?.grossWeight || ''}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, grossWeight: e.target.value } }))}
                        />
                    </div>

                    {/* Dimensions */}
                    <div className="col-span-2 sm:col-span-2 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Dimensions (L×W×H cm)</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] font-mono focus:border-[var(--theme-accent)] outline-none font-semibold"
                            placeholder="e.g. 18.0 × 12.0 × 5.0"
                            value={customAttributes.physical?.dims || ''}
                            onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, dims: e.target.value } }))}
                        />
                    </div>

                    {/* Physical Form */}
                    <div className="col-span-1 min-w-0 space-y-1">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">Physical Form</label>
                        <div className="relative">
                            <select
                                title="Physical Form"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 text-xs text-[var(--theme-text-primary)] outline-none font-semibold cursor-pointer appearance-none"
                                value={customAttributes.physical?.form || ''}
                                onChange={e => setCustomAttributes((p: any) => ({ ...p, physical: { ...p.physical, form: e.target.value } }))}
                            >
                                <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Select...</option>
                                {['Solid', 'Liquid', 'Powder', 'Gel', 'Paste', 'Granule', 'Device / Hardware'].map(f => <option key={f} value={f} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{f}</option>)}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
