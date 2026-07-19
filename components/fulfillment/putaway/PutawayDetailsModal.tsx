import React from 'react';
import { X, Calendar, User, Box, PackageCheck, Printer, ScanBarcode, ArrowRight, MapPin } from 'lucide-react';
import { WMSJob } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';

import { useStore } from '../../../contexts/CentralStore';

interface PutawayDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    sites?: any[];
    t: (key: string) => string;
}

export const PutawayDetailsModal: React.FC<PutawayDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    sites = [],
    t
}) => {
    const { user } = useStore();
    // Resolve User Name
    const userId = selectedItem.completedBy || selectedItem.assignedTo;
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    let userObj = employees.find(e => 
        e.id === userId || 
        (e.name && userId && e.name.toLowerCase() === userId.toLowerCase()) || 
        (e.email && userId && e.email.toLowerCase() === userId.toLowerCase()) ||
        (e.code && userId && e.code.toLowerCase() === userId.toLowerCase())
    );
    if (!userObj && user && userId && (
        userId.toLowerCase() === user.id?.toLowerCase() || 
        userId.toLowerCase() === user.email?.toLowerCase() || 
        userId.toLowerCase() === user.name?.toLowerCase() || 
        userId.toLowerCase() === user.employeeId?.toLowerCase()
    )) {
        userObj = employees.find(e => 
            (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase()) || 
            (e.name && user.name && e.name.toLowerCase() === user.name.toLowerCase()) || 
            e.id === user.employeeId
        );
    }
    const displayId = userObj?.code || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');
    const userName = userObj ? userObj.name : (userId ? 'System Process' : 'Automated Hub');

    // Resolve destination location across all items
    const isRealBay = (loc?: string) => loc && loc !== 'Receiving Dock' && loc !== 'Unknown' && loc !== 'Unassigned';
    const itemBay = selectedItem.lineItems?.find(li => isRealBay(li.location))?.location;
    const jobBay = isRealBay((selectedItem as any).location) ? (selectedItem as any).location : undefined;
    const resolvedLocation = itemBay || jobBay || 'Registry Archive';

    const data = {
        id: selectedItem.id,
        reference: formatJobId(selectedItem),
        title: selectedItem.type === 'REPLENISH' ? t('warehouse.tabs.replenish') : t('warehouse.putaway.putaway'),
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        user: userName,
        items: selectedItem.lineItems || [],
        location: resolvedLocation,
        site: sites.find(s => s.id === (selectedItem.siteId || (selectedItem as any).site_id))
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-stretch md:items-center justify-center z-[200] p-0 md:p-4 overflow-x-hidden animate-in fade-in duration-300">
            <div className="bg-[#FAF8F5] dark:bg-[#1C2620] border border-[#E2DCCE] dark:border-emerald-950/20 md:rounded-3xl w-full md:max-w-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[92vh] overflow-hidden relative transition-all">
                {/* Visual Flair */}
                <div className="hidden md:block absolute -top-32 -right-32 w-80 h-80 bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-32 -left-32 w-80 h-80 bg-[#A9CBA2]/10 dark:bg-[#A9CBA2]/25 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-6 md:p-8 border-b border-[#E2DCCE]/60 dark:border-emerald-950/20 flex justify-between items-start bg-[#FAF8F5] dark:bg-[#1C2620] relative z-10">
                    <div className="flex gap-5">
                        <div className="hidden md:flex p-4 rounded-2xl border border-[#E2DCCE]/65 dark:border-[#2C5E3B]/30 bg-[#2C5E3B]/15 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm transition-all duration-500 active:scale-95">
                            <PackageCheck size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono leading-none">#{data.reference}</h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${data.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-emerald-500/5' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}>
                                    {data.status === 'Completed' ? t('warehouse.completed') : data.status === 'Pending' ? t('warehouse.pending') : t('warehouse.inProgress')}
                                </span>
                            </div>
                            <p className="text-[#4D6E56] dark:text-[#7A9E83] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse" />
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#E2DCCE]/40 dark:bg-white/5 text-[#2C5E3B] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white hover:bg-[#E2DCCE]/60 dark:hover:bg-white/10 transition-colors shrink-0" aria-label={t('warehouse.dismiss')}>
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#E2DCCE]/60 dark:bg-emerald-950/20 border-b border-[#E2DCCE]/60 dark:border-emerald-950/20 relative z-10">
                    {[
                        { label: t('warehouse.date'), icon: <Calendar size={18} />, value: formatDateTime(data.date), mono: true },
                        { label: t('warehouse.assignedTo'), icon: <User size={18} />, value: `${data.user} (${displayId})`, mono: false },
                        { label: t('warehouse.putaway.hubTitle'), icon: <MapPin size={18} />, value: data.site ? `${data.site.name} (${data.site.code || data.site.id})` : 'UNLISTED SITE', mono: false }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/40 dark:bg-[#1C2620]/40 p-5 flex items-center gap-4 transition-colors group hover:bg-[#FAF8F5]/60 dark:hover:bg-white/[0.02]">
                            <div className="hidden md:flex p-2.5 bg-[#FAF8F5]/85 dark:bg-[#1C2620]/30 rounded-xl text-gray-400 dark:text-gray-500 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors border border-[#E2DCCE]/30 dark:border-white/5 shadow-inner">
                                {item.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-1.5">{item.label}</p>
                                <p className={`text-[11px] text-slate-900 dark:text-gray-200 font-black uppercase break-words leading-tight ${item.mono ? 'font-mono tracking-tighter' : ''}`}>{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Line Items Container */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-[#FAF8F5]/30 dark:bg-[#18201B]/30 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.3em]">{t('warehouse.putaway.jobDetails')}</h4>
                        <div className="flex items-center gap-2 text-[9px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest bg-[#2C5E3B]/10 dark:bg-white/5 px-3 py-1 rounded-full border border-[#2C5E3B]/20 dark:border-white/10">
                            <Box size={10} /> {data.items.length} {t('warehouse.itemPlural')}
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {data.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white/85 dark:bg-[#1C2620]/50 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-5 flex items-center justify-between group hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 hover:shadow-md transition-all duration-300 active:scale-[0.99] shadow-sm">
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className="hidden md:flex w-12 h-12 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/30 rounded-xl border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] items-center justify-center text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60 font-black text-xs shadow-inner font-mono transition-all group-hover:scale-105 group-hover:bg-[#2C5E3B] dark:group-hover:bg-[#A9CBA2] group-hover:text-white dark:group-hover:text-[#1E3B24] group-hover:border-transparent">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-slate-900 dark:text-white font-black uppercase tracking-tight text-sm md:text-base leading-tight mb-2 truncate group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">{item.name || 'Unnamed Specimen'}</p>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black font-mono tracking-widest bg-[#2C5E3B]/10 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-[#2C5E3B]/20 dark:border-white/5 uppercase">
                                                SKU: {item.sku}
                                            </span>
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#2C5E3B]/10 dark:bg-white/5 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-white/10 rounded-lg">
                                                <MapPin size={10} className="shrink-0" />
                                                <span className="text-[9px] font-black font-mono tracking-widest uppercase">
                                                    {isRealBay(item.location) ? item.location : data.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-[9px] text-gray-400 dark:text-gray-555 uppercase font-black tracking-widest mb-1.5 leading-none">{t('warehouse.expectedAbbr')} {t('warehouse.qty')}</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-[#A9CBA2] tabular-nums font-mono leading-none">
                                        {item.pickedQty ?? item.expectedQty ?? 0}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 md:p-8 border-t border-[#E2DCCE]/60 dark:border-white/5 bg-[#FAF8F5]/50 dark:bg-zinc-950/40 flex justify-end relative z-20">
                    <button
                        onClick={onClose}
                        className="woody-btn-primary w-full md:w-auto px-10 py-4 text-[10px] tracking-[0.25em]"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>
            </div>
        </div>
    );
};
