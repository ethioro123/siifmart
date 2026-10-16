import React from 'react';
import { Navigation, Truck, Clock, Box, User as UserIcon } from 'lucide-react';
import { WMSJob, Site, User } from '../../../../types';

interface DocksOutboundDeparturesProps {
    shippedJobs: WMSJob[];
    sites: Site[];
    employees: User[];
    user: User | null;
    formatJobId: (job: WMSJob) => string;
    handleDelete?: (e: React.MouseEvent, jobId: string) => Promise<void>;
    t: (key: string) => string;
}

export const DocksOutboundDepartures: React.FC<DocksOutboundDeparturesProps> = ({
    shippedJobs,
    sites,
    employees,
    user,
    formatJobId,
    t,
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 flex flex-col shrink-0 mt-2 shadow-sm">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] tracking-wider uppercase flex items-center gap-2.5">
                    <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
                        <Navigation className="text-primary" size={15} />
                    </div>
                    {t('warehouse.docks.outboundSchedule')}
                    <span className="text-[11px] text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 font-semibold">
                        {shippedJobs.length} ACTIVE
                    </span>
                </h3>
            </div>
            
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x">
                {shippedJobs.length === 0 ? (
                    <div className="w-full py-10 text-center bg-[var(--theme-bg-subtle)] rounded-xl border border-dashed border-[var(--theme-border)]">
                        <Truck size={30} className="text-[var(--theme-text-muted)] mx-auto mb-2" />
                        <p className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">No Active Shipments</p>
                    </div>
                ) : (
                    shippedJobs.map(job => {
                        const destSite = sites.find(s => s.id === job.destSiteId);
                        const driver = employees.find(e => e.id === job.assignedTo);
                        const isExternal = job.deliveryMethod === 'External';
                        
                        return (
                            <div key={job.id} className="min-w-[300px] sm:min-w-[320px] max-w-[360px] p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex flex-col justify-between shadow-sm snap-start transition-colors">
                                <div>
                                    {/* Header: Status & Time */}
                                    <div className="flex justify-between items-start mb-3 gap-2">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
                                                {job.transferStatus?.toUpperCase()}
                                            </span>
                                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1 font-mono">
                                                <Clock size={12} />
                                                {job.shippedAt ? new Date(job.shippedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 items-center">
                                            <span className="text-[11px] font-mono text-[var(--theme-text-muted)] bg-[var(--theme-bg-card)] px-2 py-0.5 rounded-full border border-[var(--theme-border)]">
                                                #{formatJobId(job)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Body: Destination & Driver */}
                                    <div className="mb-4 p-3 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                <Box size={15} className="text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider mb-0.5">Destination</p>
                                                <p className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider truncate">
                                                    {destSite ? (
                                                        <>
                                                            {destSite.name} <span className="text-[var(--theme-text-muted)] font-normal font-mono">({destSite.code || destSite.id})</span>
                                                        </>
                                                    ) : 'External Hub'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="h-px w-full bg-[var(--theme-border)] my-2" />
                                        
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-lg ${isExternal ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-primary/10 border-primary/20 text-primary'} flex items-center justify-center border shrink-0`}>
                                                <UserIcon size={15} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <p className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">Driver</p>
                                                    <span className={`text-[11px] font-semibold tracking-wider px-2 py-0.5 rounded-full ${isExternal ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                                        {isExternal ? 'EXTERNAL' : 'INTERNAL'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-[var(--theme-text-secondary)] truncate">
                                                    {isExternal ? (job.externalCarrierName || 'Unlabeled Carrier') : (driver?.name || 'Unassigned')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Footer: ETA/Status Banner */}
                                <div className="mt-auto">
                                    <div className="w-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]">
                                        <Truck size={14} className="shrink-0" /> In Transit to Destination
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
