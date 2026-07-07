import React from 'react';
import { Package, Scan, CheckCircle, RefreshCw } from 'lucide-react';
import { JobItem, Product } from '../../../types';

const MetricBadge = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className={`px-3 py-1 rounded-lg border flex flex-col items-center ${color}`}>
        <span className="text-[10px] uppercase font-bold opacity-80">{label}</span>
        <span className="text-lg font-mono font-bold">{value}</span>
    </div>
);

interface ScannerScanStepProps {
    currentItem: JobItem;
    currentProduct: Product | null | undefined;
    t: (key: string) => string;
    itemInputRef: React.RefObject<HTMLInputElement | null>;
    scannedItem: string;
    setScannedItem: (val: string) => void;
    scanOnlyItemHandlers: {
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    };
    handleItemScan: (val?: string) => void;
    isProcessingScan: boolean;
}

export const ScannerScanStep: React.FC<ScannerScanStepProps> = ({
    currentItem,
    currentProduct,
    t,
    itemInputRef,
    scannedItem,
    setScannedItem,
    scanOnlyItemHandlers,
    handleItemScan,
    isProcessingScan
}) => {
    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-24 md:pb-0 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative inline-block shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-3xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/10 bg-[#1C2620]/60 overflow-hidden flex items-center justify-center">
                    {currentItem.image && !currentItem.image.includes('placeholder') ? (
                        <img src={currentItem.image} className="w-full h-full object-cover" alt={currentItem.name} />
                    ) : (
                        <Package size={48} className="text-stone-500" />
                    )}
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#EAE5D9] text-center">{currentItem.name}</h2>
                    <p className="text-center text-stone-400 font-mono mt-1">{currentItem.sku}</p>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <MetricBadge label="Qty" value={currentItem.expectedQty} color="border-[#2C5E3B]/30 text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10" />
                <MetricBadge label="Stock" value={currentProduct?.stock || 0} color="border-stone-500 text-stone-450 bg-stone-100/10 dark:bg-white/5" />
            </div>

            {/* Scanner Input */}
            <div className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Scan className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />
                    <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold">{t('warehouse.scanProductBarcode')}</p>
                </div>
                <input
                    ref={itemInputRef}
                    aria-label="Item Scanner Input"
                    type="text"
                    value={scannedItem}
                    onChange={(e) => setScannedItem(e.target.value)}
                    onKeyDown={(e) => {
                        scanOnlyItemHandlers.onKeyDown(e);
                        if (e.key === 'Enter') handleItemScan();
                    }}
                    onPaste={scanOnlyItemHandlers.onPaste}
                    className="woody-input font-mono text-lg text-center"
                    autoFocus
                />
                <button
                    disabled={isProcessingScan}
                    onClick={() => handleItemScan()}
                    className="w-full mt-4 woody-btn-primary py-4 text-xl flex items-center justify-center gap-2"
                >
                    {isProcessingScan ? <RefreshCw className="animate-spin" /> : <CheckCircle />}
                    {t('warehouse.confirm')}
                </button>
            </div>
        </div>
    );
};
