import React from 'react';
import { Box, Snowflake, Layers, Tag, Check, ShieldAlert, ArrowUp, Lock, Sparkles } from 'lucide-react';
import { WMSJob } from '../../../../types';

export type BoxSizeType = 'Small' | 'Medium' | 'Large' | 'Extra Large' | 'Poly Mailer' | 'Thermal Cool Box';

export interface PackingMaterialsState {
    bubbleWrap: boolean;
    fragileStickers: boolean;
    thisSideUp: boolean;
    securitySeal: boolean;
}

interface Step2BoxPrepProps {
    job: WMSJob;
    boxSize: BoxSizeType;
    setBoxSize: (size: BoxSizeType) => void;
    recommendedBoxSize: BoxSizeType;
    hasColdItems: boolean | undefined;
    hasFragileItems: boolean | undefined;
    packingMaterials: PackingMaterialsState;
    setPackingMaterials: (materials: PackingMaterialsState) => void;
    hasIcePack: boolean;
    setHasIcePack: (val: boolean) => void;
    expectedWeightKg: number;
    t: (key: string) => string;
}

export const Step2BoxPrep: React.FC<Step2BoxPrepProps> = ({
    job,
    boxSize,
    setBoxSize,
    recommendedBoxSize,
    hasColdItems,
    hasFragileItems,
    packingMaterials,
    setPackingMaterials,
    hasIcePack,
    setHasIcePack,
    expectedWeightKg,
    t,
}) => {
    const boxOptions: Array<{ size: BoxSizeType; label: string; code: string; desc: string }> = [
        { size: 'Small', label: 'Small Box', code: 'SM', desc: 'Up to 2kg' },
        { size: 'Medium', label: 'Medium Box', code: 'MD', desc: 'Up to 8kg' },
        { size: 'Large', label: 'Large Box', code: 'LG', desc: 'Up to 20kg' },
        { size: 'Extra Large', label: 'X-Large', code: 'XL', desc: 'Bulk Cargo' },
        { size: 'Poly Mailer', label: 'Poly Mailer', code: 'BAG', desc: 'Soft Goods' },
        { size: 'Thermal Cool Box', label: 'Cool Box', code: 'ICE', desc: 'Insulated' },
    ];

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 bg-[var(--theme-bg-app)]">
            {/* Smart Carton Recommendation Banner */}
            <div className="p-3.5 md:p-4 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)] text-white flex items-center justify-center shrink-0">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-accent)]">
                                {t('warehouse.packing.smartRecommendation') || 'Smart Recommendation'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[11px] font-mono font-semibold text-[var(--theme-text-primary)]">
                                Est. {expectedWeightKg.toFixed(2)} kg
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            {t('warehouse.packing.suggestedContainer') || 'Suggested container'}:{' '}
                            <strong className="text-[var(--theme-text-primary)] font-bold">{recommendedBoxSize}</strong>
                            {hasColdItems && ' · Cold chain item detected (Cool Box & Ice recommended)'}
                            {hasFragileItems && ' · Delicate item detected (Bubble wrap recommended)'}
                        </p>
                    </div>
                </div>

                {boxSize !== recommendedBoxSize && (
                    <button
                        type="button"
                        onClick={() => {
                            setBoxSize(recommendedBoxSize);
                            if (hasColdItems) setHasIcePack(true);
                            if (hasFragileItems) {
                                setPackingMaterials({
                                    ...packingMaterials,
                                    bubbleWrap: true,
                                    fragileStickers: true,
                                });
                            }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[var(--theme-accent)] text-white text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity active:scale-95 shrink-0 cursor-pointer touch-manipulation"
                    >
                        {t('warehouse.packing.applySuggested') || 'Apply Suggested'}
                    </button>
                )}
            </div>

            {/* Container Grid */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-2">
                        <Box size={16} className="text-[var(--theme-accent)]" />
                        {t('warehouse.boxSize') || 'Container Selection'}
                    </span>
                    <span className="text-xs font-mono font-bold text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-2.5 py-1 rounded-lg">
                        {t('warehouse.packing.selected') || 'Selected'}: {boxSize}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                    {boxOptions.map((opt) => {
                        const isSelected = boxSize === opt.size;
                        const isRecommended = opt.size === recommendedBoxSize;

                        return (
                            <button
                                key={opt.size}
                                type="button"
                                onClick={() => setBoxSize(opt.size)}
                                className={`min-h-[64px] p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative touch-manipulation ${
                                    isSelected
                                        ? 'bg-[var(--theme-accent)] text-white border-[var(--theme-accent)] shadow-md'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:border-[var(--theme-accent)]/40'
                                }`}
                            >
                                {isRecommended && (
                                    <span className={`absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                                        isSelected
                                            ? 'bg-white text-[var(--theme-accent)] shadow-sm'
                                            : 'bg-[var(--theme-accent)] text-white'
                                    }`}>
                                        {t('warehouse.packing.recommended') || 'Recommended'}
                                    </span>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold font-mono uppercase ${isSelected ? 'text-white' : 'text-[var(--theme-text-primary)]'}`}>
                                        {opt.code} · {opt.label}
                                    </span>
                                    {isSelected && <Check size={14} className="text-white shrink-0" />}
                                </div>
                                <span className={`text-[11px] mt-1 ${isSelected ? 'text-white/80' : 'text-[var(--theme-text-secondary)]'}`}>
                                    {opt.desc}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Protective Materials & Directives */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert size={16} className="text-amber-500" />
                        {t('warehouse.packingOptions') || 'Protection & Directives'}
                    </span>
                    <span className="text-xs font-mono text-[var(--theme-text-secondary)]">{t('warehouse.packing.printedOnShippingLabel') || 'Printed on Shipping Label'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Fragile Handling */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, fragileStickers: !packingMaterials.fragileStickers })}
                        className={`min-h-[52px] p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer touch-manipulation ${
                            packingMaterials.fragileStickers
                                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.fragileStickers ? 'bg-red-500 text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <Tag size={15} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase truncate text-[var(--theme-text-primary)]">{t('warehouse.packing.fragile') || 'Fragile Handling'}</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">{t('warehouse.packing.fragileDesc') || 'Glass / delicate seal'}</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.fragileStickers ? 'bg-red-600 border-red-600 text-white' : 'border-[var(--theme-border)]'
                        }`}>
                            {packingMaterials.fragileStickers && <Check size={11} />}
                        </div>
                    </button>

                    {/* Bubble Wrap */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, bubbleWrap: !packingMaterials.bubbleWrap })}
                        className={`min-h-[52px] p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer touch-manipulation ${
                            packingMaterials.bubbleWrap
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.bubbleWrap ? 'bg-amber-500 text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <Layers size={15} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase truncate text-[var(--theme-text-primary)]">{t('warehouse.packing.bubbleWrap') || 'Bubble Wrap'}</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">{t('warehouse.packing.bubbleWrapDesc') || 'Multi-layer cushion'}</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.bubbleWrap ? 'bg-amber-600 border-amber-600 text-white' : 'border-[var(--theme-border)]'
                        }`}>
                            {packingMaterials.bubbleWrap && <Check size={11} />}
                        </div>
                    </button>

                    {/* This Side Up */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, thisSideUp: !packingMaterials.thisSideUp })}
                        className={`min-h-[52px] p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer touch-manipulation ${
                            packingMaterials.thisSideUp
                                ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/30 text-[var(--theme-accent)]'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.thisSideUp ? 'bg-[var(--theme-accent)] text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <ArrowUp size={15} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase truncate text-[var(--theme-text-primary)]">{t('warehouse.packing.thisSideUp') || 'This Side Up'}</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">{t('warehouse.packing.thisSideUpDesc') || 'Upright orientation'}</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.thisSideUp ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white' : 'border-[var(--theme-border)]'
                        }`}>
                            {packingMaterials.thisSideUp && <Check size={11} />}
                        </div>
                    </button>

                    {/* Security Tamper Tape */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, securitySeal: !packingMaterials.securitySeal })}
                        className={`min-h-[52px] p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer touch-manipulation ${
                            packingMaterials.securitySeal
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.securitySeal ? 'bg-purple-600 text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <Lock size={15} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase truncate text-[var(--theme-text-primary)]">{t('warehouse.packing.securityTamperTape') || 'Security Tamper Tape'}</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">{t('warehouse.packing.securityTamperTapeDesc') || 'Anti-theft void seal'}</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.securitySeal ? 'bg-purple-600 border-purple-600 text-white' : 'border-[var(--theme-border)]'
                        }`}>
                            {packingMaterials.securitySeal && <Check size={11} />}
                        </div>
                    </button>

                    {/* Cold Chain Ice Packs */}
                    <button
                        type="button"
                        onClick={() => setHasIcePack(!hasIcePack)}
                        className={`min-h-[52px] p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer touch-manipulation sm:col-span-2 ${
                            hasIcePack || boxSize === 'Thermal Cool Box'
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                hasIcePack || boxSize === 'Thermal Cool Box' ? 'bg-cyan-500 text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <Snowflake size={15} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase truncate text-[var(--theme-text-primary)]">{t('warehouse.packing.icePacks') || 'Ice Packs / Chilled Preservation'}</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">{t('warehouse.packing.icePacksDesc') || 'Keep cold chain items below critical threshold'}</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            hasIcePack || boxSize === 'Thermal Cool Box' ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-[var(--theme-border)]'
                        }`}>
                            {(hasIcePack || boxSize === 'Thermal Cool Box') && <Check size={11} />}
                        </div>
                    </button>
                </div>
            </div>

        </div>
    );
};
