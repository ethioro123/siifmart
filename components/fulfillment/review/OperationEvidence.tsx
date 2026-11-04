import { ReceivingReviewEvidence } from './ReceivingReviewEvidence';
import { operationStatusLabel,operationValueLabel,operationReference } from '../../../utils/operationsReviewLabels';
import React,{useState,useRef} from 'react';
import type { OperationDetail,ReviewSelection } from '../../../types/operations-review';
import type { useOperationsReview } from '../../../hooks/useOperationsReview';
import { OperationReportReview,reviewControl as control } from './OperationReportReview';
interface Props{value:OperationDetail;api:ReturnType<typeof useOperationsReview>;site:string;country:string;page:number;t:(key:string)=>string;onSaved:()=>void|Promise<void>;onOpen:()=>void;onInventory:(id:string)=>void;onRelated:(record:ReviewSelection)=>void}
export function OperationEvidence({value:v,api,site,country,page,t,onSaved,onOpen,onInventory,onRelated}:Props){
 const [reason,setReason]=useState(''),[notice,setNotice]=useState('');
 const lock=useRef(false);const [savedFingerprint,setSavedFingerprint]=useState('');
 const busy=api.note.isPending||api.credit.isPending||api.resolve.isPending||api.audit.isPending||api.openJob.isPending;
 const alreadySaved=savedFingerprint===v.fingerprint;
 const save=async(approve?:boolean)=>{if(lock.current||busy||alreadySaved||reason.trim().length<3||(approve===undefined?!v.can_note:!v.can_credit))return;lock.current=true;setNotice('');try{
  if(approve!==undefined)await api.credit.mutateAsync({id:v.summary.id,approve,reason});
  else await api.note.mutateAsync({site,country,source:v.summary.source,id:v.summary.id,fingerprint:v.fingerprint,reason});
  setSavedFingerprint(v.fingerprint);setReason('');setNotice(t('warehouse.opSaved'));try{await onSaved();}catch{/* Confirmed save remains visible when refresh fails. */}
 }catch{setNotice(t('warehouse.opSaveFailed'));}finally{lock.current=false;}};
 const fields=Object.entries(v.fields).filter(([key])=>!v.receiving||key!=='order').filter(([,value])=>value!==null&&value!=='');
 const reviewForm=(<div className="space-y-3">
   <label className="block text-sm">{t('warehouse.opReason')}<textarea className={`${control} w-full`} maxLength={1200} value={reason} onChange={e=>setReason(e.target.value)} disabled={busy}/></label>
   <div className="flex flex-wrap gap-2">{v.can_note&&<button type="button" className={control} disabled={busy||alreadySaved||reason.trim().length<3} onClick={()=>void save()}>{t('warehouse.opRecordReview')}</button>}
    {v.can_credit&&<><button type="button" className={control} disabled={busy||alreadySaved||reason.trim().length<3} onClick={()=>void save(true)}>{t('warehouse.returnApproveCredit')}</button><button type="button" className={control} disabled={busy||alreadySaved||reason.trim().length<3} onClick={()=>void save(false)}>{t('warehouse.returnReject')}</button></>}
   </div>
  </div>);
 return <div className="space-y-4">
  <div><h3 className="text-lg font-semibold break-words">{operationReference(v.summary)}</h3><p className="text-sm text-[var(--theme-text-secondary)]">{t(`warehouse.opOperation_${v.summary.operation}`)} · {operationStatusLabel(t,v.summary.status)} · {v.summary.handler}</p></div>
  {v.receiving&&<ReceivingReviewEvidence value={v.receiving} t={t} onOpen={onRelated}/>}
  <dl className="grid sm:grid-cols-2 gap-3 text-sm">{fields.map(([key,value])=><div key={key}><dt className="text-[var(--theme-text-secondary)]">{t(`warehouse.opField_${key}`)}</dt><dd className="break-words">{operationValueLabel(t,key,value)}</dd></div>)}</dl>
  <div className="space-y-3">{v.lines.map((line,index)=><dl key={index} className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--theme-border)] py-3 text-sm">{Object.entries(line).filter(([,value])=>value!==null&&value!=='').map(([key,value])=><div key={key}><dt className="text-[var(--theme-text-secondary)]">{t(`warehouse.opField_${key}`)}</dt><dd className="break-words">{key==='request'?<button type="button" className={`${control} underline`} onClick={()=>onInventory(String(value))}>{t('warehouse.opOpenInventory')}</button>:operationValueLabel(t,key,value)}</dd></div>)}</dl>)}</div>
  {v.reports.map(report=><OperationReportReview key={report.id} report={report} job={v.summary.id} isPick={v.summary.operation==='PICK'} api={api} t={t} onSaved={onSaved}/>)}
  {(v.summary.source==='job'||v.summary.source==='transfer'||v.summary.source==='inventory')&&<button type="button" className={control} disabled={busy} onClick={onOpen}>{t(v.summary.source==='inventory'?'warehouse.opOpenInventory':'warehouse.opOpenControls')}</button>}
  <p className="text-sm leading-relaxed text-[var(--theme-text-secondary)]">{t('warehouse.opReviewNote')}</p>
  {v.notes.map((note,index)=><p key={index} className="text-sm break-words border-t border-[var(--theme-border)] pt-3">{note.reviewer_name} · {new Date(note.created_at).toLocaleString()} · {note.reason}</p>)}
  {(v.can_note||v.can_credit)&&page===0&&(v.can_credit?reviewForm:<details className="border-t border-[var(--theme-border)] pt-3"><summary className="min-h-[44px] flex items-center cursor-pointer text-sm font-medium">{t('warehouse.opOptionalNote')}</summary>{reviewForm}</details>)}
  {notice&&<p role="status">{notice}</p>}
 </div>;
}
