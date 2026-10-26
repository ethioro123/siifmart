import React,{useState} from 'react';
import {useRecoverPackByReference} from '../../../../hooks/useRecoverPackHandoff';
export function PackRecoveryLookup({siteId,country}:{siteId?:string;country?:string}){
 const [reference,setReference]=useState('');const mutation=useRecoverPackByReference();
 return <details className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 text-sm text-[var(--theme-text-primary)]"><summary className="min-h-[44px] cursor-pointer">Recover a completed Pack handoff</summary>
 <p className="my-2">If packing finished but no dispatch appeared, enter its job number. The server verifies your authority and reuses an existing handoff when present.</p>
 <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();if(siteId&&country)mutation.mutate({reference:reference.trim(),siteId,country});}}>
 <label className="flex flex-1 flex-col gap-1">Completed Pack job number<input className="min-h-[44px] min-w-0 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3" placeholder="e.g. BTZ6X4" value={reference} onChange={e=>setReference(e.target.value)}/></label>
 <button className="min-h-[44px] self-end rounded-lg border border-[var(--theme-border)] px-4 disabled:opacity-40" disabled={!siteId||!country||!reference.trim()||mutation.isPending}>{mutation.isPending?'Recovering…':'Recover dispatch handoff'}</button></form>
 {mutation.isSuccess&&<p role="status" className="mt-2">Dispatch handoff confirmed: {mutation.data.dispatch.jobNumber||mutation.data.dispatch.id}.</p>}
 {mutation.isError&&<p role="alert" className="mt-2">{mutation.error&&typeof mutation.error==='object'&&'message'in mutation.error?String(mutation.error.message):'Recovery was not confirmed.'}</p>}
 </details>;
}
