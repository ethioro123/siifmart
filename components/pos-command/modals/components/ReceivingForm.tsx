import React from 'react';
import { Clock, Scan, CheckCircle } from 'lucide-react';
import { usePOSCommand } from '../../POSCommandContext';
import { useFulfillmentData } from '../../../fulfillment/FulfillmentDataProvider';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { formatJobId } from '../../../../utils/jobIdFormatter';
import { isWeightBased, isVolumeBased } from '../../../../utils/units';

export const ReceivingForm: React.FC = () => {
    const { t } = useLanguage();
    const { jobs } = useFulfillmentData();

    const {
        selectedTransferForReceiving,
        handleCloseReceivingModal,
        transferReceivingItems,
        handleUpdateTransferItem,
        isConfirmingReceive,
        handleConfirmTransferReceiving,
        transferScanBarcode,
        setTransferScanBarcode,
        handleScanTransferItem
    } = usePOSCommand();

    if (!selectedTransferForReceiving) return null;

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {/* Back button and title */}
            <div className="flex items-center gap-3 border-b border-[#E2DCCE]/60 dark:border-white/10 pb-4">
                <button
                    onClick={() => handleCloseReceivingModal()}
                    title={t('common.back') || 'Back'}
                    aria-label={t('common.back') || 'Back'}
                    className="p-2 bg-[#F4F0E6]/60 dark:bg-white/5 hover:bg-[#2C5E3B]/10 dark:hover:bg-white/10 rounded-lg text-stone-600 dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-white transition-all active:scale-95 border border-[#E2DCCE]/50 dark:border-white/5"
                >
                    <Clock size={16} />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-[#1E3F27] dark:text-white tracking-wide">{t('posCommand.receivingShipment')}</h3>
                    <p className="text-[10px] text-stone-400 dark:text-gray-500 uppercase tracking-widest font-bold">
                        {t('posCommand.ref')}: {(() => {
                            const matchedJob = jobs.find(j => j.id === selectedTransferForReceiving || j.orderRef === selectedTransferForReceiving);
                            return matchedJob ? formatJobId(matchedJob) : selectedTransferForReceiving.substring(0, 8);
                        })()} | {t('posCommand.items')}: {transferReceivingItems.length}
                    </p>
                </div>
                <div className="ml-auto">
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-[#2C5E3B]/10 text-emerald-700 dark:text-[#A9CBA2] border border-emerald-250 dark:border-[#2C5E3B]/30 rounded-full text-xs font-bold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#A9CBA2] animate-pulse" />
                        {t('posCommand.inProgress')}
                    </span>
                </div>
            </div>

            {/* Quick Scan Input */}
            <div className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4">
                <label className="text-xs font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase block mb-2 tracking-wider flex items-center gap-2">
                    <Scan size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    {t('posCommand.scanNextItem')}
                </label>
                <div className="flex gap-2 relative">
                    <input
                        autoFocus
                        type="text"
                        value={transferScanBarcode}
                        onChange={(e) => setTransferScanBarcode(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleScanTransferItem(transferScanBarcode);
                        }}
                        placeholder={t('posCommand.scanBarcodePlaceholder')}
                        className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-3 text-[#1E3F27] dark:text-white font-mono outline-none transition-all placeholder:text-[#4D6E56]/40 dark:placeholder:text-gray-600 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-1 focus:ring-[#2C5E3B] dark:focus:ring-[#A9CBA2]"
                    />
                    <button
                        onClick={() => handleScanTransferItem(transferScanBarcode)}
                        className="px-6 py-3 bg-[#224429] dark:bg-[#2C5E3B] hover:bg-[#1B3520] dark:hover:bg-[#3a7a4d] text-white font-bold rounded-xl transition-all active:scale-95 border border-transparent shadow-sm"
                    >
                        {t('common.add')}
                    </button>
                </div>
            </div>

            {/* Items Table Grid */}
            <div className="bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-[#F4F0E6] dark:bg-white/5 sticky top-0 backdrop-blur-md z-10 border-b border-[#E2DCCE] dark:border-white/10">
                            <tr>
                                <th className="p-3 text-[10px] text-stone-500 dark:text-gray-400 uppercase font-black tracking-widest">{t('posCommand.itemDetails')}</th>
                                <th className="p-3 text-[10px] text-stone-500 dark:text-gray-400 uppercase font-black tracking-widest text-center">{t('posCommand.expected')}</th>
                                <th className="p-3 text-[10px] text-stone-500 dark:text-gray-400 uppercase font-black tracking-widest text-center">{t('posCommand.received')}</th>
                                <th className="p-3 text-[10px] text-stone-500 dark:text-gray-400 uppercase font-black tracking-widest">{t('posCommand.condition')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE]/60 dark:divide-white/5 bg-transparent">
                            {transferReceivingItems.map((item, index) => {
                                const unit = item.unit || '';
                                const sizeNum = item.productSize || 0;
                                const isWeightVol = (isWeightBased(unit) || isVolumeBased(unit)) && sizeNum > 0;

                                const casesExpected = item.displayExpectedQty || item.expectedQty;
                                const rawExpected = isWeightVol ? casesExpected * sizeNum : casesExpected;
                                const isFullyReceived = item.receivedQty >= rawExpected;
                                const isOverReceived = item.receivedQty > rawExpected;

                                return (
                                    <tr key={index} className={`transition-colors ${isFullyReceived ? 'bg-emerald-500/[0.02]' : 'hover:bg-stone-50 dark:hover:bg-white/[0.02]'}`}>
                                        <td className="p-3">
                                            <p className="text-sm font-bold text-[#1E3F27] dark:text-white mb-0.5">{item.name}</p>
                                            <p className="text-xs font-mono text-stone-600 dark:text-gray-455 bg-[#FAF8F5] dark:bg-black/40 px-1.5 py-0.5 rounded border border-[#E2DCCE] dark:border-white/5">SKU: {item.sku}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-sm font-mono text-stone-700 dark:text-gray-300">
                                                {isWeightVol ? (
                                                    `${casesExpected % 1 === 0 ? casesExpected : casesExpected.toFixed(2)} x ${sizeNum}`
                                                ) : (
                                                    casesExpected
                                                )}
                                                {' '}
                                                {unit ? <span className="text-[10px] text-stone-500 dark:text-gray-555 uppercase">{unit}</span> : ''}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateTransferItem(index, 'receivedQty', Math.max(0, item.receivedQty - (isWeightVol ? sizeNum : 1)))}
                                                    className="w-7 h-7 bg-stone-100 dark:bg-white/5 hover:bg-rose-500/20 text-stone-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-red-400 rounded flex items-center justify-center transition-all active:scale-90 border border-[#E2DCCE] dark:border-transparent hover:border-rose-500/30"
                                                >-</button>
                                                <input
                                                    title={t('posCommand.receivedQty') || "Received Quantity"}
                                                    placeholder="0"
                                                    type="number"
                                                    min="0"
                                                    step={isWeightVol ? "any" : "1"}
                                                    value={isWeightVol ? (item.receivedQty / sizeNum) : item.receivedQty}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        handleUpdateTransferItem(index, 'receivedQty', isWeightVol ? val * sizeNum : Math.round(val));
                                                    }}
                                                    className={`w-14 bg-white dark:bg-black/50 border rounded text-center font-mono py-1 focus:outline-none transition-all ${
                                                        isOverReceived
                                                            ? 'border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                                                            : isFullyReceived
                                                                ? 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                                                                : 'border-[#E2DCCE] dark:border-white/10 text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]'
                                                    }`}
                                                />
                                                <button
                                                    onClick={() => handleUpdateTransferItem(index, 'receivedQty', item.receivedQty + (isWeightVol ? sizeNum : 1))}
                                                    className="w-7 h-7 bg-stone-100 dark:bg-white/5 hover:bg-emerald-500/20 text-stone-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-450 rounded flex items-center justify-center transition-all active:scale-90 border border-[#E2DCCE] dark:border-transparent hover:border-emerald-500/30"
                                                >+</button>
                                                {isWeightVol ? (
                                                    <span className="text-[10px] text-stone-500 dark:text-gray-555 uppercase font-bold ml-1">x {sizeNum} {unit}</span>
                                                ) : (
                                                    unit && <span className="text-[10px] text-stone-500 dark:text-gray-555 uppercase font-bold ml-1">{unit}</span>
                                                )}
                                            </div>
                                            {isOverReceived && (
                                                <p className="text-[9px] text-amber-600 dark:text-amber-400 text-center mt-1 font-bold uppercase tracking-wider">{t('posCommand.overageDetected')}</p>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <select
                                                title={t('posCommand.condition') || "Condition"}
                                                aria-label={t('posCommand.condition') || "Condition"}
                                                value={item.condition}
                                                onChange={(e) => handleUpdateTransferItem(index, 'condition', e.target.value)}
                                                className={`bg-white dark:bg-black/50 border rounded-lg text-xs p-2 outline-none w-full cursor-pointer transition-all ${
                                                    item.condition === 'Good'
                                                        ? 'text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold'
                                                        : item.condition === 'Damaged'
                                                            ? 'text-rose-700 dark:text-red-400 border-rose-500/30 font-bold bg-rose-50 dark:bg-rose-500/5'
                                                            : 'text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold bg-amber-50 dark:bg-amber-500/5'
                                                }`}
                                            >
                                                <option value="Good" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">{t('posCommand.conditionGood')}</option>
                                                <option value="Damaged" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">{t('posCommand.conditionDamaged')}</option>
                                                <option value="Expired" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">{t('posCommand.conditionExpired')}</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="bg-[#FAF8F5] dark:bg-black/30 p-4 border-t border-[#E2DCCE] dark:border-white/10 flex items-center justify-between">
                    <div className="flex gap-6 flex-wrap font-mono">
                        <div>
                            <p className="text-[10px] text-stone-500 dark:text-gray-455 uppercase font-black tracking-widest">{t('posCommand.totalExpected')}</p>
                            <div className="text-lg text-[#1E3F27] dark:text-white font-bold">
                                {transferReceivingItems.map((item, idx) => {
                                    const unit = item.unit || '';
                                    const sizeNum = item.productSize || 0;
                                    const isWeightVol = (isWeightBased(unit) || isVolumeBased(unit)) && sizeNum > 0;
                                    const casesExpected = item.displayExpectedQty || item.expectedQty;

                                    const formatted = isWeightVol
                                        ? `${casesExpected % 1 === 0 ? casesExpected : casesExpected.toFixed(2)} x ${sizeNum}`
                                        : casesExpected.toString();

                                    return (
                                        <span key={idx}>
                                            {idx > 0 && <span className="text-stone-400 dark:text-gray-650 mx-1">·</span>}
                                            {formatted}
                                            {unit && <span className="text-[10px] text-stone-500 dark:text-gray-555 uppercase ml-0.5">{unit}</span>}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-500 dark:text-gray-455 uppercase font-black tracking-widest">{t('posCommand.totalScanned')}</p>
                            <div className={`text-lg font-bold ${
                                transferReceivingItems.every(item => {
                                    const sizeNum = item.productSize || 0;
                                    const isWV = (isWeightBased(item.unit || '') || isVolumeBased(item.unit || '')) && sizeNum > 0;
                                    const rawExpected = isWV ? (item.displayExpectedQty || item.expectedQty) * sizeNum : (item.displayExpectedQty || item.expectedQty);
                                    return item.receivedQty >= rawExpected;
                                }) ? 'text-emerald-700 dark:text-green-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'
                            }`}>
                                {transferReceivingItems.map((item, idx) => {
                                    const unit = item.unit || '';
                                    const sizeNum = item.productSize || 0;
                                    const isWeightVol = (isWeightBased(unit) || isVolumeBased(unit)) && sizeNum > 0;
                                    const casesScanned = isWeightVol ? item.receivedQty / sizeNum : item.receivedQty;

                                    const formatted = isWeightVol
                                        ? `${casesScanned % 1 === 0 ? casesScanned : casesScanned.toFixed(2)} x ${sizeNum}`
                                        : casesScanned.toString();

                                    return (
                                        <span key={idx}>
                                            {idx > 0 && <span className="text-stone-400 dark:text-gray-650 mx-1">·</span>}
                                            {formatted}
                                            {unit && <span className="text-[10px] text-stone-500 dark:text-gray-555 uppercase ml-0.5">{unit}</span>}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleConfirmTransferReceiving}
                        disabled={isConfirmingReceive || transferReceivingItems.reduce((sum, item) => sum + item.receivedQty, 0) === 0}
                        className="px-8 py-3 text-white font-bold flex items-center gap-2 rounded-2xl transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed active:scale-95 hover:opacity-90 bg-gradient-to-br from-[#224429] to-[#2C5E3B] shadow-[0_4px_16px_rgba(44,94,59,0.25)]"
                    >
                        {isConfirmingReceive ? (
                            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> {t('common.processing')}...</span>
                        ) : (
                            <span className="flex items-center gap-2"><CheckCircle size={18} /> {t('posCommand.finalizeReceipt')}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ReceivingForm;
