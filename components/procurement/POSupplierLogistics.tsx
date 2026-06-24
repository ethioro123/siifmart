import React, { useRef, useEffect } from 'react';
import { Supplier, Site } from '../../types';
import { Truck, MapPin, ChevronDown, ChevronUp, Check, Info, X } from 'lucide-react';

interface POSupplierLogisticsProps {
    // Supplier State
    isManualVendor: boolean;
    setIsManualVendor: (val: boolean) => void;
    newPOSupplier: string;
    setNewPOSupplier: (val: string) => void;
    manualVendorName: string;
    setManualVendorName: (val: string) => void;
    allSuppliers: Supplier[];

    // Logistics State
    destinationSiteIds: string[];
    setDestinationSiteIds: React.Dispatch<React.SetStateAction<string[]>>; // Use exact type from useState
    isSiteDropdownOpen: boolean;
    setIsSiteDropdownOpen: (val: boolean) => void;
    sites: Site[];
    quantityDistribution: string;
    setQuantityDistribution: (val: string) => void;
    expectedDate: string;
    setExpectedDate: (val: string) => void;
    poPriority: 'Normal' | 'High' | 'Urgent' | 'Low';
    setPoPriority: (val: 'Normal' | 'High' | 'Urgent' | 'Low') => void;
}

