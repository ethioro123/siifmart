import React from 'react';
import { Package, X, ArrowRight, Truck, Box } from 'lucide-react';
import { WMSJob, Site, User } from '../../../../types';

interface DockAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetDock: string | null;
    stagingJobs: WMSJob[];
    sites: Site[];
    employees: User[];
    formatJobId: (job: WMSJob) => string;
    onAssignJobToDock: (jobId: string, dockName: string) => Promise<void>;
    isSubmitting?: boolean;
}

export const DockAssignModal: React.FC<DockAssignModalProps> = ({
    isOpen,
    onClose,
    targetDock,
    stagingJobs,
    sites,
    employees,
    formatJobId,
    onAssignJobToDock,
    isSubmitting = false,
}) => {
    if (!isOpen || !targetDock) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1C2620] border border-[#E2DCCE] dark:border-[#2C5E3B]/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-white/10 flex justify-between items-center bg-stone-50/50 dark:bg-black/20">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 px-2 py-0.5 rounded">
                                Dock Loading Bay
                            </span>
                            <span className="text-xs font-black font-mono text-slate-700 dark:text-slate-200">
                                {targetDock}
                            </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Select Shipment for {targetDock}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-stone-200/60 dark:bg-white/10 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-white/20 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                    {stagingJobs.length === 0 ? (
                        <div className="py-12 text-center">
                            <Box size={40} className="text-stone-400 dark:text-stone-600 mx-auto mb-3" />
                            <p className="text-xs text-stone-600 dark:text-stone-400 font-bold uppercase tracking-widest">
                                No Shipments Currently in Staging
                            </p>
                            <p className="text-[10px] text-stone-400 mt-1">
                                Pack jobs first to send them to outbound staging.
                            </p>
                        </div>
                    ) : (
                        stagingJobs.map((job) => {
                            const destSite = sites.find(s => s.id === job.destSiteId);
                            const unitsCount = job.lineItems?.length || job.items || 0;

                            return (
                                <div
                                    key={job.id}
                                    className="p-4 rounded-2xl border border-[#E2DCCE] dark:border-white/10 bg-stone-50/50 dark:bg-white/[0.02] hover:bg-stone-100/80 dark:hover:bg-white/[0.06] transition-all flex items-center justify-between gap-4 group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center shrink-0">
                                            <Package size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">
                                                    {formatJobId(job)}
                                                </p>
                                                <span className="text-[9px] font-mono font-bold text-stone-500 bg-stone-200/60 dark:bg-white/10 px-1.5 py-0.2 rounded">
                                                    {unitsCount} Units
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase truncate mt-0.5">
                                                To: {destSite ? destSite.name : 'Unknown Destination'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={async () => {
                                            await onAssignJobToDock(job.id, targetDock);
                                            onClose();
                                        }}
                                        className="px-3.5 py-2 rounded-xl bg-[#2C5E3B] hover:bg-[#1E3B24] dark:bg-[#A9CBA2] dark:hover:bg-[#8eb886] text-white dark:text-[#18201B] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
                                    >
                                        <span>Load {targetDock}</span>
                                        <ArrowRight size={12} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
