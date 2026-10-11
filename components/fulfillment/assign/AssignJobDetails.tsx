import React from 'react';
import { 
    Truck, 
    ArrowRight, 
    Package, 
    X, 
    Box, 
    ArrowDownToLine, 
    ArrowUpFromLine, 
    RefreshCw, 
    User, 
    ShieldCheck, 
    Calendar,
    ClipboardList,
    AlertTriangle
} from 'lucide-react';
import { WMSJob, Site } from '../../../types';
import { formatJobId, formatOrderRef } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';

interface AssignJobDetailsProps {
    selectedJob: WMSJob | null;
    isDetailsOpen: boolean;
    setIsDetailsOpen: (val: boolean) => void;
    sites: Site[];
    t: (key: string) => string;
}

export const AssignJobDetails: React.FC<AssignJobDetailsProps> = ({
    selectedJob,
    isDetailsOpen,
    setIsDetailsOpen,
    sites,
    t
}) => {
    if (!selectedJob || !isDetailsOpen) return null;

    // Resolve camelCase and snake_case properties from Supabase query mapping
    const originSiteId = selectedJob.sourceSiteId || selectedJob.source_site_id || selectedJob.siteId || selectedJob.site_id;
    const destSiteId = selectedJob.destSiteId || selectedJob.dest_site_id;

    const originName = sites.find(s => s.id === originSiteId)?.name || originSiteId || 'N/A';
    const destName = sites.find(s => s.id === destSiteId)?.name || destSiteId || '';

    const getJobIcon = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'PICK':
                return <Package className="text-primary" size={22} />;
            case 'PACK':
                return <Box className="text-primary" size={22} />;
            case 'PUTAWAY':
                return <ArrowDownToLine className="text-primary" size={22} />;
            case 'RECEIVE':
                return <ArrowUpFromLine className="text-primary" size={22} />;
            case 'TRANSFER':
                return <RefreshCw className="text-primary" size={22} />;
            case 'DRIVER':
            case 'DISPATCH':
                return <Truck className="text-primary" size={22} />;
            default:
                return <ClipboardList className="text-primary" size={22} />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4 animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[85vh] overflow-hidden shadow-xl flex flex-col relative">

                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] flex justify-between items-start bg-[var(--theme-bg-subtle)]">
                    <div className="flex gap-3.5">
                        <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center shrink-0">
                            {getJobIcon(selectedJob.type)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h2 className="text-lg font-bold text-[var(--theme-text-primary)] tracking-tight">Job Intelligence</h2>
                                <span className="px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-mono font-medium text-primary uppercase tracking-wider">
                                    {formatJobId(selectedJob)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[11px] uppercase font-semibold tracking-wider border bg-primary/10 text-primary border-primary/20">
                                    {selectedJob.type}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-[var(--theme-text-muted)]" />
                                <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">{selectedJob.status}</span>
                                {selectedJob.orderRef && selectedJob.type !== 'PICK' && (
                                    <>
                                        <div className="w-1 h-1 rounded-full bg-[var(--theme-text-muted)]" />
                                        <span className="text-[11px] text-primary font-medium uppercase tracking-wider">PO: {formatOrderRef(selectedJob.orderRef)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsDetailsOpen(false)}
                        aria-label="Close"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors touch-manipulation"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
                    {/* Route/Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {originSiteId && (
                            <div className="bg-[var(--theme-bg-subtle)] rounded-2xl p-4 border border-[var(--theme-border)] flex flex-col justify-between min-h-[120px]">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[11px] text-[var(--theme-text-muted)] uppercase font-semibold tracking-wider">Logistics Route</p>
                                    <Truck size={18} className="text-primary opacity-60" />
                                </div>
                                
                                {destSiteId ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-[var(--theme-text-muted)] uppercase font-medium mb-0.5">Origin</p>
                                            <p className="font-semibold text-[var(--theme-text-primary)] truncate text-xs" title={originName}>{originName}</p>
                                        </div>
                                        <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-full flex-shrink-0">
                                            <ArrowRight className="text-primary" size={13} />
                                        </div>
                                        <div className="flex-1 text-right min-w-0">
                                            <p className="text-[11px] text-[var(--theme-text-muted)] uppercase font-medium mb-0.5">Destination</p>
                                            <p className="font-semibold text-[var(--theme-text-primary)] truncate text-xs" title={destName}>{destName}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-[11px] text-[var(--theme-text-muted)] uppercase font-medium mb-0.5">Active Warehouse</p>
                                        <p className="font-semibold text-[var(--theme-text-primary)] text-xs">{originName}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Operations Matrix */}
                        <div className="bg-[var(--theme-bg-subtle)] rounded-2xl p-4 border border-[var(--theme-border)] space-y-2">
                            <p className="text-[11px] text-[var(--theme-text-muted)] uppercase font-semibold tracking-wider mb-1">Operations Matrix</p>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex justify-between items-center bg-[var(--theme-bg-card)] px-3 py-2 rounded-xl border border-[var(--theme-border)]">
                                    <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase flex items-center gap-1.5">
                                        <User size={12} className="text-primary" /> Requested By
                                    </span>
                                    <span className="text-[var(--theme-text-primary)] font-semibold text-xs">{selectedJob.requestedBy || 'System Terminal'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-[var(--theme-bg-card)] px-3 py-2 rounded-xl border border-[var(--theme-border)]">
                                    <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase flex items-center gap-1.5">
                                        <ShieldCheck size={12} className="text-primary" /> Auth Authority
                                    </span>
                                    <span className={`font-semibold text-xs ${selectedJob.approvedBy ? 'text-[var(--theme-text-primary)]' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {selectedJob.approvedBy || 'Pending Auth'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-[var(--theme-bg-card)] px-3 py-2 rounded-xl border border-[var(--theme-border)]">
                                    <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase flex items-center gap-1.5">
                                        <Calendar size={12} className="text-primary" /> Timestamp
                                    </span>
                                    <span className="text-[var(--theme-text-secondary)] font-mono text-[11px] font-medium tabular-nums">
                                        {formatDateTime(selectedJob.createdAt || selectedJob.created_at || new Date())}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-[var(--theme-bg-card)] px-3 py-2 rounded-xl border border-[var(--theme-border)]">
                                    <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase flex items-center gap-1.5">
                                        <AlertTriangle size={12} className="text-primary" /> Priority
                                    </span>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${
                                        selectedJob.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        selectedJob.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                        'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border)]'
                                    }`}>
                                        {selectedJob.priority}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manifest List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-2 text-xs uppercase tracking-wider">
                                <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
                                    <Package size={14} className="text-primary" />
                                </div>
                                Inventory Manifest
                            </h3>
                            <span className="text-[11px] font-mono text-[var(--theme-text-muted)] font-medium bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2.5 py-0.5 rounded-full tabular-nums">
                                {selectedJob.lineItems?.length || selectedJob.items || 0} ITEMS
                            </span>
                        </div>

                        <div className="bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[11px] text-[var(--theme-text-muted)] bg-[var(--theme-bg-card)] uppercase font-semibold tracking-wider border-b border-[var(--theme-border)]">
                                    <tr>
                                        <th className="px-4 py-2.5">{t('warehouse.intelligence')}</th>
                                        <th className="px-4 py-2.5 text-center">{t('warehouse.volume')}</th>
                                        <th className="px-4 py-2.5 text-right">{t('warehouse.state')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--theme-border)]">
                                    {selectedJob.lineItems && selectedJob.lineItems.length > 0 ? selectedJob.lineItems.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-[var(--theme-bg-card)] transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-[var(--theme-text-primary)] font-semibold">{item.name}</p>
                                                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[11px] font-mono font-medium rounded-full border border-primary/20 uppercase">
                                                        {formatJobId(selectedJob)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[var(--theme-text-muted)] font-mono">{item.sku}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {item.orderedQty && item.orderedQty > (item.expectedQty || item.quantity || item.pickedQty || 0) ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[11px] font-mono font-medium text-red-500 line-through tabular-nums" title="Short Picked">{item.orderedQty}</span>
                                                        <span className="font-bold font-mono tabular-nums text-[var(--theme-text-primary)] bg-[var(--theme-bg-card)] px-2 py-0.5 rounded-lg border border-[var(--theme-border)]">
                                                            {item.expectedQty || item.quantity || item.pickedQty || 0}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="font-semibold font-mono tabular-nums text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-2 py-0.5 rounded-lg">
                                                        {item.expectedQty || item.quantity || item.pickedQty || 0}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${
                                                    item.status === 'Completed' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                                                    item.status === 'Discrepancy' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                    'bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]'
                                                }`}>
                                                    {item.status || 'Verified'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="px-4 py-8 text-center text-[var(--theme-text-muted)] font-medium uppercase tracking-wider text-[11px]">Operational Payload Empty</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex justify-end gap-3">
                    <button
                        onClick={() => setIsDetailsOpen(false)}
                        className="min-h-[44px] px-6 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)] transition-colors active:scale-[0.98] touch-manipulation"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
