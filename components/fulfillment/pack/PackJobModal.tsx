import React, { useState } from 'react';
import {
    X, Package, Box, MapPin, CheckCircle, ArrowRight,
    Clock, Archive, Info, Barcode, Loader2, Printer, AlertTriangle, Snowflake, RefreshCw,
    Hash, Truck, ShieldCheck
} from 'lucide-react';
import { WMSJob, User, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ProgressBar } from '../../shared/ProgressBar';

interface PackJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    user: User | null;
    sites: Site[];
    products: Product[];
    onStartPack: (job: WMSJob) => void;
    onUpdateItemQty: (itemIndex: number, qty: number) => void;
    onCompleteJob: (boxDetails: any) => void;
    onPrintLabel: (boxDetails: any) => void;
    isSubmitting: boolean;
    resolveOrderRef: (ref?: string) => string;
    onOpenScanner?: () => void;
    onPrintItemLabel?: (item: any, product?: any, boxSize?: string) => void;
}

export const PackJobModal: React.FC<PackJobModalProps> = ({
    isOpen,
    onClose,
    job,
    user,
    sites,
    products,
    onStartPack,
    onUpdateItemQty,
    onCompleteJob,
    onPrintLabel,
    isSubmitting,
    resolveOrderRef,
    onOpenScanner,
    onPrintItemLabel
}) => {
    const { t } = useLanguage();

    const [boxSize, setBoxSize] = useState<'Small' | 'Medium' | 'Large' | 'Extra Large'>('Medium');
    const [packingMaterials, setPackingMaterials] = useState({
        bubbleWrap: false,
        fragileStickers: false
    });
    const [hasIcePack, setHasIcePack] = useState(false);

    // Item-level Scanning State (must be before early return to satisfy React hooks rules)
    const [scanInput, setScanInput] = useState('');
    const [scannedItemIndex, setScannedItemIndex] = useState<number | null>(null);
    const [confirmQty, setConfirmQty] = useState('');
    const [scanError, setScanError] = useState('');
    const scanInputRef = React.useRef<HTMLInputElement>(null);
    const lastKeyTime = React.useRef<number>(Date.now());

    React.useEffect(() => {
        if (isOpen && !scannedItemIndex) {
            setTimeout(() => scanInputRef.current?.focus(), 100);
        }
    }, [isOpen, scannedItemIndex]);

    if (!isOpen) return null;

    const getProduct = (item: any) => {
        const targetSiteId = job.siteId || (job as any).site_id;
        return products.find(p => (p.id === item.productId || p.sku === item.sku) && (p.siteId === targetSiteId || p.site_id === targetSiteId));
    };

    const sourceSite = sites.find(s => s.id === job.sourceSiteId || s.id === (job as any).site_id);
    const destSite = job.destSiteId ? sites.find(s => s.id === job.destSiteId) : undefined;
    const totalItems = job.lineItems?.length || 0;
    const completedItems = job.lineItems?.filter(i => {
        const isDone = i.status === 'Completed' || (i.status === 'Picked' && (job as any).type !== 'PACK');
        const requiredAmount = (i as any).requestedMeasureQty || i.expectedQty || 1;
        return isDone || (i.pickedQty || 0) >= requiredAmount;
    }).length || 0;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const isFullyPacked = completedItems === totalItems && totalItems > 0;

    const hasColdItems = job.lineItems?.some(item => {
        const product = getProduct(item);
        return product?.category === 'Frozen' || product?.category === 'Dairy';
    });
    const hasFragileItems = job.lineItems?.some(item => {
        const product = getProduct(item);
        return product && ['Electronics', 'Glass', 'Beverages'].some(cat => product.category.includes(cat));
    });

    const handleScanItem = (e: React.FormEvent) => {
        e.preventDefault();
        const barcode = scanInput.trim().toUpperCase();
        if (!barcode) return;

        let foundIndex = -1;

        job.lineItems?.forEach((item, index) => {
            const requiredAmount = (item as any).requestedMeasureQty || item.expectedQty || 1;
            if (item.status === 'Completed' || (item.pickedQty || 0) >= requiredAmount) return;
            const product = getProduct(item);
            if (
                item.sku?.toUpperCase() === barcode ||
                product?.sku?.toUpperCase() === barcode ||
                product?.barcode?.toUpperCase() === barcode
            ) {
                foundIndex = index;
            }
        });

        if (foundIndex > -1) {
            setScannedItemIndex(foundIndex);
            // Default confirm input to expected quantity (or measure if applicable)
            const item = job.lineItems![foundIndex];
            const expected = item.expectedQty || 1;
            if ((item as any).requestedMeasureQty) {
                setConfirmQty((item as any).requestedMeasureQty.toString());
            } else {
                setConfirmQty(expected.toString());
            }
            setScanError('');
        } else {
            setScanError('Item not found in this Pack mission.');
            setTimeout(() => setScanError(''), 2000);
        }
        setScanInput('');
    };

    const submitQtyConfirm = () => {
        if (scannedItemIndex === null) return;
        const qtyRaw = parseFloat(confirmQty) || 0;

        if (qtyRaw > 0) {
            onUpdateItemQty(scannedItemIndex, qtyRaw);
        }
        setScannedItemIndex(null);
        setConfirmQty('');
        setTimeout(() => scanInputRef.current?.focus(), 100);
    };

    const boxDetails = {
        boxSize,
        packingMaterials,
        hasIcePack,
        hasColdItems,
        hasFragileItems,
        destSiteName: destSite?.name,
        destSite
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f0f11] w-full max-w-5xl min-h-[70dvh] max-h-[95dvh] md:min-h-0 md:max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative p-2 md:p-6 border-b border-white/10 bg-black/40 overflow-hidden shrink-0">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none hidden md:block" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none hidden md:block" />

                    <div className="relative flex justify-between items-start">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border flex items-center justify-center shadow-[0_0_20px] ${isFullyPacked ? 'bg-green-500/20 border-green-500/30 text-green-400 shadow-green-500/15' : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-cyan-500/15'}`}>
                                {isFullyPacked ? <ShieldCheck size={20} className="md:w-7 md:h-7" /> : <Archive size={20} className="md:w-7 md:h-7" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                                    <h2 className="text-lg md:text-2xl font-black text-white tracking-tight uppercase italic leading-none">
                                        {isFullyPacked ? 'Ready to Ship' : 'Pack Mission'}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] md:text-xs font-mono text-gray-500">
                                        #{formatJobId(job)}
                                    </span>
                                </div>
                                <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-400">
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border ${job.priority === 'Critical' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                        job.priority === 'High' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                            'border-white/10 text-gray-400'
                                        }`}>
                                        {job.priority}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={12} className="text-cyan-400" />
                                        <span>{destSite?.name || (job as any).customerName || 'Customer'}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={12} className="text-gray-500" />
                                        {new Date(job.createdAt || (job as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Close" className="p-1 md:p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <X size={18} className="md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 flex flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.03),transparent)]">
                    
                    {/* Top Row / Scanner & Stats */}
                    <div className="p-3 md:p-6 shrink-0 border-b border-white/5">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 shrink-0">
                            {/* Scanner Input */}
                            {!isFullyPacked && (
                                <form onSubmit={handleScanItem} className="relative flex-1">
                                    <Barcode size={18} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-cyan-400 md:w-[18px] md:h-[18px]" />
                                    <input
                                        ref={scanInputRef}
                                        type="text"
                                        value={scanInput}
                                        onChange={e => setScanInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (job.notes?.includes('[STRICT_SCAN]')) {
                                                const now = Date.now();
                                                if (now - lastKeyTime.current > 100 && e.key !== 'Enter') {
                                                    setScanInput('');
                                                }
                                                lastKeyTime.current = now;
                                            }
                                        }}
                                        onPaste={(e) => {
                                            if (job.notes?.includes('[STRICT_SCAN]')) {
                                                e.preventDefault();
                                                setScanError('Pasting not allowed.');
                                                setTimeout(() => setScanError(''), 2000);
                                            }
                                        }}
                                        placeholder="Scan item..."
                                        className={`w-full bg-black/60 border md:border-2 ${scanError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-cyan-500'} rounded-lg md:rounded-xl py-2 md:py-3 pl-10 md:pl-12 pr-3 md:pr-4 text-xs md:text-base text-white font-mono outline-none transition-all`}
                                    />
                                    {scanError && <span className="absolute -bottom-4 left-3 text-[10px] text-red-400 font-bold hidden md:block">{scanError}</span>}
                                </form>
                            )}

                            {/* Job Progress Pill */}
                            <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 bg-white/5 border border-white/10 px-4 py-2 md:py-3 rounded-lg md:rounded-xl">
                                <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                                    <span className="text-white">{completedItems}</span> / {totalItems} Pkd
                                </span>
                                <div className="w-20 md:w-24 h-2 bg-black/40 rounded-full overflow-hidden shrink-0">
                                    <ProgressBar
                                        progress={progressPercent}
                                        containerClassName="h-full bg-transparent"
                                        fillClassName={`h-full transition-all duration-300 ${isFullyPacked ? 'bg-green-500' : 'bg-cyan-500'}`}
                                    />
                                </div>
                            </div>
                            
                            {/* Tracking Number (Compact) */}
                            {job.trackingNumber && (
                                <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-xl shrink-0">
                                    <Hash size={14} className="text-cyan-400" />
                                    <span className="text-xs font-mono font-black text-white">{job.trackingNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columns Wrapper */}
                    <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar">
                        
                        {/* Left Col: Items List */}
                        <div className="flex-1 p-3 md:p-6 lg:border-r border-white/5 lg:overflow-y-auto lg:custom-scrollbar">
                            <div className="space-y-2 md:space-y-3">
                            {job.lineItems?.map((item, idx) => {
                                const product = getProduct(item);
                                const requiredAmount = (item as any).requestedMeasureQty || item.expectedQty || 1;
                                const isDone = item.status === 'Completed' || (item.status === 'Picked' && (job as any).type !== 'PACK') || (item.pickedQty || 0) >= requiredAmount;
                                const isScanningThis = scannedItemIndex === idx;

                                return (
                                    <div key={idx} className={`group relative bg-white/[0.02] border ${isScanningThis ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]' :
                                        isDone ? 'border-green-500/20 bg-green-500/[0.01]' : 'border-white/5'
                                        } rounded-xl md:rounded-2xl p-2.5 md:p-4 flex flex-col hover:bg-white/[0.04] transition-all duration-300`}>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                                                {/* Item Thumbnail */}
                                                <div className="md:flex relative w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl bg-black/40 border border-white/10 items-center justify-center overflow-hidden shrink-0">
                                                    {product?.image ? (
                                                        <img src={product.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/[0.03] flex items-center justify-center text-white/20">
                                                            <Package size={24} strokeWidth={1.5} className="md:w-[28px] md:h-[28px]" />
                                                        </div>
                                                    )}
                                                    {isDone && (
                                                        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                                            <CheckCircle size={20} className="text-green-400 md:w-5 md:h-5" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Item Info */}
                                                <div className="min-w-0 pr-2">
                                                    <h4 className="text-white font-bold text-sm md:text-sm tracking-tight mb-0.5 md:mb-1 group-hover:text-cyan-400 transition-colors truncate">
                                                        {item.name || product?.name || 'Unknown SKU'}
                                                    </h4>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] md:text-[11px] font-mono font-black text-gray-500 bg-black/40 px-1.5 md:px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter">
                                                            {item.sku || product?.sku || 'NO SKU'}
                                                        </span>
                                                        {product?.barcode && (
                                                            <div className="flex items-center gap-1 text-[10px] md:text-[11px] text-blue-400/80 font-bold uppercase tracking-widest hidden sm:flex">
                                                                <Barcode size={10} className="md:w-3 md:h-3" />
                                                                {product.barcode}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pack Details */}
                                            <div className="flex items-center gap-4 md:gap-6 justify-end shrink-0">
                                                <div className="text-right">
                                                    <span className="text-[10px] md:text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] block mb-0 leading-none md:mb-1">Req</span>
                                                    {(() => {
                                                        let expected = item.expectedQty || (item as any).quantity || 0;
                                                        if ((item as any).requestedMeasureQty) {
                                                            const unitDef = product?.unit ? product.unit : '';
                                                            return <span className="text-sm md:text-lg font-mono font-black text-white leading-none">{(item as any).requestedMeasureQty} <span className="hidden sm:inline text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">{unitDef}</span></span>;
                                                        }
                                                        return item.orderedQty && item.orderedQty > expected ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-mono font-bold text-red-500 line-through opacity-80 -mb-1 leading-none" title="Short Picked">{item.orderedQty}</span>
                                                                <span className="text-sm md:text-lg font-mono font-black text-white leading-none">{expected}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm md:text-lg font-mono font-black text-white leading-none">{expected}</span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] md:text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] block mb-0 leading-none md:mb-1">Pkd</span>
                                                    {(() => {
                                                        const expected = item.expectedQty || (item as any).quantity || 0;
                                                        const picked = item.pickedQty || 0;
                                                        let displayPicked = picked;

                                                        if ((item as any).requestedMeasureQty) {
                                                            const unitDef = product?.unit ? product.unit : '';
                                                            return <span className="text-sm md:text-lg font-mono font-black text-teal-400 leading-none">{displayPicked} <span className="hidden sm:inline text-[8px] md:text-[10px] text-teal-500/60 font-bold uppercase tracking-widest">{unitDef}</span></span>;
                                                        }
                                                        return <span className={`text-sm md:text-lg font-mono font-black leading-none ${isDone ? 'text-green-400' : 'text-gray-500'}`}>{picked}</span>;
                                                    })()}
                                                </div>

                                                {!isScanningThis && (
                                                    <div className="flex items-center gap-1.5 md:gap-2">
                                                        {onPrintItemLabel && (
                                                            <button
                                                                onClick={() => onPrintItemLabel(item, product, boxSize)}
                                                                title="Print label"
                                                                className="hidden sm:flex p-1 md:p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/30 text-gray-500 hover:text-cyan-400 transition-all active:scale-95"
                                                            >
                                                                <Printer size={12} className="md:w-3.5 md:h-3.5" />
                                                            </button>
                                                        )}
                                                        <div className={`px-1.5 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-[9px] md:text-xs font-black uppercase tracking-wider ${isDone ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-white/5 border border-white/5 text-gray-500'}`}>
                                                            {isDone ? '✓' : '...'} <span className="hidden sm:inline">{isDone ? ' Packed' : ' Pending'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Confirmation UI (Expanded) */}
                                        {isScanningThis && (
                                            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center gap-3 md:gap-4 justify-between animate-in fade-in slide-in-from-top-2">
                                                <p className="text-xs md:text-sm text-cyan-400 font-bold flex items-center gap-1.5 md:gap-2 self-start sm:self-auto w-full sm:w-auto">
                                                    <CheckCircle size={14} className="md:w-4 md:h-4" /> Confirm Qty
                                                </p>
                                                <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                                    <div className="flex items-center bg-black/60 border border-cyan-500/50 rounded-lg md:rounded-xl overflow-hidden shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmQty(String(Math.max(1, parseInt(confirmQty || '1') - 1)))}
                                                            className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-white/10 text-white font-black"
                                                        >-</button>
                                                        <input
                                                            type="number"
                                                            aria-label="Confirm Quantity"
                                                            value={confirmQty}
                                                            onChange={e => setConfirmQty(e.target.value)}
                                                            className="w-12 md:w-16 bg-transparent text-center text-white font-mono font-bold outline-none text-sm md:text-base"
                                                            autoFocus
                                                            onKeyDown={e => e.key === 'Enter' && submitQtyConfirm()}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmQty(String((parseInt(confirmQty || '0')) + 1))}
                                                            className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-white/10 text-white font-black"
                                                        >+</button>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            onClick={submitQtyConfirm}
                                                            className="px-3 md:px-6 py-1.5 md:py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs md:text-sm tracking-wider uppercase rounded-lg md:rounded-xl transition-colors"
                                                        >OK</button>
                                                        <button
                                                            onClick={() => setScannedItemIndex(null)}
                                                            className="px-3 md:px-4 py-1.5 md:py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-[10px] md:text-xs uppercase rounded-lg md:rounded-xl"
                                                        >X</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Col: Details & Action */}
                    <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 p-4 lg:p-6 border-t lg:border-t-0 border-white/5 bg-black/20 lg:bg-transparent">
                        {/* Progress */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">Progress</span>
                                <span className="text-xl font-mono font-black text-white leading-none">{Math.round(progressPercent)}%</span>
                            </div>
                            <ProgressBar
                                progress={progressPercent}
                                containerClassName="h-2 bg-black/40 rounded-full overflow-hidden"
                                fillClassName={`h-full transition-all duration-300 ${isFullyPacked ? 'bg-green-500' : 'bg-cyan-500'}`}
                            />
                        </div>

                        {/* Shipping Info */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">Shipping</span>

                            <div className="flex items-center gap-3">
                                <Truck size={14} className="text-cyan-400 shrink-0 w-4 h-4" />
                                <div className="min-w-0">
                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest block truncate">Dest</span>
                                    <span className="text-white text-sm font-bold truncate block">{destSite?.name || (job as any).customerName || 'Customer'}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <Info size={14} className="text-cyan-400 shrink-0 w-4 h-4" />
                                <div className="min-w-0">
                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest block truncate">Job/Ref</span>
                                    <span className="text-white text-sm font-bold font-mono truncate block">{formatJobId(job)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Packing Options */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">Options</span>

                            <div>
                                <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest block mb-2">Box Size</label>
                                <select title="Box Size" aria-label="Select Box Size" value={boxSize} onChange={(e) => setBoxSize(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-cyan-500 focus:bg-white/5 transition-all">
                                    <option value="Small">{t('warehouse.boxSmall')}</option>
                                    <option value="Medium">{t('warehouse.boxMedium')}</option>
                                    <option value="Large">{t('warehouse.boxLarge')}</option>
                                    <option value="Extra Large">{t('warehouse.boxXL')}</option>
                                </select>
                            </div>

                            {hasFragileItems && (
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-[9px] text-red-500/80 font-black uppercase tracking-widest mb-2 flex items-center gap-1"><AlertTriangle size={10} /> Fragile</p>
                                    <label className="flex items-center gap-3 mb-2 cursor-pointer group">
                                        <input type="checkbox" checked={packingMaterials.bubbleWrap} onChange={e => setPackingMaterials({ ...packingMaterials, bubbleWrap: e.target.checked })} className="w-4 h-4 rounded border-white/20 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900 bg-black/40" />
                                        <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">Bubble Wrap</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" checked={packingMaterials.fragileStickers} onChange={e => setPackingMaterials({ ...packingMaterials, fragileStickers: e.target.checked })} className="w-4 h-4 rounded border-white/20 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900 bg-black/40" />
                                        <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">Stickers</span>
                                    </label>
                                </div>
                            )}

                            {hasColdItems && (
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-[9px] text-blue-400/80 font-black uppercase tracking-widest mb-2 flex items-center gap-1"><Snowflake size={10} /> Cold Chain</p>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" checked={hasIcePack} onChange={e => setHasIcePack(e.target.checked)} className="w-4 h-4 rounded border-white/20 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900 bg-black/40" />
                                        <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">Ice Packs</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
                <div className="p-3 md:p-6 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <button
                            onClick={() => onPrintLabel(boxDetails)}
                            disabled={isSubmitting}
                            className="p-2 md:px-6 md:py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-gray-300 hover:text-white rounded-lg md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all md:flex items-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            <Printer size={18} className="md:w-4 md:h-4" /> <span className="hidden md:inline">Print Label</span>
                        </button>
                        {!isFullyPacked && onOpenScanner && (
                            <button
                                onClick={onOpenScanner}
                                className="p-2 md:px-6 md:py-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 rounded-lg md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all md:flex items-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                            >
                                <Barcode size={18} className="md:w-4 md:h-4" /> <span className="hidden md:inline">Open Scanner</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black text-xs md:text-xs uppercase tracking-widest transition-all"
                        >
                            Close
                        </button>

                        {job.status !== 'Completed' && (
                            <button
                                onClick={() => {
                                    if (hasColdItems && !hasIcePack) {
                                        alert("Ice packs are required for cold chain items!");
                                        return;
                                    }
                                    onCompleteJob(boxDetails);
                                }}
                                disabled={isSubmitting || !isFullyPacked}
                                className={`flex-1 max-w-[150px] md:max-w-none md:flex-none justify-center px-4 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-[0_0_30px] transition-all flex items-center gap-1.5 md:gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${isFullyPacked
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/30'
                                    }`}
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" /> : (
                                    <>
                                        <CheckCircle size={14} className="md:w-[18px] md:h-[18px]" />
                                        {isFullyPacked ? 'Seal IT' : 'Complete'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PackJobModal;
