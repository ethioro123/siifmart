import React, { useRef, useEffect } from 'react';
import { Supplier, Site } from '../../types';
import { Truck, MapPin, ChevronDown, ChevronUp, Check, Info, X } from 'lucide-react';
import { logger } from '../../utils/logger';
import { formatDisplaySiteId } from '../../utils/siteIdGenerator';

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

    const cardBase = "bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-sm";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier Section */}
            <div className={cardBase}>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--theme-border-subtle)]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                            <Truck size={16} />
                        </div>
                        <h3 className="text-xs font-black text-[var(--theme-text-primary)] uppercase tracking-wider">Supplier Information</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Toggle Supplier Type */}
                    <div className="flex bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={() => setIsManualVendor(false)}
                            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${!isManualVendor ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'}`}
                        >
                            REGISTERED VENDOR
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsManualVendor(true)}
                            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${isManualVendor ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'}`}
                        >
                            ONE-OFF / EXTERNAL
                        </button>
                    </div>

                    {!isManualVendor ? (
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider block">Select Supplier</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all appearance-none cursor-pointer font-bold"
                                    value={newPOSupplier}
                                    onChange={(e) => setNewPOSupplier(e.target.value)}
                                    title="Select Supplier"
                                >
                                    <option value="" className="text-[var(--theme-text-muted)]">Choose from vendor directory...</option>
                                    {allSuppliers.map(s => <option key={s.id} value={s.id} className="text-[var(--theme-text-primary)] bg-[var(--theme-bg-panel)]">{s.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider block">Vendor Name</label>
                            <input
                                type="text"
                                placeholder="Enter external vendor name..."
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-muted)] font-bold"
                                value={manualVendorName}
                                onChange={(e) => setManualVendorName(e.target.value)}
                            />
                        </div>
                    )}

                    {(newPOSupplier || manualVendorName) && (
                        <div className="flex items-start gap-2.5 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
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
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--theme-border-subtle)]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-500/20">
                            <MapPin size={16} />
                        </div>
                        <h3 className="text-xs font-black text-[var(--theme-text-primary)] uppercase tracking-wider">Logistics & Receiving</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Destination Dropdown */}
                    <div className="space-y-1.5 relative" ref={siteDropdownRef}>
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider block">
                                Receiving Facility <span className="text-amber-600 dark:text-amber-400 font-bold">(Warehouse / DC Only)</span>
                            </label>
                            <span className="text-[9px] text-[var(--theme-text-muted)] italic">No direct store delivery</span>
                        </div>

                        <div
                            className={`w-full bg-[var(--theme-bg-subtle)] border rounded-xl px-4 py-2.5 text-xs text-[var(--theme-text-primary)] cursor-pointer flex justify-between items-center transition-all ${isSiteDropdownOpen ? 'border-[var(--theme-accent)]' : 'border-[var(--theme-border)]'}`}
                            onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
                        >
                            <span className={destinationSiteIds.length === 0 ? 'text-[var(--theme-text-muted)] text-xs' : 'font-black text-[var(--theme-text-primary)]'}>
                                {destinationSiteIds.length === 0
                                    ? 'Select receiving Warehouse or DC...'
                                    : `${destinationSiteIds.length} storage hub(s) assigned`}
                            </span>
                            {isSiteDropdownOpen ? <ChevronUp size={14} className="text-[var(--theme-accent)]" /> : <ChevronDown size={14} className="text-[var(--theme-text-muted)]" />}
                        </div>

                        {/* Dropdown Menu */}
                        {isSiteDropdownOpen && (
                            <div className="absolute z-50 w-full mt-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl shadow-xl p-2 max-h-56 overflow-y-auto">
                                <div className="flex justify-between items-center px-2 py-1 border-b border-[var(--theme-border-subtle)] mb-1.5">
                                    <span className="text-[10px] text-[var(--theme-text-muted)] font-bold uppercase">
                                        Storage Hubs & DCs {sites.length > 0 && `(${sites[0]?.country === 'KE' ? 'Kenya Hub' : 'Ethiopia HQ'})`}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const receivingIds = sites
                                                    .filter(s => (s.type === 'Warehouse' || s.type === 'Distribution Center') && s.status !== 'Closed')
                                                    .map(s => s.id);
                                                setDestinationSiteIds(receivingIds);
                                            }}
                                            className="text-[10px] text-[var(--theme-accent)] font-black hover:underline cursor-pointer"
                                        >
                                            Select All Hubs
                                        </button>
                                        <span className="text-[var(--theme-text-muted)]">|</span>
                                        <button
                                            type="button"
                                            onClick={() => setDestinationSiteIds([])}
                                            className="text-[10px] text-red-500 font-black hover:underline cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                {sites.filter(s => (s.type === 'Warehouse' || s.type === 'Distribution Center') && s.status !== 'Closed').map(s => (
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
                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                                            : 'hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${destinationSiteIds.includes(s.id)
                                            ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-[var(--theme-primary-text)]'
                                            : 'border-[var(--theme-border)]'
                                            }`}>
                                            {destinationSiteIds.includes(s.id) && <Check size={10} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold truncate">{s.name}</span>
                                                <span className="text-[9px] px-1 py-0.5 rounded font-mono font-bold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                    {s.type === 'Distribution Center' ? 'DC' : 'Warehouse'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[var(--theme-text-muted)] font-mono mt-0.5">
                                                {formatDisplaySiteId(s)} • {s.address || 'Central Storage'}
                                            </p>
                                        </div>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${s.country === 'KE' ? 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20' : 'text-sky-600 bg-sky-500/10 border border-sky-500/20'}`}>
                                            {s.country === 'KE' ? 'KE' : 'ET'}
                                        </span>
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
                                        <span key={id} className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 font-bold">
                                            <span className="font-mono">{formatDisplaySiteId(site)}</span>
                                            <span className="truncate max-w-[120px]">{site?.name}</span>
                                            <span className="text-[8px] uppercase font-bold text-amber-700 dark:text-amber-400">[{site?.type === 'Distribution Center' ? 'DC' : 'WH'}]</span>
                                            <X
                                                size={11}
                                                className="cursor-pointer hover:text-red-500"
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
                            <label className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider block">Expected Delivery</label>
                            <input
                                type="date"
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none font-bold"
                                value={expectedDate}
                                onChange={(e) => setExpectedDate(e.target.value)}
                                title="Expected Delivery Date"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider block">Order Priority</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-bold cursor-pointer"
                                    value={poPriority}
                                    onChange={(e) => setPoPriority(e.target.value as any)}
                                    title="Priority"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Normal">Normal</option>
                                    <option value="High">High Priority</option>
                                    <option value="Urgent">Urgent (Critical)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
