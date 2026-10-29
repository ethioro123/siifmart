import React from 'react';
import { Package, MapPin, CheckCircle, Check, Lock } from 'lucide-react';

export type PutawayStep = 'INTAKE' | 'SLOTTING' | 'PLACEMENT';

interface PutawayStepIndicatorProps {
    currentStep: PutawayStep;
    setStep: (step: PutawayStep) => void;
    isFullySlotted: boolean;
    t: (key: string) => string;
}

export const PutawayStepIndicator: React.FC<PutawayStepIndicatorProps> = ({
    currentStep,
    setStep,
    isFullySlotted,
    t,
}) => {
    const label = (key: string, fallback: string) => { const value = t(key); return value && value !== key ? value : fallback; };
    const isStepAccessible = (stepId: PutawayStep): boolean => {
        if (stepId === 'INTAKE' || stepId === 'SLOTTING') return true;
        // Non-skippable: All items must be scanned into destination bins before Shelf Placement Lock
        if (stepId === 'PLACEMENT') return isFullySlotted;
        return false;
    };

    const steps: Array<{
        id: PutawayStep;
        stepNum: number;
        label: string;
        sublabel: string;
        icon: React.ComponentType<{ size?: number; className?: string }>;
        isComplete: boolean;
    }> = [
        {
            id: 'INTAKE',
            stepNum: 1,
            label: label('warehouse.putaway.inboundIntake', 'Cargo Intake'),
            sublabel: label('warehouse.putaway.stagingAndOrigin', 'Staging & Origin'),
            icon: Package,
            isComplete: true,
        },
        {
            id: 'SLOTTING',
            stepNum: 2,
            label: label('warehouse.putaway.binSlotting', 'Bin Routing'),
            sublabel: isFullySlotted ? label('warehouse.putaway.allSlotted', 'All Slotted') : label('warehouse.putaway.scanAndSlot', 'Scan & Slot'),
            icon: MapPin,
            isComplete: isFullySlotted,
        },
        {
            id: 'PLACEMENT',
            stepNum: 3,
            label: label('warehouse.putaway.shelfLock', 'Review completion'),
            sublabel: !isFullySlotted ? label('warehouse.putaway.lockedSlotAll', 'Locked (Slot All)') : label('warehouse.putaway.verifyAndStock', 'Verify & Stock'),
            icon: CheckCircle,
            isComplete: false,
        },
    ];

    return (
        <div className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] px-3 py-2 md:px-6 md:py-3 shrink-0">
            <div className="grid grid-cols-3 gap-2 md:gap-3 max-w-3xl mx-auto">
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
                            title={!isAccessible ? label('warehouse.putaway.slotAllVerifiedPrompt', 'All items must be slotted and verified before shelf placement lock.') : undefined}
                            className={`min-h-[44px] py-1.5 px-2 md:py-2 md:px-3 rounded-xl border flex items-center gap-2 md:gap-3 transition-colors text-left touch-manipulation ${
                                !isAccessible
                                    ? 'opacity-40 cursor-not-allowed bg-[var(--theme-bg-card)]/20 border-dashed border-[var(--theme-border)]'
                                    : isActive
                                        ? 'bg-[var(--theme-bg-card)] border-[var(--theme-accent)] shadow-sm cursor-pointer'
                                        : st.isComplete
                                            ? 'bg-[var(--theme-bg-card)]/60 border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] cursor-pointer'
                                            : 'bg-[var(--theme-bg-card)]/40 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 cursor-pointer'
                            }`}
                        >
                            <div
                                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 font-mono font-bold text-xs transition-colors ${
                                    !isAccessible
                                        ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                        : isActive
                                            ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)]'
                                            : st.isComplete && st.id === 'SLOTTING'
                                                ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-text-primary)]'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                }`}
                            >
                                {!isAccessible ? (
                                    <Lock size={12} className="opacity-70" />
                                ) : st.isComplete && st.id === 'SLOTTING' && !isActive ? (
                                    <Check size={14} className="stroke-[2.5]" />
                                ) : (
                                    <IconComponent size={14} />
                                )}
                            </div>

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
