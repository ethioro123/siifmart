import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { usePOSCommand } from '../../POSCommandContext';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { formatDateTime } from '../../../../utils/formatting';
import { formatJobId } from '../../../../utils/jobIdFormatter';
import { isWeightBased, isVolumeBased } from '../../../../utils/units';

export const ReceivingSummary: React.FC = () => {
    const { t } = useLanguage();
    const { receivingSummary, handleCloseReceivingModal } = usePOSCommand();

    if (!receivingSummary) return null;

    return (
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
                        const resolvedUnit = item.unit || '';
                        const sizeNum = item.productSize || 0;
                        const isWeightVol = (isWeightBased(resolvedUnit) || isVolumeBased(resolvedUnit)) && sizeNum > 0;

                        const casesExpected = item.displayExpectedQty || item.expectedQty;
                        const rawExpected = isWeightVol ? casesExpected * sizeNum : casesExpected;

                        const formattedExpected = isWeightVol
                            ? `${casesExpected % 1 === 0 ? casesExpected : casesExpected.toFixed(2)} x ${sizeNum} ${resolvedUnit}`
                            : `${casesExpected}${resolvedUnit ? ` ${resolvedUnit}` : ''}`;

                        const casesReceived = isWeightVol ? item.receivedQty / sizeNum : item.receivedQty;
                        const formattedReceived = isWeightVol
                            ? `${casesReceived % 1 === 0 ? casesReceived : casesReceived.toFixed(2)} x ${sizeNum} ${resolvedUnit}`
                            : `${item.receivedQty}${resolvedUnit ? ` ${resolvedUnit}` : ''}`;

                        return (
                            <div key={idx} className="p-3 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{item.name}</p>
                                    <p className="text-xs text-stone-400 dark:text-gray-550">SKU: {item.sku}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${item.receivedQty < rawExpected ? 'text-rose-600 dark:text-red-400' : 'text-emerald-700 dark:text-green-400'}`}>
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
    );
};
export default ReceivingSummary;
