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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--theme-bg-panel)] p-5 rounded-3xl border border-[var(--theme-border)] shadow-sm">
            <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-[var(--theme-text-primary)] tracking-tight uppercase flex items-center gap-2">
                    <Layers size={18} className="text-[var(--theme-text-secondary)]" />
                    <span>{activeSite?.name || 'Location'} Storage Zones</span>
                </h2>
                <p className="text-xs text-[var(--theme-text-muted)] font-medium">
                    Configure storage bays, cold chain temperature gauges, picking priorities, and operational capacity for this {activeSite?.type || 'facility'}.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
                {zonesCount === 0 && !isLoading && (
                    <button
                        type="button"
                        onClick={onInitializeDefaults}
                        className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        <RefreshCw size={13} />
                        <span>Initialize Default Zones</span>
                    </button>
                )}
                {['super_admin', 'warehouse_manager', 'store_manager', 'operations_manager', 'regional_manager'].includes(userRole || '') && (
                    <button
                        type="button"
                        onClick={onCreateOpen}
                        className="px-4 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
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
