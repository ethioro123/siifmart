import React, { useState, useEffect } from 'react';
import Modal from '../../Modal';
import { Scan, Clock, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { usePOSCommand } from '../POSCommandContext';
import { useData } from '../../../contexts/DataContext';
import { useFulfillmentData } from '../../fulfillment/FulfillmentDataProvider';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';

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

    return (
        <Modal isOpen={isReceivingModalOpen} onClose={handleCloseReceivingModal} title={t('posCommand.receivingModalTitle')} size="xl">
            <div className="space-y-4 p-1">
                {/* Tabs */}
                {!receivingSummary && !selectedTransferForReceiving && (
                    <div className="flex p-1 bg-black/40 rounded-xl mb-4">
                        <button
                            onClick={() => setActiveTab2('pending')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'pending' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {t('posCommand.pendingTab')} ({activeSite?.name})
                        </button>
                        <button
                            onClick={() => setActiveTab2('history')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {t('posCommand.historyTab')}
                        </button>
                    </div>
                )}

                {/* Receiving Summary View */}
                {receivingSummary && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={40} className="text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">
                                {(receivingSummary as any).isHistory ? t('posCommand.shipmentDetails') : t('posCommand.receivingCompleted')}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {(receivingSummary as any).isHistory
                                    ? `${t('posCommand.detailsForShipment')} ${formatJobId({ jobNumber: (receivingSummary as any).jobNumber, orderRef: receivingSummary.orderRef, type: 'TRANSFER' })}`
                                    : `${t('posCommand.shipmentAddedInventory')} ${formatJobId({ jobNumber: (receivingSummary as any).jobNumber, orderRef: receivingSummary.orderRef, type: 'TRANSFER' })}`
                                }
                            </p>
                        </div>

                        <div className="border border-white/10 rounded-xl overflow-hidden">
                            <div className="bg-black/20 p-3 flex items-center justify-between text-xs font-bold text-gray-400 uppercase border-b border-white/10">
                                <span>{t('posCommand.shipmentDetails')}</span>
                                <span>{formatDateTime(receivingSummary.timestamp, { showTime: true })}</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {receivingSummary.items.map((item: any, idx: number) => {
                                    // Resolve unit from the item OR from products catalog as fallback
                                    const resolvedUnit = item.unit || (() => {
                                        const prod = allProducts.find((p: any) => p.sku?.trim()?.toUpperCase() === item.sku?.trim()?.toUpperCase());
                                        return prod?.unit || '';
                                    })();
                                    const displayExpected = item.displayExpectedQty || item.expectedQty;
                                    return (
                                        <div key={idx} className="p-3 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold ${item.receivedQty < displayExpected ? 'text-red-400' : 'text-green-400'}`}>
                                                        {t('posCommand.received')} {item.receivedQty}{resolvedUnit ? ` ${resolvedUnit}` : ''} {t('pos.outOf')} {displayExpected}{resolvedUnit ? ` ${resolvedUnit}` : ''}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-1 border ${item.condition === 'Good' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    item.condition === 'Damaged' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    } `}>
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
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="text-yellow-400 flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-yellow-400">{t('posCommand.discrepanciesReported')}</p>
                                    <p className="text-xs text-yellow-200/70">{t('posCommand.notifiedAlert')}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleCloseReceivingModal}
                            className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
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
                                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                    <button
                                        onClick={() => handleCloseReceivingModal()}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all active:scale-95"
                                    >
                                        <Clock size={16} /> {/* Placeholder for back icon to avoid duplicate imports, Clock signifies history/back context here subtly or just rely on Close modal */}
                                    </button>
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-wide">{t('posCommand.receivingShipment')}</h3>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                            {t('posCommand.ref')}: {(() => {
                                                const matchedJob = jobs.find(j => j.id === selectedTransferForReceiving || j.orderRef === selectedTransferForReceiving);
                                                return matchedJob ? formatJobId(matchedJob) : selectedTransferForReceiving.substring(0, 8);
                                            })()} |
                                            {t('posCommand.items')}: {transferReceivingItems.length}
                                        </p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                            {t('posCommand.inProgress')}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Scan Input */}
                                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2 tracking-wider flex items-center gap-2">
                                        <Scan size={14} className="text-cyber-primary" />
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
                                            className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:border-cyber-primary outline-none transition-all placeholder:text-gray-600 focus:shadow-[0_0_15px_rgba(0,255,157,0.15)] focus:bg-cyber-primary/5"
                                        />
                                        <button
                                            onClick={() => handleScanTransferItem(transferScanBarcode)}
                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all active:scale-95 border border-white/10"
                                        >
                                            {t('common.add')}
                                        </button>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden shadow-inner">
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
                                                <tr>
                                                    <th className="p-3 text-[10px] text-gray-500 uppercase font-black tracking-widest">{t('posCommand.itemDetails')}</th>
                                                    <th className="p-3 text-[10px] text-gray-500 uppercase font-black tracking-widest text-center">{t('posCommand.expected')}</th>
                                                    <th className="p-3 text-[10px] text-gray-500 uppercase font-black tracking-widest text-center">{t('posCommand.received')}</th>
                                                    <th className="p-3 text-[10px] text-gray-500 uppercase font-black tracking-widest">{t('posCommand.condition')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {transferReceivingItems.map((item, index) => {
                                                    const isFullyReceived = item.receivedQty >= (item.displayExpectedQty || item.expectedQty);
                                                    const isOverReceived = item.receivedQty > (item.displayExpectedQty || item.expectedQty);

                                                    return (
                                                        <tr key={index} className={`transition-colors ${isFullyReceived ? 'bg-green-500/[0.02]' : 'hover:bg-white/[0.02]'}`}>
                                                            <td className="p-3">
                                                                <p className="text-sm font-bold text-white mb-0.5">{item.name}</p>
                                                                <p className="text-xs font-mono text-gray-500 bg-black/40 inline-block px-1.5 py-0.5 rounded border border-white/5">SKU: {item.sku}</p>
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <span className="text-sm font-mono text-gray-400">{item.displayExpectedQty || item.expectedQty} {item.unit ? <span className="text-[10px] text-gray-500 uppercase">{item.unit}</span> : ''}</span>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleUpdateTransferItem(index, 'receivedQty', Math.max(0, item.receivedQty - 1))}
                                                                        className="w-7 h-7 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-red-500/30"
                                                                    >-</button>
                                                                    <input
                                                                        title={t('posCommand.receivedQty') || "Received Quantity"}
                                                                        placeholder="0"
                                                                        type="number"
                                                                        min="0"
                                                                        value={item.receivedQty}
                                                                        onChange={(e) => handleUpdateTransferItem(index, 'receivedQty', parseInt(e.target.value) || 0)}
                                                                        className={`w-14 bg-black/50 border rounded text-center font-mono py-1 focus:outline-none transition-all ${isOverReceived ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' :
                                                                            isFullyReceived ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                                                                                'border-white/10 text-white focus:border-cyber-primary'
                                                                            }`}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleUpdateTransferItem(index, 'receivedQty', item.receivedQty + 1)}
                                                                        className="w-7 h-7 bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 rounded flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-green-500/30"
                                                                    >+</button>
                                                                    {item.unit && <span className="text-[10px] text-gray-500 uppercase font-bold ml-1">{item.unit}</span>}
                                                                </div>
                                                                {isOverReceived && (
                                                                    <p className="text-[9px] text-yellow-400 text-center mt-1 font-bold uppercase tracking-wider">{t('posCommand.overageDetected')}</p>
                                                                )}
                                                            </td>
                                                            <td className="p-3">
                                                                <select
                                                                    title={t('posCommand.condition') || "Condition"}
                                                                    aria-label={t('posCommand.condition') || "Condition"}
                                                                    value={item.condition}
                                                                    onChange={(e) => handleUpdateTransferItem(index, 'condition', e.target.value)}
                                                                    className={`bg-black/50 border rounded-lg text-xs p-2 outline-none w-full appearance-none cursor-pointer transition-all ${item.condition === 'Good' ? 'text-green-400 border-green-500/30 font-bold' :
                                                                        item.condition === 'Damaged' ? 'text-red-400 border-red-500/50 font-bold bg-red-500/5' :
                                                                            'text-yellow-400 border-yellow-500/50 font-bold bg-yellow-500/5'
                                                                        }`}
                                                                    ref={(el) => {
                                                                        if (el) {
                                                                            el.style.backgroundImage = `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`;
                                                                            el.style.backgroundRepeat = 'no-repeat';
                                                                            el.style.backgroundPosition = 'right 0.5rem center';
                                                                            el.style.backgroundSize = '1em';
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="Good">{t('posCommand.conditionGood')}</option>
                                                                    <option value="Damaged">{t('posCommand.conditionDamaged')}</option>
                                                                    <option value="Expired">{t('posCommand.conditionExpired')}</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Summary Footer */}
                                    <div className="bg-black/40 p-4 border-t border-white/10 flex items-center justify-between">
                                        <div className="flex gap-6 flex-wrap">
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t('posCommand.totalExpected')}</p>
                                                <div className="text-lg font-mono text-white">
                                                    {(() => {
                                                        const grouped: Record<string, number> = {};
                                                        transferReceivingItems.forEach(item => {
                                                            const u = item.unit?.toUpperCase() || 'UNITS';
                                                            grouped[u] = (grouped[u] || 0) + (item.displayExpectedQty || item.expectedQty);
                                                        });
                                                        return Object.entries(grouped).map(([u, qty], i) => (
                                                            <span key={u}>{i > 0 && <span className="text-gray-600 mx-1">·</span>}{qty} <span className="text-[10px] text-gray-500">{u}</span></span>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t('posCommand.totalScanned')}</p>
                                                <div className={`text-lg font-mono font-bold ${transferReceivingItems.reduce((sum, item) => sum + item.receivedQty, 0) >= transferReceivingItems.reduce((sum, item) => sum + (item.displayExpectedQty || item.expectedQty), 0) ? 'text-green-400' : 'text-cyber-primary'}`}>
                                                    {(() => {
                                                        const grouped: Record<string, number> = {};
                                                        transferReceivingItems.forEach(item => {
                                                            const u = item.unit?.toUpperCase() || 'UNITS';
                                                            grouped[u] = (grouped[u] || 0) + item.receivedQty;
                                                        });
                                                        return Object.entries(grouped).map(([u, qty], i) => (
                                                            <span key={u}>{i > 0 && <span className="text-gray-600 mx-1">·</span>}{qty} <span className="text-[10px] text-gray-500">{u}</span></span>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleConfirmTransferReceiving}
                                            disabled={isConfirmingReceive || transferReceivingItems.reduce((sum, item) => sum + item.receivedQty, 0) === 0}
                                            className="px-8 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold flex items-center gap-2 rounded-xl transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed active:scale-95"
                                        >
                                            {isConfirmingReceive ? (
                                                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> {t('common.processing')}...</span>
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
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="text-purple-400" size={20} />
                                        <h3 className="text-white font-bold">{t('posCommand.recentTransactions')}</h3>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {t('posCommand.showingHistory')} <span className="text-white font-bold">{activeSite?.name}</span>.
                                    </p>
                                </div>

                                {(() => {
                                    const wmsTransferJobs = jobs
                                        .filter(j => j.type === 'TRANSFER')
                                        .map(j => ({
                                            id: j.id,
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
                                        const status = ((t as any).transferStatus || t.status || '').toLowerCase();
                                        return status === 'received' || status === 'completed';
                                    }).sort((a, b) => {
                                        const dateA = new Date((a as any).receivedAt || (a as any).updatedAt || 0).getTime();
                                        const dateB = new Date((b as any).receivedAt || (b as any).updatedAt || 0).getTime();
                                        return dateB - dateA;
                                    }).slice(0, 10);

                                    if (historyItems.length === 0) {
                                        return (
                                            <div className="text-center py-12 text-gray-500">
                                                <Clock size={40} className="mx-auto mb-4 opacity-50" />
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
                                                                // Resolve unit from the product catalog since DB line items don't store unit
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
                                                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-mono font-bold text-white">{formatJobId({ ...item, type: 'TRANSFER' } as any)}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {(item as any).items?.length || 0} {t('posCommand.productsLabel')} • {formatDateTime((item as any).receivedAt || (item as any).updatedAt)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[10px] font-bold uppercase">
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
                                <div className="bg-cyber-primary/5 border border-cyber-primary/30 rounded-xl p-4 mb-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-cyber-primary uppercase flex items-center gap-2">
                                            <Scan size={14} />
                                            {t('posCommand.quickScanHandover')}
                                        </label>
                                        <span className="text-[10px] text-gray-500 italic">{t('posCommand.scanPackingLabel')}</span>
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
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:border-cyber-primary outline-none transition-all placeholder:text-gray-600"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                                            <span className="text-[10px] text-cyber-primary font-bold uppercase tracking-widest">{t('posCommand.awaitingScan')}</span>
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    const wmsTransferJobs = jobs
                                        .filter(j => j.type === 'TRANSFER')
                                        .map(j => ({
                                            id: j.id,
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

                                        const status = ((t as any).transferStatus || t.status || '').toLowerCase();
                                        const validStatuses = [
                                            'requested', 'pending', 'approved',
                                            'packed', 'ready', 'staging',
                                            'shipped', 'in-transit', 'dispatched',
                                            'delivered', 'arrived', 'picking', 'packing'
                                        ];

                                        const isValidStatus = validStatuses.includes(status);
                                        const isNotCompleted = status !== 'received' && status !== 'completed' && status !== 'cancelled';
                                        return isValidStatus && isNotCompleted;
                                    });

                                    // Simple fallback - wait a moment for context data 
                                    return (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between border-b border-white/5 pb-2">
                                                {t('posCommand.incomingShipments')}
                                                <span className="bg-white/10 px-2 py-0.5 rounded-full text-white">{pendingTransfers.length}</span>
                                            </h4>
                                            {pendingTransfers.length === 0 ? (
                                                <div className="text-center py-10 bg-black/20 rounded-xl border border-white/5 border-dashed">
                                                    <Package size={32} className="mx-auto text-gray-600 mb-3" />
                                                    <p className="text-gray-400 font-bold">{t('posCommand.noIncomingShipments')}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{t('posCommand.allCaughtUp')}</p>
                                                </div>
                                            ) : (
                                                pendingTransfers.map(transfer => {
                                                    // Compute effective status once for both display and gating
                                                    let effStatus = (transfer as any).transferStatus || transfer.status || 'Pending';
                                                    const childDispatch = jobs.find(j => j.type === 'DISPATCH' && (j.orderRef === transfer.id || j.orderRef === (transfer as any).jobNumber) && j.status !== 'Cancelled');
                                                    if (childDispatch) {
                                                        const RANK: Record<string, number> = { 'Requested': 0, 'Approved': 1, 'Picking': 2, 'Picked': 3, 'Packed': 4, 'Shipped': 5, 'In-Transit': 6, 'Delivered': 7, 'Received': 8 };
                                                        if ((RANK[childDispatch.transferStatus || ''] || 0) > (RANK[effStatus] || 0)) effStatus = childDispatch.transferStatus!;
                                                    }

                                                    const effLower = effStatus.toLowerCase();
                                                    // deliveryMethod is set on the DISPATCH child job by the dispatcher, NOT on the parent TRANSFER
                                                    const resolvedDeliveryMethod = childDispatch?.deliveryMethod || (transfer as any).deliveryMethod;
                                                    const isExternal = resolvedDeliveryMethod === 'External';
                                                    const isInternal = !isExternal; // Default to internal if not set

                                                    // External: receivable once dispatcher marks Shipped (or beyond)
                                                    // Internal: receivable only once driver confirms Delivered (or beyond)
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
                                                            ? 'bg-white/5 hover:bg-cyber-primary/10 border-white/10 hover:border-cyber-primary/30 group'
                                                            : isExpanded ? 'bg-white/5 border-white/15 rounded-b-none' : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-80'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${isReceivable ? 'bg-blue-500/10 text-blue-400 group-hover:scale-110' : 'bg-gray-500/10 text-gray-500'}`}>
                                                                <Truck size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-mono font-bold text-white tracking-wide text-sm">{formatJobId({ ...transfer, type: 'TRANSFER' } as any)}</p>
                                                                {(() => {
                                                                    const sourceSite = sites.find(s => s.id === (transfer as any).sourceSiteId);
                                                                    return sourceSite ? (
                                                                        <div className="flex items-center gap-1.5 mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 w-fit">
                                                                            <MapPin size={10} className="text-gray-400" />
                                                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                                                                From: <span className="text-white">{sourceSite.name}</span>
                                                                            </span>
                                                                        </div>
                                                                    ) : null;
                                                                })()}
                                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                    {resolvedDeliveryMethod && (
                                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                                            {isExternal ? 'External Driver' : 'Internal Driver'}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-gray-500 border border-white/10 rounded px-1.5 py-0.5">
                                                                        {transferItems.length} {t('posCommand.productsLabel')}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                        <Clock size={10} />
                                                                        {formatDateTime(transfer.createdAt)}
                                                                    </span>
                                                                </div>
                                                                {!isReceivable && !isExpanded && (
                                                                    <div className="mt-2 flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2 py-1 w-fit">
                                                                        <AlertTriangle size={10} className="text-yellow-400" />
                                                                        <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">{lockReason}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {(() => {
                                                                const isShipped = effLower.includes('transit') || effLower.includes('shipped') || effLower.includes('dispatched');
                                                                const isDelivered = effLower.includes('delivered') || effLower.includes('arrived');
                                                                return (
                                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${isDelivered ? 'bg-green-500/20 text-green-400 border-green-500/30' : isShipped ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                                                        {effStatus}
                                                                    </span>
                                                                );
                                                            })()}
                                                            {isReceivable ? (
                                                                <div className="text-xs text-cyber-primary opacity-0 group-hover:opacity-100 transition-opacity mt-2 font-bold flex items-center gap-1 justify-end">
                                                                    {t('posCommand.startReceiving')} <ChevronRight size={14} />
                                                                </div>
                                                            ) : (
                                                                <div className="text-[9px] text-gray-500 mt-2 font-bold uppercase tracking-widest text-right">
                                                                    {isExpanded ? '▲ Hide Details' : '▼ View Contents'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Expanded Product Details */}
                                                    {isExpanded && (
                                                        <div className="bg-black/40 border border-white/10 border-t-0 rounded-b-xl overflow-hidden">
                                                            <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Incoming Items</span>
                                                                <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-0.5">
                                                                    <AlertTriangle size={9} className="text-yellow-400" />
                                                                    <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-wider">{lockReason}</span>
                                                                </div>
                                                            </div>
                                                            {transferItems.length > 0 ? (
                                                                <div className="divide-y divide-white/5">
                                                                    {transferItems.map((item: any, idx: number) => {
                                                                        const prod = allProducts.find((p: any) => p.sku?.trim()?.toUpperCase() === (item.sku || '').trim().toUpperCase() || p.id === item.productId);
                                                                        const displayName = item.name || prod?.name || 'Unknown Product';
                                                                        const expectedQty = item.requestedMeasureQty || item.requested_measure_qty || item.expectedQty || item.expected_qty || item.quantity || 0;
                                                                        const unitDef = getSellUnit(item.unit || prod?.unit || '');
                                                                        return (
                                                                            <div key={idx} className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p className="text-xs font-bold text-white truncate">{displayName}</p>
                                                                                    {item.sku && <p className="text-[10px] text-gray-600 font-mono">{item.sku}</p>}
                                                                                </div>
                                                                                <div className="text-right shrink-0 ml-4">
                                                                                    <span className="text-sm font-mono font-bold text-gray-300">{expectedQty}</span>
                                                                                    {unitDef.code !== 'UNIT' && <span className="text-[10px] text-gray-500 ml-1 uppercase">{unitDef.shortLabel}</span>}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="px-4 py-6 text-center text-gray-600 text-xs">No item details available</div>
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

// Simple placeholder due to omission from lucid-react import in this snippet context
const Package = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-package ${className}`}><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
);

const Truck = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-truck ${className}`}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
);

const ChevronRight = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-chevron-right ${className}`}><path d="m9 18 6-6-6-6" /></svg>
);
