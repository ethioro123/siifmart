import React from 'react';
import { Package, Box, Scale, CheckCircle, Check, Lock, FileText } from 'lucide-react';

export type PackStep = 'DETAILS' | 'ITEMS' | 'BOX' | 'WEIGH' | 'FINISH';

interface PackStepIndicatorProps {
    currentStep: PackStep;
    setStep: (step: PackStep) => void;
    isFullyPacked: boolean;
    hasBoxSelected: boolean;
    hasWeightEntered: boolean;
    t: (key: string) => string;
}

export const PackStepIndicator: React.FC<PackStepIndicatorProps> = ({
    currentStep,
    setStep,
    isFullyPacked,
    hasBoxSelected,
    hasWeightEntered,
    t,
}) => {
    const isStepAccessible = (stepId: PackStep): boolean => {
        if (stepId === 'DETAILS' || stepId === 'ITEMS') return true;
        // Non-skippable: All items MUST be verified & scanned before unlocking Box, Weigh, or Finish
        if (stepId === 'BOX') return isFullyPacked;
        if (stepId === 'WEIGH') return isFullyPacked && hasBoxSelected;
        if (stepId === 'FINISH') return isFullyPacked && hasBoxSelected && hasWeightEntered;
        return false;
    };

    const steps: Array<{
        id: PackStep;
        stepNum: number;
        label: string;
        sublabel: string;
        icon: React.ComponentType<{ size?: number; className?: string }>;
        isComplete: boolean;
    }> = [
        {
            id: 'DETAILS',
            stepNum: 1,
            label: t('warehouse.packing.stepDetails') && t('warehouse.packing.stepDetails') !== 'warehouse.packing.stepDetails' ? t('warehouse.packing.stepDetails') : 'Details',
            sublabel: t('warehouse.packing.overviewAndDirectives') || 'Overview & Directives',
            icon: FileText,
            isComplete: true,
        },
        {
            id: 'ITEMS',
            stepNum: 2,
            label: t('warehouse.packing.stepItems') && t('warehouse.packing.stepItems') !== 'warehouse.packing.stepItems' ? t('warehouse.packing.stepItems') : 'Items',
            sublabel: isFullyPacked ? (t('warehouse.packing.verified') || 'Verified') : (t('warehouse.packing.scanRequired') || 'Scan Required'),
            icon: Package,
            isComplete: isFullyPacked,
        },
        {
            id: 'BOX',
            stepNum: 3,
            label: t('warehouse.packing.stepBox') && t('warehouse.packing.stepBox') !== 'warehouse.packing.stepBox' ? t('warehouse.packing.stepBox') : 'Box',
            sublabel: !isFullyPacked ? (t('warehouse.packing.lockedScan') || 'Locked (Scan)') : hasBoxSelected ? (t('warehouse.packing.selected') || 'Selected') : (t('warehouse.packing.boxSizeAndCare') || 'Box Size & Care'),
            icon: Box,
            isComplete: hasBoxSelected,
        },
        {
            id: 'WEIGH',
            stepNum: 4,
            label: t('warehouse.packing.stepWeigh') && t('warehouse.packing.stepWeigh') !== 'warehouse.packing.stepWeigh' ? t('warehouse.packing.stepWeigh') : 'Weigh',
            sublabel: !isFullyPacked || !hasBoxSelected ? (t('warehouse.packing.locked') || 'Locked') : hasWeightEntered ? (t('warehouse.packing.audited') || 'Audited') : (t('warehouse.packing.scaleAndSecurity') || 'Scale & Security'),
            icon: Scale,
            isComplete: hasWeightEntered,
        },
        {
            id: 'FINISH',
            stepNum: 5,
            label: t('warehouse.packing.stepFinish') && t('warehouse.packing.stepFinish') !== 'warehouse.packing.stepFinish' ? t('warehouse.packing.stepFinish') : 'Finish',
            sublabel: !isFullyPacked ? (t('warehouse.packing.locked') || 'Locked') : (t('warehouse.packing.printAndSeal') || 'Print & Seal'),
            icon: CheckCircle,
            isComplete: false,
        },
    ];

    return (
        <div className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] px-2 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 shrink-0 overflow-x-auto no-scrollbar">
            <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2.5 max-w-5xl mx-auto min-w-[300px]">
                {steps.map((st) => {
                    const isActive = currentStep === st.id;
                    const isAccessible = isStepAccessible(st.id);
                    const IconComponent = st.icon;

                    return (
                        <button
                            key={st.id}
                            type="button"
                            disabled={!isAccessible}
                            onClick={() => {
                                if (isAccessible) setStep(st.id);
                            }}
                            title={!isAccessible ? 'Scanning and previous steps required before unlocking this step.' : undefined}
                            className={`min-h-[44px] py-1 px-1.5 sm:py-1.5 sm:px-2 md:py-2 md:px-3 rounded-xl border flex items-center justify-center sm:justify-start gap-1 sm:gap-2 md:gap-3 transition-colors text-left touch-manipulation min-w-0 ${
                                !isAccessible
                                    ? 'opacity-40 cursor-not-allowed bg-[var(--theme-bg-card)]/20 border-dashed border-[var(--theme-border)]'
                                    : isActive
                                        ? 'bg-[var(--theme-bg-card)] border-[var(--theme-accent)] shadow-sm cursor-pointer'
                                        : st.isComplete
                                            ? 'bg-[var(--theme-bg-card)]/60 border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] cursor-pointer'
                                            : 'bg-[var(--theme-bg-card)]/40 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 cursor-pointer'
                            }`}
                        >
                            {/* Step Badge */}
                            <div
                                className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 font-mono font-bold text-[10px] sm:text-xs transition-colors ${
                                    !isAccessible
                                        ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                        : isActive
                                            ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)]'
                                            : st.isComplete
                                                ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-text-primary)]'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                }`}
                            >
                                {!isAccessible ? (
                                    <Lock size={11} className="opacity-70" />
                                ) : st.isComplete && !isActive ? (
                                    <Check size={12} className="stroke-[2.5]" />
                                ) : (
                                    <IconComponent size={12} />
                                )}
                            </div>

                            {/* Step Labels */}
                            <div className="min-w-0 hidden sm:block flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-semibold text-[var(--theme-text-secondary)]">
                                        0{st.stepNum}
                                    </span>
                                    <p
                                        className={`text-xs font-semibold uppercase tracking-tight truncate ${
                                            isActive
                                                ? 'text-[var(--theme-text-primary)]'
                                                : 'text-[var(--theme-text-secondary)]'
                                        }`}
                                    >
                                        {st.label}
                                    </p>
                                </div>
                                <span className="text-[10px] text-[var(--theme-text-secondary)] truncate block">
                                    {st.sublabel}
                                </span>
                            </div>

                            {/* Mobile-only compact step number */}
                            <div className="sm:hidden min-w-0 flex-1">
                                <span
                                    className={`text-[10px] font-bold uppercase truncate block leading-tight ${
                                        isActive
                                            ? 'text-[var(--theme-text-primary)]'
                                            : 'text-[var(--theme-text-secondary)]'
                                    }`}
                                >
                                    {st.label}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
