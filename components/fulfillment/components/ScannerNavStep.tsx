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
                <div className="w-20 h-20 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-full flex items-center justify-center mx-auto border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20">
                    <MapIcon size={40} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                </div>
                <h1 className="text-4xl font-black text-[#EAE5D9] tracking-tight uppercase italic">
                    {selectedJob.type === 'PUTAWAY' ? t('warehouse.selectStorage') : t('warehouse.locateItem')}
                </h1>
                <p className="text-stone-400 text-lg">
                    {t('warehouse.goToLocation')}: <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-bold text-2xl">{currentProduct?.location || 'Unknown'}</span>
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
                    className="woody-input py-6 px-8 text-3xl font-mono text-center uppercase"
                    autoFocus
                />
                <button
                    onClick={() => handleLocationScan(locationSearch)}
                    className="mt-4 woody-btn-primary w-full py-4 text-lg font-bold"
                >
                    {t('warehouse.confirmLocation')}
                </button>
            </div>
        </div>
    );
};
