import { useEffect, useRef, useState } from 'react';
import { CheckCheck, RefreshCw, ArrowRight } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import type { usePOSPriceHistory } from '../hooks/usePOSPriceHistory';
export type POSPriceHistoryState = ReturnType<typeof usePOSPriceHistory>;

export function ProductPriceHistoryPanel({ history }: { history: POSPriceHistoryState }) {
  const { t } = useLanguage();
  const { addNotification } = useData();
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(history.entries.length / 25) - 1));
  const visible = history.entries.slice(currentPage * 25, (currentPage + 1) * 25);
  const pendingIds = visible.filter(entry => !entry.reviewed_by_me).map(entry => entry.id);
  const markReviewed = async () => {
    if (saving || !pendingIds.length) return;
    setSaving(true);
    try {
      await history.markReviewed(pendingIds);
      if (active.current) addNotification('success', t('pos.priceReviewsSaved', { count: pendingIds.length }));
    } catch {
      if (active.current) addNotification('alert', t('pos.priceReviewsFailed'));
    } finally { if (active.current) setSaving(false); }
  };
  const buttonClass = 'min-h-11 px-3 rounded-xl bg-[var(--theme-bg-subtle)] text-sm font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
  return <div className="space-y-4">
    <p className="text-sm text-[var(--theme-text-secondary)]">{t('pos.fullHistoryForStore')}</p>
    {!history.error && !history.isLoading && <p className="text-sm text-[var(--theme-status-info-text)]">{t('pos.unreviewedUntilAcknowledged', { count: history.unreviewedCount })}</p>}
    {history.error && <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl p-3 bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)]">
      <span>{t('pos.priceHistoryUnavailable')}</span>
      <button type="button" onClick={history.retry} aria-label={t('pos.retryPriceHistory')} className={buttonClass}><RefreshCw size={17} aria-hidden="true" /></button>
    </div>}
    {history.isLoading && <p role="status">{t('pos.loadingPriceHistory')}</p>}
    {!history.isLoading && !history.error && !visible.length && <p role="status" className="py-6 text-sm text-[var(--theme-text-secondary)]">{t('pos.noPriceChangesRecorded')}</p>}
    <ul className="divide-y divide-[var(--theme-border-subtle)]">{visible.map(entry => <li key={entry.id} className="py-4 space-y-2">
      <div className="flex flex-wrap justify-between gap-2">
        <div><h3 className="font-semibold text-[var(--theme-text-primary)]">{entry.product_name}</h3><p className="text-sm text-[var(--theme-text-secondary)]">{entry.sku}</p></div>
        <span className="text-sm text-[var(--theme-status-info-text)]">{t(entry.reviewed_by_me ? 'pos.reviewed' : 'pos.new')}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm tabular-nums">
        <span>{t('pos.previousPosPrice')}: {CURRENCY_SYMBOL} {formatPriceValue(entry.old_effective_price)}</span><ArrowRight size={16} aria-hidden="true" />
        <span className="font-semibold">{t('pos.newPosPrice')}: {CURRENCY_SYMBOL} {formatPriceValue(entry.new_effective_price)}</span>
      </div>
      <p className="text-sm text-[var(--theme-text-secondary)]"><time dateTime={entry.changed_at}>{new Date(entry.changed_at).toLocaleString()}</time> · {entry.actor_name || t('pos.priceActorUnknown')}</p>
    </li>)}</ul>
    <div className="flex flex-wrap items-center gap-2">
      {history.entries.length > 25 && <>
        <button type="button" className={buttonClass} disabled={currentPage === 0 || saving} onClick={() => setPage(currentPage - 1)}>{t('pos.catalogPrevious')}</button>
        <span className="text-sm">{t('pos.catalogPage', { page: currentPage + 1, total: Math.ceil(history.entries.length / 25) })}</span>
        <button type="button" className={buttonClass} disabled={(currentPage + 1) * 25 >= history.entries.length || saving} onClick={() => setPage(currentPage + 1)}>{t('pos.catalogNext')}</button>
      </>}
      {history.hasMore && <button type="button" className={buttonClass} disabled={history.isLoadingMore || history.isLoading || saving} onClick={history.loadMore}>{t(history.isLoadingMore ? 'common.loading' : 'pos.loadOlderChanges')}</button>}
      {pendingIds.length > 0 && <button type="button" className={`${buttonClass} inline-flex items-center gap-2 ml-auto`} disabled={saving || history.isLoading || Boolean(history.error)} onClick={markReviewed}>
        <CheckCheck size={17} aria-hidden="true" />{t(saving ? 'common.loading' : 'pos.markThisPageReviewed')}
      </button>}
    </div>
  </div>;
}
