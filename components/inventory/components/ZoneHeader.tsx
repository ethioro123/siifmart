import React from 'react';
import { Plus, RefreshCw, Layers } from 'lucide-react';
import { Site } from '../../../types';

interface ZoneHeaderProps {
    activeSite: Site | null | undefined;
    zonesCount: number;
    isLoading: boolean;
    onInitializeDefaults: () => void;
    onCreateOpen: () => void;
    userRole?: string;
}

export const ZoneHeader: React.FC<ZoneHeaderProps> = ({
    activeSite,
    zonesCount,
    isLoading,
    onInitializeDefaults,
    onCreateOpen,
    userRole
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--theme-bg-card)] p-4 sm:p-5 rounded-2xl border border-[var(--theme-border)] shadow-xs">
            <div className="space-y-1 text-left">
                <h2 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight uppercase flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                        <Layers size={16} />
                    </div>
                    <span>{activeSite?.name || 'Location'} Storage Zones</span>
                </h2>
                <p className="text-xs text-[var(--theme-text-secondary)] font-medium leading-relaxed">
                    Configure storage bays, cold chain temperature gauges, picking priorities, and operational capacity for this {activeSite?.type || 'facility'}.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
                {zonesCount === 0 && !isLoading && (
                    <button
                        type="button"
                        onClick={onInitializeDefaults}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs bg-[var(--theme-accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        <RefreshCw size={14} />
                        <span>Initialize Default Zones</span>
                    </button>
                )}
                {['group_ceo', 'country_managing_director', 'warehouse_manager', 'store_manager', 'country_operations_director', 'regional_operations_manager'].includes(userRole || '') && (
                    <button
                        type="button"
                        onClick={onCreateOpen}
                        className="px-4 py-2.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                    >
                        <Plus size={14} />
                        <span>Add New Zone</span>
                    </button>
                )}
            </div>
        </div>
    );
};
export default ZoneHeader;
