import React from 'react';
import {useFulfillmentData} from './FulfillmentDataProvider';
import {useLanguage} from '../../contexts/LanguageContext';
export function FulfillmentRecoveryControls(){
 const {t}=useLanguage();const data=useFulfillmentData();
 const button='min-h-11 rounded-lg px-3 py-2 border border-[var(--theme-border)] disabled:opacity-50';
 return <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--theme-text-primary)]">
  {data.queueError&&<p role="alert">{t('warehouse.queueUnavailable')}</p>}
  {data.queueError?<button className={button} onClick={data.refreshJobs}>{t('warehouse.recoveryRetry')}</button>:data.queueHasMore&&<button className={button} disabled={data.queueLoading} onClick={data.loadMoreJobs}>{t(data.queueLoading?'warehouse.recoveryLoading':'warehouse.queueMore')}</button>}
  {data.historyError&&<p role="alert">{t('warehouse.historyUnavailable')}</p>}
  {(data.historyHasMore||data.historyError)&&<button className={button} disabled={data.historyLoading} onClick={()=>data.historyError?data.loadHistoricalJobs():data.loadMoreHistory()}>{t(data.historyLoading?'warehouse.recoveryLoading':data.historyError?'warehouse.recoveryRetry':'warehouse.historyMore')}</button>}
 </div>;
}
