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
                    <div className="bg-white/50 dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[#2C5E3B]/10 flex items-center justify-center mx-auto">
                            <RotateCcw size={32} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{t('pos.findTransaction')}</h3>
                        <p className="text-[#4D6E56] dark:text-gray-400 text-sm max-w-xs mx-auto">{t('pos.returnInstruction')}</p>

                        <div className="flex max-w-md mx-auto gap-2 mt-4">
                            <input
                                type="text"
                                placeholder="e.g. TX-9981"
                                className="flex-1 bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/20 rounded-xl px-4 py-3 text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors"
                                value={returnSearchId}
                                onChange={(e) => setReturnSearchId(e.target.value)}
                            />
                            <Button
                                onClick={handleSearchForReturn}
                                className="bg-[#2C5E3B] text-white px-6 rounded-xl font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm"
                            >
                                Lookup
                            </Button>
                        </div>
                        <p className="text-xs text-[#4D6E56] dark:text-gray-500 mt-2">Tip: You can use 'TX-9981' to test.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex items-center justify-between bg-[#FAF8F5] dark:bg-white/5 p-4 rounded-xl border border-[#E2DCCE] dark:border-white/5">
                            <div>
                                <p className="text-xs text-[#4D6E56] dark:text-gray-400 uppercase">Transaction ID</p>
                                <p className="text-[#1E3F27] dark:text-white font-mono font-bold">{foundSaleForReturn.receiptNumber || `SALE-${foundSaleForReturn.id.substring(0, 8).toUpperCase()}`}</p>
                                <p className="text-xs text-[#4D6E56] dark:text-gray-500">{foundSaleForReturn.date}</p>
                            </div>
                            <button onClick={() => setFoundSaleForReturn(null)} className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline">
                                {t('common.edit')}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-bold text-[#1E3F27] dark:text-white">{t('pos.selectItemsToReturn')}</p>
                            <div className="bg-[#FAF8F5] dark:bg-black/20 rounded-xl border border-[#E2DCCE] dark:border-white/5 overflow-hidden">
                                {foundSaleForReturn.items.map(item => {
                                    const itemConfig = returnConfig[item.id] || { qty: 0, condition: 'Resalable', reason: 'Customer Changed Mind' };
                                    return (
                                        <div key={item.id} className="p-4 border-b border-[#E2DCCE]/50 dark:border-white/5 last:border-0 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm text-[#1E3F27] dark:text-white font-medium">{item.name}</p>
                                                    <p className="text-xs text-[#4D6E56] dark:text-gray-500">Sold: {item.quantity} @ {formatCompactNumber(item.price, { currency: CURRENCY_SYMBOL })}</p>
                                                </div>
                                                <div className="flex items-center bg-white/90 dark:bg-black/35 rounded-lg p-1 border border-[#E2DCCE]/50 dark:border-white/5">
                                                    <button
                                                        onClick={() => updateReturnConfig(item.id, 'qty', Math.max(0, itemConfig.qty - 1))}
                                                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/10 rounded"
                                                        aria-label="Decrease return quantity"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center font-mono text-[#1E3F27] dark:text-white">{itemConfig.qty}</span>
                                                    <button
                                                        onClick={() => updateReturnConfig(item.id, 'qty', Math.min(item.quantity, itemConfig.qty + 1))}
                                                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/10 rounded"
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
                                                        className="bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-gray-300 outline-none"
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
                                                        className={`bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none font-bold ${itemConfig.condition === 'Damaged' ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-green-400'}`}
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

                        <div className="bg-white/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-white/10 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[#4D6E56] dark:text-gray-400 font-medium">{t('pos.totalRefund')}</span>
                                <span className="text-2xl font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">
                                    {CURRENCY_SYMBOL} {totalRefundAmount.toLocaleString()}
                                </span>
                            </div>

                            {totalRefundAmount > 0 && (
                                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-amber-700 dark:text-amber-200/80 font-medium">
                                        {t('pos.refundWarning')}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setFoundSaleForReturn(null)} className="flex-1 py-3 bg-white/90 dark:bg-black/35 text-stone-700 dark:text-stone-300 border border-[#E2DCCE] dark:border-white/10 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors font-bold text-sm">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProcessReturn}
                                    disabled={totalRefundAmount === 0 || isProcessing}
                                    className="flex-1 py-3 bg-gradient-to-r from-[#224429] to-[#2C5E3B] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:bg-stone-200 dark:disabled:bg-white/5 disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:shadow-none"
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
