import React from 'react';
import { Package, AlertTriangle, Clock, List, Box, ChevronRight, Zap } from 'lucide-react';
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

    return (
        <div className="flex flex-col h-full bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] transition-colors duration-200">
            {/* Mobile sort bar */}
            <div className="flex justify-end mb-3 px-1 md:hidden">
                <SortDropdown
                    label={t('warehouse.sortByLabel')}
                    options={[
                        { id: 'priority' as const, label: t('warehouse.prioritySort'), icon: <AlertTriangle size={12} /> },
                        { id: 'date' as const, label: t('warehouse.timeSort'), icon: <Clock size={12} /> },
                        { id: 'items' as const, label: t('warehouse.sizeSort'), icon: <List size={12} /> }
                    ]}
                    value={packSortBy}
                    onChange={setPackSortBy}
                    isOpen={isPackSortDropdownOpen}
                    setIsOpen={setIsPackSortDropdownOpen}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredPackJobs.length > 0 ? (
                    <div className="flex flex-col gap-2.5 pb-6 px-0.5">
                        {paginatedPackJobs.map(job => {
                            const lineItems = job.lineItems || [];
                            const totalItems = lineItems.length;
                            const packedItems = lineItems.filter(i =>
                                job.status === 'Completed' ||
                                (i as any).packed === true ||
                                ((i as any).packedQty !== undefined && (i as any).packedQty >= (i.expectedQty || 1) - 0.001)
                            ).length;
                            const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;
                            const destSite = sites.find(s => s.id === job.destSiteId);
                            const isActive = job.status === 'In-Progress';
                            const isCritical = job.priority === 'Critical';

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => setSelectedPackJob(job)}
                                    className={`relative bg-[var(--theme-bg-card)] border rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-150 shadow-sm min-h-[56px] touch-manipulation ${
                                        isCritical ? 'border-red-500/40' :
                                        isActive ? 'border-[var(--theme-accent)] shadow-[var(--theme-accent)]/10 shadow-md' :
                                        'border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40'
                                    }`}
                                >
                                    {/* Priority accent stripe */}
                                    {isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                                    {isActive && !isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--theme-accent)]" />}

                                    <div className={`flex items-center gap-3.5 px-3.5 sm:px-4 py-3.5 ${isCritical || isActive ? 'pl-4 sm:pl-5' : ''}`}>
                                        {/* Icon */}
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                            isActive ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]' :
                                            'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)]'
                                        }`}>
                                            <Package size={20} />
                                        </div>

                                        {/* Main content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-[var(--theme-text-primary)] font-mono uppercase tracking-wider truncate">
                                                    {formatJobId(job)}
                                                </span>
                                                {isCritical && (
                                                    <span className="flex items-center gap-1 bg-red-500/10 text-red-500 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase border border-red-500/20 shrink-0">
                                                        <Zap size={10} /> Urgent
                                                    </span>
                                                )}
                                                {isActive && !isCritical && (
                                                    <span className="bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase border border-[var(--theme-accent)]/20 shrink-0">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] font-medium truncate">
                                                <span className="font-mono tabular-nums">{totalItems} {totalItems === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}</span>
                                                {destSite?.name && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-[var(--theme-text-secondary)]/40 shrink-0" />
                                                        <span className="truncate">{destSite.name}</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Compact progress bar */}
                                            <div className="mt-2.5 flex items-center gap-2.5">
                                                <div className="flex-1 h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden">
                                                    <div
                                                        ref={el => { if (el) el.style.width = `${progress}%`; }}
                                                        className={`h-full rounded-full transition-colors duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-[var(--theme-accent)]'}`}
                                                    />
                                                </div>
                                                <span className={`text-[11px] font-mono tabular-nums font-semibold shrink-0 ${progress === 100 ? 'text-green-500' : 'text-[var(--theme-accent)]'}`}>
                                                    {packedItems}/{totalItems}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <ChevronRight size={18} className="text-[var(--theme-text-secondary)]" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-[var(--theme-bg-subtle)] border-2 border-dashed border-[var(--theme-border)] flex items-center justify-center">
                            <Box size={32} className="text-[var(--theme-text-secondary)] opacity-40" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('warehouse.noRecords')}</p>
                            <p className="text-[11px] font-medium text-[var(--theme-text-secondary)] mt-1.5 max-w-[240px] mx-auto leading-relaxed">{t('warehouse.packing.noMatchingPackingMissions')}</p>
                        </div>
                    </div>
                )}
            </div>
            <Pagination currentPage={packCurrentPage} totalPages={packJobsTotalPages} totalItems={filteredPackJobs.length} itemsPerPage={PACK_ITEMS_PER_PAGE} onPageChange={setPackCurrentPage} isLoading={false} itemName={t('warehouse.allMissions')} />
        </div>
    );
};
