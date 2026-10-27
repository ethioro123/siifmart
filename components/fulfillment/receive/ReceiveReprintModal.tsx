import { useData } from '../../../contexts/DataContext';
import React from 'react';
import { X, Printer, Minus, Plus, RefreshCw, Box, Tags, Eye, EyeOff, LayoutTemplate, ScanLine, QrCode, Info } from 'lucide-react';
import { ReceivingLabelOutputPreview } from './ReceivingLabelOutputPreview';

interface ReceiveReprintModalProps {
    reprintItem: {
        sku: string;
        name: string;
        qty: number;
        copies?: number;
        price?: string | number;
        category?: string;
        expiry?: string;
        batchNumber?: string;
        targetLocation?: string;
        poNumber?: string;
        packQuantity?: number;
    };
    setReprintItem: (val: any) => void;
    isSubmitting: boolean;
    handleReprintLabels: () => void;
    reprintSize: 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
    setReprintSize: (val: 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL') => void;
    reprintFormat: 'QR' | 'Barcode' | 'Both';
    setReprintFormat: (val: 'QR' | 'Barcode' | 'Both') => void;
    reprintOptions: {
        showPrice: boolean;
        showCategory: boolean;
        showName: boolean;
    };
    setReprintOptions: (val: any) => void;
    labelType?: 'LPN' | 'ITEM';
    setLabelType?: (val: 'LPN' | 'ITEM') => void;
    printPriceTagAt?: 'receive' | 'putaway' | 'store';
    t: (key: string, params?: Record<string, string | number>) => string;
}

export const ReceiveReprintModal: React.FC<ReceiveReprintModalProps> = ({
    reprintItem,
    setReprintItem,
    isSubmitting,
    handleReprintLabels,
    reprintSize,
    setReprintSize,
    reprintFormat,
    setReprintFormat,
    reprintOptions,
    setReprintOptions,
    labelType = 'LPN',
    setLabelType,
    printPriceTagAt,
    t
}) => {
    const { effectiveCountry } = useData();
    const sizes: Array<'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL'> = ['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'XL'];
    const formats: Array<'QR' | 'Barcode' | 'Both'> = ['QR', 'Barcode', 'Both'];

    const toggleOption = (option: keyof typeof reprintOptions) => {
        setReprintOptions({ ...reprintOptions, [option]: !reprintOptions[option] });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[300] p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-subtle)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-primary)] shadow-sm">
                            <Printer size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-[var(--theme-text-primary)] tracking-tight">{t('warehouse.advancedPrinting')}</h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">{t('warehouse.dimensionsAndLayout')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setReprintItem(null)}
                        className="p-2.5 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar bg-[var(--theme-bg-app)]">
                    {/* Label Purpose Selector */}
                    <div className="flex items-center gap-1.5 p-1.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={() => setLabelType?.('LPN')}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 min-h-[44px] transition-all ${labelType === 'LPN'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            <Box size={14} />
                            {t('warehouse.putawayCartonLpn') || 'Putaway & Carton LPN (Recommended)'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setLabelType?.('ITEM')}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 min-h-[44px] transition-all ${labelType === 'ITEM'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            <Tags size={14} />
                            {t('warehouse.unitBarcodeSticker') || 'Unit Barcode Sticker'}
                        </button>
                    </div>

                    {/* Product Summary HUD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3.5 shadow-sm">
                            <div className="w-11 h-11 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] shrink-0">
                                <Box size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-0.5">{t('warehouse.product')}</p>
                                <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{reprintItem.name}</p>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono mt-0.5 truncate">{reprintItem.sku}</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-col justify-between shadow-sm">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-2">{t('warehouse.labelCopies') || 'Label copies'}</p>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setReprintItem({ ...reprintItem, copies: Math.max(1, (reprintItem.copies ?? 1) - 1) })}
                                    title={t('warehouse.decreaseQuantity')}
                                    className="w-10 h-10 min-h-[40px] rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] flex items-center justify-center transition-colors shadow-sm shrink-0"
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    pattern="[0-9]*"
                                    title={t('warehouse.labelCopies') || 'Label copies'}
                                    aria-label={t('warehouse.labelCopies') || 'Label copies'}
                                    value={reprintItem.copies ?? 1}
                                    onChange={(e) => setReprintItem({ ...reprintItem, copies: Math.min(500, Math.max(1, parseInt(e.target.value) || 1)) })}
                                    className="w-20 bg-transparent border-none text-center text-xl font-bold text-[var(--theme-text-primary)] focus:outline-none tabular-nums font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    onClick={() => setReprintItem({ ...reprintItem, copies: Math.min(500, (reprintItem.copies ?? 1) + 1) })}
                                    title={t('warehouse.increaseQuantity')}
                                    className="w-10 h-10 min-h-[40px] rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] flex items-center justify-center transition-colors shadow-sm shrink-0"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-[var(--theme-text-secondary)]">{t('warehouse.countedQtyOnLabelNotice', { count: reprintItem.qty }) || `Counted quantity on this label: ${reprintItem.qty} units. Copies do not change the received quantity.`}</p>
                    {/* Size Selector */}
                    <div className="space-y-2">
                        <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider flex items-center gap-2">
                            <LayoutTemplate size={14} /> {t('warehouse.labelSize')}
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    disabled={labelType !== 'ITEM' && ['TINY', 'SMALL'].includes(size)}
                                    onClick={() => setReprintSize(size)}
                                    className={`py-2.5 min-h-[44px] text-xs font-semibold font-mono rounded-xl border transition-all ${reprintSize === size
                                        ? 'bg-[var(--theme-bg-card)] border-[var(--theme-text-primary)] text-[var(--theme-text-primary)] shadow-sm font-bold'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {labelType !== 'ITEM' && <p className="text-xs text-[var(--theme-text-secondary)]">{t('warehouse.intakeLabelSizeNotice') || 'Intake labels require Medium (3 × 2 in) or larger for readable lot details and scannable codes.'}</p>}
                    {/* Format Selector */}
                    <div className="space-y-2">
                        <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider flex items-center gap-2">
                            <Tags size={14} /> {t('warehouse.identifierFormat')}
                        </label>
                        <div className="flex gap-2">
                            {formats.map((format) => (
                                <button
                                    key={format}
                                    onClick={() => setReprintFormat(format)}
                                    className={`flex-1 py-2.5 min-h-[44px] flex items-center justify-center gap-2 rounded-xl border font-semibold font-mono text-xs uppercase tracking-wide transition-all ${reprintFormat === format
                                        ? 'bg-[var(--theme-bg-card)] border-[var(--theme-text-primary)] text-[var(--theme-text-primary)] shadow-sm font-bold'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                >
                                    {format === 'QR' && <QrCode size={14} />}
                                    {format === 'Barcode' && <ScanLine size={14} />}
                                    {format === 'Both' && <Box size={14} />}
                                    {format === 'Both' ? (t('common.both') || 'Both') : format}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visibility Options */}
                    <div className="space-y-2">
                        <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider flex items-center gap-2">
                            <Eye size={14} /> {t('warehouse.displayAttributes')}
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                            {(Object.keys(reprintOptions) as Array<keyof typeof reprintOptions>).map((opt) => (
                                <button
                                    key={opt}
                                    disabled={opt === 'showPrice' && printPriceTagAt !== 'receive'}
                                    onClick={() => toggleOption(opt)}
                                    className={`flex items-center justify-between px-4 py-2.5 min-h-[44px] rounded-xl border transition-all ${reprintOptions[opt]
                                        ? 'bg-[var(--theme-bg-card)] border-[var(--theme-text-primary)] text-[var(--theme-text-primary)] shadow-sm font-semibold'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                >
                                    <span className="text-xs uppercase tracking-wider">
                                        {opt === 'showPrice' ? (t('common.price') || 'Price') : opt === 'showCategory' ? (t('common.category') || 'Category') : (t('common.name') || 'Name')}
                                    </span>
                                    {reprintOptions[opt] ? <Eye size={15} /> : <EyeOff size={15} className="opacity-60" />}
                                </button>
                            ))}
                        </div>
                        {printPriceTagAt !== 'receive' && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                                <Info size={14} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                    {t('warehouse.inventoryLabelModeNotice') || 'Inventory Label Mode: Inbound receiving labels identify SKU, batch & barcode. Retail shelf price tags are printed in POS Command / Store Shelf Hub to maintain scanner price parity.'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Live Print Output Preview */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider flex items-center gap-2">
                                <ScanLine size={14} /> {t('warehouse.printOutputPreview') || 'Print Output Preview'}
                            </label>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                {t('warehouse.labelLayout') || 'Label layout'}
                            </span>
                        </div>
                        <div className="bg-[var(--theme-bg-subtle)] p-3 rounded-2xl border border-[var(--theme-border)]">
                            <ReceivingLabelOutputPreview item={reprintItem} type={labelType || 'LPN'} size={reprintSize} format={reprintFormat} currency={effectiveCountry === 'KE' ? 'KSh' : 'ETB'}
                                showPrice={printPriceTagAt === 'receive' && reprintOptions.showPrice} showCategory={reprintOptions.showCategory} showName={reprintOptions.showName} />
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 md:p-6 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shrink-0">
                    <button
                        disabled={isSubmitting}
                        onClick={handleReprintLabels}
                        className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs md:text-sm uppercase tracking-wider min-h-[48px] flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <RefreshCw className="animate-spin" size={18} />
                        ) : (
                            <Printer size={18} />
                        )}
                        <span>{t('warehouse.generateLabels').toUpperCase()} ({reprintItem.copies ?? 1})</span>
                    </button>
                    <p className="text-[11px] text-center text-[var(--theme-text-secondary)] mt-3 font-mono">Unified Template System v2.4</p>
                </div>
            </div>
        </div>
    );
};
