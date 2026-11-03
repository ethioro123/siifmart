import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import Modal from '../../Modal';
import { useBlindReceiptReview } from '../../../hooks/useBlindReceiptReview';
import { receiptManagerRoles, type ReceiptDetail } from '../../../types/blind-receipt-review';

interface Props {
    site: string; country: string; actor: string; role: string;
    t: (key: string) => string;
    onSaved: () => void | Promise<void>;
}
const control = 'min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 py-2 text-sm text-[var(--theme-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)] disabled:opacity-50';
export function BlindReceiptReview(props: Props) {
    const [open, setOpen] = useState(false);
    return <>
        <button type="button" className={`${control} inline-flex items-center gap-2 self-start`} onClick={() => setOpen(true)}>
            <ClipboardCheck size={18} aria-hidden="true" />
            {props.t(receiptManagerRoles.includes(props.role) ? 'warehouse.receiptReviewTitle' : 'warehouse.receiptMyCounts')}
        </button>
        {open && <ReviewWorkspace key={`${props.site}:${props.country}:${props.actor}:${props.role}`} {...props} onClose={() => setOpen(false)} />}
    </>;
}
function ReviewWorkspace({ site, country, actor, t, onClose, onSaved, role }: Props & { onClose: () => void }) {
    const [exceptions, setExceptions] = useState(receiptManagerRoles.includes(role));
    const [selected, setSelected] = useState<string>();
    const [reason, setReason] = useState('');
    const [job, setJob] = useState('');
    const [quantity, setQuantity] = useState('');
    const [message, setMessage] = useState('');
    const retry = React.useRef<{ signature: string; id: string } | undefined>(undefined);
    const { queue, detail, correction, decision, issue } = useBlindReceiptReview(site, country, actor, true, selected, exceptions);
    const busy = correction.isPending || decision.isPending || issue.isPending;
    const value = detail.data;
    const pending = value?.corrections.filter(c => !value.decisions.some(d => d.correction_id === c.id)) || [];
    const submit = async (action: 'review' | 'request' | 'approve' | 'reject' | 'issue', correctionId?: string) => {
        if (!value || busy || reason.trim().length < 3) return;
        setMessage('');
        try {
            if (action === 'issue') {
                await issue.mutateAsync({ receiptId: value.id, reason });
            } else if (action === 'request') {
                const signature = JSON.stringify([selected, job, quantity, reason.trim()]);
                if (retry.current?.signature !== signature) retry.current = { signature, id: crypto.randomUUID() };
                await correction.mutateAsync({ requestId: retry.current.id, receiptId: value.id, jobId: job, quantity: Number(quantity), reason });
            } else {
                await decision.mutateAsync({ receiptId: value.id, correctionId: correctionId || null, approve: action !== 'reject', reason });
            }
            setReason(''); setQuantity(''); setMessage(t('warehouse.receiptActionSaved'));
            try { await onSaved(); } catch { /* The saved decision is confirmed; refresh can be retried separately. */ }
        } catch { setMessage(t('warehouse.receiptActionFailed')); }
    };
    const choose = (id: string) => { setSelected(id); setReason(''); setQuantity(''); setJob(''); setMessage(''); };
    return <Modal isOpen title={t('warehouse.receiptReviewTitle')} onClose={() => { if (!busy) onClose(); }} size="xl" closeOnEscape={!busy} closeOnClickOutside={!busy}>
        <div className="space-y-4 text-[var(--theme-text-primary)]">
            <p className="text-sm leading-relaxed text-[var(--theme-text-secondary)]">{t('warehouse.receiptReviewNote')}</p>
            {message && <p role="status" className="text-sm">{message}</p>}
            {selected ? <>
                <button type="button" className={control} disabled={busy} onClick={() => choose('')}>{t('warehouse.back')}</button>
                {detail.isFetching && <p role="status">{t('warehouse.receiptLoading')}</p>}
                {detail.isError && <p role="alert">{t('warehouse.receiptLoadFailed')} <button type="button" className={control} onClick={() => void detail.refetch()}>{t('warehouse.receiptRefresh')}</button></p>}
                {value && !detail.isError && !detail.isFetching && <>
                    <ReceiptEvidence value={value} t={t} />
                    {value.issue && <p role="note" className="rounded-xl p-3 bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] break-words">{value.issue}</p>}
                    {value.corrections.map(c => {
                        const decided = value.decisions.find(d => d.correction_id === c.id);
                        return <section key={c.id} className="rounded-2xl bg-[var(--theme-bg-subtle)] p-4 space-y-2">
                            <h4 className="font-semibold">{t('warehouse.receiptCorrection')} · {c.quantity} {t('warehouse.unitsLabel')}</h4>
                            <p className="text-sm break-words">{c.reason}</p>
                            <p className="text-sm">{t(decided ? decided.approve ? 'warehouse.receiptApproved' : 'warehouse.receiptRejected' : 'warehouse.receiptPending')}</p>
                            {decided && <p className="text-sm break-words">{decided.reviewer_name} · {decided.reason}</p>}
                            {!decided && value.can_review && <div className="flex flex-wrap gap-2">
                                <button type="button" className={control} disabled={busy || reason.trim().length < 3} onClick={() => void submit('approve', c.id)}>{t('warehouse.receiptApproveCorrection')}</button>
                                <button type="button" className={control} disabled={busy || reason.trim().length < 3} onClick={() => void submit('reject', c.id)}>{t('warehouse.receiptRejectCorrection')}</button>
                            </div>}
                        </section>;
                    })}
                    {value.decisions.filter(d => d.correction_id === null).map(d => <p key={d.id} className="text-sm break-words">{t('warehouse.receiptReviewed')} · {d.reviewer_name} · {d.reason}</p>)}
                    {(value.can_review || value.can_correct) && <label className="block text-sm space-y-2">
                        <span>{t('warehouse.receiptReason')}</span>
                        <textarea className={`${control} w-full`} rows={3} maxLength={1200} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} />
                    </label>}
                    {value.can_correct && !value.issue && !value.decisions.some(d => d.correction_id === null) && <button type="button" className={control} disabled={busy || reason.trim().length < 3} onClick={() => void submit('issue')}>{t('warehouse.receiptReportIssue')}</button>}
                    {value.can_review && value.needs_review && !pending.length && !value.decisions.some(d => d.correction_id === null) &&
                        <button type="button" className={`${control} bg-[var(--theme-primary)] text-[var(--theme-primary-text)]`} disabled={busy || reason.trim().length < 3} onClick={() => void submit('review')}>{t('warehouse.receiptConfirmReview')}</button>}
                    {value.can_correct && !pending.length && <details className="border-t border-[var(--theme-border)] pt-3">
                        <summary className="cursor-pointer min-h-[44px] text-sm font-semibold">{t('warehouse.receiptRequestCorrection')}</summary>
                        <p className="text-sm my-3 text-[var(--theme-text-secondary)]">{t('warehouse.receiptCorrectionNote')}</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="text-sm space-y-2"><span>{t('warehouse.batchLotNo')}</span>
                                <select className={`${control} w-full`} value={job} onChange={e => setJob(e.target.value)} disabled={busy}>
                                    <option value="">{t('warehouse.receiptChooseLot')}</option>
                                    {value.lines.map((line, index) => <option key={line.jobId} value={line.jobId}>{index + 1} · {line.batch} · {line.quantity}</option>)}
                                </select>
                            </label>
                            <label className="text-sm space-y-2"><span>{t('warehouse.receiptCorrectedCount')}</span>
                                <input className={`${control} w-full`} type="number" inputMode="decimal" min="0" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={busy} />
                            </label>
                        </div>
                        <button type="button" className={`${control} mt-3`} disabled={busy || !job || !quantity || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || reason.trim().length < 3} onClick={() => void submit('request')}>{t('warehouse.receiptSubmitCorrection')}</button>
                    </details>}
                </>}
            </> : <>
                <label className="flex items-center gap-3 min-h-[44px] text-sm"><input type="checkbox" checked={exceptions} onChange={e => setExceptions(e.target.checked)} />{t('warehouse.receiptExceptionsOnly')}</label>
                <button type="button" className={control} disabled={queue.isFetching} onClick={() => void queue.refetch()}>{t('warehouse.receiptRefresh')}</button>
                {queue.isPending && <p role="status">{t('warehouse.receiptLoading')}</p>}
                {queue.isError && <p role="alert">{t('warehouse.receiptLoadFailed')}</p>}
                {!queue.isPending && !queue.isError && queue.data?.pages.flat().length === 0 && <p>{t('warehouse.receiptNoCounts')}</p>}
                <ul className="divide-y divide-[var(--theme-border)]">
                    {queue.data?.pages.flat().map(row => <li key={row.id}>
                        <button type="button" className="w-full text-left py-4 min-h-[52px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]" onClick={() => choose(row.id)}>
                            <p className="font-semibold break-words">{row.product_name} · {row.po_number}</p>
                            <p className="text-sm text-[var(--theme-text-secondary)]">{row.employee_name} · {row.physical_qty} {t('warehouse.unitsLabel')} · {t(row.needs_review ? 'warehouse.receiptPending' : row.reviewed ? 'warehouse.receiptReviewed' : 'warehouse.receiptRecorded')}</p>
                        </button>
                    </li>)}
                </ul>
                {queue.hasNextPage && <button type="button" className={control} disabled={queue.isFetchingNextPage} onClick={() => void queue.fetchNextPage()}>{t('warehouse.receiptLoadMore')}</button>}
            </>}
        </div>
    </Modal>;
}
export function ReceiptEvidence({ value, t }: { value: ReceiptDetail; t: (key: string) => string }) {
    return <section className="space-y-3">
        <h3 className="font-semibold text-lg break-words">{value.product_name} · {value.po_number}</h3>
        <p className="text-sm text-[var(--theme-text-secondary)]">{value.employee_name} · {value.sku}</p>
        <dl className="flex flex-wrap gap-5">
            <div><dt className="text-sm">{t('warehouse.receiptOriginalCount')}</dt><dd className="text-xl font-semibold tabular-nums">{value.physical_qty}</dd></div>
            {value.can_review && value.expected_qty !== undefined && <>
                <div><dt className="text-sm">{t('warehouse.receiptOrdered')}</dt><dd className="text-xl tabular-nums">{value.expected_qty}</dd></div>
                <div><dt className="text-sm">{t('warehouse.receiptCumulative')}</dt><dd className="text-xl tabular-nums">{(value.previous_qty || 0) + value.physical_qty}</dd></div>
                <div><dt className="text-sm">{t('warehouse.receiptDifference')}</dt><dd className="text-xl tabular-nums">{(value.previous_qty || 0) + value.physical_qty - value.expected_qty}</dd></div>
            </>}
        </dl>
        {value.can_review && <p className="text-sm text-[var(--theme-text-secondary)]">{t('warehouse.receiptPartialNote')}</p>}
        {value.lines.map(line => <div key={line.jobId} className="py-2 border-t border-[var(--theme-border)] text-sm space-y-1">
            <p className="break-words">{t('warehouse.batchLotNo')}: {line.batch} · {line.quantity} {t('warehouse.unitsLabel')}</p>
            <p>{t(line.condition === 'Good' ? 'warehouse.conditionGood' : line.condition === 'Damaged' ? 'warehouse.conditionDamaged' : line.condition === 'Expired' ? 'warehouse.conditionExpired' : 'warehouse.receiptRejected')}</p>
            {line.expiry && <p>{t('warehouse.expiryDate')}: {line.expiry}</p>}
        </div>)}
    </section>;
}
