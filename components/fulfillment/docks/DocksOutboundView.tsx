import React, { useEffect } from 'react';
import { Truck, ArrowRight } from 'lucide-react';
import type { WMSJob, Site, User } from '../../../types';
import { DocksOutboundHistory } from './DocksOutboundHistory';
import { useFulfillment } from '../FulfillmentContext';
import { OutboundDockCard } from './components/OutboundDockCard';
import { useShipmentWorkflow, type ShipmentAction } from '../../../hooks/useShipmentWorkflow';
import { canManageDispatch, DOCK_BAYS, getShipmentPhase, getShipmentUnits, isShipment } from '../../../utils/shipmentWorkflow';

interface DocksOutboundViewProps {
    jobs: WMSJob[];
    sites: Site[];
    activeSite: Site | null;
    employees: (User & { status?: string })[];
    user: User | null;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (open: boolean) => void;
    formatJobId: (job: WMSJob) => string;
    refreshData: () => Promise<void>;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    viewMode: 'Process' | 'History';
}

export const DocksOutboundView: React.FC<DocksOutboundViewProps> = ({
    jobs, sites, activeSite, employees, user, setSelectedJob, setIsDetailsOpen,
    formatJobId, refreshData, addNotification, viewMode
}) => {
    const { historicalJobs, loadHistoricalJobs, setActiveTab } = useFulfillment();
    const workflow = useShipmentWorkflow(refreshData);
    const canManage = canManageDispatch(user?.role);
    const origin = activeSite?.id;
    const scoped = jobs.filter(job => isShipment(job) && Boolean(origin) && (job.sourceSiteId || job.siteId) === origin);
    const staged = scoped.filter(job => getShipmentPhase(job) === 'ready');
    const inTransit = scoped.filter(job => getShipmentPhase(job) === 'in-transit');
    const drivers = employees.filter(employee => employee.role === 'driver' && employee.siteId === origin && employee.status?.toLowerCase() === 'active');
    useEffect(() => { if (viewMode === 'History') void loadHistoricalJobs(); }, [viewMode, loadHistoricalJobs]);
    const open = (job: WMSJob) => { setSelectedJob(job); setIsDetailsOpen(true); };
    const run = async (job: WMSJob, action: ShipmentAction) => {
        try {
            await workflow.mutateAsync({ job, action });
            addNotification('success', action.type === 'depart' ? 'Shipment released to transport. The driver can now record arrival.' : 'Dispatch updated.');
        } catch (error) {
            addNotification('alert', error instanceof Error ? error.message : 'Dispatch update failed.');
        }
    };

    if (viewMode === 'History') return <DocksOutboundHistory jobs={historicalJobs.filter(job => (job.sourceSiteId || job.siteId) === origin)} sites={sites} employees={employees}
        setSelectedJob={setSelectedJob} setIsDetailsOpen={setIsDetailsOpen} formatJobId={formatJobId} />;

    return <div className="space-y-4 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--theme-text-secondary)]">
            <p>Pack → Load & assign transport → Release → Driver arrival → Blind receiving</p>
            <button type="button" onClick={() => setActiveTab('DRIVER')} className="flex min-h-11 items-center gap-1 text-[var(--theme-primary)] font-semibold">Driver deliveries <ArrowRight size={14} /></button>
        </div>
        <section className="space-y-3" aria-label="Dispatch queue">
            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Ready for dispatch ({staged.length})</h3>
            {staged.length === 0 && <p className="rounded-xl border border-dashed border-[var(--theme-border)] p-5 text-sm text-[var(--theme-text-secondary)]">No packed shipments awaiting dispatch. Complete packing first.</p>}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {staged.map(job => <OutboundDockCard key={job.id} dock={DOCK_BAYS.find(bay => job.location === `Dock ${bay}`) || 'Staging'} job={job}
                    destination={sites.find(site => site.id === job.destSiteId)?.name || 'Customer'}
                    occupiedDocks={staged.filter(other => other.id !== job.id).map(other => other.location || '')}
                    drivers={drivers} canManage={canManage} busy={workflow.isPending} onOpen={open} onAction={run} />)}
            </div>
        </section>
        <section className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">On the road ({inTransit.length})</h3>
            {inTransit.length === 0 && <p className="p-3 text-xs text-[var(--theme-text-secondary)]">Released shipments appear here until arrival is recorded.</p>}
            {inTransit.map(job => <button key={job.id} type="button" onClick={() => open(job)}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 text-left text-xs text-[var(--theme-text-primary)]">
                <Truck size={18} className="text-[var(--theme-primary)]" />
                <span className="flex-1 min-w-0 break-words"><span className="block font-mono font-semibold">#{formatJobId(job)}</span><span className="text-[var(--theme-text-secondary)]">{sites.find(site => site.id === job.destSiteId)?.name || 'Customer'} · {job.deliveryMethod === 'External' ? job.externalCarrierName : employees.find(employee => employee.id === job.assignedTo)?.name || 'Assigned driver'}</span></span>
                <ArrowRight size={16} />
            </button>)}
        </section>
    </div>;
};
