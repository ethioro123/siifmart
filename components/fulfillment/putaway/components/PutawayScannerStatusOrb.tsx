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
            className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-3xl sm:rounded-[2rem] border-3 sm:border-4 flex items-center justify-center mb-3 sm:mb-4 shadow-lg transition-all duration-500 shrink-0 ${
                showSuccess
                    ? 'border-emerald-400 bg-emerald-400/20 shadow-emerald-500/30 scale-105'
                    : showError
                    ? 'border-rose-500 bg-rose-500/20 shadow-rose-500/30 scale-105 animate-shake'
                    : step === 'LOCATION'
                    ? 'border-[#2C5E3B] bg-[#2C5E3B]/10 dark:border-[#A9CBA2] dark:bg-[#A9CBA2]/10 shadow-[#2C5E3B]/20'
                    : step === 'ITEM'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20'
                    : 'border-amber-500 bg-amber-500/10 shadow-amber-500/20'
            }`}
        >
            {showSuccess ? (
                <CheckCircle size={36} className="text-emerald-400 animate-bounce" />
            ) : showError ? (
                <AlertTriangle size={36} className="text-rose-500" />
            ) : step === 'LOCATION' ? (
                <MapIcon size={36} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
            ) : (
                <Box size={36} className="text-emerald-500" />
            )}
        </div>
    );
};
