import { operationStatusLabel,operationValueLabel } from '../../../utils/operationsReviewLabels';
import React,{useState} from 'react';
import type { OperationDetail } from '../../../types/operations-review';
import type { useOperationsReview } from '../../../hooks/useOperationsReview';
import { OperationReportReview,reviewControl as control } from './OperationReportReview';
interface Props{value:OperationDetail;api:ReturnType<typeof useOperationsReview>;site:string;country:string;page:number;t:(key:string)=>string;onSaved:()=>void|Promise<void>;onOpen:()=>void;onInventory:(id:string)=>void}
export function OperationEvidence({value:v,api,site,country,page,t,onSaved,onOpen,onInventory}:Props){
 const [reason,setReason]=useState(''),[notice,setNotice]=useState('');
 const busy=api.note.isPending||api.credit.isPending;
 const save=async(approve?:boolean)=>{setNotice('');try{
  if(approve!==undefined)await api.credit.mutateAsync({id:v.summary.id,approve,reason});
  else await api.note.mutateAsync({site,country,source:v.summary.source,id:v.summary.id,fingerprint:v.fingerprint,reason});
  setReason('');setNotice(t('warehouse.opSaved'));try{await onSaved();}catch{/* Confirmed save remains visible when refresh fails. */}
 }catch{setNotice(t('warehouse.opSaveFailed'));}};
 const fields=Object.entries(v.fields).filter(([,value])=>value!==null&&value!=='');
 return <div className="space-y-4">
  <div><h3 className="text-lg font-semibold break-words">{v.summary.reference}</h3><p className="text-sm text-[var(--theme-text-secondary)]">{t(`warehouse.opOperation_${v.summary.operation}`)} · {operationStatusLabel(t,v.summary.status)} · {v.summary.handler}</p></div>
  <dl className="grid sm:grid-cols-2 gap-3 text-sm">{fields.map(([key,value])=><div key={key}><dt className="text-[var(--theme-text-secondary)]">{t(`warehouse.opField_${key}`)}</dt><dd className="break-words">{operationValueLabel(t,key,value)}</dd></div>)}</dl>
  <div className="space-y-3">{v.lines.map((line,index)=><dl key={index} className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--theme-border)] py-3 text-sm">{Object.entries(line).filter(([,value])=>value!==null&&value!=='').map(([key,value])=><div key={key}><dt className="text-[var(--theme-text-secondary)]">{t(`warehouse.opField_${key}`)}</dt><dd className="break-words">{key==='request'?<button type="button" className={`${control} underline`} onClick={()=>onInventory(String(value))}>{t('warehouse.opOpenInventory')}</button>:operationValueLabel(t,key,value)}</dd></div>)}</dl>)}</div>
  {v.reports.map(report=><OperationReportReview key={report.id} report={report} job={v.summary.id} isPick={v.summary.operation==='PICK'} api={api} t={t} onSaved={onSaved}/>)}
  {(v.summary.source==='job'||v.summary.source==='transfer'||v.summary.source==='inventory')&&<button type="button" className={control} onClick={onOpen}>{t(v.summary.source==='inventory'?'warehouse.opOpenInventory':'warehouse.opOpenControls')}</button>}
  <p className="text-sm leading-relaxed text-[var(--theme-text-secondary)]">{t('warehouse.opReviewNote')}</p>
  {v.notes.map((note,index)=><p key={index} className="text-sm break-words border-t border-[var(--theme-border)] pt-3">{note.reviewer_name} · {new Date(note.created_at).toLocaleString()} · {note.reason}</p>)}
  {v.can_note&&page===0&&<div className="space-y-3">
   <label className="block text-sm">{t('warehouse.opReason')}<textarea className={`${control} w-full`} maxLength={1200} value={reason} onChange={e=>setReason(e.target.value)} disabled={busy}/></label>
   <div className="flex flex-wrap gap-2"><button type="button" className={control} disabled={busy||reason.trim().length<3} onClick={()=>void save()}>{t('warehouse.opRecordReview')}</button>
    {v.can_credit&&<><button type="button" className={control} disabled={busy||reason.trim().length<3} onClick={()=>void save(true)}>{t('warehouse.returnApproveCredit')}</button><button type="button" className={control} disabled={busy||reason.trim().length<3} onClick={()=>void save(false)}>{t('warehouse.returnReject')}</button></>}
   </div>
  </div>}
  {notice&&<p role="status">{notice}</p>}
 </div>;
}
