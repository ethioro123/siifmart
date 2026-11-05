// Investigation characterizations: passing assertions reproduce gaps, not desired behavior.
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),employeeUpdate:vi.fn(),logs:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:{from:mocks.from}}));
vi.mock('../../services/employees.service',()=>({employeesService:{update:mocks.employeeUpdate}}));
vi.mock('../../services/system-logs.service',()=>({systemLogsService:{create:mocks.logs}}));
vi.mock('../../utils/logger',()=>({logger:{warn:vi.fn(),error:vi.fn(),info:vi.fn()}}));
import { attendanceService } from '../../services/attendance.service';
import { employeeChangesService } from '../../services/employee-changes.service';
import { payrollRunsService } from '../../services/payroll-runs.service';
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();mocks.logs.mockResolvedValue({});});
describe('employee workflow failures',()=>{
 it('returns a successful-looking clock-in and stores it locally after the server rejects it',async()=>{
  mocks.from.mockReturnValue({insert:()=>({select:()=>({single:async()=>({data:null,error:{code:'42P01',message:'Attendance table missing'}})})})});
  const result=await attendanceService.clockIn({country_code:'ET',site_id:'warehouse',employee_id:'worker',employee_name:'Audit worker'});
  expect(result.status).toBe('Present');expect(result.id).toBeTruthy();
  expect(JSON.parse(localStorage.getItem('siifmart_attendance_backup')||'[]')).toContainEqual(expect.objectContaining({id:result.id}));
  expect(mocks.logs).toHaveBeenCalledWith(expect.objectContaining({action:'EMPLOYEE_CLOCK_IN'}));
 });
 it('returns another site attendance from its cache when the requested-site query throws',async()=>{
  localStorage.setItem('siifmart_attendance_backup',JSON.stringify([{id:'foreign-site-attendance',country_code:'ET',site_id:'other-site',employee_id:'other-worker'}]));
  mocks.from.mockImplementation(()=>{throw new Error('Network unavailable');});
  expect(await attendanceService.fetchAttendance('ET',undefined,'warehouse')).toContainEqual(expect.objectContaining({site_id:'other-site'}));
 });
 it('writes an invented eight-hour shift when clocking out a row absent from the device cache',async()=>{
  const update=vi.fn().mockReturnValue({eq:async()=>({error:null})});mocks.from.mockReturnValue({update});
  expect(await attendanceService.clockOut('server-row')).toBeNull();
  expect(update).toHaveBeenCalledWith(expect.objectContaining({hours_worked:8}));
 });
 it('applies employee changes before approval persistence and leaves them applied when that save fails',async()=>{
  let salary=100;const record={id:'request',employee_id:'worker',employee_name:'Audit worker',country_code:'ET',site_id:'warehouse',requested_by:'Different maker',requested_by_role:'hr_generalist',requested_at:'2026-11-06',status:'pending',governance_category:'compensation',required_approvers:['Finance Department'],diffs:[],full_proposed_employee:{salary:999},reason:'Audit salary change'};
  mocks.employeeUpdate.mockImplementation(async()=>{salary=999;});
  mocks.from.mockImplementation((table:string)=>{
   if(table==='employee_change_requests')return {select:()=>({eq:()=>({single:async()=>({data:record,error:null})})}),update:()=>({eq:async()=>({error:new Error('Approval save refused')})})};
   if(table==='employees')return {select:()=>({eq:()=>({maybeSingle:async()=>({data:{role:'picker'},error:null})})})};
   throw new Error('Unexpected table');
  });
  await expect(employeeChangesService.approve('request','Audit HR','country_hr_director')).rejects.toThrow('Approval save refused');
  expect(salary).toBe(999);
 });
 it('reapplies a stale full employee snapshot even when the request is already rejected',async()=>{
  const record={id:'request',employee_id:'worker',employee_name:'Audit worker',country_code:'ET',requested_by:'Different maker',status:'rejected',required_approvers:[],diffs:[],full_proposed_employee:{salary:999},reason:'Audit'};
  mocks.from.mockImplementation((table:string)=>table==='employees'?{select:()=>({eq:()=>({maybeSingle:async()=>({data:{role:'picker'},error:null})})})}:{select:()=>({eq:()=>({single:async()=>({data:record,error:null})})}),update:()=>({eq:async()=>({error:null})})});
  mocks.employeeUpdate.mockResolvedValue({});
  await employeeChangesService.approve('request','Audit HR','country_hr_director');
  expect(mocks.employeeUpdate).toHaveBeenCalledWith('worker',{salary:999});
 });
 it('returns an unrelated payroll month when the requested month is outside the first 25 runs',async()=>{
  const page=Array.from({length:25},(_,i)=>({id:'run-'+i,period:'October 2026',country_code:'ET',status:'approved'}));
  const limit=vi.fn(async()=>({data:page,error:null}));const query={eq:vi.fn(),order:vi.fn(),limit};query.eq.mockReturnValue(query);query.order.mockReturnValue(query);
  mocks.from.mockReturnValue({select:()=>query});
  expect((await payrollRunsService.getLatestRun('warehouse','ET','November 2026'))?.period).toBe('October 2026');
  expect(limit).toHaveBeenCalledWith(25);
 });
});
