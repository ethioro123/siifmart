vi.mock('../../services/system-logs.service', () => ({ systemLogsService: { create: vi.fn().mockResolvedValue({ id: 'audit' }) } }));
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recruitmentService } from '../../services/recruitment.service';
import { evaluateCandidateHiringRoute } from '../../services/recruitment-delegation';
import { headcountQuotaService } from '../../services/headcountQuota.service';

let inMemoryCandidateDb: any[] = [];
let inMemoryQuotaReqDb: any[] = [];
let inMemoryQuotaConfig: any[] = [];
let inMemoryEmployees: any[] = [];

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation((table: string) => {
      let currentFiltered = table === 'job_candidates' ? inMemoryCandidateDb : inMemoryQuotaReqDb;

      const createBuilder = (): any => {
        const b: any = {
          select: vi.fn((_cols?: string, options?: any) => {
            if (options?.head) {
              const countPromise: any = Promise.resolve({ count: inMemoryEmployees.length, error: null });
              countPromise.eq = vi.fn(() => countPromise);
              return countPromise;
            }
            return b;
          }),
          eq: vi.fn((col: string, val: any) => {
            if (table === 'facility_headcount_quotas') {
              const match = inMemoryQuotaConfig.find(q => q[col] === val || q.site_id === val);
              const quotaChain: any = {
                eq: vi.fn(() => quotaChain),
                maybeSingle: vi.fn().mockResolvedValue({ data: match || null, error: null })
              };
              return quotaChain;
            }
            if (table === 'country_governance_limits') {
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: { headcount_country_buffer: 10 }, error: null })
              };
            }
            if (table === 'employees') {
              const empChain: any = {
                eq: vi.fn(() => empChain),
                then: (onfulfilled: any) => Promise.resolve({ count: inMemoryEmployees.length, error: null }).then(onfulfilled)
              };
              empChain.count = inMemoryEmployees.length;
              empChain.error = null;
              return empChain;
            }
            currentFiltered = currentFiltered.filter(r => r[col] === val || r.id === val);
            return b;
          }),
          order: vi.fn(() => b),
          range: vi.fn(() => b),
          single: vi.fn(() => {
            const item = currentFiltered[0] || null;
            return Promise.resolve({ data: item, error: item ? null : { message: 'Not found' } });
          }),
          maybeSingle: vi.fn(() => {
            return Promise.resolve({ data: currentFiltered[0] || null, error: null });
          }),
          insert: vi.fn((records: any) => {
            const recArr = Array.isArray(records) ? records : [records];
            const recs = recArr.map((r: any) => ({ id: r.id || `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...r }));
            if (table === 'job_candidates') inMemoryCandidateDb.push(...recs);
            if (table === 'headcount_quota_requests') inMemoryQuotaReqDb.push(...recs);
            return Promise.resolve({ data: recs[0], error: null });
          }),
          update: vi.fn((updates: any) => {
            const updateChain: any = {
              eq: vi.fn((col: string, val: any) => {
                const list = table === 'job_candidates' ? inMemoryCandidateDb : inMemoryQuotaReqDb;
                const idx = list.findIndex(r => r[col] === val || r.id === val);
                if (idx !== -1) {
                  list[idx] = { ...list[idx], ...updates };
                }
                return updateChain;
              }),
              then: (onfulfilled: any) => Promise.resolve({ data: updates, error: null }).then(onfulfilled)
            };
            return updateChain;
          }),
          then: (onfulfilled: any) => Promise.resolve({ data: [...currentFiltered], error: null }).then(onfulfilled)
        };
        return b;
      };

      return createBuilder();
    })
  }
}));

describe('Phase 4: Delegated HR & Workforce Hiring Pipeline', () => {
  beforeEach(() => {
    inMemoryCandidateDb = [];
    inMemoryQuotaReqDb = [];
    inMemoryQuotaConfig = [];
    inMemoryEmployees = [];
  });

  describe('1. Hiring Route Evaluation (Within Quota & Bands vs Exceptions)', () => {
    it('identifies routine in-quota and in-band candidate as delegated fast-path', async () => {
      inMemoryQuotaConfig = [{ site_id: 'site-bole', approved_quota: 10, max_monthly_salary: 30000 }];
      inMemoryEmployees = [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }];

      const route = await evaluateCandidateHiringRoute({
        siteId: 'site-bole',
        role: 'stock_clerk',
        offeredSalary: 25000,
        countryCode: 'ET'
      });

      expect(route.isException).toBe(false);
      expect(route.isSalaryException).toBe(false);
      expect(route.isQuotaException).toBe(false);
      expect(route.requiredSteps).toEqual(['HR_CLEARANCE', 'HIRING_MANAGER_CONFIRM']);
      expect(route.openSlots).toBe(7);
    });

    it('identifies salary exceeding standard band as an exception requiring Finance & CMD', async () => {
      inMemoryQuotaConfig = [{ site_id: 'site-bole', approved_quota: 10, max_monthly_salary: 20000 }];
      inMemoryEmployees = [{ id: 'e1' }];

      const route = await evaluateCandidateHiringRoute({
        siteId: 'site-bole',
        role: 'stock_clerk',
        offeredSalary: 28000,
        countryCode: 'ET'
      });

      expect(route.isException).toBe(true);
      expect(route.isSalaryException).toBe(true);
      expect(route.requiredSteps).toContain('FINANCE_CLEARANCE');
      expect(route.requiredSteps).toContain('CMD_APPROVAL');
    });

    it('identifies unbudgeted headcount when facility quota is full', async () => {
      inMemoryQuotaConfig = [{ site_id: 'site-westlands', approved_quota: 3, max_monthly_salary: 25000 }];
      inMemoryEmployees = [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }];

      const route = await evaluateCandidateHiringRoute({
        siteId: 'site-westlands',
        role: 'cashier',
        offeredSalary: 22000,
        countryCode: 'KE'
      });

      expect(route.isException).toBe(true);
      expect(route.isQuotaException).toBe(true);
      expect(route.openSlots).toBe(0);
      expect(route.requiredSteps).toContain('FINANCE_CLEARANCE');
      expect(route.requiredSteps).toContain('CMD_APPROVAL');
    });
  });

  describe('2. Routine Delegated Hiring Pipeline Execution', () => {
    it('allows HR to clear credentials & band, then Store Manager to confirm offer', async () => {
      const candidate = await recruitmentService.createCandidate({
        country_code: 'ET',
        name: 'Abebe Kebede',
        email: 'abebe.kebede@siifmart.et',
        phone: '+251911223344',
        site_id: 'ET-ADD-STR-01',
        role: 'stock_clerk'
      });

      // 1. HR clearance
      const hrCleared = await recruitmentService.approveCandidateHR(
        candidate.id,
        { id: 'hr-01', name: 'Martha Hailu', role: 'regional_hr_manager' },
        'National ID & Right-to-work verified; salary within Grade 1 band.'
      );
      expect(hrCleared).toBe(true);

      // 2. Authorized Store Manager confirms offer
      const mgrConfirmed = await recruitmentService.confirmCandidateHiringManager(
        candidate.id,
        { id: 'sm-01', name: 'Dawit Store Manager', role: 'store_manager' },
        'Offer confirmed for evening shift rotation.'
      );
      expect(mgrConfirmed).toBe(true);

      const updated = (await recruitmentService.fetchCandidates('ET')).find(c => c.id === candidate.id);
      expect(updated?.stage).toBe('offered');
      expect(updated?.hr_approved_by).toBe('Martha Hailu');
      expect(updated?.hiring_manager_approved_by).toBe('Dawit Store Manager');
    });

    it('enforces Zero-Trust anti-self-approval: Candidate cannot clear themselves', async () => {
      const candidate = await recruitmentService.createCandidate({
        country_code: 'ET',
        name: 'Solomon HR',
        email: 'solomon@siifmart.et',
        phone: '+251911998877',
        site_id: 'ET-ADD-STR-01',
        role: 'cashier'
      });

      await expect(
        recruitmentService.approveCandidateHR(
          candidate.id,
          { id: 'user-solomon', name: 'Solomon HR', role: 'regional_hr_manager' },
          'Self-clearance attempt'
        )
      ).rejects.toThrow('Zero-Trust Anti-Fraud Violation');
    });
  });

  describe('3. Headcount Quota Delegation & Country Buffer (+10)', () => {
    it('enforces maker-checker on headcount quota requests: requester cannot approve', async () => {
      const quotaReq = {
        id: 'req-q-01',
        site_id: 'ET-ADD-STR-01',
        site_name: 'Addis Flagship Store',
        region_code: 'ADD',
        country_code: 'ET',
        role: 'stock_clerk',
        current_quota: 5,
        requested_quota: 10,
        increase_amount: 5,
        request_type: 'TEMPORARY_SURGE',
        reason: 'Holiday seasonal peak',
        requested_by: 'Binyam Operations',
        requested_by_role: 'regional_operations_manager',
        status: 'PENDING'
      };
      inMemoryQuotaReqDb.push(quotaReq);

      await expect(
        headcountQuotaService.reviewQuotaRequest(
          'req-q-01',
          'APPROVED',
          'Binyam Operations',
          'Self approval attempt',
          'regional_operations_manager'
        )
      ).rejects.toThrow('Maker-Checker Violation');
    });

    it('escalates requests exceeding national buffer (+10) to Group CHRO / Group CEO', async () => {
      const largeQuotaReq = {
        id: 'req-q-large',
        site_id: 'ET-ADD-STR-01',
        site_name: 'Addis Flagship Store',
        region_code: 'ADD',
        country_code: 'ET',
        role: 'picker',
        current_quota: 10,
        requested_quota: 25,
        increase_amount: 15, // > 10 buffer!
        request_type: 'PERMANENT_EXPANSION',
        reason: 'Massive warehouse capacity expansion',
        requested_by: 'Facility Lead',
        requested_by_role: 'warehouse_manager',
        status: 'PENDING'
      };
      inMemoryQuotaReqDb.push(largeQuotaReq);

      // Attempting approval by Country Managing Director should escalate
      await expect(
        headcountQuotaService.reviewQuotaRequest(
          'req-q-large',
          'APPROVED',
          'Country MD Addis',
          'Local CMD sign-off',
          'country_managing_director'
        )
      ).rejects.toThrow('Policy Escalation: Headcount expansion exceeding +10 slots escalates to Group CHRO / Group CEO.');

      // Approval by Group CEO succeeds
      const ceoSuccess = await headcountQuotaService.reviewQuotaRequest(
        'req-q-large',
        'APPROVED',
        'Group CEO Executive Office',
        'Group CEO authorized expansion',
        'group_ceo'
      );
      expect(ceoSuccess).toBe(true);
    });
  });
});
