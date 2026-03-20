import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { RotateCcw, Minus, Plus, AlertTriangle, Loader2 } from 'lucide-react';

export const ReturnModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isReturnModalOpen,
        setIsReturnModalOpen,
        foundSaleForReturn,
        setFoundSaleForReturn,
        returnSearchId,
        setReturnSearchId,
        handleSearchForReturn,
        returnConfig,
        updateReturnConfig,
        handleProcessReturn,
        isProcessing,
    } = usePOS();

    const totalRefundAmount = foundSaleForReturn
        ? foundSaleForReturn.items.reduce((sum, item) => sum + (item.price * (returnConfig[item.id]?.qty || 0)), 0)
        : 0;

    return (
        <Modal
            isOpen={isReturnModalOpen}
            onClose={() => setIsReturnModalOpen(false)}
            title="Returns Manager"
            size="lg"
        >
            <div className="space-y-6">
                {!foundSaleForReturn ? (
                    <div className="bg-black/20 border border-white/5 rounded-xl p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                            <RotateCcw size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('pos.findTransaction')}</h3>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto">{t('pos.returnInstruction')}</p>

                        <div className="flex max-w-md mx-auto gap-2 mt-4">
                            <input
                                type="text"
                                placeholder="e.g. TX-9981"
                                className="flex-1 bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary"
                                value={returnSearchId}
                                onChange={(e) => setReturnSearchId(e.target.value)}
                            />
                            <Button
                                onClick={handleSearchForReturn}
                                className="bg-cyber-primary text-black px-6 rounded-lg font-bold hover:bg-cyber-accent"
                            >
                                Lookup
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Tip: You can use 'TX-9981' to test.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Transaction ID</p>
                                <p className="text-white font-mono font-bold">{foundSaleForReturn.receiptNumber || `SALE-${foundSaleForReturn.id.substring(0, 8).toUpperCase()}`}</p>
                                <p className="text-xs text-gray-500">{foundSaleForReturn.date}</p>
                            </div>
                            <button onClick={() => setFoundSaleForReturn(null)} className="text-xs text-cyber-primary hover:underline">
                                {t('common.edit')}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-bold text-white">{t('pos.selectItemsToReturn')}</p>
                            <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                {foundSaleForReturn.items.map(item => {
                                    const itemConfig = returnConfig[item.id] || { qty: 0, condition: 'Resalable', reason: 'Customer Changed Mind' };
                                    return (
                                        <div key={item.id} className="p-4 border-b border-white/5 last:border-0 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm text-white font-medium">{item.name}</p>
                                                    <p className="text-xs text-gray-500">Sold: {item.quantity} @ {formatCompactNumber(item.price, { currency: CURRENCY_SYMBOL })}</p>
                                                </div>
                                                <div className="flex items-center gap-3 bg-black/30 rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateReturnConfig(item.id, 'qty', Math.max(0, itemConfig.qty - 1))}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded"
                                                        aria-label="Decrease return quantity"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center font-mono text-white">{itemConfig.qty}</span>
                                                    <button
                                                        onClick={() => updateReturnConfig(item.id, 'qty', Math.min(item.quantity, itemConfig.qty + 1))}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded"
                                                        aria-label="Increase return quantity"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {itemConfig.qty > 0 && (
                                                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                                                    <select
                                                        value={itemConfig.reason}
                                                        onChange={(e) => updateReturnConfig(item.id, 'reason', e.target.value)}
                                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none"
                                                        aria-label="Return reason"
                                                    >
                                                        <option>Defective</option>
                                                        <option>Expired</option>
                                                        <option>Customer Changed Mind</option>
                                                        <option>Wrong Item</option>
                                                    </select>
                                                    <select
                                                        value={itemConfig.condition}
                                                        onChange={(e) => updateReturnConfig(item.id, 'condition', e.target.value)}
                                                        className={`bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none ${itemConfig.condition === 'Damaged' ? 'text-red-400' : 'text-green-400'}`}
                                                        aria-label="Condition"
                                                    >
                                                        <option value="Resalable">Return to Stock (Resalable)</option>
                                                        <option value="Damaged">Write-off (Damaged)</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-400">{t('pos.totalRefund')}</span>
                                <span className="text-2xl font-mono font-bold text-cyber-primary">
                                    {CURRENCY_SYMBOL} {totalRefundAmount.toLocaleString()}
                                </span>
                            </div>

                            {totalRefundAmount > 0 && (
                                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                                    <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
                                    <p className="text-xs text-yellow-200/80">
                                        {t('pos.refundWarning')}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setFoundSaleForReturn(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProcessReturn}
                                    disabled={totalRefundAmount === 0 || isProcessing}
                                    className="flex-1 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <RotateCcw size={18} />}
                                    {isProcessing ? t('pos.processing') : t('pos.confirmRefund')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
