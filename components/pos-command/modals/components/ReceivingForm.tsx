import React, { useRef, useEffect } from 'react';
import { Clock, Scan, CheckCircle, Lock } from 'lucide-react';
import { usePOSCommand } from '../../POSCommandContext';
import { useFulfillmentData } from '../../../fulfillment/FulfillmentDataProvider';
import { useStore } from '../../../../contexts/CentralStore';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { formatJobId } from '../../../../utils/jobIdFormatter';
import { isWeightBased, isVolumeBased } from '../../../../utils/units';
import { ReceivingItemQtyInput } from './ReceivingItemQtyInput';

export const ReceivingForm: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { jobs } = useFulfillmentData();

    // Zero-Trust Rule 4: Branch store managers and supervisors must receive blindly to prevent rubber-stamping
    const isCentralHQOnly = ['group_ceo', 'country_operations_director', 'regional_operations_manager'].includes(user?.role?.toLowerCase() || '');
    const isManagerOrHQ = isCentralHQOnly;

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

    const inputRef = useRef<HTMLInputElement>(null);
    const lastKeyTimeRef = useRef<number>(0);
    const scanBufferRef = useRef<string>('');

    useEffect(() => {
        inputRef.current?.focus();
    }, [selectedTransferForReceiving]);

    if (!selectedTransferForReceiving) return null;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const scannedCode = (scanBufferRef.current || transferScanBarcode).trim();
            if (scannedCode) {
                handleScanTransferItem(scannedCode);
            }
            scanBufferRef.current = '';
            setTransferScanBarcode('');
            return;
        }

        const now = performance.now();
        const timeDiff = lastKeyTimeRef.current ? now - lastKeyTimeRef.current : 0;
        lastKeyTimeRef.current = now;

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Hardware scanners output characters rapidly (< 75ms apart)
            if (timeDiff > 75 && scanBufferRef.current.length > 0) {
                e.preventDefault();
                scanBufferRef.current = '';
                setTransferScanBarcode('');
                return;
            }
            scanBufferRef.current += e.key;
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Back button and title */}
            <div className="flex items-center gap-3 border-b border-[var(--theme-border)] pb-4">
                <button
                    onClick={() => handleCloseReceivingModal()}
                    title={t('common.back') || 'Back'}
                    aria-label={t('common.back') || 'Back'}
                    className="p-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all active:scale-95 border border-[var(--theme-border)] cursor-pointer"
                >
                    <Clock size={16} />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-[var(--theme-text-primary)] tracking-tight">{t('posCommand.receivingShipment')}</h3>
                    <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-widest font-bold">
                        {t('posCommand.ref')}: {(() => {
                            const matchedJob = jobs.find(j => j.id === selectedTransferForReceiving || j.orderRef === selectedTransferForReceiving);
                            return matchedJob ? formatJobId(matchedJob) : selectedTransferForReceiving.substring(0, 8);
                        })()} | {t('posCommand.items')}: {transferReceivingItems.length}
                    </p>
                </div>
                <div className="ml-auto">
                    <span className="px-3 py-1 bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] rounded-full text-xs font-bold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--theme-status-success)] animate-pulse" />
                        {t('posCommand.inProgress')}
                    </span>
                </div>
            </div>

            {/* Quick Hardware Scanner Only Input */}
            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <Scan size={13} />
                        </div>
                        {t('posCommand.scanNextItem')}
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] text-[9px] font-semibold uppercase tracking-wider">
                        {t('posCommand.hardwareScannerActive')}
                    </span>
                </div>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={transferScanBarcode}
                        onPaste={(e) => e.preventDefault()}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTransferScanBarcode(e.target.value)}
                        placeholder={t('posCommand.scanHardwareScannerPrompt')}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-2xl px-4 py-3 text-[var(--theme-text-primary)] font-mono text-xs outline-none transition-all placeholder:text-[var(--theme-text-muted)] focus:border-[var(--theme-border-focus)] shadow-2xs"
                    />
                </div>
            </div>

            {/* Items Table Grid */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden isolate">
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--theme-bg-subtle)] sticky top-0 z-10 border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="p-3 text-[10px] text-[var(--theme-thead-text)] uppercase font-bold tracking-wider">{t('posCommand.itemDetails')}</th>
                                <th className="p-3 text-[10px] text-[var(--theme-thead-text)] uppercase font-bold tracking-wider text-center">
                                    {isManagerOrHQ ? t('posCommand.expected') : t('posCommand.protectedBlind')}
                                </th>
                                <th className="p-3 text-[10px] text-[var(--theme-thead-text)] uppercase font-bold tracking-wider text-center">{t('posCommand.received')}</th>
                                <th className="p-3 text-[10px] text-[var(--theme-thead-text)] uppercase font-bold tracking-wider">{t('posCommand.condition')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)] bg-transparent">
                            {transferReceivingItems.map((item, index) => {
                                const unit = item.unit || '';
                                const sizeNum = item.productSize || 0;
                                const isWeightVol = (isWeightBased(unit) || isVolumeBased(unit)) && sizeNum > 0;

                                const casesExpected = item.displayExpectedQty || item.expectedQty;
                                const rawExpected = isWeightVol ? casesExpected * sizeNum : casesExpected;
                                const isFullyReceived = isManagerOrHQ && item.receivedQty >= rawExpected;
                                const isOverReceived = isManagerOrHQ && item.receivedQty > rawExpected;

                                return (
                                    <tr key={index} className={`transition-colors ${isFullyReceived ? 'bg-[var(--theme-status-success-bg)]/20' : 'hover:bg-[var(--theme-bg-card-hover)]'}`}>
                                        <td className="p-3">
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)] leading-snug break-words mb-0.5">{item.name}</p>
                                            <p className="text-[11px] font-mono text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)] inline-block">SKU: {item.sku}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            {isCentralHQOnly ? (
                                                <span className="text-xs font-mono text-[var(--theme-text-primary)]">
                                                    {isWeightVol ? (
                                                        `${casesExpected % 1 === 0 ? casesExpected : casesExpected.toFixed(2)} x ${sizeNum}`
                                                    ) : (
                                                        casesExpected
                                                    )}
                                                    {' '}
                                                    {unit ? <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase">{unit}</span> : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[10px] font-bold text-[var(--theme-text-secondary)] font-mono" title="Blind audit: Count units accurately">
                                                    <Lock size={10} className="shrink-0" />
                                                    <span>{t('posCommand.blindCount')}</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateTransferItem(index, 'receivedQty', Math.max(0, item.receivedQty - (isWeightVol ? sizeNum : 1)))}
                                                    className="w-7 h-7 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-primary)] hover:text-[var(--theme-status-danger-text)] rounded-xl flex items-center justify-center transition-all active:scale-95 border border-[var(--theme-border)] hover:border-[var(--theme-status-danger-border)] cursor-pointer text-xs font-bold"
                                                >-</button>
                                                <ReceivingItemQtyInput
                                                    title={t('posCommand.receivedQty') || "Received Quantity"}
                                                    receivedQty={item.receivedQty}
                                                    sizeNum={sizeNum}
                                                    isWeightVol={isWeightVol}
                                                    onChange={(rawQty) => handleUpdateTransferItem(index, 'receivedQty', rawQty)}
                                                    isOverReceived={isOverReceived}
                                                    isFullyReceived={isFullyReceived}
                                                    isCentralHQOnly={isCentralHQOnly}
                                                />
                                                <button
                                                    onClick={() => handleUpdateTransferItem(index, 'receivedQty', item.receivedQty + (isWeightVol ? sizeNum : 1))}
                                                    className="w-7 h-7 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-status-success-bg)] text-[var(--theme-text-primary)] hover:text-[var(--theme-status-success-text)] rounded-xl flex items-center justify-center transition-all active:scale-95 border border-[var(--theme-border)] hover:border-[var(--theme-status-success-border)] cursor-pointer text-xs font-bold"
                                                >+</button>
                                                {isWeightVol ? (
                                                    <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold ml-1">x {sizeNum} {unit}</span>
                                                ) : (
                                                    unit && <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold ml-1">{unit}</span>
                                                )}
                                            </div>
                                            {isOverReceived && isCentralHQOnly && (
                                                <p className="text-[9px] text-[var(--theme-status-warning-text)] text-center mt-1 font-bold uppercase tracking-wider">{t('posCommand.overageDetected')}</p>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <select
                                                title={t('posCommand.condition') || "Condition"}
                                                aria-label={t('posCommand.condition') || "Condition"}
                                                value={item.condition}
                                                onChange={(e) => handleUpdateTransferItem(index, 'condition', e.target.value)}
                                                className={`bg-[var(--theme-input-bg)] border rounded-xl text-xs p-2 outline-none w-full cursor-pointer transition-all ${
                                                    item.condition === 'Good'
                                                        ? 'text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)] font-bold'
                                                        : item.condition === 'Damaged'
                                                            ? 'text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)] font-bold bg-[var(--theme-status-danger-bg)]'
                                                            : 'text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)] font-bold bg-[var(--theme-status-warning-bg)]'
                                                }`}
                                            >
                                                <option value="Good" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">{t('posCommand.conditionGood')}</option>
                                                <option value="Damaged" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">{t('posCommand.conditionDamaged')}</option>
                                                <option value="Expired" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">{t('posCommand.conditionExpired')}</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="bg-[var(--theme-bg-subtle)] p-4 border-t border-[var(--theme-border)] flex items-center justify-between">
                    <div className="flex gap-6 flex-wrap font-mono">
                        {isManagerOrHQ ? (
                            <div>
                                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">{t('posCommand.totalExpected')}</p>
                                <div className="text-lg text-[var(--theme-text-primary)] font-bold">
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
                                                {idx > 0 && <span className="text-[var(--theme-text-secondary)] mx-1">·</span>}
                                                {formatted}
                                                {unit && <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase ml-0.5">{unit}</span>}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] rounded-xl text-xs font-bold font-sans">
                                    <Lock size={12} className="shrink-0 text-[var(--theme-status-warning-text)]" />
                                    <span>{t('posCommand.zeroTrustBlindProtocolNotice')}</span>
                                </span>
                            </div>
                        )}
                        <div>
                            <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">{t('posCommand.totalScanned')}</p>
                            <div className={`text-lg font-bold ${
                                transferReceivingItems.every(item => {
                                    const sizeNum = item.productSize || 0;
                                    const isWV = (isWeightBased(item.unit || '') || isVolumeBased(item.unit || '')) && sizeNum > 0;
                                    const rawExpected = isWV ? (item.displayExpectedQty || item.expectedQty) * sizeNum : (item.displayExpectedQty || item.expectedQty);
                                    return item.receivedQty >= rawExpected;
                                }) ? 'text-[var(--theme-status-success-text)]' : 'text-[var(--theme-text-primary)]'
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
                                            {idx > 0 && <span className="text-[var(--theme-text-secondary)] mx-1">·</span>}
                                            {formatted}
                                            {unit && <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase ml-0.5">{unit}</span>}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleConfirmTransferReceiving}
                        disabled={isConfirmingReceive || transferReceivingItems.length === 0}
                        className="px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed text-[var(--theme-primary-text)] font-bold flex items-center gap-2 rounded-xl transition-all active:scale-95 hover:opacity-90 bg-[var(--theme-primary)] shadow-xs cursor-pointer text-xs uppercase tracking-wider"
                    >
                        {isConfirmingReceive ? (
                            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)] border-t-[var(--theme-border)] rounded-full animate-spin" /> {t('common.processing')}...</span>
                        ) : (
                            <span className="flex items-center gap-2"><CheckCircle size={16} /> {t('posCommand.finalizeReceipt')}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ReceivingForm;
