import React from 'react';
import { Box } from 'lucide-react';
import { Product } from '../../../../types';

interface PutawayScannerItemCardProps {
    currentItem: any;
    currentOccupants: Product[];
    t: (key: string) => string;
}

export const PutawayScannerItemCard: React.FC<PutawayScannerItemCardProps> = ({
    currentItem,
    currentOccupants,
    t,
}) => {
    return (
        <div className="text-center mb-6 w-full max-w-md">
            <p className="text-[var(--theme-text-secondary)] text-[11px] font-semibold uppercase tracking-wider mb-2">
                {t('warehouse.putaway.itemVerification')}
            </p>
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-sm">
                <p className="text-xl sm:text-2xl text-[var(--theme-text-primary)] font-bold uppercase tracking-tight leading-snug mb-3">
                    {currentItem?.name || currentItem?.productName}
                </p>
                <div className="inline-block px-3.5 py-1.5 bg-[var(--theme-accent)] text-white font-semibold font-mono text-sm rounded-xl tracking-wider mb-2">
                    {currentItem?.sku}
                </div>

                {currentOccupants.length > 0 && (
                    <div className="mt-4 space-y-2.5 pt-4 border-t border-[var(--theme-border)] text-left">
                        <span className="text-[11px] font-semibold uppercase text-[var(--theme-text-secondary)] tracking-wider block mb-1">
                            {t('warehouse.putaway.locationOccupants')} ({currentOccupants.length})
                        </span>
                        {currentOccupants.slice(0, 3).map((occ: Product) => (
                            <div key={occ.id} className="flex items-center gap-2.5 bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <div className="w-6 h-6 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                                    <Box size={13} className="text-[var(--theme-accent)]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate uppercase tracking-tight">
                                        {occ.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
