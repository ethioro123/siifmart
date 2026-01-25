import React, { useState } from 'react';
import {
    X, Printer, Navigation, Truck, CheckCircle, Package, Box, MapPin,
    Calendar, User as UserIcon, AlertTriangle, ArrowRight
} from 'lucide-react';
import { WMSJob, User, Site, Product } from '../types';
import { formatJobId } from '../utils/jobIdFormatter';
import { generatePackLabelHTML } from '../utils/unifiedLabelGenerator';
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    // Helper: Is this a Driver view?
    const isDriverView = user?.role === 'driver' || activeTab.includes('driver');

    // Helper: Get Product Details
    const getProduct = (item: any) => {
        return products.find(p => p.id === item.productId) || products.find(p => p.sku === item.sku);
    };

    // Helper: Handle Reprint Label (XL)
    const handleReprintLabel = async () => {
        setIsSubmitting(true);
        try {
            const destSite = sites.find(s => s.id === job.destSiteId);
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
            alert("Failed to generate label");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper: Navigate to Destination
    const handleNavigate = () => {
        const destSite = sites.find(s => s.id === job.destSiteId);
        if (destSite?.address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destSite.address)}`, '_blank');
        } else {
            alert('No address found for destination');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f0f11] w-full max-w-4xl max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header - Optimized for Dispatch */}
                <div className="p-6 border-b border-white/10 bg-black/40 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${job.type === 'DISPATCH' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                            job.type === 'PICK' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                                'bg-blue-500/20 border-blue-500/30 text-blue-400'
                            }`}>
                            {job.type === 'DISPATCH' ? <Truck size={24} /> : <Package size={24} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-black text-white tracking-tight">
                                    {job.type} MISSION
                                </h2>
                                <span className="text-sm font-mono text-gray-500">#{formatJobId(job)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${job.priority === 'Critical' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                    'border-white/10 text-gray-400'
                                    }`}>
                                    {job.priority} Priority
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={12} />
                                    {sites.find(s => s.id === job.destSiteId)?.name || 'Unknown Destination'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Action Bar (Top) */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                        <div className="flex items-center gap-8">
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Status</span>
                                <span className={`text-sm font-bold ${job.status === 'Completed' ? 'text-green-400' :
                                    job.transferStatus === 'In-Transit' ? 'text-purple-400' : 'text-white'
                                    }`}>
                                    {job.transferStatus || job.status}
                                </span>
                            </div>
                            {job.trackingNumber && (
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Tracking</span>
                                    <span className="text-sm font-mono text-cyan-400">{job.trackingNumber}</span>
                                </div>
                            )}
                        </div>

                        {/* Dispatch Labels */}
                        {job.type === 'DISPATCH' && (
                            <Button
                                onClick={handleReprintLabel}
                                disabled={isSubmitting}
                                icon={<Printer size={16} />}
                                className="bg-purple-600 hover:bg-purple-500 text-white border-none shadow-lg shadow-purple-900/20"
                            >
                                Reprint Label (XL)
                            </Button>
                        )}
                    </div>

                    {/* Clean Items List */}
                    <div>
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Package size={16} className="text-cyber-primary" />
                            Manifest ({job.lineItems?.length || 0} Items)
                        </h3>

                        <div className="space-y-2">
                            {job.lineItems && job.lineItems.length > 0 ? job.lineItems.map((item, idx) => {
                                const product = getProduct(item);
                                const itemName = item.name || product?.name || 'Unknown Item';
                                const itemSku = item.sku || product?.sku || 'N/A';
                                const qty = item.pickedQty || item.expectedQty || item.quantity || 0;

                                return (
                                    <div key={idx} className="bg-white/[0.02] rounded-xl p-3 border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-gray-600">
                                                <Box size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{itemName}</p>
                                                <p className="text-xs text-cyber-primary font-mono mt-0.5">{itemSku}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 pr-4">
                                            {/* Quantity Display - Only what matters for dispatch */}
                                            <div className="text-right">
                                                <span className="text-[9px] text-gray-500 uppercase font-bold block">Qty</span>
                                                <span className="text-base font-mono font-bold text-white">{qty}</span>
                                            </div>

                                            {/* Status - Hidden for drivers as requested */}
                                            {!isDriverView && (
                                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'Picked' || item.status === 'Completed' || (job.status === 'Completed' || (job as any).status === 'Received') ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-500'
                                                    }`}>
                                                    {item.status || ((job.status === 'Completed' || (job as any).status === 'Received') ? 'Completed' : 'Pending')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-8 text-gray-500 italic">No items manifest</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-white/10 bg-black/20 flex items-center justify-between">
                    <div>
                        {/* Admin Only Actions */}
                        {!isDriverView && ['super_admin', 'warehouse_manager'].includes(user?.role || '') && (
                            <button
                                onClick={async () => {
                                    const newTracking = prompt('Update Tracking Number:', job.trackingNumber || '');
                                    if (newTracking) await onUpdateJob(job.id, { trackingNumber: newTracking });
                                }}
                                className="text-xs text-gray-500 hover:text-white underline decoration-dashed underline-offset-4"
                            >
                                Edit Tracking
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Start Picking Button for PICK jobs */}
                        {job.type === 'PICK' && job.status !== 'Completed' && onStartPicking && (
                            <Button
                                onClick={() => onStartPicking(job)}
                                className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30"
                                icon={<Package size={18} />}
                            >
                                {job.status === 'In-Progress' ? 'Continue Picking' : 'Start Picking'}
                            </Button>
                        )}

                        {/* Start Packing Button for PACK jobs */}
                        {job.type === 'PACK' && job.status !== 'Completed' && onStartPacking && (
                            <Button
                                onClick={() => onStartPacking(job)}
                                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30"
                                icon={<Box size={18} />}
                            >
                                {job.status === 'In-Progress' ? 'Continue Packing' : 'Start Packing'}
                            </Button>
                        )}

                        {/* Driver Workflows */}
                        {job.type === 'DISPATCH' && job.transferStatus === 'Packed' && (
                            <Button
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    await onUpdateJob(job.id, { transferStatus: 'In-Transit', shippedAt: new Date().toISOString() });
                                    setIsSubmitting(false);
                                }}
                                className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30"
                                icon={<Truck size={18} />}
                            >
                                Confirm Pickup
                            </Button>
                        )}

                        {job.type === 'DISPATCH' && job.transferStatus === 'In-Transit' && (
                            <>
                                <Button
                                    onClick={handleNavigate}
                                    variant="secondary"
                                    icon={<Navigation size={18} />}
                                >
                                    Navigate
                                </Button>
                                <Button
                                    onClick={async () => {
                                        setIsSubmitting(true);
                                        await onUpdateJob(job.id, { transferStatus: 'Delivered' });
                                        setIsSubmitting(false);
                                    }}
                                    className="bg-cyber-primary text-black hover:bg-cyber-accent"
                                    icon={<CheckCircle size={18} />}
                                >
                                    Signal Arrival
                                </Button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
