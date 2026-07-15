import React, { useState, useMemo, useEffect } from 'react';
import { History as HistoryIcon, Search, ChevronRight, User, Calendar, Clock, PackageCheck, Box, ArrowRight, MapPin } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { motion, AnimatePresence } from 'framer-motion';
import { getSellUnit } from '../../../utils/units';

import { useStore } from '../../../contexts/CentralStore';

interface PutawayHistoryProps {
    historicalJobs: WMSJob[];
    resolveOrderRef: (ref?: string) => string;
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void;
    employees: any[];
    t: (key: string) => string;
}

const ITEMS_PER_PAGE = 12;
const ITEMS_PER_PAGE_MOBILE = 2;

export const PutawayHistory: React.FC<PutawayHistoryProps> = ({
    historicalJobs,
    resolveOrderRef,
    setSelectedJob,
    setIsDetailsOpen,
    employees,
    t
}) => {
    const { user } = useStore();
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const perPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE;

    const filteredHistory = useMemo(() => {
        const mapped = historicalJobs
            .filter((j: WMSJob) => j.type === 'PUTAWAY' || j.type === 'REPLENISH')
            .map(j => {
                const item = j.lineItems?.[0];
                const userId = j.completedBy || j.assignedTo;
                const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                let userObj = employees.find(e => 
                    e.id === userId || 
                    (e.name && userId && e.name.toLowerCase() === userId.toLowerCase()) || 
                    (e.email && userId && e.email.toLowerCase() === userId.toLowerCase()) ||
                    (e.code && userId && e.code.toLowerCase() === userId.toLowerCase())
                );
                if (!userObj && user && userId && (
                    userId.toLowerCase() === user.id?.toLowerCase() || 
                    userId.toLowerCase() === user.email?.toLowerCase() || 
                    userId.toLowerCase() === user.name?.toLowerCase() || 
                    userId.toLowerCase() === user.employeeId?.toLowerCase()
                )) {
                    userObj = employees.find(e => 
                        (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase()) || 
                        (e.name && user.name && e.name.toLowerCase() === user.name.toLowerCase()) || 
                        e.id === user.employeeId
                    );
                }
                const displayId = userObj?.code || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');

                const resolvedUser = {
                    name: userObj?.name || (userId ? userId : 'System'),
                    displayId: displayId || ''
                };

                const isRealBay = (loc?: string) => loc && loc !== 'Receiving Dock' && loc !== 'Unknown' && loc !== 'Unassigned';
                const itemBay = j.lineItems?.find(li => isRealBay(li.location))?.location;
                const jobBay = isRealBay((j as any).location) ? (j as any).location : undefined;
                const resolvedLocation = itemBay || jobBay || 'Archive';

                let displayQty = '';
                if (item) {
                    const baseQty = item.expectedQty || item.quantity || 0;
                    const unitDef = getSellUnit(item.unit);
                    const sizeNum = parseFloat((item as any).size || '') || 0;
                    if ((unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0) {
                        displayQty = `${baseQty} × ${sizeNum}${unitDef.shortLabel.toLowerCase()}`;
                    } else {
                        displayQty = `${baseQty}${unitDef.code !== 'UNIT' ? ' ' + unitDef.shortLabel.toUpperCase() : ' ' + t('warehouse.itemPlural')}`;
                    }
                } else {
                    displayQty = `${j.items || 1} ${t('warehouse.itemPlural')}`;
                }

                return {
                    id: j.id,
                    reference: formatJobId(j),
                    type: j.type === 'REPLENISH' ? 'REPLENISH' : 'PUTAWAY',
                    actionType: j.type === 'REPLENISH' ? t('warehouse.tabs.replenish') : t('warehouse.putaway.putaway'),
                    status: j.status,
                    subtitle: item?.name || 'Unknown Product',
                    date: j.completedAt || j.updatedAt || j.createdAt || new Date().toISOString(),
                    resolvedUser,
                    items: j.items || 1,
                    sku: item?.sku,
                    quantity: item?.expectedQty || 0,
                    location: resolvedLocation,
                    rawData: j,
                    displayQty
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return mapped.filter(item => {
            if (!search) return true;
            const q = search.toLowerCase();
            const raw = item.rawData;

            const matchesItems = (raw.lineItems || raw.line_items || []).some((li: any) =>
                (li.name || '').toLowerCase().includes(q) ||
                (li.productName || '').toLowerCase().includes(q) ||
                (li.sku || '').toLowerCase().includes(q)
            );

            return (
                item.reference.toLowerCase().includes(q) ||
                item.subtitle.toLowerCase().includes(q) ||
                (item.sku && item.sku.toLowerCase().includes(q)) ||
                item.resolvedUser?.name.toLowerCase().includes(q) ||
                (item.resolvedUser?.displayId && item.resolvedUser.displayId.toLowerCase().includes(q)) ||
                item.location.toLowerCase().includes(q) ||
                raw.id.toLowerCase().includes(q) ||
                (raw.orderRef && raw.orderRef.toLowerCase().includes(q)) ||
                (raw.notes && raw.notes.toLowerCase().includes(q)) ||
                (raw.status && raw.status.toLowerCase().includes(q)) ||
                (raw.jobNumber && raw.jobNumber.toLowerCase().includes(q)) ||
                ((raw as any).job_number && (raw as any).job_number.toLowerCase().includes(q)) ||
                matchesItems
            );
        });
    }, [historicalJobs, search, employees, t]);

    const totalPages = Math.ceil(filteredHistory.length / perPage);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredHistory.slice(start, start + perPage);
    }, [filteredHistory, currentPage, perPage]);

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (isToday) {
            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        }

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };
    return (
        <div className="border-t-2 border-[#E2DCCE]/60 dark:border-white/10 mt-8 pt-8 relative overflow-hidden group/history">
            <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none opacity-50 group-hover/history:opacity-100 transition-opacity duration-1000" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h4 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tight">
                    <div className="p-2.5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-2xl border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 group-hover/history:bg-[#2C5E3B]/20 dark:group-hover:bg-[#A9CBA2]/25 transition-all shadow-sm">
                        <HistoryIcon size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    </div>
                    {t('warehouse.putaway.history')}
                </h4>
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors z-10" size={18} />
                    <input
                        type="text"
                        placeholder={`${t('warehouse.searchHistoryPlaceholder')}`}
                        aria-label={t('warehouse.searchHistoryPlaceholder')}
                        title={t('warehouse.searchHistoryPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="woody-input w-full !pl-12 pr-4 py-3.5 text-[10px] uppercase tracking-[0.2em] font-black"
                    />
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence>
                            {paginatedHistory.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => {
                                        setSelectedJob(item.rawData);
                                        setIsDetailsOpen(true);
                                    }}
                                    className="group relative bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 hover:bg-[#FAF8F5] dark:hover:bg-[#1C2620] border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 rounded-[2rem] p-5 transition-all duration-500 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl active:scale-[0.98]"
                                >
                                    <div className="relative flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-2 rounded-xl transition-colors shadow-sm ${item.type === 'REPLENISH' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/30' : 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30'}`}>
                                                <PackageCheck size={16} />
                                            </div>
                                            <span className="text-[9px] uppercase tracking-widest font-black text-gray-400 dark:text-gray-555">
                                                {item.actionType}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-555 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors uppercase tracking-widest font-mono italic">
                                            {getRelativeTime(item.date)}
                                        </span>
                                    </div>

                                    <div className="relative mb-5">
                                        <h5 className="text-gray-900 dark:text-white font-black text-sm truncate pr-2 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors uppercase tracking-tight leading-tight">
                                            {item.subtitle}
                                        </h5>
                                        <div className="flex items-center gap-2.5 mt-2.5 font-mono">
                                            <span className="bg-[#FAF8F5]/50 dark:bg-white/5 px-2 py-0.5 rounded text-[10px] font-black text-gray-500 dark:text-gray-400 border border-stone-200 dark:border-white/5 transition-all group-hover:bg-[#2C5E3B]/10 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2]">
                                                #{item.reference}
                                            </span>
                                            {item.sku && <span className="text-[10px] font-black text-gray-300 dark:text-gray-800">/ <span className="text-gray-400 dark:text-gray-600 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2]">{item.sku}</span></span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t-2 border-[#E2DCCE]/60 dark:border-white/5 transition-colors">
                                            <MapPin size={12} className="text-[#2C5E3B]/50 dark:text-[#A9CBA2]/50" />
                                            <span className="text-[10px] font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-2.5 py-1 rounded-lg tracking-widest uppercase transition-all group-hover:bg-[#2C5E3B] dark:group-hover:bg-[#EAE5D9] group-hover:text-white dark:group-hover:text-[#1E3B24] shadow-sm">
                                                {item.location}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative flex items-center justify-between border-t-2 border-[#E2DCCE]/60 dark:border-white/5 pt-4 mt-auto">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-stone-150 dark:bg-white/5 flex items-center justify-center border border-stone-200 dark:border-white/10 shadow-inner group-hover/history:scale-110 transition-transform">
                                                <span className="text-[10px] font-black text-gray-900 dark:text-[#A9CBA2]">{(item.resolvedUser?.name || 'S').charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 dark:text-gray-555 uppercase tracking-widest leading-none mb-0.5">{t('warehouse.putaway.worker')}</span>
                                                <span className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-tight leading-none">
                                                    {item.resolvedUser?.name} <span className="text-gray-400 dark:text-gray-555 font-bold">({item.resolvedUser?.displayId})</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-stone-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 group-hover:border-[#2C5E3B]/20 transition-all shadow-inner">
                                            <Box size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                            <span className="text-[11px] font-black text-gray-900 dark:text-[#EAE5D9] tabular-nums font-mono">{item.displayQty}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <div className="mt-8"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredHistory.length} itemsPerPage={perPage} onPageChange={setCurrentPage} itemName="records" /></div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 glass-panel-pushed rounded-[3rem] border border-dashed border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10 shadow-inner">
                    <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl mb-4 border border-gray-100 dark:border-white/10 shadow-xl">
                        <HistoryIcon size={40} className="text-gray-200 dark:text-gray-800" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 uppercase tracking-widest">{t('warehouse.noHistoryFound')}</h3>
                </div>
            )}
        </div>
    );
};
