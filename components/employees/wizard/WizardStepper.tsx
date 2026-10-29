import React from 'react';
import { CheckCircle } from 'lucide-react';

interface WizardStepperProps {
    currentStep: number;
    steps: string[];
}

export default function WizardStepper({ currentStep, steps }: WizardStepperProps) {
    const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

    return (
        <div className="relative mb-6 px-2 sm:px-6">
            <div className="flex justify-between items-center relative z-10">
                {steps.map((label, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;

                    return (
                        <div key={label} className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                    isCurrent
                                        ? 'bg-[var(--theme-primary)] text-[var(--theme-text-primary)] ring-4 ring-[var(--theme-status-success-border)] shadow-md scale-110'
                                        : isCompleted
                                            ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-text-primary)]'
                                            : 'bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]'
                                }`}
                            >
                                {isCompleted ? <CheckCircle size={15} /> : stepNum}
                            </div>
                            <span
                                className={`text-[10px] mt-1.5 uppercase font-bold tracking-wider hidden sm:block ${
                                    isCurrent
                                        ? 'text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]'
                                        : isCompleted
                                            ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'
                                            : 'text-[var(--theme-text-muted)]'
                                }`}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Connecting Progress Track */}
            <div className="absolute top-4 left-6 right-6 sm:left-10 sm:right-10 h-0.5 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] -z-0">
                <div
                    className="h-full bg-gradient-to-r from-[var(--theme-status-success)] to-[var(--theme-primary)] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
}
