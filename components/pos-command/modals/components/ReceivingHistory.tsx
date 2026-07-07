import React from 'react';
import { Clock } from 'lucide-react';
import { usePOSCommand } from '../../POSCommandContext';
import { useData } from '../../../../contexts/DataContext';
import { useFulfillmentData } from '../../../fulfillment/FulfillmentDataProvider';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { formatDateTime } from '../../../../utils/formatting';
import { formatJobId } from '../../../../utils/jobIdFormatter';

export const ReceivingHistory: React.FC = () => {
    const { t } = useLanguage();
    const { activeSite, allProducts } = useData();
    const { jobs, transfers } = useFulfillmentData();
    const { setReceivingSummary } = usePOSCommand();

    const wmsTransferJobs = React.useMemo(() => {
        return jobs
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
    }, [jobs]);

    const historyItems = React.useMemo(() => {
        const allTransferSources = [
            ...(transfers || []),
            ...wmsTransferJobs.filter(wj =>
                !(transfers || []).some(t => t.id === wj.id)
            )
        ];

        return allTransferSources.filter(t => {
            if (String(t.destSiteId) !== String(activeSite?.id)) return false;
            const transferStatus = ((t as any).transferStatus || '').toLowerCase();
            const jobStatus = ((t as any).status || '').toLowerCase();
            return ['received', 'completed'].includes(transferStatus) || ['completed'].includes(jobStatus);
        }).sort((a, b) => {
            const dateA = new Date((a as any).receivedAt || (a as any).updatedAt || 0).getTime();
            const dateB = new Date((b as any).receivedAt || (b as any).updatedAt || 0).getTime();
            return dateB - dateA;
        }).slice(0, 20);
    }, [transfers, wmsTransferJobs, activeSite]);

    if (historyItems.length === 0) {
        return (
            <div className="text-center py-12 text-stone-400 dark:text-gray-500">
                <Clock size={40} className="mx-auto mb-4 opacity-50 text-stone-300 dark:text-gray-600" />
                <p>{t('posCommand.noHistory')}</p>
            </div>
        );
    }

    return (
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
        </div>
    );
};
export default ReceivingHistory;
