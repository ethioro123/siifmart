import React from 'react';
import { Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface DashboardStreamMonitorProps {
    movements: any[];
    handleViewAllLogs: () => void;
}

export const DashboardStreamMonitor: React.FC<DashboardStreamMonitorProps> = ({
    movements,
    handleViewAllLogs
}) => {
    return (
        <div className="lg:col-span-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Activity size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Stream Monitor</h3>
                        <p className="text-xs text-[var(--theme-text-secondary)]">Real-time inventory ledger feed</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleViewAllLogs}
                    className="min-h-11 px-3 py-1.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] transition-colors cursor-pointer shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                >
                    Full Archive
                </button>
            </div>

            {movements && movements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {movements.slice(0, 10).map((move, i) => {
                        const isIn = move.type === 'IN';
                        return (
                            <div
                                key={i}
                                className="flex items-center p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] transition-colors group cursor-pointer"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shrink-0 ${
                                    isIn
                                        ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)]'
                                        : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)]'
                                }`}>
                                    {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">
                                            {move.productName}
                                        </span>
                                        <span className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-full ${
                                            isIn
                                                ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)]'
                                                : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)]'
                                        }`}>
                                            {isIn ? `+${move.quantity}` : `-${move.quantity}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1 text-[11px] text-[var(--theme-text-secondary)]">
                                        <span>{move.type} • {move.performedBy}</span>
                                        <span className="font-mono">{move.date?.includes(',') ? move.date.split(',')[0] : move.date || 'Live'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-8 text-center text-[var(--theme-text-secondary)] text-xs">
                    <Activity size={22} className="mx-auto mb-2 opacity-40 text-[var(--theme-accent)]" />
                    <p className="font-semibold text-[var(--theme-text-primary)]">No Active Inventory Movements</p>
                    <p className="text-[11px] mt-0.5">Physical ledger stream will record incoming & outgoing stock</p>
                </div>
            )}
        </div>
    );
};

export default DashboardStreamMonitor;
