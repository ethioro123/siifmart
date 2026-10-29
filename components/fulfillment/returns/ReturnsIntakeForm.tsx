import React,{useState} from 'react';
import {useLanguage} from '../../../contexts/LanguageContext';
import type {ReturnInput,ReturnSale} from '../../../services/fulfillment-returns.service';
interface Props{sale:ReturnSale|null;pending:boolean;lookupPending:boolean;onLookup:(ref:string)=>Promise<void>;onClear:()=>void;onSubmit:(lines:ReturnInput[])=>Promise<void>}
export function ReturnsIntakeForm({sale,pending,lookupPending,onLookup,onClear,onSubmit}:Props){
 const {t}=useLanguage();const [reference,setReference]=useState('');const [lines,setLines]=useState<ReturnInput[]>([]);const [page,setPage]=useState(0);
 const field='min-h-11 min-w-0 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-2 text-sm';
 const update=(id:string,patch:Partial<ReturnInput>)=>setLines(prev=>prev.map(l=>l.saleItemId===id?{...l,...patch}:l));
 if(!sale)return <form className="flex flex-wrap gap-2 max-w-xl" onSubmit={e=>{e.preventDefault();if(reference.trim()){setLines([]);setPage(0);void onLookup(reference);}}}>
  <label className="flex-1 min-w-0">{t('warehouse.returnExactReceipt')}<input className={field} value={reference} onChange={e=>setReference(e.target.value)} required autoComplete="off"/></label><button className="min-h-11 self-end rounded-lg px-4 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] disabled:opacity-50" disabled={lookupPending||!reference.trim()}>{t('warehouse.findButton')}</button>
 </form>;
 const valid=lines.length>0&&lines.every(l=>Number.isSafeInteger(l.quantity)&&l.quantity>0&&l.quantity<=(sale.items.find(i=>i.id===l.saleItemId)?.quantity||0)&&l.reason.trim().length>=3);
 return <form className="space-y-3" onSubmit={e=>{e.preventDefault();if(valid&&!pending)void onSubmit(lines);}}>
  <p className="font-mono break-all">{sale.receiptNumber||sale.id}</p>
  <fieldset disabled={pending} className="space-y-3 min-w-0">
   {sale.items.slice(page*10,page*10+10).map(item=>{const selected=lines.find(l=>l.saleItemId===item.id);return <div key={item.id} className="rounded-xl border border-[var(--theme-border)] p-3 space-y-3 min-w-0">
    <label className="flex items-center gap-3"><input type="checkbox" disabled={item.quantity<=0} checked={!!selected} onChange={e=>setLines(e.target.checked?[...lines,{saleItemId:item.id,quantity:1,reason:'',condition:'Damaged',action:'Repair'}]:lines.filter(l=>l.saleItemId!==item.id))}/><span className="break-words min-w-0">{item.name}</span><span className="ml-auto shrink-0 text-sm">{t('warehouse.returnAvailable',{qty:item.quantity})}</span></label>
    {selected&&<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
     <label>{t('warehouse.returnQtyLabel')}<input className={field} type="number" min={1} step={1} max={item.quantity} value={selected.quantity||''} onChange={e=>update(item.id,{quantity:Number(e.target.value)})} required/></label>
     <label>{t('warehouse.reasonLabel')}<input className={field} minLength={3} maxLength={500} value={selected.reason} onChange={e=>update(item.id,{reason:e.target.value})} required/></label>
     <label>{t('warehouse.conditionLabel')}<select className={field} value={selected.condition} onChange={e=>update(item.id,{condition:e.target.value,action:e.target.value==='New / Sealed'?selected.action:'Repair'})}>{(['New / Sealed','Open Box','Damaged'] as const).map((v,i)=><option key={v} value={v}>{t(`warehouse.returnCondition_${i}`)}</option>)}</select></label>
     <label>{t('warehouse.actionHeader')}<select className={field} value={selected.action} onChange={e=>update(item.id,{action:e.target.value})}>{['Repair','Discard','Restock'].filter(v=>v!=='Restock'||selected.condition==='New / Sealed').map(v=><option key={v} value={v}>{t(`warehouse.returnAction_${v}`)}</option>)}</select></label>
    </div>}
   </div>;})}
   {sale.items.length>10&&<div className="flex gap-3"><button type="button" className={field} disabled={page===0} onClick={()=>setPage(page-1)}>{t('warehouse.recoveryPrevious')}</button><button type="button" className={field} disabled={(page+1)*10>=sale.items.length} onClick={()=>setPage(page+1)}>{t('warehouse.recoveryNext')}</button></div>}
  </fieldset>
  <div className="sticky bottom-0 flex flex-wrap gap-2 bg-[var(--theme-bg-card)] py-3"><button type="button" disabled={pending} className="min-h-11 rounded-lg px-4 border border-[var(--theme-border)]" onClick={onClear}>{t('warehouse.returnChangeReceipt')}</button><button disabled={pending||!valid} className="min-h-11 rounded-lg px-4 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] disabled:opacity-50">{t(pending?'warehouse.recoverySaving':'warehouse.returnSubmitReview')}</button></div>
 </form>;
}
