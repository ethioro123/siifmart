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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xl p-0 md:p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-[#0a0a0b]/90 border border-white/10 rounded-t-[32px] md:rounded-[32px] w-full md:max-w-2xl max-h-[85vh] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_20px_rgba(0,255,157,0.05)] flex flex-col relative">
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-primary/40 to-transparent" />

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-start bg-black/20">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-2xl font-black text-white tracking-tight">Job Intelligence</h2>
                            <div className="flex flex-col gap-1">
                                <span className="px-3 py-1 bg-cyber-primary/10 border border-cyber-primary/20 rounded-full text-[10px] font-mono font-bold text-cyber-primary uppercase tracking-widest flex items-center justify-center">{formatJobId(selectedJob)}</span>
                                {selectedJob.orderRef && selectedJob.type !== 'PICK' && (
                                    <span className="text-[10px] text-gray-500 font-bold text-center uppercase tracking-widest">PO: {formatOrderRef(selectedJob.orderRef)}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border ${selectedJob.type === 'TRANSFER' ? 'border-cyber-primary/30 text-cyber-primary bg-cyber-primary/10' : 'border-blue-500/30 text-blue-400 bg-blue-500/10'} `}>
                                {selectedJob.type}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-gray-700" />
                            <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">{selectedJob.status}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsDetailsOpen(false)}
                        aria-label="Close"
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 hover:text-white transition-all hover:rotate-90 duration-300"
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
                            <div className="bg-white/5 rounded-[24px] p-6 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Truck size={24} className="text-cyber-primary" />
                                </div>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4">Logistics Route</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Origin</p>
                                        <p className="font-black text-white truncate text-sm">{sites.find(s => s.id === selectedJob.sourceSiteId)?.name || selectedJob.sourceSiteId || 'N/A'}</p>
                                    </div>
                                    <div className="p-2 bg-cyber-primary/10 rounded-full border border-cyber-primary/20">
                                        <ArrowRight className="text-cyber-primary" size={16} />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Destination</p>
                                        <p className="font-black text-white truncate text-sm">{sites.find(s => s.id === selectedJob.destSiteId)?.name || selectedJob.destSiteId || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Operations Matrix */}
                        <div className="bg-white/5 rounded-[24px] p-6 border border-white/5 space-y-4">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Operations Matrix</p>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Requested By</span>
                                    <span className="text-white font-black text-xs">{selectedJob.requestedBy || 'System Terminal'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Auth Authority</span>
                                    <span className="text-white font-black text-xs">{selectedJob.approvedBy || 'Pending Auth'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Timestamp</span>
                                    <span className="text-white font-mono text-[10px] font-bold">
                                        {formatDateTime(selectedJob.createdAt || new Date())}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manifest List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-white flex items-center gap-3 text-sm uppercase tracking-widest">
                                <div className="p-1.5 bg-cyber-primary/20 rounded-lg">
                                    <Package size={14} className="text-cyber-primary" />
                                </div>
                                Inventory Manifest
                            </h3>
                            <span className="text-[10px] font-mono text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                {selectedJob.lineItems?.length || selectedJob.items || 0} UNI
                            </span>
                        </div>

                        <div className="bg-white/5 rounded-[24px] border border-white/5 overflow-hidden shadow-inner shadow-black/20">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[9px] text-gray-600 bg-white/[0.02] uppercase font-black tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4">{t('warehouse.intelligence')}</th>
                                        <th className="px-6 py-4 text-center">{t('warehouse.volume')}</th>
                                        <th className="px-6 py-4 text-right">{t('warehouse.state')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {selectedJob.lineItems && selectedJob.lineItems.length > 0 ? selectedJob.lineItems.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-gray-200 font-black">{item.name}</p>
                                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-mono font-bold rounded border border-blue-500/20 uppercase">
                                                        {formatJobId(selectedJob)}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">{item.sku}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.orderedQty && item.orderedQty > (item.expectedQty || item.quantity || item.pickedQty || 0) ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-mono font-bold text-red-500 line-through opacity-80 -mb-1" title="Short Picked">{item.orderedQty}</span>
                                                        <span className="font-black text-white bg-white/10 px-2 py-1 rounded-lg border border-white/10 leading-tight">
                                                            {item.expectedQty || item.quantity || item.pickedQty || 0}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="font-black text-gray-400 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                                        {item.expectedQty || item.quantity || item.pickedQty || 0}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter ${item.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                    item.status === 'Discrepancy' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                        'bg-white/10 text-gray-500 border border-white/5'
                                                    }`}>
                                                    {item.status || 'Verified'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-600 font-black uppercase tracking-widest text-[10px] italic opacity-50">Operational Payload Empty</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 bg-black/40 flex justify-end gap-3 backdrop-blur-md">
                    <button
                        onClick={() => setIsDetailsOpen(false)}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
