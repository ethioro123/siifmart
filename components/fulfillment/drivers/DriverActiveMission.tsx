import React, { useMemo, useState, useEffect } from 'react';
import { MapPin, Navigation, RefreshCw, Truck, CheckCircle, Shield } from 'lucide-react';
import { WMSJob, Site, User, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import Pagination from '../../shared/Pagination';

interface DriverActiveMissionProps {
    t: (key: string) => string; filteredJobs: WMSJob[]; employees: any[];
    user: User | null; sites: Site[]; jobs: WMSJob[]; products: Product[];
    setSelectedJob: (job: WMSJob | null) => void; setIsDetailsOpen: (val: boolean) => void;
    processingJobIds: Set<string>; setProcessingJobIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    wmsJobsService: any; refreshData: () => Promise<void>; addNotification: (type: string, message: string) => void;
    adjustStockMutation: any; addProduct: any; globalSearch: string;
}

export const DriverActiveMission: React.FC<DriverActiveMissionProps> = ({
    t, filteredJobs, employees, user, sites, jobs, products, setSelectedJob, setIsDetailsOpen, processingJobIds, setProcessingJobIds, wmsJobsService, refreshData, addNotification, adjustStockMutation, addProduct, globalSearch
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        setCurrentPage(1);
    }, [globalSearch]);

    const myJobs = useMemo(() => {
        const canSeeGlobalQueue = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'].includes((user?.role || '').toLowerCase());
        const currentEmployee = employees.find(e => (user?.email && e.email === user.email) || (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && e.id === (user as any).employeeId) || e.id === user?.id);
        const employeeId = currentEmployee?.id || user?.id;
        const result = filteredJobs.filter(j => {
            if (j.type !== 'DISPATCH' && j.type !== 'TRANSFER' && j.type !== 'DRIVER') return false;
            if (canSeeGlobalQueue ? !j.assignedTo : j.assignedTo !== employeeId) return false;
            if (j.status === 'Completed' || j.transferStatus === 'Delivered' || j.transferStatus === 'Received') return false;
            return (j.transferStatus === 'In-Transit' || j.transferStatus === 'Shipped');
        });
        const query = globalSearch.toLowerCase().trim();
        if (!query) return result;
        return result.filter(j => formatJobId(j).toLowerCase().includes(query) || sites.find(s => s.id === j.destSiteId)?.name?.toLowerCase().includes(query) || j.trackingNumber?.toLowerCase().includes(query));
    }, [filteredJobs, employees, user, globalSearch, sites]);

    const totalPages = Math.ceil(myJobs.length / ITEMS_PER_PAGE);
    const paginatedJobs = useMemo(() => myJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [myJobs, currentPage]);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between px-3">
                <h4 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2.5 italic">
                    <div className="w-2 h-2 rounded-full bg-[#A9CBA2] animate-pulse shadow-[0_0_10px_rgba(169,203,162,0.4)]" />
                    {t('warehouse.docks.currentMission') || 'Active Mission'}
                </h4>
            </div>

            {myJobs.length === 0 ? (
                <div className="bg-gray-50 dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[2.5rem] p-10 text-center shadow-inner">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm"><Shield className="text-gray-400 dark:text-gray-700" size={32} /></div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em]">{globalSearch ? 'No missions match search' : 'No Active Mission'}</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {paginatedJobs.map((job, idx) => {
                        const destSite = sites.find(s => s.id === job.destSiteId); const isPending = job.status === 'Pending'; const isFirst = idx === 0 && !isPending;
                        return (
                            <div key={job.id} onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }} className={`group rounded-[2.5rem] transition-all border-2 cursor-pointer shadow-sm active:scale-[0.98] ${isPending ? 'bg-gray-100 dark:bg-black/30 border-gray-200 dark:border-white/5 opacity-60' : isFirst ? 'bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 shadow-[#2C5E3B]/5' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                                <div className="p-6 flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full border-2 border-white/20 dark:border-black/20 ${job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped' ? 'bg-amber-500 animate-pulse' : 'bg-[#A9CBA2] animate-pulse'}`} />
                                            <span className="text-xs font-black text-gray-900 dark:text-gray-300 tracking-[0.15em] uppercase">{formatJobId(job)}</span>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' : 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20'}`}>{job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped' ? 'In-Transit' : 'Active'}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight mb-2 underline decoration-[#A9CBA2]/30 decoration-4 underline-offset-4">{destSite?.name || 'Customer'}</h3>
                                        <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
                                            <MapPin size={14} className="mt-0.5 shrink-0 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                            <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">{destSite?.address || 'Address Hidden'}{job.location ? ` • ${job.location}` : ''}</p>
                                        </div>
                                    </div>
                                    {(() => {
                                        const canSeeGlobalQueue = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'].includes((user?.role || '').toLowerCase());
                                        if (canSeeGlobalQueue && job.assignedTo) { const assignedEmployee = employees.find(e => e.id === job.assignedTo); return ( <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full w-fit uppercase tracking-widest italic"><Truck size={10} />DRV: {assignedEmployee?.name || 'Self'}</div> ); }
                                        return null;
                                    })()}
                                    {!isPending && (
                                        <div className="flex items-center gap-3 pt-5 border-t-2 border-gray-100 dark:border-white/5">
                                            {(job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped') && ( <button onClick={(e) => { e.stopPropagation(); if (destSite?.address) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destSite.address)}`, '_blank'); else addNotification('info', 'Address pending.'); }} className="px-5 py-3 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 rounded-2xl text-[10px] font-black text-gray-900 dark:text-white uppercase flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"><Navigation size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />GPS</button> )}
                                            {(job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped') ? (
                                                <button disabled={processingJobIds.has(job.id)} onClick={async (e) => {
                                                    e.stopPropagation(); setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                    try {
                                                        await wmsJobsService.update(job.id, { status: 'Completed', transferStatus: 'Delivered', deliveredAt: new Date().toISOString(), receivedBy: user?.name || 'Driver' } as any);
                                                        if (job.orderRef) { const parentJob = jobs.find(j => j.id === job.orderRef); if (parentJob) await wmsJobsService.update(parentJob.id, { status: 'Completed', transferStatus: 'Delivered' } as any); }
                                                        const destSiteId = job.destSiteId || (job as any).dest_site_id; const lineItems = job.lineItems || (job as any).line_items || [];
                                                        for (const item of lineItems) {
                                                            const qty = item.receivedQty || item.quantity || item.expectedQty || item.pickedQty || 0;
                                                            if (qty > 0 && destSiteId) {
                                                                const destProduct = products.find(p => (p.sku === item.sku || p.id === item.productId || p.productId === item.productId) && (p.siteId === destSiteId || p.site_id === destSiteId));
                                                                if (destProduct) await adjustStockMutation.mutateAsync({ productId: destProduct.id, productName: destProduct.name || item.name || 'Product', productSku: destProduct.sku || item.sku || '', siteId: destSiteId, quantity: qty, type: 'IN', reason: `Delivery: ${formatJobId(job)}`, canApprove: true });
                                                                else { const templateProduct = products.find(p => p.sku === item.sku || p.id === item.productId); if (templateProduct) await addProduct({ name: item.name || templateProduct?.name || 'Product', sku: item.sku || templateProduct?.sku, price: templateProduct?.price || 0, costPrice: (templateProduct as any)?.costPrice || 0, stock: qty, unit: templateProduct?.unit || 'pcs', siteId: destSiteId, category: templateProduct?.category || 'Uncategorized', productId: templateProduct?.productId || templateProduct?.id } as any); }
                                                            }
                                                        }
                                                        await refreshData(); addNotification('success', 'Safe arrival! Delivery logged.');
                                                    } catch (err) { addNotification('alert', 'System error.'); } finally { setProcessingJobIds(prev => { const next = new Set(prev); next.delete(job.id); return next; }); }
                                                }} className="flex-1 py-3 bg-[#DFF20F] hover:bg-[#cbe60d] rounded-2xl text-black text-[10px] font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl active:scale-95 transition-all">
                                                    {processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle size={14} />} DELIVERED
                                                </button>
                                            ) : <div className="flex-1 py-3 bg-green-500/10 border-2 border-green-500/20 rounded-2xl text-[10px] font-black text-green-600 dark:text-green-400 uppercase flex items-center justify-center gap-2 italic tracking-widest"><CheckCircle size={14} /> Mission Success</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {myJobs.length > ITEMS_PER_PAGE && <div className="mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={myJobs.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} isLoading={false} itemName="Missions" /></div>}
                </div>
            )}
        </div>
    );
};
