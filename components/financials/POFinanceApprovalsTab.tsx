import React, { useState } from 'react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { usePOFinanceReview } from '../../hooks/usePOFinanceReview';
import { ViewPOModal } from '../procurement/ViewPOModal';

export default function POFinanceApprovalsTab() {
    const { user } = useStore();
    const { effectiveCountry } = useData();
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { queue, detail } = usePOFinanceReview(page, selectedId);
    if (user?.role !== 'country_finance_director') return null;
    const rows = queue.data?.data || [];
    const count = queue.data?.count || 0;
    const buttonStyle = 'min-h-11 rounded-xl border border-[var(--theme-border)] px-4 text-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2';
    return <section className="space-y-4 text-[var(--theme-text-primary)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold">Purchase order finance approvals</h2>
                <p className="text-sm text-[var(--theme-text-secondary)]">Orders above their regional limit awaiting finance clearance. HQ Procurement gives final approval after clearance.</p></div>
            <button type="button" className={buttonStyle} onClick={() => queue.refetch()} disabled={queue.isFetching}>Refresh</button>
        </div>
        {queue.isPending ? <p role="status">Loading purchase orders…</p> : queue.isError ? <p role="alert">Could not load purchase orders. {queue.error.message}</p> : <>
            <p className="text-sm">{count} awaiting finance clearance</p>
            {!rows.length && <p className="p-6 rounded-xl bg-[var(--theme-bg-subtle)]">No orders awaiting clearance on this page.</p>}
            <div className="grid gap-3">{rows.map(row => {
                const ownOrder = [row.created_by, row.requested_by].some(name => name?.trim().toLowerCase() === user.name?.trim().toLowerCase());
                return <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-panel)] p-4">
                    <div className="min-w-0"><h3 className="font-semibold break-words">{row.po_number || row.id} · {row.supplier_name}</h3>
                        <p className="text-sm">{row.currency} {Number(row.total_amount).toLocaleString()} · Regional limit: {row.currency} {Number(row.regional_limit).toLocaleString()}</p>
                        <p className="text-xs text-[var(--theme-text-secondary)]">{row.region_code} · {row.status}{ownOrder ? ' · A different finance approver is required for your own order.' : ''}</p></div>
                    <button type="button" className={buttonStyle} onClick={() => setSelectedId(row.id)}>Review PO</button>
                </article>;
            })}</div>
            <div className="flex items-center gap-3"><button type="button" className={buttonStyle} disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button>
                <span className="text-sm">Page {page}</span><button type="button" className={buttonStyle} disabled={page * 20 >= count} onClick={() => setPage(value => value + 1)}>Next</button></div>
        </>}
        {selectedId && detail.isPending && <p role="status">Loading order details…</p>}
        {selectedId && detail.isError && <p role="alert">Could not load this order. {detail.error.message}</p>}
        {selectedId && detail.data && detail.data.country_code === effectiveCountry && <ViewPOModal isOpen onClose={() => setSelectedId(null)} po={detail.data} onEdit={() => undefined} onSuccess={() => queue.refetch()} />}
    </section>;
}
