import React, { useState, useMemo } from 'react';
import {
    X, Printer, Navigation, Truck, CheckCircle, Package, Box, MapPin,
    Calendar, User as UserIcon, AlertTriangle, ArrowRight, Info, Phone, 
    Clock, ExternalLink, ShieldCheck, ClipboardList, TrendingUp, ChevronDown, ChevronUp
} from 'lucide-react';
import { WMSJob, User, Site, Product } from '../types';
import { formatJobId } from '../utils/jobIdFormatter';
import { generatePackLabelHTML } from '../utils/labels/PackLabelGenerator';
import { useLanguage } from '../contexts/LanguageContext';
import Button from './shared/Button';

interface OutboundJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    user: User | null;
    sites: Site[];
    products: Product[];
    onUpdateJob: (id: string, updates: Partial<WMSJob>) => Promise<void>;
    onRefresh: () => Promise<void>;
    activeTab?: string;
    onStartPicking?: (job: WMSJob) => void;
    onStartPacking?: (job: WMSJob) => void;
}

export const OutboundJobModal: React.FC<OutboundJobModalProps> = ({
    isOpen,
    onClose,
    job,
    user,
    sites,
    products,
    onUpdateJob,
    onRefresh,
    activeTab = '',
    onStartPicking,
    onStartPacking
}) => {
    const { t, language } = useLanguage();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isManifestExpanded, setIsManifestExpanded] = useState(false);

    const destSite = useMemo(() => sites.find(s => s.id === job.destSiteId), [sites, job.destSiteId]);
    const isDriverView = user?.role === 'driver' || activeTab.includes('driver');

    if (!isOpen) return null;

    // --- LOGIC: STATUS MAPPING (2-step: PICKUP → DELIVERED) ---
    const getStatusStep = () => {
        const statuses = (job.transferStatus || job.status || '').toLowerCase();
        if (statuses === 'delivered' || statuses === 'completed' || statuses === 'received') return 3;
        if (statuses === 'in-transit' || statuses === 'shipped') return 2;
        return 1; // Assigned / Pending / Packed
    };

    const translateStatus = (status: string | undefined): string => {
        if (!status) return '';
        const lower = status.toLowerCase();
        if (lower === 'pending') return t('warehouse.driverHub.itemPending');
        if (lower === 'completed') return t('warehouse.driverHub.completed');
        if (lower === 'packed') return t('warehouse.driverHub.packed');
        if (lower === 'in-transit') return t('warehouse.driverHub.inTransit');
        if (lower === 'delivered') return t('warehouse.driverHub.delivered');
        return status;
    };

    // Helper: Get Product Details
    const getProduct = (item: any) => {
        return products.find(p => p.id === item.productId) || products.find(p => p.sku === item.sku);
    };

    // Helper: Handle Reprint Label (XL)
    const handleReprintLabel = async () => {
        setIsSubmitting(true);
        try {
            const html = await generatePackLabelHTML({
                orderRef: job.id,
                destSiteName: destSite?.name,
                itemCount: job.items || job.lineItems?.length || 0,
                packDate: job.shippedAt || new Date().toISOString(),
                trackingNumber: job.trackingNumber || job.id,
                lineItems: job.lineItems?.map(li => ({
                    name: li.name,
                    sku: li.sku,
                    quantity: li.pickedQty || li.expectedQty || (li as any).quantity || 0
                }))
            }, { size: 'XL', format: 'Both' });

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
            }
        } catch (error) {
            console.error("Label generation failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper: Navigate to Destination
    const handleNavigate = () => {
        if (destSite?.address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destSite.address)}`, '_blank');
        } else {
            alert('No address found for destination');
        }
    };

    const currentStep = getStatusStep();

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-sm overflow-hidden">
            <div className="bg-[#0a0a0c] w-full max-w-5xl h-full md:h-auto md:max-h-[92vh] md:rounded-[2.5rem] border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 md:border">
                
                {/* --- TOP NAVIGATION BAR --- */}
                <div className="px-5 py-4 md:px-8 md:py-6 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 md:gap-5">
                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border shadow-inner ${
                            job.transferStatus === 'In-Transit' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                            job.status === 'Completed' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                            'bg-blue-500/20 border-blue-500/30 text-blue-400'
                        }`}>
                            {job.type === 'DISPATCH' ? <Truck size={18} md-size={30} strokeWidth={1.5} className="md:w-[30px] md:h-[30px]" /> : <Package size={18} md-size={30} strokeWidth={1.5} className="md:w-[30px] md:h-[30px]" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h2 className="text-lg md:text-2xl font-black text-white tracking-tight md:tracking-widest uppercase">
                                    {job.type === 'DISPATCH' ? t('warehouse.driverHub.dispatchMissionTitle') : `${job.type} MISSION`}
                                </h2>
                                <div className="hidden sm:block px-1.5 py-0.5 bg-white/10 rounded-md font-mono text-[10px] text-gray-500 border border-white/5 uppercase">
                                    #{formatJobId(job)}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <span className={`flex items-center gap-1 ${job.priority === 'Critical' ? 'text-red-400' : 'text-cyan-400'}`}>
                                    <TrendingUp size={10} />
                                    {job.priority}
                                </span>
                                <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                                <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Today'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        aria-label="Close"
                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all border border-white/5"
                    >
                        <X size={20} md-size={24} />
                    </button>
                </div>

                {/* --- MAIN SCROLLABLE BODY --- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 md:p-8 space-y-6 md:space-y-8">
                    
                    {/* 1. PROGRESS STEPPER (Condenser for Mobile) */}
                    <div className="relative px-2 pb-4 md:pb-8">
                        <div className="absolute top-[18px] md:top-[26px] left-[30px] md:left-[60px] right-[30px] md:right-[60px] h-[1px] md:h-[2px] bg-white/10" />
                        <div 
                            className="absolute top-[18px] md:top-[26px] left-[30px] md:left-[60px] h-[1px] md:h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                            ref={(el) => { if (el) el.style.width = `${Math.max(0, (currentStep - 1) * 50)}%`; }}
                        />
                        <div className="flex justify-between relative z-10">
                            {[
                                { label: 'ASSIGNED', icon: ClipboardList, step: 1 },
                                { label: 'PICKED UP', icon: Truck, step: 2 },
                                { label: 'DELIVERED', icon: CheckCircle, step: 3 }
                            ].map((s, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 md:gap-3">
                                    <div className={`w-9 h-9 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 md:border-4 transition-all duration-500 ${
                                        currentStep >= s.step 
                                            ? 'bg-black border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                            : 'bg-[#0f0f12] border-white/5 text-gray-600'
                                    }`}>
                                        <s.icon size={14} md-size={20} className="md:w-5 md:h-5" />
                                    </div>
                                    <span className={`hidden sm:block text-[8px] md:text-[10px] font-black tracking-widest uppercase transition-colors ${
                                        currentStep >= s.step ? 'text-white' : 'text-gray-600'
                                    }`}>
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. GRID INFO SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                        
                        {/* DESTINATION INTEL (Always visible / Condenser) */}
                        <div className="md:col-span-5 space-y-4">
                            <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 space-y-4 md:space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={14} md-size={16} className="text-blue-400" />
                                        Destination
                                    </h3>
                                    {destSite?.address && (
                                        <button onClick={handleNavigate} className="px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-black rounded-lg border border-blue-500/20 transition-all flex items-center gap-1 uppercase tracking-tighter">
                                            Open Maps <ExternalLink size={10} />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-600 uppercase font-black tracking-tighter">Site Name</span>
                                        <p className="text-base md:text-lg font-bold text-white">{destSite?.name || '-'}</p>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-600 uppercase font-black tracking-tighter">Address</span>
                                        <p className="text-xs md:text-sm text-gray-400 leading-tight">{destSite?.address || '-'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] text-gray-600 uppercase font-black tracking-tighter">Admin</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-tighter">
                                                <UserIcon size={12} className="text-gray-600" />
                                                {destSite?.manager || '-'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] text-gray-600 uppercase font-black tracking-tighter">Contact</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                                                <Phone size={12} className="text-gray-600" />
                                                {destSite?.contact || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LOGISTICS CARD (Condensed for Mobile) */}
                            <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-[1.5rem] p-4 flex flex-row items-center justify-between md:flex-col md:items-stretch md:gap-4">
                                <div className="flex items-center gap-2">
                                    <Info size={14} className="text-purple-400" />
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Metadata</span>
                                </div>
                                <div className="flex flex-row md:flex-col gap-3 md:gap-1 text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-600 font-bold uppercase tracking-tighter">TRK:</span>
                                        <span className="font-mono text-white tracking-widest">{job.trackingNumber || job.tracking_number || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-600 font-bold uppercase tracking-tighter">QTY:</span>
                                        <span className="text-white font-black">{job.lineItems?.length || 0} U</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: MANIFEST (Collapsible on Mobile) */}
                        <div className="md:col-span-7 flex flex-col gap-3">
                            <div 
                                onClick={() => setIsManifestExpanded(!isManifestExpanded)}
                                className="bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex flex-col cursor-pointer md:cursor-default"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ClipboardList size={14} md-size={16} className="text-cyber-primary" />
                                        Shipment Manifest
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-cyber-primary/10 border border-cyber-primary/20 rounded-full text-[8px] md:text-[10px] font-black text-cyber-primary uppercase tracking-tighter">
                                            {job.lineItems?.length || 0} Units
                                        </div>
                                        <div className="md:hidden text-gray-500">
                                            {isManifestExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>
                                </div>

                                {(isManifestExpanded || window.innerWidth > 768) && (
                                    <div className="mt-4 space-y-2 max-h-[25vh] md:max-h-none overflow-y-auto custom-scrollbar pr-1">
                                        {job.lineItems && job.lineItems.length > 0 ? job.lineItems.map((item, idx) => {
                                            const product = getProduct(item);
                                            const itemName = item.name || product?.name || 'Unknown Item';
                                            const itemSku = item.sku || product?.sku || 'N/A';
                                            const qty = item.pickedQty || item.expectedQty || (item as any).quantity || 0;

                                            return (
                                                <div key={idx} className="group bg-black/40 rounded-xl md:rounded-2xl p-2.5 md:p-4 border border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-600">
                                                            <Box size={14} md-size={20} strokeWidth={1} />
                                                        </div>
                                                        <div className="max-w-[150px] md:max-w-none">
                                                            <p className="text-white font-bold text-[10px] md:text-sm tracking-tight leading-tight">{itemName}</p>
                                                            <p className="text-[8px] md:text-[10px] text-gray-600 font-mono mt-0.5">{itemSku}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] text-gray-600 uppercase font-bold tracking-tighter mb-0.5">Units</span>
                                                        <span className="text-base font-black text-white">{qty}</span>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="py-10 text-center text-[10px] text-gray-600 uppercase font-black tracking-widest opacity-30">Manifest Empty</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER ACTION BAR — 2-Step Driver Workflow: PICKUP → DELIVERED --- */}
                <div className="px-5 py-6 md:p-8 border-t border-white/10 bg-black/40 backdrop-blur-xl shrink-0">
                    <div className="flex flex-row items-center justify-center gap-3 w-full">

                        {/* STEP 1: PICKUP — Driver confirms picking up the shipment */}
                        {job.type === 'DISPATCH' && job.transferStatus !== 'In-Transit' && job.transferStatus !== 'Shipped' && job.transferStatus !== 'Delivered' && job.transferStatus !== 'Received' && job.status !== 'Completed' && (
                            <button
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    try {
                                        await onUpdateJob(job.id, {
                                            status: 'In-Progress' as any,
                                            transferStatus: 'In-Transit',
                                            shippedAt: new Date().toISOString()
                                        });
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting}
                                className="h-14 w-full bg-purple-600 hover:bg-purple-500 text-white rounded-2xl shadow-[0_10px_40px_rgba(147,51,234,0.3)] font-black tracking-widest text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                            >
                                <Truck size={20} />
                                PICKUP
                            </button>
                        )}

                        {/* STEP 2: DELIVERED — Driver confirms delivery at destination */}
                        {job.type === 'DISPATCH' && (job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped') && (
                            <>
                                <button
                                    onClick={handleNavigate}
                                    className="h-14 px-6 md:px-8 border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center gap-2 font-black text-[10px] md:text-sm uppercase tracking-widest transition-all"
                                >
                                    <Navigation size={18} />
                                    NAV
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsSubmitting(true);
                                        try {
                                            await onUpdateJob(job.id, {
                                                status: 'Completed' as any,
                                                transferStatus: 'Delivered',
                                                deliveredAt: new Date().toISOString(),
                                                receivedBy: user?.name || 'Driver'
                                            } as any);
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                    disabled={isSubmitting}
                                    className="h-14 flex-1 bg-[#DFF20F] hover:bg-[#cbe60d] text-black rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(223,242,15,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    <CheckCircle size={20} />
                                    DELIVERED
                                </button>
                            </>
                        )}

                        {/* DONE — Completed status badge */}
                        {job.type === 'DISPATCH' && (job.transferStatus === 'Delivered' || job.transferStatus === 'Received' || job.status === 'Completed') && (
                            <div className="h-14 w-full bg-green-500/10 border border-green-500/30 rounded-2xl text-sm font-black text-green-400 uppercase flex items-center justify-center gap-2">
                                <CheckCircle size={20} /> DELIVERY COMPLETE
                            </div>
                        )}

                        {/* CLOSE — Always available */}
                        <button
                            onClick={onClose}
                            className="h-14 w-full md:w-auto md:px-12 border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
