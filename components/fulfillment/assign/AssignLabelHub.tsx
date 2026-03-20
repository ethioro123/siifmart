import React, { useState, useMemo } from 'react';
import { Printer, Package, MapPin, Layers, Layout, Info, Shield, Lock, BarChart3, Route, Boxes, CheckCircle } from 'lucide-react';
import { generateUnifiedBatchLabelsHTML } from '../../../utils/labels/ProductLabelGenerator';
import { generateLocationLabelHTML } from '../../../utils/labels/LocationLabelGenerator';
import { encodeLocation, extractSitePrefix } from '../../../utils/locationEncoder';
import { Product, WarehouseZone, Site } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';

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

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(labelHTML);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
            addNotification('success', `Location label ${humanLabel} ready!`);
        }
    };

    return (
        <div className="pb-12">
            {/* LEFT PANEL: PRINTING HUB */}
            <div className="bg-cyber-gray border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <div className="p-2 bg-cyber-primary/20 rounded-lg">
                                    <Printer size={24} className="text-cyber-primary" />
                                </div>
                                Label Printing Hub
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 ml-11">Management & Identity Systems</p>
                        </div>
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setLabelMode('PRODUCT')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${labelMode === 'PRODUCT' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Package size={14} className="inline mr-2" /> Products
                            </button>
                            <button
                                onClick={() => setLabelMode('BAY')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${labelMode === 'BAY' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Layout size={14} className="inline mr-2" /> Bays
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Format & Size Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center gap-2">
                                    <Layers size={12} className="text-cyber-primary" /> Format
                                </label>
                                <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setLabelFormat('BARCODE')}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-tighter transition-all ${labelFormat === 'BARCODE' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-600 hover:text-gray-400'}`}
                                    >
                                        BARCODE
                                    </button>
                                    <button
                                        onClick={() => setLabelFormat('QR')}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-tighter transition-all ${labelFormat === 'QR' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'text-gray-600 hover:text-gray-400'}`}
                                    >
                                        QR CODE
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center gap-2">
                                    <Layout size={12} className="text-cyber-primary" /> Size
                                </label>
                                <select
                                    title="Label Size"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-bold outline-none focus:border-cyber-primary transition-colors appearance-none cursor-pointer"
                                    value={labelSize}
                                    onChange={(e) => setLabelSize(e.target.value as any)}
                                >
                                    {Object.entries(LABEL_SIZES).map(([key, val]) => (
                                        <option key={key} value={key} className="bg-cyber-gray">{val.label} ({key})</option>
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
                                        <label className="text-[9px] uppercase font-bold text-gray-500 mb-1.5 block">Zone ({zoneLetters[0]}–{zoneLetters[zoneLetters.length - 1]})</label>
                                        <select
                                            title="Zone"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm font-black outline-none focus:border-cyber-primary transition-all"
                                            value={bayConfig.zone}
                                            onChange={(e) => setBayConfig({ ...bayConfig, zone: e.target.value })}
                                        >
                                            {zoneLetters.map(z => <option key={z} value={z}>{z}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-gray-500 mb-1.5 block">Aisle (1–{maxAisles})</label>
                                        <select
                                            title="Aisle"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm font-black outline-none focus:border-cyber-primary transition-all"
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
                                        <label className="text-[9px] uppercase font-bold text-gray-500 mb-1.5 block">Bay (1–{maxBays})</label>
                                        <select
                                            title="Bay"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm font-black outline-none focus:border-cyber-primary transition-all"
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
                                <div className="bg-black rounded-2xl border border-white/5 p-5 relative overflow-hidden group/preview hover:border-cyber-primary/20 transition-all">
                                    <div className="absolute top-0 right-0 p-3 flex gap-2">
                                        <div className="text-[8px] bg-cyber-primary/10 text-cyber-primary px-2 py-0.5 rounded border border-cyber-primary/20 font-black tracking-widest uppercase">15-DIGIT PROTOCOL</div>
                                    </div>
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-primary/30 to-transparent" />

                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <div className="text-[10px] text-gray-500 uppercase font-black mb-2 flex items-center gap-2">
                                                Live Preview
                                                <div className="text-[8px] text-cyber-primary animate-pulse">● LIVE</div>
                                            </div>
                                            {/* Large Location Label Preview */}
                                            <div className="text-3xl font-black text-cyber-primary tracking-[6px] mb-2 glow-cyber-primary">
                                                {bayConfig.zone}-{bayConfig.aisle.padStart(2, '0')}-{bayConfig.bay.padStart(2, '0')}
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px]">
                                                <span className="text-gray-600">ZONE <span className="text-gray-400 font-black">{bayConfig.zone}</span></span>
                                                <span className="text-gray-700">|</span>
                                                <span className="text-gray-600">AISLE <span className="text-gray-400 font-black">{bayConfig.aisle.padStart(2, '0')}</span></span>
                                                <span className="text-gray-700">|</span>
                                                <span className="text-gray-600">BAY <span className="text-gray-400 font-black">{bayConfig.bay.padStart(2, '0')}</span></span>
                                            </div>
                                            <div className="mt-2 text-xs font-mono text-gray-500 tracking-widest">
                                                {getBarcode(bayConfig.zone, bayConfig.aisle, bayConfig.bay)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GENERATE BUTTON */}
                                <button
                                    onClick={handlePrintLocation}
                                    className="w-full py-4 font-black text-sm rounded-2xl border transition-all flex items-center justify-center gap-3 active:scale-[0.98] bg-cyber-primary/10 hover:bg-cyber-primary/20 text-cyber-primary border-cyber-primary/30 hover:border-cyber-primary/50"
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
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold pl-12 outline-none focus:border-cyber-primary transition-all placeholder:text-gray-500"
                                        placeholder="Search Product Name or Scan SKU..."
                                        value={searchSku}
                                        onChange={(e) => setSearchSku(e.target.value)}
                                    />
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                                    {matchedProduct && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-green-400">
                                            <CheckCircle size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Matched</span>
                                        </div>
                                    )}
                                </div>

                                {/* Matched Product Summary */}
                                {searchSku.trim() && (
                                    <div className={`p-4 rounded-2xl border transition-all ${matchedProduct ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.05)]' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className={`text-sm font-black mb-1 ${matchedProduct ? 'text-white' : 'text-amber-400'}`}>
                                                    {matchedProduct ? matchedProduct.name : 'Unknown Product / Manual Entry'}
                                                </h4>
                                                <div className="flex gap-3 text-[10px] font-mono tracking-wider">
                                                    <span className="text-gray-400">SKU: <span className="text-white font-bold">{matchedProduct ? matchedProduct.sku : searchSku}</span></span>
                                                    {matchedProduct?.price && (
                                                        <span className="text-gray-400">Price: <span className="text-green-400 font-bold">${matchedProduct.price.toFixed(2)}</span></span>
                                                    )}
                                                </div>
                                            </div>
                                            {matchedProduct?.category && (
                                                <span className="px-2 py-1 bg-black/40 rounded border border-white/5 text-[9px] text-gray-400 font-black uppercase tracking-widest">
                                                    {matchedProduct.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="w-1/3 flex flex-col justify-center bg-black/40 rounded-2xl border border-white/10 relative overflow-hidden group">
                                        <div className="absolute top-2 left-0 right-0 text-center text-[9px] text-gray-500 font-black uppercase tracking-widest">PRINT QTY</div>
                                        <div className="flex items-center justify-between px-2 pt-6 pb-2">
                                            <button
                                                onClick={() => setPrintQty(Math.max(1, printQty - 1))}
                                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all font-black text-xl"
                                            >-</button>
                                            <input
                                                title="Quantity"
                                                className="w-16 bg-transparent text-center text-white text-2xl font-black outline-none font-mono"
                                                value={printQty}
                                                onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))}
                                            />
                                            <button
                                                onClick={() => setPrintQty(printQty + 1)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all font-black text-xl"
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

                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                printWindow.document.write(labelHTML);
                                                printWindow.document.close();
                                                setTimeout(() => printWindow.print(), 500);
                                                addNotification('success', `${printQty} Product label${printQty > 1 ? 's' : ''} ready!`);
                                            }
                                        }}
                                        className={`flex-1 py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-3 ${searchSku.trim()
                                            ? 'bg-cyber-primary text-black shadow-xl shadow-cyber-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                                            : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                            }`}
                                    >
                                        <Printer size={20} />
                                        PRINT PRODUCT {labelFormat === 'QR' ? 'QR' : 'BARCODE'}
                                    </button>
                                </div>

                                <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/10 flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Info size={16} className="text-blue-400" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">
                                        <span className="text-blue-400 font-bold uppercase mr-1">TIPS:</span>
                                        Labels include price and category by default. For inventory tracking, use barcodes for faster scanning.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ZONE OPERATIONS MANAGER — COMING SOON */}
            <div className="mt-6 bg-cyber-gray border border-dashed border-white/10 rounded-3xl overflow-hidden relative group hover:border-cyber-primary/20 transition-all">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-primary/3 via-transparent to-blue-500/3 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyber-primary/10 rounded-2xl relative">
                                <div className="absolute inset-0 bg-cyber-primary/10 blur-xl rounded-2xl" />
                                <Shield size={28} className="text-cyber-primary relative" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-3">
                                    Zone Operations Manager
                                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30 font-black uppercase tracking-widest animate-pulse">
                                        Coming Soon
                                    </span>
                                </h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Advanced warehouse zone control & optimization — launching mid-2026</p>
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
                                key={i}
                                className={`p-5 rounded-2xl border border-white/5 bg-black/30 hover:bg-black/40 transition-all group/card`}
                            >
                                <div className={`p-2.5 rounded-xl w-fit mb-3 ${feature.color === 'red' ? 'bg-red-500/10 text-red-400' :
                                    feature.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                                        feature.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                                            'bg-green-500/10 text-green-400'
                                    }`}>
                                    {feature.icon}
                                </div>
                                <h4 className="text-sm font-black text-white mb-2 uppercase tracking-tight">{feature.title}</h4>
                                <p className="text-[10px] text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                                <div className="w-2 h-2 rounded-full bg-cyber-primary/40 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-amber-400/40 animate-pulse animation-delay-300" />
                                <div className="w-2 h-2 rounded-full bg-blue-400/40 animate-pulse animation-delay-600" />
                            </div>
                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Under Active Development</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-black/40 rounded-full border border-white/5 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                {zones.length} Zone{zones.length !== 1 ? 's' : ''} Configured
                            </div>
                            <div className="px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                                ETA: Mid 2026
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
