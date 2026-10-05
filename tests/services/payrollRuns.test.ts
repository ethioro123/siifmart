import { describe, it, expect, beforeEach, vi } from 'vitest';
import { payrollRunsService } from '../../services/payroll-runs.service';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Offline mock' } })
        }),
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Offline mock' } })
        })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Offline mock' } })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Offline mock' } })
          })
        })
      })
    })
  }
}));

describe('Zero-Trust Multi-Department Payroll Approval Service', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    (payrollRunsService as any)._clearCache();
    vi.restoreAllMocks();
  });

  it('initiates a new payroll run with pending status', async () => {
    const run = await payrollRunsService.create({
      period: 'October 2026',
      countryCode: 'ET',
      siteId: 'SITE-0001',
      employeeCount: 15,
      currency: 'ETB',
      totalGrossSalaries: 180000,
      totalBonuses: 12000,
      totalDeductions: 0,
      totalNetPayout: 192000,
      status: 'pending_verification',
      initiatedBy: 'HR Officer Martha',
      initiatedByRole: 'hr'
    });

    expect(run.id).toContain('PAYROLL-');
    expect(run.period).toBe('October 2026');
    expect(run.countryCode).toBe('ET');
    expect(run.status).toBe('pending_verification');
    expect(run.hrApprovedBy).toBeUndefined();
    expect(run.financeApprovedBy).toBeUndefined();
  });

  it('allows HR to certify first, advancing status to pending_finance', async () => {
    const run = await payrollRunsService.create({
      period: 'October 2026',
      countryCode: 'ET',
      employeeCount: 20,
      currency: 'ETB',
      totalGrossSalaries: 240000,
      totalBonuses: 0,
      totalDeductions: 0,
      totalNetPayout: 240000,
      status: 'pending_verification',
      initiatedBy: 'Admin',
      initiatedByRole: 'admin'
    });

    const hrSigned = await payrollRunsService.signAsHR(
      run.id,
      'Sarah Jenkins',
      'hr_manager',
      'Audited Bole Store headcount and October clock-in records.'
    );

    expect(hrSigned.hrApprovedBy).toBe('Sarah Jenkins');
    expect(hrSigned.hrApprovedByRole).toBe('hr_manager');
    expect(hrSigned.hrApprovedAt).toBeDefined();
    expect(hrSigned.hrNotes).toBe('Audited Bole Store headcount and October clock-in records.');
    expect(hrSigned.status).toBe('pending_finance');
    expect(hrSigned.financeApprovedBy).toBeUndefined();
  });

  it('allows Finance to authorize after HR, transitioning status to approved', async () => {
    const run = await payrollRunsService.create({
      period: 'October 2026',
      countryCode: 'KE',
      employeeCount: 10,
      currency: 'KSh',
      totalGrossSalaries: 350000,
      totalBonuses: 15000,
      totalDeductions: 0,
      totalNetPayout: 365000,
      status: 'pending_verification',
      initiatedBy: 'HR Lead Dennis',
      initiatedByRole: 'hr'
    });

    await payrollRunsService.signAsHR(run.id, 'Dennis Wanjiku', 'hr');
    const fullyApproved = await payrollRunsService.signAsFinance(
      run.id,
      'Peter Omondi',
      'finance_manager',
      'KCB Operating balance confirmed and statutory withholdings verified.'
    );

    expect(fullyApproved.hrApprovedBy).toBe('Dennis Wanjiku');
    expect(fullyApproved.financeApprovedBy).toBe('Peter Omondi');
    expect(fullyApproved.status).toBe('approved');
  });

  it('STRICTLY ENFORCES anti-self-approval under 4-Eyes Zero-Trust', async () => {
    const run = await payrollRunsService.create({
      period: 'October 2026',
      countryCode: 'ET',
      employeeCount: 5,
      currency: 'ETB',
      totalGrossSalaries: 60000,
      totalBonuses: 0,
      totalDeductions: 0,
      totalNetPayout: 60000,
      status: 'pending_verification',
      initiatedBy: 'HR',
      initiatedByRole: 'hr'
    });

    // Alice Jenkins signs as HR
    await payrollRunsService.signAsHR(run.id, 'Alice Jenkins', 'hr_manager');

    // Alice Jenkins tries to also authorize as Finance
    await expect(
      payrollRunsService.signAsFinance(run.id, 'Alice Jenkins', 'finance_manager')
    ).rejects.toThrow(/Zero-Trust 4-Eyes Violation/);
  });

  it('BLOCKS payout disbursement if missing HR or Finance authorization', async () => {
    const run = await payrollRunsService.create({
      period: 'October 2026',
      countryCode: 'ET',
      employeeCount: 8,
      currency: 'ETB',
      totalGrossSalaries: 96000,
      totalBonuses: 0,
      totalDeductions: 0,
      totalNetPayout: 96000,
      status: 'pending_verification',
      initiatedBy: 'Finance Lead',
      initiatedByRole: 'finance_manager'
    });

    // Finance signed, but HR has not signed
    await payrollRunsService.signAsFinance(run.id, 'Kebede Michael', 'finance_manager');

    // Attempt to disburse
    await expect(
      payrollRunsService.disburse(run.id, 'Kebede Michael')
    ).rejects.toThrow(/Zero-Trust Security Enforcement: Cannot disburse payroll without complete dual approval/);
  });

  it('disburses successfully only when dual approval is complete', async () => {
    const run = await payrollRunsService.create({
      period: 'October 2026',
      countryCode: 'ET',
      employeeCount: 12,
      currency: 'ETB',
      totalGrossSalaries: 144000,
      totalBonuses: 0,
      totalDeductions: 0,
      totalNetPayout: 144000,
      status: 'pending_verification',
      initiatedBy: 'Admin',
      initiatedByRole: 'admin'
    });

    await payrollRunsService.signAsHR(run.id, 'HR Officer Mary', 'hr');
    await payrollRunsService.signAsFinance(run.id, 'Finance Manager John', 'finance_manager');

    const disbursed = await payrollRunsService.disburse(run.id, 'Finance Manager John', 'EXP-PAYROLL-01');

    expect(disbursed.status).toBe('disbursed');
    expect(disbursed.disbursedBy).toBe('Finance Manager John');
    expect(disbursed.disbursedAt).toBeDefined();
    expect(disbursed.expenseId).toBe('EXP-PAYROLL-01');
  });

  it('handles batch rejection with mandatory audit reason', async () => {
    const run = await payrollRunsService.create({
      period: 'October 2026',
      countryCode: 'KE',
      employeeCount: 14,
      currency: 'KSh',
      totalGrossSalaries: 400000,
      totalBonuses: 0,
      totalDeductions: 0,
      totalNetPayout: 400000,
      status: 'pending_verification',
      initiatedBy: 'HR Officer',
      initiatedByRole: 'hr'
    });

    const rejected = await payrollRunsService.reject(
      run.id,
      'Auditor Samuel',
      'auditor',
      'Overtime discrepancies detected on Mombasa dark store shift punch logs.'
    );

    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectedBy).toBe('Auditor Samuel');
    expect(rejected.rejectionReason).toContain('Overtime discrepancies');
  });

  it('enforces multi-country tenant isolation for payroll runs', async () => {
    await payrollRunsService.create({
      period: 'October 2026',
      countryCode: 'ET',
      employeeCount: 20,
      currency: 'ETB',
      totalGrossSalaries: 200000,
      totalBonuses: 0,
      totalDeductions: 0,
      totalNetPayout: 200000,
      status: 'pending_verification',
      initiatedBy: 'ET HR',
      initiatedByRole: 'hr'
    });

    await payrollRunsService.create({
      period: 'October 2026',
      countryCode: 'KE',
      employeeCount: 15,
      currency: 'KSh',
      totalGrossSalaries: 500000,
      totalBonuses: 0,
      totalDeductions: 0,
      totalNetPayout: 500000,
      status: 'pending_verification',
      initiatedBy: 'KE HR',
      initiatedByRole: 'hr'
    });

    const etRuns = await payrollRunsService.getAll(undefined, 'ET');
    const keRuns = await payrollRunsService.getAll(undefined, 'KE');

    expect(etRuns.every(r => r.countryCode === 'ET')).toBe(true);
    expect(keRuns.every(r => r.countryCode === 'KE')).toBe(true);
    expect(etRuns.some(r => r.currency === 'KSh')).toBe(false);
    expect(keRuns.some(r => r.currency === 'ETB')).toBe(false);
  });
});
