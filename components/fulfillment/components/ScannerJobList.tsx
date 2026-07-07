import React from 'react';
import { Package, ChevronRight, X } from 'lucide-react';
import { WMSJob, Site } from '../../../types';

interface ScannerJobListProps {
    myScannerJobs: WMSJob[];
    sites: Site[];
    formatJobId: (job: WMSJob) => string;
    setSelectedJob: (job: WMSJob | null) => void;
    setScannerStep: (step: 'NAV' | 'SCAN' | 'CONFIRM') => void;
    setIsScannerMode: (isOpen: boolean) => void;
    t: (key: string) => string;
}

export const ScannerJobList: React.FC<ScannerJobListProps> = ({
    myScannerJobs,
    sites,
    formatJobId,
    setSelectedJob,
    setScannerStep,
    setIsScannerMode,
    t
}) => {
    return (
        <div className="fixed inset-0 z-50 bg-[#18201B] flex flex-col">
            <div className="p-4 bg-[#1E2822] border-b border-[#E2DCCE]/10 dark:border-emerald-950/20 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#EAE5D9] uppercase tracking-wider">{t('warehouse.selectJob')}</h2>
                <button onClick={() => setIsScannerMode(false)} aria-label="Close Scanner" className="text-stone-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {myScannerJobs.length === 0 ? (
                    <div className="text-center text-stone-500 mt-20">
                        <Package size={48} className="mx-auto mb-4 opacity-50 text-[#A9CBA2]" />
                        <p>{t('warehouse.noJobsAvailable')}</p>
                    </div>
                ) : (
                    myScannerJobs.map((job: any) => (
                        <div
                            key={job.id}
                            onClick={() => {
                                setSelectedJob(job);
                                setScannerStep('NAV');
                            }}
                            className="glass-panel p-4 hover:border-[#CFC6B4] dark:hover:border-[#A9CBA2]/25 cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 font-bold text-xs uppercase">
                                            {job.type}
                                        </span>
                                        <span className="text-stone-850 dark:text-[#EAE5D9] font-mono font-bold text-lg">{formatJobId(job)}</span>
                                    </div>
                                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">To: {job.assignedTo || 'Unassigned'}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${job.priority === 'High' || job.priority === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2] border border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30'} `}>
                                        {job.priority}
                                    </span>
                                    <div className="mt-2 text-stone-550 text-xs">
                                        {job.items || job.lineItems?.length} items
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-[#E2DCCE]/30 dark:border-emerald-950/20 flex justify-between items-center">
                                <span className="text-xs text-stone-500">{job.sourceSiteId ? `From: ${sites.find(s => s.id === job.sourceSiteId)?.name} ` : ''}</span>
                                <ChevronRight size={16} className="text-stone-400 dark:text-stone-500 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
