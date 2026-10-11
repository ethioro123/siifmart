import React from 'react';
import { Box, Snowflake, Layers, Tag, Check, ShieldAlert, ArrowUp, Lock, Mail, ThermometerSnowflake, Scale, AlertTriangle } from 'lucide-react';
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
    sealSerialNumber?: string;
    setSealSerialNumber?: (serial: string) => void;
    scaleWeight?: string;
    setScaleWeight?: (weight: string) => void;
    requireSeal?: boolean;
    requireWeight?: boolean;
    expectedWeightKg?: number;
    weightTolerancePct?: number;
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
    sealSerialNumber,
    setSealSerialNumber,
    scaleWeight,
    setScaleWeight,
    requireSeal,
    requireWeight,
    expectedWeightKg,
    weightTolerancePct,
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
        <div className="w-full lg:w-84 flex flex-col gap-3.5 shrink-0 p-3.5 lg:p-4 border-t lg:border-t-0 lg:border-l border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
            {/* Box Specification Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--theme-border)]">
                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Box size={14} className="text-[var(--theme-accent)]" />
                        {t('warehouse.boxSize') || 'Container Selection'}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-md">
                        {boxSize}
                    </span>
                </div>

                {/* Segmented Container Grid */}
                <div className="grid grid-cols-2 gap-2">
                    {boxOptions.map((opt) => {
                        const isSelected = boxSize === opt.size;
                        return (
                            <button
                                key={opt.size}
                                type="button"
                                onClick={() => setBoxSize(opt.size)}
                                className={`min-h-[48px] p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                        ? 'bg-[var(--theme-accent)] text-white border-[var(--theme-accent)] shadow-sm'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:border-[var(--theme-accent)]/40'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-semibold font-mono uppercase ${isSelected ? 'text-white' : 'text-[var(--theme-text-primary)]'}`}>
                                        {opt.code} · {opt.label}
                                    </span>
                                    {isSelected && <Check size={12} className="text-white shrink-0" />}
                                </div>
                                <span className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[var(--theme-text-secondary)]'}`}>
                                    {opt.desc}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Special Packaging & Protection Badges */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--theme-border)]">
                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-amber-500" />
                        {t('warehouse.packingOptions') || 'Protection & Directives'}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] font-medium">Printed on Label</span>
                </div>

                <div className="space-y-2">
                    {/* 1. Fragile Stickers Toggle */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, fragileStickers: !packingMaterials.fragileStickers })}
                        className={`w-full min-h-[48px] p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                            packingMaterials.fragileStickers
                                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.fragileStickers ? 'bg-red-500 text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <Tag size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase leading-tight truncate text-[var(--theme-text-primary)]">{t('warehouse.packing.fragile') || 'Fragile Handling'}</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">Glass / delicate items seal</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.fragileStickers ? 'bg-red-600 border-red-600 text-white' : 'border-[var(--theme-border)]'
                        }`}>
                            {packingMaterials.fragileStickers && <Check size={11} />}
                        </div>
                    </button>

                    {/* 2. Bubble Wrap Toggle */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, bubbleWrap: !packingMaterials.bubbleWrap })}
                        className={`w-full min-h-[48px] p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                            packingMaterials.bubbleWrap
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.bubbleWrap ? 'bg-amber-500 text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <Layers size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase leading-tight truncate text-[var(--theme-text-primary)]">{t('warehouse.packing.bubbleWrap') || 'Bubble Wrap'}</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">Multi-layer shock cushion</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.bubbleWrap ? 'bg-amber-600 border-amber-600 text-white' : 'border-[var(--theme-border)]'
                        }`}>
                            {packingMaterials.bubbleWrap && <Check size={11} />}
                        </div>
                    </button>

                    {/* 3. This Side Up Toggle (NO EMOJI) */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, thisSideUp: !packingMaterials.thisSideUp })}
                        className={`w-full min-h-[48px] p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                            packingMaterials.thisSideUp
                                ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/30 text-[var(--theme-accent)]'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.thisSideUp ? 'bg-[var(--theme-accent)] text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <ArrowUp size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase leading-tight truncate text-[var(--theme-text-primary)]">This Side Up</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">Keep upright orientation</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.thisSideUp ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white' : 'border-[var(--theme-border)]'
                        }`}>
                            {packingMaterials.thisSideUp && <Check size={11} />}
                        </div>
                    </button>

                    {/* 4. Security Tape / Seal Toggle */}
                    <button
                        type="button"
                        onClick={() => setPackingMaterials({ ...packingMaterials, securitySeal: !packingMaterials.securitySeal })}
                        className={`w-full min-h-[48px] p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                            packingMaterials.securitySeal
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                packingMaterials.securitySeal ? 'bg-purple-600 text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <Lock size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase leading-tight truncate text-[var(--theme-text-primary)]">Security Tamper Tape</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">Anti-theft void seal</span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            packingMaterials.securitySeal ? 'bg-purple-600 border-purple-600 text-white' : 'border-[var(--theme-border)]'
                        }`}>
                            {packingMaterials.securitySeal && <Check size={11} />}
                        </div>
                    </button>

                    {/* Security Seal Serial Input */}
                    {packingMaterials.securitySeal && (
                        <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1.5">
                            <label className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 flex items-center justify-between uppercase">
                                <span className="flex items-center gap-1.5"><Lock size={12} /> Seal Serial Number</span>
                                {requireSeal && <span className="text-[11px] text-red-500 font-mono font-semibold">Required</span>}
                            </label>
                            <input
                                type="text"
                                placeholder="Scan or type seal serial (e.g. SEAL-8921)..."
                                value={sealSerialNumber || ''}
                                onChange={(e) => setSealSerialNumber?.(e.target.value)}
                                className="w-full bg-[var(--theme-bg-card)] border border-purple-300 dark:border-purple-500/30 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none uppercase min-h-[44px]"
                            />
                        </div>
                    )}

                    {/* 5. Ice Packs / Cold Chain Toggle */}
                    <button
                        type="button"
                        onClick={() => setHasIcePack(!hasIcePack)}
                        className={`w-full min-h-[48px] p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                            hasIcePack || boxSize === 'Thermal Cool Box'
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                hasIcePack || boxSize === 'Thermal Cool Box' ? 'bg-cyan-500 text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                <Snowflake size={13} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-semibold uppercase leading-tight truncate text-[var(--theme-text-primary)]">{t('warehouse.packing.icePacks') || 'Ice Packs / Chilled'}</p>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] block truncate">Cold chain preservation</span>
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

            {/* Carton Scale Weight Verification Card */}
            {(requireWeight || (expectedWeightKg !== undefined && expectedWeightKg > 0)) && (
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[var(--theme-border)]">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <Scale size={14} className="text-[var(--theme-accent)]" />
                            Scale Weight Verification {requireWeight && <span className="text-red-500">*</span>}
                        </span>
                        {expectedWeightKg !== undefined && expectedWeightKg > 0 && (
                            <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] font-semibold">
                                Exp: {expectedWeightKg.toFixed(2)} kg
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            step="0.05"
                            min="0"
                            placeholder="0.00"
                            value={scaleWeight || ''}
                            onChange={(e) => setScaleWeight?.(e.target.value)}
                            className="flex-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2 px-3 text-center font-mono font-semibold text-sm text-[var(--theme-text-primary)] outline-none min-h-[44px]"
                        />
                        <span className="text-xs font-bold font-mono text-[var(--theme-text-secondary)]">KG</span>
                    </div>

                    {/* Weight Tolerance Calculation */}
                    {(() => {
                        const actual = parseFloat(scaleWeight || '0');
                        if (!actual || !expectedWeightKg) return null;
                        const diff = Math.abs(actual - expectedWeightKg);
                        const diffPct = (diff / expectedWeightKg) * 100;
                        const tol = weightTolerancePct || 5;
                        const isExceeded = diffPct > tol;

                        if (isExceeded) {
                            return (
                                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <AlertTriangle size={14} className="shrink-0" />
                                    <span>Weight variance {diffPct.toFixed(1)}% exceeds ±{tol}% tolerance</span>
                                </div>
                            );
                        }
                        return (
                            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-[11px] text-green-700 dark:text-green-400 flex items-center gap-1.5 font-semibold">
                                <Check size={14} className="shrink-0" />
                                <span>Weight verified within ±{tol}% (±{diffPct.toFixed(1)}%)</span>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};
