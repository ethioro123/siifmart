import React, { useState, useMemo } from 'react';
import { Printer, Package, Layers, Layout, Info, CheckCircle, Eye } from 'lucide-react';
import { generateUnifiedBatchLabelsHTML } from '../../../utils/labels/ProductLabelGenerator';
import { generateLocationLabelHTML } from '../../../utils/labels/LocationLabelGenerator';
import { encodeLocation, extractSitePrefix } from '../../../utils/locationEncoder';
import { Product, WarehouseZone, Site } from '../../../types';
import { printHtmlContent } from '../../../utils/printHelper';
import { BarcodeLabelPreviewCard } from './BarcodeLabelPreviewCard';
import { BarcodeLabelPreviewModal } from './BarcodeLabelPreviewModal';

// Label size presets - Refined for WMS
const LABEL_SIZES = {
    TINY: { width: '1.25in', height: '0.5in', label: '1.25" x 0.5"' },
    SMALL: { width: '2in', height: '1in', label: '2" x 1"' },
    MEDIUM: { width: '3in', height: '2in', label: '3" x 2"' },
    LARGE: { width: '4in', height: '3in', label: '4" x 3"' },
    XL: { width: '4in', height: '6in', label: '4" x 6"' },
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
    zones,
    activeSite
}) => {
    // Label Printing State
    const [labelFormat, setLabelFormat] = useState<'BARCODE' | 'QR'>('BARCODE');
    const [labelSize, setLabelSize] = useState<keyof typeof LABEL_SIZES>('MEDIUM');
    const [labelMode, setLabelMode] = useState<'PRODUCT' | 'BAY'>('PRODUCT');

    // Product Search State
    const [searchSku, setSearchSku] = useState('');
    const [printQty, setPrintQty] = useState(1);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Multi-country currency sovereignty (ETB vs KES)
    const activeCurrency = activeSite?.currency || (activeSite?.country === 'KE' ? 'KSh' : 'ETB');

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

    const getBarcode = (zone: string, aisle: string, bay: string) => {
        const humanLabel = `${zone}-${aisle.padStart(2, '0')}-${bay.padStart(2, '0')}`;
        return encodeLocation(humanLabel, prefix) || humanLabel;
    };

    const aislePad = bayConfig.aisle.padStart(2, '0');
    const bayPad = bayConfig.bay.padStart(2, '0');
    const humanLocationLabel = `${bayConfig.zone}-${aislePad}-${bayPad}`;
    const locationBarcode = getBarcode(bayConfig.zone, bayConfig.aisle, bayConfig.bay);

    const handlePrintLocation = async () => {
        const labelHTML = await generateLocationLabelHTML([{
            humanLabel: humanLocationLabel,
            barcode: locationBarcode,
            zone: bayConfig.zone,
            aisle: aislePad,
            bay: bayPad,
            siteName: activeSite?.name,
            siteCode: activeSite?.code
        }], {
            size: labelSize,
            format: labelFormat === 'QR' ? 'QR' : 'Barcode'
        });

        printHtmlContent(labelHTML);
        addNotification('success', `Location label ${humanLocationLabel} ready!`);
    };

    const handlePrintProduct = async () => {
        if (!searchSku.trim()) return;
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

        printHtmlContent(labelHTML);
        addNotification('success', `${printQty} Product label${printQty > 1 ? 's' : ''} ready!`);
    };

    const activePreviewData = labelMode === 'PRODUCT' ? {
        type: 'PRODUCT' as const,
        title: matchedProduct?.name || (searchSku.trim() ? 'Manual Product Entry' : 'Awaiting SKU'),
        code: matchedProduct?.sku || searchSku.trim(),
        format: labelFormat,
        size: labelSize,
        price: matchedProduct?.price,
        currency: activeCurrency,
        category: matchedProduct?.category
    } : {
        type: 'BAY' as const,
        title: humanLocationLabel,
        humanLabel: humanLocationLabel,
        code: locationBarcode,
        format: labelFormat,
        size: labelSize,
        siteName: activeSite?.name,
        siteCode: activeSite?.code,
        zone: bayConfig.zone,
        aisle: aislePad,
        bay: bayPad
    };

    return (
        <div className="pb-12 space-y-3 sm:space-y-6">
            {/* LEFT PANEL: PRINTING HUB */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden relative">
                <div className="p-3 sm:p-6">
                    {/* Mobile compact header */}
                    <div className="flex sm:hidden items-center justify-between gap-2 w-full mb-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Printer size={15} className="text-[var(--theme-accent)] shrink-0" />
                            <span className="text-xs font-bold text-[var(--theme-text-primary)] truncate">Labels</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)]" />
                                {labelMode}
                            </span>
                        </div>
                        <div className="flex bg-[var(--theme-bg-subtle)] p-0.5 rounded-lg border border-[var(--theme-border)] shrink-0">
                            <button
                                onClick={() => { setLabelMode('PRODUCT'); setLabelSize('MEDIUM'); }}
                                className={`px-2.5 py-1 min-h-[30px] rounded-md text-[11px] font-semibold transition-colors touch-manipulation flex items-center justify-center ${labelMode === 'PRODUCT' ? 'bg-[var(--theme-accent)] text-white shadow-xs' : 'text-[var(--theme-text-secondary)]'}`}
                            >
                                Products
                            </button>
                            <button
                                onClick={() => { setLabelMode('BAY'); setLabelSize('MEDIUM'); }}
                                className={`px-2.5 py-1 min-h-[30px] rounded-md text-[11px] font-semibold transition-colors touch-manipulation flex items-center justify-center ${labelMode === 'BAY' ? 'bg-[var(--theme-accent)] text-white shadow-xs' : 'text-[var(--theme-text-secondary)]'}`}
                            >
                                Bays
                            </button>
                        </div>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5 sm:gap-3">
                                <div className="p-2 bg-[var(--theme-accent)]/10 rounded-xl shrink-0">
                                    <Printer size={20} className="text-[var(--theme-accent)]" />
                                </div>
                                <span className="truncate">Label Printing Hub</span>
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-1 ml-10 sm:ml-11">Management & Identity Systems</p>
                        </div>
                        <div className="flex bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] w-full sm:w-auto">
                            <button
                                onClick={() => { setLabelMode('PRODUCT'); setLabelSize('MEDIUM'); }}
                                className={`flex-1 sm:flex-initial px-4 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-colors touch-manipulation flex items-center justify-center ${labelMode === 'PRODUCT' ? 'bg-[var(--theme-accent)] text-white shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                            >
                                <Package size={14} className="inline mr-2 shrink-0" /> Products
                            </button>
                            <button
                                onClick={() => { setLabelMode('BAY'); setLabelSize('MEDIUM'); }}
                                className={`flex-1 sm:flex-initial px-4 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-colors touch-manipulation flex items-center justify-center ${labelMode === 'BAY' ? 'bg-[var(--theme-accent)] text-white shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                            >
                                <Layout size={14} className="inline mr-2 shrink-0" /> Bays
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                        {/* Format & Size Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-semibold text-[var(--theme-text-secondary)] flex items-center gap-2">
                                    <Layers size={14} className="text-[var(--theme-accent)]" /> Format
                                </label>
                                <div className="flex bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)]">
                                    <button
                                        onClick={() => setLabelFormat('BARCODE')}
                                        className={`flex-1 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-colors touch-manipulation ${labelFormat === 'BARCODE' ? 'bg-[var(--theme-accent)] text-white shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                                    >
                                        BARCODE
                                    </button>
                                    <button
                                        onClick={() => setLabelFormat('QR')}
                                        className={`flex-1 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-colors touch-manipulation ${labelFormat === 'QR' ? 'bg-[var(--theme-accent)] text-white shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                                    >
                                        QR CODE
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-semibold text-[var(--theme-text-secondary)] flex items-center gap-2">
                                    <Layout size={14} className="text-[var(--theme-accent)]" /> Size
                                </label>
                                <select
                                    title="Label Size"
                                    className="w-full bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-[var(--theme-text-primary)] text-xs font-semibold min-h-[44px] outline-none"
                                    value={labelSize}
                                    onChange={(e) => setLabelSize(e.target.value as any)}
                                >
                                    {Object.entries(LABEL_SIZES).map(([key, val]) => (
                                        <option key={key} value={key} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">{val.label} ({key})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {labelMode === 'BAY' ? (
                            /* BAY LOGIC — Location Label Printing */
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs uppercase font-semibold text-[var(--theme-text-secondary)] mb-1.5 block">Zone ({zoneLetters[0]}–{zoneLetters[zoneLetters.length - 1]})</label>
                                        <select
                                            title="Zone"
                                            className="w-full bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm font-semibold min-h-[44px] outline-none"
                                            value={bayConfig.zone}
                                            onChange={(e) => setBayConfig({ ...bayConfig, zone: e.target.value })}
                                        >
                                            {zoneLetters.map(z => <option key={z} value={z}>{z}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-semibold text-[var(--theme-text-secondary)] mb-1.5 block">Aisle (1–{maxAisles})</label>
                                        <select
                                            title="Aisle"
                                            className="w-full bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm font-semibold min-h-[44px] outline-none"
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
                                        <label className="text-xs uppercase font-semibold text-[var(--theme-text-secondary)] mb-1.5 block">Bay (1–{maxBays})</label>
                                        <select
                                            title="Bay"
                                            className="w-full bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm font-semibold min-h-[44px] outline-none"
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
                                <div className="bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] p-4 sm:p-5 relative overflow-hidden space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-[var(--theme-text-muted)] uppercase font-semibold flex items-center gap-2">
                                            Live Location Preview
                                            <span className="text-[11px] text-[var(--theme-accent)] font-bold animate-pulse">LIVE</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsPreviewOpen(true)}
                                            className="text-xs font-semibold text-[var(--theme-accent)] hover:underline flex items-center gap-1.5 touch-manipulation"
                                        >
                                            <Eye size={13} />
                                            <span>Expand 1:1 Preview</span>
                                        </button>
                                    </div>

                                    <BarcodeLabelPreviewCard
                                        type="BAY"
                                        title={humanLocationLabel}
                                        humanLabel={humanLocationLabel}
                                        code={locationBarcode}
                                        format={labelFormat}
                                        size={labelSize}
                                        siteName={activeSite?.name}
                                        siteCode={activeSite?.code}
                                        zone={bayConfig.zone}
                                        aisle={aislePad}
                                        bay={bayPad}
                                    />
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsPreviewOpen(true)}
                                        className="px-5 py-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation min-h-[44px]"
                                    >
                                        <Eye size={16} className="text-[var(--theme-accent)]" />
                                        <span>QUICK PREVIEW</span>
                                    </button>
                                    <button
                                        onClick={handlePrintLocation}
                                        className="flex-1 min-h-[44px] py-3.5 bg-[var(--theme-accent)] text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
                                    >
                                        <Printer size={18} />
                                        <span>GENERATE LOCATION LABEL</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* PRODUCT LOGIC */
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        title="Product SKU"
                                        className="woody-input w-full rounded-2xl p-4 !pl-12 text-sm border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] min-h-[44px]"
                                        placeholder="Search Product Name or Scan SKU..."
                                        value={searchSku}
                                        onChange={(e) => setSearchSku(e.target.value)}
                                    />
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" size={20} />
                                    {matchedProduct && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[var(--theme-accent)]">
                                            <CheckCircle size={16} />
                                            <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Matched</span>
                                        </div>
                                    )}
                                </div>

                                {/* Matched Product Summary & Live Preview */}
                                {searchSku.trim() && (
                                    <div className="space-y-3">
                                        <div className={`p-4 rounded-2xl border transition-colors ${matchedProduct ? 'bg-[var(--theme-accent)]/5 border-[var(--theme-accent)]/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className={`text-sm font-semibold mb-1 ${matchedProduct ? 'text-[var(--theme-text-primary)]' : 'text-amber-700 dark:text-amber-400'}`}>
                                                        {matchedProduct ? matchedProduct.name : 'Unknown Product / Manual Entry'}
                                                    </h4>
                                                    <div className="flex gap-3 text-xs font-mono tabular-nums tracking-wider">
                                                        <span className="text-[var(--theme-text-secondary)]">SKU: <span className="text-[var(--theme-text-primary)] font-bold">{matchedProduct ? matchedProduct.sku : searchSku}</span></span>
                                                        {matchedProduct?.price && (
                                                            <span className="text-[var(--theme-text-secondary)]">Price: <span className="text-[var(--theme-accent)] font-bold">{activeCurrency} {matchedProduct.price.toFixed(2)}</span></span>
                                                        )}
                                                    </div>
                                                </div>
                                                {matchedProduct?.category && (
                                                    <span className="px-2 py-1 bg-[var(--theme-bg-subtle)] rounded border border-[var(--theme-border)] text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">
                                                        {matchedProduct.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inline Live Barcode Preview Card */}
                                        <div className="bg-[var(--theme-bg-subtle)] p-3 sm:p-4 rounded-2xl border border-[var(--theme-border)] space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                                                    <Eye size={13} className="text-[var(--theme-accent)]" /> Live Barcode Preview
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsPreviewOpen(true)}
                                                    className="text-xs font-semibold text-[var(--theme-accent)] hover:underline flex items-center gap-1 touch-manipulation"
                                                >
                                                    <Eye size={12} />
                                                    <span>Expand 1:1 Preview</span>
                                                </button>
                                            </div>
                                            <BarcodeLabelPreviewCard
                                                type="PRODUCT"
                                                title={matchedProduct ? matchedProduct.name : searchSku}
                                                code={matchedProduct?.sku || searchSku.trim()}
                                                format={labelFormat}
                                                size={labelSize}
                                                price={matchedProduct?.price}
                                                currency={activeCurrency}
                                                category={matchedProduct?.category}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="w-full sm:w-1/3 flex flex-col justify-center bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] relative overflow-hidden group">
                                        <div className="text-center text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase tracking-wider pt-2">PRINT QTY</div>
                                        <div className="flex items-center justify-between px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => setPrintQty(Math.max(1, printQty - 1))}
                                                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] rounded-xl transition-colors font-bold text-lg touch-manipulation"
                                                aria-label="Decrease quantity"
                                            >-</button>
                                            <input
                                                title="Quantity"
                                                className="w-16 bg-transparent text-center text-[var(--theme-text-primary)] text-xl font-bold outline-none font-mono tabular-nums"
                                                value={printQty}
                                                onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPrintQty(printQty + 1)}
                                                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] rounded-xl transition-colors font-bold text-lg touch-manipulation"
                                                aria-label="Increase quantity"
                                            >+</button>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex gap-2 sm:gap-3">
                                        <button
                                            type="button"
                                            disabled={!searchSku.trim()}
                                            onClick={() => setIsPreviewOpen(true)}
                                            className={`px-4 sm:px-5 py-3.5 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs touch-manipulation min-h-[44px] ${searchSku.trim()
                                                ? 'bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] active:scale-[0.98]'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] cursor-not-allowed border border-[var(--theme-border)] opacity-60'
                                                }`}
                                        >
                                            <Eye size={16} className={searchSku.trim() ? "text-[var(--theme-accent)]" : ""} />
                                            <span>QUICK PREVIEW</span>
                                        </button>
                                        <button
                                            disabled={!searchSku.trim()}
                                            onClick={handlePrintProduct}
                                            className={`flex-1 min-h-[44px] py-3.5 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs touch-manipulation ${searchSku.trim()
                                                ? 'bg-[var(--theme-accent)] text-white hover:opacity-90 active:scale-[0.98]'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] cursor-not-allowed border border-[var(--theme-border)]'
                                                }`}
                                        >
                                            <Printer size={18} />
                                            <span>PRINT PRODUCT {labelFormat === 'QR' ? 'QR' : 'BARCODE'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-2xl border border-dashed border-[var(--theme-border)] flex items-center gap-4">
                                    <div className="p-2 bg-[var(--theme-accent)]/10 rounded-xl">
                                        <Info size={16} className="text-[var(--theme-accent)]" />
                                    </div>
                                    <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                                        <span className="text-[var(--theme-accent)] font-bold uppercase mr-1">TIPS:</span>
                                        Labels include price and category by default. For inventory tracking, use barcodes for faster scanning.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* QUICK PREVIEW MODAL */}
            <BarcodeLabelPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                previewData={activePreviewData}
                quantity={labelMode === 'PRODUCT' ? printQty : 1}
                onQuantityChange={labelMode === 'PRODUCT' ? setPrintQty : undefined}
                onFormatChange={setLabelFormat}
                onPrint={labelMode === 'PRODUCT' ? handlePrintProduct : handlePrintLocation}
            />
        </div>
    );
};
