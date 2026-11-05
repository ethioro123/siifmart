import React from 'react';
import {useLanguage} from '../../../../contexts/LanguageContext';
export interface PickLotProof{batch:string;expiry:string;verified:boolean}
export const emptyPickLotProof:PickLotProof={batch:'',expiry:'',verified:false};
interface Props{batch?:string;expiry?:string;location?:string;value:PickLotProof;onChange:(value:PickLotProof)=>void;disabled?:boolean}
export function PickLotVerification({batch,expiry,location,value,onChange,disabled}:Props){
 const {t}=useLanguage();
 const input='min-h-11 min-w-0 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 text-[var(--theme-text-primary)]';
 return <fieldset disabled={disabled} className="space-y-2 rounded-xl border border-[var(--theme-border)] p-3 text-sm text-[var(--theme-text-primary)]">
  <legend className="px-1 font-semibold">{t('warehouse.fefoVerifyLot')}</legend>
  <p className="break-words">{t('warehouse.fefoTarget')}: <strong>{location}</strong> · {batch||t('warehouse.fefoNotRecorded')} · {expiry||t('warehouse.fefoNotRecorded')}</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
   <label className="min-w-0">{t('warehouse.fefoPhysicalBatch')}<input className={input} maxLength={200} autoComplete="off" value={value.batch} onChange={e=>onChange({...value,batch:e.target.value,verified:false})}/></label>
   <label className="min-w-0">{t('warehouse.fefoPhysicalExpiry')}<input className={input} type="date" value={value.expiry} onChange={e=>onChange({...value,expiry:e.target.value,verified:false})}/></label>
  </div>
  <label className="flex min-h-11 items-start gap-3"><input className="mt-1 size-5 shrink-0" type="checkbox" checked={value.verified} onChange={e=>onChange({...value,verified:e.target.checked})}/><span>{t('warehouse.fefoPhysicalConfirmation')}</span></label>
 </fieldset>;
}
