import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { usePOSCommand } from '../../POSCommandContext';
import { useData } from '../../../../contexts/DataContext';
import { useFulfillmentData } from '../../../fulfillment/FulfillmentDataProvider';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { formatDateTime } from '../../../../utils/formatting';
import { formatJobId } from '../../../../utils/jobIdFormatter';
import Pagination from '../../../shared/Pagination';

export const ReceivingHistory: React.FC = () => {
    const { t } = useLanguage();
    const { activeSite, allProducts } = useData();
    const { jobs, transfers } = useFulfillmentData();
    const { setReceivingSummary } = usePOSCommand();
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

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
                receivedAt: (j as any).receivedAt || (j as any).received_at || null
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
            const transferStatus = String((t as any).transferStatus || '').toLowerCase();
            const hasExplicitReceivedAt = Boolean((t as any).receivedAt || (t as any).received_at);
            return transferStatus === 'received' || (hasExplicitReceivedAt && transferStatus !== 'delivered');
        }).sort((a, b) => {
            const dateA = new Date((a as any).receivedAt || (a as any).updatedAt || 0).getTime();
            const dateB = new Date((b as any).receivedAt || (b as any).updatedAt || 0).getTime();
            return dateB - dateA;
        });
    }, [transfers, wmsTransferJobs, activeSite]);

    const totalPages = Math.max(1, Math.ceil(historyItems.length / ITEMS_PER_PAGE));
    const paginatedItems = historyItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (historyItems.length === 0) {
        return (
            <div className="text-center py-12 text-[var(--theme-text-muted)]">
                <Clock size={40} className="mx-auto mb-4 opacity-40 text-[var(--theme-text-secondary)]" />
                <p className="text-sm font-medium">{t('posCommand.noHistory')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <Clock className="text-[var(--theme-text-primary)]" size={20} />
                    <h3 className="text-[var(--theme-text-primary)] font-bold">{t('posCommand.receivingHistory')}</h3>
                </div>
                <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                    {t('posCommand.showingHistory')} <span className="text-[var(--theme-text-primary)] font-bold">{activeSite?.name}</span>.
                </p>
            </div>

            <div className="space-y-2">
                {paginatedItems.map(item => (
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
                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--theme-bg-card-hover)] transition-all shadow-xs active:scale-[0.99]"
                    >
                        <div>
                            <p className="font-mono font-bold text-[var(--theme-text-primary)]">{formatJobId({ ...item, type: 'TRANSFER' } as any)}</p>
                            <p className="text-xs text-[var(--theme-text-secondary)]">
                                {(item as any).items?.length || 0} {t('posCommand.productsLabel')} • {formatDateTime((item as any).receivedAt || (item as any).updatedAt)}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                                {t('posCommand.received').toUpperCase()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={historyItems.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemName={t('posCommand.productsLabel') || 'shipments'}
            />
        </div>
    );
};
export default ReceivingHistory;
