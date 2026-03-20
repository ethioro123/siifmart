import React, { useState, useEffect } from 'react';
import { Truck, RefreshCw, X, Activity, ShieldCheck, Rocket, Trash2, ArrowRight, Warehouse, ShoppingBag, Plus } from 'lucide-react';
import { WMSJob, Product, Site, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatCompactNumber } from '../../../utils/formatting';
import { ProgressBar } from '../../shared/ProgressBar';

interface SmartReplenishModalProps {
    isOpen: boolean;
    onClose: () => void;
    sites: Site[];
    products: Product[];
    allProducts: Product[];
    user: User | null;
    wmsJobsService: any;
    productsService: any;
    addNotification: (type: any, message: string) => void;
    refreshData: () => Promise<void>;
    renderTabs: () => React.ReactNode;
}

export const SmartReplenishModal: React.FC<SmartReplenishModalProps> = ({
    isOpen,
    onClose,
    sites,
    products,
    allProducts,
    user,
    wmsJobsService,
    productsService,
    addNotification,
    refreshData,
    renderTabs
}) => {
    // --- STATE ---
    const [distHubLoading, setDistHubLoading] = useState(false);
    const [distHubLowStockItems, setDistHubLowStockItems] = useState<any[]>([]);
    const [distHubSelectedSku, setDistHubSelectedSku] = useState('');
    const [distHubSelectedDestSite, setDistHubSelectedDestSite] = useState('');
    const [distHubAvailableSources, setDistHubAvailableSources] = useState<any[]>([]);
    const [distHubTransferDrafts, setDistHubTransferDrafts] = useState<any[]>([]);
    const [distHubSectorIntegrity, setDistHubSectorIntegrity] = useState(100);
    const [distHubTimer, setDistHubTimer] = useState(0);

    // --- EFFECTS ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen) {
            setDistHubTimer(0);
            interval = setInterval(() => setDistHubTimer(prev => prev + 1), 1000);
            fetchDistHubData();
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    const formatMissionTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchDistHubData = async () => {
        setDistHubLoading(true);
        try {
            // 1. Analyze entire network stock
            const result = await productsService.getAll(); // Fetch ALL products across ALL sites
            const allSiteProducts = result.data || [];
            const lowStock: any[] = [];
            let totalItems = 0;
            let healthyItems = 0;

            allSiteProducts.forEach((p: any) => {
                totalItems++;
                if (p.minStock > 0 && p.stock < p.minStock) {
                    lowStock.push(p);
                } else {
                    healthyItems++;
                }
            });

            setDistHubLowStockItems(lowStock);
            setDistHubSectorIntegrity(totalItems > 0 ? (healthyItems / totalItems) * 100 : 100);
        } catch (err) {
            console.error('Dist Hub Analysis Failed', err);
            addNotification('alert', 'Network analysis failed');
        } finally {
            setDistHubLoading(false);
        }
    };

    const handleSelectLowStockProduct = (targetProduct: any) => {
        setDistHubSelectedSku(targetProduct.sku);
        setDistHubSelectedDestSite(targetProduct.siteId || targetProduct.site_id);

        // Find sources with surplus of this SKU
        // In a real app, this would query backend. Simulation:
        const potentialSources = allProducts.filter(p =>
            p.sku === targetProduct.sku &&
            p.stock > 10 && // Must have some safety stock
            (p.siteId || p.site_id) !== (targetProduct.siteId || targetProduct.site_id)
        );

        setDistHubAvailableSources(potentialSources.map(p => ({
            ...p,
            site: sites.find(s => s.id === (p.siteId || p.site_id))
        })));
    };

    const addToDistDraft = (sourceProd: any, qty: number) => {
        const destSite = sites.find(s => s.id === distHubSelectedDestSite);
        setDistHubTransferDrafts(prev => [...prev, {
            sku: distHubSelectedSku,
            sourceSiteId: sourceProd.siteId || sourceProd.site_id,
            sourceSiteName: sourceProd.site?.name,
            destSiteId: distHubSelectedDestSite,
            destSiteName: destSite?.name || 'Unknown',
            qty
        }]);
        addNotification('success', 'Mission added to queue');
    };

    const removeFromDistDraft = (index: number) => {
        setDistHubTransferDrafts(prev => prev.filter((_, i) => i !== index));
    };

    const submitDistTransfers = async () => {
        setDistHubLoading(true);
        try {
            let successCount = 0;
            for (const draft of distHubTransferDrafts) {
                // Find source product ID to link correct item
                const srcProd = allProducts.find(p => p.sku === draft.sku && (p.siteId || p.site_id) === draft.sourceSiteId);
                if (!srcProd) {
                    console.error(`Source product for SKU ${draft.sku} not found at site ${draft.sourceSiteId}`);
                    continue;
                }

                const orderRef = `${draft.sku}-${Date.now().toString().slice(-4)}`;
                const job: any = {
                    siteId: draft.destSiteId,
                    site_id: draft.destSiteId,
                    type: 'TRANSFER',
                    sourceSiteId: draft.sourceSiteId,
                    destSiteId: draft.destSiteId,
                    priority: 'Normal',
                    status: 'Pending',
                    transferStatus: 'Approved',
                    orderRef,
                    items: 1,
                    lineItems: [{
                        productId: srcProd.id,
                        sku: srcProd.sku,
                        name: srcProd.name,
                        expectedQty: draft.qty,
                        receivedQty: 0,
                        status: 'Pending'
                    }]
                };

                const createdTransfer = await wmsJobsService.create(job);
                const pickJob: any = {
                    site_id: draft.sourceSiteId,
                    siteId: draft.sourceSiteId,
                    type: 'PICK',
                    sourceSiteId: draft.sourceSiteId,
                    destSiteId: draft.destSiteId,
                    priority: 'Normal',
                    status: 'Pending',
                    orderRef: createdTransfer.id,
                    items: 1,
                    lineItems: [{
                        productId: srcProd.id,
                        sku: srcProd.sku,
                        name: srcProd.name,
                        expectedQty: draft.qty,
                        pickedQty: 0,
                        status: 'Pending'
                    }],
                    jobNumber: createdTransfer.job_number
                };

                await wmsJobsService.create(pickJob);
                successCount++;
            }

            addNotification('success', `Successfully created ${successCount} transfer jobs`);
            onClose();
            setDistHubTransferDrafts([]);
            refreshData();
        } catch (err) {
            console.error('Failed to submit transfers:', err);
            addNotification('alert', 'Error creating some transfer jobs');
        } finally {
            setDistHubLoading(false);
        }
    };

    const ScanningAnimation = () => (
        <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-cyber-primary/30 rounded-lg animate-ping" />
            <div className="absolute inset-0 border-2 border-cyber-primary rounded-lg animate-pulse" />
            <RefreshCw className="text-cyber-primary relative z-10" size={24} />
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full h-full md:p-8 flex flex-col">
                <div className="flex-1 bg-cyber-gray md:rounded-3xl border border-amber-500/20 shadow-[0_0_100px_rgba(245,158,11,0.1)] flex flex-col overflow-hidden relative">
                    {/* Mission Control Header */}
                    <div className="p-6 border-b border-amber-500/20 bg-gradient-to-r from-amber-900/10 to-transparent flex justify-between items-center relative z-10 glass-pattern">
                        <div className="flex items-center gap-6">
                            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <Activity className="text-amber-500 animate-pulse" size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                                    DISTRIBUTION <span className="text-amber-500">HUB</span>
                                </h2>
                                <p className="text-amber-500/60 font-mono text-xs tracking-[0.2em] uppercase">Tactical Supply Deployment</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4 px-6 py-2 bg-black/40 rounded-full border border-amber-500/10">
                                {renderTabs()} {/* Navigation tabs injected here */}
                            </div>

                            <div className="flex items-center gap-4 px-6 py-2 bg-black/40 rounded-full border border-amber-500/10">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Network Status</span>
                                    <span className="text-emerald-400 font-mono text-sm font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        ONLINE
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Sector Integrity</span>
                                    <span className="text-amber-400 font-mono text-sm font-bold">{distHubSectorIntegrity.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="text-right mr-4">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Mission Timer</p>
                                <p className="font-mono text-xl text-white font-bold tracking-widest">{formatMissionTime(distHubTimer)}</p>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close modal"
                                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 flex items-center justify-center transition-all group"
                            >
                                <X className="text-gray-400 group-hover:text-red-500 transition-colors" size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Tactical Grid */}
                    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(245,158,11,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />

                    <div className="flex-1 flex overflow-hidden relative z-10">
                        {/* Left Panel: Needs Analysis */}
                        <div className="w-1/3 bg-black/20 border-r border-amber-500/10 flex flex-col">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-sm bg-black/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Store Needs</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Critical Deployment Targets</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black border border-amber-500/20 shadow-inner">
                                        {distHubLowStockItems.length} DETECTED
                                    </div>
                                    <button
                                        onClick={fetchDistHubData}
                                        disabled={distHubLoading}
                                        className="p-2.5 hover:bg-white/10 rounded-xl text-gray-400 transition-all hover:text-white group active:scale-95 border border-transparent hover:border-white/10"
                                        title="Rescan Network Gaps"
                                    >
                                        <RefreshCw size={14} className={`${distHubLoading ? 'animate-spin text-amber-500' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative pb-20">
                                {distHubLowStockItems.map(item => {
                                    const isSelected = distHubSelectedSku === item.sku && distHubSelectedDestSite === (item.siteId || item.site_id);
                                    const stockRatio = item.stock / (item.minStock || 1);
                                    const isCritical = stockRatio <= 0.3;
                                    const siteName = sites.find(s => s.id === (item.siteId || item.site_id))?.name || 'Local Store';

                                    return (
                                        <button
                                            key={`${item.id}-${item.sku}`}
                                            onClick={() => handleSelectLowStockProduct(item)}
                                            title={`Select ${item.name} for distribution`}
                                            className={`w-full text-left p-4 transition-all duration-500 relative group/card border rounded-2xl ${isSelected
                                                ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20'
                                                : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                                                }`}
                                        >
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/[0.03] to-transparent pointer-events-none" />
                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                                        <span className="text-[9px] font-mono font-black text-white/40 uppercase tracking-[0.2em]">{item.sku}</span>
                                                    </div>
                                                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">{siteName}</div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${isCritical ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                    {isCritical ? 'THREAT: CRITICAL' : 'THREAT: LOW'}
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-white mb-4 leading-tight group-hover/card:text-amber-500 transition-colors uppercase tracking-tight">{item.name}</div>
                                            <div className="space-y-2.5 relative z-10">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em]">
                                                    <span className={isCritical ? 'text-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-amber-500/60'}>
                                                        Current Utilization
                                                    </span>
                                                    <span className="text-white font-mono flex items-center gap-1.5 text-[10px]">
                                                        <span className={isCritical ? 'text-red-500' : 'text-white'}>{item.stock}</span>
                                                        <span className="text-white/30">/</span>
                                                        <span className="text-white/60">{item.minStock}</span>
                                                    </span>
                                                </div>
                                                <ProgressBar
                                                    progress={(item.stock / (item.minStock || 1)) * 100}
                                                    containerClassName="h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/5"
                                                    fillClassName={`h-full transition-all duration-1000 ${isCritical ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-amber-500 to-amber-300'}`}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                                {distHubLowStockItems.length === 0 && !distHubLoading && (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                        <ShieldCheck size={48} className="text-emerald-500 mb-4" />
                                        <p className="text-xs uppercase font-black tracking-widest">All Systems Nominal</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Middle Panel: Payload Modules */}
                        <div className="w-1/3 border-r border-amber-500/10 flex flex-col bg-black/10">
                            <div className="p-4 border-b border-white/5 flex items-center gap-3 backdrop-blur-sm bg-black/10">
                                <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Payload Modules</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Available Reservations</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {!distHubSelectedSku ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                                        <ScanningAnimation />
                                        <p className="mt-4 text-[10px] uppercase font-black tracking-widest text-amber-500">Awaiting Target Selection</p>
                                    </div>
                                ) : (
                                    <>
                                        {distHubAvailableSources.length === 0 ? (
                                            <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center">
                                                <p className="text-xs text-red-400 font-bold uppercase tracking-widest">No Sources Available</p>
                                            </div>
                                        ) : (
                                            distHubAvailableSources.map(source => {
                                                const isWarehouse = source.site?.type === 'Warehouse';
                                                return (
                                                    <div key={source.id} className="p-4 bg-white/[0.03] border border-white/10 hover:border-blue-500/30 rounded-2xl group transition-all">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {isWarehouse ? <Warehouse size={12} className="text-blue-400" /> : <ShoppingBag size={12} className="text-purple-400" />}
                                                                    <span className="text-xs font-black text-white uppercase tracking-wider">{source.site?.name}</span>
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 font-mono tracking-widest">{source.site?.type}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[10px] text-gray-500 uppercase font-black block tracking-widest">Available</span>
                                                                <span className="text-xl font-mono font-bold text-blue-400">{source.stock}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const qty = prompt(`Enter quantity to transfer from ${source.site?.name}:`, Math.min(10, source.stock).toString());
                                                                if (qty) {
                                                                    const amount = parseInt(qty);
                                                                    if (amount > 0 && amount <= source.stock) {
                                                                        addToDistDraft(source, amount);
                                                                    } else {
                                                                        alert('Invalid quantity');
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                                        >
                                                            <Plus size={12} /> ADD TO LOAD
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Launch Pad */}
                        <div className="w-1/3 flex flex-col bg-black/20">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-sm bg-black/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Launch Pad</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Mission Queue</p>
                                    </div>
                                </div>
                                {distHubTransferDrafts.length > 0 && (
                                    <div className="px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-bold">
                                        {distHubTransferDrafts.length} MISSIONS
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {distHubTransferDrafts.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                        <Rocket size={32} className="text-gray-500 mb-3" />
                                        <p className="text-[10px] uppercase font-black tracking-widest mb-1">Queue Empty</p>
                                        <p className="text-[9px] text-gray-500 w-2/3">Select low stock targets and assign resources to initialize launch.</p>
                                    </div>
                                ) : (
                                    distHubTransferDrafts.map((draft, idx) => (
                                        <div key={idx} className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl relative overflow-hidden group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                <div className="text-[10px] font-black text-white uppercase tracking-wider">{draft.sku}</div>
                                                <button
                                                    onClick={() => removeFromDistDraft(idx)}
                                                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Remove Mission"
                                                    aria-label="Remove Mission"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] pl-2 mb-2">
                                                <div className="text-gray-400">{draft.sourceSiteName.slice(0, 15)}...</div>
                                                <ArrowRight size={10} className="text-emerald-500" />
                                                <div className="text-white font-bold">{draft.destSiteName.slice(0, 15)}...</div>
                                            </div>
                                            <div className="pl-2 pt-2 border-t border-white/5 flex justify-between items-center">
                                                <span className="text-[9px] text-emerald-500 uppercase font-black tracking-widest">PAYLOAD</span>
                                                <span className="font-mono font-bold text-white text-xs">{draft.qty} UNITS</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
                                <button
                                    onClick={submitDistTransfers}
                                    disabled={distHubTransferDrafts.length === 0 || distHubLoading}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden ${distHubTransferDrafts.length > 0
                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] active:scale-95'
                                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {distHubLoading && <RefreshCw className="animate-spin absolute left-6" />}
                                    <Rocket size={18} className={distHubLoading ? 'opacity-0' : ''} />
                                    <span>{distHubLoading ? 'Authorizing...' : 'Authorize Deployment'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
