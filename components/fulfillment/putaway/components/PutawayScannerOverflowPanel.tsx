import React, { useState } from 'react';
import { Box, AlertTriangle, Info, ArrowLeftRight, Check, Users, Loader2 } from 'lucide-react';
import { Product } from '../../../../types';

interface PutawayScannerOverflowPanelProps {
    isOverflowMode: boolean;
    setIsOverflowMode: (v: boolean) => void;
    setAwaitingMismatchConfirmation: (v: boolean) => void;
    existingSkuLocations: Product[];
    handleSelectLocation: (loc: string) => Promise<void> | void;
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
    const [selectingLoc, setSelectingLoc] = useState<string | null>(null);

    return (
        <div className="w-full space-y-3">
            {/* Toggle Overflow Button */}
            <div className="flex justify-center">
                <button
                    type="button"
                    onClick={() => {
                        setIsOverflowMode(!isOverflowMode);
                        setAwaitingMismatchConfirmation(false);
                    }}
                    className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 border shadow-sm min-h-[44px] active:scale-[0.98] ${
                        isOverflowMode 
                            ? 'bg-amber-600 dark:bg-amber-500 text-white border-amber-500 shadow-amber-500/25 ring-2 ring-amber-400/40 animate-pulse' 
                            : 'bg-white/80 dark:bg-[#1C2620]/80 text-stone-700 dark:text-stone-300 border-[#E2DCCE]/80 dark:border-[#A9CBA2]/15 hover:bg-[#2C5E3B]/10 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:border-[#2C5E3B]/30'
                    }`}
                >
                    <ArrowLeftRight size={15} className={isOverflowMode ? 'rotate-180 transition-transform' : ''} />
                    <span>{isOverflowMode ? '↩️ Revert to Primary Bay' : '📦 Primary Bay Full? Assign Alternate Bay'}</span>
                </button>
            </div>

            {/* Overflow Mode Active Panel */}
            {isOverflowMode && (
                <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400/60 dark:border-amber-500/40 text-center animate-in fade-in zoom-in-95 duration-200 shadow-lg shadow-amber-500/5 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                        <AlertTriangle size={16} className="shrink-0" />
                        <p className="text-[11px] font-black uppercase tracking-wider">
                            Overflow Mode Activated
                        </p>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed max-w-xs mx-auto">
                        Primary bay is full. Scan any target location barcode or select an existing storage bay below:
                    </p>

                    {existingSkuLocations.length > 0 && (
                        <div className="mt-4 pt-3.5 border-t border-amber-500/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-300/80 mb-2.5">
                                Existing Bays for {currentItem?.sku || 'SKU'}:
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {existingSkuLocations.map(p => {
                                    const isThisLocSelected = selectingLoc === p.location;
                                    const isAnySelecting = selectingLoc !== null;

                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            disabled={isAnySelecting}
                                            onClick={async () => {
                                                if (isAnySelecting || !p.location) return;
                                                setSelectingLoc(p.location);
                                                try {
                                                    await handleSelectLocation(p.location);
                                                } finally {
                                                    setSelectingLoc(null);
                                                }
                                            }}
                                            className={`px-3.5 py-2 rounded-xl bg-white dark:bg-black/50 border border-amber-500/40 text-xs font-mono font-black text-amber-800 dark:text-amber-200 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-black transition-all shadow-xs flex items-center gap-1.5 active:scale-95 ${
                                                isAnySelecting ? 'opacity-60 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            {isThisLocSelected && <Loader2 size={12} className="animate-spin text-amber-600 dark:text-amber-300" />}
                                            <span>{p.location}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-white/10 text-amber-800 dark:text-amber-300 font-sans font-bold">
                                                {p.stock || 0} pcs
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Occupants Warning */}
            {currentOccupants.length > 0 && (
                <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-500/20 text-left animate-in slide-in-from-top-2 duration-300 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3 border-b border-amber-200 dark:border-amber-500/10 pb-2">
                        <Users size={14} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-widest">
                            {t('warehouse.putaway.locationOccupants')} ({currentOccupants.length})
                        </span>
                    </div>
                    <div className="space-y-2.5">
                        {currentOccupants.slice(0, 2).map((occ: Product) => (
                            <div key={occ.id} className="flex items-center gap-3 bg-white/60 dark:bg-black/30 p-2.5 rounded-2xl border border-amber-200/50 dark:border-white/5">
                                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-400">
                                    <Box size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-stone-900 dark:text-stone-100 truncate uppercase tracking-tight">
                                        {occ.name}
                                    </p>
                                    <p className="text-[10px] font-mono font-bold text-stone-500 dark:text-stone-400">
                                        {occ.sku} {occ.stock ? `• ${occ.stock} in stock` : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
