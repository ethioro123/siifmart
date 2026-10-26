import {useCallback} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import type {QueryClient} from '@tanstack/react-query';
import type {WMSJob} from '../types';
import {packingExecutionService} from '../services/packing-execution.service';
export function useCompletePackJob({setJobs,queryClient,addNotification}:{setJobs:Dispatch<SetStateAction<WMSJob[]>>;queryClient:QueryClient;addNotification:(type:'success'|'alert'|'info',message:string)=>void}){
 return useCallback(async(jobId:string)=>{
  const {job,dispatch}=await packingExecutionService.complete(jobId);
  setJobs(prev=>[job,dispatch,...prev.filter(j=>j.id!==job.id&&j.id!==dispatch.id)]);
  await Promise.all([queryClient.invalidateQueries({queryKey:['jobs']}),queryClient.invalidateQueries({queryKey:['assignment-workloads']})]);
  window.dispatchEvent(new CustomEvent('fulfillment:job-completed',{detail:{job,employeeId:job.completedBy,userId:job.completedBy,pointsResult:{points:0,breakdown:[]},accuracy:100}}));
  addNotification('success','Packing and dispatch handoff confirmed.');
  return {points:0,breakdown:[],pendingConfirmation:true};
 },[setJobs,queryClient,addNotification]);
}
