import { useCallback, useEffect, useRef, useState } from 'react';
import { posCatalogReadsService, type CatalogRead } from '../services/pos-catalog-reads.service';
import type { CatalogUpdate } from '../utils/posCatalogUpdates';
export function catalogReadReceipts(updates: CatalogUpdate[]): CatalogRead[] {
  return updates.flatMap(update => (['new','updated'] as const).flatMap(kind => {
    const time = update.observations[kind];
    return time === undefined ? [] : [{ product_id: update.product.id, kind, read_through: new Date(time).toISOString() }];
  }));
}
export function unreadCatalogProducts(updates: CatalogUpdate[], reads: CatalogRead[]): number {
  const seen = new Map(reads.map(row => [`${row.product_id}:${row.kind}`, Date.parse(row.read_through)]));
  return new Set(catalogReadReceipts(updates).filter(row => Date.parse(row.read_through) > (seen.get(`${row.product_id}:${row.kind}`) || 0)).map(row => row.product_id)).size;
}
export function usePOSCatalogReads(userId: string | undefined, siteId: string | undefined, country: string | undefined, updates: CatalogUpdate[]) {
  const identity = `${userId || ''}:${siteId || ''}:${country || ''}`;
  const ids = [...new Set(catalogReadReceipts(updates).map(row => row.product_id))].sort().join(',');
  const [saved, setSaved] = useState<{identity: string; reads: CatalogRead[]}>({identity:'',reads:[]});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const current = useRef(identity); current.current = identity;
  const generation = useRef(0);
  const retry = useCallback(async () => {
    const version = ++generation.current;
    if (!userId || !siteId || !country) return;
    setLoading(true); setError(null);
    try {
      const reads = await posCatalogReadsService.list(userId, siteId, country, ids ? ids.split(',') : []);
      if (version !== generation.current || current.current !== identity) return;
      setSaved({identity, reads});
    } catch {
      if (version === generation.current && current.current === identity) setError('load');
    } finally { if (version === generation.current && current.current === identity) setLoading(false); }
  }, [userId, siteId, country, ids, identity]);
  useEffect(() => {
    setSaving(false); void retry();
    const refresh = () => { if (document.visibilityState === 'visible') void retry(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { generation.current++; window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [retry]);
  const reads = saved.identity === identity ? saved.reads : [];
  const markPageRead = async (visible: CatalogUpdate[]) => {
    if (!userId || !siteId || !country || saving) return;
    const receipts = catalogReadReceipts(visible);
    if (!receipts.length) return;
    setSaving(true);
    try {
      await posCatalogReadsService.mark(siteId, country, receipts);
      if (current.current !== identity) return;
      generation.current++;
      setSaved(previous => {
        const merged = new Map((previous.identity === identity ? previous.reads : []).map(row => [`${row.product_id}:${row.kind}`, row]));
        for (const row of receipts) { const key = `${row.product_id}:${row.kind}`; if (Date.parse(row.read_through) > Date.parse(merged.get(key)?.read_through || '1970-01-01')) merged.set(key, row); }
        return {identity, reads:[...merged.values()]};
      });
      setLoading(false); setError(null);
    } catch { if (current.current === identity) setError('save'); }
    finally { if (current.current === identity) setSaving(false); }
  };
  return { reads, unreadCount: unreadCatalogProducts(updates, reads), isLoading: loading || saved.identity !== identity, error, saving, retry, markPageRead };
}
