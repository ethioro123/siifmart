import { useInventoryReviewLink } from '../../hooks/useInventoryReviewLink';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStore } from '../../contexts/CentralStore';
import { canVoteProductEdit } from '../../utils/productEditApproval';
import { ProductEditApprovalProgress } from './ProductEditApprovalProgress';
import React, { useEffect, useState } from 'react';
import { Product, PendingInventoryChange } from '../../types';
import { InventoryHistoryTable } from './components/InventoryHistoryTable';
import { DetailedComparison } from './components/InventoryChangeDiff';

interface InventoryPendingProps {
    pendingChanges: PendingInventoryChange[];
    historyChanges?: PendingInventoryChange[];
    allProducts: Product[];
    canApprove: boolean;
    isSubmitting: boolean;
    userRole?: string;
    currencySymbol?: string;
    onApproveChange: (change: PendingInventoryChange) => void;
    onRejectChange: (change: PendingInventoryChange, reason: string) => void;
}

export const InventoryPending: React.FC<InventoryPendingProps> = ({ pendingChanges, historyChanges = [], allProducts, canApprove, isSubmitting, currencySymbol = '', onApproveChange, onRejectChange }) => {
    const { user } = useStore();
    const linked = useInventoryReviewLink();
    const { t } = useLanguage();
    const [section, setSection] = useState<'pending' | 'history'>('pending');
    const [selected, setSelected] = useState<PendingInventoryChange | null>(null);
    const [reason, setReason] = useState('');
    useEffect(() => { setSelected(linked.query.data || null); setReason(''); }, [linked.id, linked.query.data]);
    useEffect(() => {
        if (!selected) return;
        const latest = [...pendingChanges, ...historyChanges, ...(linked.query.data ? [linked.query.data] : [])].find(change => change.id === selected.id);
        if (!latest) setSelected(null);
        else if (latest !== selected) setSelected(latest);
    }, [pendingChanges, historyChanges, selected, linked.query.data]);
    return <section className="space-y-4" aria-label="Stock reviews">
        {linked.id && linked.query.isFetching && <p role="status">{t('warehouse.opLoading')}</p>}
        {linked.id && linked.query.isError && <p role="alert">{t('warehouse.opLoadFailed')}</p>}
        <p className="text-sm text-[var(--theme-text-secondary)]">Product edits need one approval each from regional Operations, Supply Chain and Merchandising. Stock corrections and removal requests keep their existing approval rules.</p>
        <div className="flex flex-wrap gap-2">
            {(['pending', 'history'] as const).map(tab => <button key={tab} type="button" aria-pressed={section === tab} onClick={() => { setSection(tab); setSelected(null); setReason(''); }} className="min-h-11 flex-1 sm:flex-initial justify-center rounded-xl border border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-primary)] transition-all touch-manipulation active:scale-[0.98]">{tab === 'pending' ? `Stock reviews (${pendingChanges.length})` : 'Review history'}</button>)}
        </div>
        {section === 'history' ? <InventoryHistoryTable historyChanges={historyChanges} allProducts={allProducts} currencySymbol={currencySymbol} onViewDetails={change => { setSelected(change); setReason(''); }} /> : pendingChanges.length === 0 ? <p className="rounded-xl border border-[var(--theme-border)] p-6 text-sm text-[var(--theme-text-secondary)]">No stock requests awaiting review.</p> : <div className="space-y-3">
            {pendingChanges.map(change => <article key={change.id} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 min-w-0 break-words shadow-xs">
                <h3 className="font-semibold text-sm text-[var(--theme-text-primary)]">{change.productName}</h3>
                <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{change.productSku} · {change.changeType === 'stock_adjustment' ? 'Stock correction' : change.changeType === 'delete' ? 'Removal request' : 'Product change request'}</p>
                <p className="text-xs text-[var(--theme-text-muted)] mt-1">{change.adjustmentReason || 'No reason recorded'}</p>
                <button type="button" onClick={() => { setSelected(change); setReason(''); }} className="mt-3 min-h-11 w-full sm:w-auto rounded-xl border border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-primary)] active:scale-[0.98] touch-manipulation">Review request</button>
            </article>)}
        </div>}
        {selected && <section aria-label="Stock request details" className="space-y-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3.5 sm:p-4 min-w-0 overflow-x-auto shadow-xs">
            <h3 className="font-semibold text-base text-[var(--theme-text-primary)]">{selected.productName}</h3>
            <p className="text-xs text-[var(--theme-text-secondary)]">Requested by {selected.requestedBy} · {selected.status}</p>
            {selected.changeType === 'stock_adjustment' && <p className="text-sm font-semibold text-[var(--theme-text-primary)]">{selected.adjustmentType}: {selected.adjustmentQty} units · {selected.adjustmentReason}</p>}
            <ProductEditApprovalProgress request={selected} />
            <DetailedComparison requestForDetails={selected} allProducts={allProducts} />
            {selected.status === 'pending' && (selected.changeType === 'edit' ? canVoteProductEdit(selected, user?.role, user?.id) : canApprove) && <>
                <label className="block text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Rejection reason<textarea value={reason} onChange={event => setReason(event.target.value)} className="mt-1 block w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] p-3 text-xs" /></label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button type="button" disabled={isSubmitting} onClick={() => onApproveChange(selected)} className="min-h-11 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-btn-primary-text)] font-semibold px-4 text-xs disabled:opacity-50 active:scale-[0.98] touch-manipulation">{selected.changeType === 'edit' ? 'Record regional approval' : 'Approve stock request'}</button>
                    <button type="button" disabled={isSubmitting || !reason.trim()} onClick={() => onRejectChange(selected, reason.trim())} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-primary)] disabled:opacity-50 active:scale-[0.98] touch-manipulation">Reject request</button>
                </div>
            </>}
            <button type="button" onClick={() => setSelected(null)} className="min-h-11 px-4 text-xs font-semibold text-[var(--theme-text-secondary)] touch-manipulation">Close details</button>
        </section>}
    </section>;
};
