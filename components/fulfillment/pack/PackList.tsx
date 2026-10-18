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
            <div className="hidden">
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
                                    className={`relative bg-[var(--theme-bg-card)] border rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-150 shadow-xs min-h-[48px] sm:min-h-[56px] touch-manipulation ${
                                        isCritical ? 'border-red-500/40' :
                                        isActive ? 'border-[var(--theme-accent)] shadow-[var(--theme-accent)]/10 shadow-xs' :
                                        'border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40'
                                    }`}
                                >
                                    {/* Priority accent stripe */}
                                    {isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                                    {isActive && !isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--theme-accent)]" />}

                                    <div className={`flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:px-4 sm:py-3.5 ${isCritical || isActive ? 'pl-3.5 sm:pl-5' : ''}`}>
                                        {/* Icon with progress on mobile */}
                                        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border ${
                                            progress >= 100
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                                : isActive
                                                    ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                                        }`}>
                                            <span className="sm:hidden font-mono text-xs font-bold">{Math.round(progress)}%</span>
                                            <Package size={20} className="hidden sm:block" />
                                        </div>

                                        {/* Main content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                                <span className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] font-mono uppercase tracking-wider truncate">
                                                    {formatJobId(job)}
                                                </span>
                                                {isCritical && (
                                                    <span className="flex items-center gap-1 bg-red-500/10 text-red-500 text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full uppercase border border-red-500/20 shrink-0">
                                                        <Zap size={10} /> Urgent
                                                    </span>
                                                )}
                                                {isActive && !isCritical && (
                                                    <span className="inline-flex items-center gap-1 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full uppercase border border-[var(--theme-accent)]/20 shrink-0">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)]" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[var(--theme-text-secondary)] font-medium truncate font-mono">
                                                <span>{totalItems} {totalItems === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}</span>
                                                {destSite?.name && (
                                                    <>
                                                        <span className="opacity-40">•</span>
                                                        <span className="truncate">{destSite.name}</span>
                                                    </>
                                                )}
                                                <span className="opacity-40">•</span>
                                                <span>{packedItems}/{totalItems}</span>
                                            </div>

                                            {/* Compact progress bar on desktop */}
                                            <div className="hidden sm:flex mt-2.5 items-center gap-2.5">
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
                                            <ChevronRight size={15} className="text-[var(--theme-text-secondary)] sm:w-[18px] sm:h-[18px]" />
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
