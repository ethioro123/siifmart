import React from 'react';
import { Scale, Lock, Check, AlertTriangle, Sparkles, Hash } from 'lucide-react';

interface Step3WeighSealProps {
    scaleWeight: string;
    setScaleWeight: (val: string) => void;
    expectedWeightKg: number;
    weightTolerancePct: number;
    requireWeight: boolean;
    requireSeal: boolean;
    packingMaterials: { securitySeal: boolean };
    sealSerialNumber: string;
    setSealSerialNumber: (val: string) => void;
    boxSize: string;
    t: (key: string) => string;
}

export const Step3WeighSeal: React.FC<Step3WeighSealProps> = ({
    scaleWeight,
    setScaleWeight,
    expectedWeightKg,
    weightTolerancePct,
    requireWeight,
    requireSeal,
    packingMaterials,
    sealSerialNumber,
    setSealSerialNumber,
    boxSize,
    t,
}) => {
    const actualWeightNum = parseFloat(scaleWeight || '0');
    const hasWeight = actualWeightNum > 0;
    const diff = Math.abs(actualWeightNum - (expectedWeightKg || 1));
    const diffPct = (diff / (expectedWeightKg || 1)) * 100;
    const tol = weightTolerancePct || 5;
    const isExceeded = hasWeight && diffPct > tol;

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 bg-[var(--theme-bg-app)]">
            {/* Scale Weight Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center">
                            <Scale size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--theme-text-primary)]">
                                {t('warehouse.packing.scaleWeightVerification') || 'Scale Weight Verification'}
                            </h3>
                            <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                {t('warehouse.packing.placeCartonOnScale') || 'Place packed carton onto packing bench scale'}
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] block uppercase">
                            {t('warehouse.packing.expectedGrossWeight') || 'Expected Gross Weight'}
                        </span>
                        <span className="text-sm md:text-base font-mono font-bold text-[var(--theme-text-primary)]">
                            {expectedWeightKg.toFixed(2)} kg
                        </span>
                    </div>
                </div>

                {/* Weight Input Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            step="0.05"
                            min="0"
                            inputMode="decimal"
                            aria-label={t('warehouse.packing.scaleGrossWeight') || 'Scale gross weight'}
                            placeholder="0.00"
                            value={scaleWeight}
                            onChange={(e) => setScaleWeight(e.target.value)}
                            className="w-full bg-[var(--theme-bg-subtle)] border-2 border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-2xl py-3 px-4 text-center font-mono font-bold text-2xl md:text-3xl text-[var(--theme-text-primary)] outline-none min-h-[56px] transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--theme-text-secondary)]">
                            KG
                        </span>
                    </div>


                </div>

                {/* Tolerance Status Gauge */}
                {hasWeight && (
                    <div className="animate-in fade-in">
                        {isExceeded ? (
                            <div className="p-3 rounded-xl bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-xs text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] flex items-center gap-2.5">
                                <AlertTriangle size={18} className="shrink-0" />
                                <div>
                                    <p className="font-bold uppercase tracking-tight">
                                        Weight variance {diffPct.toFixed(1)}% exceeds ±{tol}% tolerance threshold
                                    </p>
                                    <span className="text-[11px] opacity-80">
                                        Verify if carton items or padding differ from manifest before sealing.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-xs text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center gap-2.5 font-semibold">
                                <Check size={18} className="shrink-0 text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]" />
                                <div>
                                    <p className="font-bold uppercase tracking-tight">
                                        Scale weight verified within ±{tol}% tolerance (Variance: ±{diffPct.toFixed(1)}%)
                                    </p>
                                    <span className="text-[11px] opacity-80 font-normal">
                                        Weight checks out perfectly against expected cargo tare.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tamper Seal Serial Number Card */}
            {(packingMaterials.securitySeal || requireSeal) && (
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 md:p-6 shadow-sm space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Lock size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--theme-text-primary)]">
                                    {t('warehouse.packing.securityTamperTape') || 'Security Tamper Seal'}
                                </h3>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    {t('warehouse.packing.affixTamperSeal') || 'Affix anti-theft void seal tape and record serial number'}
                                </span>
                            </div>
                        </div>

                        {requireSeal && (
                            <span className="px-2.5 py-1 rounded-md bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-xs font-bold font-mono text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] uppercase">
                                {t('warehouse.packing.mandatoryPolicy') || 'Mandatory Policy'}
                            </span>
                        )}
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            aria-label={t('warehouse.packing.sealSerialNumber') || 'Tamper seal serial number'}
                            placeholder={t('warehouse.packing.scanSealSerialPrompt') || 'Scan or type seal serial (e.g. SEAL-8921)...'}
                            value={sealSerialNumber}
                            onChange={(e) => setSealSerialNumber(e.target.value)}
                            className="w-full bg-[var(--theme-bg-subtle)] border-2 border-[var(--theme-border)] focus:border-purple-500 rounded-2xl py-3 pl-10 pr-4 font-mono font-bold text-sm md:text-base text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] uppercase outline-none min-h-[50px] transition-colors"
                        />
                        <Hash size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>
            )}

        </div>
    );
};
