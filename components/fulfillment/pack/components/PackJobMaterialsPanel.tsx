import React from 'react';
import { Box, Snowflake, Layers, Tag, Check, ShieldAlert, ArrowUp, Lock, Mail, ThermometerSnowflake } from 'lucide-react';
import { WMSJob, Site } from '../../../../types';

interface PackJobMaterialsPanelProps {
    progressPercent: number;
    isFullyPacked: boolean;
    destSite: Site | undefined;
    job: WMSJob;
    boxSize: 'Small' | 'Medium' | 'Large' | 'Extra Large' | 'Poly Mailer' | 'Thermal Cool Box';
    setBoxSize: (size: 'Small' | 'Medium' | 'Large' | 'Extra Large' | 'Poly Mailer' | 'Thermal Cool Box') => void;
    hasFragileItems: boolean | undefined;
    packingMaterials: { bubbleWrap: boolean; fragileStickers: boolean; thisSideUp: boolean; securitySeal: boolean };
    setPackingMaterials: (materials: { bubbleWrap: boolean; fragileStickers: boolean; thisSideUp: boolean; securitySeal: boolean }) => void;
    hasColdItems: boolean | undefined;
    hasIcePack: boolean;
    setHasIcePack: (hasIce: boolean) => void;
    t: (key: string) => string;
}

