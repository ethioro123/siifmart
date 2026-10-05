import React, { useState, useEffect } from 'react';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { posOverridesService, OverrideVelocityStats } from '../../../services/pos-overrides.service';
import type { SupervisoryOverrideRecord } from '../../../types/pos-zero-trust';
import { OVERRIDE_REASON_LABELS } from '../../../types/pos-zero-trust';
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, Clock, UserCheck, CheckCircle2 } from 'lucide-react';

export const OverrideVelocityWidget: React.FC = () => {
    const { activeSite } = useData();
    const [stats, setStats] = useState<OverrideVelocityStats | null>(null);
    const [recentOverrides, setRecentOverrides] = useState<SupervisoryOverrideRecord[]>([]);

    const loadData = async () => {
        const velocity = await posOverridesService.computeVelocityStats(activeSite?.id || 'All', 150);
        setStats(velocity);
        const list = await posOverridesService.getRecentOverrides(activeSite?.id || 'All', 5);
        setRecentOverrides(list);
    };

    useEffect(() => {
        loadData();
    }, [activeSite?.id]);

    if (!stats) return null;

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        stats.isExcessive 
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                            : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border-[var(--theme-border)]'
                    }`}>
                        {stats.isExcessive ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[var(--theme-text-primary)] uppercase tracking-tight">
                                Supervisor Override Velocity (Rule 18 Audit)
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                stats.isExcessive
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                            }`}>
                                {stats.isExcessive ? (
                                    <>
                                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                        <span>High Shrinkage Alert</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                        <span>Controlled Velocity</span>
                                    </>
                                )}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            Central compliance threshold: Maximum 3.0% override frequency
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider block">Today's Override Velocity</span>
                    <p className={`text-2xl font-mono font-bold ${
                        stats.isExcessive ? 'text-rose-500' : 'text-[var(--theme-text-primary)]'
                    }`}>
                        {stats.overrideVelocityRate.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                    <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-medium block mb-1">Voids & Clears</span>
                    <p className="text-lg font-mono font-bold text-[var(--theme-text-primary)]">{stats.voidCount}</p>
                </div>
                <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                    <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-medium block mb-1">Refunds & Returns</span>
                    <p className="text-lg font-mono font-bold text-[var(--theme-text-primary)]">{stats.refundCount}</p>
                </div>
                <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                    <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-medium block mb-1">No-Sale Till Kicks</span>
                    <p className="text-lg font-mono font-bold text-[var(--theme-text-primary)]">{stats.drawerKickCount}</p>
                </div>
                <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                    <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-medium block mb-1">Price Overrides</span>
                    <p className="text-lg font-mono font-bold text-[var(--theme-text-primary)]">{stats.priceOverrideCount}</p>
                </div>
            </div>

            {/* Recent Overrides Audit Strip */}
            <div className="space-y-2">
                <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider block px-1">
                    Live Supervisory Audit Log
                </span>
                <div className="divide-y divide-[var(--theme-border)] border border-[var(--theme-border)] rounded-xl overflow-hidden bg-[var(--theme-bg-subtle)]">
                    {recentOverrides.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[var(--theme-text-muted)] font-sans">
                            No supervisory overrides logged today. Register floor operating strictly within policy.
                        </div>
                    ) : (
                        recentOverrides.map((ov) => (
                            <div key={ov.id} className="p-3 flex items-center justify-between text-xs font-mono hover:bg-[var(--theme-bg-card-hover)] transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-lg bg-[var(--theme-bg-panel)] text-[10px] font-bold uppercase text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                        {ov.override_type.replace(/_/g, ' ')}
                                    </span>
                                    <span className="font-sans font-semibold text-[var(--theme-text-primary)]">
                                        Cashier: {ov.cashier_name}
                                    </span>
                                    <span className="text-[var(--theme-border)]">|</span>
                                    <span className="text-[var(--theme-text-secondary)] font-sans text-[11px]">
                                        Reason: {OVERRIDE_REASON_LABELS[ov.reason_code] || ov.reason_code}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-right">
                                    <span className="text-[var(--theme-text-primary)] font-sans font-bold text-[11px]">
                                        Auth: {ov.supervisor_name} ({ov.supervisor_role})
                                    </span>
                                    <span className="text-[var(--theme-text-muted)] text-[10px]">
                                        {new Date(ov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
