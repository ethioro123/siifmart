import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFulfillment } from './FulfillmentContext';
import { OutboundJobModal } from '../OutboundJobModal';
import { useInboundDockAssignment } from '../../hooks/useInboundDockAssignment';
import { getShipmentPhase, isInboundPurchaseOrder } from '../../utils/shipmentWorkflow';
import { getVisibleFulfillmentTabs } from '../../utils/fulfillmentTabPermissions';
import { Upload, Download } from 'lucide-react';
import { WMSJob, User, Site, PurchaseOrder, Product } from '../../types';
import { DocksOutboundView } from './docks/DocksOutboundView';
import { DocksInboundView } from './docks/DocksInboundView';

interface DocksTabProps {
    orders: PurchaseOrder[];
    jobs: WMSJob[];
    sites: Site[];
    activeSite: Site | null;
    employees: User[];
    user: User | null;
    t: (key: string) => string;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    refreshData: () => Promise<void>;
    setActiveTab: (tab: any) => void;
    setReceivingPO: (po: PurchaseOrder) => void;
    purchaseOrdersService?: any;
    wmsJobsService: any;
    logSystemEvent?: (action: string, details: string, user: string, category: string) => void;
    generatePackLabelHTML?: (data: any, options: any) => Promise<string>;
    formatJobId: (job: WMSJob) => string;
    formatDateTime?: (date: string) => string;
    formatRelativeTime?: (date: string) => string;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    completeJob?: (jobId: string, employeeName: string) => Promise<any>;
    products: Product[];
}

export const DocksTab: React.FC<DocksTabProps> = ({
    orders,
    jobs,
    sites,
    activeSite,
    employees,
    user,
    t,
    addNotification,
    refreshData,
    setActiveTab,
    wmsJobsService,
    generatePackLabelHTML,
    formatJobId,
    setSelectedJob,
    setIsDetailsOpen,
    products,
}) => {
    const [params, setParams] = useSearchParams();
    const { selectedJob, isDetailsOpen } = useFulfillment();
    const canInbound = getVisibleFulfillmentTabs(user?.role).includes('RECEIVE');
    const dockCategory = canInbound && params.get('dock') !== 'outbound' ? 'INBOUND' : 'OUTBOUND';
    const setDockCategory = (category: 'INBOUND' | 'OUTBOUND') => setParams(previous => {
        const next = new URLSearchParams(previous);
        next.set('dock', category.toLowerCase());
        return next;
    }, { replace: true });
    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');
    const assignment = useInboundDockAssignment(activeSite?.id, refreshData);
    const outstandingOrders = orders.filter(order => isInboundPurchaseOrder(order, activeSite?.id));
    const incomingTransfers = jobs.filter(job => job.type === 'TRANSFER' && job.destSiteId === activeSite?.id &&
        ['in-transit', 'awaiting-receipt'].includes(getShipmentPhase(job)));
    const assignVesselToDock = async (dockId: string, vessel: PurchaseOrder) => {
        if (assignment.isPending) return;
        try {
            await assignment.mutateAsync({ order: vessel, dock: dockId });

            addNotification('success', dockId ? `Assigned ${vessel.poNumber || 'PO'} to bay ${dockId}.` : `Cleared bay assignment for ${vessel.poNumber || 'PO'}.`);
        } catch (error) {
            addNotification('alert', error instanceof Error ? error.message : 'Could not assign the inbound dock.');
        }
    };

    return (
        <div className="flex flex-col h-full gap-2 sm:gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                {/* DOCK CATEGORY SWITCHER (INBOUND / OUTBOUND) */}
                <div className="flex items-center gap-1 bg-[var(--theme-bg-subtle)] p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    {canInbound && <button
                        onClick={() => setDockCategory('INBOUND')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[44px] rounded-lg sm:rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors touch-manipulation cursor-pointer ${
                            dockCategory === 'INBOUND'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <Download size={13} className="sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">Inbound</span>
                        <span className="sm:hidden">Inbound</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                            dockCategory === 'INBOUND'
                                ? 'bg-[var(--theme-primary-text)]/15 text-[var(--theme-primary-text)]'
                                : 'bg-[var(--theme-text-muted)]/15 text-[var(--theme-text-primary)]'
                        }`}>
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            {outstandingOrders.length + incomingTransfers.length}
                        </span>
                    </button>}
                    <button
                        onClick={() => setDockCategory('OUTBOUND')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[44px] rounded-lg sm:rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors touch-manipulation cursor-pointer ${
                            dockCategory === 'OUTBOUND'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        <Upload size={13} className="sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">Dispatch</span>
                        <span className="sm:hidden">Dispatch</span>
                    </button>
                </div>

                {/* VIEW MODE TOGGLE */}
                <div className="bg-[var(--theme-bg-subtle)] p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-[var(--theme-border)] flex shadow-xs self-end sm:self-auto w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('Process')}
                        className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1 sm:py-1.5 min-h-[30px] sm:min-h-[38px] rounded-md sm:rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors touch-manipulation cursor-pointer flex items-center justify-center ${viewMode === 'Process' ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'}`}
                    >
                        Process
                    </button>
                    <button
                        onClick={() => setViewMode('History')}
                        className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1 sm:py-1.5 min-h-[30px] sm:min-h-[38px] rounded-md sm:rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors touch-manipulation cursor-pointer flex items-center justify-center ${viewMode === 'History' ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {dockCategory === 'INBOUND' && viewMode === 'Process' && incomingTransfers.length > 0 && (
                <section className="space-y-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3">
                    <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Incoming transfers</h3>
                    {incomingTransfers.map(job => <button key={job.id} type="button"
                        disabled={getShipmentPhase(job) !== 'awaiting-receipt'}
                        onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); setActiveTab('TRANSFER'); }}
                        className="flex min-h-11 w-full flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--theme-bg-subtle)] px-3 text-xs text-[var(--theme-text-primary)] disabled:opacity-60">
                        <span>#{formatJobId(job)} · {sites.find(site => site.id === job.sourceSiteId)?.name || 'Origin site'}</span>
                        <span>{getShipmentPhase(job) === 'awaiting-receipt' ? 'Inspect & receive →' : 'On the road · awaiting arrival'}</span>
                    </button>)}
                </section>
            )}
            {dockCategory === 'INBOUND' ? (
                <DocksInboundView
                    orders={orders}
                    arrivals={outstandingOrders}
                    assignDock={assignVesselToDock}
                    openReceiving={() => setActiveTab('RECEIVE')}
                    busy={assignment.isPending}
                    viewMode={viewMode}
                    t={t}
                />
            ) : (
                <DocksOutboundView
                    jobs={jobs}
                    sites={sites}
                    user={user}
                    activeSite={activeSite}
                    employees={employees}
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                    formatJobId={formatJobId}
                    refreshData={refreshData}
                    addNotification={addNotification}
                    viewMode={viewMode}
                />
            )}
            {dockCategory === 'OUTBOUND' && selectedJob && isDetailsOpen && (
                <OutboundJobModal isOpen={isDetailsOpen} job={selectedJob} user={user} sites={sites} products={products}
                    onClose={() => { setIsDetailsOpen(false); setSelectedJob(null); }} onRefresh={refreshData} activeTab="docks" />
            )}
        </div>
    );
};
