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
import { getSellUnit, formatPackagingDescription, isWeightBased, isVolumeBased } from '../utils/units';
import Button from './shared/Button';
import { logger } from '../utils/logger';
import { printHtmlContent } from '../utils/printHelper';
import { ShipmentActions } from './fulfillment/drivers/ShipmentActions';
import { PartialDeliveryModal } from './fulfillment/drivers/PartialDeliveryModal';
import { useData } from '../contexts/DataContext';
import { useQuery } from '@tanstack/react-query';
import { onlineStoreService } from '../services/online-store.service';

interface OutboundJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    user: User | null;
    sites: Site[];
    products: Product[];
    onUpdateJob?: (id: string, updates: Partial<WMSJob>) => Promise<void>;
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
    const { addNotification } = useData();
    const [arrivalOpen, setArrivalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isManifestExpanded, setIsManifestExpanded] = useState(false);

    const destSite = useMemo(() => sites.find(s => s.id === job.destSiteId), [sites, job.destSiteId]);
    const isDriverView = user?.role === 'driver' || activeTab.includes('driver');
    const onlineOrderRef = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.orderRef || '') ? job.orderRef : null;
    const { data: onlineDelivery } = useQuery({
        queryKey: ['online-delivery', user?.id, job.siteId, job.countryCode, onlineOrderRef],
        queryFn: () => onlineStoreService.getDeliveryDetails(onlineOrderRef!, job.siteId, job.countryCode || job.country_code || 'ET'),
        enabled: isOpen && job.type === 'DISPATCH' && Boolean(onlineOrderRef && user?.id),
        gcTime: 0,
    });

    if (!isOpen) return null;
    if (arrivalOpen) return <PartialDeliveryModal t={t} isOpen job={job} user={user} products={products} sites={sites}
        onClose={() => { setArrivalOpen(false); onClose(); }} addNotification={addNotification} refreshData={onRefresh} />;


    // --- LOGIC: STATUS MAPPING (2-step: PICKUP → DELIVERED) ---
    const getStatusStep = () => {
        const statuses = (job.transferStatus || job.status || '').toLowerCase();
        if (statuses === 'completed' || statuses === 'received') return 4;
        if (statuses === 'delivered' || statuses === 'partially delivered') return 3;
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

    const getLabelQtyAndUnit = (item: any, product?: any) => {
        const prod = product || getProduct(item);
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return {
                quantity: `${(item as any).requestedMeasureQty}`,
                unit: prod?.unit || item.unit || 'KG'
            };
        }
        const expected = item.expectedQty || (item as any).quantity || 0;
        const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : expected;
        const packDesc = formatPackagingDescription(prod, picked);
        const unitDef = getSellUnit(prod?.unit || item.unit);
        const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

        return {
            quantity: packDesc ? `${picked} ${unitLabel} (${packDesc})` : `${picked} ${unitLabel}`,
            unit: unitLabel
        };
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
                lineItems: job.lineItems?.map(li => {
                    const product = getProduct(li);
                    const qtyInfo = getLabelQtyAndUnit(li, product);
                    return {
                        name: li.name || product?.name || 'Unknown Product',
                        sku: li.sku || product?.sku || 'N/A',
                        quantity: qtyInfo.quantity,
                        unit: qtyInfo.unit
                    };
                })
            }, { size: 'XL', format: 'Both' });

            printHtmlContent(html);
        } catch (error) {
            logger.error('OutboundJobModal', "Label generation failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper: Navigate to Destination
    const handleNavigate = () => {
        const address = onlineDelivery?.delivery_address || destSite?.address;
        if (address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
        } else {
            alert('No address found for destination');
        }
    };

    const currentStep = getStatusStep();

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/60 overflow-hidden animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] w-full max-w-4xl max-h-[92vh] rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col isolate overflow-hidden relative">
                
                {/* --- TOP NAVIGATION BAR --- */}
                <div className="px-4 sm:px-6 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                            job.transferStatus === 'In-Transit' ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400' :
                            job.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                            'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/20 text-[var(--theme-primary)]'
                        }`}>
                            {job.type === 'DISPATCH' ? <Truck size={20} /> : <Package size={20} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight">
                                    {job.type === 'DISPATCH' ? t('warehouse.driverHub.dispatchMissionTitle') : `${job.type} Mission`}
                                </h2>
                                <span className="px-2 py-0.5 rounded-full bg-[var(--theme-bg-card)] font-mono text-xs text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                    #{formatJobId(job)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                <span className={`flex items-center gap-1 font-semibold ${job.priority === 'Critical' ? 'text-red-500' : 'text-[var(--theme-primary)]'}`}>
                                    <TrendingUp size={12} />
                                    {job.priority}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Today'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        aria-label="Close"
                        className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--theme-bg-card)] rounded-full text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0 touch-manipulation"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* --- MAIN SCROLLABLE BODY --- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-5">
                    
                    {/* 1. PROGRESS STEPPER */}
                    <div className="relative px-4 py-2">
                        <div className="absolute top-[20px] sm:top-[24px] left-[40px] sm:left-[60px] right-[40px] sm:right-[60px] h-0.5 bg-[var(--theme-border)]" />
                        <div 
                            className="absolute top-[20px] sm:top-[24px] left-[40px] sm:left-[60px] h-0.5 bg-[var(--theme-primary)] transition-all duration-500 ease-out"
                            ref={(el) => { if (el) el.style.width = `${Math.max(0, (currentStep - 1) * (100 / 3))}%`; }}
                        />
                        <div className="flex justify-between relative z-10">
                            {[
                                { label: 'Staged', icon: ClipboardList, step: 1 },
                                { label: 'Released', icon: Truck, step: 2 },
                                { label: 'Arrived', icon: MapPin, step: 3 },
                                { label: 'Received', icon: CheckCircle, step: 4 }
                            ].map((s, i) => (
                                <div key={i} className="flex flex-col items-center gap-1.5">
                                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                                        currentStep >= s.step 
                                            ? 'bg-[var(--theme-bg-card)] border-[var(--theme-primary)] text-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/20 shadow-xs' 
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-muted)]'
                                    }`}>
                                        <s.icon size={16} />
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                        currentStep >= s.step ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-muted)]'
                                    }`}>
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. GRID INFO SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        
                        {/* DESTINATION INTEL */}
                        <div className="md:col-span-5 space-y-4">
                            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                                        <MapPin size={14} className="text-[var(--theme-primary)]" />
                                        Destination
                                    </h3>
                                    {(onlineDelivery?.delivery_address || destSite?.address) && (
                                        <button onClick={handleNavigate} className="px-2.5 py-1 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20 text-xs font-semibold rounded-lg border border-[var(--theme-primary)]/20 transition-all flex items-center gap-1 touch-manipulation min-h-[32px]">
                                            Open Maps <ExternalLink size={11} />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <span className="text-[11px] text-[var(--theme-text-muted)] font-medium">{onlineDelivery ? 'Recipient' : 'Site Name'}</span>
                                        <p className="text-base font-semibold text-[var(--theme-text-primary)]">{onlineDelivery?.customer_name || destSite?.name || '-'}</p>
                                    </div>

                                    <div>
                                        <span className="text-[11px] text-[var(--theme-text-muted)] font-medium">Address</span>
                                        <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">{onlineDelivery?.delivery_address || destSite?.address || '-'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--theme-border)]">
                                        <div>
                                                <span className="text-[11px] text-[var(--theme-text-muted)] font-medium">{onlineDelivery ? 'Customer' : 'Site Admin'}</span>
                                            <div className="flex items-center gap-1 text-xs font-semibold text-[var(--theme-text-primary)] mt-0.5">
                                                <UserIcon size={12} className="text-[var(--theme-text-muted)]" />
                                                <span className="truncate">{onlineDelivery?.customer_name || destSite?.manager || '-'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-[var(--theme-text-muted)] font-medium">Contact</span>
                                            <div className="flex items-center gap-1 text-xs font-semibold text-[var(--theme-primary)] mt-0.5">
                                                <Phone size={12} className="text-[var(--theme-text-muted)]" />
                                                <span className="truncate">{onlineDelivery?.customer_phone || destSite?.contact || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LOGISTICS METADATA */}
                            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-row items-center justify-between sm:flex-col sm:items-stretch sm:gap-2">
                                <div className="flex items-center gap-2">
                                    <Info size={14} className="text-[var(--theme-primary)]" />
                                    <span className="text-xs font-semibold text-[var(--theme-text-secondary)]">Shipment Info</span>
                                </div>
                                <div className="flex flex-row sm:flex-col gap-3 sm:gap-1 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-[var(--theme-text-muted)]">TRK:</span>
                                        <span className="font-mono text-xs font-medium text-[var(--theme-text-primary)]">{job.trackingNumber || job.tracking_number || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-[var(--theme-text-muted)]">Items:</span>
                                        <span className="font-mono text-xs font-semibold text-[var(--theme-text-primary)]">{job.lineItems?.length || 0} Units</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: MANIFEST */}
                        <div className="md:col-span-7 flex flex-col gap-3">
                            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 flex flex-col">
                                <div 
                                    onClick={() => setIsManifestExpanded(!isManifestExpanded)}
                                    className="flex items-center justify-between cursor-pointer md:cursor-default"
                                >
                                    <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)] flex items-center gap-2">
                                        <ClipboardList size={14} className="text-[var(--theme-primary)]" />
                                        Shipment Manifest
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 rounded-full text-xs font-semibold text-[var(--theme-primary)]">
                                            {job.lineItems?.length || 0} Units
                                        </span>
                                        <div className="md:hidden text-[var(--theme-text-muted)]">
                                            {isManifestExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>
                                </div>

                                {(isManifestExpanded || window.innerWidth > 768) && (
                                    <div className="mt-3 space-y-2 max-h-[35vh] md:max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                                        {job.lineItems && job.lineItems.length > 0 ? job.lineItems.map((item, idx) => {
                                            const product = getProduct(item);
                                            const itemName = item.name || product?.name || 'Unknown Item';
                                            const itemSku = item.sku || product?.sku || 'N/A';
                                            const qty = item.pickedQty || item.expectedQty || (item as any).quantity || 0;

                                            return (
                                                <div key={idx} className="bg-[var(--theme-bg-card)] rounded-xl p-3 border border-[var(--theme-border)] flex items-center justify-between">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] shrink-0">
                                                            <Box size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">{itemName}</p>
                                                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono mt-0.5">{itemSku}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end shrink-0 pl-2">
                                                        <span className="text-[11px] text-[var(--theme-text-muted)] font-medium">Units</span>
                                                        <span className="text-sm font-bold font-mono text-[var(--theme-text-primary)] tabular-nums">{qty}</span>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="py-8 text-center text-xs text-[var(--theme-text-muted)]">Manifest is empty</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER ACTION BAR --- */}
                <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shrink-0">
                    <div className="flex flex-row items-center justify-center gap-3 w-full">
                        <ShipmentActions job={job} user={user} onRefresh={onRefresh} onArrival={() => setArrivalOpen(true)}
                            onNavigate={handleNavigate} onDeparted={onClose} />

                        {/* CLOSE */}
                        <button
                            onClick={onClose}
                            className="min-h-[44px] h-11 px-6 border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl font-semibold text-xs transition-all active:scale-[0.98] touch-manipulation"
                        >
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
