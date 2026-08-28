import React from 'react';
import { Truck } from 'lucide-react';
import { WMSJob, User, Site } from '../../../types';

interface TransferHeaderProps {
    t: (key: string) => string;
    viewMode: 'Process' | 'History';
    setViewMode: (mode: 'Process' | 'History') => void;
    filteredJobs: WMSJob[];
    setShowTransferCenter: (show: boolean) => void;
    setTransferCenterTab: (tab: 'request' | 'bulk' | 'smart') => void;
    user: User | null;
    activeSite: Site | null;
    fixBrokenJobs?: () => Promise<void>;
}

export const TransferHeader: React.FC<TransferHeaderProps> = ({
    t,
    viewMode,
    setViewMode,
    filteredJobs,
    setShowTransferCenter,
    setTransferCenterTab,
    user,
    activeSite,
    fixBrokenJobs
}) => {
    return (
        <div className="bg-white/85 dark:bg-[#18201B]/80 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="font-black text-stone-900 dark:text-white flex items-center gap-2 text-lg uppercase tracking-tight">
                        <Truck className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={22} />
                        {t('warehouse.interSiteTransfers')}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-bold uppercase tracking-wider">{t('warehouse.requestManageTransfers')}</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-stone-200/60 dark:bg-black/40 backdrop-blur-md p-1 rounded-xl border border-[#E2DCCE]/60 dark:border-white/5 flex gap-1 shadow-xs">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-[#2C5E3B] text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'}`}
                        >
                            {t('warehouse.activeTransfers').split(' ')[0]}
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-[#2C5E3B] text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'}`}
                        >
                            {t('warehouse.history')}
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            const isHQ = activeSite?.type === 'HQ' || activeSite?.type === 'Administration' || ['super_admin', 'admin'].includes(user?.role || '');
                            const isWarehouse = activeSite?.type === 'Warehouse' || activeSite?.type === 'Distribution Center';
                            setTransferCenterTab(isHQ ? 'smart' : isWarehouse ? 'bulk' : 'request');
                            setShowTransferCenter(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-[#2C5E3B] to-[#A9CBA2] text-white font-bold rounded-lg hover:from-[#3a7a4d] hover:to-[#c0d9b9] transition-all flex items-center gap-2 shadow-lg shadow-[#2C5E3B]/20"
                    >
                        <Truck size={16} />
                        {t('warehouse.transferCenter')}
                    </button>
                </div>
            </div>

            {/* Transfer Summary */}
            <div className="flex items-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    <span className="text-gray-400">{t('warehouse.activeTransfers').split(' ')[0]}:</span>
                    <span className="font-bold text-white">{filteredJobs.filter(j => j.type === 'TRANSFER' && !['Received', 'Cancelled'].includes(j.transferStatus || '')).length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-gray-400">{t('warehouse.inTransitLabel')}:</span>
                    <span className="font-bold text-white">{filteredJobs.filter(j => {
                        if (j.type !== 'TRANSFER') return false;
                        let status = j.transferStatus || '';
                        // If a child DISPATCH has progressed further, use its status
                        const child = filteredJobs.find(d => d.type === 'DISPATCH' && (d.orderRef === j.id || d.orderRef === j.jobNumber) && d.status !== 'Cancelled');
                        if (child && ['Shipped', 'In-Transit'].includes(child.transferStatus || '')) status = child.transferStatus!;
                        return status === 'In-Transit' || status === 'Shipped';
                    }).length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span className="text-gray-400">{t('warehouse.completed')}:</span>
                    <span className="font-bold text-white">{filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'Received').length}</span>
                </div>
                {filteredJobs.filter(j => j.type === 'TRANSFER' && ['Received', 'Delivered', 'Completed'].some(s => s === j.transferStatus || s === j.status) && (j.lineItems || []).some((item: any) => item.receivedQty !== undefined && item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) && !['Resolved', 'Completed'].includes(item.status))).length > 0 && (
                    <div className="flex items-center gap-2 text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                        <span>{t('warehouse.discrepancyCount')}:</span>
                        <span className="font-bold">{filteredJobs.filter(j => j.type === 'TRANSFER' && ['Received', 'Delivered', 'Completed'].some(s => s === j.transferStatus || s === j.status) && (j.lineItems || []).some((item: any) => item.receivedQty !== undefined && item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) && !['Resolved', 'Completed'].includes(item.status))).length}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