export const PackJobMaterialsPanel: React.FC<PackJobMaterialsPanelProps> = ({
    progressPercent,
    isFullyPacked,
    destSite,
    job,
    boxSize,
    setBoxSize,
    hasFragileItems,
    packingMaterials,
    setPackingMaterials,
    hasColdItems,
    hasIcePack,
    setHasIcePack,
    t,
}) => {
    const boxOptions: Array<{ size: 'Small' | 'Medium' | 'Large' | 'Extra Large' | 'Poly Mailer' | 'Thermal Cool Box'; label: string; code: string; desc: string; icon?: any }> = [
        { size: 'Small', label: 'Small Box', code: 'SM', desc: 'Up to 2kg' },
        { size: 'Medium', label: 'Medium Box', code: 'MD', desc: 'Up to 8kg' },
        { size: 'Large', label: 'Large Box', code: 'LG', desc: 'Up to 20kg' },
        { size: 'Extra Large', label: 'X-Large', code: 'XL', desc: 'Bulk Cargo' },
        { size: 'Poly Mailer', label: 'Poly Mailer', code: 'BAG', desc: 'Soft Goods' },
        { size: 'Thermal Cool Box', label: 'Cool Box', code: 'ICE', desc: 'Insulated' },
    ];

    return (
        <div className="w-full lg:w-84 flex flex-col gap-3.5 shrink-0 p-3.5 lg:p-4 border-t lg:border-t-0 lg:border-l border-[#E2DCCE]/80 dark:border-[#2C5E3B]/20 bg-[#FAF8F5] dark:bg-[#141A16]">
            {/* Box Specification Card */}
            <div className="bg-white dark:bg-[#1C2620] border border-[#E2DCCE] dark:border-[#2C5E3B]/25 rounded-2xl p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-white/5">
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Box size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        {t('warehouse.boxSize') || 'Container Selection'}
                    </span>
                    <span className="text-[9px] font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 px-2 py-0.5 rounded">
                        {boxSize}
                    </span>
                </div>

                {/* Segmented Container Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                    {boxOptions.map((opt) => {
                        const isSelected = boxSize === opt.size;
                        return (
                            <button
                                key={opt.size}
                                type="button"
                                onClick={() => setBoxSize(opt.size)}
                                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                        ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] shadow-sm'
                                        : 'bg-stone-50/80 dark:bg-white/[0.03] border-stone-200/80 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:border-[#2C5E3B]/40'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-black font-mono uppercase ${isSelected ? 'text-white' : 'text-stone-900 dark:text-white'}`}>
                                        {opt.code} · {opt.label}
                                    </span>
                                    {isSelected && <Check size={11} className="text-white shrink-0" />}
                                </div>
                                <span className={`text-[8px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-400'}`}>
                                    {opt.desc}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Special Packaging & Protection Badges */}
            <div className="bg-white dark:bg-[#1C2620] border border-[#E2DCCE] dark:border-[#2C5E3B]/25 rounded-2xl p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-white/5">
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert size={13} className="text-amber-600 dark:text-amber-400" />
                        {t('warehouse.packingOptions') || 'Protection & Directives'}
                    </span>
                    <span className="text-[9px] font-mono text-stone-400 font-bold">Printed on Label</span>
                </div>

                <div className="space-y-1.5">
                    {/* 1. Fragile Stickers Toggle */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, fragileStickers: !packingMaterials.fragileStickers })}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            packingMaterials.fragileStickers
                                ? 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-300'
                                : 'bg-stone-50/60 dark:bg-white/[0.02] border-stone-200/60 dark:border-white/5 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.fragileStickers ? 'bg-red-500 text-white' : 'bg-stone-200/60 dark:bg-white/10 text-stone-500'
                            }`}>
                                <Tag size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-black uppercase leading-tight truncate">{t('warehouse.packing.fragile') || 'Fragile Handling'}</p>
                                <span className="text-[9px] text-stone-400 font-bold block truncate">Glass / delicate items seal</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.fragileStickers ? 'bg-red-600 border-red-600 text-white' : 'border-stone-300 dark:border-white/20'
                        }`}>
                            {packingMaterials.fragileStickers && <Check size={11} />}
                        </div>
                    </button>

                    {/* 2. Bubble Wrap Toggle */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, bubbleWrap: !packingMaterials.bubbleWrap })}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            packingMaterials.bubbleWrap
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300'
                                : 'bg-stone-50/60 dark:bg-white/[0.02] border-stone-200/60 dark:border-white/5 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.bubbleWrap ? 'bg-amber-500 text-white' : 'bg-stone-200/60 dark:bg-white/10 text-stone-500'
                            }`}>
                                <Layers size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-black uppercase leading-tight truncate">{t('warehouse.packing.bubbleWrap') || 'Bubble Wrap'}</p>
                                <span className="text-[9px] text-stone-400 font-bold block truncate">Multi-layer shock cushion</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.bubbleWrap ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300 dark:border-white/20'
                        }`}>
                            {packingMaterials.bubbleWrap && <Check size={11} />}
                        </div>
                    </button>

                    {/* 3. This Side Up Toggle */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, thisSideUp: !packingMaterials.thisSideUp })}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            packingMaterials.thisSideUp
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-300'
                                : 'bg-stone-50/60 dark:bg-white/[0.02] border-stone-200/60 dark:border-white/5 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.thisSideUp ? 'bg-blue-600 text-white' : 'bg-stone-200/60 dark:bg-white/10 text-stone-500'
                            }`}>
                                <ArrowUp size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-black uppercase leading-tight truncate">This Side Up ⬆️</p>
                                <span className="text-[9px] text-stone-400 font-bold block truncate">Keep upright orientation</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.thisSideUp ? 'bg-blue-600 border-blue-600 text-white' : 'border-stone-300 dark:border-white/20'
                        }`}>
                            {packingMaterials.thisSideUp && <Check size={11} />}
                        </div>
                    </button>

                    {/* 4. Security Tape / Seal Toggle */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, securitySeal: !packingMaterials.securitySeal })}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            packingMaterials.securitySeal
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-300'
                                : 'bg-stone-50/60 dark:bg-white/[0.02] border-stone-200/60 dark:border-white/5 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.securitySeal ? 'bg-purple-600 text-white' : 'bg-stone-200/60 dark:bg-white/10 text-stone-500'
                            }`}>
                                <Lock size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-black uppercase leading-tight truncate">Security Tamper Tape</p>
                                <span className="text-[9px] text-stone-400 font-bold block truncate">Anti-theft void seal</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.securitySeal ? 'bg-purple-600 border-purple-600 text-white' : 'border-stone-300 dark:border-white/20'
                        }`}>
                            {packingMaterials.securitySeal && <Check size={11} />}
                        </div>
                    </button>

                    {/* 5. Ice Packs / Cold Chain Toggle */}
                    <button
                        type="button"
                        onClick={() => setHasIcePack(!hasIcePack)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            hasIcePack || boxSize === 'Thermal Cool Box'
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-900 dark:text-cyan-300'
                                : 'bg-stone-50/60 dark:bg-white/[0.02] border-stone-200/60 dark:border-white/5 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                hasIcePack || boxSize === 'Thermal Cool Box' ? 'bg-cyan-500 text-white' : 'bg-stone-200/60 dark:bg-white/10 text-stone-500'
                            }`}>
                                <Snowflake size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-black uppercase leading-tight truncate">{t('warehouse.packing.icePacks') || 'Ice Packs / Chilled'}</p>
                                <span className="text-[9px] text-stone-400 font-bold block truncate">Cold chain preservation</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            hasIcePack || boxSize === 'Thermal Cool Box' ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-stone-300 dark:border-white/20'
                        }`}>
                            {(hasIcePack || boxSize === 'Thermal Cool Box') && <Check size={11} />}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
