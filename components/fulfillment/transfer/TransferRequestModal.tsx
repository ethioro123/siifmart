import React, { useState, useEffect } from 'react';
import { Truck, Plus, X, Trash2, ArrowRight } from 'lucide-react';
import { Product, Site, User } from '../../../types';
import { ProductSelector } from './ProductSelector';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';
import { useData } from '../../../contexts/DataContext';
import { logisticsZonesService } from '../../../services/supabase.service';
import { useLanguage } from '../../../contexts/LanguageContext';
import { logger } from '../../../utils/logger';
import { TransferRequestReview } from './components/TransferRequestReview';

interface TransferRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    sites: Site[];
    products: Product[];
    allProducts: Product[];
    user: User | null;
    activeSite: Site | null;
    wmsJobsService: any;
    addNotification: (type: any, message: string) => void;
    refreshData: () => Promise<void>;
    renderTabs: () => React.ReactNode;
}

export const TransferRequestModal: React.FC<TransferRequestModalProps> = ({
    isOpen,
    onClose,
    sites,
    products,
    allProducts,
    user,
    activeSite,
    wmsJobsService,
    addNotification,
    refreshData,
    renderTabs
}) => {
    const { t } = useLanguage();
    const { settings } = useData();
    const isRestricted = !['super_admin', 'admin'].includes(user?.role || '') && !!user?.siteId;
    const [logisticsZones, setLogisticsZones] = useState<any[]>([]);
    const [transferSourceSite, setTransferSourceSite] = useState('');
    const [transferDestSite, setTransferDestSite] = useState('');
    const [transferItems, setTransferItems] = useState<{ productId: string; quantity: number, isMeasure?: boolean }[]>([]);
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [transferPriority, setTransferPriority] = useState<'Low' | 'Normal' | 'High' | 'Critical'>('Normal');
    const [transferNote, setTransferNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTransferSourceSite(isRestricted ? (user?.siteId || '') : (activeSite?.id || ''));
            setTransferDestSite('');
            setTransferItems([]);
            setTransferPriority('Normal');
            setTransferNote('');
            setIsReviewMode(false);

            // Fetch logistics zones
            const fetchZones = async () => {
                try {
                    const zones = await logisticsZonesService.getAll();
                    setLogisticsZones(zones);
                } catch (err) {
                    logger.error('TransferRequestModal', 'Failed to fetch logistics zones:', err);
                }
            };
            fetchZones();
        }
    }, [isOpen, user, activeSite, isRestricted]);

    // Reset destination site if it becomes invalid due to source site changes under regional zoning
    useEffect(() => {
        if (transferDestSite && settings?.enforceRegionalZoning && user?.role !== 'super_admin') {
            const sourceSiteObj = sites.find(s => s.id === (transferSourceSite || activeSite?.id));
            const destSiteObj = sites.find(s => s.id === transferDestSite);
            if (sourceSiteObj && destSiteObj && (sourceSiteObj.logisticsZoneId || '') !== (destSiteObj.logisticsZoneId || '')) {
                setTransferDestSite('');
            }
        }
    }, [transferSourceSite, transferDestSite, settings, user, sites, activeSite]);

    const getZoneName = (zoneId?: string) => {
        if (!zoneId) return 'Unassigned / Free Zone';
        const zone = logisticsZones.find(z => z.id === zoneId);
        return zone ? zone.name : 'Loading...';
    };

    const handleReviewRequest = () => {
        const actualSourceSite = transferSourceSite || activeSite?.id;

        if (!actualSourceSite || !transferDestSite) {
            addNotification('alert', 'Please select source and destination sites');
            return;
        }
        if (actualSourceSite === transferDestSite) {
            addNotification('alert', 'Source and destination cannot be the same');
            return;
        }

        // Validate regional zoning restriction
        if (settings?.enforceRegionalZoning && user?.role !== 'super_admin') {
            const sourceSiteObj = sites.find(s => s.id === actualSourceSite);
            const destSiteObj = sites.find(s => s.id === transferDestSite);
            if (sourceSiteObj && destSiteObj && (sourceSiteObj.logisticsZoneId || '') !== (destSiteObj.logisticsZoneId || '')) {
                addNotification('alert', `Regional Zoning Error: Cannot replenishment between ${sourceSiteObj.name} (Zone: ${getZoneName(sourceSiteObj.logisticsZoneId)}) and ${destSiteObj.name} (Zone: ${getZoneName(destSiteObj.logisticsZoneId)})`);
                return;
            }
        }

        setIsReviewMode(true);
    };

    const handleCreateTransfer = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const actualSourceSite = transferSourceSite || activeSite?.id;

            const lineItems = transferItems.map(item => {
                const p = allProducts.find(prod => prod.id === item.productId);
                const baseExpectedQty = item.quantity;
                const sizeNum = p?.size ? parseFloat(p.size as string) : 0;
                
                const expectedQty = (item.isMeasure && sizeNum > 0) ? baseExpectedQty / sizeNum : baseExpectedQty;
                
                return {
                    sku: p?.sku || '',
                    name: p?.name || '',
                    unit: p?.unit || 'pcs',
                    size: p?.size || '0',
                    expectedQty,
                    receivedQty: 0,
                    status: 'Pending',
                    productId: item.productId,
                    isMeasure: item.isMeasure || false,
                    requestedMeasureQty: item.isMeasure ? baseExpectedQty : undefined
                };
            });

            const sourceSiteObj = sites.find(s => s.id === actualSourceSite);
            const siteCountry = sourceSiteObj?.country || (sourceSiteObj as any)?.country_code || activeSite?.country || (activeSite as any)?.country_code || settings?.country || 'ET';

            // Target transfer id for wms_jobs
            const transferJob = {
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Requested',
                sourceSiteId: actualSourceSite,
                destSiteId: transferDestSite,
                lineItems,
                items: Math.ceil(lineItems.reduce((acc, curr) => acc + (curr.expectedQty || 0), 0)),
                priority: transferPriority,
                notes: transferNote,
                siteId: actualSourceSite,
                countryCode: siteCountry,
                country_code: siteCountry,
                requestedBy: user?.name || 'System'
            };

            const createdJob = await wmsJobsService.create(transferJob);
            addNotification('success', `Transfer Request ${formatJobId(createdJob)} created!`);
            onClose();
            refreshData();
        } catch (error: any) {
            logger.error('TransferRequestModal', 'Failed to create transfer:', error);
            const msg = error?.message || error?.details || JSON.stringify(error);
            addNotification('alert', `Failed to create transfer: ${msg} `);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 animate-in fade-in duration-200">
            <div className="w-full h-full md:p-6 lg:p-8 flex flex-col max-w-[1700px] max-h-[1000px]">
                <div className="flex-1 bg-[var(--theme-bg-card)] md:rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden relative">
                    <div className="p-4 md:p-5 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-subtle)] shrink-0">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2 tracking-tight">
                                <Truck className="text-primary" />
                                {t('warehouse.createTransferRequest')}
                            </h2>
                            <p className="text-[var(--theme-text-secondary)] text-xs font-semibold uppercase tracking-wider mt-0.5">{t('warehouse.requestManageTransfers')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {renderTabs()}
                            <button
                                onClick={onClose}
                                aria-label={t('warehouse.dismiss')}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs touch-manipulation"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                        {isReviewMode ? (
                            <TransferRequestReview
                                t={t}
                                transferSourceSite={transferSourceSite}
                                transferDestSite={transferDestSite}
                                transferPriority={transferPriority}
                                transferNote={transferNote}
                                sites={sites}
                                activeSite={activeSite}
                                settings={settings}
                                transferItems={transferItems}
                                allProducts={allProducts}
                                getZoneName={getZoneName}
                                getSellUnit={getSellUnit}
                            />
                        ) : (
                            <>
                                {/* Source & Dest */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="source-site-select" className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">{t('warehouse.from')} (Source)</label>
                                        <select
                                            id="source-site-select"
                                            value={transferSourceSite}
                                            onChange={(e) => setTransferSourceSite(e.target.value)}
                                            className={`w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm focus:outline-none touch-manipulation ${
                                                isRestricted 
                                                    ? 'text-[var(--theme-text-secondary)] opacity-60 cursor-not-allowed' 
                                                    : 'text-[var(--theme-text-primary)] focus:border-primary'
                                            }`}
                                            disabled={isRestricted}
                                            aria-label="Select Source Site"
                                        >
                                            {isRestricted ? (
                                                <option value={activeSite?.id || transferSourceSite}>{activeSite?.name || 'Current Site'}</option>
                                            ) : (
                                                <>
                                                    <option value="">Select Source Site</option>
                                                    {sites.map(site => (
                                                        <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="dest-site-select" className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">{t('warehouse.to')} (Target)</label>
                                        <select
                                            id="dest-site-select"
                                            value={transferDestSite}
                                            onChange={(e) => setTransferDestSite(e.target.value)}
                                            className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-primary focus:outline-none touch-manipulation"
                                            aria-label="Select Destination Site"
                                        >
                                            <option value="">Select Destination</option>
                                            {sites.filter(s => {
                                                const isSelf = s.id === (transferSourceSite || activeSite?.id);
                                                const isAdminSite = s.type === 'Administration';
                                                if (isSelf || isAdminSite) return false;

                                                const sourceSiteObj = sites.find(x => x.id === (transferSourceSite || activeSite?.id));
                                                if (sourceSiteObj && (s.country || 'ET') !== (sourceSiteObj.country || 'ET')) return false;

                                                if (settings?.enforceRegionalZoning && user?.role !== 'super_admin') {
                                                    if (sourceSiteObj) {
                                                        const sourceZone = sourceSiteObj.logisticsZoneId || '';
                                                        const destZone = s.logisticsZoneId || '';
                                                        return sourceZone === destZone;
                                                    }
                                                }
                                                return true;
                                            }).map(site => (
                                                <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">{t('warehouse.putaway.itemsToPutaway')}</label>
                                    <div className="bg-[var(--theme-bg-subtle)] rounded-2xl p-4 border border-[var(--theme-border)] space-y-3">
                                        {transferItems.map((item, idx) => {
                                            const prod = allProducts.find(p => p.id === item.productId);
                                            return (
                                                <div key={idx} className="flex items-center gap-3 bg-[var(--theme-bg-card)] p-3 rounded-xl border border-[var(--theme-border)]">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold text-[var(--theme-text-primary)] mb-0.5 truncate">{prod?.name || 'Unknown Item'}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded border border-[var(--theme-border)]">{prod?.sku}</span>
                                                            {(() => {
                                                                const sourceStockItem = allProducts.find(p => p.sku === prod?.sku && p.siteId === transferSourceSite);
                                                                const rawStock = sourceStockItem?.stock || 0;
                                                                const unitDef = getSellUnit(sourceStockItem?.unit || prod?.unit || '');
                                                                const sizeStr = sourceStockItem?.size || prod?.size;
                                                                const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && !!sizeStr;
                                                                const displayStock = rawStock;
                                                                const deduction = item.quantity;
                                                                const displayRemaining = displayStock - deduction;
                                                                const unitLabel = isWeightVol ? ` packs (${sizeStr}${unitDef.shortLabel})` : unitDef.code !== 'UNIT' ? ` ${unitDef.shortLabel}` : '';
                                                                const isWarning = displayRemaining < 0;
                                                                return (
                                                                    <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1 tabular-nums ${isWarning ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
                                                                        Source: {displayStock.toLocaleString()}{unitLabel} <ArrowRight size={10} /> Rem: {displayRemaining.toLocaleString()}{unitLabel}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs text-[var(--theme-text-secondary)]">Qty:</span>
                                                        <div className="flex gap-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const newItems = [...transferItems];
                                                                    newItems[idx].quantity = parseFloat(e.target.value) || 1;
                                                                    setTransferItems(newItems);
                                                                }}
                                                                className="w-16 min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 py-1 text-sm text-[var(--theme-text-primary)] text-center font-mono font-bold focus:border-primary focus:outline-none touch-manipulation tabular-nums"
                                                                aria-label={`Quantity for ${prod?.name || 'item'}`}
                                                            />
                                                            {(() => {
                                                                const unitDef = getSellUnit(prod?.unit || '');
                                                                const isWeightVol = unitDef.category === 'weight' || unitDef.category === 'volume';
                                                                if (isWeightVol) {
                                                                    return (
                                                                        <select
                                                                            value={item.isMeasure ? 'measure' : 'units'}
                                                                            onChange={(e) => {
                                                                                const newItems = [...transferItems];
                                                                                newItems[idx].isMeasure = e.target.value === 'measure';
                                                                                setTransferItems(newItems);
                                                                            }}
                                                                            className="min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 py-1 text-[11px] font-semibold uppercase text-[var(--theme-text-primary)] focus:border-primary focus:outline-none ml-1 cursor-pointer hover:bg-[var(--theme-bg-card)] transition-colors touch-manipulation"
                                                                            aria-label="Select unit format"
                                                                        >
                                                                            <option value="units">Units</option>
                                                                            <option value="measure">{unitDef.shortLabel}</option>
                                                                        </select>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newItems = [...transferItems];
                                                                newItems.splice(idx, 1);
                                                                setTransferItems(newItems);
                                                            }}
                                                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors touch-manipulation"
                                                            aria-label="Remove Item"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {isSearchingProduct ? (
                                            <div className="mt-4">
                                                <ProductSelector
                                                    products={allProducts}
                                                    onSelect={(product) => {
                                                        const existingIdx = transferItems.findIndex(i => i.productId === product.id);
                                                        if (existingIdx >= 0) {
                                                            const newItems = [...transferItems];
                                                            newItems[existingIdx].quantity += 1;
                                                            setTransferItems(newItems);
                                                            addNotification('success', `Increased ${product.name} quantity to ${newItems[existingIdx].quantity} `);
                                                        } else {
                                                            setTransferItems([...transferItems, { productId: product.id, quantity: 1 }]);
                                                            addNotification('success', `Added ${product.name} to request`);
                                                        }
                                                    }}
                                                    onCancel={() => setIsSearchingProduct(false)}
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsSearchingProduct(true)}
                                                className="w-full min-h-[44px] py-3 border border-dashed border-[var(--theme-border)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-primary hover:bg-[var(--theme-bg-card)] transition-all flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-wider touch-manipulation"
                                            >
                                                <Plus size={16} /> {t('warehouse.addTransferItem')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="priority-select" className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">{t('warehouse.priority')}</label>
                                        <select
                                            id="priority-select"
                                            value={transferPriority}
                                            onChange={(e) => setTransferPriority(e.target.value as any)}
                                            className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-primary focus:outline-none touch-manipulation"
                                            aria-label="Select Transfer Priority"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Normal">Normal</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1.5">{t('warehouse.putaway.jobDetails')}</label>
                                        <input
                                            type="text"
                                            value={transferNote}
                                            onChange={(e) => setTransferNote(e.target.value)}
                                            placeholder="Reason for transfer..."
                                            className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-primary focus:outline-none touch-manipulation"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-4 md:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex gap-3 justify-end shrink-0">
                        {isReviewMode ? (
                            <>
                                <button
                                    onClick={() => setIsReviewMode(false)}
                                    className="min-h-[44px] px-4 py-2 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] font-semibold text-xs uppercase tracking-wider transition-colors touch-manipulation"
                                >
                                    Back to Edit
                                </button>
                                <button
                                    onClick={handleCreateTransfer}
                                    disabled={isSubmitting}
                                    className="min-h-[44px] px-6 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 cursor-pointer touch-manipulation"
                                >
                                    {isSubmitting ? 'Confirming...' : t('warehouse.confirm')}
                                    <ArrowRight size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    className="min-h-[44px] px-4 py-2 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] font-semibold text-xs uppercase tracking-wider transition-colors touch-manipulation"
                                >
                                    {t('warehouse.dismiss')}
                                </button>
                                <button
                                    onClick={handleReviewRequest}
                                    disabled={transferItems.length === 0}
                                    className="min-h-[44px] px-6 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 touch-manipulation"
                                >
                                    {t('warehouse.transferRequest')}
                                    <ArrowRight size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
