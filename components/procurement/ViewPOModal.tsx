import { POReceivingHandoff } from './POReceivingHandoff';
import { useClearPOFinance } from '../../hooks/usePOFinanceReview';
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { PurchaseOrder, Product } from '../../types';
import { getCountryProfile } from '../../utils/localization';
import { CheckCircle, Printer, Edit3, Trash2, Package, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { purchaseOrdersService } from '../../services/supabase.service';
import { formatCompactNumber, formatDateTime } from '../../utils/formatting';
import { formatPONumber } from '../../utils/jobIdFormatter';
import { formatPOItemDescription, getPOItemPackagingSummary } from './utils';
import { POItemExpandedDetails } from './POItemExpandedDetails';
import { SmartProductAttributeStrip } from '../SmartProductAttributeStrip';
import { POPrintView, generatePOHTML } from './POPrintView';
import { printHtmlContent } from '../../utils/printHelper';
import { logger } from '../../utils/logger';
import { POApprovalModal } from './POApprovalModal';
import { getPoApprovalPolicy } from '../../utils/poApprovalPolicy';

interface ViewPOModalProps {
    isOpen: boolean;
    onClose: () => void;
    po: PurchaseOrder | null;
    onEdit: (po: PurchaseOrder) => void;
    onSuccess: () => void; // Trigger refresh
}

export const ViewPOModal: React.FC<ViewPOModalProps> = ({ isOpen, onClose, po, onEdit, onSuccess }) => {
    const clearFinance = useClearPOFinance();
    const { allProducts, sites, settings, regions = [] } = useData();
    const { user, showToast } = useStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; mode: 'approve' | 'reject' | 'finance' | 'recommend' }>({
        isOpen: false,
        mode: 'approve'
    });

    const site = po?.siteId ? sites.find(s => s.id === po.siteId) : undefined;
    const currencySymbol = po?.currency || site?.currency || (site?.country === 'KE' ? 'KSh' : getCountryProfile(settings?.country || 'ET').currencySymbol);

    const toggleItem = (index: number) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    if (!po) return null;

    const { limit: autonomousLimit, hasConfiguredLimit, needsFinanceClearance: isExceedingAutonomous,
        financeCleared, isCreator, canApprove, canClearFinance, canRecommendCountryMd, statusMessage } = getPoApprovalPolicy({
        po, role: user?.role, actorName: user?.name,
        actorRegionCode: user?.regionCode || user?.region_code,
        actorCountryCode: user?.country || (user as any)?.country_code, regions, sites
    });
    const isCEO = user?.role === 'group_ceo';
    const isFinanceRole = user?.role === 'country_finance_director' || user?.role === 'regional_finance_manager';
    const isOperationalDirector = ['regional_operations_manager', 'regional_procurement_manager', 'country_operations_director'].includes(user?.role || '');
    const canFullDelete = isCEO || isOperationalDirector;

    const handleOpenApprove = () => {
        if (!canApprove) {
            showToast('This purchase order is not ready for your approval.', 'error');
            return;
        }
        setApprovalModal({ isOpen: true, mode: 'approve' });
    };

    const handleOpenReject = () => {
        setApprovalModal({ isOpen: true, mode: 'reject' });
    };

    const handleConfirmAction = async (reasonCode: string, notes: string) => {
        setIsSubmitting(true);
        try {
            if (approvalModal.mode === 'approve') {
                if (!user?.id || !user.role) throw new Error('Signed-in approver identity is required.');
                await purchaseOrdersService.approve({
                    poId: po.id,
                    approverId: user.id,
                    approverName: user?.name || 'Authorized Manager',
                    approverRole: user.role,
                    reasonCode: reasonCode as any,
                    notes: notes || 'Approved via PO Inspector modal',
                    approverCountry: user?.country || (user as any)?.country_code
                });
                showToast(`PO ${formatPONumber(po)} approved successfully`, 'success');
            } else if (approvalModal.mode === 'finance') {
                await clearFinance.mutateAsync({ poId: po.id, reason: notes });
                showToast(`Finance clearance recorded for PO ${formatPONumber(po)}`, 'success');
            } else if (approvalModal.mode === 'recommend') {
                await purchaseOrdersService.recommendCountryMd(po.id, notes);
                showToast(`Country MD recommendation recorded for PO ${formatPONumber(po)}`, 'success');
            } else {
                if (!user?.id || !user.role) throw new Error('Signed-in rejector identity is required.');
                await purchaseOrdersService.reject({
                    poId: po.id,
                    rejectorId: user.id,
                    rejectorName: user?.name || 'Authorized Manager',
                    rejectorRole: user.role,
                    reasonCode: reasonCode as any,
                    notes: notes || 'Rejected via PO Inspector modal'
                });
                showToast(`PO ${formatPONumber(po)} rejected`, 'info');
            }
            setApprovalModal({ isOpen: false, mode: 'approve' });
            onSuccess();
            onClose();
        } catch (error: any) {
            logger.error('ViewPOModal', `Error during PO ${approvalModal.mode}:`, error);
            showToast(error.message || `Failed to ${approvalModal.mode} PO`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePO = async () => {
        if (!window.confirm(`Are you sure you want to delete PO ${formatPONumber(po)}? This cannot be undone.`)) return;

        try {
            await purchaseOrdersService.delete(po.id);
            showToast(`PO ${formatPONumber(po)} cancelled successfully`, 'success');
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('ViewPOModal', 'Error deleting PO:', error);
            showToast('Failed to delete PO', 'error');
        }
    };

    const handlePrintPO = () => {
        if (!po) return;
        const html = generatePOHTML(po, sites, user, allProducts, settings);
        printHtmlContent(html);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
            {/* === SCREEN UI (Hidden in print) === */}
            <div className="space-y-6 print:hidden">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                            {formatPONumber(po)}
                        </h2>
                        <p className="text-sm text-[var(--theme-text-secondary)] mt-1">
                            {po.supplierName}
                            {po.supplierId?.startsWith('MANUAL') && (
                                <span className="ml-2 text-[10px] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full font-semibold uppercase">MANUAL</span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                            po.status === 'Received' ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]' :
                            po.status === 'Approved' ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]' :
                            po.status === 'Pending' ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]' :
                            po.status === 'Draft' ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]' :
                            'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                        }`}>
                            {po.status}
                        </div>
                        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide ${
                            po.priority === 'High' || po.priority === 'Urgent' ? 'text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)]' :
                            'text-[var(--theme-text-secondary)] border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]'
                        }`}>
                            Priority: {po.priority || 'Normal'}
                        </div>
                    </div>
                </div>

                {/* Key Info - Apple Card Grid */}
                <div className={`grid grid-cols-2 ${po.approvedBy ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3`}>
                    <div className="rounded-2xl p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] shadow-sm">
                        <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold mb-1">Date</p>
                        <p className="text-[var(--theme-text-primary)] font-semibold font-mono text-sm tabular-nums">{po.date || (po.created_at ? formatDateTime(po.created_at, { showTime: true }) : 'N/A')}</p>
                    </div>
                    <div className="rounded-2xl p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] shadow-sm">
                        <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold mb-1">Requested By</p>
                        <p className="text-[var(--theme-text-primary)] font-semibold text-sm truncate">{po.requestedBy || po.createdBy || 'Unknown'}</p>
                    </div>
                    {po.approvedBy && (
                        <div className="rounded-2xl p-4 border border-[var(--theme-status-success-border)] bg-[var(--theme-status-success-bg)] shadow-sm">
                            <p className="text-[10px] text-[var(--theme-status-success-text)] uppercase tracking-wider font-semibold mb-1">Approved By</p>
                            <p className="text-[var(--theme-text-primary)] font-semibold text-sm truncate">{po.approvedBy}</p>
                        </div>
                    )}
                    <div className="rounded-2xl p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] shadow-sm">
                        <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold mb-1">Destination</p>
                        <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-[var(--theme-text-secondary)] shrink-0" />
                            <p className="text-[var(--theme-text-primary)] font-semibold text-sm truncate">
                                {sites?.find(s => s.id === po.siteId)?.name || po.destination || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] shadow-sm">
                        <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold mb-1">Expected</p>
                        <p className="text-[var(--theme-text-primary)] font-semibold font-mono text-sm tabular-nums">{po.expectedDelivery || 'N/A'}</p>
                    </div>
                </div>

                {/* Additional Details Row */}
                {(po.paymentTerms || po.approvedBy) && (
                    <div className="flex flex-wrap gap-4 text-sm">
                        {po.paymentTerms && (
                            <div className="flex items-center gap-1.5 text-xs text-[var(--theme-text-secondary)]">
                                <span className="uppercase font-semibold tracking-wider text-[10px]">Terms:</span>
                                <span className="text-[var(--theme-text-primary)] font-semibold">{po.paymentTerms}</span>
                            </div>
                        )}
                        {po.approvedBy && (
                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider text-[10px]">Approved By:</span>
                                <span className="text-[var(--theme-text-primary)] font-semibold">{po.approvedBy}</span>
                                {po.approvedAt && formatDateTime(po.approvedAt, { showTime: true }) !== 'Invalid Date' && (
                                    <span className="text-[var(--theme-text-secondary)] font-mono text-xs">({formatDateTime(po.approvedAt, { showTime: true })})</span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Order Items Table */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                            Order Payload
                        </h3>
                        {(() => {
                            const totalSellable = po.lineItems?.reduce((sum, item) => sum + getPOItemPackagingSummary(item, allProducts).sellableQty, 0) || 0;
                            const totalManifest = po.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                            return (
                                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                    <span>{totalSellable.toLocaleString()} Total Sellable Units</span>
                                    {totalManifest !== totalSellable && (
                                        <span className="text-[var(--theme-text-secondary)] lowercase font-normal">
                                            ({totalManifest.toLocaleString()} manifest {totalManifest === 1 ? 'unit' : 'units'})
                                        </span>
                                    )}
                                </span>
                            );
                        })()}
                    </div>
                    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-panel)] overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)]">
                                    <th className="text-left p-4 text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider w-8">#</th>
                                    <th className="text-left p-4 text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider w-24">SKU</th>
                                    <th className="text-left p-4 text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider min-w-[220px]">Manifest Description</th>
                                    <th className="text-left p-4 text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider w-36">Packaging</th>
                                    <th className="text-right p-4 text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider w-36">Qty (Sellable)</th>
                                    <th className="text-right p-4 text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider w-28">Cost</th>
                                    <th className="text-right p-4 text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider w-24">Total</th>
                                    <th className="w-10 px-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {po.lineItems?.map((item, i) => {
                                    const pkg = getPOItemPackagingSummary(item, allProducts);
                                    return (
                                        <React.Fragment key={i}>
                                            <tr
                                                className={`hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer ${expandedItems[i] ? 'bg-[var(--theme-bg-subtle)]' : ''}`}
                                                onClick={() => toggleItem(i)}
                                            >
                                                <td className="p-4 text-[var(--theme-text-secondary)] text-[10px] font-bold">{(i + 1).toString().padStart(2, '0')}</td>
                                                <td className="p-4 text-[var(--theme-text-secondary)] text-xs font-mono font-semibold">{item.sku || allProducts?.find(p => p.id === item.productId)?.sku || allProducts?.find(p => p.name === item.productName)?.sku || '—'}</td>
                                                <td className="p-4">
                                                    <div className="text-[var(--theme-text-primary)] font-bold tracking-tight text-sm break-words leading-tight max-w-[360px]">{formatPOItemDescription(item)}</div>
                                                    <SmartProductAttributeStrip item={item} catalogProducts={allProducts} currencySymbol={currencySymbol} maxPills={5} showDomainSpecs={true} showUnitPrice={false} className="mt-1" />
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs font-bold text-[var(--theme-text-primary)] flex items-center gap-1">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] text-[11px] font-semibold uppercase">
                                                            <Package size={11} className="shrink-0" /> {pkg.packBadge || pkg.manifestUnitName}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-1">
                                                        {pkg.packDetail}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-[var(--theme-text-primary)] font-bold tabular-nums text-sm">
                                                        {pkg.sellableQty.toLocaleString()} <span className="text-[11px] font-medium text-[var(--theme-text-secondary)]">{pkg.sellUnitLabel}</span>
                                                    </div>
                                                    {pkg.hasMultiplier ? (
                                                        <div className="text-[11px] text-[var(--theme-text-secondary)] font-medium whitespace-nowrap mt-0.5">
                                                            {item.quantity} {pkg.manifestUnitName.toLowerCase()} ({pkg.unitsPerOrderUnit} {pkg.sellUnitLabel}/{pkg.manifestUnitName.replace(/s$/, '').toLowerCase()})
                                                        </div>
                                                    ) : (
                                                        <div className="text-[11px] text-[var(--theme-text-secondary)] font-medium">
                                                            (individual units)
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-[var(--theme-text-primary)] font-bold font-mono tabular-nums text-xs">
                                                        {formatCompactNumber(item.unitCost, { currency: currencySymbol })}{pkg.hasMultiplier ? ` /${pkg.manifestUnitName.replace(/s$/, '').toLowerCase()}` : ''}
                                                    </div>
                                                    {pkg.hasMultiplier && (
                                                        <div className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                                            ~{formatCompactNumber(pkg.costPerSellableUnit, { currency: currencySymbol })}/{pkg.sellUnitLabel}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-[var(--theme-text-primary)] text-right font-bold font-mono tabular-nums">{formatCompactNumber(item.totalCost, { currency: currencySymbol })}</td>
                                                <td className="p-4 text-[var(--theme-text-secondary)]">
                                                    {expandedItems[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </td>
                                            </tr>
                                            {expandedItems[i] && (
                                                <tr className="bg-[var(--theme-bg-subtle)]">
                                                    <td colSpan={8} className="p-4 pl-12">
                                                        <POItemExpandedDetails item={item} allProducts={allProducts} currencySymbol={currencySymbol} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                {(!po.lineItems || po.lineItems.length === 0) && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-[var(--theme-text-secondary)] italic">No items in this order</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Minimalist Summary */}
                <div className="flex justify-end pt-8">
                    <div className="w-full md:w-80 space-y-4 text-sm">
                        <div className="flex justify-between items-end border-b border-[var(--theme-border-subtle)] pb-2">
                            <span className="uppercase tracking-wider text-[10px] font-semibold text-[var(--theme-text-secondary)]">Base Payload</span>
                            <span className="font-mono text-[var(--theme-text-primary)] font-bold tabular-nums">{currencySymbol} {(po.totalAmount - ((po.taxAmount || 0) + (po.shippingCost || 0))).toLocaleString()}</span>
                        </div>
                        {po.shippingCost && po.shippingCost > 0 ? (
                            <div className="flex justify-between items-end border-b border-[var(--theme-border-subtle)] pb-2">
                                <span className="uppercase tracking-wider text-[10px] font-semibold text-[var(--theme-text-secondary)]">Logistics</span>
                                <span className="font-mono text-[var(--theme-text-secondary)] font-semibold tabular-nums">{currencySymbol} {po.shippingCost.toLocaleString()}</span>
                            </div>
                        ) : null}
                        {po.taxAmount && po.taxAmount > 0 ? (
                            <div className="flex justify-between items-end border-b border-[var(--theme-border-subtle)] pb-2">
                                <span className="uppercase tracking-wider text-[10px] font-semibold text-[var(--theme-text-secondary)]">Tax</span>
                                <span className="font-mono text-[var(--theme-text-secondary)] font-semibold tabular-nums">{currencySymbol} {po.taxAmount.toLocaleString()}</span>
                            </div>
                        ) : null}
                        <div className="flex justify-between items-end pt-2">
                            <span className="uppercase tracking-wider text-xs font-bold text-[var(--theme-text-primary)]">Total Authority</span>
                            <span className="font-mono text-2xl font-bold text-[var(--theme-text-primary)] tabular-nums tracking-tight leading-none">{currencySymbol} {po.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {po.notes && !po.notes.includes('Order received and processed') && (
                    <div className="bg-[var(--theme-bg-subtle)] rounded-2xl p-6 border border-[var(--theme-border)] mt-8">
                        <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold mb-3">Protocol Notes & Instructions</p>
                        <p className="text-sm text-[var(--theme-text-primary)] whitespace-pre-wrap leading-relaxed">
                            {po.notes.replace(/\[APPROVED_BY:.*?\]/g, '').replace(/\[SITES:.*?\]/g, '').replace(/\[Multi-Site Order.*?\]/g, '').trim()}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-[var(--theme-border)] space-y-3">
                    {/* Primary Actions for Draft POs */}
                    {['Draft', 'Pending'].includes(po.status) && (
                        <div className="space-y-3">
                            {canApprove && <button onClick={handleOpenApprove} disabled={isSubmitting}
                                className="h-11 px-5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-sm rounded-full disabled:opacity-50">
                                {isSubmitting ? 'Signing off...' : 'Approve purchase order'}
                            </button>}
                            {canClearFinance && <button onClick={() => setApprovalModal({ isOpen: true, mode: 'finance' })}
                                disabled={isSubmitting} className="h-11 px-5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-sm rounded-full disabled:opacity-50">
                                Record finance clearance
                            </button>}
                            {canRecommendCountryMd && <button onClick={() => setApprovalModal({ isOpen: true, mode: 'recommend' })}
                                disabled={isSubmitting} className="h-11 px-5 bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] font-semibold text-sm rounded-full disabled:opacity-50">
                                Recommend PO (Country MD)
                            </button>}
                            {isCEO && !canApprove && !isCreator && <button onClick={handleOpenReject}
                                className="h-11 px-5 rounded-full border border-[var(--theme-border)] text-[var(--theme-text-primary)] text-sm">
                                Reject
                            </button>}
                            <p className="text-xs text-[var(--theme-text-secondary)]">
                                {statusMessage || (!hasConfiguredLimit ? 'Approval is waiting for a configured regional PO limit.'
                                    : isCreator ? 'The creator or requester needs a different approver.'
                                    : isExceedingAutonomous ? `Regional limit: ${currencySymbol} ${autonomousLimit?.toLocaleString()}. ${financeCleared ? 'Finance clearance recorded; HQ procurement approval required.' : 'HQ finance clearance required before HQ procurement approval.'}`
                                    : `Regional limit: ${currencySymbol} ${autonomousLimit?.toLocaleString() ?? 'not applicable'}. Awaiting procurement approval.`)}
                            </p>
                        </div>
                    )}

                    {/* Status Messages */}
                    {po.status === 'Received' && (
                        <div className="p-3.5 px-4 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-2xl flex items-center gap-2.5 text-[var(--theme-status-success-text)] text-xs font-medium">
                            <CheckCircle size={16} />
                            <span>Order received and processed</span>
                        </div>
                    )}

                    <POReceivingHandoff po={po} />

                    {/* Secondary Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                        <button
                            onClick={handlePrintPO}
                            className="h-10 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] rounded-full border border-[var(--theme-border)] transition-all flex items-center justify-center gap-2 font-medium text-xs active:scale-[0.98]"
                        >
                            <Printer size={15} /> Print
                        </button>

                        {/* Edit & Delete Action Logic:
                            1. CEO/Country Commercial Director can Edit/Delete anything NOT fully Received.
                            2. Other staff can ONLY Edit/Delete their own Draft POs.
                        */}
                        {((canFullDelete && po.status !== 'Received') ||
                          (!isFinanceRole && po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                            <>
                                <button
                                    onClick={() => {
                                        onEdit(po);
                                        onClose();
                                    }}
                                    className="h-10 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] rounded-full border border-[var(--theme-border)] transition-all flex items-center justify-center gap-1.5 font-medium text-xs active:scale-[0.98]"
                                >
                                    <Edit3 size={14} /> Edit
                                </button>
                                <button
                                    onClick={handleDeletePO}
                                    className="h-10 px-4 bg-[var(--theme-bg-subtle)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] rounded-full border border-[var(--theme-border)] border-[var(--theme-status-danger-border)] transition-all flex items-center justify-center gap-1.5 font-medium text-xs active:scale-[0.98]"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="h-10 px-5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-full transition-all font-medium text-xs active:scale-[0.98]"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            {/* === BRAND NEW DEDICATED PRINT UI (Highly efficient invoice layout) === */}
            <POPrintView po={po} sites={sites} user={user} allProducts={allProducts} settings={settings} />

            {/* Dedicated Reason-Code PO Approval / Rejection Modal */}
            <POApprovalModal
                isOpen={approvalModal.isOpen}
                onClose={() => setApprovalModal(prev => ({ ...prev, isOpen: false }))}
                mode={approvalModal.mode}
                po={po}
                onConfirm={handleConfirmAction}
                isSubmitting={isSubmitting}
            />
        </Modal>
    );
};
