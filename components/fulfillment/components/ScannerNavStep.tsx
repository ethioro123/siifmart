import React from 'react';
import { Map as MapIcon } from 'lucide-react';
import { WMSJob, Product } from '../../../types';

interface ScannerNavStepProps {
    t: (key: string) => string;
    selectedJob: WMSJob;
    currentProduct: Product | null | undefined;
    locationInputRef: React.RefObject<HTMLInputElement | null>;
    locationSearch: string;
    setLocationSearch: (val: string) => void;
    scanOnlyHandlers: {
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    };
    handleLocationScan: (val: string) => void;
}

export const ScannerNavStep: React.FC<ScannerNavStepProps> = ({
    t,
    selectedJob,
    currentProduct,
    locationInputRef,
    locationSearch,
    setLocationSearch,
    scanOnlyHandlers,
    handleLocationScan
}) => {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                    <MapIcon size={36} className="text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase">
                    {selectedJob.type === 'PUTAWAY' ? t('warehouse.selectStorage') : t('warehouse.locateItem')}
                </h1>
                <p className="text-[var(--theme-text-secondary)] text-base">
                    {t('warehouse.goToLocation')}: <span className="text-primary font-mono tabular-nums font-bold text-xl">{currentProduct?.location || 'Unknown'}</span>
                </p>
            </div>

            {/* Location Input */}
            <div className="relative group/input max-w-md mx-auto">
                <input
                    ref={locationInputRef}
                    aria-label="Location Scanner Input"
                    type="text"
                    placeholder="Scan Location Barcode"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                        scanOnlyHandlers.onKeyDown(e);
                        if (e.key === 'Enter') handleLocationScan(locationSearch);
                    }}
                    onPaste={scanOnlyHandlers.onPaste}
                    className="woody-input py-4 px-6 text-2xl font-mono tabular-nums text-center uppercase min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] w-full"
                    autoFocus
                />
                <button
                    onClick={() => handleLocationScan(locationSearch)}
                    className="mt-4 min-h-[44px] bg-primary text-white font-semibold w-full py-3.5 text-base rounded-xl hover:opacity-90 active:scale-95 transition-all touch-manipulation"
                >
                    {t('warehouse.confirmLocation')}
                </button>
            </div>
        </div>
    );
};
