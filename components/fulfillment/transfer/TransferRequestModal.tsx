import React, { useState, useEffect } from 'react';
import { Truck, Search, Plus, X, Trash2, ArrowRight } from 'lucide-react';
import { WMSJob, Product, Site, User } from '../../../types';
import { ProductSelector } from './ProductSelector';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';

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
    const [transferSourceSite, setTransferSourceSite] = useState('');
    const [transferDestSite, setTransferDestSite] = useState('');
    const [transferItems, setTransferItems] = useState<{ productId: string; quantity: number, isMeasure?: boolean }[]>([]);
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [transferPriority, setTransferPriority] = useState<'Low' | 'Normal' | 'High' | 'Critical'>('Normal');
    const [transferNote, setTransferNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const isRestricted = !['super_admin', 'admin'].includes(user?.role || '') && !!user?.siteId;
            setTransferSourceSite(isRestricted ? (user?.siteId || '') : (activeSite?.id || ''));
            setTransferDestSite('');
            setTransferItems([]);
            setTransferPriority('Normal');
            setTransferNote('');
            setIsReviewMode(false);
        }
    }, [isOpen, user, activeSite]);

    const handleReviewRequest = () => {
        const actualSourceSite = transferSourceSite || activeSite?.id;

        if (!actualSourceSite || !transferDestSite) {
            addNotification('alert', 'Please select destination site');
            return;
        }
        if (actualSourceSite === transferDestSite) {
            addNotification('alert', 'Source and destination cannot be the same');
            return;
        }
        if (transferItems.length === 0) {
            addNotification('alert', 'Please add at least one item');
            return;
        }

        // Validate that requested amount does not exceed available stock
        for (const item of transferItems) {
            const product = allProducts.find(p => p.id === item.productId);
            const sourceStockItem = allProducts.find(p => p.sku === product?.sku && p.siteId === actualSourceSite);

            const rawStock = sourceStockItem?.stock || 0;
            const unitDef = getSellUnit(sourceStockItem?.unit || product?.unit || '');
            const sizeNum = parseFloat(sourceStockItem?.size || product?.size || '0');
            const isWeightVol = unitDef.category === 'weight' || unitDef.category === 'volume';

            const displayStock = isWeightVol && sizeNum > 0 ? rawStock * sizeNum : rawStock;
            const deduction = (isWeightVol && sizeNum > 0 && !item.isMeasure) ? item.quantity * sizeNum : item.quantity;

            if (displayStock - deduction < 0) {
                addNotification('alert', `Cannot request more ${product?.name || 'items'} than available at source. Remaining would be negative.`);
                return;
            }
        }

        // Passed validation, move to review mode
        setIsReviewMode(true);
    };

    const handleCreateTransfer = async () => {
        const actualSourceSite = transferSourceSite || activeSite?.id;

        setIsSubmitting(true);
        try {
            const transferJob: any = {
                siteId: actualSourceSite, // Originating site
                site_id: actualSourceSite,
                sourceSiteId: actualSourceSite,
                destSiteId: transferDestSite,
                type: 'TRANSFER',
                status: 'Pending',
                priority: transferPriority,
                items: transferItems.length,
                lineItems: transferItems.map(item => {
                    const product = allProducts.find(p => p.id === item.productId);
                    let finalExpectedQty = item.quantity;
                    let requestedMeasureQty: number | undefined = undefined;

                    if (item.isMeasure) {
                        const unitDef = getSellUnit(product?.unit || '');
                        const sizeNum = parseFloat(product?.size || '0');
                        if ((unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0) {
                            requestedMeasureQty = item.quantity; // Save exact measure requested
                            finalExpectedQty = Math.ceil(item.quantity / sizeNum); // convert requested measure to required packages
                        }
                    }

                    return {
                        productId: item.productId,
                        sku: product?.sku || '',
                        name: product?.name || '',
                        image: product?.image || '',
                        expectedQty: finalExpectedQty,
                        requestedMeasureQty, // Persisted for exact UI representation
                        pickedQty: 0,
                        status: 'Pending'
                    };
                }),
                orderRef: `${Date.now()}`,
                transferStatus: 'Requested',
                requestedBy: user?.name || 'System',
                note: transferNote,
                jobNumber: undefined
            };

            const createdJob = await wmsJobsService.create(transferJob);
            addNotification('success', `Transfer Request ${formatJobId(createdJob)} created!`);
            onClose();
            refreshData();
        } catch (error: any) {
            console.error('Failed to create transfer:', error);
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
                                New Transfer Request
                            </h2>
                            <p className="text-gray-400 text-xs mt-1">Request stock from another location</p>
                        </div>
                        {renderTabs()}
                        <button onClick={onClose} aria-label="Close Modal" className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {isReviewMode ? (
                            <div className="space-y-6">
                                <div className="bg-cyber-primary/10 border border-cyber-primary/20 rounded-xl p-6">
                                    <h3 className="font-bold text-cyber-primary mb-4 flex items-center gap-2">
                                        <Truck size={18} /> Review Transfer Request
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">From (Source)</p>
                                            <p className="text-white font-medium">{sites.find(s => s.id === (transferSourceSite || activeSite?.id))?.name || 'Current Site'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">To (Destination)</p>
                                            <p className="text-white font-medium">{sites.find(s => s.id === transferDestSite)?.name}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Items Requesting</p>
                                        {transferItems.map((item, idx) => {
                                            const prod = allProducts.find(p => p.id === item.productId);
                                            const unitDef = getSellUnit(prod?.unit || '');
                                            let displayQty = `${item.quantity} `;
                                            if (item.isMeasure) {
                                                displayQty = `${item.quantity} ${unitDef.shortLabel}`;
                                            } else {
                                                displayQty = `${item.quantity} Units`;
                                            }

                                            return (
                                                <div key={idx} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">{prod?.sku}</span>
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
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Priority</p>
                                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${transferPriority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                                transferPriority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>{transferPriority}</span>
                                        </div>
                                        {transferNote && (
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Note</p>
                                                <p className="text-gray-300 text-sm italic">"{transferNote}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Source & Dest */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="source-site-select" className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Request From (Source)</label>
                                        <select
                                            id="source-site-select"
                                            value={transferSourceSite}
                                            onChange={(e) => setTransferSourceSite(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/50 cursor-not-allowed focus:outline-none"
                                            disabled
                                            aria-label="Select Source Site"
                                        >
                                            <option value={activeSite?.id || transferSourceSite}>{activeSite?.name || 'Current Site'}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="dest-site-select" className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Destination (Target)</label>
                                        <select
                                            id="dest-site-select"
                                            value={transferDestSite}
                                            onChange={(e) => setTransferDestSite(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                            aria-label="Select Destination Site"
                                        >
                                            <option value="">Select Destination</option>
                                            {sites.filter(s => s.id !== (transferSourceSite || activeSite?.id) && s.type !== 'Administration').map(site => (
                                                <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Items to Request</label>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                                        {transferItems.map((item, idx) => {
                                            const prod = allProducts.find(p => p.id === item.productId);
                                            return (
                                                <div key={idx} className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold text-white mb-0.5">{prod?.name || 'Unknown Item'}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">{prod?.sku}</span>
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
                                                        <span className="text-xs text-gray-500">Qty:</span>
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
                                                            className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-colors"
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
                                                        // Deliberately NOT calling setIsSearchingProduct(false) here
                                                        // so the user can continue adding products quickly.
                                                    }}
                                                    onCancel={() => setIsSearchingProduct(false)}
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsSearchingProduct(true)}
                                                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} /> Add Product to Request
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="priority-select" className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Priority</label>
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
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Note (Optional)</label>
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
                                    {isSubmitting ? 'Confirming...' : 'Confirm Transfer'}
                                    <ArrowRight size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 font-bold text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReviewRequest}
                                    disabled={transferItems.length === 0}
                                    className="px-6 py-2 bg-white/10 text-white rounded-lg font-bold text-sm hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Review Request
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
