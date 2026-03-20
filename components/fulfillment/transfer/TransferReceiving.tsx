import React from 'react';
import { ArrowDown, Box } from 'lucide-react';
import { WMSJob, Site, ReceivingItem, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';

interface TransferReceivingProps {
    activeTransferJob: WMSJob;
    transferReceiveItems: ReceivingItem[];
    setTransferReceiveItems: (items: ReceivingItem[]) => void;
    setTransferReceiveMode: (val: boolean) => void;
    setActiveTransferJob: (job: WMSJob | null) => void;
    allProducts: Product[];
    wmsJobsService: any;
    adjustStockMutation: any;
    addNotification: (type: string, message: string) => void;
    refreshData: () => Promise<void>;
    activeSite: Site | null;
}

export const TransferReceiving: React.FC<TransferReceivingProps> = ({
    activeTransferJob,
    transferReceiveItems,
    setTransferReceiveItems,
    setTransferReceiveMode,
    setActiveTransferJob,
    allProducts,
    wmsJobsService,
    adjustStockMutation,
    addNotification,
    refreshData,
    activeSite
}) => {
    const handleConfirmReceipt = async () => {
        if (!activeTransferJob) return;
        try {
            // Update job status to Received
            await wmsJobsService.update(activeTransferJob.id, {
                transferStatus: 'Received',
                status: 'Completed',
                // Note: ideally we update lineItems with receivedQty too in a real backend, 
                // but local 'transferReceiveItems' logic here might be distinct. 
                // If backend updates lineItems, we should pass that.
            });

            // Process stock adjustments
            for (const item of transferReceiveItems) {
                if ((item.receivedQty || 0) > 0) {
                    const product = allProducts.find(p => p.id === item.productId);
                    await adjustStockMutation.mutateAsync({
                        productId: item.productId,
                        productName: product?.name || 'Unknown',
                        productSku: product?.sku || 'N/A',
                        siteId: activeSite?.id || '',
                        quantity: item.receivedQty,
                        type: 'IN',
                        reason: `Transfer Receipt ${activeTransferJob.orderRef}`,
                        canApprove: true
                    });
                }
            }

            addNotification('success', 'Transfer received successfully');
            setTransferReceiveMode(false);
            setActiveTransferJob(null);
            setTransferReceiveItems([]);
            refreshData();
        } catch (err) {
            console.error('Failed to receive transfer:', err);
            addNotification('alert', 'Failed to receive items');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                            <ArrowDown className="text-green-500" size={24} />
                            Receiving Transfer
                        </h3>
                        {activeTransferJob && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-cyber-primary font-mono text-xs">{formatJobId(activeTransferJob)}</span>
                                <span className="text-gray-500 text-xs">•</span>
                                <span className="text-gray-400 text-xs">{activeTransferJob.items} Items</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setTransferReceiveMode(false);
                            setActiveTransferJob(null);
                            setTransferReceiveItems([]);
                        }}
                        className="px-4 py-2 bg-white/5 text-gray-400 hover:text-white rounded-lg font-bold transition-all text-xs"
                    >
                        Cancel Receipt
                    </button>
                </div>
            </div>

            {/* Receive List */}
            <div className="flex-1 bg-cyber-gray border border-white/5 rounded-2xl p-6 overflow-hidden flex flex-col">
                <div className="overflow-y-auto space-y-4 custom-scrollbar flex-1 pb-4">
                    {transferReceiveItems.map((item, idx) => {
                        const product = allProducts.find(p => p.id === item.productId);
                        return (
                            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex gap-4">
                                <div className="w-16 h-16 bg-black/40 rounded-lg flex items-center justify-center shrink-0">
                                    {product?.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg opacity-80" />
                                    ) : (
                                        <Box className="text-gray-600" size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-white truncate text-sm">{product?.name || 'Unknown Item'}</h4>
                                            <p className="text-[10px] text-gray-500 font-mono">{product?.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Expected</span>
                                            <p className="font-mono text-white font-bold">
                                                {item.expectedQty}
                                                {product?.unit && getSellUnit(product.unit).code !== 'UNIT' && (
                                                    <span className="text-[10px] text-gray-500 font-bold ml-1 uppercase">{getSellUnit(product.unit).shortLabel}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label htmlFor={`received-qty-${idx}`} className="text-[10px] text-gray-500 uppercase font-black mb-1 block">
                                                Received Qty{product?.unit && getSellUnit(product.unit).code !== 'UNIT' ? ` (${getSellUnit(product.unit).shortLabel})` : ''}
                                            </label>
                                            <input
                                                id={`received-qty-${idx}`}
                                                type="number"
                                                step={product?.unit && getSellUnit(product.unit).allowDecimal ? '0.01' : '1'}
                                                value={item.receivedQty}
                                                onChange={(e) => {
                                                    const newItems = [...transferReceiveItems];
                                                    const unitDef = getSellUnit(product?.unit);
                                                    newItems[idx].receivedQty = unitDef.allowDecimal ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0;
                                                    setTransferReceiveItems(newItems);
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                                aria-label={`Received quantity for ${product?.name || 'item'}`}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`condition-${idx}`} className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Condition</label>
                                            <select
                                                id={`condition-${idx}`}
                                                value={item.condition}
                                                onChange={(e) => {
                                                    const newItems = [...transferReceiveItems];
                                                    newItems[idx].condition = e.target.value as any;
                                                    setTransferReceiveItems(newItems);
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyber-primary focus:outline-none"
                                                aria-label={`Condition for ${product?.name || 'item'}`}
                                            >
                                                <option value="Good">Good</option>
                                                <option value="Damaged">Damaged</option>
                                                <option value="Missing">Missing</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="pt-4 border-t border-white/10 mt-2">
                    <button
                        onClick={handleConfirmReceipt}
                        className="w-full py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
                    >
                        Confirm Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};
