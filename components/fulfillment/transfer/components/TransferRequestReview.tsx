import React from 'react';
import { Truck, AlertTriangle } from 'lucide-react';
import { Site, Product } from '../../../../types';

interface TransferRequestReviewProps {
    t: (key: string) => string;
    transferSourceSite: string;
    transferDestSite: string;
    transferPriority: 'Low' | 'Normal' | 'High' | 'Critical';
    transferNote: string;
    sites: Site[];
    activeSite: Site | null;
    settings: any;
    transferItems: Array<{ productId: string; quantity: number; isMeasure?: boolean }>;
    allProducts: Product[];
    getZoneName: (zoneId?: string) => string;
    getSellUnit: (unit: string) => any;
}

export const TransferRequestReview: React.FC<TransferRequestReviewProps> = ({
    t,
    transferSourceSite,
    transferDestSite,
    transferPriority,
    transferNote,
    sites,
    activeSite,
    settings,
    transferItems,
    allProducts,
    getZoneName,
    getSellUnit
}) => {
    const actualSourceSite = transferSourceSite || activeSite?.id;
    const sourceSiteObj = sites.find(s => s.id === actualSourceSite);
    const destSiteObj = sites.find(s => s.id === transferDestSite);
    const isCrossZone = sourceSiteObj && destSiteObj && (sourceSiteObj.logisticsZoneId || '') !== (destSiteObj.logisticsZoneId || '');

    return (
        <div className="space-y-5">
            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs">
                <h3 className="font-bold text-[var(--theme-text-primary)] mb-4 flex items-center gap-2 tracking-tight">
                    <Truck size={18} className="text-primary" /> {t('warehouse.transferRequest')}
                </h3>
                {isCrossZone && settings?.enforceRegionalZoning && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3 mb-5">
                        <AlertTriangle className="shrink-0 mt-0.5 text-amber-500" size={18} />
                        <div>
                            <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400">Cross-Zone Replenishment Override</h4>
                            <p className="text-xs mt-1 text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                                Transferring stock from <span className="font-bold text-[var(--theme-text-primary)]">{getZoneName(sourceSiteObj?.logisticsZoneId)}</span> to <span className="font-bold text-[var(--theme-text-primary)]">{getZoneName(destSiteObj?.logisticsZoneId)}</span>. Authorized leadership override active.
                            </p>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="p-3.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl">
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1">{t('warehouse.from')}</p>
                        <p className="text-[var(--theme-text-primary)] font-medium text-sm">
                            {sites.find(s => s.id === (transferSourceSite || activeSite?.id))?.name || 'Current Site'}
                            {(() => {
                                const s = sites.find(s => s.id === (transferSourceSite || activeSite?.id));
                                return s?.logisticsZoneId ? <span className="text-[11px] text-[var(--theme-text-secondary)] block mt-0.5 font-mono">Zone: {getZoneName(s.logisticsZoneId)}</span> : null;
                            })()}
                        </p>
                    </div>
                    <div className="p-3.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl">
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1">{t('warehouse.to')}</p>
                        <p className="text-[var(--theme-text-primary)] font-medium text-sm">
                            {sites.find(s => s.id === transferDestSite)?.name}
                            {(() => {
                                const s = sites.find(s => s.id === transferDestSite);
                                return s?.logisticsZoneId ? <span className="text-[11px] text-[var(--theme-text-secondary)] block mt-0.5 font-mono">Zone: {getZoneName(s.logisticsZoneId)}</span> : null;
                            })()}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-2">{t('warehouse.putaway.itemsToPutaway')}</p>
                    {transferItems.map((item, idx) => {
                        const prod = allProducts.find(p => p.id === item.productId);
                        const unitDef = getSellUnit(prod?.unit || '');
                        let displayQty = `${item.quantity} `;
                        if (item.isMeasure) {
                            displayQty = `${item.quantity} ${unitDef.shortLabel}`;
                        } else {
                            displayQty = `${item.quantity} ${t('warehouse.itemPlural')}`;
                        }

                        return (
                            <div key={idx} className="flex justify-between items-center bg-[var(--theme-bg-card)] p-3 rounded-xl border border-[var(--theme-border)]">
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded border border-[var(--theme-border)]">{prod?.sku}</span>
                                    <span className="text-sm font-medium text-[var(--theme-text-primary)]">{prod?.name}</span>
                                </div>
                                <div className="font-mono text-primary font-bold tabular-nums">
                                    {displayQty}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-[var(--theme-border)]">
                    <div>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1">{t('warehouse.priority')}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider ${transferPriority === 'Critical' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                            transferPriority === 'High' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                                'bg-primary/20 text-primary border border-primary/30'
                            }`}>{transferPriority}</span>
                    </div>
                    {transferNote && (
                        <div>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1">{t('warehouse.putaway.jobDetails')}</p>
                            <p className="text-[var(--theme-text-secondary)] text-sm italic">"{transferNote}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
