import React from 'react';
import { Package, MapPin, Box, ArrowRight, ShieldCheck, Tag, EyeOff, AlertTriangle } from 'lucide-react';
import { PurchaseOrder, Product } from '../../../../types';
import { ItemAttributeBadges } from '../../ItemAttributeBadges';
import { formatPOItemDescription, formatPackBadge } from '../../../procurement/utils';

interface Step1ReceiveIntakeProps {
    splitReceivingItem: any;
    splitReceivingPO: PurchaseOrder;
    allProducts: Product[];
    isBlindReceiving: boolean;
    expectedSellable: number;
    previouslyReceived: number;
    t: (key: string) => string;
}

export const Step1ReceiveIntake: React.FC<Step1ReceiveIntakeProps> = ({
    splitReceivingItem,
    splitReceivingPO,
    allProducts,
    isBlindReceiving,
    expectedSellable,
    previouslyReceived,
    t,
}) => {
    const matchedProduct = allProducts?.find(p => p.sku === splitReceivingItem?.sku || p.id === splitReceivingItem?.productId);
    const packagingSummary = formatPOItemDescription(splitReceivingItem);

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 bg-[var(--theme-bg-app)]">
            {/* Origin & PO Banner */}
            <div className="p-4 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-text-primary)] flex items-center justify-center shrink-0">
                        <Package size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-accent)]">
                                {t('warehouse.inboundManifestIntake') || 'Inbound Manifest Intake'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[11px] font-mono font-semibold text-[var(--theme-text-primary)]">
                                PO #{splitReceivingPO.poNumber || splitReceivingPO.id}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 truncate">
                            {t('warehouse.supplier') || 'Supplier'}: <strong className="text-[var(--theme-text-primary)]">{splitReceivingPO.supplierName || 'Vendor'}</strong>
                        </p>
                    </div>
                </div>


            </div>

            {/* Zero-Trust Blind Policy Alert */}
            {isBlindReceiving && (
                <div className="p-3.5 rounded-2xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] flex items-center justify-center shrink-0">
                        <EyeOff size={16} />
                    </div>
                    <div>
                        <p className="font-bold uppercase tracking-tight">{t('warehouse.blindModeActiveTitle') || 'Zero-Trust Blind Receiving Mode Active'}</p>
                        <span className="text-[11px] opacity-90">
                            {t('warehouse.blindModeActiveDesc') || 'Expected piece quantities are masked to enforce unbiased physical count at intake dock.'}
                        </span>
                    </div>
                </div>
            )}

            {/* Inbound Item Details Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
                        {matchedProduct?.image ? (
                            <img src={matchedProduct.image} alt={splitReceivingItem.name} className="w-full h-full object-cover" />
                        ) : (
                            <Box size={24} className="text-[var(--theme-text-secondary)]" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm md:text-base font-bold uppercase text-[var(--theme-text-primary)] truncate">
                            {splitReceivingItem.name || splitReceivingItem.productName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2.5 py-0.5 rounded-lg border border-[var(--theme-border)]">
                                {splitReceivingItem.sku}
                            </span>
                            {packagingSummary && (
                                <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                    {packagingSummary}
                                </span>
                            )}
                        </div>
                        <div className="mt-2">
                            <ItemAttributeBadges item={splitReceivingItem} allProducts={allProducts} />
                        </div>
                    </div>
                </div>

                {/* Expected Quantity Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-[var(--theme-border)]">
                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            {t('warehouse.manifestExpected') || t('warehouse.expected') || 'Manifest Expected'}
                        </span>
                        <div className="mt-1 font-mono text-sm md:text-base font-bold text-[var(--theme-text-primary)]">
                            {isBlindReceiving ? (
                                <span className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">*** {t('warehouse.blindAudit') || 'Blind Mode'}</span>
                            ) : (
                                <span>{expectedSellable} {t('warehouse.unitsLabel') || 'Units'}</span>
                            )}
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            {t('warehouse.previouslyReceived') || 'Previously Received'}
                        </span>
                        <div className="mt-1 font-mono text-sm md:text-base font-bold text-[var(--theme-text-primary)]">
                            {previouslyReceived} {t('warehouse.unitsLabel') || 'Units'}
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] col-span-2 md:col-span-1">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            {t('warehouse.intakeStatus') || 'Intake Status'}
                        </span>
                        <div className="mt-1 font-semibold text-xs md:text-sm text-[var(--theme-accent)] uppercase">
                            {t('warehouse.readyForQualityAudit') || 'Ready for Quality Audit'}
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};
