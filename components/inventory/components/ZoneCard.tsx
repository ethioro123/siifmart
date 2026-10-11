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
    let progressColorClass = "bg-[#34C759]";
    if (usagePercent > 90) progressColorClass = "bg-[#FF3B30]";
    else if (usagePercent > 70) progressColorClass = "bg-[#FF9F0A]";

    const isLockedState = zone.isLocked;

    return (
        <div 
            className={`p-5 sm:p-6 relative overflow-hidden group border transition-all duration-200 rounded-2xl shadow-xs ${
                isLockedState 
                    ? 'border-[#FF3B30]/20 bg-[#FF3B30]/5 hover:border-[#FF3B30]/35' 
                    : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 hover:shadow-sm'
            }`}
        >
            <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="flex items-start gap-3.5 text-left">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                        isLockedState
                            ? 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/25'
                            : zone.type === 'Cold' 
                                ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]/20' 
                                : zone.type === 'Secure' 
                                    ? 'bg-[#AF52DE]/10 text-[#AF52DE] border-[#AF52DE]/20' 
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border-[var(--theme-border)]'
                    }`}>
                        {isLockedState ? <Lock size={20} /> : zone.type === 'Cold' ? <Thermometer size={20} /> : zone.type === 'Secure' ? <Shield size={20} /> : <Box size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--theme-text-primary)] text-base flex items-center gap-1.5">
                            {zone.name}
                            {isLockedState && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-[#FF3B30] text-white">
                                    LOCKED
                                </span>
                            )}
                        </h3>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider mt-0.5">
                            {zone.type} Storage • Type: {zone.zoneType || 'STANDARD'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-xl font-bold font-mono tabular-nums ${usagePercent > 90 ? 'text-[#FF3B30]' : 'text-[var(--theme-text-primary)]'}`}>
                        {usagePercent.toFixed(1)}%
                    </span>
                    <p className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase mt-0.5">Space Utilized</p>
                </div>
            </div>

            {/* Rules and Restrictions Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4 relative z-10 text-left">
                {zone.pickingPriority !== undefined && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                        Priority {zone.pickingPriority}
                    </span>
                )}
                {zone.allowPicking === false && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/25">
                        No Picking
                    </span>
                )}
                {zone.allowPutaway === false && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/25">
                        No Putaway
                    </span>
                )}
                {zone.assignedProducts.length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/25">
                        {zone.assignedProducts.length} Products
                    </span>
                )}
            </div>

            {/* Capacity Bar */}
            <div className="space-y-1.5 relative z-10 text-left">
                <div className="w-full bg-[var(--theme-bg-subtle)] h-2.5 rounded-full overflow-hidden border border-[var(--theme-border)] relative">
                    <div
                        className={`h-full transition-all duration-700 ${progressColorClass}`}
                        ref={(el) => { if (el) el.style.width = `${Math.min(100, usagePercent)}%`; }}
                    />
                </div>
                <div className="flex justify-between text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums font-medium">
                    <span>Occupied: {zone.occupied.toLocaleString()} items</span>
                    <span>Capacity: {zone.capacity.toLocaleString()} items</span>
                </div>
            </div>

            {/* Temperature Gauge if applicable */}
            {zone.temperature && (
                <div className="mt-3 flex items-center gap-1.5 text-[var(--theme-accent)] text-[11px] font-semibold bg-[var(--theme-accent)]/10 px-2.5 py-1.5 rounded-lg border border-[var(--theme-accent)]/20 w-fit relative z-10">
                    <Thermometer size={14} />
                    <span>TARGET TEMP: {zone.temperature}</span>
                </div>
            )}

            {/* Lock Reason Display */}
            {isLockedState && zone.lockReason && (
                <div className="mt-3 p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-[11px] rounded-xl flex items-start gap-2 relative z-10 text-left">
                    <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold uppercase text-[11px] tracking-wider">Lock Reason</p>
                        <p className="mt-0.5 leading-relaxed font-medium">{zone.lockReason}</p>
                        <p className="mt-1 text-[11px] opacity-80 uppercase">Locked by {zone.lockedBy} at {new Date(zone.lockedAt || '').toLocaleDateString()}</p>
                    </div>
                </div>
            )}

            {/* Actions Footer */}
            {['super_admin', 'warehouse_manager', 'store_manager', 'operations_manager', 'regional_manager'].includes(userRole || '') && (
                <div className="mt-5 pt-4 border-t border-[var(--theme-border)] flex items-center justify-between relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onConfigure(zone)}
                        className="px-3 py-1.5 text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] rounded-xl border border-[var(--theme-border)] transition-all flex items-center gap-1.5 text-[11px] font-semibold uppercase cursor-pointer active:scale-[0.98]"
                    >
                        <Settings2 size={14} /> Configure
                    </button>
                    <button
                        onClick={() => onDelete(zone)}
                        disabled={zone.assignedProducts.length > 0}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-[11px] font-semibold uppercase cursor-pointer active:scale-[0.98] ${
                            zone.assignedProducts.length > 0
                                ? 'text-[var(--theme-text-muted)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] cursor-not-allowed opacity-40'
                                : 'text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 border border-[#FF3B30]/20'
                        }`}
                        title={zone.assignedProducts.length > 0 ? "Cannot delete zone containing products" : "Delete Zone"}
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};
export default ZoneCard;
