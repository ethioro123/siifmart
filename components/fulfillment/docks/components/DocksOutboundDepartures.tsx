import React from 'react';
import { Navigation, Truck, Clock, Trash2, Box, User as UserIcon } from 'lucide-react';
import { WMSJob, Site, User } from '../../../../types';

interface DocksOutboundDeparturesProps {
    shippedJobs: WMSJob[];
    sites: Site[];
    employees: User[];
    user: User | null;
    formatJobId: (job: WMSJob) => string;
    handleDelete: (e: React.MouseEvent, jobId: string) => Promise<void>;
    t: (key: string) => string;
}

export const DocksOutboundDepartures: React.FC<DocksOutboundDeparturesProps> = ({
    shippedJobs,
    sites,
    employees,
    user,
    formatJobId,
    handleDelete,
    t,
}) => {
    return (
        <div className="glass-panel p-6 flex flex-col shrink-0 mt-2">
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#2C5E3B]/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-3">
                    <div className="p-1.5 bg-[#2C5E3B]/20 rounded-lg">
                        <Navigation className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={16} />
                    </div>
                    {t('warehouse.docks.outboundSchedule')}
                    <span className="text-[10px] text-[#A9CBA2] bg-[#2C5E3B]/10 px-2 py-0.5 rounded-full ml-3 border border-[#2C5E3B]/20">
                        {shippedJobs.length} ACTIVE
                    </span>
                </h3>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar relative z-10 snap-x">
                {shippedJobs.length === 0 ? (
                    <div className="w-full py-12 text-center bg-slate-50 dark:bg-black/20 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 opacity-60">
                        <Truck size={32} className="text-slate-300 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">No Active Shipments</p>
                    </div>
                ) : (
                    shippedJobs.map(job => {
                        const destSite = sites.find(s => s.id === job.destSiteId);
                        const driver = employees.find(e => e.id === job.assignedTo);
                        const isExternal = job.deliveryMethod === 'External';
                        
                        return (
                            <div key={job.id} className="min-w-[320px] max-w-[360px] p-5 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 rounded-3xl border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] relative overflow-hidden group hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/40 transition-all duration-300 flex flex-col justify-between shadow-sm snap-start hover:-translate-y-1">
                                {/* Card Glow Effect */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2C5E3B]/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <div className="relative z-10">
                                    {/* Header: Status & Time */}
                                    <div className="flex justify-between items-start mb-4 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                                {job.transferStatus?.toUpperCase()}
                                            </span>
                                            <span className="text-[9px] text-amber-500 dark:text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={10} />
                                                {job.shippedAt ? new Date(job.shippedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-[9px] glass-panel-pushed text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] font-mono tracking-wider">
                                                #{formatJobId(job)}
                                            </span>
                                            {['super_admin', 'warehouse_manager'].includes(user?.role as string) && (
                                                <button
                                                    onClick={(e) => handleDelete(e, job.id)}
                                                    className="w-6 h-6 rounded border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all flex items-center justify-center shrink-0"
                                                    title="Delete Job"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Body: Destination & Driver */}
                                    <div className="mb-5 glass-panel-pushed p-3">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/20 flex items-center justify-center border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 shrink-0">
                                                <Box size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Destination</p>
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider break-words leading-tight">
                                                    {destSite ? (
                                                        <>
                                                            {destSite.name} <span className="text-zinc-500 dark:text-zinc-650 font-normal lowercase">({destSite.code || destSite.id})</span>
                                                        </>
                                                    ) : 'External Hub'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#E2DCCE]/60 dark:via-[#A9CBA2]/10 to-transparent my-2" />
                                        
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg ${isExternal ? 'bg-amber-500/20 border-amber-500/20' : 'bg-[#2C5E3B]/20 border-[#2C5E3B]/20'} flex items-center justify-center border shrink-0`}>
                                                <UserIcon size={14} className={isExternal ? 'text-amber-555 dark:text-amber-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <p className="text-[9px] text-gray-550 font-black uppercase tracking-widest">Driver</p>
                                                    <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded ${isExternal ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20' : 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20'}`}>
                                                        {isExternal ? 'EXTERNAL' : 'INTERNAL'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 dark:text-gray-300 truncate">
                                                    {isExternal ? (job.externalCarrierName || 'Unlabeled Carrier') : (driver?.name || 'Unassigned')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Footer: ETA/Status Banner */}
                                <div className="mt-auto relative z-10">
                                    <div className="w-full bg-gradient-to-r from-[#2C5E3B]/10 to-[#2C5E3B]/5 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#2C5E3B]/20 dark:hover:bg-[#A9CBA2]/20 transition-colors">
                                        <Truck size={14} className="animate-pulse" /> In Transit to Destination
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
