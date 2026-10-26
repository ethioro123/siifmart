import React from 'react';
import type {WMSJob} from '../../../../types';
import {useStore} from '../../../../contexts/CentralStore';
import {useRecoverPackHandoff} from '../../../../hooks/useRecoverPackHandoff';
export function PackHandoffRecovery({job}:{job:WMSJob}){
 const {user}=useStore();const mutation=useRecoverPackHandoff();
 const allowed=job.completedBy===user?.id||['group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager'].includes(user?.role||'');
 if(job.status!=='Completed'||!allowed)return null;
 return <section className="my-3 space-y-2 text-sm text-[var(--theme-text-primary)]"><button className="min-h-[44px] rounded-lg border border-[var(--theme-border)] px-4 focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] disabled:opacity-40" disabled={mutation.isPending} onClick={()=>mutation.mutate(job.id)}>{mutation.isPending?'Confirming handoff…':'Confirm / recover dispatch handoff'}</button>
 {mutation.isSuccess&&<p role="status">Dispatch handoff confirmed. Repeated confirmation returns the same dispatch job.</p>}
 {mutation.isError&&<p role="alert">{mutation.error&&typeof mutation.error==='object'&&'message'in mutation.error?String(mutation.error.message):'Handoff was not confirmed.'}</p>}</section>;
}
