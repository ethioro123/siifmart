import { supabase } from '../lib/supabase';
import type { PayrollRun, PayrollRunStatus } from '../types/payroll-run';
const columns = 'id,period,country_code,site_id,employee_count,currency,total_gross_salaries,total_bonuses,total_deductions,total_net_payout,status,initiated_by,initiated_by_role,initiated_by_id,initiated_at,regional_attested_by,regional_attested_by_id,regional_attested_by_role,regional_attested_at,regional_notes,hr_approved_by,hr_approved_by_id,hr_approved_by_role,hr_approved_at,hr_notes,finance_approved_by,finance_approved_by_id,finance_approved_by_role,finance_approved_at,finance_notes,disbursed_by,disbursed_at,expense_id,settlement_reference,rejection_reason,rejected_by,rejected_by_role,rejected_at,created_at,updated_at';
const mapDBToPayrollRun = (row: any): PayrollRun => ({
  id: row.id,
  initiatedById: row.initiated_by_id, hrApprovedById: row.hr_approved_by_id, financeApprovedById: row.finance_approved_by_id, settlementReference: row.settlement_reference,
  period: row.period || '',
  countryCode: (row.country_code || 'ET').toUpperCase(),
  siteId: row.site_id || undefined,
  employeeCount: Number(row.employee_count) || 0,
  currency: row.currency || 'ETB',
  totalGrossSalaries: Number(row.total_gross_salaries) || 0,
  totalBonuses: Number(row.total_bonuses) || 0,
  totalDeductions: Number(row.total_deductions) || 0,
  totalNetPayout: Number(row.total_net_payout) || 0,
  status: (row.status as PayrollRunStatus) || 'draft',
  initiatedBy: row.initiated_by || '',
  initiatedByRole: row.initiated_by_role || '',
  initiatedAt: row.initiated_at || new Date().toISOString(),
  regionalAttestedBy: row.regional_attested_by || undefined,
  regionalAttestedById: row.regional_attested_by_id || undefined,
  regionalAttestedByRole: row.regional_attested_by_role || undefined,
  regionalAttestedAt: row.regional_attested_at || undefined,
  regionalNotes: row.regional_notes || undefined,
  hrApprovedBy: row.hr_approved_by || undefined,
  hrApprovedByRole: row.hr_approved_by_role || undefined,
  hrApprovedAt: row.hr_approved_at || undefined,
  hrNotes: row.hr_notes || undefined,
  financeApprovedBy: row.finance_approved_by || undefined,
  financeApprovedByRole: row.finance_approved_by_role || undefined,
  financeApprovedAt: row.finance_approved_at || undefined,
  financeNotes: row.finance_notes || undefined,
  disbursedBy: row.disbursed_by || undefined,
  disbursedAt: row.disbursed_at || undefined,
  expenseId: row.expense_id || undefined,
  rejectionReason: row.rejection_reason || undefined,
  rejectedBy: row.rejected_by || undefined,
  rejectedByRole: row.rejected_by_role || undefined,
  rejectedAt: row.rejected_at || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});


async function command(id: string, action: string, notes?: string, reference?: string): Promise<PayrollRun> {
    const { data, error } = await supabase.rpc('payroll_command', { p_run: id, p_action: action, p_notes: notes || null, p_reference: reference || null });
    if (error) throw error;
    if (data?.id !== id) throw new Error('Payroll command was not confirmed');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('payroll:updated'));
    return mapDBToPayrollRun(data);
}
export const payrollRunsService = {
    async getById(id: string): Promise<PayrollRun | null> {
        const { data, error } = await supabase.from('payroll_runs').select(columns).eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? mapDBToPayrollRun(data) : null;
    },
    async pendingAttestation(country: string, site: string, page: number): Promise<PayrollRun[]> {
        const { data, error } = await supabase.from('payroll_runs').select(columns).eq('country_code', country).eq('site_id', site).is('regional_attested_at', null)
            .not('status', 'in', '(draft,rejected,prepared,disbursed)').order('created_at').order('id').range((page - 1) * 25, page * 25 - 1);
        if (error) throw error;
        return (data || []).map(mapDBToPayrollRun);
    },
    async getAll(siteId?: string, countryCode?: string, limit = 25): Promise<PayrollRun[]> {
        let query = supabase.from('payroll_runs').select(columns);
        if (siteId && siteId !== 'ALL') query = query.eq('site_id', siteId);
        if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());
        const { data, error } = await query.order('created_at', { ascending: false }).order('id').limit(Math.min(Math.max(limit, 1), 100));
        if (error) throw error;
        return (data || []).map(mapDBToPayrollRun);
    },
    async getLatestRun(siteId?: string, countryCode?: string, period?: string): Promise<PayrollRun | null> {
        let query = supabase.from('payroll_runs').select(columns);
        if (siteId && siteId !== 'ALL') query = query.eq('site_id', siteId);
        if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());
        if (period) query = query.eq('period', period).neq('status', 'rejected');
        const { data, error } = await query.order('created_at', { ascending: false }).order('id').limit(1).maybeSingle();
        if (error) throw error;
        return data ? mapDBToPayrollRun(data) : null;
    },
    async create(run: Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayrollRun> {
        if (!run.siteId) throw new Error('Select a payroll workplace');
        const { data, error } = await supabase.rpc('create_payroll_run', { p_id: crypto.randomUUID(), p_period: run.period, p_site: run.siteId, p_country: run.countryCode.toUpperCase(), p_bonus: run.totalBonuses, p_deductions: run.totalDeductions });
        if (error) throw error;
        if (!data?.id) throw new Error('Payroll preparation was not confirmed');
        return mapDBToPayrollRun(data);
    },
    signAsHR(id: string, _name: string, _role: string, notes?: string) { return command(id, 'hr', notes); },
    signAsFinance(id: string, _name: string, _role: string, notes?: string) { return command(id, 'finance', notes); },
    async attestAsRegionalHR(id: string, notes?: string) {
        const { data, error } = await supabase.rpc('attest_payroll_regional_hr', { p_run_id: id, p_notes: notes || null });
        if (error) throw error;
        if (data?.id !== id) throw new Error('Regional attestation was not confirmed');
        return mapDBToPayrollRun(data);
    },
    prepare(id: string) { return command(id, 'prepare'); },
    disburse(id: string, _name: string, reference?: string, evidence?: string) {
        if (!reference || reference.trim().length < 6 || !evidence || evidence.trim().length < 10) throw new Error('Completed payment reference and settlement evidence required');
        return command(id, 'settle', evidence, reference);
    },
    reject(id: string, _name: string, _role: string, reason: string) { return command(id, 'reject', reason); },
    _clearCache() { if (typeof localStorage !== 'undefined') localStorage.removeItem('siifmart_payroll_runs_backup'); }
};
