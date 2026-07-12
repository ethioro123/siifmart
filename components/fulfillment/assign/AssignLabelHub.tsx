import React, { useState, useMemo } from 'react';
import { Printer, Package, MapPin, Layers, Layout, Info, Shield, Lock, BarChart3, Route, Boxes, CheckCircle } from 'lucide-react';
import { generateUnifiedBatchLabelsHTML } from '../../../utils/labels/ProductLabelGenerator';
import { generateLocationLabelHTML } from '../../../utils/labels/LocationLabelGenerator';
import { encodeLocation, extractSitePrefix } from '../../../utils/locationEncoder';
import { Product, WarehouseZone, Site } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { printHtmlContent } from '../../../utils/printHelper';

// Label size presets - Refined for WMS
const LABEL_SIZES = {
    TINY: { width: '1.25in', height: '0.5in', label: '1.25" x 0.5"' },
    SMALL: { width: '2in', height: '1in', label: '2" x 1"' },
    MEDIUM: { width: '3in', height: '2in', label: '3" x 2"' },
    LARGE: { width: '4in', height: '3in', label: '4" x 3"' },
    XL: { width: '4in', height: '6in', label: '4" x 6"' },
    BAY: { width: '4in', height: '2in', label: 'Bay Label' },
};

interface AssignLabelHubProps {
    filteredProducts: Product[];
    addNotification: (type: string, message: string) => void;
    t: (key: string) => string;
    zones: WarehouseZone[];
    onZoneUpdate: () => void;
    user: any;
    activeSite: Site;
}

