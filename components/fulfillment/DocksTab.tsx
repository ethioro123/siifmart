import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { WMSJob, User, Site, PurchaseOrder, Product } from '../../types';
import { DocksOutboundView } from './docks/DocksOutboundView';

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
    purchaseOrdersService: any;
    wmsJobsService: any;
    logSystemEvent: (action: string, details: string, user: string, category: string) => void;
    generatePackLabelHTML: (data: any, options: any) => Promise<string>;
    formatJobId: (job: WMSJob) => string;
    formatDateTime: (date: string) => string;
    formatRelativeTime: (date: string) => string;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    completeJob: (jobId: string, employeeName: string) => Promise<any>;
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
    setReceivingPO,
    purchaseOrdersService,
    wmsJobsService,
    logSystemEvent,
    generatePackLabelHTML,
    formatJobId,
    formatDateTime,
    formatRelativeTime,
    setSelectedJob,
    setIsDetailsOpen,
    completeJob,
    products,
}) => {
    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mx-4 md:mx-0">
                {/* TERMINAL CONTROL TITLE */}
                <div className="flex bg-white/80 dark:bg-[#18201B]/50 backdrop-blur-xl p-1.5 rounded-2xl w-fit border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10 shadow-sm overflow-hidden relative group">
                    <div className="absolute inset-0 bg-[#2C5E3B]/5 blur-xl group-hover:bg-[#2C5E3B]/10 transition-all opacity-50" />
                    <div className="relative z-10 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm">
                        <div className="flex items-center gap-3">
                            <Upload size={14} />
                            <span>{t('warehouse.docks.outgoing')}</span>
                        </div>
                    </div>
                </div>

                {/* VIEW MODE TOGGLE */}
                <div className="bg-slate-100 dark:bg-white/5 backdrop-blur-xl p-1 rounded-xl border border-slate-200 dark:border-white/10 flex">
                    <button
                        onClick={() => setViewMode('Process')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        Process
                    </button>
                    <button
                        onClick={() => setViewMode('History')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            <DocksOutboundView
                jobs={jobs}
                sites={sites}
                user={user}
                activeSite={activeSite}
                employees={employees}
                setSelectedJob={setSelectedJob}
                setIsDetailsOpen={setIsDetailsOpen}
                formatJobId={formatJobId}
                wmsJobsService={wmsJobsService}
                refreshData={refreshData}
                addNotification={addNotification}
                generatePackLabelHTML={generatePackLabelHTML}
                completeJob={completeJob}
                viewMode={viewMode}
                t={t}
                products={products}
            />
        </div>
    );
};
