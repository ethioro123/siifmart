import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-[#18201B]/40 p-5 rounded-3xl border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-md shadow-sm">
            <div className="space-y-1">
                <h2 className="text-xl font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight uppercase">
                    {activeSite?.name || 'Location'} Zones
                </h2>
                <p className="text-xs text-stone-400 dark:text-gray-550 font-bold uppercase tracking-wider">
                    Configure storage zones, temperature limits, and operational capacity for this {activeSite?.type || 'site'}.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                {zonesCount === 0 && !isLoading && (
                    <button
                        onClick={onInitializeDefaults}
                        className="px-4 py-2.5 bg-gradient-to-br from-[#2C5E3B] to-[#224429] hover:from-[#1E3F27] hover:to-[#17301F] text-white text-xs font-black rounded-xl border border-transparent transition-all shadow-sm flex items-center gap-1.5 active:scale-95 uppercase tracking-wider cursor-pointer"
                    >
                        <RefreshCw size={14} /> Initialize Default Zones
                    </button>
                )}
                {(userRole === 'super_admin' || userRole === 'warehouse_manager' || userRole === 'store_manager') && (
                    <button
                        onClick={onCreateOpen}
                        className="px-4 py-2.5 bg-gradient-to-br from-[#2C5E3B] to-[#224429] hover:from-[#1E3F27] hover:to-[#17301F] text-white text-xs font-black rounded-xl border border-transparent transition-all shadow-sm flex items-center gap-1.5 active:scale-95 uppercase tracking-wider cursor-pointer"
                    >
                        <Plus size={14} /> Add New Zone
                    </button>
                )}
            </div>
        </div>
    );
};
export default ZoneHeader;
