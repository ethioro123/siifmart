import React,{useState} from 'react';
import type { OperationReport } from '../../../types/operations-review';
import type { useOperationsReview } from '../../../hooks/useOperationsReview';
export const reviewControl='min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 py-2 text-sm text-[var(--theme-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)] disabled:opacity-50';
interface Props{report:OperationReport;job:string;isPick:boolean;api:ReturnType<typeof useOperationsReview>;t:(key:string)=>string;onSaved:()=>void|Promise<void>}
export function OperationReportReview({report:r,job,isPick,api,t,onSaved}:Props){
 const [reason,setReason]=useState(''),[quantity,setQuantity]=useState(''),[resolution,setResolution]=useState('count_corrected'),[finding,setFinding]=useState<'undetermined'|'stock_issue'|'counting_correction'>('undetermined'),[notice,setNotice]=useState('');
 const busy=api.resolve.isPending||api.audit.isPending;
 const save=async()=>{setNotice('');try{
  if(r.can_resolve)await api.resolve.mutateAsync({jobId:job,discrepancyId:r.id,resolution:resolution as 'count_corrected'|'goods_recovered'|'excess_segregated'|'short_pick',quantity:Number(quantity),notes:reason});
  else await api.audit.mutateAsync({jobId:job,discrepancyId:r.id,finding,responsibleId:null,notes:reason});
  setReason('');setNotice(t('warehouse.opSaved'));try{await onSaved();}catch{/* The decision was saved even when refreshing another view fails. */}
 }catch{setNotice(t('warehouse.opSaveFailed'));}};
 return <article className="space-y-3 rounded-2xl bg-[var(--theme-bg-subtle)] p-4 text-sm">
  <h4 className="font-semibold">{t('warehouse.opDiscrepancy')} · {r.item_index+1}</h4>
  <p>{t('warehouse.opField_expected')}: {r.expected_qty} · {t('warehouse.opFirstCount')}: {r.first_count} · {t('warehouse.opRecount')}: {r.recount}</p>
  <p className="break-words">{r.reporter_name} · {r.reason}</p>
  <p>{t(r.resolved_at?'warehouse.opReconciled':'warehouse.opHold')}</p>
  {r.resolution_notes&&<p className="break-words">{r.resolver_name} · {r.resolution_notes}</p>}
  {r.review_notes&&<p className="break-words">{r.review_notes}</p>}
  {(r.can_resolve||r.can_review)&&<div className="space-y-3">
   {r.can_resolve?<div className="grid sm:grid-cols-2 gap-3">
    <label>{t('warehouse.opResolution')}<select className={`${reviewControl} w-full`} value={resolution} onChange={e=>setResolution(e.target.value)} disabled={busy}>
     {(['count_corrected','goods_recovered','excess_segregated',...(isPick?['short_pick']:[])]).map(v=><option key={v} value={v}>{t(`warehouse.opResolution_${v}`)}</option>)}
    </select></label>
    <label>{t('warehouse.opReconciledCount')}<input className={`${reviewControl} w-full`} type="number" min="0" step="any" value={quantity} onChange={e=>setQuantity(e.target.value)} disabled={busy}/></label>
   </div>:<label className="block">{t('warehouse.opFinding')}<select className={`${reviewControl} w-full`} value={finding} onChange={e=>setFinding(e.target.value as typeof finding)} disabled={busy}>
    {(['undetermined','stock_issue','counting_correction'] as const).map(v=><option key={v} value={v}>{t(`warehouse.opFinding_${v}`)}</option>)}
   </select></label>}
   <label className="block">{t('warehouse.opReason')}<textarea className={`${reviewControl} w-full`} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} disabled={busy}/></label>
   <button type="button" className={reviewControl} disabled={busy||reason.trim().length<3||(r.can_resolve&&(!quantity||!Number.isFinite(Number(quantity))||Number(quantity)<0))} onClick={()=>void save()}>{t(r.can_resolve?'warehouse.opResolve':'warehouse.opRecordFinding')}</button>
  </div>}
  {notice&&<p role="status">{notice}</p>}
 </article>;
}