export const AssignLabelHub: React.FC<AssignLabelHubProps> = ({
    filteredProducts,
    addNotification,
    t,
    zones,
    onZoneUpdate,
    user,
    activeSite
}) => {
    // Label Printing State
    const [labelFormat, setLabelFormat] = useState<'BARCODE' | 'QR'>('BARCODE');
    const [labelSize, setLabelSize] = useState<keyof typeof LABEL_SIZES>('MEDIUM');
    const [labelMode, setLabelMode] = useState<'PRODUCT' | 'BAY'>('PRODUCT');

    // Product Search State
    const [searchSku, setSearchSku] = useState('');
    const [printQty, setPrintQty] = useState(1);

    const matchedProduct = useMemo(() => {
        if (!searchSku.trim()) return null;
        const upperSearch = searchSku.toUpperCase();
        return filteredProducts.find(p =>
            p.sku?.toUpperCase() === upperSearch ||
            p.barcode?.toUpperCase() === upperSearch ||
            p.id === searchSku ||
            p.name?.toUpperCase().includes(upperSearch)
        ) || null;
    }, [searchSku, filteredProducts]);

    // Location config derived from site settings
    const maxAisles = activeSite?.aisleCount || 20;
    const maxBays = activeSite?.bayCount || 20;
    const zoneLetters = zones.length > 0
        ? zones.map(z => z.name)
        : Array.from({ length: activeSite?.zoneCount || 10 }, (_, i) => String.fromCharCode(65 + i));

    // Bay Config State — single location (zone/aisle/bay)
    const [bayConfig, setBayConfig] = useState({
        zone: zoneLetters[0] || 'A',
        aisle: '01',
        bay: '01'
    });

    const prefix = activeSite?.barcodePrefix || extractSitePrefix(activeSite?.code);

    // Helpers
    const getBarcode = (zone: string, aisle: string, bay: string) => {
        const humanLabel = `${zone}-${aisle.padStart(2, '0')}-${bay.padStart(2, '0')}`;
        return encodeLocation(humanLabel, prefix) || humanLabel;
    };

    const handlePrintLocation = async () => {
        const aislePad = bayConfig.aisle.padStart(2, '0');
        const bayPad = bayConfig.bay.padStart(2, '0');
        const humanLabel = `${bayConfig.zone}-${aislePad}-${bayPad}`;
        const barcode = getBarcode(bayConfig.zone, bayConfig.aisle, bayConfig.bay);

        const labelHTML = await generateLocationLabelHTML([{
            humanLabel,
            barcode,
            zone: bayConfig.zone,
            aisle: aislePad,
            bay: bayPad,
            siteName: activeSite?.name,
            siteCode: activeSite?.code
        }], {
            size: labelSize,
            format: labelFormat === 'QR' ? 'QR' : 'Barcode'
        });

        let printHTML = labelHTML;
        const scriptTag = '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>';
        if (printHTML.includes('</body>')) {
            printHTML = printHTML.replace('</body>', `${scriptTag}</body>`);
        } else {
            printHTML += scriptTag;
        }

        printHtmlContent(printHTML);
        addNotification('success', `Location label ${humanLabel} ready!`);
    };    return (
        <div className="pb-12">
            {/* LEFT PANEL: PRINTING HUB */}
            <div className="glass-panel overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C5E3B]/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-3 transition-colors">
                                <div className="p-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 rounded-lg">
                                    <Printer size={24} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                </div>
                                Label Printing Hub
                            </h3>
                            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1 ml-11 transition-colors">Management & Identity Systems</p>
                        </div>
                        <div className="flex bg-stone-100 dark:bg-black/40 p-1 rounded-xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] transition-colors">
                            <button
                                onClick={() => { setLabelMode('PRODUCT'); setLabelSize('MEDIUM'); }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${labelMode === 'PRODUCT' ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2] text-white dark:text-[#18201B] shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'}`}
                            >
                                <Package size={14} className="inline mr-2" /> Products
                            </button>
                            <button
                                onClick={() => { setLabelMode('BAY'); setLabelSize('MEDIUM'); }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${labelMode === 'BAY' ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2] text-white dark:text-[#18201B] shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-white'}`}
                            >
                                <Layout size={14} className="inline mr-2" /> Bays
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Format & Size Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 dark:text-stone-500 flex items-center gap-2 transition-colors">
                                    <Layers size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Format
                                </label>
                                <div className="flex bg-stone-100 dark:bg-black/30 p-1 rounded-xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] transition-colors">
                                    <button
                                        onClick={() => setLabelFormat('BARCODE')}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-tighter transition-all ${labelFormat === 'BARCODE' ? 'bg-white dark:bg-white/10 text-stone-900 dark:text-white border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/20 shadow-sm' : 'text-stone-550 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-300'}`}
                                    >
                                        BARCODE
                                    </button>
                                    <button
                                        onClick={() => setLabelFormat('QR')}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-tighter transition-all ${labelFormat === 'QR' ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20' : 'text-stone-550 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-300'}`}
                                    >
                                        QR CODE
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 dark:text-stone-500 flex items-center gap-2 transition-colors">
                                    <Layout size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Size
                                </label>
                                <select
                                    title="Label Size"
                                    className="w-full bg-stone-50/50 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] rounded-xl px-4 py-2.5 text-stone-900 dark:text-white text-xs font-bold outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-all appearance-none cursor-pointer"
                                    value={labelSize}
                                    onChange={(e) => setLabelSize(e.target.value as any)}
                                >
                                    {Object.entries(LABEL_SIZES).map(([key, val]) => (
                                        <option key={key} value={key} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">{val.label} ({key})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {labelMode === 'BAY' ? (
                            /* BAY LOGIC — Location Label Printing */
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
                                {/* Zone / Aisle / Bay selectors */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-stone-500 dark:text-stone-500 mb-1.5 block transition-colors">Zone ({zoneLetters[0]}–{zoneLetters[zoneLetters.length - 1]})</label>
                                        <select
                                            title="Zone"
                                            className="w-full bg-stone-50/50 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] rounded-xl p-3 text-stone-900 dark:text-white text-sm font-black outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-all"
                                            value={bayConfig.zone}
                                            onChange={(e) => setBayConfig({ ...bayConfig, zone: e.target.value })}
                                        >
                                            {zoneLetters.map(z => <option key={z} value={z}>{z}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-stone-500 dark:text-stone-500 mb-1.5 block transition-colors">Aisle (1–{maxAisles})</label>
                                        <select
                                            title="Aisle"
                                            className="w-full bg-stone-50/50 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] rounded-xl p-3 text-stone-900 dark:text-white text-sm font-black outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-all animate-none"
                                            value={bayConfig.aisle}
                                            onChange={(e) => setBayConfig({ ...bayConfig, aisle: e.target.value })}
                                        >
                                            {Array.from({ length: maxAisles }, (_, i) => {
                                                const val = (i + 1).toString().padStart(2, '0');
                                                return <option key={val} value={val}>{val}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-stone-500 dark:text-stone-500 mb-1.5 block transition-colors">Bay (1–{maxBays})</label>
                                        <select
                                            title="Bay"
                                            className="w-full bg-stone-50/50 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] rounded-xl p-3 text-stone-900 dark:text-white text-sm font-black outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-all"
                                            value={bayConfig.bay}
                                            onChange={(e) => setBayConfig({ ...bayConfig, bay: e.target.value })}
                                        >
                                            {Array.from({ length: maxBays }, (_, i) => {
                                                const val = (i + 1).toString().padStart(2, '0');
                                                return <option key={val} value={val}>{val}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                {/* LIVE PREVIEW */}
                                <div className="bg-stone-950 dark:bg-black/40 rounded-2xl border border-[#E2DCCE]/25 dark:border-[#A9CBA2]/[0.04] p-5 relative overflow-hidden group/preview hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/20 transition-all">
                                    <div className="absolute top-0 right-0 p-3 flex gap-2">
                                        <div className="text-[8px] bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] px-2 py-0.5 rounded border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 font-black tracking-widest uppercase">15-DIGIT PROTOCOL</div>
                                    </div>
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2C5E3B]/30 dark:via-[#A9CBA2]/30 to-transparent" />

                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <div className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black mb-2 flex items-center gap-2 transition-colors">
                                                Live Preview
                                                <div className="text-[8px] text-[#2C5E3B] dark:text-[#A9CBA2] animate-pulse">● LIVE</div>
                                            </div>
                                            {/* Large Location Label Preview */}
                                            <div className="text-3xl font-black text-[#2C5E3B] dark:text-[#A9CBA2] tracking-[6px] mb-2">
                                                {bayConfig.zone}-{bayConfig.aisle.padStart(2, '0')}-{bayConfig.bay.padStart(2, '0')}
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px]">
                                                <span className="text-stone-500 dark:text-stone-400 transition-colors">ZONE <span className="text-stone-300 dark:text-stone-450 font-black transition-colors">{bayConfig.zone}</span></span>
                                                <span className="text-stone-700 transition-colors">|</span>
                                                <span className="text-stone-500 dark:text-stone-400 transition-colors">AISLE <span className="text-stone-300 dark:text-stone-450 font-black transition-colors">{bayConfig.aisle.padStart(2, '0')}</span></span>
                                                <span className="text-stone-700 transition-colors">|</span>
                                                <span className="text-stone-500 dark:text-stone-400 transition-colors">BAY <span className="text-stone-300 dark:text-stone-450 font-black transition-colors">{bayConfig.bay.padStart(2, '0')}</span></span>
                                            </div>
                                            <div className="mt-2 text-xs font-mono text-stone-400 dark:text-stone-500 tracking-widest transition-colors">
                                                {getBarcode(bayConfig.zone, bayConfig.aisle, bayConfig.bay)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GENERATE BUTTON */}
                                <button
                                    onClick={handlePrintLocation}
                                    className="woody-btn-primary w-full py-4 text-white dark:text-[#18201B] font-black text-sm rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <Printer size={18} />
                                    GENERATE LOCATION LABEL
                                </button>
                            </div>
                        ) : (
                            /* PRODUCT LOGIC */
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
                                <div className="relative">
                                    <input
                                        title="Product SKU"
                                        className="woody-input w-full rounded-2xl p-4 pl-12 text-sm focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                        placeholder="Search Product Name or Scan SKU..."
                                        value={searchSku}
                                        onChange={(e) => setSearchSku(e.target.value)}
                                    />
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-600 transition-colors" size={20} />
                                    {matchedProduct && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[#2C5E3B] dark:text-[#A9CBA2]">
                                            <CheckCircle size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Matched</span>
                                        </div>
                                    )}
                                </div>

                                {/* Matched Product Summary */}
                                {searchSku.trim() && (
                                    <div className={`p-4 rounded-2xl border transition-all ${matchedProduct ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/10 border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 shadow-sm' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className={`text-sm font-black mb-1 transition-colors ${matchedProduct ? 'text-stone-900 dark:text-white' : 'text-amber-700 dark:text-amber-400'}`}>
                                                    {matchedProduct ? matchedProduct.name : 'Unknown Product / Manual Entry'}
                                                </h4>
                                                <div className="flex gap-3 text-[10px] font-mono tracking-wider transition-colors">
                                                    <span className="text-stone-500 dark:text-stone-400">SKU: <span className="text-stone-900 dark:text-white font-bold transition-colors">{matchedProduct ? matchedProduct.sku : searchSku}</span></span>
                                                    {matchedProduct?.price && (
                                                        <span className="text-stone-500 dark:text-stone-400">Price: <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-bold transition-colors">${matchedProduct.price.toFixed(2)}</span></span>
                                                    )}
                                                </div>
                                            </div>
                                            {matchedProduct?.category && (
                                                <span className="px-2 py-1 bg-stone-100 dark:bg-black/30 rounded border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] text-[9px] text-stone-500 dark:text-stone-455 font-black uppercase tracking-widest transition-colors">
                                                    {matchedProduct.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="w-1/3 flex flex-col justify-center bg-stone-50/50 dark:bg-[#1C2620]/30 rounded-2xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] relative overflow-hidden group transition-colors">
                                        <div className="absolute top-2 left-0 right-0 text-center text-[9px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest transition-colors">PRINT QTY</div>
                                        <div className="flex items-center justify-between px-2 pt-6 pb-2">
                                            <button
                                                onClick={() => setPrintQty(Math.max(1, printQty - 1))}
                                                className="w-10 h-10 flex items-center justify-center text-stone-400 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-[#EAE5D9]/10 rounded-xl transition-all font-black text-xl"
                                            >-</button>
                                            <input
                                                title="Quantity"
                                                className="w-16 bg-transparent text-center text-stone-900 dark:text-white text-2xl font-black outline-none font-mono transition-colors"
                                                value={printQty}
                                                onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))}
                                            />
                                            <button
                                                onClick={() => setPrintQty(printQty + 1)}
                                                className="w-10 h-10 flex items-center justify-center text-stone-400 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-[#EAE5D9]/10 rounded-xl transition-all font-black text-xl"
                                            >+</button>
                                        </div>
                                    </div>
                                    <button
                                        disabled={!searchSku.trim()}
                                        onClick={async () => {
                                            const labelHTML = await generateUnifiedBatchLabelsHTML([{
                                                value: matchedProduct?.sku || searchSku.trim(),
                                                label: matchedProduct?.name || 'Manual Product Entry',
                                                quantity: printQty,
                                                price: matchedProduct?.price?.toString(),
                                                category: matchedProduct?.category
                                            }], {
                                                size: labelSize,
                                                format: labelFormat === 'QR' ? 'QR' : 'Barcode',
                                                showPrice: true,
                                                showCategory: true
                                            });

                                            let printHTML = labelHTML;
                                            const scriptTag = '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>';
                                            if (printHTML.includes('</body>')) {
                                                printHTML = printHTML.replace('</body>', `${scriptTag}</body>`);
                                            } else {
                                                printHTML += scriptTag;
                                            }

                                            printHtmlContent(printHTML);
                                            addNotification('success', `${printQty} Product label${printQty > 1 ? 's' : ''} ready!`);
                                        }}
                                        className={`flex-1 py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-3 ${searchSku.trim()
                                            ? 'woody-btn-primary text-white dark:text-[#18201B] hover:scale-[1.02] active:scale-[0.98]'
                                            : 'bg-stone-100 dark:bg-[#1C2620]/30 text-stone-400 dark:text-stone-600 cursor-not-allowed border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04]'
                                            }`}
                                    >
                                        <Printer size={20} />
                                        PRINT PRODUCT {labelFormat === 'QR' ? 'QR' : 'BARCODE'}
                                    </button>
                                </div>

                                <div className="p-4 bg-stone-50/30 dark:bg-[#1C2620]/20 rounded-2xl border border-dashed border-[#E2DCCE]/50 dark:border-[#A9CBA2]/20 flex items-center gap-4 transition-colors">
                                    <div className="p-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-lg transition-colors">
                                        <Info size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                    </div>
                                    <p className="text-[10px] text-stone-500 dark:text-stone-500 leading-relaxed transition-colors">
                                        <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-bold uppercase mr-1">TIPS:</span>
                                        Labels include price and category by default. For inventory tracking, use barcodes for faster scanning.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ZONE OPERATIONS MANAGER — COMING SOON */}
            <div className="mt-6 glass-panel border-dashed border-[#E2DCCE]/50 dark:border-[#A9CBA2]/20 overflow-hidden relative group hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-[#2C5E3B]/3 via-transparent to-[#A9CBA2]/3 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 rounded-2xl relative transition-colors">
                                <div className="absolute inset-0 bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/10 blur-xl rounded-2xl" />
                                <Shield size={28} className="text-[#2C5E3B] dark:text-[#A9CBA2] relative" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-stone-900 dark:text-white tracking-tight uppercase flex items-center gap-3 transition-colors">
                                    Zone Operations Manager
                                    <span className="text-[9px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-500/30 font-black uppercase tracking-widest animate-pulse transition-colors">
                                        Coming Soon
                                    </span>
                                </h3>
                                <p className="text-[11px] text-stone-500 dark:text-stone-500 mt-0.5 transition-colors">Advanced warehouse zone control & optimization — launching mid-2026</p>
                            </div>
                        </div>
                    </div>

                    {/* Feature Roadmap Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            {
                                icon: <Lock size={20} />,
                                title: 'Zone Lock / Unlock',
                                desc: 'Lock zones for maintenance, restocking, or hazard containment. Locked zones block all pick, pack, and putaway job assignments automatically.',
                                color: 'red'
                            },
                            {
                                icon: <Boxes size={20} />,
                                title: 'Capacity Controls',
                                desc: 'Set max bay capacity per zone, monitor live occupancy rates, and trigger overflow alerts when zones approach full capacity.',
                                color: 'blue'
                            },
                            {
                                icon: <Route size={20} />,
                                title: 'Movement Rules',
                                desc: 'Define zone-to-zone transfer rules, priority pathways, and sequence optimizations for faster pick walks and reduced travel time.',
                                color: 'purple'
                            },
                            {
                                icon: <BarChart3 size={20} />,
                                title: 'Real-Time Analytics',
                                desc: 'Live dashboards for zone throughput, worker density heatmaps, bottleneck detection, and historical performance comparisons.',
                                color: 'green'
                            }
                        ].map((feature, i) => (
                            <div
                                key={feature.title}
                                className="p-5 rounded-2xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] bg-[#1C2620]/10 dark:bg-black/20 hover:bg-stone-100/50 dark:hover:bg-[#EAE5D9]/10 transition-all group/card shadow-sm hover:shadow-md dark:shadow-none transition-colors duration-300"
                            >
                                <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${feature.color === 'red' ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                                    feature.color === 'blue' ? 'bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2]' :
                                        feature.color === 'purple' ? 'bg-[#EAE5D9] dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2]' :
                                            'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                                    }`}>
                                    {feature.icon}
                                </div>
                                <h4 className="text-sm font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tight transition-colors">{feature.title}</h4>
                                <p className="text-[10px] text-stone-500 dark:text-stone-500 leading-relaxed transition-colors">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                                <div className="w-2 h-2 rounded-full bg-[#2C5E3B]/40 dark:bg-[#A9CBA2]/40 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-amber-400/40 animate-pulse animation-delay-300" />
                                <div className="w-2 h-2 rounded-full bg-[#A9CBA2]/40 animate-pulse animation-delay-600" />
                            </div>
                            <span className="text-[9px] text-stone-400 dark:text-stone-600 font-bold uppercase tracking-widest transition-colors">Under Active Development</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-stone-100/50 dark:bg-black/20 rounded-full border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] text-[9px] text-stone-500 dark:text-stone-500 font-bold uppercase tracking-widest transition-colors">
                                {zones.length} Zone{zones.length !== 1 ? 's' : ''} Configured
                            </div>
                            <div className="px-3 py-1 bg-amber-100 dark:bg-amber-500/10 rounded-full border border-amber-200 dark:border-amber-500/20 text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest transition-colors">
                                ETA: Mid 2026
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
