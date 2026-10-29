import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, RefreshCw, Loader2, CheckCircle, Package
} from 'lucide-react';
import { User, WMSJob } from '../../types';
import { wmsJobsService } from '../../services/supabase.service';
import Button from '../../components/shared/Button';
import { logger } from '../../utils/logger';

interface ExceptionsViewProps {
    currentUser: User | null;
    activeSite: any;
    onResolve: (job: WMSJob, item: any, index: number) => void;
}

export function ExceptionsView({ activeSite, onResolve }: ExceptionsViewProps) {
    const [loading, setLoading] = useState(true);
    const [discrepancies, setDiscrepancies] = useState<{ job: WMSJob, item: any, index: number }[]>([]);

    const loadData = async () => {
        if (!activeSite?.id) return;
        setLoading(true);
        try {
            const jobs = await wmsJobsService.getDiscrepancies(activeSite.id);
            const flatItems: any[] = [];
            jobs.forEach(job => {
                (job.lineItems || []).forEach((item: any, index: number) => {
                    if (item.status === 'Discrepancy') {
                        flatItems.push({ job, item, index });
                    }
                });
            });
            flatItems.sort((a, b) => new Date(b.job.createdAt || 0).getTime() - new Date(a.job.createdAt || 0).getTime());
            setDiscrepancies(flatItems);
        } catch (err) {
            logger.error('ExceptionsView', 'caught error', err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeSite?.id]);

    return (
        <div className="h-full flex flex-col gap-6 p-6 animate-in fade-in bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                        <AlertTriangle className="text-[var(--theme-status-danger-text)]" size={20} />
                        Exception Management
                    </h2>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Resolve outstanding inventory discrepancies across all operations.</p>
                </div>
                <Button onClick={loadData} variant="secondary"><RefreshCw size={14} className="mr-2" /> Refresh</Button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={36} />
                </div>
            ) : discrepancies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--theme-text-muted)]">
                    <CheckCircle size={48} className="mb-3 text-[var(--theme-status-success-text)]" />
                    <p className="text-base font-bold text-[var(--theme-text-primary)]">All Clear</p>
                    <p className="text-xs text-[var(--theme-text-muted)] mt-1">No open discrepancies found.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)]">
                                <th className="p-3.5 text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Date</th>
                                <th className="p-3.5 text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Job Ref</th>
                                <th className="p-3.5 text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Product</th>
                                <th className="p-3.5 text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Status</th>
                                <th className="p-3.5 text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Variance</th>
                                <th className="p-3.5 text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discrepancies.map((d, i) => (
                                <tr key={i} className="border-b border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] transition-colors">
                                    <td className="p-3.5 text-xs text-[var(--theme-text-muted)] font-mono tabular-nums">
                                        {new Date(d.job.createdAt || '').toLocaleDateString()}
                                    </td>
                                    <td className="p-3.5">
                                        <div className="text-xs font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">{d.job.jobNumber || d.job.id.slice(0, 8)}</div>
                                        <div className="text-[11px] text-[var(--theme-text-muted)] uppercase">{d.job.type}</div>
                                    </td>
                                    <td className="p-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--theme-bg-card)] flex items-center justify-center overflow-hidden border border-[var(--theme-border)]">
                                                {d.item.image && !d.item.image.includes('placeholder.com') ? (
                                                    <img
                                                        src={d.item.image}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package size={14} className="text-[var(--theme-text-muted)]" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-xs text-[var(--theme-text-primary)] font-medium">{d.item.productName || d.item.name}</div>
                                                <div className="text-[11px] text-[var(--theme-text-muted)] font-mono tabular-nums">{d.item.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3.5">
                                        <span className="px-2 py-0.5 rounded bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] text-[11px] font-semibold uppercase tracking-wider">
                                            ACTION REQ
                                        </span>
                                    </td>
                                    <td className="p-3.5 font-mono tabular-nums text-xs">
                                        <div className="flex flex-col">
                                            <span className="text-[var(--theme-text-secondary)]">Exp: {d.item.expectedQty}</span>
                                            <span className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">Rec: {d.item.receivedQty || 0}</span>
                                            <span className="text-[var(--theme-status-danger-text)] font-bold border-t border-[var(--theme-border)] pt-0.5 mt-0.5">
                                                Diff: {(d.item.receivedQty || 0) - (d.item.expectedQty || 0)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-right">
                                        <button
                                            onClick={() => onResolve(d.job, d.item, d.index)}
                                            className="px-4 py-2 min-h-[44px] bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider touch-manipulation cursor-pointer"
                                        >
                                            Resolve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
