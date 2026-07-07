import React from 'react';
import { X, ShieldCheck, Archive, MapPin, Clock } from 'lucide-react';
import { WMSJob, Site } from '../../../../types';
import { formatJobId } from '../../../../utils/jobIdFormatter';

interface PackJobHeaderProps {
    isFullyPacked: boolean;
    job: WMSJob;
    destSite: Site | undefined;
    onClose: () => void;
    t: (key: string) => string;
}

export const PackJobHeader: React.FC<PackJobHeaderProps> = ({
    isFullyPacked,
    job,
    destSite,
    onClose,
    t,
}) => {
    return (
        <div className="relative p-4 md:p-6 border-b border-[#E2DCCE]/60 dark:border-white/10 bg-[#FAF8F5]/50 dark:bg-black/40 overflow-hidden shrink-0">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#2C5E3B]/10 blur-[80px] rounded-full pointer-events-none hidden md:block" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#A9CBA2]/10 blur-[80px] rounded-full pointer-events-none hidden md:block" />

            <div className="relative flex justify-between items-start">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border flex items-center justify-center shadow-sm shrink-0 ${isFullyPacked ? 'bg-green-50 dark:bg-green-500/20 border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400' : 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/25 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>
                        {isFullyPacked ? <ShieldCheck size={20} className="md:w-7 md:h-7" /> : <Archive size={20} className="md:w-7 md:h-7" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                            <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic leading-none">
                                {isFullyPacked ? t('warehouse.completed') : t('warehouse.packJobTitle')}
                            </h2>
                            <span className="px-2.5 py-1 rounded-xl bg-gray-150 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-[10px] md:text-xs font-mono text-gray-600 dark:text-gray-400">
                                #{formatJobId(job)}
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] uppercase font-black tracking-widest border ${job.priority === 'Critical' ? 'border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]' :
                                job.priority === 'High' ? 'border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' :
                                    'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5'
                                }`}>
                                {job.priority}
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-400">
                                <MapPin size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                <span className="break-words leading-tight">
                                    {destSite ? (
                                        <>
                                            {destSite.name} <span className="text-gray-500 dark:text-zinc-650 font-normal lowercase">({destSite.code || destSite.id})</span>
                                        </>
                                    ) : ((job as any).customerName || 'Customer')}
                                </span>
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-550">
                                <Clock size={12} className="text-gray-400" />
                                {new Date(job.createdAt || (job as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} aria-label={t('warehouse.dismiss')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 dark:text-gray-550 hover:text-gray-900 dark:hover:text-white transition-all">
                    <X size={18} className="md:w-6 md:h-6" />
                </button>
            </div>
        </div>
    );
};
