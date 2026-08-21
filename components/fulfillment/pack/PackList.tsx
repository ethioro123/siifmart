import React from 'react';
import { Package, AlertTriangle, Clock, List, Box, ChevronRight, Trash2, Zap } from 'lucide-react';
import { Pagination } from '../../shared';
import { SortDropdown } from '../FulfillmentShared';
import { WMSJob, Site } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useFulfillment } from '../FulfillmentContext';
import { useStore } from '../../../contexts/CentralStore';

interface PackListProps {
    filteredPackJobs: WMSJob[]; paginatedPackJobs: WMSJob[];
    sites: Site[]; setSelectedPackJob: (job: WMSJob) => void;
    packCurrentPage: number; setPackCurrentPage: (page: number) => void;
    packJobsTotalPages: number; PACK_ITEMS_PER_PAGE: number;
    packSortBy: 'priority' | 'date' | 'items'; setPackSortBy: (val: 'priority' | 'date' | 'items') => void;
    isPackSortDropdownOpen: boolean; setIsPackSortDropdownOpen: (val: boolean) => void;
    t: (key: string) => string;
}

export const PackList: React.FC<PackListProps> = ({
    filteredPackJobs, paginatedPackJobs, sites, setSelectedPackJob, packCurrentPage, setPackCurrentPage, packJobsTotalPages, PACK_ITEMS_PER_PAGE, packSortBy, setPackSortBy, isPackSortDropdownOpen, setIsPackSortDropdownOpen, t
}) => {
    const { deleteJob } = useFulfillment(); const { user } = useStore();
    const handleDelete = async (e: React.MouseEvent, jobId: string) => { e.stopPropagation(); if (window.confirm(t('warehouse.packing.deleteConfirm'))) await deleteJob(jobId); };

    return (
        <div className="flex flex-col h-full bg-[#FAF8F5] dark:bg-[#1C2620] text-gray-900 dark:text-[#EAE5D9] transition-colors duration-500">
            {/* Mobile sort bar */}
            <div className="flex justify-end mb-3 px-1">
                <SortDropdown label={t('warehouse.sortByLabel')} options={[{ id: 'priority' as const, label: t('warehouse.prioritySort'), icon: <AlertTriangle size={12} /> }, { id: 'date' as const, label: t('warehouse.timeSort'), icon: <Clock size={12} /> }, { id: 'items' as const, label: t('warehouse.sizeSort'), icon: <List size={12} /> }]} value={packSortBy} onChange={setPackSortBy} isOpen={isPackSortDropdownOpen} setIsOpen={setIsPackSortDropdownOpen} />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredPackJobs.length > 0 ? (
                    <div className="flex flex-col gap-2.5 pb-6 px-0.5">
                        {paginatedPackJobs.map(job => {
                            const lineItems = job.lineItems || [];
                            const totalItems = lineItems.length;
                            const packedItems = lineItems.filter(i => i.status === 'Picked' || i.status === 'Completed').length;
                            const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;
                            const destSite = sites.find(s => s.id === job.destSiteId);
                            const isActive = job.status === 'In-Progress';
                            const isCritical = job.priority === 'Critical';

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => setSelectedPackJob(job)}
                                    className={`relative bg-white dark:bg-[#1C2620]/60 border rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-200 shadow-sm ${
                                        isCritical ? 'border-red-400/40 dark:border-red-500/30' :
                                        isActive ? 'border-[#2C5E3B]/50 dark:border-[#A9CBA2]/30 shadow-[#2C5E3B]/10 shadow-md' :
                                        'border-[#E2DCCE] dark:border-[#A9CBA2]/10'
                                    }`}
                                >
                                    {/* Priority accent stripe */}
                                    {isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                                    {isActive && !isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2C5E3B]" />}

                                    <div className={`flex items-center gap-3 px-4 py-3.5 ${isCritical || isActive ? 'pl-5' : ''}`}>
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            isActive ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10' :
                                            'bg-stone-100 dark:bg-white/5'
                                        }`}>
                                            <Package size={18} className={isActive ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-gray-400'} />
                                        </div>

                                        {/* Main content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">{formatJobId(job)}</span>
                                                {isCritical && (
                                                    <span className="flex items-center gap-0.5 bg-red-500/10 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border border-red-500/20 animate-pulse">
                                                        <Zap size={8} /> Urgent
                                                    </span>
                                                )}
                                                {isActive && !isCritical && (
                                                    <span className="bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border border-[#2C5E3B]/20 animate-pulse">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate">
                                                <span>{totalItems} items</span>
                                                {destSite?.name && <><span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" /><span className="truncate">{destSite.name}</span></>}
                                            </div>

                                            {/* Compact progress bar */}
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        ref={el => { if (el) el.style.width = `${progress}%`; }}
                                                        className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-green-500' : 'bg-[#2C5E3B]'}`}
                                                    />
                                                </div>
                                                <span className={`text-[9px] font-mono font-black shrink-0 ${progress === 100 ? 'text-green-500' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>
                                                    {packedItems}/{totalItems}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right actions */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {['super_admin', 'warehouse_manager'].includes(user?.role as string) && (
                                                <button
                                                    aria-label={t('warehouse.driverHub.cancel')}
                                                    title={t('warehouse.driverHub.cancel')}
                                                    onClick={(e) => handleDelete(e, job.id)}
                                                    className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-red-500 flex items-center justify-center active:scale-90 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-[#1C2620]/40 border-2 border-dashed border-stone-300 dark:border-[#A9CBA2]/10 flex items-center justify-center shadow-inner">
                            <Box size={32} className="text-gray-300 dark:text-[#A9CBA2]/20" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-gray-300 dark:text-white tracking-widest uppercase italic">{t('warehouse.noRecords')}</p>
                            <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mt-2 max-w-[200px] mx-auto leading-relaxed">{t('warehouse.packing.noMatchingPackingMissions')}</p>
                        </div>
                    </div>
                )}
            </div>
            <Pagination currentPage={packCurrentPage} totalPages={packJobsTotalPages} totalItems={filteredPackJobs.length} itemsPerPage={PACK_ITEMS_PER_PAGE} onPageChange={setPackCurrentPage} isLoading={false} itemName={t('warehouse.allMissions')} />
        </div>
    );
};
