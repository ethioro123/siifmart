import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Truck, X, ArrowRight } from 'lucide-react';
import { Product, Site, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';
import { useData } from '../../../contexts/DataContext';
import { logisticsZonesService, productsService } from '../../../services/supabase.service';
import { useLanguage } from '../../../contexts/LanguageContext';
import { logger } from '../../../utils/logger';
import { TransferRequestReview } from './components/TransferRequestReview';
import { TransferItemsSection } from './components/TransferItemsSection';

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

    const actualSourceSite = transferSourceSite || (isRestricted ? (user?.siteId || '') : (activeSite?.id || ''));
    const [fetchedSourceProducts, setFetchedSourceProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    useEffect(() => {
        if (!isOpen || !actualSourceSite) return;

        if (actualSourceSite === activeSite?.id && products.length > 0) {
            setFetchedSourceProducts([]);
            return;
        }

        const matchingInAll = allProducts.filter(p => (p.siteId || (p as any).site_id) === actualSourceSite);
        if (matchingInAll.length > 0) {
            setFetchedSourceProducts(matchingInAll);
            return;
        }

        let isCancelled = false;
        setIsLoadingProducts(true);
        productsService.getAll(actualSourceSite, 100)
            .then((res: any) => {
                if (!isCancelled && res?.data) {
                    setFetchedSourceProducts(res.data);
                }
            })
            .catch((err: any) => {
                logger.error('TransferRequestModal', 'Failed to fetch source site products:', err);
            })
            .finally(() => {
                if (!isCancelled) setIsLoadingProducts(false);
            });

        return () => {
            isCancelled = true;
        };
    }, [isOpen, actualSourceSite, activeSite?.id, products.length, allProducts]);

    const availableProducts = useMemo(() => {
        if (fetchedSourceProducts.length > 0) return fetchedSourceProducts;
        if (actualSourceSite === activeSite?.id && products.length > 0) return products;
        const siteSpecific = allProducts.filter(p => (p.siteId || (p as any).site_id) === actualSourceSite);
        if (siteSpecific.length > 0) return siteSpecific;
        return products.length > 0 ? products : allProducts;
    }, [fetchedSourceProducts, actualSourceSite, activeSite?.id, products, allProducts]);

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

        const sourceSiteObj = sites.find(s => s.id === actualSourceSite);
        const destSiteObj = sites.find(s => s.id === transferDestSite);

        // Sovereign Cross-Border Protection
        if (sourceSiteObj && destSiteObj && (sourceSiteObj.country || 'ET').toUpperCase() !== (destSiteObj.country || 'ET').toUpperCase()) {
            addNotification('alert', 'Multi-country sovereignty violation: Cross-border stock transfers are strictly forbidden.');
            return;
        }

        // Validate regional zoning restriction
        if (settings?.enforceRegionalZoning && user?.role !== 'super_admin') {
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
                const p = availableProducts.find(prod => prod.id === item.productId)
                    || products.find(prod => prod.id === item.productId)
                    || allProducts.find(prod => prod.id === item.productId);
                const baseExpectedQty = item.quantity;
                const sizeNum = p?.size ? parseFloat(p.size as string) : 0;
                
                const expectedQty = (item.isMeasure && sizeNum > 0) ? baseExpectedQty / sizeNum : baseExpectedQty;
                
                return {
                    sku: p?.sku || '',
                    name: p?.name || '',
                    unit: p?.unit || 'pcs',
                    size: p?.size || '0',
                    price: p?.price ?? 0,
                    retailPrice: p?.price ?? 0,
                    costPrice: (p as any)?.costPrice ?? (p as any)?.cost ?? 0,
                    category: p?.category || 'General',
                    brand: p?.brand || '',
                    barcode: p?.barcode || '',
                    image: p?.image || '',
                    expectedQty,
                    receivedQty: 0,
                    status: 'Pending',
                    productId: item.productId,
                    isMeasure: item.isMeasure || false,
                    requestedMeasureQty: item.isMeasure ? baseExpectedQty : undefined
                };
            });

            const sourceSiteObj = sites.find(s => s.id === actualSourceSite);
            const destSiteObj = sites.find(s => s.id === transferDestSite);
            const siteCountry = sourceSiteObj?.country || (sourceSiteObj as any)?.country_code || activeSite?.country || (activeSite as any)?.country_code || settings?.country || 'ET';
            const isInterRegion = !!(sourceSiteObj?.region_code && destSiteObj?.region_code && sourceSiteObj.region_code !== destSiteObj.region_code);

            // Target transfer id for wms_jobs
            const transferJob = {
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Requested',
                sourceSiteId: actualSourceSite,
                destSiteId: transferDestSite,
                sourceRegionCode: sourceSiteObj?.region_code,
                destRegionCode: destSiteObj?.region_code,
                isInterRegion,
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

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-200">
            <div className="w-full h-full max-w-[1700px] max-h-[96vh] md:max-h-[92vh] flex flex-col">
                <div className="flex-1 bg-[var(--theme-bg-card)] rounded-2xl md:rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden relative">
                    <div className="p-3.5 sm:p-4 md:p-5 border-b border-[var(--theme-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--theme-bg-subtle)] shrink-0">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2 tracking-tight">
                                    <Truck className="text-primary shrink-0" size={20} />
                                    <span className="truncate">{t('warehouse.createTransferRequest')}</span>
                                </h2>
                                <p className="text-[var(--theme-text-secondary)] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5 truncate">{t('warehouse.requestManageTransfers')}</p>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label={t('warehouse.dismiss')}
                                className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs touch-manipulation shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex-1 md:flex-none w-full">
                                {renderTabs()}
                            </div>
                            <button
                                onClick={onClose}
                                aria-label={t('warehouse.dismiss')}
                                className="hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs touch-manipulation shrink-0"
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
                                availableProducts={availableProducts}
                                products={products}
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
                                                    {sites.filter(site => ['Warehouse', 'Distribution Center'].includes(site.type)).map(site => (
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
                                <TransferItemsSection
                                    t={t}
                                    transferItems={transferItems}
                                    setTransferItems={setTransferItems}
                                    availableProducts={availableProducts}
                                    allProducts={allProducts}
                                    products={products}
                                    actualSourceSite={actualSourceSite}
                                    isSearchingProduct={isSearchingProduct}
                                    setIsSearchingProduct={setIsSearchingProduct}
                                    isLoadingProducts={isLoadingProducts}
                                    addNotification={addNotification}
                                />

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
                                    className="min-h-[44px] px-6 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 cursor-pointer touch-manipulation"
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
                                    className="min-h-[44px] px-6 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer touch-manipulation"
                                >
                                    {t('warehouse.transferRequest')}
                                    <ArrowRight size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
