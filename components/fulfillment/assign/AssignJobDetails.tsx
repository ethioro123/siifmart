import React from 'react';
import { Truck, ArrowRight, Package, X } from 'lucide-react';
import { WMSJob, Site } from '../../../types';
import { formatJobId, formatOrderRef } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';

interface AssignJobDetailsProps {
    selectedJob: WMSJob | null;
    isDetailsOpen: boolean;
    setIsDetailsOpen: (val: boolean) => void;
    sites: Site[];
    t: (key: string) => string;
}

export const AssignJobDetails: React.FC<AssignJobDetailsProps> = ({
    selectedJob,
    isDetailsOpen,
    setIsDetailsOpen,
    sites,
    t
}) => {
    if (!selectedJob || !isDetailsOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#18201B]/40 dark:bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in zoom-in duration-300">
            <div className="glass-panel rounded-t-[32px] md:rounded-[32px] w-full md:max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col relative transition-colors duration-300">
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2C5E3B]/40 dark:via-[#A9CBA2]/40 to-transparent" />

                {/* Header */}
                <div className="p-8 border-b border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] flex justify-between items-start bg-stone-50/50 dark:bg-black/30 transition-colors">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight transition-colors">Job Intelligence</h2>
                            <div className="flex flex-col gap-1">
                                <span className="px-3 py-1 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 rounded-full text-[10px] font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest flex items-center justify-center transition-colors">{formatJobId(selectedJob)}</span>
                                {selectedJob.orderRef && selectedJob.type !== 'PICK' && (
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold text-center uppercase tracking-widest transition-colors">PO: {formatOrderRef(selectedJob.orderRef)}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border transition-colors ${selectedJob.type === 'TRANSFER' ? 'border-[#2C5E3B]/30 text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10' : 'border-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10'} `}>
                                {selectedJob.type}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-stone-200 dark:bg-stone-700 transition-colors" />
                            <span className="text-stone-500 dark:text-stone-400 text-[11px] font-bold uppercase tracking-wider transition-colors">{selectedJob.status}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsDetailsOpen(false)}
                        aria-label="Close"
                        className="p-3 bg-stone-100 dark:bg-black/30 hover:bg-[#EAE5D9]/50 dark:hover:bg-[#EAE5D9]/10 rounded-2xl text-stone-500 dark:text-stone-450 hover:text-stone-900 dark:hover:text-white transition-all hover:rotate-90 duration-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                    {/* Route/Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Source/Dest */}
                        {(selectedJob.sourceSiteId || selectedJob.destSiteId) && (
                            <div className="bg-stone-50/50 dark:bg-[#1C2620]/30 rounded-[24px] p-6 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] relative overflow-hidden group transition-colors">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Truck size={24} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                </div>
                                <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest mb-4 transition-colors">Logistics Route</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-[9px] text-stone-500 dark:text-stone-450 uppercase font-bold mb-1 transition-colors">Origin</p>
                                        <p className="font-black text-stone-900 dark:text-white truncate text-sm transition-colors">{sites.find(s => s.id === selectedJob.sourceSiteId)?.name || selectedJob.sourceSiteId || 'N/A'}</p>
                                    </div>
                                    <div className="p-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30 rounded-full transition-colors">
                                        <ArrowRight className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={16} />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="text-[9px] text-stone-500 dark:text-stone-450 uppercase font-bold mb-1 transition-colors">Destination</p>
                                        <p className="font-black text-stone-900 dark:text-white truncate text-sm transition-colors">{sites.find(s => s.id === selectedJob.destSiteId)?.name || selectedJob.destSiteId || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Operations Matrix */}
                        <div className="bg-stone-50/50 dark:bg-[#1C2620]/30 rounded-[24px] p-6 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] space-y-4 transition-colors">
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest mb-2 transition-colors">Operations Matrix</p>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex justify-between items-center bg-stone-50/20 dark:bg-black/10 p-3 rounded-xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] transition-colors shadow-sm dark:shadow-none">
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase transition-colors">Requested By</span>
                                    <span className="text-stone-900 dark:text-white font-black text-xs transition-colors">{selectedJob.requestedBy || 'System Terminal'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-stone-50/20 dark:bg-black/10 p-3 rounded-xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] transition-colors shadow-sm dark:shadow-none">
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase transition-colors">Auth Authority</span>
                                    <span className="text-stone-900 dark:text-white font-black text-xs transition-colors">{selectedJob.approvedBy || 'Pending Auth'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-stone-50/20 dark:bg-black/10 p-3 rounded-xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] transition-colors shadow-sm dark:shadow-none">
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase transition-colors">Timestamp</span>
                                    <span className="text-stone-900 dark:text-white font-mono text-[10px] font-bold transition-colors">
                                        {formatDateTime(selectedJob.createdAt || new Date())}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manifest List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-stone-900 dark:text-white flex items-center gap-3 text-sm uppercase tracking-widest transition-colors">
                                <div className="p-1.5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 rounded-lg">
                                    <Package size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                </div>
                                Inventory Manifest
                            </h3>
                            <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 font-bold bg-stone-100 dark:bg-black/20 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] px-2 py-0.5 rounded-full transition-colors">
                                {selectedJob.lineItems?.length || selectedJob.items || 0} UNI
                            </span>
                        </div>

                        <div className="bg-stone-50/50 dark:bg-[#1C2620]/30 rounded-[24px] border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] overflow-hidden shadow-inner transition-colors">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[9px] text-stone-500 dark:text-stone-400 bg-stone-100/50 dark:bg-black/20 uppercase font-black tracking-widest border-b border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] transition-colors">
                                    <tr>
                                        <th className="px-6 py-4">{t('warehouse.intelligence')}</th>
                                        <th className="px-6 py-4 text-center">{t('warehouse.volume')}</th>
                                        <th className="px-6 py-4 text-right">{t('warehouse.state')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2DCCE]/30 dark:divide-emerald-950/20 transition-colors">
                                    {selectedJob.lineItems && selectedJob.lineItems.length > 0 ? selectedJob.lineItems.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-stone-100/50 dark:hover:bg-[#EAE5D9]/10 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-stone-850 dark:text-stone-200 font-black transition-colors">{item.name}</p>
                                                    <span className="px-1.5 py-0.5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] text-[8px] font-mono font-bold rounded border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 uppercase transition-colors">
                                                        {formatJobId(selectedJob)}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-stone-500 dark:text-stone-450 font-mono tracking-tighter uppercase transition-colors">{item.sku}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.orderedQty && item.orderedQty > (item.expectedQty || item.quantity || item.pickedQty || 0) ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-mono font-bold text-red-600 dark:text-red-500 line-through opacity-80 -mb-1 transition-colors" title="Short Picked">{item.orderedQty}</span>
                                                        <span className="font-black text-stone-900 dark:text-white bg-stone-200 dark:bg-black/40 px-2 py-1 rounded-lg border border-[#E2DCCE]/50 dark:border-[#A9CBA2]/10 leading-tight transition-colors">
                                                            {item.expectedQty || item.quantity || item.pickedQty || 0}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="font-black text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-black/20 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] px-2 py-1 rounded-lg transition-colors">
                                                        {item.expectedQty || item.quantity || item.pickedQty || 0}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter transition-colors ${item.status === 'Completed' ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20' :
                                                    item.status === 'Discrepancy' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500 border border-red-200 dark:border-red-500/20' :
                                                        'bg-stone-150 dark:bg-black/20 text-stone-500 dark:text-stone-450 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04]'
                                                    }`}>
                                                    {item.status || 'Verified'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="px-6 py-12 text-center text-stone-450 dark:text-stone-550 font-black uppercase tracking-widest text-[10px] italic opacity-50 transition-colors">Operational Payload Empty</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] bg-stone-50/80 dark:bg-black/50 flex justify-end gap-3 backdrop-blur-md transition-colors">
                    <button
                        onClick={() => setIsDetailsOpen(false)}
                        className="woody-btn-secondary px-8 py-3 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
