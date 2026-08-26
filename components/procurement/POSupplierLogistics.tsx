import React, { useRef, useEffect } from 'react';
import { Supplier, Site } from '../../types';
import { Truck, MapPin, ChevronDown, ChevronUp, Check, Info, X } from 'lucide-react';
import { logger } from '../../utils/logger';

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
    setDestinationSiteIds: React.Dispatch<React.SetStateAction<string[]>>;
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
    const siteDropdownRef = useRef<HTMLDivElement>(null);

    // Click Outside Listener for Site Dropdown
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

    const cardBase = "bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier Section */}
            <div className={cardBase}>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                            <Truck size={16} />
                        </div>
                        <h3 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">Supplier Information</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Toggle Supplier Type */}
                    <div className="flex bg-[#FAF8F5] dark:bg-black/30 p-1 rounded-2xl border border-[#E2DCCE] dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsManualVendor(false)}
                            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${!isManualVendor ? 'bg-[#2C5E3B] text-white shadow-sm' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'}`}
                        >
                            REGISTERED VENDOR
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsManualVendor(true)}
                            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isManualVendor ? 'bg-[#2C5E3B] text-white shadow-sm' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'}`}
                        >
                            ONE-OFF / EXTERNAL
                        </button>
                    </div>

                    {!isManualVendor ? (
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Select Supplier</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all appearance-none cursor-pointer font-bold"
                                    value={newPOSupplier}
                                    onChange={(e) => setNewPOSupplier(e.target.value)}
                                    title="Select Supplier"
                                >
                                    <option value="" className="text-stone-400">Choose from vendor directory...</option>
                                    {allSuppliers.map(s => <option key={s.id} value={s.id} className="text-stone-900 dark:text-white">{s.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Vendor Name</label>
                            <input
                                type="text"
                                placeholder="Enter external vendor name..."
                                className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all placeholder:text-stone-400 font-bold"
                                value={manualVendorName}
                                onChange={(e) => setManualVendorName(e.target.value)}
                            />
                        </div>
                    )}

                    {(newPOSupplier || manualVendorName) && (
                        <div className="flex items-start gap-2.5 text-[11px] text-[#2C5E3B] dark:text-[#A9CBA2] bg-emerald-50 dark:bg-[#2C5E3B]/20 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-950/30">
                            <Info size={14} className="mt-0.5 shrink-0" />
                            <p className="leading-relaxed">
                                Vendor selected. Standard procurement terms and default tax rules will apply.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Logistics Section */}
            <div className={cardBase}>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-900/30">
                            <MapPin size={16} />
                        </div>
                        <h3 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">Logistics & Receiving</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Destination Dropdown */}
                    <div className="space-y-1.5 relative" ref={siteDropdownRef}>
                        <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Receiving Destination</label>

                        <div
                            className={`w-full bg-[#FAF8F5] dark:bg-black/30 border rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white cursor-pointer flex justify-between items-center transition-all ${isSiteDropdownOpen ? 'border-[#2C5E3B]' : 'border-[#E2DCCE] dark:border-white/10'}`}
                            onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
                        >
                            <span className={destinationSiteIds.length === 0 ? 'text-stone-400 text-xs' : 'font-black text-[#1E3F27] dark:text-white'}>
                                {destinationSiteIds.length === 0
                                    ? 'Select receiving destination...'
                                    : `${destinationSiteIds.length} location(s) assigned`}
                            </span>
                            {isSiteDropdownOpen ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-stone-400" />}
                        </div>

                        {/* Dropdown Menu */}
                        {isSiteDropdownOpen && (
                            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl shadow-xl p-2 max-h-56 overflow-y-auto">
                                <div className="flex justify-between items-center px-2 py-1 border-b border-[#E2DCCE]/60 dark:border-white/5 mb-1.5">
                                    <span className="text-[10px] text-stone-400 font-bold uppercase">Available Warehouses</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const warehouseIds = sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center').map(s => s.id);
                                                setDestinationSiteIds(warehouseIds);
                                            }}
                                            className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black hover:underline cursor-pointer"
                                        >
                                            Select All
                                        </button>
                                        <span className="text-stone-300">|</span>
                                        <button
                                            type="button"
                                            onClick={() => setDestinationSiteIds([])}
                                            className="text-[10px] text-red-600 font-black hover:underline cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
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
                                        className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors ${destinationSiteIds.includes(s.id)
                                            ? 'bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] font-bold'
                                            : 'hover:bg-[#FAF8F5] dark:hover:bg-white/5 text-stone-600 dark:text-stone-300'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${destinationSiteIds.includes(s.id)
                                            ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white'
                                            : 'border-stone-300 dark:border-stone-600'
                                            }`}>
                                            {destinationSiteIds.includes(s.id) && <Check size={10} />}
                                        </div>
                                        <span className="text-xs">{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Tags */}
                        {destinationSiteIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {destinationSiteIds.map(id => {
                                    const site = sites.find(s => s.id === id);
                                    return (
                                        <span key={id} className="text-[10px] bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 text-[#2C5E3B] dark:text-[#A9CBA2] px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 font-bold">
                                            {site?.name}
                                            <X
                                                size={11}
                                                className="cursor-pointer hover:text-red-600"
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
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Expected Delivery</label>
                            <input
                                type="date"
                                className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-3.5 py-2 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold"
                                value={expectedDate}
                                onChange={(e) => setExpectedDate(e.target.value)}
                                title="Expected Delivery Date"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Order Priority</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-3.5 py-2 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none appearance-none font-bold cursor-pointer"
                                    value={poPriority}
                                    onChange={(e) => setPoPriority(e.target.value as any)}
                                    title="Priority"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Normal">Normal</option>
                                    <option value="High">High Priority</option>
                                    <option value="Urgent">Urgent (Critical)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
