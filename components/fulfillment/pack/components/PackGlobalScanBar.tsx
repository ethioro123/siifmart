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
        <div className="px-4 pb-4 text-left">
            <form onSubmit={onSubmit} className="relative group">
                <div className={`relative flex items-center gap-3 bg-[var(--theme-bg-card)] border-2 rounded-2xl px-4 py-3 transition-colors ${
                    scanSuccess
                        ? 'border-green-500/50 bg-green-500/5'
                        : scanError
                            ? 'border-red-500/50 bg-red-500/5'
                            : 'border-[var(--theme-border)] focus-within:border-[var(--theme-accent)] shadow-sm'
                }`}>
                    {isScanning ? (
                        <Loader2 size={22} className="text-[var(--theme-accent)] animate-spin shrink-0" />
                    ) : scanSuccess ? (
                        <CheckCircle size={22} className="text-green-500 shrink-0" />
                    ) : scanError ? (
                        <X size={22} className="text-red-500 shrink-0" />
                    ) : (
                        <ScanLine size={22} className="text-[var(--theme-accent)] shrink-0" />
                    )}
                    <input
                        ref={scanInputRef}
                        type="text"
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value)}
                        onKeyDown={scanOnlyHandlers.onKeyDown}
                        onPaste={scanOnlyHandlers.onPaste}
                        disabled={isScanning}
                        aria-label="Scan Product Barcode"
                        title="Scan Product Barcode"
                        className="flex-1 bg-transparent text-[var(--theme-text-primary)] text-base font-mono tracking-wider outline-none placeholder:text-[var(--theme-text-secondary)] disabled:opacity-50"
                        placeholder={t('warehouse.scanBarcode')}
                        autoComplete="off"
                    />
                    {scanInput && (
                        <button
                            type="submit"
                            disabled={isScanning}
                            className="px-5 py-2.5 min-h-[44px] bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-opacity active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {t('warehouse.auxiliary.go')}
                        </button>
                    )}
                </div>
                {/* Status Messages */}
                {(scanSuccess || scanError) && (
                    <div className={`absolute -bottom-6 left-4 text-xs font-semibold tracking-wide ${scanSuccess ? 'text-green-500' : 'text-red-500'}`}>
                        {scanSuccess || scanError}
                    </div>
                )}
            </form>
        </div>
    );
};
export default PackGlobalScanBar;
