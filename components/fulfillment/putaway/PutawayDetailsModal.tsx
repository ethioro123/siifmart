import React from 'react';
import { X, Calendar, User, Box, PackageCheck, Printer, ScanBarcode, ArrowRight, MapPin } from 'lucide-react';
import { WMSJob } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface PutawayDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    sites?: any[];
}

export const PutawayDetailsModal: React.FC<PutawayDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    sites = []
}) => {
    // Resolve User Name
    const userId = selectedItem.completedBy || selectedItem.assignedTo;
    const userObj = employees.find(e => e.id === userId || e.name === userId || e.email === userId);
    const displayId = userObj?.code || (userId ? userId.slice(-5).toUpperCase() : '');
    const userName = userObj ? userObj.name : (userId ? 'System Process' : 'Automated Hub');

    // Resolve destination location across all items
    const isRealBay = (loc?: string) => loc && loc !== 'Receiving Dock' && loc !== 'Unknown' && loc !== 'Unassigned';
    const itemBay = selectedItem.lineItems?.find(li => isRealBay(li.location))?.location;
    const jobBay = isRealBay((selectedItem as any).location) ? (selectedItem as any).location : undefined;
    const resolvedLocation = itemBay || jobBay || 'Registry Archive';

    const data = {
        id: selectedItem.id,
        reference: formatJobId(selectedItem),
        title: selectedItem.type === 'REPLENISH' ? 'Stock Replenishment' : 'Inventory Putaway',
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        user: userName,
        items: selectedItem.lineItems || [],
        location: resolvedLocation,
        site: sites.find(s => s.id === (selectedItem.siteId || (selectedItem as any).site_id))
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/80 backdrop-blur-sm flex items-stretch md:items-center justify-center z-[200] p-0 md:p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-black md:border-2 border-gray-200 dark:border-white/10 md:rounded-[2.5rem] w-full md:max-w-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[92vh] overflow-hidden relative transition-all">
                {/* Visual Flair */}
                <div className="hidden md:block absolute -top-32 -right-32 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-start bg-gray-50/50 dark:bg-zinc-950/50 backdrop-blur-md relative z-10">
                    <div className="flex gap-5">
                        <div className="hidden md:flex p-4 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10 transition-all duration-500 active:scale-95">
                            <PackageCheck size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight font-mono leading-none">#{data.reference}</h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${data.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-emerald-500/5' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}>
                                    {data.status}
                                </span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                {data.title} MISSION
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-90" aria-label="Dismiss Details">
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-gray-100 dark:bg-white/10 border-b border-gray-100 dark:border-white/5 relative z-10">
                    {[
                        { label: 'Timestamp', icon: <Calendar size={18} />, value: formatDateTime(data.date), mono: true },
                        { label: 'Authorized By', icon: <User size={18} />, value: `${data.user} (${displayId})`, mono: false },
                        { label: 'Operational Hub', icon: <MapPin size={18} />, value: data.site ? `${data.site.name} (${data.site.code || data.site.id})` : 'UNLISTED SITE', mono: false }
                    ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-black p-5 flex items-center gap-4 transition-colors group hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <div className="hidden md:flex p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors border border-gray-100 dark:border-white/5 shadow-inner">
                                {item.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest leading-none mb-1.5">{item.label}</p>
                                <p className={`text-[11px] text-gray-900 dark:text-gray-200 font-black uppercase truncate leading-tight ${item.mono ? 'font-mono tracking-tighter' : ''}`}>{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Line Items Container */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-gray-50/30 dark:bg-black/40 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Operational Payload Manifest</h4>
                        <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20">
                            <Box size={10} /> {data.items.length} Units
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {data.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-white/[0.02] border-2 border-gray-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-blue-500/20 dark:hover:border-blue-400/20 hover:shadow-lg transition-all duration-300 active:scale-[0.99]">
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className="hidden md:flex w-12 h-12 bg-gray-50 dark:bg-black/40 rounded-xl border border-gray-100 dark:border-white/10 items-center justify-center text-gray-400 dark:text-gray-600 font-black text-xs shadow-inner transition-all group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-400">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-gray-900 dark:text-white font-black uppercase tracking-tight text-sm md:text-base leading-tight mb-2 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name || 'Unnamed Specimen'}</p>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="text-[9px] text-gray-500 dark:text-gray-400 font-black font-mono tracking-widest bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/5 uppercase">
                                                SKU: {item.sku}
                                            </span>
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10 rounded-lg">
                                                <MapPin size={10} className="shrink-0" />
                                                <span className="text-[9px] font-black font-mono tracking-widest uppercase">
                                                    {isRealBay(item.location) ? item.location : data.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-1.5 leading-none">Registered Units</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-blue-400 tabular-nums font-mono leading-none">
                                        {item.pickedQty ?? item.expectedQty ?? 0}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 md:p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-950/40 flex justify-end relative z-20">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-100 font-black uppercase tracking-[0.25em] text-[10px] rounded-2xl transition-all shadow-xl dark:shadow-white/5 active:scale-95 border border-gray-800 dark:border-white/10"
                    >
                        Terminate View Interface
                    </button>
                </div>
            </div>
        </div>
    );
};