export const POSupplierLogistics: React.FC<POSupplierLogisticsProps> = ({

    isManualVendor, setIsManualVendor,
    newPOSupplier, setNewPOSupplier,
    manualVendorName, setManualVendorName,
    allSuppliers,
    destinationSiteIds, setDestinationSiteIds,
    isSiteDropdownOpen, setIsSiteDropdownOpen,
    sites,
    quantityDistribution, setQuantityDistribution,
    expectedDate, setExpectedDate,
    poPriority, setPoPriority
}) => {
    console.log("allSuppliers in POSupplierLogistics:", allSuppliers);

    const siteDropdownRef = useRef<HTMLDivElement>(null);

    // Click Outside Listener for Site Dropdown - Moved inside this component
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (siteDropdownRef.current && !siteDropdownRef.current.contains(event.target as Node)) {
                setIsSiteDropdownOpen(false);
            }
        };

        if (isSiteDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSiteDropdownOpen, setIsSiteDropdownOpen]);


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier Section */}
            <div className="relative overflow-hidden rounded-xl p-[1px] group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C5E3B]/10 via-transparent to-amber-500/5 dark:from-[#2C5E3B]/20 dark:via-transparent dark:to-amber-500/5 opacity-40"></div>
                <div className="relative bg-white dark:bg-black/60 backdrop-blur-xl rounded-xl p-6 h-full border border-gray-200 dark:border-white/5 transition-all hover:bg-gray-50/50 dark:hover:bg-black/50 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity">
                        <Truck size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    </div>

                    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100 dark:border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_8px_rgba(44,94,59,0.3)] dark:shadow-[0_0_8px_rgba(169,203,162,0.4)]"></div>
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Supplier Data</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-lg border border-gray-200 dark:border-white/10">
                            <button
                                onClick={() => setIsManualVendor(false)}
                                className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${!isManualVendor ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2] text-white dark:text-[#18201B] shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-white/5'}`}
                            >
                                REGISTERED
                            </button>
                            <button
                                onClick={() => setIsManualVendor(true)}
                                className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${isManualVendor ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2] text-white dark:text-[#18201B] shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-white/5'}`}
                            >
                                EXTERNAL
                            </button>
                        </div>

                        {!isManualVendor ? (
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Select Supplier</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all appearance-none cursor-pointer font-bold"
                                        value={newPOSupplier}
                                        onChange={(e) => setNewPOSupplier(e.target.value)}
                                        title="Select Supplier"
                                    >
                                        <option value="" className="bg-white dark:bg-gray-900 text-gray-500 text-xs">Choose from directory...</option>
                                        {allSuppliers.map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs">{s.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-2 animate-fadeIn text-left">
                                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Commercial Name</label>
                                 <input
                                    type="text"
                                    placeholder="Enter vendor identity..."
                                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-700 font-bold"
                                    value={manualVendorName}
                                    onChange={(e) => setManualVendorName(e.target.value)}
                                />
                            </div>
                        )}

                        {(newPOSupplier || manualVendorName) && (
                            <div className="pt-2 flex items-start gap-3 text-[10px] text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5">
                                <Info size={14} className="mt-0.5 text-[#2C5E3B] dark:text-[#A9CBA2] flex-shrink-0" />
                                <p className="leading-relaxed">
                                    Entity verified. Procurement protocols and payment conditions will be applied per profile settings.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

             {/* Logistics Section */}
            <div className="relative rounded-xl p-[1px] group">
                <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/10 via-transparent to-[#2C5E3B]/10 dark:from-amber-500/15 dark:via-transparent dark:to-[#2C5E3B]/10 rounded-xl opacity-40"></div>
                <div className="relative bg-white dark:bg-black/60 backdrop-blur-xl rounded-xl p-6 h-full border border-gray-200 dark:border-white/5 transition-all hover:bg-gray-50/50 dark:hover:bg-black/50 shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity">
                        <MapPin size={20} className="text-amber-700 dark:text-amber-500" />
                    </div>

                    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100 dark:border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.3)] dark:shadow-[0_0_8px_rgba(217,119,6,0.4)]"></div>
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Logistics Engine</h3>
                    </div>

                    <div className="space-y-5">
                        {/* Destination Dropdown */}
                        <div className="space-y-2 relative" ref={siteDropdownRef}>
                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Deployment Sites</label>

                            <div
                                className={`w-full bg-gray-50 dark:bg-black/40 border rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white cursor-pointer flex justify-between items-center transition-all ${isSiteDropdownOpen ? 'border-amber-500/50 shadow-[0_0_10px_rgba(217,119,6,0.15)] focus:ring-2 focus:ring-amber-500/10' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}
                                onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
                            >
                                <span className={destinationSiteIds.length === 0 ? 'text-gray-400 dark:text-gray-500 text-xs' : 'text-gray-900 dark:text-white font-black'}>
                                    {destinationSiteIds.length === 0
                                        ? 'Select drop-off locations...'
                                        : `${destinationSiteIds.length} location(s) assigned`}
                                </span>
                                {isSiteDropdownOpen ? <ChevronUp size={16} className="text-amber-700 dark:text-amber-500" /> : <ChevronDown size={16} className="text-gray-400 dark:text-gray-600" />}
                            </div>

                            {/* Dropdown Menu */}
                            {isSiteDropdownOpen && (
                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl backdrop-blur-2xl max-h-60 overflow-y-auto custom-scrollbar p-2 ring-1 ring-black/5 dark:ring-white/10">
                                    <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black p-2 pb-1 tracking-tighter">Available Warehouses</div>
                                    {sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center').map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                setDestinationSiteIds(prev =>
                                                    prev.includes(s.id)
                                                        ? prev.filter(id => id !== s.id)
                                                        : [...prev, s.id]
                                                );
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${destinationSiteIds.includes(s.id)
                                                ? 'bg-amber-500/10 text-amber-700 dark:text-white'
                                                : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${destinationSiteIds.includes(s.id)
                                                ? 'bg-amber-600 border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.3)]'
                                                : 'border-gray-700'
                                                }`}>
                                                {destinationSiteIds.includes(s.id) && <Check size={10} className="text-white" />}
                                            </div>
                                            <span className="text-xs font-semibold uppercase tracking-tight">{s.name}</span>
                                        </div>
                                    ))}
                                    {sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center').length === 0 && (
                                        <div className="p-4 text-center text-gray-600 text-[10px] italic">
                                            No accessible nodes found.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Selected Tags */}
                            {destinationSiteIds.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {destinationSiteIds.map(id => {
                                        const site = sites.find(s => s.id === id);
                                        return (
                                            <span key={id} className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded flex items-center gap-1.5 font-bold tracking-tight">
                                                {site?.name}
                                                <X
                                                    size={10}
                                                    className="cursor-pointer hover:text-white transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDestinationSiteIds(prev => prev.filter(sid => sid !== id));
                                                    }}
                                                />
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Date & Priority */}
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Deadline Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all cursor-text font-bold"
                                    value={expectedDate}
                                    onChange={(e) => setExpectedDate(e.target.value)}
                                    title="Deadline Date"
                                />
                            </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Order Priority</label>
                                 <div className="relative">
                                     <select
                                         className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all appearance-none font-bold"
                                         value={poPriority}
                                         onChange={(e) => setPoPriority(e.target.value as any)}
                                         title="Priority"
                                     >
                                         <option value="Low" className="bg-white dark:bg-gray-900">Low</option>
                                         <option value="Normal" className="bg-white dark:bg-gray-900">Normal</option>
                                         <option value="High" className="bg-white dark:bg-gray-900">High (Priority)</option>
                                         <option value="Urgent" className="bg-white dark:bg-gray-900">Urgent (Critical)</option>
                                     </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Distribution Mode */}
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Allocation Protocol</label>
                            <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-lg border border-gray-200 dark:border-white/10">
                                <button
                                    onClick={() => setQuantityDistribution('per-store')}
                                    className={`flex-1 py-1.5 text-[9px] font-black rounded transition-all ${quantityDistribution === 'per-store' ? 'bg-white dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-gray-200 dark:border-amber-500/30 shadow-sm dark:shadow-[0_0_10px_rgba(217,119,6,0.1)]' : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                                >
                                    PER NODE
                                </button>
                                <button
                                    onClick={() => setQuantityDistribution('total-split')}
                                    className={`flex-1 py-1.5 text-[9px] font-black rounded transition-all ${quantityDistribution === 'total-split' ? 'bg-white dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-gray-200 dark:border-amber-500/30 shadow-sm dark:shadow-[0_0_10px_rgba(217,119,6,0.1)]' : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                                >
                                    AUTO SPLIT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
