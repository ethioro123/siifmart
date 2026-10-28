import React,{useState} from 'react';
import { usePriceRetentionHold } from '../../hooks/usePriceRetentionHold';
export function PriceRetentionHold({productId,country}:{productId:string;country:string}){
 const {status,manage}=usePriceRetentionHold(productId,country);const [reason,setReason]=useState('');const [message,setMessage]=useState('');
 if(status.isError)return <p role="alert" className="text-sm">Audit/dispute hold status could not be checked. <button type="button" className="underline" onClick={()=>status.refetch()}>Retry</button></p>;
 if(!status.data?.canManage)return null;
 const hold=status.data.hold;
 const submit=async(event:React.FormEvent)=>{event.preventDefault();setMessage('');try{await manage.mutateAsync({reason,release:Boolean(hold)});setReason('');setMessage(hold?'Hold released. Normal retention eligibility applies.':'Audit/dispute hold saved. Price history and proposals are protected from retention cleanup.');}catch(error){setMessage(error instanceof Error?error.message:'Hold change was not saved.');}};
 return <section aria-label="Price history audit and dispute hold" className="rounded-xl border border-[var(--theme-border)] p-4 space-y-3">
  <h4 className="font-semibold text-sm">Audit/dispute hold</h4>
  <p className="text-sm">{hold?`Active hold since ${new Date(hold.placed_at).toLocaleDateString()}: ${hold.reason}`:'No active hold. Applied price records are retained for 10 years; rejected proposals for 2 years.'}</p>
  <form onSubmit={submit} className="space-y-2"><label className="block text-sm">{hold?'Reason for releasing this hold':'Audit or dispute reason'}<textarea value={reason} onChange={event=>setReason(event.target.value)} maxLength={1200} minLength={3} required className="mt-1 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3" /></label>
   <button type="submit" disabled={manage.isPending||status.isFetching||reason.trim().length<3} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4 text-sm font-semibold disabled:opacity-50">{manage.isPending?'Saving…':hold?'Release hold':'Place hold'}</button>
  </form>{message&&<p role="status" className="text-sm">{message}</p>}
 </section>;
}
