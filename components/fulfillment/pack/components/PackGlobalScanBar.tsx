import React, { useRef, useEffect } from 'react';
import { Loader2, CheckCircle, X, ScanLine } from 'lucide-react';
import { useScanOnly } from '../../../../hooks/useScanOnly';

interface PackGlobalScanBarProps {
    scanInput: string;
    setScanInput: (val: string) => void;
    isScanning: boolean;
    scanSuccess: string;
    scanError: string;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    t: (key: string) => string;
}

export const PackGlobalScanBar: React.FC<PackGlobalScanBarProps> = ({
    scanInput,
    setScanInput,
    isScanning,
    scanSuccess,
    scanError,
    onSubmit,
    t
}) => {
    const scanInputRef = useRef<HTMLInputElement>(null);
    const scanOnlyHandlers = useScanOnly(setScanInput);

    // Auto-focus scan input when component mounts
    useEffect(() => {
        if (scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, []);

    return (
        <div className="px-1 sm:px-4 pb-1.5 sm:pb-4 text-left">
            <form onSubmit={onSubmit} className="relative group">
                <div className={`relative flex items-center gap-2 sm:gap-3 bg-[var(--theme-bg-card)] border sm:border-2 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-3 transition-colors ${
                    scanSuccess
                        ? 'border-green-500/50 bg-green-500/5'
                        : scanError
                            ? 'border-red-500/50 bg-red-500/5'
                            : 'border-[var(--theme-border)] focus-within:border-[var(--theme-accent)] shadow-xs'
                }`}>
                    {isScanning ? (
                        <Loader2 size={16} className="text-[var(--theme-accent)] animate-spin shrink-0 sm:w-[22px] sm:h-[22px]" />
                    ) : scanSuccess ? (
                        <CheckCircle size={16} className="text-green-500 shrink-0 sm:w-[22px] sm:h-[22px]" />
                    ) : scanError ? (
                        <X size={16} className="text-red-500 shrink-0 sm:w-[22px] sm:h-[22px]" />
                    ) : (
                        <ScanLine size={16} className="text-[var(--theme-accent)] shrink-0 sm:w-[22px] sm:h-[22px]" />
                    )}
                    <input
                        ref={scanInputRef}
                        type="text"
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value)}
                        onKeyDown={scanOnlyHandlers.onKeyDown}
                        onPaste={scanOnlyHandlers.onPaste}
                        disabled={isScanning}
                        aria-label={t('warehouse.scanProductBarcode') || 'Scan Product Barcode'}
                        title={t('warehouse.scanProductBarcode') || 'Scan Product Barcode'}
                        className="flex-1 bg-transparent text-[var(--theme-text-primary)] text-xs sm:text-base font-mono tracking-wider outline-none placeholder:text-[var(--theme-text-secondary)] disabled:opacity-50"
                        placeholder={t('warehouse.scanOrderOrJobPrompt') || 'Scan Order, Job #, or SKU...'}
                        autoComplete="off"
                    />
                    {scanInput && (
                        <button
                            type="submit"
                            disabled={isScanning}
                            className="px-3 sm:px-5 py-1.5 sm:py-2.5 min-h-[32px] sm:min-h-[44px] bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-lg sm:rounded-xl font-semibold text-xs uppercase tracking-wider transition-opacity active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {t('warehouse.auxiliary.go')}
                        </button>
                    )}
                </div>
                {/* Status Messages */}
                {(scanSuccess || scanError) && (
                    <div className={`absolute -bottom-5 sm:-bottom-6 left-3 sm:left-4 text-[10px] sm:text-xs font-semibold tracking-wide ${scanSuccess ? 'text-green-500' : 'text-red-500'}`}>
                        {scanSuccess || scanError}
                    </div>
                )}
            </form>
        </div>
    );
};
export default PackGlobalScanBar;
