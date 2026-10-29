import React from 'react';
import { X, Calendar, User, Box, PackageCheck, Printer, ScanBarcode, ArrowRight, MapPin, Trash2 } from 'lucide-react';
import { WMSJob } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useStore } from '../../../contexts/CentralStore';
import { ItemAttributeBadges } from '../ItemAttributeBadges';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface PutawayDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    sites?: any[];
    t: (key: string) => string;
    onDeleteJob?: (jobId: string) => void;
}

export const PutawayDetailsModal: React.FC<PutawayDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    sites = [],
    t,
    onDeleteJob
}) => {
    const { user } = useStore();
    const { allProducts } = useFulfillment();
    const canDelete = ['group_ceo', 'country_managing_director', 'warehouse_manager', 'country_operations_director', 'regional_operations_manager'].includes(user?.role || '');

    const handleDelete = () => {
        if (!window.confirm(t('warehouse.putaway.deleteJobConfirm') || 'Are you sure you want to delete this job?')) return;
        onDeleteJob?.(selectedItem.id);
        onClose();
    };
    const isCompleted = (selectedItem.status || '').toLowerCase() === 'completed';
    // Resolve User Name: prioritize actual completion author for completed jobs
    const completedUserId = selectedItem.completedBy || (selectedItem as any).completed_by;
    const assignedUserId = selectedItem.assignedTo || (selectedItem as any).assigned_to;
    const rawTargetUserId = (isCompleted || completedUserId) ? (completedUserId || assignedUserId) : (assignedUserId || completedUserId);
    const workerLabel = (isCompleted || Boolean(completedUserId))
        ? (t('warehouse.completedBy') || 'Completed By')
        : (t('warehouse.assignedTo') || 'Assigned To');

    const resolvedWorker = resolveFulfillmentWorker({
        userId: rawTargetUserId,
        job: selectedItem,
        employees,
        sites,
        currentUser: user,
        siteId: selectedItem.siteId || (selectedItem as any).site_id
    });

    const displayId = resolvedWorker.code || resolvedWorker.displayId;
    const userName = resolvedWorker.name;

    // Resolve destination location across all items
    const isRealBay = (loc?: string) => loc && loc !== 'Receiving Dock' && loc !== 'Unknown' && loc !== 'Unassigned';
    const itemBay = selectedItem.lineItems?.find(li => isRealBay(li.location))?.location;
    const jobBay = isRealBay((selectedItem as any).location) ? (selectedItem as any).location : undefined;
    const resolvedLocation = itemBay || jobBay || 'Registry Archive';

    const data = {
        id: selectedItem.id,
        reference: formatJobId(selectedItem),
        title: selectedItem.type === 'REPLENISH' ? t('warehouse.tabs.replenish') : t('warehouse.putaway.putaway'),
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        user: userName,
        items: selectedItem.lineItems || [],
        location: resolvedLocation,
        site: sites.find(s => s.id === (selectedItem.siteId || (selectedItem as any).site_id))
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col h-full max-h-[90vh] overflow-hidden relative">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[var(--theme-border)] flex justify-between items-start bg-[var(--theme-bg-subtle)] relative z-10">
                    <div className="flex gap-4">
                        <div className="hidden md:flex p-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] items-center justify-center shadow-sm">
                            <PackageCheck size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <h3 className="text-lg md:text-xl font-bold text-[var(--theme-text-primary)] tracking-tight font-mono leading-none">#{data.reference}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${data.status === 'Completed' ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]'}`}>
                                    {data.status === 'Completed' ? t('warehouse.completed') : data.status === 'Pending' ? t('warehouse.pending') : t('warehouse.inProgress')}
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)]" />
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors shrink-0"
                        aria-label={t('warehouse.dismiss')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[var(--theme-border)] border-b border-[var(--theme-border)] relative z-10">
                    {[
                        { label: t('warehouse.date'), icon: <Calendar size={18} />, value: formatDateTime(data.date), mono: true },
                        { label: workerLabel, icon: <User size={18} />, value: displayId ? `${data.user} (${displayId})` : data.user, mono: false },
                        { label: t('warehouse.putaway.hubTitle'), icon: <MapPin size={18} />, value: data.site ? `${data.site.name} (${data.site.code || data.site.id})` : 'UNLISTED SITE', mono: false }
                    ].map((item, i) => (
                        <div key={i} className="bg-[var(--theme-bg-card)] p-3.5 md:p-4 flex items-center gap-3 transition-colors">
                            <div className="hidden md:flex p-2.5 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                {item.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider leading-none mb-1.5">{item.label}</p>
                                <p className={`text-xs md:text-sm text-[var(--theme-text-primary)] font-semibold break-words leading-tight ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Line Items Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[var(--theme-bg-app)] relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('warehouse.putaway.jobDetails')}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider bg-[var(--theme-bg-card)] px-3 py-1 rounded-full border border-[var(--theme-border)]">
                            <Box size={12} /> {data.items.length} {t('warehouse.itemPlural')}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex items-center justify-between transition-colors shadow-sm">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="hidden md:flex w-10 h-10 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] items-center justify-center text-[var(--theme-text-secondary)] font-semibold text-xs font-mono">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[var(--theme-text-primary)] font-semibold tracking-tight text-xs md:text-sm leading-tight mb-1.5 break-words">{item.name || 'Unnamed Specimen'}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[11px] text-[var(--theme-text-primary)] font-semibold font-mono tracking-wider bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)] uppercase">
                                                SKU: {item.sku}
                                            </span>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] rounded-md">
                                                <MapPin size={11} className="shrink-0" />
                                                <span className="text-[11px] font-medium font-mono uppercase">
                                                    {isRealBay(item.location) ? item.location : data.location}
                                                </span>
                                            </div>
                                        </div>
                                        <ItemAttributeBadges item={item} allProducts={allProducts} className="mt-2" />
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1 leading-none">{t('warehouse.expectedAbbr')} {t('warehouse.qty')}</p>
                                    <p className="text-xl md:text-2xl font-bold text-[var(--theme-text-primary)] tabular-nums font-mono leading-none">
                                        {item.pickedQty ?? item.expectedQty ?? 0}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 md:p-6 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex justify-between items-center relative z-20 shrink-0">
                    <div>
                        {canDelete && onDeleteJob && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-1.5 md:gap-2 px-3.5 md:px-4 py-2.5 min-h-[44px] bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors"
                                title={t('common.delete') || 'Delete Job'}
                            >
                                <Trash2 size={14} />
                                <span>{t('common.delete') || 'Delete'}</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs uppercase tracking-wider font-semibold min-h-[44px] transition-colors"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>
            </div>
        </div>
    );
};
