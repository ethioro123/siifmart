import React from 'react';
import { ArrowRightLeft, Sparkles } from 'lucide-react';
import type { Site, TransferRecord } from '../../types';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { transfersService } from '../../services/transfers.service';
import { logger } from '../../utils/logger';

interface StockRebalanceRecommendationsProps {
  regionCode: string;
  regionalSites: Site[];
  onTransferCreated: (transfer: TransferRecord) => void;
}

export const StockRebalanceRecommendations: React.FC<StockRebalanceRecommendationsProps> = ({
  regionCode,
  regionalSites,
  onTransferCreated
}) => {
  const { user } = useStore();
  const { products, addNotification } = useData();

  // Intelligent Inter-Store Stock Balancing Recommendations
  const rebalanceRecommendations = React.useMemo(() => {
    if (!products || products.length === 0 || regionalSites.length < 2) return [];

    const recs: Array<{
      id: string;
      productName: string;
      sku: string;
      sourceSite: Site;
      destSite: Site;
      suggestedQty: number;
      sourceStock: number;
      destStock: number;
    }> = [];

    const skuMap = new Map<string, typeof products>();
    products.forEach(p => {
      if (!p.sku) return;
      const list = skuMap.get(p.sku) || [];
      list.push(p);
      skuMap.set(p.sku, list);
    });

    for (const [sku, items] of skuMap.entries()) {
      const regionalItems = items.filter(i => regionalSites.some(s => s.id === i.siteId));
      if (regionalItems.length < 2) continue;

      const surplus = regionalItems.find(i => (i.stock || 0) >= 25);
      const deficit = regionalItems.find(i => (i.stock || 0) <= 5 && i.siteId !== surplus?.siteId);

      if (surplus && deficit) {
        const srcSite = regionalSites.find(s => s.id === surplus.siteId);
        const dstSite = regionalSites.find(s => s.id === deficit.siteId);
        if (srcSite && dstSite) {
          recs.push({
            id: `${sku}-${srcSite.id}-${dstSite.id}`,
            productName: surplus.name,
            sku: surplus.sku,
            sourceSite: srcSite,
            destSite: dstSite,
            suggestedQty: Math.min(10, Math.floor(((surplus.stock || 0) - 10) / 2)),
            sourceStock: surplus.stock || 0,
            destStock: deficit.stock || 0
          });
        }
      }
      if (recs.length >= 2) break;
    }
    return recs;
  }, [products, regionalSites]);

  const handleExecuteRebalance = async (rec: typeof rebalanceRecommendations[0]) => {
    try {
      const created = await transfersService.create({
        sourceSiteId: rec.sourceSite.id,
        destSiteId: rec.destSite.id,
        status: 'Requested',
        requestedBy: user?.name || 'Regional Stock Optimizer',
        requestedAt: new Date().toISOString(),
        items: [{
          productId: rec.id,
          productName: rec.productName,
          name: rec.productName,
          sku: rec.sku,
          quantity: rec.suggestedQty
        }],
        notes: `Automated Inter-Store Balancing: Rebalance ${rec.suggestedQty} units from ${rec.sourceSite.name} to ${rec.destSite.name}`,
        sourceRegionCode: regionCode,
        destRegionCode: regionCode,
        countryCode: regionalSites[0]?.country || (regionCode.startsWith('ET') ? 'ET' : 'KE')
      });
      onTransferCreated(created);
      addNotification?.('success', `Initiated automated stock transfer: ${rec.suggestedQty} units of ${rec.productName}.`);
    } catch (err: any) {
      logger.error('StockRebalanceRecommendations', 'Failed to create rebalance transfer', err);
      addNotification?.('alert', err.message || 'Failed to initiate transfer');
    }
  };

  if (rebalanceRecommendations.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />
          <span className="text-xs font-bold text-[var(--theme-text-primary)]">
            Autonomous Stock Balancing Opportunities
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] font-semibold">
          Territorial Equilibrium
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {rebalanceRecommendations.map(rec => (
          <div
            key={rec.id}
            className="p-3 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-col justify-between gap-2.5"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">
                  {rec.productName}
                </span>
                <span className="text-[10px] font-mono text-[var(--theme-text-secondary)]">
                  {rec.sku}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] mt-1">
                <span>From: <strong className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">{rec.sourceSite.name}</strong> ({rec.sourceStock})</span>
                <span>&rarr;</span>
                <span>To: <strong className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">{rec.destSite.name}</strong> ({rec.destStock})</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[var(--theme-border)]/50">
              <span className="text-[11px] font-medium text-[var(--theme-text-secondary)]">
                Suggested Transfer: <strong className="text-[var(--theme-text-primary)]">{rec.suggestedQty} units</strong>
              </span>
              <button
                type="button"
                onClick={() => handleExecuteRebalance(rec)}
                className="px-2.5 py-1 rounded-lg bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-90 text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Dispatch Rebalance</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
