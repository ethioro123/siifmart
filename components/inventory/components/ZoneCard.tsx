import React from 'react';
import { 
    Thermometer, Shield, Box, Settings2, Trash2, 
    Lock, ShieldAlert
} from 'lucide-react';
import { WarehouseZone, Product } from '../../../types';

interface ZoneWithProducts extends WarehouseZone {
    assignedProducts: Product[];
}

interface ZoneCardProps {
    zone: ZoneWithProducts;
    userRole?: string;
    onConfigure: (zone: ZoneWithProducts) => void;
    onDelete: (zone: ZoneWithProducts) => void;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({
    zone,
    userRole,
    onConfigure,
    onDelete
}) => {
    const usagePercent = zone.capacity > 0 ? (zone.occupied / zone.capacity) * 100 : 0;
    let progressColorClass = "bg-emerald-500";
    if (usagePercent > 90) progressColorClass = "bg-red-500";
    else if (usagePercent > 70) progressColorClass = "bg-amber-500";

    const isLockedState = zone.isLocked;

    return (
        <div 
            className={`p-6 relative overflow-hidden group border transition-all duration-300 rounded-3xl shadow-sm ${
                isLockedState 
                    ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/35' 
                    : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:border-[var(--theme-border-focus)] hover:shadow-md'
            }`}
        >
            <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="flex items-start gap-4">
                    <div className={`p-3.5 rounded-2xl border ${
                        isLockedState
                            ? 'bg-red-500/10 text-red-500 border-red-500/25'
                            : zone.type === 'Cold' 
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                : zone.type === 'Secure' 
                                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border-[var(--theme-border)]'
                    }`}>
                        {isLockedState ? <Lock size={22} /> : zone.type === 'Cold' ? <Thermometer size={22} /> : zone.type === 'Secure' ? <Shield size={22} /> : <Box size={22} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--theme-text-primary)] text-base flex items-center gap-1.5">
                            {zone.name}
                            {isLockedState && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-red-500 text-white animate-pulse">
                                    LOCKED
                                </span>
                            )}
                        </h3>
                        <p className="text-[10px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider mt-0.5">
                            {zone.type} Storage • Type: {zone.zoneType || 'STANDARD'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-xl font-bold font-mono ${usagePercent > 90 ? 'text-red-500' : 'text-[var(--theme-text-primary)]'}`}>
                        {usagePercent.toFixed(1)}%
                    </span>
                    <p className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase mt-0.5">Space Utilized</p>
                </div>
            </div>

            {/* Rules and Restrictions Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4 relative z-10 text-left">
                {zone.pickingPriority !== undefined && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-muted)]">
                        Priority {zone.pickingPriority}
                    </span>
                )}
                {zone.allowPicking === false && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/25">
                        No Picking
                    </span>
                )}
                {zone.allowPutaway === false && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        No Putaway
                    </span>
                )}
                {zone.assignedProducts.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        {zone.assignedProducts.length} Products
                    </span>
                )}
            </div>

            {/* Capacity Bar */}
            <div className="space-y-1.5 relative z-10 text-left">
                <div className="w-full bg-[var(--theme-bg-subtle)] h-3 rounded-full overflow-hidden border border-[var(--theme-border)] relative">
                    <div
                        className={`h-full transition-all duration-1000 ${progressColorClass}`}
                        ref={(el) => { if (el) el.style.width = `${Math.min(100, usagePercent)}%`; }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--theme-text-muted)] font-mono font-bold">
                    <span>Occupied: {zone.occupied.toLocaleString()} items</span>
                    <span>Capacity: {zone.capacity.toLocaleString()} items</span>
                </div>
            </div>

            {/* Temperature Gauge if applicable */}
            {zone.temperature && (
                <div className="mt-3 flex items-center gap-1.5 text-blue-500 dark:text-blue-400 text-[10px] font-bold bg-blue-500/5 px-2.5 py-1.5 rounded-lg border border-blue-500/10 w-fit relative z-10">
                    <Thermometer size={12} />
                    <span>TARGET TEMP: {zone.temperature}</span>
                </div>
            )}

            {/* Lock Reason Display */}
            {isLockedState && zone.lockReason && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-[11px] rounded-xl flex items-start gap-2 relative z-10 text-left">
                    <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold uppercase text-[9px] tracking-wide">Lock Reason</p>
                        <p className="mt-0.5 leading-relaxed font-bold">{zone.lockReason}</p>
                        <p className="mt-1 text-[8px] opacity-75 uppercase">Locked by {zone.lockedBy} at {new Date(zone.lockedAt || '').toLocaleDateString()}</p>
                    </div>
                </div>
            )}

            {/* Actions Footer */}
            {['super_admin', 'warehouse_manager', 'store_manager', 'operations_manager', 'regional_manager'].includes(userRole || '') && (
                <div className="mt-5 pt-4 border-t border-[var(--theme-border)] flex items-center justify-between relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onConfigure(zone)}
                        className="p-2 text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] rounded-xl border border-[var(--theme-border)] transition-all flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer active:scale-[0.98]"
                    >
                        <Settings2 size={12} /> Configure
                    </button>
                    <button
                        onClick={() => onDelete(zone)}
                        disabled={zone.assignedProducts.length > 0}
                        className={`p-2 rounded-xl transition-all flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer active:scale-[0.98] ${
                            zone.assignedProducts.length > 0
                                ? 'text-[var(--theme-text-muted)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] cursor-not-allowed opacity-30'
                                : 'text-rose-600 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/25'
                        }`}
                        title={zone.assignedProducts.length > 0 ? "Cannot delete zone containing products" : "Delete Zone"}
                    >
                        <Trash2 size={12} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};
export default ZoneCard;
