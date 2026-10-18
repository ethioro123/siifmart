import React, { useState, useRef, useEffect } from 'react';
import { Barcode, CheckCircle, ArrowRight, Package, AlertTriangle, Sparkles, Scan } from 'lucide-react';
import { WMSJob, Product } from '../../../../types';
import { ProgressBar } from '../../../shared/ProgressBar';
import { formatBeautifulLocation } from '../PickJobModal';
import { formatProductSize, getSellUnit } from '../../../../utils/units';
import { useData } from '../../../../contexts/DataContext';
import { resolveFulfillmentScanningPolicy } from '../../../../utils/receivingPolicy';

interface Step2PickCollectProps {
    job: WMSJob;
    products: Product[];
    sortedLineItems: any[];
    totalItems: number;
    completedItems: number;
    progressPercent: number;
    isFullyPicked: boolean;
    getProduct: (item: any) => Product | undefined;
    onUpdateItemPick: (item: any, qty: number) => void;
    onStartPick: (job: WMSJob) => void;
    onAdvanceToStaging: () => void;
    t: (key: string) => string;
}

export const Step2PickCollect: React.FC<Step2PickCollectProps> = ({
    job,
    products,
    sortedLineItems,
    totalItems,
    completedItems,
    progressPercent,
    isFullyPicked,
    getProduct,
    onUpdateItemPick,
    onStartPick,
    onAdvanceToStaging,
    t,
}) => {
    const { settings, effectiveCountry } = useData();
    const scanningPolicy = resolveFulfillmentScanningPolicy(settings, effectiveCountry);

    const [scanInput, setScanInput] = useState('');
    const [scanError, setScanError] = useState('');
    const [qtyDrafts, setQtyDrafts] = useState<Record<number, string>>({});
    const scanInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => scanInputRef.current?.focus(), 150);
        return () => clearTimeout(timer);
    }, []);

    const handleConfirmLinePick = (item: any, idx: number, expected: number) => {
        if (!scanningPolicy.requirePickQuantityEntry) {
            onUpdateItemPick(item, expected);
            return;
        }
        const raw = qtyDrafts[idx];
        const entered = raw !== undefined && raw !== '' ? Number(raw) : NaN;
        if (!Number.isFinite(entered) || entered <= 0) {
            setScanError(`Enter the physical quantity picked for ${item.name || item.sku || 'item'} before confirming.`);
            setTimeout(() => setScanError(''), 2500);
            return;
        }
        onUpdateItemPick(item, Math.min(expected, entered));
        setScanError('');
    };

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();
        const code = scanInput.trim().toUpperCase();
        if (!code) return;

        const targetIndex = sortedLineItems.findIndex(item => {
            const isDone = item.status === 'Completed' || item.status === 'Picked';
            if (isDone) return false;
            const prod = getProduct(item);
            return (
                item.sku?.toUpperCase() === code ||
                prod?.sku?.toUpperCase() === code ||
                prod?.barcode?.toUpperCase() === code
            );
        });

        if (targetIndex !== -1) {
            const target = sortedLineItems[targetIndex];
            const expected = target.expectedQty || (target as any).quantity || 1;
            if (scanningPolicy.requirePickQuantityEntry) {
                const nextQty = Math.min(expected, (Number(qtyDrafts[targetIndex]) || (target.pickedQty || 0)) + 1);
                setQtyDrafts(prev => ({ ...prev, [targetIndex]: String(nextQty) }));
                onUpdateItemPick(target, nextQty);
            } else {
                onUpdateItemPick(target, expected);
            }
            setScanError('');
        } else {
            setScanError('Item barcode not found in this pick mission');
            setTimeout(() => setScanError(''), 2000);
        }
        setScanInput('');
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[var(--theme-bg-app)]">
            {/* Top Toolbar: Scanning Bar & Progress */}
            <div className="p-3 md:p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Live Progress Pill */}
                    <div className="flex items-center gap-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3.5 py-2 rounded-xl shrink-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-[var(--theme-text-primary)]">
                                {completedItems} / {totalItems}
                            </span>
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                                {t('warehouse.picked') || 'Picked'}
                            </span>
                        </div>
                        <div className="w-24 md:w-32 h-2.5 bg-[var(--theme-bg-app)] rounded-full overflow-hidden shrink-0 border border-[var(--theme-border)]">
                            <ProgressBar
                                progress={progressPercent}
                                containerClassName="h-full bg-transparent"
                                fillClassName={`h-full transition-all duration-300 ${
                                    isFullyPicked ? 'bg-green-500' : 'bg-[var(--theme-accent)]'
                                }`}
                            />
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--theme-accent)]">
                            {Math.round(progressPercent)}%
                        </span>
                    </div>

                    {/* Scan Input & Camera Scan Toggle */}
                    <div className="flex items-center gap-2 flex-1 max-w-md sm:justify-end">
                        <form onSubmit={handleScan} className="relative flex-1">
                            <input
                                ref={scanInputRef}
                                type="text"
                                aria-label="Scan item barcode"
                                placeholder="Scan SKU / barcode..."
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2 pl-9 pr-3 text-xs md:text-sm font-mono text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] outline-none min-h-[44px]"
                            />
                            <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
                        </form>

                        <button
                            type="button"
                            onClick={() => onStartPick(job)}
                            title="Open guided pick scanner"
                            className="min-h-[44px] px-3 bg-[var(--theme-accent)] hover:opacity-90 border border-[var(--theme-accent)] rounded-xl text-xs font-semibold tracking-wide text-white flex items-center gap-1.5 shrink-0 transition-colors touch-manipulation cursor-pointer"
                        >
                            <Scan size={15} />
                            <span>Guided Scanner</span>
                        </button>
                    </div>
                </div>

                {/* Scan Error Toast */}
                {scanError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>{scanError}</span>
                    </div>
                )}
            </div>

            {/* Dynamic Step-Complete Auto-Advance Banner */}
            {isFullyPicked && (
                <div className="p-3 md:p-4 bg-green-500/10 border-b border-green-500/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-tight">
                                All {totalItems} items collected!
                            </p>
                            <span className="text-[11px] text-green-600 dark:text-green-400">
                                Proceed to staging drop-off and tote manifest handover.
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onAdvanceToStaging}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
                    >
                        <span>Step 3: Staging Handover</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* Pick Line Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-5 space-y-2.5">
                {sortedLineItems.map((item, idx) => {
                    const prod = getProduct(item);
                    const isDone = item.status === 'Completed' || item.status === 'Picked';
                    const expected = item.expectedQty || (item as any).quantity || 1;
                    const picked = item.pickedQty || 0;
                    const loc = item.location || prod?.location;
                    const unitDef = getSellUnit(prod?.unit || item.unit);

                    return (
                        <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                isDone
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-sm'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-11 h-11 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
                                    {prod?.image ? (
                                        <img src={prod.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package size={20} className="text-[var(--theme-text-secondary)]" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-xs font-bold uppercase truncate ${
                                            isDone ? 'line-through text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-primary)]'
                                        }`}>
                                            {item.name || prod?.name || 'Unknown SKU'}
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded border border-[var(--theme-border)]">
                                            {item.sku || prod?.sku}
                                        </span>
                                        {formatProductSize(prod || item) && (
                                            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                {formatProductSize(prod || item)}
                                            </span>
                                        )}
                                        {formatBeautifulLocation(loc, 'woody', t)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--theme-border)]/60 shrink-0">
                                <span className={`text-xs font-mono font-bold ${
                                    isDone ? 'text-green-600 dark:text-green-400' : 'text-[var(--theme-text-primary)]'
                                }`}>
                                    {picked} / {expected} {unitDef.shortLabel}
                                </span>

                                {!isDone && scanningPolicy.requirePickQuantityEntry && (
                                    <input
                                        type="number"
                                        min="1"
                                        max={expected}
                                        placeholder="Qty"
                                        aria-label={`Enter picked quantity for ${item.name || prod?.name || 'item'}`}
                                        value={qtyDrafts[idx] ?? (picked > 0 ? String(picked) : '')}
                                        onChange={(e) => setQtyDrafts(prev => ({ ...prev, [idx]: e.target.value }))}
                                        className="w-16 min-h-[38px] px-2.5 py-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] text-xs font-mono font-bold text-center text-[var(--theme-text-primary)] outline-none tabular-nums"
                                    />
                                )}

                                {isDone ? (
                                    <span className="px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold uppercase flex items-center gap-1">
                                        <CheckCircle size={13} />
                                        <span>Picked</span>
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleConfirmLinePick(item, idx, expected)}
                                        className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer touch-manipulation"
                                    >
                                        <span>Pick</span>
                                        <ArrowRight size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

