import React from 'react';
import { Box, AlertTriangle, Info } from 'lucide-react';
import { Product } from '../../../../types';

interface PutawayScannerOverflowPanelProps {
    isOverflowMode: boolean;
    setIsOverflowMode: (v: boolean) => void;
    setAwaitingMismatchConfirmation: (v: boolean) => void;
    existingSkuLocations: Product[];
    handleSelectLocation: (loc: string) => void;
    currentItem: any;
    currentOccupants: Product[];
    t: (key: string) => string;
}

export const PutawayScannerOverflowPanel: React.FC<PutawayScannerOverflowPanelProps> = ({
    isOverflowMode,
    setIsOverflowMode,
    setAwaitingMismatchConfirmation,
    existingSkuLocations,
    handleSelectLocation,
    currentItem,
    currentOccupants,
    t
}) => {
    return (
        <>
            <div className="mt-4 flex flex-col items-center gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setIsOverflowMode(!isOverflowMode);
                        setAwaitingMismatchConfirmation(false);
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border shadow-sm ${
                        isOverflowMode 
                            ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/30 animate-pulse' 
                            : 'bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:bg-stone-200'
                    }`}
                >
                    <Box size={14} />
                    {isOverflowMode ? '↩️ Back to Primary Bay' : '📦 Primary Bay Full? Assign Alternate Bay'}
                </button>
            </div>

            {isOverflowMode && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center animate-in fade-in duration-300">
                    <p className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
                        <AlertTriangle size={14} />
                        <span>OVERFLOW MODE: Primary bay full — scan or pick alternate storage bay</span>
                    </p>

                    {existingSkuLocations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-amber-500/20">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-2">
                                Existing Bays for {currentItem?.sku}:
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {existingSkuLocations.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleSelectLocation(p.location!)}
                                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-amber-500/40 text-xs font-mono font-black text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-all"
                                    >
                                        {p.location} ({p.stock || 0} pcs)
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {currentOccupants.length > 0 && (
                <div className="mt-8 p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border-2 border-amber-100 dark:border-amber-500/20 text-left animate-in slide-in-from-top-4 duration-700 shadow-lg shadow-amber-500/5">
                    <div className="flex items-center gap-3 mb-4 border-b border-amber-200 dark:border-amber-500/10 pb-3">
                        <Box size={16} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500/80 tracking-widest">{t('warehouse.putaway.locationOccupants')} ({currentOccupants.length})</span>
                    </div>
                    <div className="space-y-4">
                        {currentOccupants.slice(0, 2).map((occ: Product) => (
                            <div key={occ.id} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                                    <Info size={14} className="text-amber-600 dark:text-amber-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-amber-900 dark:text-amber-100 truncate uppercase tracking-tight">{occ.name}</p>
                                    <p className="text-[10px] font-black font-mono text-amber-600/50 truncate uppercase tracking-widest">{occ.sku}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
