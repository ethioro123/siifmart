import React, { useState, useEffect } from 'react';
import { Truck, Search, Plus, X, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';
import { WMSJob, Product, Site, User } from '../../../types';
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
    }, [isOpen, user, activeSite]);

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
            const destSiteObj = sites.find(s => s.id === transferDestSite);

            const lineItems = transferItems.map(item => {
                const p = allProducts.find(prod => prod.id === item.productId);
                const unitDef = getSellUnit(p?.unit || '');
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

            // Target transfer id for wms_jobs
            const transferJob = {
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Requested',
                sourceSiteId: actualSourceSite,
                destSiteId: transferDestSite,
                lineItems,
                items: lineItems.reduce((acc, curr) => acc + (curr.expectedQty || 0), 0),
                priority: transferPriority,
                notes: transferNote,
                siteId: actualSourceSite
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full h-full md:p-8 flex flex-col">
                <div className="flex-1 bg-cyber-gray md:rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(168,85,247,0.1)] flex flex-col overflow-hidden relative">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Truck className="text-cyber-primary" />
                                {t('warehouse.createTransferRequest')}
                            </h2>
                            <p className="text-gray-400 text-xs mt-1">{t('warehouse.requestManageTransfers')}</p>
                        </div>
                        {renderTabs()}
                        <button onClick={onClose} aria-label={t('warehouse.dismiss')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="source-site-select" className="block text-xs font-bold text-gray-400 uppercase mb-1.5">{t('warehouse.from')} (Source)</label>
                                        <select
                                            id="source-site-select"
                                            value={transferSourceSite}
                                            onChange={(e) => setTransferSourceSite(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none ${
                                                isRestricted 
                                                    ? 'text-white/55 cursor-not-allowed' 
                                                    : 'text-white focus:border-cyber-primary'
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
                                        <label htmlFor="dest-site-select" className="block text-xs font-bold text-gray-400 uppercase mb-1.5">{t('warehouse.to')} (Target)</label>
                                        <select
                                            id="dest-site-select"
                                            value={transferDestSite}
                                            onChange={(e) => setTransferDestSite(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                            aria-label="Select Destination Site"
                                        >
                                            <option value="">Select Destination</option>
                                            {sites.filter(s => {
                                                const isSelf = s.id === (transferSourceSite || activeSite?.id);
                                                const isAdminSite = s.type === 'Administration';
                                                if (isSelf || isAdminSite) return false;

                                                if (settings?.enforceRegionalZoning && user?.role !== 'super_admin') {
                                                    const sourceSiteObj = sites.find(x => x.id === (transferSourceSite || activeSite?.id));
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
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('warehouse.putaway.itemsToPutaway')}</label>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                                        {transferItems.map((item, idx) => {
                                            const prod = allProducts.find(p => p.id === item.productId);
                                            return (
                                                <div key={idx} className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold text-white mb-0.5">{prod?.name || 'Unknown Item'}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-gray-555 font-mono bg-white/5 px-1.5 py-0.5 rounded">{prod?.sku}</span>
                                                            {(() => {
                                                                const sourceStockItem = allProducts.find(p => p.sku === prod?.sku && p.siteId === transferSourceSite);
                                                                const rawStock = sourceStockItem?.stock || 0;
                                                                const unitDef = getSellUnit(sourceStockItem?.unit || prod?.unit || '');
                                                                const sizeNum = parseFloat(sourceStockItem?.size || prod?.size || '0');
                                                                const isWeightVol = unitDef.category === 'weight' || unitDef.category === 'volume';
                                                                const displayStock = isWeightVol && sizeNum > 0 ? rawStock * sizeNum : rawStock;
                                                                const deduction = (isWeightVol && sizeNum > 0 && !item.isMeasure) ? item.quantity * sizeNum : item.quantity;
                                                                const displayRemaining = displayStock - deduction;
                                                                const unitLabel = unitDef.code !== 'UNIT' ? ` ${unitDef.shortLabel} ` : '';
                                                                const isWarning = displayRemaining < 0;
                                                                return (
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${isWarning ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                                                        Source: {displayStock.toLocaleString()}{unitLabel} ➔ Rem: {displayRemaining.toLocaleString()}{unitLabel}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-555">Qty:</span>
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
                                                                className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white text-center focus:border-cyber-primary focus:outline-none"
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
                                                                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-bold uppercase text-white focus:border-cyber-primary focus:outline-none ml-1 cursor-pointer hover:bg-white/5 transition-colors"
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
                                                            className="p-1.5 hover:bg-red-500/20 text-gray-555 hover:text-red-400 rounded transition-colors"
                                                            aria-label="Remove Item"
                                                        >
                                                            <Trash2 size={14} />
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
                                                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} /> {t('warehouse.addTransferItem')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="priority-select" className="block text-xs font-bold text-gray-400 uppercase mb-1.5">{t('warehouse.priority')}</label>
                                        <select
                                            id="priority-select"
                                            value={transferPriority}
                                            onChange={(e) => setTransferPriority(e.target.value as any)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                            aria-label="Select Transfer Priority"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Normal">Normal</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">{t('warehouse.putaway.jobDetails')}</label>
                                        <input
                                            type="text"
                                            value={transferNote}
                                            onChange={(e) => setTransferNote(e.target.value)}
                                            placeholder="Reason for transfer..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/10 bg-black/20 flex gap-3 justify-end">
                        {isReviewMode ? (
                            <>
                                <button
                                    onClick={() => setIsReviewMode(false)}
                                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 font-bold text-sm transition-colors"
                                >
                                    Back to Edit
                                </button>
                                <button
                                    onClick={handleCreateTransfer}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-cyber-primary text-black rounded-lg font-bold text-sm hover:bg-cyber-accent transition-colors shadow-lg shadow-cyber-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Confirming...' : t('warehouse.confirm')}
                                    <ArrowRight size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 font-bold text-sm transition-colors"
                                >
                                    {t('warehouse.dismiss')}
                                </button>
                                <button
                                    onClick={handleReviewRequest}
                                    disabled={transferItems.length === 0}
                                    className="px-6 py-2 bg-white/10 text-white rounded-lg font-bold text-sm hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
