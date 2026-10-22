import { supabase } from '../lib/supabase';
import type { PayrollRun, PayrollRunStatus } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_KEY = 'siifmart_payroll_runs_backup';

// Security Cleanup: Purge any legacy unencrypted sensitive payroll records from browser storage
if (typeof localStorage !== 'undefined') {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // Safe ignore
  }
}

// In-memory session cache only (transient read cache, never written to disk)
let inMemoryBackup: PayrollRun[] = [];

const saveLocalBackup = (runs: PayrollRun[]): void => {
  const map = new Map<string, PayrollRun>();
  for (const r of inMemoryBackup) {
    map.set(r.id, r);
  }
  for (const r of runs) {
    map.set(r.id, r);
  }
  inMemoryBackup = Array.from(map.values());
};


const mapDBToPayrollRun = (row: any): PayrollRun => ({
  id: row.id,
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

export const payrollRunsService = {
  async getAll(siteId?: string, countryCode?: string, limit: number = 25): Promise<PayrollRun[]> {
    try {
      // RULE 10: 25-record shelf limit
      let query = supabase.from('payroll_runs').select('*');
      if (siteId && siteId !== 'ALL') query = query.eq('site_id', siteId);
      if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());

      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;

      const mapped = (data || []).map(mapDBToPayrollRun);
      saveLocalBackup(mapped);
      return mapped;
    } catch (error) {
      logger.error('payrollRunsService', 'Remote fetch failed for payroll runs:', error as Error);
      let results = inMemoryBackup;
      if (siteId && siteId !== 'ALL') results = results.filter(r => !r.siteId || r.siteId === siteId);
      if (countryCode) results = results.filter(r => r.countryCode.toUpperCase() === countryCode.toUpperCase());
      return results.sort((a, b) => new Date(b.initiatedAt || 0).getTime() - new Date(a.initiatedAt || 0).getTime());
    }
  },

  async getLatestRun(siteId?: string, countryCode?: string, period?: string): Promise<PayrollRun | null> {
    const all = await this.getAll(siteId, countryCode);
    if (period) {
      const match = all.find(r => r.period.toLowerCase() === period.toLowerCase() && r.status !== 'rejected');
      if (match) return match;
    }
    return all[0] || null;
  },

  async create(run: Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayrollRun> {
    const country = (run.countryCode || 'ET').toUpperCase();
    const id = `PAYROLL-${Date.now()}-${country}`;
    const now = new Date().toISOString();

    const newRecord: PayrollRun = {
      ...run,
      id,
      countryCode: country,
      initiatedAt: run.initiatedAt || now,
      createdAt: now,
      updatedAt: now
    };

    const dbRecord = {
      id,
      period: newRecord.period,
      country_code: country,
      site_id: newRecord.siteId || null,
      employee_count: newRecord.employeeCount,
      currency: newRecord.currency,
      total_gross_salaries: newRecord.totalGrossSalaries,
      total_bonuses: newRecord.totalBonuses,
      total_deductions: newRecord.totalDeductions,
      total_net_payout: newRecord.totalNetPayout,
      status: newRecord.status,
      initiated_by: newRecord.initiatedBy,
      initiated_by_role: newRecord.initiatedByRole,
      initiated_at: newRecord.initiatedAt,
      hr_approved_by: newRecord.hrApprovedBy || null,
      hr_approved_by_role: newRecord.hrApprovedByRole || null,
      hr_approved_at: newRecord.hrApprovedAt || null,
      hr_notes: newRecord.hrNotes || null,
      finance_approved_by: newRecord.financeApprovedBy || null,
      finance_approved_by_role: newRecord.financeApprovedByRole || null,
      finance_approved_at: newRecord.financeApprovedAt || null,
      finance_notes: newRecord.financeNotes || null,
      created_at: now,
      updated_at: now
    };

    const { error } = await supabase.from('payroll_runs').insert(dbRecord);
    if (error) {
      logger.error('payrollRunsService', 'Remote create payroll run failed:', error as Error);
      throw new Error(`Failed to create payroll run on server: ${error.message || 'Database error'}`);
    }

    saveLocalBackup([newRecord]);

    await systemLogsService.create({
      user_name: newRecord.initiatedBy,
      action: 'PAYROLL_RUN_INITIATED',
      details: `Payroll run initialized for ${newRecord.period} (${newRecord.currency} ${newRecord.totalNetPayout.toLocaleString()}) by ${newRecord.initiatedBy} [${newRecord.initiatedByRole}]`,
      module: 'Payroll'
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('payroll:updated', { detail: newRecord }));
    }

    return newRecord;
  },

  async signAsHR(
    runId: string,
    signatoryName: string,
    signatoryRole: string,
    notes?: string
  ): Promise<PayrollRun> {
    const runs = await this.getAll();
    const target = runs.find(r => r.id === runId);
    if (!target) throw new Error(`Payroll run ${runId} not found`);

    // Zero-Trust Anti-Self-Approval
    if (
      target.financeApprovedBy &&
      target.financeApprovedBy.trim().toLowerCase() === signatoryName.trim().toLowerCase() &&
      signatoryRole !== 'group_ceo'
    ) {
      throw new Error(
        'Zero-Trust 4-Eyes Violation: The same person cannot certify as HR and authorize as Finance. Dual control requires distinct department actors.'
      );
    }

    const now = new Date().toISOString();
    const isFinanceApproved = Boolean(target.financeApprovedBy);
    const nextStatus: PayrollRunStatus = isFinanceApproved ? 'approved' : 'pending_finance';

    const updated: PayrollRun = {
      ...target,
      hrApprovedBy: signatoryName,
      hrApprovedByRole: signatoryRole,
      hrApprovedAt: now,
      hrNotes: notes || target.hrNotes,
      status: nextStatus,
      updatedAt: now
    };

    const { error } = await supabase
      .from('payroll_runs')
      .update({
        hr_approved_by: signatoryName,
        hr_approved_by_role: signatoryRole,
        hr_approved_at: now,
        hr_notes: notes || target.hrNotes || null,
        status: nextStatus,
        updated_at: now
      })
      .eq('id', runId);
    if (error) {
      logger.error('payrollRunsService', 'Remote signAsHR failed:', error as Error);
      throw new Error(`Failed to record HR certification on server: ${error.message || 'Database error'}`);
    }

    saveLocalBackup([updated]);

    await systemLogsService.create({
      user_name: signatoryName,
      action: 'PAYROLL_HR_CERTIFIED',
      details: `HR certified payroll run ${target.period} (${target.employeeCount} staff). Signed by ${signatoryName} [${signatoryRole}]. Next status: ${nextStatus}`,
      module: 'Payroll'
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('payroll:updated', { detail: updated }));
    }

    return updated;
  },

  async attestAsRegionalHR(
    runId: string,
    notes?: string
  ): Promise<PayrollRun> {
    const runs = await this.getAll();
    const target = runs.find(r => r.id === runId);
    if (!target) throw new Error(`Payroll run ${runId} not found`);

    const now = new Date().toISOString();
    const { data, error } = await supabase.rpc('attest_payroll_regional_hr', {
      p_run_id: runId,
      p_notes: notes || null
    });
    if (error) {
      logger.error('payrollRunsService', 'Remote attestAsRegionalHR failed:', error as Error);
      throw new Error(`Failed to record Regional HR attestation on server: ${error.message || 'Database error'}`);
    }
    if (!data) throw new Error('Failed to record Regional HR attestation: no record returned by server');
    const updated = mapDBToPayrollRun(Array.isArray(data) ? data[0] : data);

    saveLocalBackup([updated]);

    await systemLogsService.create({
      user_name: updated.regionalAttestedBy || 'Regional HR',
      action: 'PAYROLL_REGIONAL_HR_ATTESTED',
      details: `Regional HR attested payroll roster for ${target.period} (${target.employeeCount} staff). Signed by ${updated.regionalAttestedBy} [${updated.regionalAttestedByRole}].`,
      module: 'Payroll'
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('payroll:updated', { detail: updated }));
    }

    return updated;
  },

  async signAsFinance(
    runId: string,
    signatoryName: string,
    signatoryRole: string,
    notes?: string
  ): Promise<PayrollRun> {
    const runs = await this.getAll();
    const target = runs.find(r => r.id === runId);
    if (!target) throw new Error(`Payroll run ${runId} not found`);

    // Zero-Trust Anti-Self-Approval
    if (
      target.hrApprovedBy &&
      target.hrApprovedBy.trim().toLowerCase() === signatoryName.trim().toLowerCase() &&
      signatoryRole !== 'group_ceo'
    ) {
      throw new Error(
        'Zero-Trust 4-Eyes Violation: The same person cannot certify as HR and authorize as Finance. Dual control requires distinct department actors.'
      );
    }

    const now = new Date().toISOString();
    const isHrApproved = Boolean(target.hrApprovedBy);
    const nextStatus: PayrollRunStatus = isHrApproved ? 'approved' : 'pending_hr';

    const updated: PayrollRun = {
      ...target,
      financeApprovedBy: signatoryName,
      financeApprovedByRole: signatoryRole,
      financeApprovedAt: now,
      financeNotes: notes || target.financeNotes,
      status: nextStatus,
      updatedAt: now
    };

    const { error } = await supabase
      .from('payroll_runs')
      .update({
        finance_approved_by: signatoryName,
        finance_approved_by_role: signatoryRole,
        finance_approved_at: now,
        finance_notes: notes || target.financeNotes || null,
        status: nextStatus,
        updated_at: now
      })
      .eq('id', runId);
    if (error) {
      logger.error('payrollRunsService', 'Remote signAsFinance failed:', error as Error);
      throw new Error(`Failed to record Finance authorization on server: ${error.message || 'Database error'}`);
    }

    saveLocalBackup([updated]);

    await systemLogsService.create({
      user_name: signatoryName,
      action: 'PAYROLL_FINANCE_AUTHORIZED',
      details: `Finance authorized payroll run ${target.period} (${target.currency} ${target.totalNetPayout.toLocaleString()}). Signed by ${signatoryName} [${signatoryRole}]. Next status: ${nextStatus}`,
      module: 'Payroll'
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('payroll:updated', { detail: updated }));
    }

    return updated;
  },

  async disburse(runId: string, disbursedBy: string, expenseId?: string): Promise<PayrollRun> {
    const runs = await this.getAll();
    const target = runs.find(r => r.id === runId);
    if (!target) throw new Error(`Payroll run ${runId} not found`);

    // Strict zero-trust hard-lock: MUST have dual approval
    if (!target.hrApprovedBy || !target.financeApprovedBy) {
      throw new Error(
        'Zero-Trust Security Enforcement: Cannot disburse payroll without complete dual approval. Both HR verification and Finance authorization are mandatory.'
      );
    }

    const now = new Date().toISOString();
    const updated: PayrollRun = {
      ...target,
      disbursedBy,
      disbursedAt: now,
      expenseId: expenseId || target.expenseId,
      status: 'disbursed',
      updatedAt: now
    };

    const { error } = await supabase
      .from('payroll_runs')
      .update({
        disbursed_by: disbursedBy,
        disbursed_at: now,
        expense_id: expenseId || target.expenseId || null,
        status: 'disbursed',
        updated_at: now
      })
      .eq('id', runId);
    if (error) {
      logger.error('payrollRunsService', 'Remote disburse failed:', error as Error);
      throw new Error(`Failed to record payroll disbursement on server: ${error.message || 'Database error'}`);
    }

    saveLocalBackup([updated]);

    await systemLogsService.create({
      user_name: disbursedBy,
      action: 'PAYROLL_FUNDS_DISBURSED',
      details: `Final payroll payout disbursed for ${target.period}: ${target.currency} ${target.totalNetPayout.toLocaleString()} to ${target.employeeCount} staff. Executed by ${disbursedBy}. Dual sign-offs: HR (${target.hrApprovedBy}) & Finance (${target.financeApprovedBy})`,
      module: 'Payroll'
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('payroll:disbursed', { detail: updated }));
      window.dispatchEvent(new CustomEvent('payroll:updated', { detail: updated }));
    }

    return updated;
  },

  async reject(
    runId: string,
    rejectedBy: string,
    role: string,
    reason: string
  ): Promise<PayrollRun> {
    const runs = await this.getAll();
    const target = runs.find(r => r.id === runId);
    if (!target) throw new Error(`Payroll run ${runId} not found`);

    const now = new Date().toISOString();
    const updated: PayrollRun = {
      ...target,
      status: 'rejected',
      rejectedBy,
      rejectedByRole: role,
      rejectedAt: now,
      rejectionReason: reason,
      updatedAt: now
    };

    const { error } = await supabase
      .from('payroll_runs')
      .update({
        status: 'rejected',
        rejected_by: rejectedBy,
        rejected_by_role: role,
        rejected_at: now,
        rejection_reason: reason,
        updated_at: now
      })
      .eq('id', runId);
    if (error) {
      logger.error('payrollRunsService', 'Remote reject failed:', error as Error);
      throw new Error(`Failed to record payroll rejection on server: ${error.message || 'Database error'}`);
    }

    saveLocalBackup([updated]);

    await systemLogsService.create({
      user_name: rejectedBy,
      action: 'PAYROLL_RUN_REJECTED',
      details: `Payroll run ${target.period} was rejected by ${rejectedBy} [${role}]. Reason: ${reason}`,
      module: 'Payroll'
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('payroll:updated', { detail: updated }));
    }

    return updated;
  },

  _clearCache(): void {
    inMemoryBackup = [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {
        // Safe ignore
      }
    }
  }
};

