import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Package, RotateCcw, Search, Send } from 'lucide-react';
import type { Product, User } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { WMSCountItem, WMSCountSession } from '../../../services/wms-counts.service';

interface CountOperationsProps {
    products: Product[];
    user: User | null;
    session: WMSCountSession | null;
    isLoading: boolean;
    onStart: (type: WMSCountSession['countType']) => Promise<void>;
    onRecordCount: (productId: string, quantity: number) => Promise<void>;
    onComplete: () => Promise<void>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
}

export const CountOperations: React.FC<CountOperationsProps> = ({
    products, session, isLoading, onStart, onRecordCount, onComplete, addNotification,
}) => {
    const { t } = useLanguage();
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const items = session?.items ?? [];

    const canFinish = items.length > 0 && items.every((item) =>
        item.status !== 'Pending' && item.status !== 'Recount Required'
    );

    const saveCount = async (item: WMSCountItem) => {
        const raw = quantities[item.productId] ?? '';
        const quantity = Number(raw);
        if (!raw.trim() || !Number.isFinite(quantity) || quantity < 0) {
            addNotification('alert', t('warehouse.enterPhysicalQtyCounted'));
            return;
        }
        setSavingId(item.productId);
        try {
            await onRecordCount(item.productId, quantity);
            setQuantities((current) => ({ ...current, [item.productId]: '' }));
        } catch (error) {
            addNotification('alert', error instanceof Error ? error.message : t('warehouse.unableToSaveCount'));
        } finally {
            setSavingId(null);
        }
    };

    const finish = async () => {
        if (!canFinish) {
            addNotification('info', t('warehouse.secondWorkerRecountNotice'));
            return;
        }
        setIsFinishing(true);
        try {
            await onComplete();
        } catch (error) {
            addNotification('alert', error instanceof Error ? error.message : t('warehouse.unableToCompleteCountSession'));
        } finally {
            setIsFinishing(false);
        }
    };

    const start = async (type: WMSCountSession['countType']) => {
        setIsStarting(true);
        try {
            await onStart(type);
        } catch (error) {
            addNotification('alert', error instanceof Error ? error.message : t('warehouse.unableToStartCountSession'));
        } finally {
            setIsStarting(false);
        }
    };

    if (!session) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                    disabled={isLoading || isStarting}
                    onClick={() => void start('Cycle')}
                    className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 text-left hover:border-[var(--theme-accent)]/40 disabled:opacity-60"
                >
                    <span className="flex items-center gap-3 font-semibold text-[var(--theme-text-primary)]"><RotateCcw size={20} />{t('warehouse.dailyCycleCount')}</span>
                    <span className="block mt-2 text-xs text-[var(--theme-text-secondary)]">{t('warehouse.dailyCycleCountDesc')}</span>
                </button>
                <button
                    disabled={isLoading || isStarting}
                    onClick={() => void start('Spot')}
                    className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 text-left hover:border-[var(--theme-accent)]/40 disabled:opacity-60"
                >
                    <span className="flex items-center gap-3 font-semibold text-[var(--theme-text-primary)]"><Search size={20} />{t('warehouse.spotCheck')}</span>
                    <span className="block mt-2 text-xs text-[var(--theme-text-secondary)]">{t('warehouse.spotCheckDesc')}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-[var(--theme-text-primary)]">
                <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                <span>{t('warehouse.blindCountNotice')}</span>
            </div>

            {items.map((item) => {
                const product = products.find((candidate) => candidate.id === item.productId);
                const mayEnterCount = item.status === 'Pending' || item.canCount;
                return (
                    <div key={item.productId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 sm:p-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
                                {product?.image ? <img src={product.image} alt="" className="h-full w-full object-cover" /> : <Package size={18} className="text-[var(--theme-text-secondary)]" />}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--theme-text-primary)]">{item.name}</p>
                                <p className="truncate font-mono text-[11px] text-[var(--theme-text-secondary)]">{item.location || t('warehouse.nA')} · {item.sku}</p>
                                {item.hasVariance && <p className="mt-1 text-xs font-semibold text-amber-600">{t('warehouse.varianceDetectedRecount')}</p>}
                                {item.status === 'Counted' && !item.hasVariance && <p className="mt-1 text-xs font-semibold text-emerald-600">{t('warehouse.countRecorded')}</p>}
                            </div>
                        </div>
                        {mayEnterCount ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number" min="0" step="any" inputMode="decimal"
                                    aria-label={t('warehouse.physicalCountForSku', { sku: item.sku })}
                                    value={quantities[item.productId] ?? ''}
                                    onChange={(event) => setQuantities((current) => ({ ...current, [item.productId]: event.target.value }))}
                                    className="min-h-[44px] w-24 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-2 text-center font-mono text-lg text-[var(--theme-text-primary)]"
                                    placeholder="QTY"
                                />
                                <button
                                    type="button" disabled={savingId === item.productId || isLoading}
                                    onClick={() => void saveCount(item)}
                                    className="min-h-[44px] rounded-xl bg-[var(--theme-accent)] px-3 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    {savingId === item.productId
                                        ? t('warehouse.savingProgress')
                                        : item.canCount && item.status !== 'Pending'
                                            ? t('warehouse.recountWord')
                                            : t('warehouse.recordWord')}
                                </button>
                            </div>
                        ) : (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--theme-text-secondary)]">
                                <CheckCircle size={16} />
                                {item.status === 'Recount Required' ? t('warehouse.waitingForAnotherWorker') : t('warehouse.savedWord')}
                            </span>
                        )}
                    </div>
                );
            })}

            <div className="flex justify-end border-t border-[var(--theme-border)] pt-3">
                <button type="button" disabled={!canFinish || isFinishing || isLoading} onClick={() => void finish()}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--theme-accent)] px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    <Send size={16} />{isFinishing ? t('warehouse.submittingProgress') : t('warehouse.completeAndSubmitVariances')}
                </button>
            </div>
        </div>
    );
};

export default CountOperations;
