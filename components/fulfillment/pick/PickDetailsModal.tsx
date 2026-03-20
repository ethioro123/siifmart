import React from 'react';
import { X, Calendar, User, Package, Archive, Box, MapPin, Printer, ScanBarcode, ArrowRight, Undo2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface PickDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    products?: Product[];
    onReturn?: (job: WMSJob) => void;
}

export const PickDetailsModal: React.FC<PickDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    products,
    onReturn
}) => {
    // Resolve User Name
    const userId = selectedItem.completedBy || selectedItem.assignedTo;
    const userObj = employees.find(e => e.id === userId);
    // Use code if available, otherwise fallback to short UUID
    const displayId = userObj?.code || (userId ? userId.slice(0, 5).toUpperCase() : '');

    const userName = userObj
        ? `${userObj.name} (${displayId})`
        : (userId ? `Unknown (${displayId})` : 'System');

    // For Pick, the destination is usually Pack/Shipping, but the SOURCE location is what we care about per item
    let rawItems = selectedItem.lineItems || selectedItem.items || [];
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
        title: 'Order Pick',
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        user: userName,
        items: itemsArray,
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-black border-2 border-zinc-900 dark:border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
                {/* 🌟 Modal Ambient Glow - Purple Theme for Pick */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/5 dark:bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex justify-between items-start bg-zinc-50/80 dark:bg-zinc-950/50 backdrop-blur-sm">
                    <div className="flex gap-4 relative z-10">
                        <div className="p-3 rounded-xl border border-zinc-300 dark:border-purple-500/20 bg-zinc-100 dark:bg-purple-500/10 text-zinc-950 dark:text-purple-400 shadow-md dark:shadow-purple-500/20 transition-all duration-500">
                            <Package size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-black text-zinc-950 dark:text-zinc-100 uppercase tracking-tight font-mono">{data.reference}</h3>
                                <div className="flex gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${data.status === 'Completed' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                                        {data.status}
                                    </span>
                                    {itemsArray.some(li => (li.returnedQty || 0) > 0) && (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-mono border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                                            {itemsArray.filter(li => (li.returnedQty || 0) > 0).length} RETURNED
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                                <Box size={12} className="text-zinc-950 dark:text-zinc-400" />
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-600 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" aria-label="Close details">
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/10">
                    <div className="bg-white dark:bg-black p-4 flex items-center gap-3">
                        <div className="p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-zinc-900 dark:text-zinc-400">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">Date Completed</p>
                            <p className="text-xs text-zinc-950 dark:text-zinc-200 font-mono tracking-tighter">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-black p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-purple-950 flex items-center justify-center border border-zinc-300 dark:border-purple-500/30 shadow-inner">
                            <span className="text-[10px] font-black text-zinc-950 dark:text-purple-400">{(data.user || 'S').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">Performed By</p>
                            <p className="text-xs text-zinc-950 dark:text-zinc-200 font-black uppercase tracking-tight">{data.user}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-black/50">
                    <h4 className="text-[10px] font-black text-zinc-600 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Items Picked</h4>
                    <div className="space-y-3">
                        {data.items.map((item: any, idx: number) => {
                            const isShortPicked = item.orderedQty && item.orderedQty > (item.expectedQty || 1);

                            // Resolve full product info
                            const productInfo = products?.find(p =>
                                p.id === item.productId ||
                                p.sku === item.sku ||
                                p.productId === item.productId
                            );

                            return (
                                <div key={idx} className="bg-zinc-50/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-zinc-100 dark:bg-black/40 rounded-lg border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-600 font-black text-xs shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-zinc-950 dark:text-zinc-100 font-black uppercase tracking-tight break-words leading-tight">{item.name || item.product?.name || productInfo?.name || 'Unknown Item'}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-widest bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded uppercase border border-zinc-200 dark:border-white/10">
                                                    {item.sku || item.product?.sku || productInfo?.sku}
                                                </span>

                                                {(productInfo?.brand || (item as any).brand) && (
                                                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-black uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded border border-dashed border-zinc-300 dark:border-white/10">
                                                        {productInfo?.brand || (item as any).brand}
                                                    </span>
                                                )}

                                                {(productInfo?.category || item.category) && (
                                                    <span className="text-[10px] text-purple-600 dark:text-purple-500 font-black uppercase tracking-widest border border-purple-500/20 bg-purple-500/5 px-2 py-0.5 rounded shadow-sm">
                                                        {productInfo?.category || item.category}
                                                    </span>
                                                )}

                                                {(productInfo?.size || productInfo?.unit) && (
                                                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-black uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded border border-zinc-200 dark:border-white/10">
                                                        {productInfo?.size} {productInfo?.unit}
                                                    </span>
                                                )}

                                                {selectedItem.orderRef && (
                                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-widest flex items-center gap-1">
                                                        REF: {resolveOrderRef(selectedItem.orderRef)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Source Location */}
                                            {item.location && item.location !== 'Unknown' && (
                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                                                    <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">From Bay:</span>
                                                    <span className="text-[9px] font-black font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <MapPin size={10} /> {item.location}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {item.returnedQty > 0 && (
                                            <div className="text-right">
                                                <p className="text-[9px] text-red-500 dark:text-red-400 uppercase font-black tracking-widest">Returned</p>
                                                <p className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums font-mono">
                                                    {item.returnedQty}
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-[9px] text-zinc-400 dark:text-zinc-600 uppercase font-black tracking-widest">Req / Pkd</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                {isShortPicked && (
                                                    <span className="text-xs font-mono font-bold text-red-500 line-through opacity-80" title="Short Picked">{item.orderedQty}</span>
                                                )}
                                                <p className="text-lg font-black text-zinc-950 dark:text-purple-400 tabular-nums font-mono">
                                                    {(() => {
                                                        const expected = item.expectedQty || (item as any).quantity || 0;
                                                        const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0;
                                                        let displayPicked = picked;

                                                        if ((item as any).requestedMeasureQty && expected === item.expectedQty) {
                                                            const unitDef = productInfo?.unit ? productInfo.unit : '';
                                                            // Calculate proportional volume picked.
                                                            if (expected > 0) {
                                                                const fillRatio = picked / expected;
                                                                displayPicked = (item as any).requestedMeasureQty * fillRatio;
                                                            }
                                                            return <span className="text-lg font-mono font-black text-green-400">{displayPicked} / {(item as any).requestedMeasureQty} <span className="text-[10px] text-green-500/60 font-bold uppercase tracking-widest">{unitDef}</span></span>;
                                                        }
                                                        return <span className="text-lg font-mono font-black text-green-400">{picked} / {expected}</span>;
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
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 flex justify-between items-center gap-3 shrink-0">
                    <div className="flex gap-2">
                        {selectedItem.status === 'Completed' && (
                            <button
                                onClick={() => onReturn?.(selectedItem)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                            >
                                <Undo2 size={14} />
                                Return Items
                            </button>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-zinc-100 dark:bg-white text-zinc-950 dark:text-black hover:bg-zinc-200 dark:hover:bg-zinc-100 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md border border-zinc-300 dark:border-white/10"
                    >
                        Dismiss
                    </button>
                </div>

            </div>
        </div>
    );
};
