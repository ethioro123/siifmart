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
                <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500 ${scanSuccess ? 'bg-green-500/20 opacity-100' : scanError ? 'bg-red-500/20 opacity-100' : 'bg-[#2C5E3B]/10 opacity-0 group-focus-within:opacity-100'}`} />
                <div className={`relative flex items-center gap-3 bg-gray-55 dark:bg-black/60 border-2 rounded-2xl px-5 py-4 transition-all duration-300 ${scanSuccess ? 'border-green-500/50 bg-green-500/5' : scanError ? 'border-red-500/50 bg-red-500/5' : 'border-gray-200 dark:border-white/10 focus-within:border-cyan-500 shadow-sm'}`}>
                    {isScanning ? (
                        <Loader2 size={22} className="text-[#A9CBA2] animate-spin shrink-0" />
                    ) : scanSuccess ? (
                        <CheckCircle size={22} className="text-green-400 shrink-0" />
                    ) : scanError ? (
                        <X size={22} className="text-red-400 shrink-0" />
                    ) : (
                        <ScanLine size={22} className="text-[#A9CBA2] shrink-0" />
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
                        className="flex-1 bg-transparent text-gray-900 dark:text-white text-lg font-mono tracking-wider outline-none placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-50"
                        placeholder={t('warehouse.scanBarcode')}
                        autoComplete="off"
                    />
                    {scanInput && (
                        <button
                            type="submit"
                            disabled={isScanning}
                            className="px-5 py-2 bg-[#2C5E3B] hover:bg-[#3a7a4d] text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {t('warehouse.auxiliary.go')}
                        </button>
                    )}
                </div>
                {/* Status Messages */}
                {(scanSuccess || scanError) && (
                    <div className={`absolute -bottom-7 left-5 text-xs font-bold tracking-wide ${scanSuccess ? 'text-green-400' : 'text-red-400'}`}>
                        {scanSuccess || scanError}
                    </div>
                )}
            </form>
        </div>
    );
};
export default PackGlobalScanBar;
