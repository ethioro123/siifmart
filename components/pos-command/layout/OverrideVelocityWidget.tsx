import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { posOverridesService, OverrideVelocityStats } from '../../../services/pos-overrides.service';
import type { SupervisoryOverrideRecord } from '../../../types/pos-zero-trust';
import { OVERRIDE_REASON_LABELS } from '../../../types/pos-zero-trust';
import { ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, Trash2, RefreshCcw, KeyRound, Tag } from 'lucide-react';

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
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 isolate">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        stats.isExcessive 
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                        {stats.isExcessive ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[var(--theme-text-primary)] uppercase tracking-tight">
                                Supervisor Override Velocity (Rule 18 Audit)
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-tight ${
                                stats.isExcessive
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
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
                    <p className={`text-2xl font-mono font-bold tracking-tight ${
                        stats.isExcessive ? 'text-rose-500' : 'text-[var(--theme-text-primary)]'
                    }`}>
                        {stats.overrideVelocityRate.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <Trash2 size={15} />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold block truncate">Voids &amp; Clears</span>
                        <p className="text-lg font-mono font-bold text-[var(--theme-text-primary)] leading-tight">{stats.voidCount}</p>
                    </div>
                </div>

                <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <RefreshCcw size={15} />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold block truncate">Refunds &amp; Returns</span>
                        <p className="text-lg font-mono font-bold text-[var(--theme-text-primary)] leading-tight">{stats.refundCount}</p>
                    </div>
                </div>

                <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <KeyRound size={15} />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold block truncate">No-Sale Till Kicks</span>
                        <p className="text-lg font-mono font-bold text-[var(--theme-text-primary)] leading-tight">{stats.drawerKickCount}</p>
                    </div>
                </div>

                <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <Tag size={15} />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-semibold block truncate">Price Overrides</span>
                        <p className="text-lg font-mono font-bold text-[var(--theme-text-primary)] leading-tight">{stats.priceOverrideCount}</p>
                    </div>
                </div>
            </div>

            {/* Recent Overrides Audit Strip */}
            <div className="space-y-2">
                <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider block px-1">
                    Live Supervisory Audit Log
                </span>
                <div className="divide-y divide-[var(--theme-border)] border border-[var(--theme-border)] rounded-2xl overflow-hidden bg-[var(--theme-bg-subtle)] isolate">
                    {recentOverrides.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[var(--theme-text-muted)] font-sans">
                            No supervisory overrides logged today. Register floor operating strictly within policy.
                        </div>
                    ) : (
                        recentOverrides.map((ov) => (
                            <div key={ov.id} className="p-3.5 flex items-center justify-between text-xs font-mono hover:bg-[var(--theme-bg-card-hover)] transition-colors">
                                <div className="flex items-center gap-2.5">
                                    <span className="px-2 py-0.5 rounded-lg bg-[var(--theme-bg-card)] text-[10px] font-bold uppercase text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
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
                                    <span className="text-[var(--theme-text-primary)] font-sans font-semibold text-[11px]">
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
