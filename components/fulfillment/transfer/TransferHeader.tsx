import React from 'react';
import { Truck, AlertTriangle } from 'lucide-react';
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
    activeSite
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                        <Truck size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--theme-text-primary)] text-lg tracking-tight uppercase">
                            {t('warehouse.interSiteTransfers')}
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">
                            {t('warehouse.requestManageTransfers')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                    {/* View Mode Segmented Control */}
                    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-1 rounded-xl flex items-center">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[36px] ${
                                viewMode === 'Process'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.activeTransfers').split(' ')[0]}
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[36px] ${
                                viewMode === 'History'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
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
                        className="px-4 py-2 bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold rounded-xl transition-opacity flex items-center gap-2 shadow-sm min-h-[44px]"
                    >
                        <Truck size={16} />
                        <span>{t('warehouse.transferCenter')}</span>
                    </button>
                </div>
            </div>

            {/* Transfer Summary */}
            <div className="flex items-center gap-5 text-xs flex-wrap pt-3 border-t border-[var(--theme-border)]">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[var(--theme-text-secondary)] font-medium">{t('warehouse.activeTransfers').split(' ')[0]}:</span>
                    <span className="font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                        {filteredJobs.filter(j => j.type === 'TRANSFER' && !['Received', 'Cancelled'].includes(j.transferStatus || '')).length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-[var(--theme-text-secondary)] font-medium">{t('warehouse.inTransitLabel')}:</span>
                    <span className="font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                        {filteredJobs.filter(j => {
                            if (j.type !== 'TRANSFER') return false;
                            let status = j.transferStatus || '';
                            const child = filteredJobs.find(d => d.type === 'DISPATCH' && (d.orderRef === j.id || d.orderRef === j.jobNumber) && d.status !== 'Cancelled');
                            if (child && ['Shipped', 'In-Transit'].includes(child.transferStatus || '')) status = child.transferStatus!;
                            return status === 'In-Transit' || status === 'Shipped';
                        }).length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[var(--theme-text-secondary)] font-medium">{t('warehouse.completed')}:</span>
                    <span className="font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                        {filteredJobs.filter(j => j.type === 'TRANSFER' && j.transferStatus === 'Received').length}
                    </span>
                </div>
                {filteredJobs.filter(j => j.type === 'TRANSFER' && ['Received', 'Delivered', 'Completed'].some(s => s === j.transferStatus || s === j.status) && (j.lineItems || []).some((item: any) => item.receivedQty !== undefined && item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) && !['Resolved', 'Completed'].includes(item.status))).length > 0 && (
                    <div className="flex items-center gap-1.5 text-red-500 font-medium">
                        <AlertTriangle size={14} className="text-red-500 shrink-0" />
                        <span>{t('warehouse.discrepancyCount')}:</span>
                        <span className="font-bold font-mono tabular-nums">
                            {filteredJobs.filter(j => j.type === 'TRANSFER' && ['Received', 'Delivered', 'Completed'].some(s => s === j.transferStatus || s === j.status) && (j.lineItems || []).some((item: any) => item.receivedQty !== undefined && item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) && !['Resolved', 'Completed'].includes(item.status))).length}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransferHeader;
