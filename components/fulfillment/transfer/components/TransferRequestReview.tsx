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
        <div className="space-y-6">
            <div className="bg-cyber-primary/10 border border-cyber-primary/20 rounded-xl p-6">
                <h3 className="font-bold text-cyber-primary mb-4 flex items-center gap-2">
                    <Truck size={18} /> {t('warehouse.transferRequest')}
                </h3>
                {isCrossZone && settings?.enforceRegionalZoning && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-xl flex items-start gap-3 mb-6 animate-pulse">
                        <AlertTriangle className="shrink-0 mt-0.5 text-yellow-400" size={18} />
                        <div>
                            <h4 className="font-bold text-sm text-yellow-400">⚠️ Cross-Zone Replenishment Override</h4>
                            <p className="text-xs mt-1 text-yellow-500/90 leading-relaxed">
                                Transferring stock from <span className="font-bold text-white">{getZoneName(sourceSiteObj?.logisticsZoneId)}</span> to <span className="font-bold text-white">{getZoneName(destSiteObj?.logisticsZoneId)}</span>. As CEO, you are authorized to override this restriction.
                            </p>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{t('warehouse.from')}</p>
                        <p className="text-white font-medium">
                            {sites.find(s => s.id === (transferSourceSite || activeSite?.id))?.name || 'Current Site'}
                            {(() => {
                                const s = sites.find(s => s.id === (transferSourceSite || activeSite?.id));
                                return s?.logisticsZoneId ? <span className="text-[10px] text-gray-400 block mt-0.5">Zone: {getZoneName(s.logisticsZoneId)}</span> : null;
                            })()}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{t('warehouse.to')}</p>
                        <p className="text-white font-medium">
                            {sites.find(s => s.id === transferDestSite)?.name}
                            {(() => {
                                const s = sites.find(s => s.id === transferDestSite);
                                return s?.logisticsZoneId ? <span className="text-[10px] text-gray-400 block mt-0.5">Zone: {getZoneName(s.logisticsZoneId)}</span> : null;
                            })()}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">{t('warehouse.putaway.itemsToPutaway')}</p>
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
                            <div key={idx} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-550 font-mono bg-white/5 px-2 py-1 rounded">{prod?.sku}</span>
                                    <span className="text-sm font-medium text-white">{prod?.name}</span>
                                </div>
                                <div className="font-mono text-cyber-primary font-bold">
                                    {displayQty}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-cyber-primary/20">
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{t('warehouse.priority')}</p>
                        <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${transferPriority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                            transferPriority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-[#2C5E3B]/20 text-[#A9CBA2]'
                            }`}>{transferPriority}</span>
                    </div>
                    {transferNote && (
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{t('warehouse.putaway.jobDetails')}</p>
                            <p className="text-gray-300 text-sm italic">"{transferNote}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
