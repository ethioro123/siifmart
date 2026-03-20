import React from 'react';
import { X, Calendar, User, Package, Archive, Box, MapPin, Printer, ArrowRight, Undo2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface PackDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    sites: any[];
    products: Product[];
    onReturn?: (job: WMSJob) => void;
    onReprintLabel?: (job: WMSJob, labelSize: string) => void;
}

export const PackDetailsModal: React.FC<PackDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    sites,
    products,
    onReturn,
    onReprintLabel
}) => {
    // Resolve User Name
    const userId = selectedItem.completedBy || selectedItem.assignedTo;
    const userObj = employees.find(e => e.id === userId);
    // Use code if available, otherwise fallback to short UUID
    const displayId = userObj?.code || (userId ? userId.slice(0, 5).toUpperCase() : '');

    const userName = userObj
        ? `${userObj.name} (${displayId})`
        : (userId ? `Unknown (${displayId})` : 'System');

    const sourceSite = sites.find(s => s.id === selectedItem.siteId);
    const destSite = sites.find(s => s.id === selectedItem.destSiteId);
    const trackingNum = selectedItem.trackingNumber || 'Not Generated';

    const [isPrintMenuOpen, setIsPrintMenuOpen] = React.useState(false);

    // Prioritize array fields. If selectedItem.items is a number, ignore it for the array.
    let rawItems = selectedItem.lineItems || (selectedItem as any).line_items ||
        (Array.isArray(selectedItem.items) ? selectedItem.items : null) || [];

    if (typeof rawItems === 'string') {
        try {
            rawItems = JSON.parse(rawItems);
        } catch (e) {
            rawItems = [];
        }
    }
    const itemsArray = Array.isArray(rawItems) ? rawItems : [];

    const data = {
        id: selectedItem.id,
        reference: formatJobId(selectedItem),
        title: 'Pack Order',
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        user: userName,
        source: sourceSite?.name || 'Unknown Source',
        destination: destSite?.name || 'Unknown Destination',
        trackingNumber: trackingNum,
        items: itemsArray,
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-0 md:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-black border-0 md:border-2 border-zinc-900 dark:border-white/10 w-full max-w-4xl h-[100dvh] md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                {/* 🌟 Modal Ambient Glow - Cyan Theme for Pack */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/5 dark:bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-3 md:p-6 border-b border-zinc-200 dark:border-white/10 flex justify-between items-start bg-zinc-50/80 dark:bg-zinc-950/50 backdrop-blur-sm shrink-0">
                    <div className="flex gap-3 md:gap-4 relative z-10">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl border border-zinc-300 dark:border-cyan-500/20 bg-zinc-100 dark:bg-cyan-500/10 text-zinc-950 dark:text-cyan-400 shadow-md dark:shadow-cyan-500/20 transition-all duration-500">
                            <Archive size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                                <h3 className="text-lg md:text-xl font-black text-zinc-950 dark:text-zinc-100 uppercase tracking-tight font-mono leading-none">{data.reference}</h3>
                                <div className="flex gap-1 md:gap-2">
                                    <span className={`px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[9px] font-mono border ${data.status === 'Completed' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-white/5 dark:border-white/10 dark:text-zinc-400'}`}>
                                        {data.status}
                                    </span>
                                    {itemsArray.some(li => (li.returnedQty || 0) > 0) && (
                                        <span className="px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[9px] font-mono border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                                            {itemsArray.filter(li => (li.returnedQty || 0) > 0).length} RET
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 md:gap-2 md:mt-1">
                                <Box size={10} className="md:w-3 md:h-3 text-zinc-950 dark:text-zinc-400" />
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-600 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" aria-label="Close details">
                        <X size={18} className="md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/10 shrink-0">
                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3 lg:col-span-1">
                        <div className="p-1.5 md:p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-zinc-900 dark:text-zinc-400">
                            <Calendar size={14} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">Completed</p>
                            <p className="text-[10px] md:text-xs text-zinc-950 dark:text-zinc-200 font-mono tracking-tighter truncate">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3 border-l border-zinc-100 dark:border-white/5 lg:col-span-1">
                        <div className="w-6 h-6 md:w-8 md:h-8 shrink-0 rounded-full bg-zinc-100 dark:bg-cyan-950 flex items-center justify-center border border-zinc-300 dark:border-cyan-500/30 shadow-inner">
                            <span className="text-[8px] md:text-[10px] font-black text-zinc-950 dark:text-cyan-400">{(data.user || 'S').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">User</p>
                            <p className="text-[10px] md:text-xs text-zinc-950 dark:text-zinc-200 font-black uppercase tracking-tight truncate">{data.user}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3 col-span-2 lg:col-span-1 border-t lg:border-t-0 border-zinc-100 dark:border-white/5 lg:border-l">
                        <div className="p-1.5 md:p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-cyan-600 dark:text-cyan-400 shrink-0">
                            <Printer size={14} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">Tracking</p>
                            <p className="text-[10px] md:text-xs text-cyan-600 dark:text-cyan-400 font-mono tracking-tight font-black truncate">{data.trackingNumber}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3 border-t lg:border-t-0 border-r lg:border-r-0 border-zinc-100 dark:border-white/5 lg:col-span-1 lg:border-l">
                        <div className="p-1.5 md:p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-zinc-900 dark:text-zinc-400 shrink-0">
                            <MapPin size={14} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">Source</p>
                            <p className="text-[10px] md:text-xs text-zinc-950 dark:text-zinc-200 font-black uppercase tracking-tight truncate">{data.source}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3 border-t lg:border-t-0 border-zinc-100 dark:border-white/5 lg:col-span-1 lg:border-l">
                        <div className="p-1.5 md:p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-zinc-900 dark:text-zinc-400 shrink-0">
                            <ArrowRight size={14} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">Destination</p>
                            <p className="text-[10px] md:text-xs text-zinc-950 dark:text-zinc-200 font-black uppercase tracking-tight truncate">{data.destination}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar bg-white dark:bg-black/50">
                    <h4 className="text-[9px] md:text-[10px] font-black text-zinc-600 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 md:mb-4">Items Packed</h4>
                    <div className="space-y-2 md:space-y-3">
                        {itemsArray.map((item: any, idx: number) => {
                            const isShortPicked = item.orderedQty && item.orderedQty > (item.expectedQty || item.quantity || 1);

                            // Resolve full product info
                            const productInfo = products?.find(p =>
                                p.id === item.productId ||
                                p.sku === item.sku ||
                                p.productId === item.productId
                            );

                            return (
                                <div key={idx} className="bg-zinc-50/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-2.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-all">
                                    <div className="flex flex-row items-center gap-3 md:gap-4 min-w-0">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-100 dark:bg-black/40 rounded-lg border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-600 font-black text-[10px] md:text-xs shrink-0 mt-0.5 sm:mt-0 self-start sm:self-center">
                                            {idx + 1}
                                        </div>
                                        <div className="min-w-0 pr-2">
                                            <p className="text-[11px] md:text-sm text-zinc-950 dark:text-zinc-100 font-black uppercase tracking-tight break-words leading-tight">{item.name || item.product?.name || productInfo?.name || 'Unknown Item'}</p>
                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 md:mt-2">
                                                <span className="text-[8px] md:text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-widest bg-zinc-100 dark:bg-white/5 px-1.5 md:px-2 py-0.5 rounded uppercase border border-zinc-200 dark:border-white/10 shrink-0">
                                                    {item.sku || item.product?.sku || productInfo?.sku}
                                                </span>

                                                {(productInfo?.brand || (item as any).brand) && (
                                                    <span className="text-[8px] md:text-[10px] text-zinc-600 dark:text-zinc-400 font-black uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-1.5 md:px-2 py-0.5 rounded border border-dashed border-zinc-300 dark:border-white/10 shrink-0 hidden sm:inline-flex">
                                                        {productInfo?.brand || (item as any).brand}
                                                    </span>
                                                )}

                                                {(productInfo?.category || item.category) && (
                                                    <span className="text-[8px] md:text-[10px] text-cyan-600 dark:text-cyan-500 font-black uppercase tracking-widest border border-cyan-500/20 bg-cyan-500/5 px-1.5 md:px-2 py-0.5 rounded shadow-sm shrink-0">
                                                        {productInfo?.category || item.category}
                                                    </span>
                                                )}

                                                {(productInfo?.size || productInfo?.unit) && (
                                                    <span className="text-[8px] md:text-[10px] text-zinc-600 dark:text-zinc-400 font-black uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-1.5 md:px-2 py-0.5 rounded border border-zinc-200 dark:border-white/10 shrink-0">
                                                        {productInfo?.size} {productInfo?.unit}
                                                    </span>
                                                )}

                                                {selectedItem.orderRef && (
                                                    <span className="text-[8px] md:text-[10px] text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                                                        REF: <span className="font-mono">{resolveOrderRef(selectedItem.orderRef)}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 sm:gap-6 ml-11 sm:ml-0 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-black/5 dark:border-white/5 justify-end">
                                        {item.returnedQty > 0 && (
                                            <div className="text-right">
                                                <p className="text-[8px] md:text-[9px] text-red-500 dark:text-red-400 uppercase font-black tracking-widest">Returned</p>
                                                <p className="text-sm md:text-lg font-black text-red-600 dark:text-red-400 tabular-nums font-mono leading-none">
                                                    {item.returnedQty}
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-[8px] md:text-[9px] text-zinc-400 dark:text-zinc-600 uppercase font-black tracking-widest">Req / Pkd</p>
                                            <div className="flex items-center gap-1.5 md:gap-2 justify-end">
                                                {isShortPicked && (
                                                    <span className="text-[10px] md:text-xs font-mono font-bold text-red-500 line-through opacity-80 leading-none" title="Short Picked">{item.orderedQty}</span>
                                                )}
                                                <p className="text-sm md:text-lg font-black text-zinc-950 dark:text-cyan-400 tabular-nums font-mono leading-none">
                                                    {(() => {
                                                        const expected = item.expectedQty || (item as any).quantity || 0;
                                                        const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0;

                                                        if ((item as any).requestedMeasureQty) {
                                                            const unitDef = productInfo?.unit ? productInfo.unit : '';
                                                            return <span className="text-sm md:text-lg font-mono font-black text-teal-400">{picked} / {(item as any).requestedMeasureQty} <span className="text-[8px] md:text-[10px] text-teal-500/60 font-bold uppercase tracking-widest leading-none">{unitDef}</span></span>;
                                                        }
                                                        return <span className="text-sm md:text-lg font-mono font-black text-teal-400">{picked} / {expected}</span>;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 md:p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 flex justify-between items-center gap-3 shrink-0">
                    <div className="flex gap-2">
                        {data.status === 'Completed' && (
                            <>
                                <button
                                    onClick={() => onReturn?.(selectedItem)}
                                    className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all"
                                >
                                    <Undo2 size={12} className="md:w-3.5 md:h-3.5" />
                                    <span className="hidden sm:inline">Return Items</span><span className="sm:hidden">Return</span>
                                </button>

                            </>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all"
                            >
                                <Printer size={12} className="md:w-3.5 md:h-3.5" />
                                <span className="hidden sm:inline">Reprint Label</span><span className="sm:hidden">Label</span>
                            </button>

                            {isPrintMenuOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-32 md:w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in slide-in-from-bottom-2 duration-200">
                                    {(['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'XL'] as const).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                onReprintLabel?.(selectedItem, size);
                                                setIsPrintMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 md:px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-cyan-500 transition-colors"
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-6 md:px-8 py-2 md:py-2.5 bg-zinc-100 dark:bg-white text-zinc-950 dark:text-black hover:bg-zinc-200 dark:hover:bg-zinc-100 font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl transition-all shadow-md border border-zinc-300 dark:border-white/10"
                    >
                        Dismiss
                    </button>
                </div>

            </div>
        </div>
    );
};
