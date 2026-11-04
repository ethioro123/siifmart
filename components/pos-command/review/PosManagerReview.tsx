import React,{useRef,useState} from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../Modal';
import type { UserRole } from '../../../types';
import { hasPermission } from '../../../services/permissions.service';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { usePOSCommand } from '../POSCommandContext';
import { CounterReviewPanel } from '../layout/CounterReviewPanel';
import { usePosManagerReview } from '../../../hooks/usePosManagerReview';
import { posReviewRoles,posReviewSources,type PosReviewRow,type PosReviewSource,type PosReviewDetail } from '../../../types/pos-manager-review';
const control='min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 py-2 text-sm text-[var(--theme-text-primary)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]';
export function PosManagerReview(){
 const {user}=useStore();const {activeSite,effectiveCountry}=useData();const {t}=useLanguage();const [open,setOpen]=useState(false);
 if(!user||!activeSite?.id||!effectiveCountry||!posReviewRoles.includes(user.role))return null;
 return <><button type="button" className={`${control} flex items-center gap-2`} onClick={()=>setOpen(true)}><ClipboardCheck size={18}/>{t('posCommand.managerReview')}</button>
 {open&&<Workspace key={`${user.id}:${activeSite.id}:${effectiveCountry}`} site={activeSite.id} country={effectiveCountry} actor={user.id} role={user.role} close={()=>setOpen(false)}/>}</>;
}
function Workspace({site,country,actor,role,close}:{site:string;country:string;actor:string;role:UserRole;close:()=>void}){
 const {t}=useLanguage();const navigate=useNavigate();const pos=usePOSCommand();
 const [source,setSource]=useState<PosReviewSource>('all'),[history,setHistory]=useState(false),[page,setPage]=useState(0),[selected,setSelected]=useState<PosReviewRow>(),[notesPage,setNotesPage]=useState(0),[cash,setCash]=useState(false),[cashBusy,setCashBusy]=useState(false);
 const api=usePosManagerReview({site,country},actor,role,source,history,page,selected,notesPage);
 const choose=(row?:PosReviewRow)=>{setSelected(row);setNotesPage(0);};
 const openControls=(value:PosReviewDetail)=>{
  if(!value.can_controls || (['sale','return'].includes(value.summary.source)&&!hasPermission(role,'sales.view')))return;
  if(value.summary.source==='receiving'){pos.setIsReceivingModalOpen(true);close();}
  else if(['shift','drop'].includes(value.summary.source))setCash(true);
  else if(['sale','return'].includes(value.summary.source)){navigate('/sales');close();}
 };
 return <Modal isOpen title={t('posCommand.managerReview')} onClose={()=>{if(!api.note.isPending&&!cashBusy)close();}} size="xl" mobileFullScreen closeOnEscape={!api.note.isPending&&!cashBusy} closeOnClickOutside={!api.note.isPending&&!cashBusy}>
 <div className="space-y-4 text-[var(--theme-text-primary)]">
  <p className="text-sm text-[var(--theme-text-secondary)]">{t('posCommand.reviewIntro')}</p>
  {cash?<><button className={control} disabled={cashBusy} onClick={()=>setCash(false)}>{t('posCommand.reviewBack')}</button><CounterReviewPanel onBusyChange={setCashBusy}/></>:selected?<>
   <div className="flex gap-2"><button className={control} disabled={api.note.isPending} onClick={()=>choose()}>{t('posCommand.reviewBack')}</button><button className={control} disabled={api.note.isPending||api.detail.isFetching} onClick={()=>void api.detail.refetch()}>{t('posCommand.reviewRefresh')}</button></div>
   {api.detail.isFetching?<p role="status">{t('posCommand.reviewLoading')}</p>:api.detail.isError?<p role="alert">{t('posCommand.reviewUnavailable')}</p>:api.detail.data&&<Evidence key={`${selected.source}:${selected.id}:${notesPage}`} value={{...api.detail.data,can_controls:api.detail.data.can_controls&&(!['sale','return'].includes(api.detail.data.summary.source)||hasPermission(role,'sales.view'))}} api={api} site={site} country={country} page={notesPage} openControls={openControls}/>}
   <nav aria-label={t('posCommand.reviewNotesHistory')} className="flex gap-3"><button className={control} disabled={api.note.isPending||api.detail.isFetching||notesPage===0} onClick={()=>setNotesPage(p=>p-1)}>{t('posCommand.reviewPrevious')}</button><span>{notesPage+1}</span><button className={control} disabled={api.note.isPending||api.detail.isFetching||api.detail.isError||api.detail.data?.notes.length!==25} onClick={()=>setNotesPage(p=>p+1)}>{t('posCommand.reviewNext')}</button></nav>
  </>:<>
   <div className="flex flex-wrap gap-3"><select aria-label={t('posCommand.managerReview')} className={control} value={source} onChange={e=>{setSource(e.target.value as PosReviewSource);setPage(0);}}>{posReviewSources.map(s=><option key={s} value={s}>{t(`posCommand.review_${s}`)}</option>)}</select>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={history} onChange={e=>{setHistory(e.target.checked);setPage(0);}}/>{t('posCommand.reviewHistory')}</label>
    <button className={control} disabled={api.queue.isFetching} onClick={()=>void api.queue.refetch()}>{t('posCommand.reviewRefresh')}</button></div>
   {api.queue.isFetching?<p role="status">{t('posCommand.reviewLoading')}</p>:api.queue.isError?<p role="alert">{t('posCommand.reviewUnavailable')}</p>:<>
    {!api.queue.data?.length&&<p>{t('posCommand.reviewEmpty')}</p>}
    <ul className="divide-y divide-[var(--theme-border)]">{api.queue.data?.map(row=><li key={`${row.source}:${row.id}`} className="flex flex-wrap justify-between items-center gap-3 py-3"><div className="min-w-0 break-words"><p className="font-semibold">{row.reference}</p><p className="text-sm">{t(`posCommand.review_${row.source}`)} · {row.status} · {row.actor_name} · {new Date(row.occurred_at).toLocaleString()}</p></div><button className={control} onClick={()=>choose(row)}>{t('posCommand.reviewDetails')}</button></li>)}</ul>
   </>}
   <nav className="flex gap-3"><button className={control} disabled={api.queue.isFetching||page===0} onClick={()=>setPage(p=>p-1)}>{t('posCommand.reviewPrevious')}</button><span>{page+1}</span><button className={control} disabled={api.queue.isFetching||api.queue.isError||api.queue.data?.length!==25} onClick={()=>setPage(p=>p+1)}>{t('posCommand.reviewNext')}</button></nav>
  </>}
 </div></Modal>;
}
function Evidence({value:v,api,site,country,page,openControls}:{value:PosReviewDetail;api:ReturnType<typeof usePosManagerReview>;site:string;country:string;page:number;openControls:(value:PosReviewDetail)=>void}){
 const {t}=useLanguage();const [reason,setReason]=useState(''),[notice,setNotice]=useState(''),[saved,setSaved]=useState(false);const lock=useRef(false);
 const save=async()=>{if(lock.current||saved||api.note.isPending||!v.can_note||reason.trim().length<5)return;lock.current=true;try{await api.note.mutateAsync({site,country,source:v.summary.source,id:v.summary.id,fingerprint:v.fingerprint,reason});setSaved(true);setReason('');setNotice(t('posCommand.reviewSaved'));}catch{setNotice(t('posCommand.reviewSaveFailed'));}finally{lock.current=false;}};
 return <section className="space-y-4"><h3 className="font-semibold text-lg">{v.summary.reference}</h3>
  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Object.entries(v.fields).filter(([,value])=>value!==null&&value!=='').map(([key,value])=><div key={key}><dt className="text-sm text-[var(--theme-text-secondary)]">{t(`posCommand.reviewField_${key}`)}</dt><dd className="break-words">{typeof value==='boolean'?t(value?'posCommand.reviewYes':'posCommand.reviewNo'):String(value)}</dd></div>)}</dl>
  {v.can_controls&&['sale','return','shift','drop','receiving'].includes(v.summary.source)&&<button className={control} disabled={api.note.isPending} onClick={()=>openControls(v)}>{t(v.summary.source==='receiving'?'posCommand.reviewReceivingControls':['shift','drop'].includes(v.summary.source)?'posCommand.reviewCashControls':'posCommand.reviewSalesControls')}</button>}
  {!v.can_controls&&v.summary.source!=='event'&&<p role="status" className="text-sm text-[var(--theme-text-secondary)]">{t('posCommand.reviewControlsUnavailable')}</p>}
  {v.notes.map((n,i)=><p key={i} className="text-sm border-t border-[var(--theme-border)] pt-3 break-words">{n.reviewer_name} · {new Date(n.created_at).toLocaleString()} · {n.reason}</p>)}
  {v.can_note&&page===0?<div className="space-y-2"><label className="block">{t('posCommand.reviewNote')}<textarea className={`${control} block w-full`} maxLength={1200} value={reason} disabled={api.note.isPending||saved} onChange={e=>setReason(e.target.value)}/></label><button className={control} disabled={api.note.isPending||saved||reason.trim().length<5} onClick={()=>void save()}>{t('posCommand.reviewRecord')}</button></div>:!v.can_note&&<p>{t('posCommand.reviewIndependent')}</p>}
  {notice&&<p role="status">{notice}</p>}
 </section>;
}
