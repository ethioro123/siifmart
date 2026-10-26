import {useData} from '../../../contexts/DataContext';
import React,{useState} from 'react';
import {useStore} from '../../../contexts/CentralStore';
import {useFloorAudit} from '../../../hooks/useFloorAudit';
import type {AuditScope,FloorAuditRow} from '../../../services/floor-audit.service';
const control='min-h-[44px] rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 py-2 text-sm text-[var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
export function FloorAuditTimeline({scope}:{scope:AuditScope}){
 const {employees}=useData();
 const {user}=useStore();const [open,setOpen]=useState(false),[page,setPage]=useState(0);
 const {query,review}=useFloorAudit(scope,user?.id,page,open);
 const [selected,setSelected]=useState<FloorAuditRow|null>(null),[finding,setFinding]=useState('undetermined'),[responsible,setResponsible]=useState(''),[notes,setNotes]=useState(''),[error,setError]=useState('');
 const supervisor=['group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager'].includes(user?.role||'');
 const submit=async()=>{if(!selected)return;setError('');try{await review.mutateAsync({jobId:selected.job_id,discrepancyId:selected.id,finding:finding as 'undetermined'|'stock_issue'|'counting_correction'|'confirmed_handling_error',responsibleId:finding==='confirmed_handling_error'?responsible:null,notes});setSelected(null);}catch(e){setError(e&&typeof e==='object'&&'message'in e?String(e.message):'Review could not be confirmed.');}};
 return <section className="my-4 space-y-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 text-[var(--theme-text-primary)]">
  <button type="button" className={control} aria-expanded={open} onClick={()=>setOpen(!open)}>Discrepancy history and review</button>
  {open&&<>
   <p className="text-sm">Reports describe observed differences. Involvement as picker, packer, reporter or supervisor does not establish fault. Stock changes require a separate authorized movement.</p>
   {query.isPending&&<p role="status">Loading audit history…</p>}
   {query.isError&&<p role="alert">History could not be loaded for this scope. <button className={control} onClick={()=>query.refetch()}>Retry</button></p>}
   {query.data?.length===0&&<p>No discrepancy records for this scope.</p>}
   {query.data?.map(d=><article key={d.id} className="space-y-2 border-t border-[var(--theme-border)] pt-3 text-sm">
    <p className="font-semibold">{d.stage} {d.job_number||d.job_id} · line {d.item_index+1} · {String(d.manifest.sku||'')}</p>
    <p>Lot {String(d.manifest.batchNumber||'Not recorded')} · bin {String(d.manifest.location||'Not recorded')} · expiry {String(d.manifest.expiryDate||'Not recorded')}</p>
    <p>Expected {d.expected_qty} · first count {d.first_count} · recount {d.recount} · difference {d.recount-d.expected_qty}</p>
    <p>Reported by {d.reporter_name} · {new Date(d.reported_at).toLocaleString()} · {d.reason}</p>
    <p>{d.resolved_at?`Reconciled by ${d.resolver_name}: ${d.resolution?.replace(/_/g,' ')}. ${d.resolution_notes}`:'Operational hold: unresolved'}</p>
    <p>{d.reviewed_at?`Review: ${d.finding?.replace(/_/g,' ')}. ${d.review_notes} Reviewer ${d.reviewer_name||'recorded supervisor'}, ${new Date(d.reviewed_at).toLocaleString()}`:'Staff/points review pending; no responsibility established.'}</p>
    {d.responsible_id&&<p>Confirmed responsible employee: {d.responsible_name||'Recorded handler'}</p>}
    <p>Recorded job completion award: {d.awarded_points} points. {d.job_status==='Completed'&&!d.reviewed_at&&d.awarded_points===0?'Completion award deferred until all reports on this job are reviewed.':'Existing points are retained; corrections use a separately authorized points transaction.'}</p>
    {supervisor&&d.resolved_at&&!d.reviewed_at&&d.reporter_id!==user?.id&&<button className={control} onClick={()=>{setSelected(d);setFinding('undetermined');setResponsible('');setNotes('');setError('');}}>Review findings and points</button>}
   </article>)}
   {selected&&<div className="space-y-3 rounded-lg border border-[var(--theme-border)] p-3">
    <label className="block">Finding<select className={control} value={finding} onChange={e=>setFinding(e.target.value)}><option value="undetermined">Undetermined</option><option value="stock_issue">Stock issue</option><option value="counting_correction">Counting correction</option><option value="confirmed_handling_error">Confirmed handling error</option></select></label>
    {finding==='confirmed_handling_error'&&<label className="block">Responsible staff (recorded order handler)<select className={control} value={responsible} onChange={e=>setResponsible(e.target.value)}><option value="">Select staff member</option>{employees.filter(e=>e.siteId===scope.siteId).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>}
    <label className="block">Evidence and review notes<textarea className={`${control} w-full`} maxLength={500} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
    <p className="text-sm">A confirmed handling error removes eligibility for an unawarded accuracy bonus for that handler. This does not automatically deduct previously awarded points. Submitted decisions cannot be overwritten.</p>
    <button className={control} disabled={review.isPending||notes.trim().length<3} onClick={submit}>Confirm review</button><button className={control} disabled={review.isPending} onClick={()=>setSelected(null)}>Cancel</button>
   </div>}
   {error&&<p role="alert">{error}</p>}
   <nav aria-label="Discrepancy history pages"><button className={control} disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span className="px-3">{page+1}</span><button className={control} disabled={query.data?.length!==20} onClick={()=>setPage(page+1)}>Next</button></nav>
  </>}
 </section>;
}
