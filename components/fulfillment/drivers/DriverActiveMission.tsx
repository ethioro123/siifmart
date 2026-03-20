import React from 'react';
import { ChevronRight, MapPin, Navigation, RefreshCw, Truck, CheckCircle, Shield, Warehouse } from 'lucide-react';
import { WMSJob, Site, User, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
// import { useAdjustStockMutation } from '../../../hooks/useAdjustStockMutation'; // Passed as prop if needed, or re-used hook here? Hook is better.
// Actually, re-using hook inside sub-component is fine if it creates new instance. 
// But DriverTab orchestrator might want to control it.
// Let's passed down `adjustStockMutation` if it was instantiated in parent.
// In DriverTab.tsx: `const adjustStockMutation = useAdjustStockMutation();`
// So we should pass it down. 

interface DriverActiveMissionProps {
    t: (key: string) => string;
    filteredJobs: WMSJob[];
    employees: any[];
    user: User | null;
    sites: Site[];
    jobs: WMSJob[];
    products: Product[];
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (val: boolean) => void;
    processingJobIds: Set<string>;
    setProcessingJobIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    wmsJobsService: any;
    refreshData: () => Promise<void>;
    addNotification: (type: string, message: string) => void;
    adjustStockMutation: any;
    addProduct: any;
}

export const DriverActiveMission: React.FC<DriverActiveMissionProps> = ({
    t,
    filteredJobs,
    employees,
    user,
    sites,
    jobs,
    products,
    setSelectedJob,
    setIsDetailsOpen,
    processingJobIds,
    setProcessingJobIds,
    wmsJobsService,
    refreshData,
    addNotification,
    adjustStockMutation,
    addProduct
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    {t('warehouse.docks.currentMission') || 'Active Mission'}
                </h4>
            </div>
            {(() => {
                const currentEmployee = employees.find(e => e.email === user?.email);
                const myJobs = filteredJobs.filter(j =>
                    j.type === 'DISPATCH' &&
                    j.assignedTo === currentEmployee?.id &&
                    j.status !== 'Completed'
                );

                if (myJobs.length === 0) {
                    return (
                        <div className="bg-black/20 border border-dashed border-white/5 rounded-3xl p-6 lg:p-8 text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Shield className="text-gray-700" size={24} />
                            </div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">No Active Job</p>
                        </div>
                    );
                }

                return myJobs.map((job, idx) => {
                    const destSite = sites.find(s => s.id === job.destSiteId);
                    const isPending = job.status === 'Pending';
                    const isFirst = idx === 0 && !isPending;

                    return (
                        <div
                            key={job.id}
                            onClick={() => {
                                setSelectedJob(job);
                                setIsDetailsOpen(true);
                            }}
                            className={`group relative rounded-[2rem] transition-all duration-500 overflow-hidden border cursor-pointer active:scale-95 ${isPending
                                ? 'bg-black/30 border-white/5 opacity-60'
                                : isFirst
                                    ? 'bg-gradient-to-br from-cyan-950/40 via-black to-black border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-cockpit-breathing'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {/* Tactical Corner Accent */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-[40px] -mr-12 -mt-12 rounded-full" />
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={16} className="text-cyan-400" />
                            </div>

                            <div className="p-6 relative z-10">
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${isPending ? 'bg-gray-500/10 text-gray-500 border-gray-500/20' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'} `}>
                                                {isPending ? 'PENDING' : 'READY'}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-600 font-bold uppercase tracking-widest">{formatJobId(job)}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-white leading-none">{job.items || job.lineItems?.length || 0}</p>
                                            <p className="text-[8px] text-cyan-500/60 font-black uppercase tracking-widest mt-0.5">Units</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none group-hover:text-cyan-400 transition-colors">
                                            {destSite?.name || 'Unknown Hub'}
                                        </h3>
                                        <div className="flex flex-col gap-1 mt-1.5">
                                            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                                <MapPin size={10} className="text-cyan-500/50" />
                                                <span className="truncate max-w-[150px]">{destSite?.address || 'Address Unavailable'}</span>
                                            </div>
                                            {job.location && (
                                                <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 w-fit px-2 py-0.5 rounded-md border border-cyan-500/20">
                                                    <Warehouse size={10} />
                                                    {job.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!isPending && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (destSite?.address) {
                                                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destSite.address)}`, '_blank');
                                                    } else {
                                                        addNotification('info', 'Address pending. Coordinates currently unavailable.');
                                                    }
                                                }}
                                                className="py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Navigation size={14} className="text-cyan-400" />
                                                NAV
                                            </button>
                                            {job.transferStatus !== 'In-Transit' && job.transferStatus !== 'Shipped' && job.transferStatus !== 'Delivered' ? (
                                                <button
                                                    disabled={processingJobIds.has(job.id) || job.status === 'Completed'}
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                        try {
                                                            // 🆕 PICKUP: Update status to In-Progress AND transferStatus to In-Transit
                                                            await wmsJobsService.update(job.id, {
                                                                status: 'In-Progress',
                                                                transferStatus: 'Shipped',
                                                                shippedAt: new Date().toISOString()
                                                            } as any);

                                                            if (job.orderRef) {
                                                                const parentTransfer = jobs.find(j => j.id === job.orderRef && j.type === 'TRANSFER');
                                                                if (parentTransfer) await wmsJobsService.update(parentTransfer.id, { transferStatus: 'Shipped' } as any);
                                                            }
                                                            await refreshData();
                                                            addNotification('success', 'Pickup confirmed. Job started.');
                                                        } catch (err) { addNotification('alert', 'Cloud sync failed.'); } finally {
                                                            setProcessingJobIds(prev => {
                                                                const next = new Set(prev);
                                                                next.delete(job.id);
                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                    className="py-3 bg-cyan-500 text-black rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
                                                    title="Confirm pickup and start transit"
                                                >
                                                    {processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={12} /> : <Truck size={12} />}
                                                    PICKUP
                                                </button>
                                            ) : (job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped') ? (
                                                <button
                                                    disabled={processingJobIds.has(job.id) || job.status === 'Completed'}
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                        try {
                                                            await wmsJobsService.update(job.id, { transferStatus: 'Delivered', deliveredAt: new Date().toISOString() } as any);
                                                            if (job.orderRef) {
                                                                const parentTransfer = jobs.find(j => j.id === job.orderRef && j.type === 'TRANSFER');
                                                                if (parentTransfer) await wmsJobsService.update(parentTransfer.id, { transferStatus: 'Delivered' } as any);
                                                            }
                                                            await refreshData();
                                                            addNotification('success', 'Delivered.');
                                                        } catch (err) { addNotification('alert', 'Cloud sync failed.'); } finally {
                                                            setProcessingJobIds(prev => {
                                                                const next = new Set(prev);
                                                                next.delete(job.id);
                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                    className="py-3 bg-purple-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50"
                                                    title="Mark as arrived at destination"
                                                >
                                                    {processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                                                    ARRIVED
                                                </button>
                                            ) : job.transferStatus === 'Delivered' ? (
                                                <button
                                                    disabled={processingJobIds.has(job.id) || job.status === 'Completed'}
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                        try {
                                                            // 1. Mark job as Completed
                                                            await wmsJobsService.update(job.id, {
                                                                status: 'Completed',
                                                                transferStatus: 'Received',
                                                                receivedAt: new Date().toISOString(),
                                                                receivedBy: user?.name || 'Driver'
                                                            } as any);

                                                            // 2. Update parent TRANSFER if exists
                                                            if (job.orderRef) {
                                                                const parentJob = jobs.find(j => j.id === job.orderRef);
                                                                if (parentJob) {
                                                                    await wmsJobsService.update(parentJob.id, {
                                                                        status: 'Completed',
                                                                        transferStatus: 'Received'
                                                                    } as any);
                                                                }
                                                            }

                                                            // 3. Adjust inventory at destination site
                                                            const destSiteId = job.destSiteId || (job as any).dest_site_id;
                                                            const lineItems = job.lineItems || (job as any).line_items || [];

                                                            for (const item of lineItems) {
                                                                const qty = item.receivedQty || item.quantity || item.expectedQty || item.pickedQty || 0;
                                                                if (qty > 0 && destSiteId) {
                                                                    // Find product at destination
                                                                    const destProduct = products.find(p =>
                                                                        (p.sku === item.sku || p.id === item.productId || p.productId === item.productId) &&
                                                                        (p.siteId === destSiteId || p.site_id === destSiteId)
                                                                    );

                                                                    if (destProduct) {
                                                                        await adjustStockMutation.mutateAsync({
                                                                            productId: destProduct.id,
                                                                            productName: destProduct.name || item.name || 'Product',
                                                                            productSku: destProduct.sku || item.sku || '',
                                                                            siteId: destSiteId,
                                                                            quantity: qty,
                                                                            type: 'IN',
                                                                            reason: `Driver Delivery: ${formatJobId(job)}`,
                                                                            canApprove: true
                                                                        });
                                                                    } else {
                                                                        // Auto-create product at destination if missing
                                                                        const templateProduct = products.find(p =>
                                                                            p.sku === item.sku || p.id === item.productId
                                                                        );
                                                                        if (templateProduct) {
                                                                            await addProduct({
                                                                                name: item.name || templateProduct?.name || 'Product',
                                                                                sku: item.sku || templateProduct?.sku,
                                                                                price: templateProduct?.price || 0,
                                                                                costPrice: (templateProduct as any)?.costPrice || 0,
                                                                                stock: qty,
                                                                                unit: templateProduct?.unit || 'pcs',
                                                                                siteId: destSiteId,
                                                                                category: templateProduct?.category || 'Uncategorized',
                                                                                productId: templateProduct?.productId || templateProduct?.id
                                                                            } as any);
                                                                        }
                                                                    }
                                                                }
                                                            }

                                                            await refreshData();
                                                            addNotification('success', 'Delivery Complete! Stock transferred.');
                                                        } catch (err) {
                                                            console.error('Failed to complete delivery:', err);
                                                            addNotification('alert', 'Failed to finalize delivery.');
                                                        } finally {
                                                            setProcessingJobIds(prev => {
                                                                const next = new Set(prev);
                                                                next.delete(job.id);
                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                    className="py-3 bg-green-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
                                                    title="Finalize delivery and update stock"
                                                >
                                                    {processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                                                    COMPLETE
                                                </button>
                                            ) : job.status === 'Completed' ? (
                                                <div className="py-2.5 bg-green-500/10 border border-green-500/30 rounded-2xl text-[8px] font-black text-green-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                                    <CheckCircle size={12} /> DONE
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                });
            })()}
        </div>
    );
};
