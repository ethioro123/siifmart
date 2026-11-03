import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { useRecordLifecycle, useLifecycleTargets, useLifecycleEvents } from '../../hooks/useRecordLifecycle';
import { lifecycleLabels, type LifecycleKind, type LifecycleRequest } from '../../types/recordLifecycle';
const control = 'min-h-11 px-3 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] disabled:opacity-50';
const handover = { assets_returned: 'Assets returned', pos_access_revoked: 'POS access handover completed', wms_badge_deactivated: 'WMS badge handover completed', keys_surrendered: 'Keys surrendered', cash_drawer_reconciled: 'Cash drawer reconciled' };
function reviewer(role: string, actorId: string, r: LifecycleRequest) {
  if ([r.requested_by, r.operations_reviewer, r.finance_reviewer].includes(actorId) || (r.kind === 'employee' && r.target_id === actorId)) return false;
  if (r.kind === 'employee') return ['regional_hr_manager', 'country_hr_director', 'group_chro'].includes(role);
  if (r.kind === 'site') return role === ({ Pending: 'country_operations_director', 'Operations cleared': 'country_finance_director', 'Finance cleared': 'country_managing_director' } as Record<string, string>)[r.status];
  if (r.kind === 'purchase_order') return ['regional_procurement_manager', 'country_commercial_director', 'group_cco'].includes(role);
  return ['store_manager', 'warehouse_manager', 'regional_operations_manager', 'regional_logistics_manager', 'regional_supply_chain_manager', 'country_operations_director', 'country_supply_chain_director', 'group_csco'].includes(role);
}
export function RecordLifecycleWorkspace() {
  const [open, setOpen] = useState(false);
  const { user } = useStore();
  const { effectiveCountry } = useData();
  return <section className="border border-[var(--theme-border)] rounded-2xl p-4 space-y-4 bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
    <div className="flex flex-wrap gap-3 justify-between items-center"><div><h2 className="text-lg font-semibold">Record lifecycle and retained history</h2><p className="text-sm text-[var(--theme-text-secondary)]">Offboard employees, close facilities and cancel unexecuted records through independent review. These requests are separate from the inbox total above.</p></div>
      <button type="button" className={control} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close lifecycle workspace' : 'Open lifecycle workspace'}</button></div>
    {open && user?.id && effectiveCountry && <LifecyclePanel key={`${user.id}:${effectiveCountry}`} actorId={user.id} role={user.role || ''} country={effectiveCountry} />}
  </section>;
}
function LifecyclePanel({ actorId, role, country }: { actorId: string; role: string; country: string }) {
  const [kind, setKind] = useState<LifecycleKind>('employee');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [targetPage, setTargetPage] = useState(1);
  const [targetId, setTargetId] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [reasonCode, setReasonCode] = useState('voluntary_resignation');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [eventPage, setEventPage] = useState(1);
  const [showEvents, setShowEvents] = useState(false);
  const [notice, setNotice] = useState('');
  const { list, request, decide } = useRecordLifecycle(actorId, country, true, page, history);
  const targets = useLifecycleTargets(actorId, country, kind, query, targetPage, creating);
  const events = useLifecycleEvents(actorId, selectedId, eventPage, showEvents);
  const selected = !list.isError && list.data?.rows.find(row => row.id === selectedId);
  const busy = request.isPending || decide.isPending;
  const select = (id: string) => { setSelectedId(id); setDecisionReason(''); setEventPage(1); setShowEvents(false); setNotice(''); decide.reset(); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setNotice('');
    try {
      await request.mutateAsync({ kind, targetId, reason: requestReason, evidence: kind === 'employee' ? { reason_code: reasonCode, effective_date: effectiveDate, ...checks } : {} });
      setNotice('Request saved for independent review. The record has not changed.'); setCreating(false); setRequestReason(''); setTargetId(''); setChecks({});
    } catch { /* Keep the request inputs available for correction. */ }
  };
  const decision = async (action: 'approve' | 'reject' | 'withdraw') => {
    try { const saved = await decide.mutateAsync({ id: selectedId, decision: action, reason: decisionReason }); setNotice(`Request ${saved.status.toLowerCase()}.`); setSelectedId(''); setDecisionReason(''); }
    catch { /* Keep the decision reason available for correction. */ }
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-3"><button type="button" className={control} disabled={busy} onClick={() => { setCreating(!creating); request.reset(); }}>{creating ? 'Close request form' : 'New lifecycle request'}</button>
      <button type="button" className={control} disabled={busy || list.isFetching} onClick={() => list.refetch()}>Refresh requests</button>
      <label className="flex items-center gap-2"><input type="checkbox" checked={history} disabled={busy} onChange={e => { setHistory(e.target.checked); setPage(1); select(''); }} />Include retained history</label></div>
    {notice && <p role="status">{notice}</p>}
    {creating && <form onSubmit={submit} className="p-4 rounded-xl border border-[var(--theme-border)] space-y-3">
      <label className="block">Action<select className={`${control} block w-full mt-1`} disabled={busy} value={kind} onChange={e => { setKind(e.target.value as LifecycleKind); setTargetId(''); setTargetPage(1); setQuery(''); setSearch(''); request.reset(); }}>{Object.entries(lifecycleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <p className="text-sm text-[var(--theme-text-secondary)]">{kind === 'site' ? 'Closure needs separate country operations, finance and managing-director reviews. Resolve stock, staff assignments and outstanding obligations first.' : kind === 'employee' ? 'A more senior manager requests offboarding; an independent HR reviewer checks the evidence. Group leadership changes require a separate governance process.' : 'Only unexecuted records are eligible. Use a reversal, return or reconciliation for approved or dispatched work.'}</p>
      <label className="block">Find record by name or business reference<input className={`${control} block w-full mt-1`} maxLength={100} value={search} onChange={e => setSearch(e.target.value)} /></label>
      <button type="button" className={control} disabled={busy} onClick={() => { setQuery(search); setTargetPage(1); setTargetId(''); }}>Search records</button>
      {targets.isPending && <p role="status">Loading eligible records…</p>}{targets.isError && <p role="alert">Records could not be loaded. Search again to retry.</p>}
      {!targets.isError && <label className="block">Record<select required className={`${control} block w-full mt-1`} disabled={busy || targets.isFetching} value={targetId} onChange={e => setTargetId(e.target.value)}><option value="">Select a record</option>{targets.data?.map(target => <option key={target.id} value={target.id}>{target.label} · {target.state}</option>)}</select></label>}
      <div className="flex gap-3"><button type="button" className={control} disabled={targetPage === 1 || busy} onClick={() => { setTargetPage(targetPage - 1); setTargetId(''); }}>Previous records</button><button type="button" className={control} disabled={targets.data?.length !== 25 || busy} onClick={() => { setTargetPage(targetPage + 1); setTargetId(''); }}>Next records</button></div>
      <label className="block">Request reason<textarea required minLength={10} maxLength={1200} className={`${control} block w-full min-h-24 mt-1`} value={requestReason} onChange={e => setRequestReason(e.target.value)} disabled={busy} /></label>
      {kind === 'employee' && <fieldset className="space-y-3"><legend className="font-semibold">Offboarding evidence</legend>
        <label className="block">Reason category<select className={`${control} block w-full mt-1`} value={reasonCode} onChange={e => setReasonCode(e.target.value)}>{['voluntary_resignation', 'contract_expiration', 'gross_misconduct', 'job_abandonment', 'performance_incompetence', 'redundancy_downsizing', 'medical_incapacity'].map(code => <option key={code} value={code}>{code.replaceAll('_', ' ')}</option>)}</select></label>
        <label className="block">Effective date<input required type="date" className={`${control} block mt-1`} value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} /></label>
        {Object.entries(handover).map(([key, label]) => <label key={key} className="flex items-center gap-2 min-h-11"><input type="checkbox" checked={checks[key] || false} onChange={e => setChecks({ ...checks, [key]: e.target.checked })} />{label}</label>)}
        <p className="text-sm">Check only verified handover steps. Approval also checks live assignments and cash drawers; applying offboarding revokes sessions and blocks sensitive operations.</p>
      </fieldset>}
      {request.isError && <p role="alert" className="text-[var(--theme-status-danger-text)]">{request.error.message}</p>}
      <button type="submit" className={control} disabled={busy || !targetId || targets.isFetching || requestReason.trim().length < 10}>{request.isPending ? 'Saving request…' : 'Save request for review'}</button>
    </form>}
    {list.isPending && <p role="status">Loading lifecycle requests…</p>}{list.isError && <p role="alert">Requests could not be loaded. Refresh to retry.</p>}
    {!list.isError && list.data && <div className="grid gap-4 lg:grid-cols-2"><div><ul className="divide-y divide-[var(--theme-border)]">{list.data.rows.map(row => <li key={row.id}><button type="button" className={`${control} w-full text-left my-1`} disabled={busy} aria-pressed={selectedId === row.id} onClick={() => select(row.id)}><span className="block font-semibold">{row.target_label}</span><span className="text-sm">{lifecycleLabels[row.kind]} · {row.status}</span></button></li>)}</ul>
      {!list.data.rows.length && <p>No requests on this page.</p>}
      <nav aria-label="Lifecycle request pages" className="flex flex-wrap gap-3 items-center mt-3"><button type="button" className={control} disabled={page === 1 || busy} onClick={() => { setPage(page - 1); select(''); }}>Previous</button><span>Page {page}</span><button type="button" className={control} disabled={page * 25 >= list.data.count || busy} onClick={() => { setPage(page + 1); select(''); }}>Next</button></nav>
    </div><section aria-label="Lifecycle request evidence" className="border border-[var(--theme-border)] p-4 rounded-xl space-y-3">
      {!selected ? <p>Select a request to review its evidence.</p> : <><h3 className="font-semibold">{selected.target_label} · {selected.status}</h3><p>{selected.reason}</p><p className="text-sm">Requested by {selected.requester_name} ({selected.requester_role.replaceAll('_', ' ')}) · {new Date(selected.requested_at).toLocaleString()}</p>
        <dl className="text-sm space-y-2">{Object.entries(selected.evidence).map(([key, value]) => <div key={key}><dt className="text-[var(--theme-text-secondary)]">{key.replaceAll('_', ' ')}</dt><dd>{typeof value === 'boolean' ? value ? 'Verified by requester' : 'Not verified' : value}</dd></div>)}</dl>
        {selected.decision_reason && <p>Last decision: {selected.decision_reason}</p>}
        {['Pending', 'Operations cleared', 'Finance cleared'].includes(selected.status) && <>
          <label className="block">Decision or withdrawal reason<textarea minLength={10} maxLength={1200} className={`${control} block w-full min-h-24 mt-1`} disabled={busy} value={decisionReason} onChange={e => setDecisionReason(e.target.value)} /></label>
          <div className="flex flex-wrap gap-3">{selected.requested_by === actorId ? <button type="button" className={control} disabled={busy || list.isFetching || decisionReason.trim().length < 10} onClick={() => decision('withdraw')}>Withdraw request</button> : reviewer(role, actorId, selected) ? <><button type="button" className={control} disabled={busy || list.isFetching || decisionReason.trim().length < 10} onClick={() => decision('approve')}>{selected.kind === 'site' && selected.status !== 'Finance cleared' ? 'Record department clearance' : 'Approve and apply'}</button><button type="button" className={control} disabled={busy || list.isFetching || decisionReason.trim().length < 10} onClick={() => decision('reject')}>Reject request</button></> : <p className="text-sm">Awaiting the designated independent department reviewer.</p>}</div>
        </>}
        {decide.isError && <p role="alert" className="text-[var(--theme-status-danger-text)]">{decide.error.message}</p>}
        <button type="button" className={control} onClick={() => setShowEvents(!showEvents)} aria-expanded={showEvents}>{showEvents ? 'Hide audit history' : 'Load audit history'}</button>
        {showEvents && <>{events.isPending && <p role="status">Loading history…</p>}{events.isError && <p role="alert">History could not be loaded.</p>}<ol className="space-y-3">{events.data?.map(event => <li key={event.id} className="border-t border-[var(--theme-border)] pt-2 text-sm"><p className="font-semibold">{event.action} · {event.actor_name} ({event.actor_role.replaceAll('_', ' ')})</p><p>{new Date(event.occurred_at).toLocaleString()}</p><p>{event.reason}</p><p>Record status: {String(event.before_state?.status || 'Not recorded')} → {String(event.after_state?.status || 'Not recorded')}</p></li>)}</ol><div className="flex gap-3"><button type="button" className={control} disabled={eventPage === 1} onClick={() => setEventPage(eventPage - 1)}>Earlier history page</button><button type="button" className={control} disabled={events.data?.length !== 25} onClick={() => setEventPage(eventPage + 1)}>Next history page</button></div></>}
      </>}
    </section></div>}
    <p className="text-sm text-[var(--theme-text-secondary)]">Lifecycle history is retained. No automatic purge is enabled. Employee profiles and operational records remain available under their existing access controls. <Link className="underline" to="/employees">Employee workflows</Link></p>
  </div>;
}
