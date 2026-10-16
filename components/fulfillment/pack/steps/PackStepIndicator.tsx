import React from 'react';
import { Package, Box, Scale, CheckCircle, Check } from 'lucide-react';

export type PackStep = 'ITEMS' | 'BOX' | 'WEIGH' | 'FINISH';

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
    const steps: Array<{
        id: PackStep;
        stepNum: number;
        label: string;
        sublabel: string;
        icon: React.ComponentType<{ size?: number; className?: string }>;
        isComplete: boolean;
    }> = [
        {
            id: 'ITEMS',
            stepNum: 1,
            label: t('warehouse.packing.stepItems') || 'Pack Items',
            sublabel: isFullyPacked ? 'Verified' : 'Scan & Verify',
            icon: Package,
            isComplete: isFullyPacked,
        },
        {
            id: 'BOX',
            stepNum: 2,
            label: t('warehouse.packing.stepBox') || 'Carton & Prep',
            sublabel: hasBoxSelected ? 'Selected' : 'Box Size & Care',
            icon: Box,
            isComplete: hasBoxSelected,
        },
        {
            id: 'WEIGH',
            stepNum: 3,
            label: t('warehouse.packing.stepWeigh') || 'Weigh & Seal',
            sublabel: hasWeightEntered ? 'Audited' : 'Scale & Security',
            icon: Scale,
            isComplete: hasWeightEntered,
        },
        {
            id: 'FINISH',
            stepNum: 4,
            label: t('warehouse.packing.stepFinish') || 'Label & Handover',
            sublabel: 'Print & Seal',
            icon: CheckCircle,
            isComplete: false,
        },
    ];

    return (
        <div className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] px-3 py-2 md:px-6 md:py-3 shrink-0">
            <div className="grid grid-cols-4 gap-1.5 md:gap-3 max-w-4xl mx-auto">
                {steps.map((st, idx) => {
                    const isActive = currentStep === st.id;
                    const IconComponent = st.icon;

                    return (
                        <button
                            key={st.id}
                            type="button"
                            onClick={() => setStep(st.id)}
                            className={`min-h-[44px] py-1.5 px-2 md:py-2 md:px-3 rounded-xl border flex items-center gap-2 md:gap-3 transition-colors cursor-pointer text-left touch-manipulation ${
                                isActive
                                    ? 'bg-[var(--theme-bg-card)] border-[var(--theme-accent)] shadow-sm'
                                    : st.isComplete
                                        ? 'bg-[var(--theme-bg-card)]/60 border-green-500/30 hover:border-green-500/50'
                                        : 'bg-[var(--theme-bg-card)]/40 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30'
                            }`}
                        >
                            {/* Step Badge */}
                            <div
                                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 font-mono font-bold text-xs transition-colors ${
                                    isActive
                                        ? 'bg-[var(--theme-accent)] text-white'
                                        : st.isComplete
                                            ? 'bg-green-600 text-white'
                                            : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                }`}
                            >
                                {st.isComplete && !isActive ? (
                                    <Check size={14} className="stroke-[2.5]" />
                                ) : (
                                    <IconComponent size={14} />
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
                                    className={`text-[11px] font-bold uppercase truncate block ${
                                        isActive
                                            ? 'text-[var(--theme-text-primary)]'
                                            : 'text-[var(--theme-text-secondary)]'
                                    }`}
                                >
                                    {st.label.split(' ')[0]}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
