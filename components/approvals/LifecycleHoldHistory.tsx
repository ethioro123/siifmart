import React, { useState } from 'react';
import { useLifecycleHolds } from '../../hooks/useRecordLifecycle';
import type { LifecycleKind } from '../../types/recordLifecycle';
const control = 'min-h-11 px-3 py-2 border border-[var(--theme-border)] rounded-xl bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] disabled:opacity-50';
export function LifecycleHoldHistory(props: { actorId: string; country: string; role: string; kind: LifecycleKind; targetId: string }) {
  const [open, setOpen] = useState(false);
  return <section className="space-y-3"><button type="button" className={control} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide investigation holds' : 'Load investigation holds'}</button>
    {open && <HoldPanel {...props} />}
  </section>;
}
function HoldPanel({ actorId, country, role, kind, targetId }: { actorId: string; country: string; role: string; kind: LifecycleKind; targetId: string }) {
  const [page, setPage] = useState(1);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const { list, decide } = useLifecycleHolds(actorId, country, kind, targetId, page);
  const compliance = ['country_compliance_manager', 'regional_compliance_manager', 'group_clco', 'group_cae', 'auditor'].includes(role);
  const act = async (release: boolean) => {
    setNotice('');
    try { await decide.mutateAsync({ reason, release }); setNotice(release ? 'Investigation hold released.' : 'Investigation hold recorded.'); setReason(''); setPage(1); }
    catch { /* Retain the entered evidence on failure. */ }
  };
  return <div className="p-3 rounded-xl border border-[var(--theme-border)] space-y-3">
    <p className="text-sm">An active investigation hold blocks lifecycle application. A different authorized compliance reviewer must release it.</p>
    {list.isPending && <p role="status">Loading holds…</p>}{list.isError && <p role="alert">Holds could not be loaded. Refresh to retry.</p>}
    <button type="button" className={control} disabled={list.isFetching || decide.isPending} onClick={() => list.refetch()}>Refresh holds</button>
    {notice && <p role="status">{notice}</p>}{decide.isError && <p role="alert">{decide.error.message}</p>}
    <ul className="space-y-3">{list.data?.map(hold => <li key={hold.id} className="text-sm border-t border-[var(--theme-border)] pt-2">
      <p className="font-semibold">{hold.released_at ? 'Released hold' : 'Active hold'} · {hold.placed_by_name} ({hold.placed_by_role.replaceAll('_', ' ')})</p>
      <p>{new Date(hold.placed_at).toLocaleString()} · {hold.reason}</p>
      {hold.released_at && <p>Released by {hold.released_by_name} ({hold.released_by_role?.replaceAll('_', ' ')}) · {new Date(hold.released_at).toLocaleString()} · {hold.release_reason}</p>}
      {!hold.released_at && compliance && <button type="button" className={control} disabled={hold.placed_by === actorId || decide.isPending || list.isFetching || reason.trim().length < 10} onClick={() => act(true)}>Release with independent review</button>}
    </li>)}</ul>
    {!list.isError && list.data?.length === 0 && <p className="text-sm">No holds visible on this page.</p>}
    {compliance && <><label className="block text-sm">Hold or release reason<textarea className={`${control} mt-1 block w-full min-h-24`} maxLength={1200} disabled={decide.isPending} value={reason} onChange={e => setReason(e.target.value)} /></label><button type="button" className={control} disabled={decide.isPending || list.isFetching || list.isError || reason.trim().length < 10} onClick={() => act(false)}>Place investigation hold</button></>}
    <nav aria-label="Investigation hold pages" className="flex gap-3"><button type="button" className={control} disabled={page === 1 || decide.isPending} onClick={() => setPage(page - 1)}>Previous holds</button><button type="button" className={control} disabled={list.data?.length !== 25 || decide.isPending} onClick={() => setPage(page + 1)}>Next holds</button></nav>
  </div>;
}
