import {getFulfillmentTransferPage,TransferQueueCursor} from '../services/fulfillment-transfer-queue.service';
import {useCallback,useRef,useState} from 'react';
import type {QueueCursor} from '../services/blind-receiving.service';
import {wmsJobsService} from '../services/wms-jobs.service';
import {jobAssignmentsService} from '../services/job-assignments.service';
import type {User,Employee,TransferRecord,WMSJob,JobAssignment} from '../types';
export function useFulfillmentQueuePaging(site:string|undefined,country:string,worker:string|undefined,actor:string|undefined,setJobs:React.Dispatch<React.SetStateAction<WMSJob[]>>,setAssignments:React.Dispatch<React.SetStateAction<JobAssignment[]>>,setTransfers:React.Dispatch<React.SetStateAction<TransferRecord[]>>){
 const scope=JSON.stringify([site,country,worker,actor]);const current=useRef(scope);current.current=scope;
 const transferPage=useRef<TransferQueueCursor>({});
 const page=useRef<{active?:QueueCursor;blind?:QueueCursor}>({});const lock=useRef(false);const [state,setState]=useState({scope,hasMore:false,loading:false,error:false});
 const initialize=useCallback((hasMore:boolean,cursor:{active?:QueueCursor;blind?:QueueCursor}={},transfers:TransferQueueCursor={})=>{page.current=cursor;transferPage.current=transfers;setState({scope,hasMore,loading:false,error:false});},[scope]);
 const loadMore=useCallback(async()=>{
  if(!site||lock.current)return;lock.current=true;const request=scope;
  setState(s=>({...s,scope,loading:true,error:false}));
  try{const [result,transferResult]=await Promise.all([wmsJobsService.getActivePage(site,worker,country,page.current),getFulfillmentTransferPage(site,country,transferPage.current)]);const assignments=await jobAssignmentsService.getForJobs(result.jobs,site);
   if(current.current!==request)return;page.current=result.cursor;transferPage.current=transferResult.cursor;
   setTransfers(prev=>[...new Map([...prev,...transferResult.transfers].map(t=>[t.id,t])).values()]);
   setJobs(prev=>[...new Map([...prev,...result.jobs].map(j=>[j.id,j])).values()]);setAssignments(prev=>[...new Map([...prev,...assignments].map(a=>[a.id,a])).values()]);
   setState({scope,hasMore:result.hasMore||transferResult.hasMore,loading:false,error:false});
  }catch{if(current.current===request)setState(s=>({...s,scope,loading:false,error:true}));}finally{lock.current=false;}
 },[site,country,worker,scope,setJobs,setAssignments,setTransfers]);
 const failInitial=()=>setState({scope,hasMore:false,loading:false,error:true});
 return {initialize,failInitial,loadMoreJobs:loadMore,queueHasMore:state.scope===scope&&state.hasMore,queueLoading:state.scope===scope&&state.loading,queueError:state.scope===scope&&state.error};
}

export function fulfillmentQueueWorker(user:User|null,employees:Employee[]){
 const globalRoles=['group_ceo','country_managing_director','regional_operations_manager','country_operations_director','warehouse_manager','dispatcher','store_manager','regional_supply_chain_manager','inventory_manager','assistant_store_manager','shift_supervisor','inventory_specialist','dispatch_supervisor','country_supply_chain_director','fleet_maintenance_supervisor','replenishment_planner'];
 if(!user||globalRoles.includes(user.role.toLowerCase()))return undefined;
 return user.employeeId||employees.find(e=>e.id===user.id||(user.email&&e.email===user.email))?.id||user.id;
}
