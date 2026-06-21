import React, { useState, useEffect } from 'react';
import Modal from '../../Modal';
import { Scan, Clock, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { usePOSCommand } from '../POSCommandContext';
import { useData } from '../../../contexts/DataContext';
import { useFulfillmentData } from '../../fulfillment/FulfillmentDataProvider';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit, isWeightBased, isVolumeBased } from '../../../utils/units';

export const ReceivingModal: React.FC = () => {
    const { t } = useLanguage();
    const { activeSite, allProducts, sites } = useData();
    const { jobs, transfers } = useFulfillmentData();

    const {
        isReceivingModalOpen,
        handleCloseReceivingModal,
        receivingSummary,
        setReceivingSummary,
        selectedTransferForReceiving,
        transferReceivingItems,
        handleUpdateTransferItem,
        isConfirmingReceive,
        handleConfirmTransferReceiving,
        orderRefScanInput,
        setOrderRefScanInput,
        handleScanOrderRef,
        transferScanBarcode,
        setTransferScanBarcode,
        handleScanTransferItem,
        handleSelectTransferForReceiving
    } = usePOSCommand();

    const [activeTab, setActiveTab2] = useState<'pending' | 'history'>('pending');
    const [expandedTransferId, setExpandedTransferId] = useState<string | null>(null);

    // Allow external reset when modal closes
    useEffect(() => {
        if (!isReceivingModalOpen) setActiveTab2('pending');
    }, [isReceivingModalOpen]);

    // Auto-switch to history after a successful receipt is confirmed
    useEffect(() => {
        if (receivingSummary && !(receivingSummary as any).isHistory) {
            // When summary is dismissed, the next view should be history
            setActiveTab2('history');
        }
    }, [receivingSummary]);

    return (
        <Modal isOpen={isReceivingModalOpen} onClose={handleCloseReceivingModal} title={t('posCommand.receivingModalTitle')} size="xl">
            <div className="space-y-4 p-1 bg-transparent">
                {/* Tabs */}
                {!receivingSummary && !selectedTransferForReceiving && (
                    <div className="flex p-1 bg-[#F4F0E6] dark:bg-black/30 rounded-2xl mb-4 border border-[#E2DCCE] dark:border-white/5">
                        <button
                            onClick={() => setActiveTab2('pending')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                activeTab === 'pending'
                                    ? 'bg-[#224429] dark:bg-[#2C5E3B] text-white shadow-sm'
                                    : 'text-[#4D6E56] dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-white'
                            }`}
                        >
                            {t('posCommand.pendingTab')} ({activeSite?.name})
                        </button>
                        <button
                            onClick={() => setActiveTab2('history')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                activeTab === 'history'
                                    ? 'bg-[#224429] dark:bg-[#2C5E3B] text-white shadow-sm'
                                    : 'text-[#4D6E56] dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-white'
                            }`}
                        >
                            {t('posCommand.historyTab')}
                        </button>
                    </div>
                )}

                {/* Receiving Summary View */}
                {receivingSummary && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-emerald-50 dark:bg-green-500/10 border border-emerald-150 dark:border-green-500/30 rounded-2xl p-6 text-center">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={40} className="text-emerald-700 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-[#1E3F27] dark:text-white mb-1">
                                {(receivingSummary as any).isHistory ? t('posCommand.shipmentDetails') : t('posCommand.receivingCompleted')}
                            </h3>
                            <p className="text-stone-500 dark:text-gray-400 text-sm">
                                {(receivingSummary as any).isHistory
                                    ? `${t('posCommand.detailsForShipment')} ${formatJobId({ jobNumber: (receivingSummary as any).jobNumber, orderRef: receivingSummary.orderRef, type: 'TRANSFER' })}`
                                    : `${t('posCommand.shipmentAddedInventory')} ${formatJobId({ jobNumber: (receivingSummary as any).jobNumber, orderRef: receivingSummary.orderRef, type: 'TRANSFER' })}`
                                }
                            </p>
                        </div>

                        <div className="border border-[#E2DCCE] dark:border-white/10 rounded-2xl overflow-hidden bg-transparent">
                            <div className="bg-[#FAF8F5] dark:bg-black/20 p-3 flex items-center justify-between text-xs font-black text-[#4D6E56] dark:text-gray-400 uppercase tracking-wider border-b border-[#E2DCCE] dark:border-white/10">
                                <span>{t('posCommand.shipmentDetails')}</span>
                                <span>{formatDateTime(receivingSummary.timestamp, { showTime: true })}</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-[#E2DCCE]/60 dark:divide-white/5 bg-transparent">
                                {receivingSummary.items.map((item: any, idx: number) => {
                                    const prod = allProducts.find((p: any) => p.sku?.trim()?.toUpperCase() === item.sku?.trim()?.toUpperCase());
                                    const resolvedUnit = item.unit || prod?.unit || '';
                                    const isWeightVol = isWeightBased(resolvedUnit) || isVolumeBased(resolvedUnit);
                                    const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
                                    const displayExpected = item.displayExpectedQty || item.expectedQty;

                                    const formattedExpected = (isWeightVol && sizeNum > 0) ? (() => {
                                        const cases = displayExpected / sizeNum;
                                        const casesStr = cases % 1 === 0 ? cases.toString() : cases.toFixed(2);
                                        return `${casesStr} x ${sizeNum} ${resolvedUnit}`;
                                    })() : `${displayExpected}${resolvedUnit ? ` ${resolvedUnit}` : ''}`;

                                    const formattedReceived = (isWeightVol && sizeNum > 0) ? (() => {
                                        const cases = item.receivedQty / sizeNum;
                                        const casesStr = cases % 1 === 0 ? cases.toString() : cases.toFixed(2);
                                        return `${casesStr} x ${sizeNum} ${resolvedUnit}`;
                                    })() : `${item.receivedQty}${resolvedUnit ? ` ${resolvedUnit}` : ''}`;

                                    return (
                                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{item.name}</p>
                                                <p className="text-xs text-stone-400 dark:text-gray-550">SKU: {item.sku}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold ${item.receivedQty < displayExpected ? 'text-rose-600 dark:text-red-400' : 'text-emerald-700 dark:text-green-400'}`}>
                                                        {t('posCommand.received')} {formattedReceived} {t('pos.outOf')} {formattedExpected}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-1 border ${
                                                    item.condition === 'Good'
                                                        ? 'bg-emerald-50 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-100 dark:border-transparent'
                                                        : item.condition === 'Damaged'
                                                            ? 'bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 border-rose-100 dark:border-transparent'
                                                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-transparent'
                                                }`}>
                                                    {item.condition === 'Good' ? t('posCommand.conditionGood') :
                                                        item.condition === 'Damaged' ? t('posCommand.conditionDamaged') :
                                                            t('posCommand.conditionExpired')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {receivingSummary.hasDiscrepancies && (
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-amber-800 dark:text-amber-400">{t('posCommand.discrepanciesReported')}</p>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-200/70">{t('posCommand.notifiedAlert')}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleCloseReceivingModal}
                            className="w-full py-4 text-white font-bold rounded-2xl shadow-[0_4px_20px_rgba(44,94,59,0.25)] transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 bg-gradient-to-br from-[#224429] to-[#2C5E3B]"
                        >
                            {t('posCommand.closeSummary')}
                        </button>
                    </div>
                )}


                {/* Pending Transfers List / Form */}
                {!receivingSummary && (
                    <>
                        {/* Active Transfer View (Form) */}
                        {selectedTransferForReceiving ? (
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

                                {/* Items List */}
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
                                                    const prod = allProducts.find(p => p.sku?.trim()?.toUpperCase() === item.sku?.trim()?.toUpperCase());
                                                    const unit = prod?.unit || item.unit || '';
                                                    const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
                                                    const sizeNum = prod?.size ? parseFloat(prod.size as string) : (item.productSize || 0);

                                                    const isFullyReceived = item.receivedQty >= (item.displayExpectedQty || item.expectedQty);
                                                    const isOverReceived = item.receivedQty > (item.displayExpectedQty || item.expectedQty);

                                                    return (
                                                        <tr key={index} className={`transition-colors ${isFullyReceived ? 'bg-emerald-500/[0.02]' : 'hover:bg-stone-50 dark:hover:bg-white/[0.02]'}`}>
                                                            <td className="p-3">
                                                                <p className="text-sm font-bold text-[#1E3F27] dark:text-white mb-0.5">{item.name}</p>
                                                                <p className="text-xs font-mono text-stone-600 dark:text-gray-455 bg-[#FAF8F5] dark:bg-black/40 px-1.5 py-0.5 rounded border border-[#E2DCCE] dark:border-white/5">SKU: {item.sku}</p>
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <span className="text-sm font-mono text-stone-700 dark:text-gray-300">
                                                                    {isWeightVol && sizeNum > 0 ? (
                                                                        (() => {
                                                                            const total = item.displayExpectedQty || item.expectedQty;
                                                                            const cases = total / sizeNum;
                                                                            const casesStr = cases % 1 === 0 ? cases.toString() : cases.toFixed(2);
                                                                            return `${casesStr} x ${sizeNum}`;
                                                                        })()
                                                                    ) : (
                                                                        item.displayExpectedQty || item.expectedQty
                                                                    )}
                                                                    {' '}
                                                                    {unit ? <span className="text-[10px] text-stone-500 dark:text-gray-500 uppercase">{unit}</span> : ''}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleUpdateTransferItem(index, 'receivedQty', Math.max(0, item.receivedQty - (isWeightVol && sizeNum > 0 ? sizeNum : 1)))}
                                                                        className="w-7 h-7 bg-stone-100 dark:bg-white/5 hover:bg-rose-500/20 text-stone-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-red-400 rounded flex items-center justify-center transition-all active:scale-90 border border-[#E2DCCE] dark:border-transparent hover:border-rose-500/30"
                                                                    >-</button>
                                                                    <input
                                                                        title={t('posCommand.receivedQty') || "Received Quantity"}
                                                                        placeholder="0"
                                                                        type="number"
                                                                        min="0"
                                                                        step={isWeightVol && sizeNum > 0 ? "any" : "1"}
                                                                        value={isWeightVol && sizeNum > 0 ? (item.receivedQty / sizeNum) : item.receivedQty}
                                                                        onChange={(e) => {
                                                                            const val = parseFloat(e.target.value) || 0;
                                                                            handleUpdateTransferItem(index, 'receivedQty', isWeightVol && sizeNum > 0 ? val * sizeNum : Math.round(val));
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
                                                                        onClick={() => handleUpdateTransferItem(index, 'receivedQty', item.receivedQty + (isWeightVol && sizeNum > 0 ? sizeNum : 1))}
                                                                        className="w-7 h-7 bg-stone-100 dark:bg-white/5 hover:bg-emerald-500/20 text-stone-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-450 rounded flex items-center justify-center transition-all active:scale-90 border border-[#E2DCCE] dark:border-transparent hover:border-emerald-500/30"
                                                                    >+</button>
                                                                    {isWeightVol && sizeNum > 0 ? (
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
                                        <div className="flex gap-6 flex-wrap">
                                            <div>
                                                <p className="text-[10px] text-stone-500 dark:text-gray-455 uppercase font-black tracking-widest">{t('posCommand.totalExpected')}</p>
                                                <div className="text-lg font-mono text-[#1E3F27] dark:text-white font-bold">
                                                    {transferReceivingItems.map((item, idx) => {
                                                        const prod = allProducts.find(p => p.sku?.trim()?.toUpperCase() === item.sku?.trim()?.toUpperCase());
                                                        const unit = prod?.unit || item.unit || '';
                                                        const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
                                                        const sizeNum = prod?.size ? parseFloat(prod.size as string) : (item.productSize || 0);
                                                        const total = item.displayExpectedQty || item.expectedQty;

                                                        const formatted = (isWeightVol && sizeNum > 0) ? (() => {
                                                            const cases = total / sizeNum;
                                                            const casesStr = cases % 1 === 0 ? cases.toString() : cases.toFixed(2);
                                                            return `${casesStr} x ${sizeNum}`;
                                                        })() : total.toString();

                                                        return (
                                                            <span key={idx}>
                                                                {idx > 0 && <span className="text-stone-400 dark:text-gray-600 mx-1">·</span>}
                                                                {formatted}
                                                                {unit && <span className="text-[10px] text-stone-500 dark:text-gray-555 uppercase ml-1">{unit}</span>}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-stone-500 dark:text-gray-455 uppercase font-black tracking-widest">{t('posCommand.totalScanned')}</p>
                                                <div className={`text-lg font-mono font-bold ${transferReceivingItems.reduce((sum, item) => sum + item.receivedQty, 0) >= transferReceivingItems.reduce((sum, item) => sum + (item.displayExpectedQty || item.expectedQty), 0) ? 'text-emerald-700 dark:text-green-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>
                                                    {transferReceivingItems.map((item, idx) => {
                                                        const prod = allProducts.find(p => p.sku?.trim()?.toUpperCase() === item.sku?.trim()?.toUpperCase());
                                                        const unit = prod?.unit || item.unit || '';
                                                        const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
                                                        const sizeNum = prod?.size ? parseFloat(prod.size as string) : (item.productSize || 0);
                                                        const scanned = item.receivedQty;

                                                        const formatted = (isWeightVol && sizeNum > 0) ? (() => {
                                                            const cases = scanned / sizeNum;
                                                            const casesStr = cases % 1 === 0 ? cases.toString() : cases.toFixed(2);
                                                            return `${casesStr} x ${sizeNum}`;
                                                        })() : scanned.toString();

                                                        return (
                                                            <span key={idx}>
                                                                {idx > 0 && <span className="text-stone-400 dark:text-gray-600 mx-1">·</span>}
                                                                {formatted}
                                                                {unit && <span className="text-[10px] text-stone-500 dark:text-gray-555 uppercase ml-1">{unit}</span>}
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
                        ) : activeTab === 'history' ? (
                            
                            /* HISTORY VIEW */
                            <div className="space-y-4">
                                <div className="bg-emerald-50 dark:bg-[#2C5E3B]/10 border border-emerald-150 dark:border-[#2C5E3B]/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="text-emerald-700 dark:text-[#A9CBA2]" size={20} />
                                        <h3 className="text-[#1E3F27] dark:text-white font-bold">{t('posCommand.recentTransactions')}</h3>
                                    </div>
                                    <p className="text-xs text-stone-500 dark:text-gray-400 mt-1">
                                        {t('posCommand.showingHistory')} <span className="text-[#1E3F27] dark:text-white font-bold">{activeSite?.name}</span>.
                                    </p>
                                </div>

                                {(() => {
                                    const wmsTransferJobs = jobs
                                        .filter(j => j.type === 'TRANSFER' || j.type === 'DISPATCH')
                                        .filter(j => {
                                            if (j.type === 'TRANSFER') return true;
                                            return !jobs.some(p => p.type === 'TRANSFER' && (p.id === j.orderRef || p.jobNumber === j.orderRef));
                                        })
                                        .map(j => ({
                                            id: j.id,
                                            type: j.type,
                                            sourceSiteId: (j as any).sourceSiteId || (j as any).source_site_id || j.siteId,
                                            destSiteId: (j as any).destSiteId || (j as any).dest_site_id,
                                            status: j.status,
                                            transferStatus: (j as any).transferStatus || j.status,
                                            items: j.lineItems || (j as any).line_items || [],
                                            orderRef: j.orderRef,
                                            jobNumber: j.jobNumber,
                                            createdAt: j.createdAt,
                                            assignedTo: j.assignedTo,
                                            receivedAt: (j as any).receivedAt || (j as any).updatedAt
                                        }));

                                    const allTransferSources = [
                                        ...(transfers || []),
                                        ...wmsTransferJobs.filter(wj =>
                                            !(transfers || []).some(t => t.id === wj.id)
                                        )
                                    ];

                                    const historyItems = allTransferSources.filter(t => {
                                        if (String(t.destSiteId) !== String(activeSite?.id)) return false;
                                        const transferStatus = ((t as any).transferStatus || '').toLowerCase();
                                        const jobStatus = ((t as any).status || '').toLowerCase();
                                        return ['received', 'completed'].includes(transferStatus) || ['completed'].includes(jobStatus);
                                    }).sort((a, b) => {
                                        const dateA = new Date((a as any).receivedAt || (a as any).updatedAt || 0).getTime();
                                        const dateB = new Date((b as any).receivedAt || (b as any).updatedAt || 0).getTime();
                                        return dateB - dateA;
                                    }).slice(0, 20);

                                    if (historyItems.length === 0) {
                                        return (
                                            <div className="text-center py-12 text-stone-400 dark:text-gray-500">
                                                <Clock size={40} className="mx-auto mb-4 opacity-50 text-stone-300 dark:text-gray-600" />
                                                <p>{t('posCommand.noHistory')}</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-2">
                                            {historyItems.map(item => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => {
                                                        setReceivingSummary({
                                                            orderRef: (item as any).orderRef || item.id,
                                                            jobNumber: (item as any).jobNumber || (item as any).job_number,
                                                            items: ((item as any).items || (item as any).lineItems || (item as any).line_items || []).map((i: any) => {
                                                                const expected = i.requestedMeasureQty || i.requested_measure_qty || i.expectedQty || i.expected_qty || i.quantity || 0;
                                                                const prod = allProducts.find((p: any) => p.sku?.trim()?.toUpperCase() === (i.sku || '').trim().toUpperCase());
                                                                const resolvedUnit = i.unit || prod?.unit || '';

                                                                return {
                                                                    sku: i.sku || 'Unknown',
                                                                    name: i.name || prod?.name || 'Unknown Product',
                                                                    expectedQty: expected,
                                                                    receivedQty: i.received_qty !== undefined ? i.received_qty : (i.receivedQty !== undefined ? i.receivedQty : expected),
                                                                    unit: resolvedUnit,
                                                                    condition: i.condition || 'Good'
                                                                };
                                                            }),
                                                            timestamp: (item as any).receivedAt || (item as any).updatedAt || new Date().toISOString(),
                                                            hasDiscrepancies: false,
                                                            isHistory: true
                                                        });
                                                    }}
                                                    className="bg-[#FAF8F5]/80 dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#2C5E3B]/5 dark:hover:bg-white/10 hover:border-[#2C5E3B]/20 transition-all shadow-sm"
                                                >
                                                    <div>
                                                        <p className="font-mono font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{formatJobId({ ...item, type: 'TRANSFER' } as any)}</p>
                                                        <p className="text-xs text-stone-500 dark:text-gray-400">
                                                            {(item as any).items?.length || 0} {t('posCommand.productsLabel')} • {formatDateTime((item as any).receivedAt || (item as any).updatedAt)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-green-500/20 text-emerald-700 dark:text-green-400 border border-emerald-100 dark:border-green-500/30 rounded text-[10px] font-bold uppercase">
                                                            {t('posCommand.received').toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                        ) : (
                            /* PENDING VIEW (Default) */
                            <>
                                {/* Order Ref Scanner */}
                                <div className="bg-[#FAF8F5] dark:bg-[#2C5E3B]/5 border border-[#E2DCCE] dark:border-[#2C5E3B]/30 rounded-2xl p-4 mb-2 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] uppercase flex items-center gap-2">
                                            <Scan size={14} />
                                            {t('posCommand.quickScanHandover')}
                                        </label>
                                        <span className="text-[10px] text-stone-500 dark:text-gray-550 italic">{t('posCommand.scanPackingLabel')}</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={orderRefScanInput}
                                            onChange={(e) => setOrderRefScanInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleScanOrderRef(orderRefScanInput);
                                                }
                                            }}
                                            placeholder={t('posCommand.scanOrderRefPlaceholder')}
                                            className="w-full bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-3 text-[#1E3F27] dark:text-white font-mono outline-none transition-all placeholder:text-[#4D6E56]/40 dark:placeholder:text-gray-600 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-1 focus:ring-[#2C5E3B] dark:focus:ring-[#A9CBA2]"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse" />
                                            <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold uppercase tracking-widest">{t('posCommand.awaitingScan')}</span>
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    const wmsTransferJobs = jobs
                                        .filter(j => j.type === 'TRANSFER' || j.type === 'DISPATCH')
                                        .filter(j => {
                                            if (j.type === 'TRANSFER') return true;
                                            return !jobs.some(p => p.type === 'TRANSFER' && (p.id === j.orderRef || p.jobNumber === j.orderRef));
                                        })
                                        .map(j => ({
                                            id: j.id,
                                            type: j.type,
                                            sourceSiteId: (j as any).sourceSiteId || (j as any).source_site_id || j.siteId,
                                            destSiteId: (j as any).destSiteId || (j as any).dest_site_id,
                                            status: j.status,
                                            transferStatus: (j as any).transferStatus || j.status,
                                            items: j.lineItems || (j as any).line_items || [],
                                            orderRef: j.orderRef,
                                            jobNumber: j.jobNumber,
                                            createdAt: j.createdAt,
                                            assignedTo: j.assignedTo,
                                            deliveryMethod: (j as any).deliveryMethod
                                        }));

                                    const allTransferSources = [
                                        ...(transfers || []),
                                        ...wmsTransferJobs.filter(wj =>
                                            !(transfers || []).some(t => t.id === wj.id)
                                        )
                                    ];

                                    const pendingTransfers = allTransferSources.filter(t => {
                                        if (String(t.destSiteId) !== String(activeSite?.id)) return false;

                                        const transferStatus = ((t as any).transferStatus || '').toLowerCase();
                                        const jobStatus = ((t as any).status || '').toLowerCase();

                                        if (['received', 'completed', 'cancelled'].includes(transferStatus)) return false;
                                        if (['completed', 'cancelled', 'deleted'].includes(jobStatus)) return false;

                                        const validStatuses = [
                                            'requested', 'pending', 'approved',
                                            'packed', 'ready', 'staging',
                                            'shipped', 'in-transit', 'dispatched',
                                            'delivered', 'arrived', 'picking', 'packing',
                                            'in-progress'
                                        ];

                                        return validStatuses.includes(transferStatus) || validStatuses.includes(jobStatus);
                                    });

                                    return (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-stone-500 dark:text-gray-455 uppercase tracking-widest flex items-center justify-between border-b border-[#E2DCCE]/60 dark:border-white/5 pb-2">
                                                {t('posCommand.incomingShipments')}
                                                <span className="bg-[#FAF8F5] dark:bg-white/10 border border-[#E2DCCE]/60 dark:border-transparent px-2.5 py-0.5 rounded-full text-stone-600 dark:text-white font-mono font-bold">{pendingTransfers.length}</span>
                                            </h4>
                                            {pendingTransfers.length === 0 ? (
                                                <div className="text-center py-10 bg-[#FAF8F5]/50 dark:bg-black/20 rounded-xl border border-[#E2DCCE]/60 dark:border-white/5 border-dashed">
                                                    <Package size={32} className="mx-auto text-stone-400 dark:text-gray-600 mb-3" />
                                                    <p className="text-stone-700 dark:text-gray-400 font-bold">{t('posCommand.noIncomingShipments')}</p>
                                                    <p className="text-xs text-stone-400 dark:text-gray-550 mt-1">{t('posCommand.allCaughtUp')}</p>
                                                </div>
                                            ) : (
                                                pendingTransfers.map(transfer => {
                                                    let effStatus = (transfer as any).transferStatus || transfer.status || 'Pending';
                                                    const childDispatch = jobs.find(j => j.type === 'DISPATCH' && (j.orderRef === transfer.id || j.orderRef === (transfer as any).jobNumber) && j.status !== 'Cancelled');
                                                    if (childDispatch) {
                                                        const RANK: Record<string, number> = { 'Requested': 0, 'Approved': 1, 'Picking': 2, 'Picked': 3, 'Packed': 4, 'Shipped': 5, 'In-Transit': 6, 'Delivered': 7, 'Received': 8 };
                                                        if ((RANK[childDispatch.transferStatus || ''] || 0) > (RANK[effStatus] || 0)) effStatus = childDispatch.transferStatus!;
                                                    }

                                                    const effLower = effStatus.toLowerCase();
                                                    const resolvedDeliveryMethod = childDispatch?.deliveryMethod || (transfer as any).deliveryMethod;
                                                    const isExternal = resolvedDeliveryMethod === 'External';

                                                    const SHIPPED_PLUS = ['shipped', 'in-transit', 'dispatched', 'delivered', 'arrived'];
                                                    const DELIVERED_PLUS = ['delivered', 'arrived'];

                                                    const isReceivable = isExternal
                                                        ? SHIPPED_PLUS.some(s => effLower.includes(s))
                                                        : DELIVERED_PLUS.some(s => effLower.includes(s));

                                                    const lockReason = !isReceivable
                                                        ? (SHIPPED_PLUS.some(s => effLower.includes(s))
                                                            ? 'Awaiting Driver Delivery Confirmation'
                                                            : 'Awaiting Dispatch')
                                                        : '';

                                                    const isExpanded = expandedTransferId === transfer.id;
                                                    const transferItems = (transfer as any).items || [];

                                                    return (
                                                    <div key={transfer.id} className="space-y-0">
                                                    <div
                                                        onClick={() => {
                                                            if (isReceivable) {
                                                                handleSelectTransferForReceiving(transfer.id);
                                                            } else {
                                                                setExpandedTransferId(isExpanded ? null : transfer.id);
                                                            }
                                                        }}
                                                        className={`border rounded-xl p-4 flex items-center justify-between transition-all cursor-pointer ${isReceivable
                                                            ? 'bg-white dark:bg-white/5 hover:bg-emerald-50/50 dark:hover:bg-[#2C5E3B]/10 border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]/30 dark:hover:border-[#2C5E3B]/30 group'
                                                            : isExpanded ? 'bg-[#FAF8F5] dark:bg-white/5 border-[#E2DCCE] dark:border-white/15 rounded-b-none' : 'bg-stone-50/50 dark:bg-white/[0.02] border-[#E2DCCE]/60 dark:border-white/5 opacity-70 hover:opacity-85'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${isReceivable ? 'bg-emerald-50 dark:bg-[#2C5E3B]/10 text-emerald-700 dark:text-[#A9CBA2] group-hover:scale-110' : 'bg-stone-200/50 dark:bg-gray-500/10 text-stone-500 dark:text-gray-550'}`}>
                                                                <Truck size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-mono font-bold text-[#1E3F27] dark:text-white tracking-wide text-sm">{formatJobId({ ...transfer, type: 'TRANSFER' } as any)}</p>
                                                                {(() => {
                                                                    const sourceSite = sites.find(s => s.id === (transfer as any).sourceSiteId);
                                                                    return sourceSite ? (
                                                                        <div className="flex items-center gap-1.5 mt-1 bg-[#FAF8F5] dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 rounded-lg px-2 py-1 w-fit">
                                                                            <MapPin size={10} className="text-stone-500 dark:text-gray-400" />
                                                                            <span className="text-[10px] text-stone-500 dark:text-gray-455 uppercase tracking-widest font-black">
                                                                                From: <span className="text-[#1E3F27] dark:text-white font-bold">{sourceSite.name}</span>
                                                                            </span>
                                                                        </div>
                                                                    ) : null;
                                                                })()}
                                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                    {resolvedDeliveryMethod && (
                                                                        <span className="text-[10px] text-stone-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                                                                            {isExternal ? 'External Driver' : 'Internal Driver'}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-[#4D6E56] dark:text-gray-500 border border-[#E2DCCE] dark:border-white/10 rounded px-1.5 py-0.5">
                                                                        {transferItems.length} {t('posCommand.productsLabel')}
                                                                    </span>
                                                                    <span className="text-[10px] text-stone-400 dark:text-gray-455 flex items-center gap-1">
                                                                        <Clock size={10} />
                                                                        {formatDateTime(transfer.createdAt)}
                                                                    </span>
                                                                </div>
                                                                {!isReceivable && !isExpanded && (
                                                                    <div className="mt-2 flex items-center gap-1.5 bg-amber-50 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 rounded-lg px-2 py-1 w-fit">
                                                                        <AlertTriangle size={10} className="text-amber-800 dark:text-yellow-400" />
                                                                        <span className="text-[10px] text-amber-800 dark:text-yellow-400 font-bold uppercase tracking-wider">{lockReason}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {(() => {
                                                                const isShipped = effLower.includes('transit') || effLower.includes('shipped') || effLower.includes('dispatched');
                                                                const isDelivered = effLower.includes('delivered') || effLower.includes('arrived');
                                                                return (
                                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${isDelivered ? 'bg-emerald-50 dark:bg-green-500/20 text-emerald-700 dark:text-green-400 border-emerald-255 dark:border-green-500/30' : isShipped ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-255 dark:border-amber-500/30' : 'bg-emerald-50 dark:bg-[#2C5E3B]/20 text-emerald-700 dark:text-[#A9CBA2] border-emerald-255 dark:border-[#2C5E3B]/30'}`}>
                                                                        {effStatus}
                                                                    </span>
                                                                );
                                                            })()}
                                                            {isReceivable ? (
                                                                <div className="text-xs text-emerald-700 dark:text-[#A9CBA2] opacity-0 group-hover:opacity-100 transition-opacity mt-2 font-bold flex items-center gap-1 justify-end">
                                                                    {t('posCommand.startReceiving')} <ChevronRight size={14} />
                                                                </div>
                                                            ) : (
                                                                <div className="text-[9px] text-stone-500 dark:text-gray-550 mt-2 font-bold uppercase tracking-widest text-right">
                                                                    {isExpanded ? '▲ Hide Details' : '▼ View Contents'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Expanded Product Details */}
                                                    {isExpanded && (
                                                         <div className="bg-stone-50/50 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 border-t-0 rounded-b-xl overflow-hidden">
                                                             <div className="px-4 py-2 bg-[#F4F0E6]/50 dark:bg-white/5 border-b border-[#E2DCCE] dark:border-white/5 flex items-center justify-between">
                                                                 <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-widest">Incoming Items</span>
                                                                 <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 rounded px-2 py-0.5">
                                                                     <AlertTriangle size={9} className="text-amber-800 dark:text-yellow-400" />
                                                                     <span className="text-[9px] text-amber-800 dark:text-yellow-400 font-bold uppercase tracking-wider">{lockReason}</span>
                                                                 </div>
                                                             </div>
                                                             {transferItems.length > 0 ? (
                                                                 <div className="divide-y divide-[#E2DCCE]/60 dark:divide-white/5">
                                                                     {transferItems.map((item: any, idx: number) => {
                                                                         const prod = allProducts.find((p: any) => p.sku?.trim()?.toUpperCase() === (item.sku || '').trim().toUpperCase() || p.id === item.productId);
                                                                         const displayName = item.name || prod?.name || 'Unknown Product';
                                                                         const expectedQty = item.requestedMeasureQty || item.requested_measure_qty || item.expectedQty || item.expected_qty || item.quantity || 0;
                                                                         const unitDef = getSellUnit(item.unit || prod?.unit || '');
                                                                         return (
                                                                             <div key={idx} className="px-4 py-2.5 flex items-center justify-between hover:bg-stone-100/50 dark:hover:bg-white/[0.02] transition-colors">
                                                                                 <div className="min-w-0 flex-1">
                                                                                     <p className="text-xs font-bold text-[#1E3F27] dark:text-white truncate">{displayName}</p>
                                                                                     {item.sku && <p className="text-[10px] text-stone-400 dark:text-gray-600 font-mono">{item.sku}</p>}
                                                                                 </div>
                                                                                 <div className="text-right shrink-0 ml-4">
                                                                                      {(() => {
                                                                                          const unit = item.unit || prod?.unit || '';
                                                                                          const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
                                                                                          const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
                                                                                          if (isWeightVol && sizeNum > 0) {
                                                                                              const cases = expectedQty / sizeNum;
                                                                                              const casesStr = cases % 1 === 0 ? cases.toString() : cases.toFixed(2);
                                                                                              return (
                                                                                                  <>
                                                                                                      <span className="text-sm font-mono font-bold text-[#1E3F27] dark:text-gray-300">{casesStr} x {sizeNum}</span>
                                                                                                      <span className="text-[10px] text-stone-500 ml-1 uppercase">{unit}</span>
                                                                                                  </>
                                                                                              );
                                                                                          }
                                                                                          return (
                                                                                              <>
                                                                                                  <span className="text-sm font-mono font-bold text-[#1E3F27] dark:text-gray-300">{expectedQty}</span>
                                                                                                  {unitDef.code !== 'UNIT' && <span className="text-[10px] text-stone-500 ml-1 uppercase">{unitDef.shortLabel}</span>}
                                                                                              </>
                                                                                          );
                                                                                      })()}
                                                                                 </div>
                                                                             </div>
                                                                         );
                                                                     })}
                                                                 </div>
                                                             ) : (
                                                                 <div className="px-4 py-6 text-center text-stone-500 dark:text-gray-500 text-xs">No item details available</div>
                                                             )}
                                                         </div>
                                                    )}
                                                    </div>
                                                    );
                                                }))
                                            }
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

const Package = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-package ${className}`}><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
);

const Truck = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-truck ${className}`}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
);

const ChevronRight = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-chevron-right ${className}`}><path d="m9 18 6-6-6-6" /></svg>
);
