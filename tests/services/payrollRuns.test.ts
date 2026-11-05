import { beforeEach, expect, it, vi } from 'vitest';
import type { PayrollRun } from '../../types';
const mock = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: mock }));
import { payrollRunsService } from '../../services/payroll-runs.service';
beforeEach(() => vi.clearAllMocks());
it('prepares the server roster using only proposal adjustments and scope, not client salary totals or identity', async () => {
 mock.rpc.mockResolvedValue({ data: { id: 'server-run', country_code: 'ET', status: 'pending_verification', total_gross_salaries: 500, total_net_payout: 510, employee_count: 2, initiated_by: 'Authenticated maker' }, error: null });
 const saved = await payrollRunsService.create({ period: 'November 2026', siteId: 'warehouse', countryCode: 'ET', totalBonuses: 10, totalDeductions: 0, totalGrossSalaries: 999999, totalNetPayout: 999999, initiatedBy: 'Forged maker' } as PayrollRun);
 expect(saved.totalGrossSalaries).toBe(500); expect(saved.initiatedBy).toBe('Authenticated maker');
 expect(mock.rpc).toHaveBeenCalledWith('create_payroll_run', { p_id: expect.any(String), p_period: 'November 2026', p_site: 'warehouse', p_country: 'ET', p_bonus: 10, p_deductions: 0 });
 expect(mock.from).not.toHaveBeenCalled();
});
it('requires a workplace for payroll preparation', async () => { await expect(payrollRunsService.create({ countryCode: 'ET' } as PayrollRun)).rejects.toThrow('workplace'); expect(mock.rpc).not.toHaveBeenCalled(); });
it.each(['hr', 'finance'] as const)('sends %s approval without trusting a supplied name or role', async action => {
 mock.rpc.mockResolvedValue({ data: { id: 'run', status: 'pending_finance', hr_approved_by_id: 'authenticated-hr' }, error: null });
 const save = action === 'hr' ? payrollRunsService.signAsHR : payrollRunsService.signAsFinance;
 const run = await save('run', 'Forged identity', 'group_ceo', 'Evidence reviewed');
 expect(run.hrApprovedById).toBe('authenticated-hr');
 expect(mock.rpc).toHaveBeenCalledWith('payroll_command', { p_run: 'run', p_action: action, p_notes: 'Evidence reviewed', p_reference: null });
});
it('propagates rejected dual-control decisions', async () => {
 mock.rpc.mockResolvedValue({ data: null, error: new Error('Distinct Finance authority required') });
 await expect(payrollRunsService.signAsFinance('run', 'Alias', 'group_ceo')).rejects.toThrow('Distinct Finance');
});
it('prepares an unpaid expense rather than calling settlement', async () => {
 mock.rpc.mockResolvedValue({ data: { id: 'run', status: 'prepared', expense_id: 'expense' }, error: null });
 expect((await payrollRunsService.prepare('run')).status).toBe('prepared');
 expect(mock.rpc).toHaveBeenCalledWith('payroll_command', { p_run: 'run', p_action: 'prepare', p_notes: null, p_reference: null });
});
it('refuses disbursement without completed payment evidence', () => {
 expect(() => payrollRunsService.disburse('run', 'Finance')).toThrow('Completed payment reference'); expect(mock.rpc).not.toHaveBeenCalled();
});
it('records settlement through the trusted command and preserves the server expense association', async () => {
 mock.rpc.mockResolvedValue({ data: { id: 'run', status: 'disbursed', expense_id: 'trusted-expense', settlement_reference: 'BANK-REF' }, error: null });
 const run = await payrollRunsService.disburse('run', 'Ignored caller name', 'BANK-REF', 'Bank statement independently checked');
 expect(run.expenseId).toBe('trusted-expense'); expect(run.settlementReference).toBe('BANK-REF');
 expect(mock.rpc).toHaveBeenCalledWith('payroll_command', { p_run: 'run', p_action: 'settle', p_notes: 'Bank statement independently checked', p_reference: 'BANK-REF' });
});
it('uses the deployed regional attestation command and rejects missing confirmation', async () => {
 mock.rpc.mockResolvedValue({ data: null, error: new Error('Out of regional scope') });
 await expect(payrollRunsService.attestAsRegionalHR('run', 'Roster reviewed')).rejects.toThrow('Out of regional scope');
 expect(mock.rpc).toHaveBeenCalledWith('attest_payroll_regional_hr', { p_run_id: 'run', p_notes: 'Roster reviewed' });
});
