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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-0 md:p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-white dark:bg-[#0a0a0b]/90 border border-slate-200 dark:border-white/10 rounded-t-[32px] md:rounded-[32px] w-full md:max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col relative transition-colors duration-300">
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-primary/40 to-transparent" />

                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-start bg-slate-50 dark:bg-black/20 transition-colors">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Job Intelligence</h2>
                            <div className="flex flex-col gap-1">
                                <span className="px-3 py-1 bg-cyber-primary/10 border border-cyber-primary/20 rounded-full text-[10px] font-mono font-bold text-cyber-primary uppercase tracking-widest flex items-center justify-center transition-colors">{formatJobId(selectedJob)}</span>
                                {selectedJob.orderRef && selectedJob.type !== 'PICK' && (
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold text-center uppercase tracking-widest transition-colors">PO: {formatOrderRef(selectedJob.orderRef)}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border transition-colors ${selectedJob.type === 'TRANSFER' ? 'border-cyber-primary/30 text-cyber-primary bg-cyber-primary/10' : 'border-blue-500/30 text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10'} `}>
                                {selectedJob.type}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-gray-700 transition-colors" />
                            <span className="text-slate-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider transition-colors">{selectedJob.status}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsDetailsOpen(false)}
                        aria-label="Close"
                        className="p-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 rounded-2xl text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:rotate-90 duration-300"
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
                            <div className="bg-slate-50 dark:bg-white/5 rounded-[24px] p-6 border border-slate-100 dark:border-white/5 relative overflow-hidden group transition-colors">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Truck size={24} className="text-cyber-primary" />
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-black tracking-widest mb-4 transition-colors">Logistics Route</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-[9px] text-slate-500 dark:text-gray-600 uppercase font-bold mb-1 transition-colors">Origin</p>
                                        <p className="font-black text-slate-900 dark:text-white truncate text-sm transition-colors">{sites.find(s => s.id === selectedJob.sourceSiteId)?.name || selectedJob.sourceSiteId || 'N/A'}</p>
                                    </div>
                                    <div className="p-2 bg-cyber-primary/10 rounded-full border border-cyber-primary/20 transition-colors">
                                        <ArrowRight className="text-cyber-primary" size={16} />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="text-[9px] text-slate-500 dark:text-gray-600 uppercase font-bold mb-1 transition-colors">Destination</p>
                                        <p className="font-black text-slate-900 dark:text-white truncate text-sm transition-colors">{sites.find(s => s.id === selectedJob.destSiteId)?.name || selectedJob.destSiteId || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Operations Matrix */}
                        <div className="bg-slate-50 dark:bg-white/5 rounded-[24px] p-6 border border-slate-100 dark:border-white/5 space-y-4 transition-colors">
                            <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-black tracking-widest mb-2 transition-colors">Operations Matrix</p>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex justify-between items-center bg-white dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5 transition-colors shadow-sm dark:shadow-none">
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase transition-colors">Requested By</span>
                                    <span className="text-slate-900 dark:text-white font-black text-xs transition-colors">{selectedJob.requestedBy || 'System Terminal'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5 transition-colors shadow-sm dark:shadow-none">
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase transition-colors">Auth Authority</span>
                                    <span className="text-slate-900 dark:text-white font-black text-xs transition-colors">{selectedJob.approvedBy || 'Pending Auth'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5 transition-colors shadow-sm dark:shadow-none">
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase transition-colors">Timestamp</span>
                                    <span className="text-slate-900 dark:text-white font-mono text-[10px] font-bold transition-colors">
                                        {formatDateTime(selectedJob.createdAt || new Date())}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manifest List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 text-sm uppercase tracking-widest transition-colors">
                                <div className="p-1.5 bg-cyber-primary/20 rounded-lg">
                                    <Package size={14} className="text-cyber-primary" />
                                </div>
                                Inventory Manifest
                            </h3>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-gray-500 font-bold bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5 transition-colors">
                                {selectedJob.lineItems?.length || selectedJob.items || 0} UNI
                            </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-[24px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-inner shadow-slate-200/50 dark:shadow-black/20 transition-colors">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[9px] text-slate-500 dark:text-gray-600 bg-slate-100 dark:bg-white/[0.02] uppercase font-black tracking-widest border-b border-slate-200 dark:border-white/5 transition-colors">
                                    <tr>
                                        <th className="px-6 py-4">{t('warehouse.intelligence')}</th>
                                        <th className="px-6 py-4 text-center">{t('warehouse.volume')}</th>
                                        <th className="px-6 py-4 text-right">{t('warehouse.state')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.02] transition-colors">
                                    {selectedJob.lineItems && selectedJob.lineItems.length > 0 ? selectedJob.lineItems.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-white dark:hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-slate-800 dark:text-gray-200 font-black transition-colors">{item.name}</p>
                                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[8px] font-mono font-bold rounded border border-blue-200 dark:border-blue-500/20 uppercase transition-colors">
                                                        {formatJobId(selectedJob)}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 dark:text-gray-600 font-mono tracking-tighter uppercase transition-colors">{item.sku}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.orderedQty && item.orderedQty > (item.expectedQty || item.quantity || item.pickedQty || 0) ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-mono font-bold text-red-600 dark:text-red-500 line-through opacity-80 -mb-1 transition-colors" title="Short Picked">{item.orderedQty}</span>
                                                        <span className="font-black text-slate-900 dark:text-white bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-lg border border-slate-300 dark:border-white/10 leading-tight transition-colors">
                                                            {item.expectedQty || item.quantity || item.pickedQty || 0}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="font-black text-slate-500 dark:text-gray-400 bg-slate-200/50 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5 transition-colors">
                                                        {item.expectedQty || item.quantity || item.pickedQty || 0}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter transition-colors ${item.status === 'Completed' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border border-green-200 dark:border-green-500/20' :
                                                    item.status === 'Discrepancy' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500 border border-red-200 dark:border-red-500/20' :
                                                        'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-500 border border-slate-200 dark:border-white/5'
                                                    }`}>
                                                    {item.status || 'Verified'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 dark:text-gray-600 font-black uppercase tracking-widest text-[10px] italic opacity-50 transition-colors">Operational Payload Empty</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-black/40 flex justify-end gap-3 backdrop-blur-md transition-colors">
                    <button
                        onClick={() => setIsDetailsOpen(false)}
                        className="px-8 py-3 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm dark:shadow-none transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
