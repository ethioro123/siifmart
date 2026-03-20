import React from 'react';
import { X, Calendar, User, Box, PackageCheck, Printer, ScanBarcode, ArrowRight } from 'lucide-react';
import { WMSJob } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface PutawayDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
}

export const PutawayDetailsModal: React.FC<PutawayDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees
}) => {
    // Resolve User Name
    const userId = selectedItem.completedBy || selectedItem.assignedTo;
    const userObj = employees.find(e => e.id === userId);
    // Use code if available, otherwise fallback to short UUID
    const displayId = userObj?.code || (userId ? userId.slice(0, 5).toUpperCase() : '');

    const userName = userObj
        ? `${userObj.name} (${displayId})`
        : (userId ? `Unknown (${displayId})` : 'System');

    // Resolve destination location across all items
    const isRealBay = (loc?: string) => loc && loc !== 'Receiving Dock' && loc !== 'Unknown';
    const itemBay = selectedItem.lineItems?.find(li => isRealBay(li.location))?.location;
    const jobBay = isRealBay((selectedItem as any).location) ? (selectedItem as any).location : undefined;
    const resolvedLocation = itemBay || jobBay || 'Not Recorded';

    const data = {
        id: selectedItem.id,
        reference: formatJobId(selectedItem),
        title: selectedItem.type === 'REPLENISH' ? 'Stock Replenishment' : 'Stock Putaway',
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        user: userName,
        items: selectedItem.lineItems || [],
        location: resolvedLocation
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-stretch md:items-center justify-center z-[200] p-0 md:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-black md:border-2 border-zinc-900 dark:border-white/10 md:rounded-3xl w-full md:max-w-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] overflow-hidden relative">
                {/* 🌟 Modal Ambient Glow — hidden on mobile */}
                <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/5 dark:bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-white/10 flex justify-between items-start bg-zinc-50/80 dark:bg-zinc-950/50 backdrop-blur-sm">
                    <div className="flex gap-3 md:gap-4 relative z-10">
                        <div className="hidden md:block p-3 rounded-xl border border-zinc-300 dark:border-blue-500/20 bg-zinc-100 dark:bg-blue-500/10 text-zinc-950 dark:text-blue-400 shadow-md dark:shadow-blue-500/20 transition-all duration-500">
                            <PackageCheck size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base md:text-xl font-black text-zinc-950 dark:text-zinc-100 uppercase tracking-tight font-mono">{data.reference}</h3>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${data.status === 'Completed' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-white/5 dark:border-white/10 dark:text-zinc-400'}`}>
                                    {data.status}
                                </span>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/10">
                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-zinc-900 dark:text-zinc-400">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">Date</p>
                            <p className="text-xs text-zinc-950 dark:text-zinc-200 font-mono tracking-tighter">{formatDateTime(data.date)}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-zinc-900 dark:text-zinc-400">
                            <User size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">By</p>
                            <p className="text-xs text-zinc-950 dark:text-zinc-200 font-black uppercase tracking-tight">{data.user}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3 col-span-2 md:col-span-1">
                        <div className="hidden md:flex p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-blue-600 dark:text-blue-400">
                            <ArrowRight size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">Destination</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-black font-mono uppercase tracking-tight">{data.location}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-white dark:bg-black/50">
                    <h4 className="text-[10px] font-black text-zinc-600 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 md:mb-4">Items Put Away</h4>
                    <div className="space-y-2 md:space-y-3">
                        {data.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-zinc-50/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 flex items-center justify-between group hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-all">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="hidden md:flex w-10 h-10 bg-zinc-100 dark:bg-black/40 rounded-lg border border-zinc-200 dark:border-white/10 items-center justify-center text-zinc-600 dark:text-zinc-600 font-black text-xs">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-zinc-950 dark:text-zinc-100 font-black uppercase tracking-tight text-xs md:text-sm truncate">{item.name || 'Unknown Item'}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-widest bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase">
                                                {item.sku}
                                            </span>
                                            {selectedItem.orderRef && (
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-widest flex items-center gap-1">
                                                    REF: {resolveOrderRef(selectedItem.orderRef)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Destination */}
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                                            <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">To Location:</span>
                                            <span className="text-[9px] font-black font-mono bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">
                                                {isRealBay(item.location) ? item.location : data.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 md:gap-6 flex-shrink-0 ml-2">
                                    <div className="text-right">
                                        <p className="text-[9px] text-zinc-400 dark:text-zinc-600 uppercase font-black tracking-widest">Qty</p>
                                        <p className="text-lg font-black text-zinc-950 dark:text-blue-400 tabular-nums font-mono">
                                            {item.expectedQty || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-8 py-3 bg-zinc-100 dark:bg-white text-zinc-950 dark:text-black hover:bg-zinc-200 dark:hover:bg-zinc-100 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md border border-zinc-300 dark:border-white/10"
                    >
                        Dismiss
                    </button>
                </div>

            </div>
        </div>
    );
};
