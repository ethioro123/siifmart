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
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : showError
                    ? 'border-rose-500 bg-rose-500/10 animate-shake'
                    : step === 'LOCATION'
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                    : step === 'ITEM'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-amber-500 bg-amber-500/10'
            }`}
        >
            {showSuccess ? (
                <CheckCircle size={22} className="text-emerald-500 sm:w-8 sm:h-8" />
            ) : showError ? (
                <AlertTriangle size={22} className="text-rose-500 sm:w-8 sm:h-8" />
            ) : step === 'LOCATION' ? (
                <MapIcon size={22} className="text-[var(--theme-accent)] sm:w-8 sm:h-8" />
            ) : (
                <Box size={22} className="text-emerald-500 sm:w-8 sm:h-8" />
            )}
        </div>
    );
};
