import React from 'react';
import { Box, CheckCircle, Map as MapIcon, AlertTriangle } from 'lucide-react';

interface PutawayScannerStatusOrbProps {
    showSuccess: boolean;
    showError: boolean;
    step: 'LOCATION' | 'ITEM' | 'QUANTITY';
}

export const PutawayScannerStatusOrb: React.FC<PutawayScannerStatusOrbProps> = ({
    showSuccess,
    showError,
    step,
}) => {
    return (
        <div
            className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center mb-2 sm:mb-4 transition-all duration-300 shrink-0 ${
                showSuccess
                    ? 'border-[var(--theme-status-success-border)] bg-[var(--theme-status-success-bg)]'
                    : showError
                    ? 'border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] animate-shake'
                    : step === 'LOCATION'
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                    : step === 'ITEM'
                    ? 'border-[var(--theme-status-success-border)] bg-[var(--theme-status-success-bg)]'
                    : 'border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)]'
            }`}
        >
            {showSuccess ? (
                <CheckCircle size={22} className="text-[var(--theme-status-success-text)] sm:w-8 sm:h-8" />
            ) : showError ? (
                <AlertTriangle size={22} className="text-[var(--theme-status-danger-text)] sm:w-8 sm:h-8" />
            ) : step === 'LOCATION' ? (
                <MapIcon size={22} className="text-[var(--theme-accent)] sm:w-8 sm:h-8" />
            ) : (
                <Box size={22} className="text-[var(--theme-status-success-text)] sm:w-8 sm:h-8" />
            )}
        </div>
    );
};
