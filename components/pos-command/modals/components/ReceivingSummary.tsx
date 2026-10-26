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
            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={36} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-[var(--theme-text-primary)] mb-1">
                    {(receivingSummary as any).isHistory ? t('posCommand.shipmentDetails') : t('posCommand.receivingCompleted')}
                </h3>
                <p className="text-[var(--theme-text-secondary)] text-sm">
                    {(receivingSummary as any).isHistory
                        ? `${t('posCommand.detailsForShipment')} ${formatJobId({ jobNumber: (receivingSummary as any).jobNumber, orderRef: receivingSummary.orderRef, type: 'TRANSFER' })}`
                        : `${t('posCommand.shipmentAddedInventory')} ${formatJobId({ jobNumber: (receivingSummary as any).jobNumber, orderRef: receivingSummary.orderRef, type: 'TRANSFER' })}`
                    }
                </p>
            </div>

            <div className="border border-[var(--theme-border)] rounded-2xl overflow-hidden bg-[var(--theme-bg-card)]">
                <div className="bg-[var(--theme-bg-subtle)] p-3 flex items-center justify-between text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider border-b border-[var(--theme-border)]">
                    <span>{t('posCommand.shipmentDetails')}</span>
                    <span>{formatDateTime(receivingSummary.timestamp, { showTime: true })}</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-[var(--theme-border)] bg-transparent">
                    {receivingSummary.items.map((item: any, idx: number) => {
                        const resolvedUnit = item.unit || '';
                        const sizeNum = item.productSize || 0;
                        const isWeightVol = (isWeightBased(resolvedUnit) || isVolumeBased(resolvedUnit)) && sizeNum > 0;

                        const casesReceived = isWeightVol ? item.receivedQty / sizeNum : item.receivedQty;
                        const formattedReceived = isWeightVol
                            ? `${casesReceived % 1 === 0 ? casesReceived : casesReceived.toFixed(2)} x ${sizeNum} ${resolvedUnit}`
                            : `${item.receivedQty}${resolvedUnit ? ` ${resolvedUnit}` : ''}`;

                        return (
                            <div key={idx} className="p-3 flex items-center justify-between hover:bg-[var(--theme-bg-card-hover)] transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[var(--theme-text-primary)] truncate">{item.name}</p>
                                    <p className="text-xs text-[var(--theme-text-muted)]">SKU: {item.sku}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                                            {t('posCommand.received')} {formattedReceived}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 border ${
                                        item.condition === 'Good'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : item.condition === 'Damaged'
                                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
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
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-bold text-amber-500">{t('posCommand.discrepanciesReported')}</p>
                        <p className="text-xs text-amber-500/80">Variance recorded against the private shipment manifest.</p>
                    </div>
                </div>
            )}

            <button
                onClick={handleCloseReceivingModal}
                className="w-full py-3.5 text-[var(--theme-primary-text)] font-bold rounded-xl shadow-xs transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 bg-[var(--theme-primary)] text-xs uppercase tracking-wider cursor-pointer"
            >
                {t('posCommand.closeSummary')}
            </button>
        </div>
    );
};
export default ReceivingSummary;
