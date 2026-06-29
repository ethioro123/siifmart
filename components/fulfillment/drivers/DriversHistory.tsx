import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Package, Archive, Undo2 } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { ReturnToWarehouseModal } from '../returns/ReturnToWarehouseModal';

interface DriversHistoryProps {
    t: (key: string) => string;
    historicalJobs: WMSJob[]; sites: Site[]; employees: any[]; resolveOrderRef: (ref: string | undefined) => string;
    setSelectedJob: (job: WMSJob) => void; setIsDetailsOpen: (isOpen: boolean) => void;
    products: Product[]; user: any; addNotification: (type: string, message: string) => void;
    inventoryRequestsService: any; wmsJobsService?: any; jobs?: WMSJob[];
}

const ITEMS_PER_PAGE = 20;

export const DriversHistory: React.FC<DriversHistoryProps> = ({
    t,
    historicalJobs, sites, employees = [], resolveOrderRef, setSelectedJob, setIsDetailsOpen, products, user, addNotification, inventoryRequestsService, wmsJobsService, jobs = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [returnJob, setReturnJob] = useState<WMSJob | null>(null);

    const currentEmployee = useMemo(() => employees.find(e => (user?.email && e.email === user.email) || (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && e.id === (user as any).employeeId) || e.id === user?.id), [employees, user]);
    const filteredHistory = useMemo(() => {
        const canSeeGlobalQueue = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'].includes((user?.role || '').toLowerCase());
        const employeeId = currentEmployee?.id || user?.id;
        return historicalJobs.filter((j: WMSJob) => {
            const isTypeMatch = (j.type === 'DISPATCH' || j.type === 'TRANSFER' || j.type === 'DRIVER');
            const isRoleMatch = canSeeGlobalQueue ? true : j.assignedTo === employeeId;
            const isQueryMatch = !searchQuery || formatJobId(j).toLowerCase().includes(searchQuery.toLowerCase()) || (j.orderRef && (j.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) || resolveOrderRef(j.orderRef).toLowerCase().includes(searchQuery.toLowerCase())));
            return isTypeMatch && isRoleMatch && isQueryMatch;
        });
    }, [historicalJobs, searchQuery, resolveOrderRef, currentEmployee, user?.role, user?.id]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredHistory, currentPage]);

    return (
        <div className="bg-white dark:bg-[#0a0a0b] border-2 border-gray-100 dark:border-white/10 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-12 shadow-xl relative overflow-hidden group/log mb-10 transition-all">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(240,240,240,0)_50%,rgba(0,0,0,0.02)_50%),linear-gradient(90deg,rgba(0,0,0,0.01),rgba(0,0,0,0.01),rgba(0,0,0,0.01))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-40 dark:opacity-20" />
            
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-2xl border-2 border-[#2C5E3B]/10 dark:border-[#A9CBA2]/20 shadow-sm"><HistoryIcon size={28} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /></div>
                    <div><h4 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{t('warehouse.driverHub.jobHistory')}</h4><div className="flex items-center gap-2.5 mt-1.5"><div className="w-2 h-2 rounded-full bg-[#A9CBA2] animate-pulse" /><p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-[0.25em]">{t('warehouse.driverHub.pastAssignments')}</p></div></div>
                </div>
                <div className="relative w-full xl:w-[450px] group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2C5E3B] transition-colors pointer-events-none"><Search size={20} /></div>
                    <input type="text" placeholder={t('warehouse.driverHub.searchHistory')} aria-label={t('warehouse.driverHub.searchHistory')} title={t('warehouse.driverHub.searchHistory')} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full bg-gray-50 dark:bg-black/60 border-2 border-gray-100 dark:border-white/10 rounded-[1.5rem] pl-16 pr-8 py-5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]/50 transition-all font-mono uppercase tracking-[0.15em] placeholder:text-gray-400 dark:placeholder:text-gray-805 shadow-inner" />
                </div>
            </div>

            <div className="relative z-10 space-y-5">
                {paginatedHistory.length > 0 ? (
                    <div className="space-y-4">
                        {paginatedHistory.map((job: any) => {
                            const destSite = sites.find(s => s.id === job.destSiteId);
                            return (
                                <div key={job.id} onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }} className="flex flex-col md:flex-row items-center gap-5 md:gap-8 bg-gray-50/50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] border-2 border-gray-50 dark:border-white/5 hover:border-[#2C5E3B]/30 rounded-[1.5rem] lg:rounded-[2rem] p-5 lg:p-7 transition-all group/item cursor-pointer shadow-sm hover:shadow-[#2C5E3B]/5">
                                    <div className="w-full md:w-40 flex flex-col justify-center">
                                        <span className="text-[11px] font-black text-[#2C5E3B] dark:text-[#A9CBA2]/50 group-hover/item:text-[#2C5E3B] dark:group-hover/item:text-[#A9CBA2] transition-colors uppercase tracking-widest">{formatJobId(job)}</span>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold mt-1.5 uppercase tracking-wider italic">{formatDateTime(job.updatedAt || job.createdAt)}</p>
                                    </div>
                                    <div className="h-12 w-px bg-gray-200 dark:bg-white/5 hidden md:block" />
                                    <div className="flex-1 flex items-center gap-5 min-w-0 w-full">
                                        <div className="p-4 bg-white dark:bg-black/40 rounded-2xl border-2 border-gray-100 dark:border-white/5 shadow-sm group-hover/item:border-[#2C5E3B]/20 transition-all"><Package size={22} className="text-gray-300 dark:text-gray-505 group-hover/item:text-[#2C5E3B] dark:group-hover/item:text-white transition-colors" /></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1.5 italic">{t('warehouse.driverHub.destination')}</p>
                                            <h6 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight truncate underline decoration-[#A9CBA2]/10 group-hover/item:decoration-[#A9CBA2]/30 decoration-2 underline-offset-4">{destSite?.name || t('warehouse.driverHub.customer')}</h6>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 md:gap-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-100 dark:border-white/5 pt-5 md:pt-0 mt-2 md:mt-0">
                                        <div className="text-right">
                                            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">{t('warehouse.driverHub.totalItems')}</p>
                                            <div className="flex items-center gap-2.5 justify-end"><span className="text-gray-900 dark:text-white font-black text-2xl tracking-tighter">{job.items || 0}</span><span className="text-[10px] text-gray-300 dark:text-gray-600 font-black uppercase tracking-widest">{t('warehouse.driverHub.units')}</span></div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-500/5 px-5 py-2.5 rounded-2xl border-2 border-green-100 dark:border-green-500/10 shadow-sm"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" /><span className="text-[10px] text-green-700 dark:text-green-400 uppercase font-black tracking-widest italic">{t('warehouse.driverHub.delivered')}</span></div>
                                        {job.status === 'Completed' && <button onClick={(e) => { e.stopPropagation(); setReturnJob(job); }} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/15 px-5 py-2.5 rounded-2xl border-2 border-amber-100 dark:border-amber-500/10 hover:border-amber-400 dark:hover:border-amber-500/30 transition-all text-amber-700 dark:text-amber-400 shadow-sm group/btn active:scale-95"><Undo2 size={14} className="group-hover/btn:-rotate-45 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">{t('warehouse.driverHub.return')}</span></button>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-40 bg-gray-50/50 dark:bg-white/[0.02] rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-white/5 relative overflow-hidden shadow-inner">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="p-8 bg-white dark:bg-white/5 rounded-full mb-8 border-2 border-gray-100 dark:border-white/5 shadow-sm"><Archive className="text-gray-200 dark:text-gray-700" size={56} /></div>
                            <h3 className="text-2xl font-black text-gray-300 dark:text-white uppercase tracking-[0.4em] italic leading-none">{t('warehouse.driverHub.logEmpty')}</h3>
                            <p className="text-gray-400 dark:text-gray-700 font-bold uppercase tracking-widest text-[11px] mt-4 max-w-[250px] leading-relaxed">{t('warehouse.driverHub.archiveEmpty')}</p>
                        </div>
                    </div>
                )}
                <div className="pt-8"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredHistory.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} isLoading={false} itemName="RECORDS" /></div>
            </div>
            {returnJob && <ReturnToWarehouseModal job={returnJob} products={products} user={user} onClose={() => setReturnJob(null)} addNotification={addNotification} inventoryRequestsService={inventoryRequestsService} wmsJobsService={wmsJobsService} jobs={jobs} />}
        </div>
    );
};
