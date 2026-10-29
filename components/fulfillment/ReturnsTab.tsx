import React,{useState} from 'react';
import type {User} from '../../types';
import {useData} from '../../contexts/DataContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {useFulfillmentReturns} from '../../hooks/useFulfillmentReturns';
import {ReturnInput} from '../../services/fulfillment-returns.service';
import {ReturnsIntakeForm} from './returns/ReturnsIntakeForm';
import Pagination from '../shared/Pagination';
const reviewers=new Set(['group_ceo','country_managing_director','country_finance_director','regional_finance_manager','store_manager']);
interface Props{user:User|null;addNotification:(type:'success'|'alert'|'info',message:string)=>void}
export const ReturnsTab:React.FC<Props>=({user,addNotification})=>{
 const {activeSite,effectiveCountry}=useData();const {t}=useLanguage();
 const [mode,setMode]=useState<'intake'|'pending'|'history'>('intake');const [page,setPage]=useState(1);
 const scope=JSON.stringify([activeSite?.id,effectiveCountry,user?.id]);
 return <ReturnsWorkspace key={scope} site={activeSite?.id||''} country={effectiveCountry||''} user={user} mode={mode} setMode={m=>{setMode(m);setPage(1);}} page={page} setPage={setPage} t={t} notify={addNotification}/>;
};
function ReturnsWorkspace({site,country,user,mode,setMode,page,setPage,t,notify}:{site:string;country:string;user:User|null;mode:'intake'|'pending'|'history';setMode:(m:'intake'|'pending'|'history')=>void;page:number;setPage:(n:number)=>void;t:(k:string,p?:Record<string,string|number>)=>string;notify:Props['addNotification']}){
 const api=useFulfillmentReturns(site,country,user?.id||'',mode,page);const [reason,setReason]=useState<Record<string,string>>({});
 const submit=async(lines:ReturnInput[])=>{try{await api.submit.mutateAsync(lines);notify('success',t('warehouse.returnPendingSaved'));}catch{notify('alert',t('warehouse.returnSubmitFailed'));}};
 const decide=async(id:string,approve:boolean)=>{try{await api.decide.mutateAsync({id,approve,reason:reason[id]||''});notify('success',t('warehouse.returnDecisionSaved'));}catch{notify('alert',t('warehouse.returnDecisionFailed'));}};
 const button='min-h-11 px-3 py-2 rounded-lg border border-[var(--theme-border)] disabled:opacity-50 focus-visible:outline-2';
 return <section className="min-w-0 space-y-4 text-[var(--theme-text-primary)]">
  <h2 className="text-lg font-semibold">{t('warehouse.returnIntakeTitle')}</h2>
  <p className="text-sm text-[var(--theme-text-secondary)]">{t('warehouse.returnControlNote')}</p>
  <nav aria-label={t('warehouse.returnIntakeTitle')} className="flex flex-wrap gap-2">{(['intake','pending','history'] as const).map(m=><button key={m} aria-pressed={mode===m} className={`${button} ${mode===m?'bg-[var(--theme-bg-subtle)] font-semibold':''}`} onClick={()=>setMode(m)}>{t(`warehouse.returnMode_${m}`)}</button>)}</nav>
  {mode==='intake'?<ReturnsIntakeForm sale={api.sale} pending={api.submit.isPending} lookupPending={api.lookup.isPending} onLookup={async ref=>{api.setSale(null);try{await api.lookup.mutateAsync(ref);}catch{notify('alert',t('warehouse.returnLookupFailed'));}}} onClear={()=>api.setSale(null)} onSubmit={submit}/>:
   <div className="space-y-3" aria-busy={api.requests.isFetching}>
    {api.requests.isError?<div role="alert">{t('warehouse.returnLoadFailed')} <button className={button} onClick={()=>api.requests.refetch()}>{t('warehouse.recoveryRetry')}</button></div>:api.requests.isPending?<p role="status">{t('warehouse.recoveryLoading')}</p>:<>
     {!api.requests.data?.data.length&&<p>{t('warehouse.returnNoRequests')}</p>}
     {api.requests.data?.data.map(r=><article key={r.id} className="p-3 rounded-xl border border-[var(--theme-border)] space-y-3 min-w-0">
      <div className="flex flex-wrap justify-between gap-2 text-sm"><time dateTime={r.requested_at}>{new Date(r.requested_at).toLocaleString()}</time><span>{t(`warehouse.returnStatus_${r.status}`)} · {r.currency} {r.refund_amount}</span></div>
      {r.lines.map(l=><div key={l.saleItemId} className="flex flex-wrap gap-x-3 text-sm break-words"><span className="font-medium">{l.name}</span><span>{l.quantity}</span><span>{t(`warehouse.returnAction_${l.action}`)}</span><span>{l.reason}</span></div>)}
      <details className="text-xs break-all"><summary>{t('warehouse.returnReferences')}</summary>{r.id}<br/>{r.sale_id}</details>
      {mode==='pending'&&reviewers.has(user?.role||'')&&r.requested_by!==(user?.employeeId||user?.id)&&<div className="flex flex-wrap gap-2"><input className="min-h-11 min-w-0 flex-1 rounded-lg p-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]" aria-label={t('warehouse.returnDecisionReason')} placeholder={t('warehouse.returnDecisionReason')} value={reason[r.id]||''} onChange={e=>setReason({...reason,[r.id]:e.target.value})}/><button className={button} disabled={api.decide.isPending||(reason[r.id]||'').trim().length<3} onClick={()=>decide(r.id,true)}>{t('warehouse.returnApproveCredit')}</button><button className={button} disabled={api.decide.isPending||(reason[r.id]||'').trim().length<3} onClick={()=>decide(r.id,false)}>{t('warehouse.returnReject')}</button></div>}
     </article>)}
     <Pagination currentPage={page} totalPages={Math.max(1,Math.ceil((api.requests.data?.count||0)/25))} totalItems={api.requests.data?.count||0} itemsPerPage={25} onPageChange={setPage} isLoading={api.requests.isFetching}/>
    </>}
   </div>}
 </section>;
}
