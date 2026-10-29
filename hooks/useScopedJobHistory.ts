import {useCallback,useEffect,useRef,useState} from 'react';
import {wmsJobsService} from '../services/wms-jobs.service';
import type {WMSJob,User,Employee} from '../types';
import {logger} from '../utils/logger';
// Mirrors the database's established is_manager role set; RLS remains authoritative.
const managers=new Set(['group_ceo','country_managing_director','regional_operations_manager','country_operations_director','country_finance_director','country_hr_director','country_commercial_director','country_supply_chain_director','regional_procurement_manager','regional_finance_manager','regional_hr_manager','regional_logistics_manager','regional_security_manager','regional_merchandising_manager','buyer','store_manager','warehouse_manager','dispatch_supervisor','assistant_store_manager','shift_supervisor','fleet_maintenance_supervisor','corporate_merchandising_manager','inventory_manager','regional_supply_chain_manager']);
export function useScopedJobHistory(siteId:string|undefined,country:string,user:User|null,employees:Employee[]){
 const scope=JSON.stringify([siteId,country,user?.id,user?.employeeId,user?.email,user?.role]);const current=useRef(scope);current.current=scope;
 const [state,setState]=useState({scope,error:false,loading:false,hasMore:false});const page=useRef(0);const lock=useRef(false);
 const [result,setResult]=useState<{scope:string;jobs:WMSJob[]}|null>(null);
 useEffect(()=>{setResult(null);},[scope]);
 const load=useCallback(async(limit=25,append=false)=>{
  if(!siteId||!user?.id||lock.current)return;lock.current=true;
  setState({scope,error:false,loading:true,hasMore:false});
  const requestScope=scope;
  const employeeId=user.employeeId||employees.find(e=>e.id===user.id||(user.email&&e.email===user.email))?.id||user.id;
  try{const jobs=await wmsJobsService.getHistory(siteId,Math.min(25,Math.max(1,limit)),managers.has(user.role)?undefined:employeeId,country,undefined,append?page.current+1:0);
   if(current.current===requestScope){page.current=append?page.current+1:0;setResult(prev=>({scope:requestScope,jobs:append&&prev?.scope===scope?[...new Map([...prev.jobs,...jobs].map(j=>[j.id,j])).values()]:jobs}));setState({scope,error:false,loading:false,hasMore:jobs.length===25});}
  }catch(error){if(current.current===requestScope)setState({scope,error:true,loading:false,hasMore:true});logger.error('JobHistory','History read failed',error);}finally{lock.current=false;}
 },[siteId,country,user,employees,scope]);
 return {historicalJobs:result?.scope===scope?result.jobs:[],loadHistoricalJobs:load,loadMoreHistory:()=>load(25,true),historyError:state.scope===scope&&state.error,historyLoading:state.scope===scope&&state.loading,historyHasMore:state.scope===scope&&state.hasMore};
}
