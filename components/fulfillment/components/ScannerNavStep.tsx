import React from 'react';
import { Map as MapIcon } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { MobileScannerLocationBadge } from './MobileScannerLocationBadge';

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
        <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 sm:space-y-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                    <MapIcon size={28} className="text-primary sm:hidden" />
                    <MapIcon size={36} className="text-primary hidden sm:block" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase">
                    {selectedJob.type === 'PUTAWAY' ? t('warehouse.selectStorage') : t('warehouse.locateItem')}
                </h1>
                <p className="text-[var(--theme-text-secondary)] text-sm sm:text-base">
                    {t('warehouse.goToLocation')}: <span className="text-primary font-mono tabular-nums font-bold text-lg sm:text-xl">{currentProduct?.location || 'Unknown'}</span>
                </p>
            </div>

            {/* Location Input & Mobile Pinned Badge */}
            <div className="relative group/input max-w-md mx-auto space-y-2">
                <MobileScannerLocationBadge
                    label={t('warehouse.targetLocation') || 'Target Location'}
                    location={currentProduct?.location || 'Unknown'}
                />
                <input
                    ref={locationInputRef}
                    aria-label="Location Scanner Input"
                    type="text"
                    placeholder="Scan Location Barcode"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value.toUpperCase())}
                    onFocus={(e) => {
                        const target = e.currentTarget;
                        setTimeout(() => {
                            target?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
                        }, 150);
                    }}
                    onKeyDown={(e) => {
                        scanOnlyHandlers.onKeyDown(e);
                        if (e.key === 'Enter') handleLocationScan(locationSearch);
                    }}
                    onPaste={scanOnlyHandlers.onPaste}
                    className="woody-input py-3 sm:py-4 px-4 sm:px-6 text-xl sm:text-2xl font-mono tabular-nums text-center uppercase min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] w-full scroll-mt-20 scroll-mb-20"
                    autoFocus
                />
                <button
                    onClick={() => handleLocationScan(locationSearch)}
                    className="mt-2 min-h-[44px] bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold w-full py-3 sm:py-3.5 text-base rounded-xl hover:opacity-90 active:scale-95 transition-all touch-manipulation cursor-pointer"
                >
                    {t('warehouse.confirmLocation')}
                </button>
            </div>
        </div>
    );
};
