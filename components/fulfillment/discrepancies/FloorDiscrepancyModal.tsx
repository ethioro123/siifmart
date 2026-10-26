import React, { useEffect, useRef, useState } from 'react';
import type { User, WMSJob } from '../../../types';
import type { FloorDiscrepancy, FloorResolutionInput } from '../../../types/floor-discrepancy';
import { useFloorDiscrepancies } from '../../../hooks/useFloorDiscrepancies';
import { logger } from '../../../utils/logger';

const supervisors = ['group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager'];
const control = 'w-full min-h-[44px] rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 text-sm text-[var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
const button = 'min-h-[44px] rounded-lg border border-[var(--theme-border)] px-4 py-2 text-sm text-[var(--theme-text-primary)] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
interface Props {
    isOpen: boolean; onClose: () => void; job: WMSJob; user: User | null;
    initialLine?: number; initialCount?: number;
    onSaved?: () => void | Promise<void>;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
}
export function FloorDiscrepancyModal({ isOpen, onClose, job, user, initialLine = 0, initialCount, onSaved, addNotification }: Props) {
    const { history, report, resolve } = useFloorDiscrepancies(job, user, isOpen);
    const dialog = useRef<HTMLDivElement>(null);
    const [line, setLine] = useState(initialLine);
    const [first, setFirst] = useState('');
    const [recount, setRecount] = useState('');
    const [reason, setReason] = useState('');
    const [step, setStep] = useState<'COUNT' | 'RECOUNT'>('COUNT');
    const [error, setError] = useState('');
    const [reconciling, setReconciling] = useState<FloorDiscrepancy | null>(null);
    const [resolution, setResolution] = useState<FloorResolutionInput['resolution']>('count_corrected');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    useEffect(() => {
        if (!isOpen) return;
        setLine(initialLine); setFirst(initialCount === undefined ? '' : String(initialCount)); setRecount('');
        setReason(''); setStep('COUNT'); setError(''); setReconciling(null); setNotes('');
    }, [isOpen, job.id, initialLine, initialCount]);
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        return () => previous?.focus();
    }, [isOpen]);
    if (!isOpen) return null;
    const expected = job.lineItems?.[line]?.expectedQty ?? 0;
    const pending = history.data?.filter(d => !d.resolved_at) || [];
    const busy = report.isPending || resolve.isPending;
    const canReport = job.assignedTo === user?.id && !['Completed','Cancelled'].includes(job.status);
    const canResolve = supervisors.includes(user?.role || '');
    const valid = (value: string) => /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()) && Number(value) <= 1e9;
    const saved = async (message: string) => {
        addNotification('info', message);
        try { await onSaved?.(); } catch (err) { logger.warn('FloorDiscrepancy', 'Save confirmed; view refresh failed', { error: String(err) }); }
    };
    const submitReport = async () => {
        setError('');
        if (!valid(first) || !valid(recount) || reason.trim().length < 3) { setError('Enter both counts and a reason of at least 3 characters.'); return; }
        try {
            await report.mutateAsync({ jobId: job.id, itemIndex: line, firstCount: Number(first), recount: Number(recount), reason });
            await saved('Discrepancy saved. This job is on hold for a separate supervisor.');
            setStep('COUNT'); setFirst(''); setRecount(''); setReason('');
        } catch (err) { setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Discrepancy was not confirmed.'); }
    };
    const submitResolution = async () => {
        if (!reconciling) return;
        setError('');
        if (!valid(quantity) || notes.trim().length < 3) { setError('Enter the physically reconciled count and observed corrective action.'); return; }
        try {
            await resolve.mutateAsync({ jobId: job.id, discrepancyId: reconciling.id, resolution, quantity: Number(quantity), notes });
            await saved('Supervisor reconciliation saved. Resolve any other open discrepancies before resuming normal scanning.'); setReconciling(null);
        } catch (err) { setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Reconciliation was not confirmed.'); }
    };
    return <div ref={dialog} onKeyDown={event => {
        if (event.key === 'Escape' && !busy) { event.stopPropagation(); onClose(); }
        if (event.key !== 'Tab') return;
        const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)') || [])];
        const firstControl = controls[0], lastControl = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === firstControl) { event.preventDefault(); lastControl?.focus(); }
        else if (!event.shiftKey && document.activeElement === lastControl) { event.preventDefault(); firstControl?.focus(); }
    }} role="dialog" aria-modal="true" aria-labelledby="floor-discrepancy-title" className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-3">
        <div className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] p-4"><h2 id="floor-discrepancy-title" className="font-semibold">{job.type === 'PICK' ? 'Pick' : 'Pack'} counts and reconciliation</h2><button className={button} disabled={busy} onClick={onClose}>Close</button></header>
            <div className="space-y-4 overflow-y-auto p-4">
                <p className="text-sm text-[var(--theme-text-secondary)]">Record what you observe. The original manifest and picked quantities stay unchanged. A reported difference holds the job and downstream handoff until a separate supervisor resolves it.</p>
                {history.isPending && <p role="status">Loading discrepancy history…</p>}
                {history.isError && <p role="alert">Could not load discrepancy history. <button className={button} onClick={() => history.refetch()}>Retry</button></p>}
                {pending.length > 0 && <p role="status" className="font-semibold">On hold · {pending.length} unresolved {pending.length === 1 ? 'line' : 'lines'}</p>}
                {history.data?.map(d => <section key={d.id} className="space-y-2 rounded-xl border border-[var(--theme-border)] p-3 text-sm">
                    <p className="font-medium">Line {d.item_index + 1}: expected {d.expected_qty}, first count {d.first_count}, recount {d.recount} ({d.recount - d.expected_qty > 0 ? '+' : ''}{d.recount - d.expected_qty})</p>
                    <p>{d.reporter_name} · {new Date(d.reported_at).toLocaleString()} · {d.reason}</p>
                    {d.resolved_at ? <p>Resolved by {d.resolver_name}: {d.resolution?.replace(/_/g,' ')} · {d.resolved_qty}. {d.resolution_notes}</p> : <>
                        <p>Awaiting independent supervisor reconciliation.</p>
                        {canResolve && user?.id !== d.reporter_id && <button className={button} disabled={busy} onClick={() => { setReconciling(d); setQuantity(''); setNotes(''); setResolution('count_corrected'); setError(''); }}>Reconcile line {d.item_index + 1}</button>}
                    </>}
                </section>)}
                {reconciling ? <section className="space-y-3" aria-label="Supervisor reconciliation">
                    <h3 className="font-semibold">Reconcile line {reconciling.item_index + 1}</h3>
                    <p className="text-sm">Recover missing goods or segregate excess goods before confirming the final count. Any replenishment or stock return must use its own controlled stock workflow. This action does not change inventory.</p>
                    <label className="block text-sm">Resolution<select className={control} value={resolution} onChange={e => setResolution(e.target.value as FloorResolutionInput['resolution'])}>
                        <option value="count_corrected">Counting entry corrected</option><option value="goods_recovered">Missing goods recovered</option><option value="excess_segregated">Excess segregated for controlled return</option>
                        {job.type === 'PICK' && reconciling.recount < reconciling.expected_qty && <option value="short_pick">Approve recounted pick shortage</option>}
                    </select></label>
                    <label className="block text-sm">Physically reconciled quantity<input inputMode="decimal" className={control} value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
                    <label className="block text-sm">Observed corrective action<textarea maxLength={500} className={control} value={notes} onChange={e => setNotes(e.target.value)} /></label>
                    <p className="text-sm">{resolution === 'short_pick' ? `Approval is limited to the recounted ${reconciling.recount}; reserved online orders remain blocked.` : `Final count must match the original ${reconciling.expected_qty}.`}</p>
                    <button className={button} disabled={busy} onClick={submitResolution}>Confirm reconciliation</button>
                    <button className={button} disabled={busy} onClick={() => setReconciling(null)}>Back</button>
                </section> : canReport && history.isSuccess && !pending.some(d => d.item_index === line) && <section className="space-y-3" aria-label="Report physical discrepancy">
                    <label className="block text-sm">Manifest line<select className={control} disabled={step === 'RECOUNT' || busy} value={line} onChange={e => { setLine(Number(e.target.value)); setFirst(''); setRecount(''); }}>
                        {job.lineItems?.map((item, index) => <option key={index} value={index}>{index + 1}. {item.sku} · {item.name}</option>)}
                    </select></label>
                    {step === 'COUNT' ? <>
                        <label className="block text-sm">First physical count<input autoFocus inputMode="decimal" className={control} value={first} onChange={e => setFirst(e.target.value)} /></label>
                        <button className={button} disabled={busy || !valid(first)} onClick={() => { setStep('RECOUNT'); setRecount(''); }}>Recount independently</button>
                    </> : <>
                        <p className="text-sm">Count the goods again before comparing with the manifest.</p>
                        <label className="block text-sm">Second physical count<input autoFocus inputMode="decimal" className={control} value={recount} onChange={e => setRecount(e.target.value)} /></label>
                        {valid(recount) && Number(recount) === expected ? <p role="status">Recount matches the manifest. No discrepancy needs to be submitted; close and resume normal verification.</p> : <>
                            <label className="block text-sm">Observed issue<textarea maxLength={500} className={control} value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe what you found without assuming the cause" /></label>
                            <button className={button} disabled={busy || !valid(recount) || reason.trim().length < 3} onClick={submitReport}>Report difference and hold job</button>
                        </>}
                        <button className={button} disabled={busy} onClick={() => setStep('COUNT')}>Correct first count</button>
                    </>}
                </section>}
                {error && <p role="alert" className="text-sm">{error}</p>}
                {busy && <p role="status">Saving…</p>}
            </div>
        </div>
    </div>;
}
