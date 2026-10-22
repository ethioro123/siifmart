import { describe, it, expect, vi, beforeEach } from 'vitest';
import { headcountQuotaService, LEVEL_4_FRONTLINE_ROLES } from '../../services/headcountQuota.service';
import { isDirectOnboardingAuthorized } from '../../utils/employeeOnboardingGovernance';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Headcount Quota & Frontline Fast-Track Delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Level 4 Role Categorization', () => {
    it('accurately identifies operational frontline roles', () => {
      expect(LEVEL_4_FRONTLINE_ROLES).toContain('cashier');
      expect(LEVEL_4_FRONTLINE_ROLES).toContain('picker');
      expect(LEVEL_4_FRONTLINE_ROLES).toContain('packer');
      expect(LEVEL_4_FRONTLINE_ROLES).toContain('driver');
      expect(LEVEL_4_FRONTLINE_ROLES).toContain('stock_clerk');

      // Supervisory and managerial roles are excluded from Level 4
      expect(LEVEL_4_FRONTLINE_ROLES).not.toContain('store_manager');
      expect(LEVEL_4_FRONTLINE_ROLES).not.toContain('warehouse_manager');
      expect(LEVEL_4_FRONTLINE_ROLES).not.toContain('assistant_store_manager');
      expect(LEVEL_4_FRONTLINE_ROLES).not.toContain('shift_supervisor');
      expect(LEVEL_4_FRONTLINE_ROLES).not.toContain('regional_operations_manager');
    });
  });

  describe('2. Frontline Fast-Track Evaluation', () => {
    it('authorizes instant activation when pre-approved slots are open within quota', async () => {
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'facility_headcount_quotas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'quota-01',
                      site_id: 'site-westlands',
                      role: 'cashier',
                      approved_quota: 12,
                      max_monthly_salary: 25000,
                      standard_grade: 'L4-GRADE-1'
                    },
                    error: null
                  })
                })
              })
            })
          } as any;
        }

        if (table === 'employees') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    count: 8,
                    error: null
                  })
                })
              })
            })
          } as any;
        }

        return {} as any;
      });

      const result = await headcountQuotaService.evaluateFrontlineOnboarding(
        'site-westlands',
        'cashier',
        22000
      );

      expect(result.canAutoActivate).toBe(true);
      expect(result.tier).toBe('FRONTLINE_FAST_TRACK');
      expect(result.approvedQuota).toBe(12);
      expect(result.activeCount).toBe(8);
      expect(result.openSlots).toBe(4);
      expect(result.reason).toContain('Approved open slot available');
    });

    it('blocks instant activation and routes to HQ governance when facility quota is full', async () => {
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'facility_headcount_quotas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'quota-01',
                      site_id: 'site-westlands',
                      role: 'cashier',
                      approved_quota: 10,
                      max_monthly_salary: 25000
                    },
                    error: null
                  })
                })
              })
            })
          } as any;
        }

        if (table === 'employees') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    count: 10,
                    error: null
                  })
                })
              })
            })
          } as any;
        }

        return {} as any;
      });

      const result = await headcountQuotaService.evaluateFrontlineOnboarding(
        'site-westlands',
        'cashier',
        22000
      );

      expect(result.canAutoActivate).toBe(false);
      expect(result.tier).toBe('HQ_GOVERNANCE');
      expect(result.openSlots).toBe(0);
      expect(result.reason).toContain('Facility headcount quota full');
    });

    it('blocks instant activation if proposed wage exceeds corporate grade cap', async () => {
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'facility_headcount_quotas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'quota-01',
                      site_id: 'site-westlands',
                      role: 'cashier',
                      approved_quota: 12,
                      max_monthly_salary: 25000
                    },
                    error: null
                  })
                })
              })
            })
          } as any;
        }

        if (table === 'employees') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    count: 6,
                    error: null
                  })
                })
              })
            })
          } as any;
        }

        return {} as any;
      });

      const result = await headcountQuotaService.evaluateFrontlineOnboarding(
        'site-westlands',
        'cashier',
        32000 // Exceeds cap of 25000
      );

      expect(result.canAutoActivate).toBe(false);
      expect(result.tier).toBe('HQ_GOVERNANCE');
      expect(result.reason).toContain('exceeds standard grade cap');
    });

    it('strictly routes all supervisory & managerial roles to HQ governance regardless of quota', async () => {
      const result = await headcountQuotaService.evaluateFrontlineOnboarding(
        'site-westlands',
        'store_manager',
        80000
      );

      expect(result.canAutoActivate).toBe(false);
      expect(result.tier).toBe('HQ_GOVERNANCE');
      expect(result.reason).toContain('Supervisory and managerial appointments require corporate HQ committee approval');
    });
  });

  describe('3. Maker-Checker Authority Gating (isDirectOnboardingAuthorized)', () => {
    it('grants unconditional direct onboarding authority to corporate HQ & Executive roles', () => {
      expect(isDirectOnboardingAuthorized('group_ceo')).toBe(true);
      expect(isDirectOnboardingAuthorized('group_ceo')).toBe(true);
      expect(isDirectOnboardingAuthorized('country_hr_director')).toBe(true);
      expect(isDirectOnboardingAuthorized('hr_generalist')).toBe(true);
    });

    it('grants delegated direct onboarding authority to site/regional managers for Level 4 staff when quota slot is open', () => {
      expect(isDirectOnboardingAuthorized('store_manager', 'cashier', true)).toBe(true);
      expect(isDirectOnboardingAuthorized('warehouse_manager', 'picker', true)).toBe(true);
      expect(isDirectOnboardingAuthorized('regional_operations_manager', 'driver', true)).toBe(true);
      expect(isDirectOnboardingAuthorized('regional_hr_manager', 'packer', true)).toBe(true);
    });

    it('denies direct activation to site managers when quota slot is full', () => {
      expect(isDirectOnboardingAuthorized('store_manager', 'cashier', false)).toBe(false);
      expect(isDirectOnboardingAuthorized('warehouse_manager', 'picker', false)).toBe(false);
    });

    it('strictly denies direct activation to site managers for supervisory roles even if quota flag was set', () => {
      expect(isDirectOnboardingAuthorized('store_manager', 'assistant_store_manager', false)).toBe(false);
      expect(isDirectOnboardingAuthorized('store_manager', 'shift_supervisor', false)).toBe(false);
    });
  });
});
