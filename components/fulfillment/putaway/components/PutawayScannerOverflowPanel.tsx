import React, { useState } from 'react';
import { Box, AlertTriangle, ArrowLeftRight, Users, Loader2, Undo2, PackagePlus } from 'lucide-react';
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
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border min-h-[44px] ${
                        isOverflowMode
                            ? 'bg-[var(--theme-status-warning-bg)] text-white border-[var(--theme-status-warning-border)] shadow-sm'
                            : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)]'
                    }`}
                >
                    {isOverflowMode ? (
                        <>
                            <Undo2 size={15} />
                            <span>{t('warehouse.putaway.revertToPrimaryBay')}</span>
                        </>
                    ) : (
                        <>
                            <PackagePlus size={15} />
                            <span>{t('warehouse.putaway.bayFullAssignNew')}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Overflow Mode Active Panel */}
            {isOverflowMode && (
                <div className="p-4 rounded-2xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-center animate-in fade-in duration-200">
                    <div className="flex items-center justify-center gap-1.5 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mb-1.5">
                        <AlertTriangle size={15} className="shrink-0" />
                        <p className="text-xs font-semibold uppercase tracking-wider">
                            {t('warehouse.putaway.overflowModeActive')}
                        </p>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed max-w-xs mx-auto">
                        {t('warehouse.putaway.overflowInstruction')}
                    </p>

                    {existingSkuLocations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[var(--theme-status-warning-border)]">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mb-2">
                                {t('warehouse.putaway.existingBaysForSku')}:
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
                                            className={`px-3 py-1.5 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-status-warning-border)] text-xs font-mono font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] hover:text-white transition-colors flex items-center gap-1.5 min-h-[38px] ${
                                                isAnySelecting ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            {isThisLocSelected && <Loader2 size={12} className="animate-spin text-[var(--theme-status-warning-text)]" />}
                                            <span>{p.location}</span>
                                            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-sans font-medium">
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
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-left">
                    <div className="flex items-center gap-2 mb-2.5 border-b border-[var(--theme-border)] pb-2">
                        <Users size={14} className="text-[var(--theme-status-warning-text)]" />
                        <span className="text-[11px] font-semibold uppercase text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] tracking-wider">
                            {t('warehouse.putaway.locationOccupants')} ({currentOccupants.length})
                        </span>
                    </div>
                    <div className="space-y-2">
                        {currentOccupants.slice(0, 2).map((occ: Product) => (
                            <div key={occ.id} className="flex items-center gap-2.5 bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <div className="w-6 h-6 rounded-lg bg-[var(--theme-status-warning-bg)] flex items-center justify-center shrink-0 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                                    <Box size={13} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate uppercase tracking-tight">
                                        {occ.name}
                                    </p>
                                    <p className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                        {occ.sku} {occ.stock ? `/ ${occ.stock} in stock` : ''}
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
