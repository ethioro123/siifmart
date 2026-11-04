import { operationStatusLabel } from '../../../utils/operationsReviewLabels';
import React,{useState} from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../Modal';
import { useData } from '../../../contexts/DataContext';
import { useFulfillment,type OpTab } from '../FulfillmentContext';
import { useOperationsReview } from '../../../hooks/useOperationsReview';
import { operations,operationsReviewRoles,type Operation,type OperationMode,type ReviewSelection } from '../../../types/operations-review';
import { ReviewWorkspace } from '../receive/BlindReceiptReview';
import { OperationEvidence } from './OperationEvidence';
import { reviewControl as control } from './OperationReportReview';
import { getVisibleFulfillmentTabs } from '../../../utils/fulfillmentTabPermissions';
export function OperationsReview(){
 const {user,activeSite,t}=useFulfillment();const {effectiveCountry}=useData();
 const [open,setOpen]=useState(false);
 if(!user||!activeSite?.id||!effectiveCountry||!operationsReviewRoles.includes(user.role))return null;
 return <>
  <button type="button" className={`${control} self-start flex items-center gap-2`} onClick={()=>setOpen(true)}><ClipboardCheck size={18} aria-hidden="true"/>{t('warehouse.opTitle')}</button>
  {open&&<Workspace key={`${user.id}:${user.role}:${activeSite.id}:${effectiveCountry}`} site={activeSite.id} country={effectiveCountry} actor={user.id} role={user.role} onClose={()=>setOpen(false)}/>}
 </>;
}
function Workspace({site,country,actor,role,onClose}:{site:string;country:string;actor:string;role:string;onClose:()=>void}){
 const {t,setActiveTab,setSelectedJob,setIsDetailsOpen,refreshJobs}=useFulfillment();
 const {refreshData}=useData();const navigate=useNavigate();
 const [operation,setOperation]=useState<Operation>('ALL'),[mode,setMode]=useState<OperationMode>('exceptions'),[page,setPage]=useState(0),[selected,setSelected]=useState<ReviewSelection>(),[evidencePage,setEvidencePage]=useState(0),[notice,setNotice]=useState('');
 const api=useOperationsReview({site,country},actor,role,operation,mode,page,selected,evidencePage);
 const [receivingBusy,setReceivingBusy]=useState(false);
 const busy=receivingBusy||api.note.isPending||api.resolve.isPending||api.audit.isPending||api.credit.isPending||api.openJob.isPending;
 const choose=(value?:ReviewSelection)=>{setSelected(value);setEvidencePage(0);setNotice('');};
 const saved=async()=>{refreshJobs();};
 const receivingSaved=async()=>{await api.refresh();refreshJobs();await refreshData(['orders']);};
 const openControls=async()=>{
  if(!selected||!api.detail.data)return;
  const v=api.detail.data;setNotice('');
  if(selected.source==='inventory'){navigate(`/inventory?tab=pending&requestId=${encodeURIComponent(selected.id)}`);onClose();return;}
  const tab=(v.summary.operation==='DISPATCH'?'DRIVER':v.summary.operation) as OpTab;
  if(!getVisibleFulfillmentTabs(role).includes(tab)){setNotice(t('warehouse.opControlsUnavailable'));return;}
  if(selected.source==='job'){
   try{const job=await api.openJob.mutateAsync(selected.id);setActiveTab(tab);setSelectedJob(job);setIsDetailsOpen(true);onClose();}catch{setNotice(t('warehouse.opLoadFailed'));}
  }else{setActiveTab(tab);onClose();}
 };
 return <Modal isOpen title={t('warehouse.opTitle')} onClose={()=>{if(!busy)onClose();}} size="xl" mobileFullScreen closeOnEscape={!busy} closeOnClickOutside={!busy}>
  <div className="space-y-4 text-[var(--theme-text-primary)]">
   <p className="text-sm leading-relaxed text-[var(--theme-text-secondary)]">{t('warehouse.opIntro')}</p>
   {notice&&<p role="status">{notice}</p>}
   {selected?.source==='receipt'?<ReviewWorkspace site={site} country={country} actor={actor} role={role} t={t} onSaved={receivingSaved} onClose={()=>choose()} embedded initialReceipt={selected.id} onBusyChange={setReceivingBusy}/>:selected?<>
    <button type="button" className={control} disabled={busy} onClick={()=>choose()}>{t('warehouse.back')}</button>
    {api.detail.isFetching&&<p role="status">{t('warehouse.opLoading')}</p>}
    {api.detail.isError&&<p role="alert">{t('warehouse.opLoadFailed')} <button type="button" className={control} onClick={()=>void api.detail.refetch()}>{t('warehouse.receiptRefresh')}</button></p>}
    {api.detail.data&&!api.detail.isFetching&&!api.detail.isError&&<>
     <OperationEvidence key={`${selected.source}:${selected.id}:${evidencePage}`} value={api.detail.data} api={api} site={site} country={country} page={evidencePage} t={t} onSaved={saved} onOpen={()=>void openControls()} onInventory={id=>choose({source:'inventory',id})}/>
     <nav aria-label={t('warehouse.opEvidencePages')} className="flex gap-3"><button type="button" className={control} disabled={busy||evidencePage===0} onClick={()=>setEvidencePage(p=>p-1)}>{t('warehouse.opPrevious')}</button><span className="self-center">{evidencePage+1}</span><button type="button" className={control} disabled={busy||(api.detail.data.lines.length<25&&api.detail.data.reports.length<25)} onClick={()=>setEvidencePage(p=>p+1)}>{t('warehouse.opNext')}</button></nav>
    </>}
   </>:<>
    <div className="flex flex-wrap items-end gap-3">
     <label className="text-sm space-y-1"><span className="block">{t('warehouse.opOperation')}</span><select className={control} value={operation} onChange={e=>{setOperation(e.target.value as Operation);setPage(0);}}>{operations.map(v=><option key={v} value={v}>{t(`warehouse.opOperation_${v}`)}</option>)}</select></label>
     <label className="text-sm space-y-1"><span className="block">{t('warehouse.opView')}</span><select className={control} value={mode} onChange={e=>{setMode(e.target.value as OperationMode);setPage(0);}}>{(['exceptions','active','history'] as const).map(v=><option key={v} value={v}>{t(`warehouse.opMode_${v}`)}</option>)}</select></label>
     <button type="button" className={control} disabled={api.queue.isFetching} onClick={()=>void api.queue.refetch()}>{t('warehouse.receiptRefresh')}</button>
    </div>
    {api.queue.isFetching&&<p role="status">{t('warehouse.opLoading')}</p>}
    {api.queue.isError?<p role="alert">{t('warehouse.opLoadFailed')}</p>:!api.queue.isFetching&&<>
     {api.queue.data?.length===0&&<p>{t('warehouse.opEmpty')}</p>}
     <ul className="divide-y divide-[var(--theme-border)]">{api.queue.data?.map(row=><li key={`${row.source}:${row.id}`}><button type="button" className="min-h-[52px] w-full text-left py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]" onClick={()=>choose(row)}>
      <p className="font-semibold break-words">{row.reference} · {t(`warehouse.opOperation_${row.operation}`)}</p>
      <p className="text-sm text-[var(--theme-text-secondary)]">{operationStatusLabel(t,row.status)} · {row.handler} · {new Date(row.occurred_at).toLocaleString()}</p>
      {row.exception&&<span className="text-sm text-[var(--theme-status-warning-text)]">{t('warehouse.opException')}</span>}
     </button></li>)}</ul>
    </>}
    <nav aria-label={t('warehouse.opQueuePages')} className="flex items-center gap-3"><button type="button" className={control} disabled={api.queue.isFetching||page===0} onClick={()=>setPage(p=>p-1)}>{t('warehouse.opPrevious')}</button><span>{page+1}</span><button type="button" className={control} disabled={api.queue.isFetching||api.queue.isError||api.queue.data?.length!==25} onClick={()=>setPage(p=>p+1)}>{t('warehouse.opNext')}</button></nav>
   </>}
  </div>
 </Modal>;
}
