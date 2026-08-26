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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/85 dark:bg-[#18201B]/60 p-5 rounded-3xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm">
            <div className="space-y-0.5">
                <h2 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight uppercase flex items-center gap-2">
                    <Layers size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <span>{activeSite?.name || 'Location'} Storage Zones</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                    Configure storage bays, cold chain temperature gauges, picking priorities, and operational capacity for this {activeSite?.type || 'facility'}.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
                {zonesCount === 0 && !isLoading && (
                    <button
                        type="button"
                        onClick={onInitializeDefaults}
                        className="woody-btn-primary px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                        <RefreshCw size={13} />
                        <span>Initialize Default Zones</span>
                    </button>
                )}
                {(userRole === 'super_admin' || userRole === 'warehouse_manager' || userRole === 'store_manager') && (
                    <button
                        type="button"
                        onClick={onCreateOpen}
                        className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#EAE5D9] dark:bg-black/30 dark:hover:bg-white/10 text-[#1E3F27] dark:text-white border border-[#E2DCCE] dark:border-white/10 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
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
