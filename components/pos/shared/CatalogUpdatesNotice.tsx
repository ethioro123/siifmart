import { useEffect, useState } from 'react';
import { Bell, ArrowRight, PackagePlus, Tag, Package } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { getEffectiveRetailPrice } from '../utils/priceUpdates';
import { getPOSCatalogUpdates, type CatalogUpdateKind } from '../../../utils/posCatalogUpdates';
const keys: Record<CatalogUpdateKind, string> = { new: 'catalogNew', price: 'catalogPrice', updated: 'catalogOther' };
const icons = { new: PackagePlus, price: Tag, updated: Package };
export function CatalogUpdatesNotice({ namespace }: { namespace: 'pos' | 'posCommand' }) {
  const { products, activeSite } = useData();
  const { user } = useStore();
  const { t } = useLanguage();
  const identity = `${user?.id || ''}:${activeSite?.country || ''}:${activeSite?.id || ''}`;
  const [opened, setOpened] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<CatalogUpdateKind | 'all'>('all');
  const [now, setNow] = useState(Date.now);
  useEffect(() => { setOpened(null); setPage(0); setFilter('all'); setNow(Date.now()); }, [identity]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  const updates = getPOSCatalogUpdates(products, activeSite?.id, activeSite?.country, now);
  const selected = updates.filter(update => filter === 'all' || update.kinds.includes(filter));
  const lastPage = Math.max(0, Math.ceil(selected.length / 25) - 1);
  const currentPage = Math.min(page, lastPage);
  const tr = (key: string, params?: Record<string, string | number>) => t(`${namespace}.${key}`, params);
  if (!user?.id || !activeSite) return null;
  return <>
    {updates.length > 0 && <button type="button" onClick={() => { setOpened(identity); setFilter('all'); setPage(0); setNow(Date.now()); }}
      aria-label={tr('catalogUpdatesCount', { count: updates.length })}
      className="min-h-11 max-w-full inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-sm font-medium hover:bg-[var(--theme-bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
      <Bell size={17} aria-hidden="true" /><span>{tr('catalogUpdates')}</span><span className="font-semibold tabular-nums">{updates.length}</span><ArrowRight size={15} aria-hidden="true" />
    </button>}
    <Modal isOpen={opened === identity} onClose={() => setOpened(null)} title={tr('catalogUpdates')} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-[var(--theme-text-secondary)]">{activeSite.name} · {tr('catalogWindow')}</p>
        <p className="text-sm text-[var(--theme-text-secondary)]">{tr('catalogScopeNote')}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={tr('catalogUpdateFilters')}>
          {(['all', 'new', 'price', 'updated'] as const).map(kind => {
            const count = kind === 'all' ? updates.length : updates.filter(update => update.kinds.includes(kind)).length;
            return <button key={kind} type="button" aria-pressed={filter === kind} onClick={() => { setFilter(kind); setPage(0); }}
              className={`min-h-11 px-3 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${filter === kind ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]'}`}>
              {tr(kind === 'all' ? 'catalogAll' : keys[kind])} <span className="tabular-nums">{count}</span>
            </button>;
          })}
        </div>
        {selected.length === 0 ? <p role="status" className="py-6 text-sm text-[var(--theme-text-secondary)]">{tr('catalogEmpty')}</p> :
          <ul className="divide-y divide-[var(--theme-border-subtle)]">{selected.slice(currentPage * 25, (currentPage + 1) * 25).map(update => <li key={update.product.id} className="py-4 space-y-2">
            <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold text-[var(--theme-text-primary)] break-words">{update.product.name}</h3><p className="text-sm text-[var(--theme-text-secondary)]">{update.product.sku}</p></div>
              <time dateTime={new Date(update.timestamp).toISOString()} className="text-sm text-[var(--theme-text-secondary)]">{new Date(update.timestamp).toLocaleString()}</time></div>
            {typeof update.product.price === 'number' && Number.isFinite(update.product.price) && <p className="text-sm text-[var(--theme-text-primary)]">{tr('catalogCurrentPrice')}: <span className="font-semibold tabular-nums">{CURRENCY_SYMBOL} {formatPriceValue(getEffectiveRetailPrice(update.product))}</span></p>}
            <div className="flex flex-wrap gap-2">{update.kinds.map(kind => { const Icon = icons[kind]; return <span key={kind} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--theme-status-info-text)]"><Icon size={14} aria-hidden="true" />{tr(keys[kind])}</span>; })}</div>
          </li>)}</ul>}
        {selected.length > 25 && <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="min-h-11 px-3 rounded-xl disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">{tr('catalogPrevious')}</button>
          <span className="text-sm text-[var(--theme-text-secondary)]">{tr('catalogPage', { page: currentPage + 1, total: lastPage + 1 })}</span>
          <button type="button" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)} className="min-h-11 px-3 rounded-xl disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">{tr('catalogNext')}</button>
        </div>}
      </div>
    </Modal>
  </>;
}
