import React from 'react';
import { Truck, ArrowRight } from 'lucide-react';
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
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                        <Truck className="text-cyber-primary" size={24} />
                        {t('warehouse.interSiteTransfers')}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">{t('warehouse.requestManageTransfers')}</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/5 flex gap-1">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            const isHQ = activeSite?.type === 'HQ' || activeSite?.type === 'Administration' || ['super_admin', 'admin'].includes(user?.role || '');
                            const isWarehouse = activeSite?.type === 'Warehouse' || activeSite?.type === 'Distribution Center';
                            setTransferCenterTab(isHQ ? 'smart' : isWarehouse ? 'bulk' : 'request');
                            setShowTransferCenter(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-cyber-primary to-cyan-400 text-black font-bold rounded-lg hover:from-cyber-accent hover:to-cyan-300 transition-all flex items-center gap-2 shadow-lg shadow-cyber-primary/20"
                    >
                        <Truck size={16} />
                        Transfer Center
                    </button>
                </div>
            </div>

            {/* Transfer Summary */}
            <div className="flex items-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    <span className="text-gray-400">Active:</span>
                    <span className="font-bold text-white">{filteredJobs.filter(j => j.type === 'TRANSFER' && !['Received', 'Cancelled'].includes(j.transferStatus || '')).length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span className="text-gray-400">In Transit:</span>
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
                    <span className="text-gray-400">Completed:</span>
                    <span className="font-bold text-white">{filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'Received').length}</span>
                </div>
                {filteredJobs.filter(j => j.type === 'TRANSFER' && (j.lineItems || []).some((item: any) => item.receivedQty !== undefined && item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) && !['Resolved', 'Completed'].includes(item.status))).length > 0 && (
                    <div className="flex items-center gap-2 text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                        <span>Discrepancies:</span>
                        <span className="font-bold">{filteredJobs.filter(j => j.type === 'TRANSFER' && (j.lineItems || []).some((item: any) => item.receivedQty !== undefined && item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) && !['Resolved', 'Completed'].includes(item.status))).length}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
