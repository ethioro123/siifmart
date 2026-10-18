import React from 'react';
import { Route, Package, CheckCircle, Check, Lock } from 'lucide-react';

export type PickStep = 'ROUTE' | 'COLLECT' | 'STAGING';

interface PickStepIndicatorProps {
    currentStep: PickStep;
    setStep: (step: PickStep) => void;
    isFullyPicked: boolean;
    t: (key: string) => string;
}

export const PickStepIndicator: React.FC<PickStepIndicatorProps> = ({
    currentStep,
    setStep,
    isFullyPicked,
    t,
}) => {
    const isStepAccessible = (stepId: PickStep): boolean => {
        if (stepId === 'ROUTE' || stepId === 'COLLECT') return true;
        // Non-skippable: All items must be picked and scanned before Staging Handover
        if (stepId === 'STAGING') return isFullyPicked;
        return false;
    };

    const resolveLabel = (key: string, fallback: string) => {
        const val = t(key);
        return !val || val === key || val.startsWith('warehouse.') ? fallback : val;
    };

    const steps: Array<{
        id: PickStep;
        stepNum: number;
        label: string;
        shortLabel: string;
        sublabel: string;
        icon: React.ComponentType<{ size?: number; className?: string }>;
        isComplete: boolean;
    }> = [
        {
            id: 'ROUTE',
            stepNum: 1,
            label: resolveLabel('warehouse.pickRoute', 'Pick Route'),
            shortLabel: 'Route',
            sublabel: 'Optimized Path',
            icon: Route,
            isComplete: true,
        },
        {
            id: 'COLLECT',
            stepNum: 2,
            label: resolveLabel('warehouse.pickItems', 'Collect Items'),
            shortLabel: 'Collect',
            sublabel: isFullyPicked ? 'All Picked' : 'Scan & Verify',
            icon: Package,
            isComplete: isFullyPicked,
        },
        {
            id: 'STAGING',
            stepNum: 3,
            label: resolveLabel('warehouse.stagingHandover', 'Staging Handover'),
            shortLabel: 'Staging',
            sublabel: !isFullyPicked ? 'Locked (Scan All)' : 'Tote & Complete',
            icon: CheckCircle,
            isComplete: false,
        },
    ];

    return (
        <div className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] px-2.5 py-2 md:px-6 md:py-3 shrink-0">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 max-w-3xl mx-auto">
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
                            title={!isAccessible ? 'All items must be picked and verified before staging handover.' : undefined}
                            className={`min-h-[44px] py-1.5 px-2 md:py-2 md:px-3 rounded-xl border flex items-center gap-1.5 sm:gap-2 md:gap-3 transition-colors text-left touch-manipulation overflow-hidden ${
                                !isAccessible
                                    ? 'opacity-40 cursor-not-allowed bg-[var(--theme-bg-card)]/20 border-dashed border-[var(--theme-border)]'
                                    : isActive
                                        ? 'bg-[var(--theme-bg-card)] border-[var(--theme-accent)] shadow-xs cursor-pointer'
                                        : st.isComplete
                                            ? 'bg-[var(--theme-bg-card)]/60 border-green-500/30 hover:border-green-500/50 cursor-pointer'
                                            : 'bg-[var(--theme-bg-card)]/40 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 cursor-pointer'
                            }`}
                        >
                            <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 font-mono font-bold text-xs transition-colors ${
                                    !isAccessible
                                        ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                        : isActive
                                            ? 'bg-[var(--theme-accent)] text-white'
                                            : st.isComplete && st.id === 'COLLECT'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                }`}
                            >
                                {!isAccessible ? (
                                    <Lock size={12} className="opacity-70" />
                                ) : st.isComplete && st.id === 'COLLECT' && !isActive ? (
                                    <Check size={14} className="stroke-[2.5]" />
                                ) : (
                                    <IconComponent size={14} />
                                )}
                            </div>

                            <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-mono font-bold text-[var(--theme-text-secondary)] shrink-0">
                                        0{st.stepNum}
                                    </span>
                                    <p
                                        className={`text-[11px] sm:text-xs font-bold uppercase tracking-tight truncate ${
                                            isActive
                                                ? 'text-[var(--theme-text-primary)]'
                                                : 'text-[var(--theme-text-secondary)]'
                                        }`}
                                    >
                                        <span className="hidden sm:inline">{st.label}</span>
                                        <span className="sm:hidden">{st.shortLabel}</span>
                                    </p>
                                </div>
                                <span className="text-[10px] text-[var(--theme-text-secondary)] truncate hidden md:block">
                                    {st.sublabel}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
