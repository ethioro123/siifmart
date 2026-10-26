// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignJobCard } from '../../components/fulfillment/assign/AssignJobCard';
import { AssignPendingJobs } from '../../components/fulfillment/assign/AssignPendingJobs';
import { AssignAvailableWorkers } from '../../components/fulfillment/assign/AssignAvailableWorkers';
import type { WMSJob, Employee } from '../../types';
const mocks=vi.hoisted(()=>({assign:vi.fn(),excluded:[] as string[]}));
vi.mock('../../hooks/useFloorStageEligibility',()=>({useFloorStageEligibility:()=>({ready:true,excluded:mocks.excluded})}));
vi.mock('../../components/fulfillment/FulfillmentContext',()=>({useFulfillment:()=>({assignJob:mocks.assign})}));
vi.mock('../../components/Protected',()=>({Protected:({children}:{children:React.ReactNode})=><>{children}</>}));
afterEach(cleanup);beforeEach(()=>{vi.clearAllMocks();mocks.excluded=[];});
const job={id:'job',jobNumber:'9K63JN',type:'PICK',status:'Pending',priority:'Normal',items:4,siteId:'dc',lineItems:[{sku:'ETBB002',name:'MoliCare'}]} as WMSJob;
const team=[{id:'picker',name:'Order Picker',role:'picker',status:'Active'},{id:'driver',name:'Delivery Driver',role:'driver',status:'Active'}] as Employee[];
describe('assignment workspace',()=>{
 it('provides keyboard-accessible job selection and separate details without invented ETA',()=>{
  const select=vi.fn(),details=vi.fn();
  render(<AssignJobCard job={job} isAssigned={false} isSelected={false} setSelectedJob={select} setIsDetailsOpen={details} sites={[]} employees={team} t={s=>s}/>);
  fireEvent.click(screen.getByRole('button',{name:'Select job 9K63JN'}));expect(select).toHaveBeenCalledWith(job);expect(details).toHaveBeenLastCalledWith(false);
  fireEvent.click(screen.getByRole('button',{name:'Details for job 9K63JN'}));expect(details).toHaveBeenLastCalledWith(true);
  expect(screen.queryByText('ETA')).toBeNull();
 });
 it('searches the job number or SKU without a long strip of empty job-type tabs',()=>{
  render(<AssignPendingJobs filteredJobs={[job]} historicalJobs={[]} assignJobFilter="ALL" setAssignJobFilter={vi.fn()} dispatchPriorityFilter="ALL" setDispatchPriorityFilter={vi.fn()} dispatchSearch="9K63JN" setDispatchSearch={vi.fn()} assignSortBy="priority" setAssignSortBy={vi.fn()} employees={team} jobAssignments={[]} sites={[]} selectedJob={null} setSelectedJob={vi.fn()} setIsDetailsOpen={vi.fn()} t={s=>s}/>);
  expect(screen.getByRole('button',{name:'Select job 9K63JN'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/PACK/})).toBeNull();
 });
 it('preserves eligibility and saves assignment only for an eligible selected worker',async()=>{
  const notify=vi.fn(),refresh=vi.fn().mockResolvedValue(undefined);mocks.assign.mockResolvedValue(undefined);
  render(<AssignAvailableWorkers filteredEmployees={team} dispatchEmployeeFilter="ALL" setDispatchEmployeeFilter={vi.fn()} dispatchEmployeeSearch="" setDispatchEmployeeSearch={vi.fn()} isEmployeeRoleDropdownOpen={false} setIsEmployeeRoleDropdownOpen={vi.fn()} workloads={team.map(e => ({employeeId:e.id,active:0,completedToday:4}))} workloadReady={true} jobAssignments={[]} selectedJob={{...job,type:'DISPATCH'}} setSelectedJob={vi.fn()} setIsSubmitting={vi.fn()} refreshData={refresh} addNotification={notify} wmsJobsService={{}} assignCurrentPage={1} setAssignCurrentPage={vi.fn()} ASSIGN_ITEMS_PER_PAGE={20} t={s=>s}/>);
  expect((screen.getByRole('button',{name:'Assign job to Order Picker'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Assign job to Delivery Driver'}));
  await waitFor(()=>expect(mocks.assign).toHaveBeenCalledWith('job','driver'));
  expect(notify).toHaveBeenCalledWith('success','Job assigned to Delivery Driver');
 });
 it('excludes a worker who handled a different stage of the same order',()=>{
  mocks.excluded=['picker'];
  render(<AssignAvailableWorkers filteredEmployees={team} dispatchEmployeeFilter="ALL" setDispatchEmployeeFilter={vi.fn()} dispatchEmployeeSearch="" setDispatchEmployeeSearch={vi.fn()} isEmployeeRoleDropdownOpen={false} setIsEmployeeRoleDropdownOpen={vi.fn()} workloads={[{employeeId:'picker',active:0,completedToday:7}]} workloadReady={true} jobAssignments={[]} selectedJob={{...job,type:'PUTAWAY'}} setSelectedJob={vi.fn()} setIsSubmitting={vi.fn()} refreshData={vi.fn()} addNotification={vi.fn()} wmsJobsService={{}} assignCurrentPage={1} setAssignCurrentPage={vi.fn()} ASSIGN_ITEMS_PER_PAGE={20} t={s=>s}/>);
  expect((screen.getByRole('button',{name:'Assign job to Order Picker'}) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText(/Handled another stage/)).toBeTruthy();
 });
 it('shows live daily totals and disables assignment at 100 active jobs',()=>{
  render(<AssignAvailableWorkers filteredEmployees={team} dispatchEmployeeFilter="ALL" setDispatchEmployeeFilter={vi.fn()} dispatchEmployeeSearch="" setDispatchEmployeeSearch={vi.fn()} isEmployeeRoleDropdownOpen={false} setIsEmployeeRoleDropdownOpen={vi.fn()} workloads={[{employeeId:'picker',active:100,completedToday:7}]} workloadReady={true} workloadTimezone="Africa/Addis_Ababa" jobAssignments={[]} selectedJob={job} setSelectedJob={vi.fn()} setIsSubmitting={vi.fn()} refreshData={vi.fn()} addNotification={vi.fn()} wmsJobsService={{}} assignCurrentPage={1} setAssignCurrentPage={vi.fn()} ASSIGN_ITEMS_PER_PAGE={20} t={s=>s}/>);
  expect(screen.getByText(/100 \/ 100 active · 7 completed today/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Assign job to Order Picker'}));
  expect(mocks.assign).not.toHaveBeenCalled();
 });

});
