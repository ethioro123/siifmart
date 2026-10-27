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
    const [section, setSection] = useState<'pending' | 'history'>('pending');
    const [selected, setSelected] = useState<PendingInventoryChange | null>(null);
    const [reason, setReason] = useState('');
    useEffect(() => {
        if (!selected) return;
        const latest = [...pendingChanges, ...historyChanges].find(change => change.id === selected.id);
        if (!latest) setSelected(null);
        else if (latest !== selected) setSelected(latest);
    }, [pendingChanges, historyChanges, selected]);
    return <section className="space-y-4" aria-label="Stock reviews">
        <p className="text-sm text-[var(--theme-text-secondary)]">Product edits need one approval each from regional Operations, Supply Chain and Merchandising. Stock corrections and removal requests keep their existing approval rules.</p>
        <div className="flex flex-wrap gap-2">
            {(['pending', 'history'] as const).map(tab => <button key={tab} type="button" aria-pressed={section === tab} onClick={() => { setSection(tab); setSelected(null); setReason(''); }} className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-4 text-sm text-[var(--theme-text-primary)]">{tab === 'pending' ? `Stock reviews (${pendingChanges.length})` : 'Review history'}</button>)}
        </div>
        {section === 'history' ? <InventoryHistoryTable historyChanges={historyChanges} allProducts={allProducts} currencySymbol={currencySymbol} onViewDetails={change => { setSelected(change); setReason(''); }} /> : pendingChanges.length === 0 ? <p className="rounded-xl border border-[var(--theme-border)] p-6 text-sm text-[var(--theme-text-secondary)]">No stock requests awaiting review.</p> : <div className="space-y-3">
            {pendingChanges.map(change => <article key={change.id} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 min-w-0 break-words">
                <h3 className="font-semibold text-[var(--theme-text-primary)]">{change.productName}</h3>
                <p className="text-sm text-[var(--theme-text-secondary)]">{change.productSku} · {change.changeType === 'stock_adjustment' ? 'Stock correction' : change.changeType === 'delete' ? 'Removal request' : 'Product change request'}</p>
                <p className="text-sm text-[var(--theme-text-secondary)]">{change.adjustmentReason || 'No reason recorded'}</p>
                <button type="button" onClick={() => { setSelected(change); setReason(''); }} className="mt-2 min-h-[44px] rounded-lg border border-[var(--theme-border)] px-3 text-sm text-[var(--theme-text-primary)]">Review request</button>
            </article>)}
        </div>}
        {selected && <section aria-label="Stock request details" className="space-y-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 min-w-0 overflow-x-auto">
            <h3 className="font-semibold text-[var(--theme-text-primary)]">{selected.productName}</h3>
            <p className="text-sm text-[var(--theme-text-secondary)]">Requested by {selected.requestedBy} · {selected.status}</p>
            {selected.changeType === 'stock_adjustment' && <p className="text-sm text-[var(--theme-text-primary)]">{selected.adjustmentType}: {selected.adjustmentQty} units · {selected.adjustmentReason}</p>}
            <ProductEditApprovalProgress request={selected} />
            <DetailedComparison requestForDetails={selected} allProducts={allProducts} />
            {selected.status === 'pending' && (selected.changeType === 'edit' ? canVoteProductEdit(selected, user?.role, user?.id) : canApprove) && <>
                <label className="block text-sm text-[var(--theme-text-primary)]">Rejection reason<textarea value={reason} onChange={event => setReason(event.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-app)] p-2" /></label>
                <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={isSubmitting} onClick={() => onApproveChange(selected)} className="min-h-[44px] rounded-lg border border-[var(--theme-border)] px-3 text-[var(--theme-text-primary)] disabled:opacity-50">{selected.changeType === 'edit' ? 'Record regional approval' : 'Approve stock request'}</button>
                    <button type="button" disabled={isSubmitting || !reason.trim()} onClick={() => onRejectChange(selected, reason.trim())} className="min-h-[44px] rounded-lg border border-[var(--theme-border)] px-3 text-[var(--theme-text-primary)] disabled:opacity-50">Reject request</button>
                </div>
            </>}
            <button type="button" onClick={() => setSelected(null)} className="min-h-[44px] px-3 text-sm text-[var(--theme-text-secondary)]">Close details</button>
        </section>}
    </section>;
};
