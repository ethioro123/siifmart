// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Employee } from '../../types';
const mock=vi.hoisted(()=>({latest:vi.fn(),disburse:vi.fn(),process:vi.fn(),notify:vi.fn(),close:vi.fn(),from:vi.fn()}));
vi.mock('../../components/financials/FinanceContext',()=>({useFinance:()=>({isPayrollModalOpen:true,setIsPayrollModalOpen:mock.close,employees:[],totalSalaries:150,totalBonuses:0,user:{id:'finance',name:'Finance',role:'country_finance_director'},currencySymbol:'ETB',effectiveCountry:'ET',activeSite:{id:'warehouse'},addNotification:mock.notify,processPayroll:mock.process})}));
vi.mock('../../components/Modal',()=>({default:({children}:{children:React.ReactNode})=><div>{children}</div>}));
vi.mock('../../services/payroll-runs.service',()=>({payrollRunsService:{getLatestRun:mock.latest,disburse:mock.disburse}}));
vi.mock('../../lib/supabase',()=>({supabase:{from:mock.from}}));
vi.mock('../../services/supabase.service',()=>({productsService:{},suppliersService:{}}));
vi.mock('@tanstack/react-query',()=>({useQueryClient:()=>({setQueryData:vi.fn()})}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),warn:vi.fn(),debug:vi.fn()}}));
import { PayrollModal } from '../../components/financials/PayrollModal';
import { useFinanceActions } from '../../contexts/hooks/useFinanceActions';
beforeEach(()=>vi.clearAllMocks());afterEach(cleanup);
it('marks the run disbursed before the following payroll operation fails',async()=>{
 let persistedStatus='approved';
 mock.latest.mockResolvedValue({id:'run',period:'November 2026',countryCode:'ET',status:'approved',hrApprovedBy:'HR',financeApprovedBy:'Finance',totalNetPayout:100});
 mock.disburse.mockImplementation(async()=>{persistedStatus='disbursed';});
 mock.process.mockRejectedValue(new Error('Expense save unavailable'));
 render(<PayrollModal/>);
 const button=await screen.findByRole('button',{name:'Disburse Payout'});
 fireEvent.click(button);
 await waitFor(()=>expect(mock.notify).toHaveBeenCalledWith('alert','Expense save unavailable'));
 expect(persistedStatus).toBe('disbursed');
 expect(mock.disburse).toHaveBeenCalledWith('run','Finance');
 expect(mock.process).toHaveBeenCalledWith('warehouse','Finance');
});
it('prepares payroll as a local Paid expense without persisting a financial record',async()=>{
 const setExpenses=vi.fn();
 const employee={id:'worker',name:'Audit worker',siteId:'warehouse',status:'Active',salary:100} as Employee;
 const {result}=renderHook(()=>useFinanceActions({activeSiteId:'warehouse',activeSite:{id:'warehouse'},products:[],allProducts:[],employees:[employee],setProducts:vi.fn(),setExpenses,setSuppliers:vi.fn(),addNotification:vi.fn(),logSystemEvent:vi.fn(),queries:{}}));
 await act(async()=>{await result.current.processPayroll('warehouse','Finance');});
 expect(mock.from).not.toHaveBeenCalled();
 const apply=setExpenses.mock.calls[0][0];
 expect(apply([])[0]).toMatchObject({amount:100,status:'Paid',category:'Salaries'});
});
