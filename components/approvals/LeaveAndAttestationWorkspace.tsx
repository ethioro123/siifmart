import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { useLeaveAndAttestationReview, type PersonnelReview } from '../../hooks/useLeaveAndAttestationReview';
import type { ApprovalQueueSummary } from '../../types/unifiedApprovalInbox';
export function LeaveAndAttestationWorkspace({ queues, initialOpen = false }: { queues: ApprovalQueueSummary[]; initialOpen?: boolean }) {
  const { user } = useStore(); const { effectiveCountry, activeSite } = useData();
  if (!user?.id || !effectiveCountry || !activeSite?.id) return null;
  const scope = { id: user.id, name: user.name || '', role: user.role, country: effectiveCountry, site: activeSite.id };
  return <section className="space-y-4 border-t border-[var(--theme-border)] pt-4"><h2 className="text-lg font-semibold">Leave and regional payroll reviews</h2>
    {queues.some(q => q.key === 'leave' && q.status === 'ready') && <Panel key={`leave:${JSON.stringify(scope)}`} kind="leave" initialOpen={initialOpen} scope={scope} />}
    {queues.some(q => q.key === 'payroll_attestation' && q.status === 'ready') && <Panel key={`payroll:${JSON.stringify(scope)}`} kind="attestation" initialOpen={initialOpen} scope={scope} />}
  </section>;
}
function Panel({ kind, scope, initialOpen }: { kind: PersonnelReview; initialOpen: boolean; scope: { id: string; name: string; role: string; country: string; site: string } }) {
  const [open, setOpen] = useState(initialOpen); const [page, setPage] = useState(1); const [id, setId] = useState(''); const [reason, setReason] = useState(''); const [notice, setNotice] = useState('');
  const { list, decision } = useLeaveAndAttestationReview(scope, kind, page, open);
  const leave = list.data?.kind === 'leave' ? list.data.rows.find(row => row.id === id) : undefined;
  const run = list.data?.kind === 'attestation' ? list.data.rows.find(row => row.id === id) : undefined;
  const own = leave && (leave.employee_id === scope.id || leave.requested_by === scope.id);
  const button = 'min-h-11 px-4 rounded-[10px] border border-[var(--theme-border)] text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
  const decide = async (reject: boolean) => { try { await decision.mutateAsync({ id, reject, reason }); setId(''); setReason(''); setNotice('Decision saved.'); } catch { /* retain input */ } };
  return <div className="space-y-3"><button type="button" className={button} disabled={decision.isPending} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Open'} {kind === 'leave' ? 'leave requests' : 'regional payroll attestations'}</button>
    {open && <>
      {list.isPending && <p role="status">Loading requests…</p>}
      {list.isError && <p role="alert">Requests unavailable. <button className={button} type="button" onClick={() => list.refetch()}>Retry</button></p>}
      {notice && <p role="status">{notice}</p>}{decision.isError && <p role="alert">{decision.error.message}</p>}
      {!list.isError && list.data && <div className="grid gap-4 lg:grid-cols-2"><div><ul aria-label={kind === 'leave' ? 'Leave requests' : 'Payroll attestations'} className="divide-y divide-[var(--theme-border)]">{list.data.rows.map(row => <li key={row.id}><button className={`w-full min-h-14 text-left p-3 rounded-[10px] ${id === row.id ? 'bg-[var(--theme-bg-subtle)]' : ''}`} type="button" disabled={decision.isPending} aria-pressed={id === row.id} onClick={() => { setId(row.id); setReason(''); setNotice(''); decision.reset(); }}>{'employee_name' in row ? row.employee_name : row.period}</button></li>)}</ul>
        {!list.data.rows.length && <p role="status">No pending requests on this page.</p>}
        <nav className="flex gap-3 items-center py-3" aria-label={`${kind} pages`}><button className={button} type="button" disabled={page === 1 || decision.isPending} onClick={() => { setPage(page - 1); setId(''); }}>Previous</button><span>Page {page}</span><button className={button} type="button" disabled={list.data.rows.length < 25 || decision.isPending} onClick={() => { setPage(page + 1); setId(''); }}>Next</button></nav></div>
        <section aria-label="Review evidence" className="space-y-3 p-4 border border-[var(--theme-border)] rounded-[14px]">
          {!id && <p>Select a request.</p>}
          {leave && <><h3 className="font-semibold">{leave.employee_name} · {leave.leave_type}</h3><p>{leave.start_date} – {leave.end_date} · {leave.days} days</p><p className="break-words">{leave.reason}</p></>}
          {run && <><h3 className="font-semibold">{run.period}</h3><p>{run.employeeCount} employees · {run.currency} {run.totalNetPayout.toLocaleString()} net payout</p><p>Attestation records regional attendance and hours verification. It does not replace HR certification or Finance approval.</p></>}
          {own && <p role="status">An independent reviewer is required.</p>}
          {id && !own && <><label className="block text-sm">Review notes<textarea className="w-full mt-2 min-h-24 p-3 border border-[var(--theme-border)] bg-[var(--theme-bg-card)] rounded-[10px] text-base" value={reason} onChange={e => setReason(e.target.value)} disabled={decision.isPending} /></label><div className="flex gap-3 flex-wrap"><button className={button} type="button" disabled={decision.isPending || list.isFetching} onClick={() => decide(false)}>{decision.isPending ? 'Saving…' : kind === 'leave' ? 'Approve leave' : 'Record regional attestation'}</button>{kind === 'leave' && <button className={button} type="button" disabled={decision.isPending || list.isFetching || !reason.trim()} onClick={() => decide(true)}>Reject leave</button>}</div></>}
        </section></div>}
    </>}
  </div>;
}
