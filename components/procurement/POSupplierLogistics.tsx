import React, { useRef, useEffect } from 'react';
import { Supplier, Site } from '../../types';
import { Truck, MapPin, ChevronDown, ChevronUp, Check, Info, AlertTriangle, X, Layers } from 'lucide-react';
import { formatDisplaySiteId } from '../../utils/siteIdGenerator';
import { getPOReceivingRegionLabel } from '../../utils/poReceivingSelection';

interface POSupplierLogisticsProps {
    poDelivery: { tempReq: 'Ambient' | 'Chilled' | 'Frozen'; shelfLife: string; dockSlot: string };
    setPoDelivery: React.Dispatch<React.SetStateAction<POSupplierLogisticsProps['poDelivery']>>;
    // Supplier State
    isManualVendor: boolean;
    setIsManualVendor: (val: boolean) => void;
    newPOSupplier: string;
    setNewPOSupplier: (val: string) => void;
    manualVendorName: string;
    setManualVendorName: (val: string) => void;
    allSuppliers: Supplier[];

    // Logistics State
    assignedRegionCode?: string | null;
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
    isEditMode?: boolean;
}

export const POSupplierLogistics: React.FC<POSupplierLogisticsProps> = ({
    poDelivery, setPoDelivery,
    isManualVendor, setIsManualVendor,
    newPOSupplier, setNewPOSupplier,
    manualVendorName, setManualVendorName,
    allSuppliers,
    assignedRegionCode, destinationSiteIds, setDestinationSiteIds,
    isSiteDropdownOpen, setIsSiteDropdownOpen,
    sites,
    quantityDistribution, setQuantityDistribution,
    expectedDate, setExpectedDate,
    poPriority, setPoPriority,
    isEditMode = false
}) => {
    const siteDropdownRef = useRef<HTMLDivElement>(null);
    const receivingRegionLabel = getPOReceivingRegionLabel(sites, assignedRegionCode);
    const todayIso = new Date().toISOString().split('T')[0];

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

    const selectedSupplier = allSuppliers.find(s => s.id === newPOSupplier);
    const isUnverifiedVendor = isManualVendor || (Boolean(newPOSupplier) && selectedSupplier?.verificationStatus !== 'verified');

    const handleSupplierSelect = (supplierId: string) => {
        setNewPOSupplier(supplierId);
        if (!supplierId) return;
        const matched = allSuppliers.find(s => s.id === supplierId);
        if (matched && !expectedDate && typeof matched.leadTime === 'number' && matched.leadTime > 0) {
            const target = new Date();
            target.setDate(target.getDate() + matched.leadTime);
            setExpectedDate(target.toISOString().split('T')[0]);
        }
    };

    const cardBase = "bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 shadow-sm transition-all";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier Section */}
            <div className={cardBase}>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--theme-border-subtle)]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Truck size={16} />
                        </div>
                        <h3 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">Supplier Information</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Toggle Supplier Type */}
                    <div className="flex bg-[var(--theme-bg-subtle)] p-1 rounded-full border border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={() => setIsManualVendor(false)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${!isManualVendor ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                        >
                            REGISTERED VENDOR
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsManualVendor(true)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${isManualVendor ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                        >
                            ONE-OFF / EXTERNAL
                        </button>
                    </div>

                    {!isManualVendor ? (
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider block ml-1">Select Supplier</label>
                            <div className="relative">
                                <select
                                    className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl px-4 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all appearance-none cursor-pointer font-semibold"
                                    value={newPOSupplier}
                                    onChange={(e) => handleSupplierSelect(e.target.value)}
                                    title="Select Supplier"
                                >
                                    <option value="" className="text-[var(--theme-text-secondary)] bg-[var(--theme-bg-panel)]">Choose from vendor directory...</option>
                                    {allSuppliers.map(s => (
                                        <option key={s.id} value={s.id} className="text-[var(--theme-text-primary)] bg-[var(--theme-bg-panel)] font-medium">
                                            {s.name}{s.verificationStatus !== 'verified' ? ' (pending verification)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider block ml-1">Vendor Name</label>
                            <input
                                type="text"
                                placeholder="Enter external vendor name..."
                                className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl px-4 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-muted)] font-semibold"
                                value={manualVendorName}
                                onChange={(e) => setManualVendorName(e.target.value)}
                            />
                        </div>
                    )}

                    {(newPOSupplier || manualVendorName) && (
                        <div className={`flex items-start gap-2.5 text-[11px] p-3 rounded-xl border ${
                            isUnverifiedVendor
                                ? 'text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/30'
                                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                            {isUnverifiedVendor ? (
                                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            ) : (
                                <Info size={14} className="mt-0.5 shrink-0" />
                            )}
                            <div className="leading-relaxed font-medium">
                                <p>
                                    {isUnverifiedVendor
                                        ? 'Verification Pending: This supplier must be verified by a separate procurement lead before the order can be approved.'
                                        : 'Verified vendor selected. Standard procurement terms and default tax rules will apply.'}
                                </p>
                                {!isManualVendor && selectedSupplier && (
                                    <p className="text-[10px] opacity-80 mt-0.5 font-mono">
                                        {selectedSupplier.category ? `Category: ${selectedSupplier.category}` : ''}
                                        {typeof selectedSupplier.leadTime === 'number' && selectedSupplier.leadTime > 0
                                            ? `${selectedSupplier.category ? ' • ' : ''}Lead time: ${selectedSupplier.leadTime}d`
                                            : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Logistics Section */}
            <div className={cardBase}>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--theme-border-subtle)]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <MapPin size={16} />
                        </div>
                        <h3 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">Logistics & Receiving</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Destination Dropdown */}
                    <div className="space-y-1.5 relative" ref={siteDropdownRef}>
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider block">
                                Receiving Facility <span className="text-amber-600 dark:text-amber-400 font-bold">(Warehouse / DC Only)</span>
                            </label>
                            <span className="text-[9px] text-[var(--theme-text-secondary)] italic font-medium">
                                {isEditMode ? 'Locked on existing PO' : 'No direct store delivery'}
                            </span>
                        </div>

                        <div
                            className={`w-full h-11 bg-[var(--theme-bg-subtle)] border rounded-2xl px-4 text-xs text-[var(--theme-text-primary)] flex justify-between items-center transition-all ${
                                isEditMode ? 'opacity-75 cursor-not-allowed border-[var(--theme-border)]' : isSiteDropdownOpen ? 'border-[var(--theme-accent)] cursor-pointer' : 'border-[var(--theme-border)] cursor-pointer'
                            }`}
                            onClick={() => { if (!isEditMode) setIsSiteDropdownOpen(!isSiteDropdownOpen); }}
                        >
                            <span className={destinationSiteIds.length === 0 ? 'text-[var(--theme-text-secondary)] text-xs font-medium' : 'font-bold text-[var(--theme-text-primary)]'}>
                                {destinationSiteIds.length === 0
                                    ? 'Select receiving Warehouse or DC...'
                                    : `${destinationSiteIds.length} storage hub(s) assigned`}
                            </span>
                            {!isEditMode && (isSiteDropdownOpen ? <ChevronUp size={14} className="text-[var(--theme-accent)]" /> : <ChevronDown size={14} className="text-[var(--theme-text-secondary)]" />)}
                        </div>

                        {/* Dropdown Menu */}
                        {isSiteDropdownOpen && !isEditMode && (
                            <div className="absolute z-50 w-full mt-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl shadow-xl p-2 max-h-56 overflow-y-auto">
                                <div className="flex justify-between items-center px-2 py-1 border-b border-[var(--theme-border-subtle)] mb-1.5">
                                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase">
                                        Storage Hubs & DCs {receivingRegionLabel && `(${receivingRegionLabel})`}
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
                                            className="text-[10px] text-[var(--theme-accent)] font-bold hover:underline cursor-pointer"
                                        >
                                            Select All Hubs
                                        </button>
                                        <span className="text-[var(--theme-text-secondary)]">|</span>
                                        <button
                                            type="button"
                                            onClick={() => setDestinationSiteIds([])}
                                            className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                {sites.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-[var(--theme-text-secondary)]">
                                        No active Warehouses or Distribution Centers available in your authorized scope.
                                    </div>
                                ) : (
                                    sites.map(s => (
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
                                                ? 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 font-bold border border-emerald-500/30'
                                                : 'hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-transparent'
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
                                                    <span className="text-xs font-bold text-[var(--theme-text-primary)] truncate">{s.name}</span>
                                                    <span className="text-[9px] px-1 py-0.5 rounded font-mono font-bold uppercase bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                                                        {s.type === 'Distribution Center' ? 'DC' : 'Warehouse'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono mt-0.5">
                                                    <span className="font-bold text-[var(--theme-text-primary)]">{formatDisplaySiteId(s)}</span> • {s.address || 'Central Storage'}
                                                </p>
                                            </div>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${s.country === 'KE' ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/20 border border-emerald-500/30' : 'text-sky-800 dark:text-sky-300 bg-sky-500/20 border border-sky-500/30'}`}>
                                                {s.country === 'KE' ? 'KE' : 'ET'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Selected Tags */}
                        {destinationSiteIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1.5">
                                {destinationSiteIds.map(id => {
                                    const site = sites.find(s => s.id === id);
                                    return (
                                        <span key={id} className="text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-950 dark:text-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-2 font-bold shadow-sm backdrop-blur-sm">
                                            <span className="font-mono text-emerald-950 dark:text-emerald-200 font-bold">{formatDisplaySiteId(site)}</span>
                                            <span className="truncate max-w-[140px] text-[var(--theme-text-primary)] font-bold">{site?.name}</span>
                                            <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-950 dark:text-amber-200 border border-amber-500/40">
                                                [{site?.type === 'Distribution Center' ? 'DC' : 'WH'}]
                                            </span>
                                            {!isEditMode && (
                                                <X
                                                    size={13}
                                                    className="cursor-pointer text-[var(--theme-text-secondary)] hover:text-red-500 dark:hover:text-red-400 transition-colors ml-0.5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDestinationSiteIds(prev => prev.filter(sid => sid !== id));
                                                    }}
                                                />
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Multi-Warehouse Quantity Allocation Toggle */}
                        {destinationSiteIds.length > 1 && !isEditMode && (
                            <div className="mt-2 p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-primary)] flex items-center gap-1.5">
                                        <Layers size={12} className="text-[var(--theme-accent)]" />
                                        Multi-Hub Quantity Allocation ({destinationSiteIds.length} Hubs)
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuantityDistribution('per-store')}
                                        className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border text-left ${
                                            quantityDistribution === 'per-store'
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm'
                                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <div>Full Qty Per Hub</div>
                                        <div className="text-[9px] font-normal opacity-80">Each hub gets 100% of line qty</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuantityDistribution('split')}
                                        className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border text-left ${
                                            quantityDistribution === 'split'
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm'
                                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <div>Split Across Hubs</div>
                                        <div className="text-[9px] font-normal opacity-80">Divide total qty & shipping</div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Date & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider block ml-1">Expected Delivery</label>
                            <input
                                type="date"
                                min={isEditMode ? undefined : todayIso}
                                className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none font-semibold"
                                value={expectedDate}
                                onChange={(e) => setExpectedDate(e.target.value)}
                                title="Expected Delivery Date"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider block ml-1">Order Priority</label>
                            <div className="relative">
                                <select
                                    className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer"
                                    value={poPriority}
                                    onChange={(e) => setPoPriority(e.target.value as any)}
                                    title="Priority"
                                >
                                    <option value="Low" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)] font-medium">Low</option>
                                    <option value="Normal" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)] font-medium">Normal</option>
                                    <option value="High" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)] font-medium">High Priority</option>
                                    <option value="Urgent" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)] font-medium">Urgent (Critical)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider block ml-1">Required temperature</label>
                            <select
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none"
                                value={poDelivery.tempReq}
                                onChange={e => setPoDelivery(prev => ({ ...prev, tempReq: e.target.value as typeof prev.tempReq }))}
                            >
                                <option value="Ambient">Ambient</option>
                                <option value="Chilled">Chilled</option>
                                <option value="Frozen">Frozen</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider block ml-1">Minimum shelf life</label>
                            <input
                                type="text"
                                placeholder="e.g. 180 days"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none"
                                value={poDelivery.shelfLife}
                                onChange={e => setPoDelivery(prev => ({ ...prev, shelfLife: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[var(--theme-text-primary)] uppercase font-semibold tracking-wider block ml-1">Dock slot</label>
                            <select
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none"
                                value={poDelivery.dockSlot}
                                onChange={e => setPoDelivery(prev => ({ ...prev, dockSlot: e.target.value }))}
                                title="Inbound Dock Slot"
                            >
                                <option value="">Assign on arrival</option>
                                <option value="D1">Dock D1</option>
                                <option value="D2">Dock D2</option>
                                <option value="D3">Dock D3</option>
                                <option value="D4">Dock D4</option>
                                <option value="D5">Dock D5</option>
                                <option value="D6">Dock D6</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
