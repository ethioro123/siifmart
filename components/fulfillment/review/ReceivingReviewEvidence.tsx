import React from 'react';
import type { ReceivingReviewEvidence as Evidence,ReviewSelection } from '../../../types/operations-review';
import { operationStatusLabel,operationReference } from '../../../utils/operationsReviewLabels';
import { reviewControl as control } from './OperationReportReview';
export function ReceivingReviewEvidence({value:v,t,onOpen}:{value:Evidence;t:(key:string)=>string;onOpen:(record:ReviewSelection)=>void}){
 return <section className="space-y-4" aria-label={t('warehouse.opReceiptEvidence')}>
  <div><h4 className="font-semibold">{t('warehouse.opReceiptEvidence')} · {v.po_number}</h4><p className="text-sm text-[var(--theme-text-secondary)]">{v.supplier_name}</p></div>
  {v.partial&&<p className="rounded-xl bg-[var(--theme-bg-subtle)] p-3 text-sm">{t('warehouse.opPartialReceiptNote')}</p>}
  {v.items.length===0&&<p className="text-sm">{t('warehouse.opNoReceiptItems')}</p>}
  {v.items.map(item=><article key={item.id} className="space-y-2 border-t border-[var(--theme-border)] pt-3">
   <h5 className="font-semibold break-words">{item.product_name}</h5><p className="text-sm text-[var(--theme-text-secondary)]">{item.sku}</p>
   <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
    <div><dt>{t('warehouse.opReceiptOrdered')}</dt><dd className="text-xl font-semibold tabular-nums">{item.ordered??'—'}</dd></div>
    <div><dt>{t('warehouse.opReceiptRecorded')}</dt><dd className="text-xl font-semibold tabular-nums">{item.received}</dd></div>
    <div><dt>{t('warehouse.opReceiptOutstanding')}</dt><dd className="text-xl font-semibold tabular-nums">{item.outstanding??'—'}</dd></div>
   </dl>
   {item.ordered===null&&<p className="text-sm text-[var(--theme-text-secondary)]">{t('warehouse.opReceiptComparisonHidden')}</p>}
  </article>)}
  <section className="space-y-3" aria-label={t('warehouse.opReceiptSubmissions')}>
   <h4 className="font-semibold">{t('warehouse.opReceiptSubmissions')}</h4>
   {!v.submissions.length&&<p className="text-sm">{t('warehouse.opNoSubmissions')}</p>}
   {v.submissions.map(receipt=><div key={receipt.id} className="space-y-2 rounded-xl bg-[var(--theme-bg-subtle)] p-3 text-sm">
    <p>{receipt.employee_name} · <time dateTime={receipt.created_at}>{new Date(receipt.created_at).toLocaleString()}</time></p>
    {receipt.has_snapshot?<>
     <p>{t('warehouse.receiptOriginalCount')}: {receipt.original_quantity}</p>
     <button type="button" className={control} onClick={()=>onOpen({source:'receipt',id:receipt.id})}>{t('warehouse.opOpenSubmittedCount')}</button>
    </>:<p className="text-[var(--theme-text-secondary)]">{t('warehouse.opLegacyReceiptNote')}</p>}
   </div>)}
  </section>
  <section className="space-y-3" aria-label={t('warehouse.opReceiptPutaway')}>
   <h4 className="font-semibold">{t('warehouse.opReceiptPutaway')}</h4>
   {!v.putaway.length&&<p className="text-sm">{t('warehouse.opNoReceiptPutaway')}</p>}
   {v.putaway.map(job=><div key={job.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border)] pt-3 text-sm">
    <div><p className="font-medium">{t('warehouse.opJobNumber')}: {operationReference({id:job.id,reference:job.reference,operation:'PUTAWAY'})} · {operationStatusLabel(t,job.status)}</p><p>{job.quantity} {t('warehouse.unitsLabel')} · {job.employee_name}</p></div>
    <button type="button" className={control} onClick={()=>onOpen({source:'job',id:job.id})}>{t('warehouse.opOpenReceiptPutaway')}</button>
   </div>)}
  </section>
 </section>;
}
