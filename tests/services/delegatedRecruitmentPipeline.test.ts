import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recruitmentService } from '../../services/recruitment.service';
import { employeesService } from '../../services/employees.service';

vi.mock('../../lib/supabase', () => {
  const chainable: any = {};
  chainable.select = vi.fn().mockReturnValue(chainable);
  chainable.insert = vi.fn().mockReturnValue(chainable);
  chainable.update = vi.fn().mockReturnValue(chainable);
  chainable.delete = vi.fn().mockReturnValue(chainable);
  chainable.eq = vi.fn().mockReturnValue(chainable);
  chainable.order = vi.fn().mockReturnValue(chainable);
  chainable.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chainable.limit = vi.fn().mockResolvedValue({ data: null, error: null });
  chainable.then = (onfulfilled: any, onrejected: any) =>
    Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected);

  return {
    supabase: {
      from: vi.fn().mockReturnValue(chainable)
    }
  };
});

describe('Delegated Recruitment & 4-Eyes Dual Approval Pipeline', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    vi.clearAllMocks();
  });

  describe('1. Delegated Role Level Hierarchy', () => {
    it('allows Level 1, 2, and 3 managers to initiate hiring, but blocks Level 4 floor staff', () => {
      expect(recruitmentService.canManageHiring('group_ceo')).toBe(true);
      expect(recruitmentService.canManageHiring('warehouse_manager')).toBe(true);
      expect(recruitmentService.canManageHiring('store_manager')).toBe(true);
      expect(recruitmentService.canManageHiring('country_hr_director')).toBe(true);

      // Floor staff cannot initiate hiring
      expect(recruitmentService.canManageHiring('picker')).toBe(false);
      expect(recruitmentService.canManageHiring('cashier')).toBe(false);
      expect(recruitmentService.canManageHiring('stock_clerk')).toBe(false);
    });

    it('strictly restricts Level 6 Site Managers to roles below their level (Levels 7-10 only)', () => {
      const allowedForStoreManager = recruitmentService.getAllowedRolesForManager('store_manager');
      
      // All allowed roles must have level > 6 (Levels 7-10)
      expect(allowedForStoreManager.length).toBeGreaterThan(0);
      allowedForStoreManager.forEach(role => {
        expect(role.level).toBeGreaterThan(6);
      });

      // Must include floor roles
      const roleIds = allowedForStoreManager.map(r => r.id);
      expect(roleIds).toContain('cashier');
      expect(roleIds).toContain('stock_clerk');
      expect(roleIds).toContain('picker');
      expect(roleIds).toContain('receiver');

      // Cannot hire peers or superiors
      expect(roleIds).not.toContain('warehouse_manager');
      expect(roleIds).not.toContain('store_manager');
      expect(roleIds).not.toContain('country_operations_director');
      expect(roleIds).not.toContain('group_ceo');
    });
  });

  describe('2. Dual-Approval: HR Vetting & Finance Salary Sign-off', () => {
    it('rejects unauthorized roles from giving HR identity approval', async () => {
      const cand = await recruitmentService.createCandidate({
        country_code: 'KE',
        name: 'John Kamau',
        email: 'john@example.com',
        phone: '+254711223344'
      });

      // Cashier or Store Manager cannot give corporate HR vetting
      await expect(
        recruitmentService.approveCandidateHR(cand.id, {
          id: 'sm-1',
          name: 'Store Manager',
          role: 'store_manager'
        })
      ).rejects.toThrow('4-Eyes Violation: Only HR leadership can perform candidate identity & compliance approval.');
    });

    it('allows Head of Human Resources to sign off candidate identity and credentials', async () => {
      const cand = await recruitmentService.createCandidate({
        country_code: 'KE',
        name: 'Faith Wanjiku',
        email: 'faith@example.com',
        phone: '+254722334455'
      });

      const res = await recruitmentService.approveCandidateHR(cand.id, {
        id: 'hr-1',
        name: 'Sarah HR',
        role: 'country_hr_director'
      }, 'National ID & Background verified');

      expect(res).toBe(true);
    });

    it('rejects unauthorized roles from giving Finance salary sign-off', async () => {
      const cand = await recruitmentService.createCandidate({
        country_code: 'ET',
        name: 'Yonas Bekele',
        email: 'yonas@example.com',
        phone: '+251911223344'
      });

      await expect(
        recruitmentService.approveCandidateSalaryFinance(cand.id, {
          id: 'hr-1',
          name: 'Sarah HR',
          role: 'country_hr_director'
        }, 15000)
      ).rejects.toThrow('4-Eyes Violation: Only Finance leadership can authorize salary and compensation bands.');
    });

    it('allows Head of Finance to authorize salary and budget', async () => {
      const cand = await recruitmentService.createCandidate({
        country_code: 'ET',
        name: 'Bethlehem Tadesse',
        email: 'bethlehem@example.com',
        phone: '+251922334455'
      });

      const res = await recruitmentService.approveCandidateSalaryFinance(cand.id, {
        id: 'fin-1',
        name: 'Ahmed Finance',
        role: 'country_finance_director'
      }, 16500, 'Approved under Addis Ababa distribution budget');

      expect(res).toBe(true);
    });
  });

  describe('3. Synaptic Activation: Employee Provisioning', () => {
    it('blocks hire activation if missing HR or Finance approval', async () => {
      const cand = await recruitmentService.createCandidate({
        country_code: 'KE',
        name: 'Peter Omondi',
        email: 'peter@example.com',
        phone: '+254733445566'
      });

      // Try activation without approvals as Warehouse Manager
      await expect(
        recruitmentService.finalizeAndActivateHire(cand.id, {
          id: 'wm-1',
          name: 'Warehouse Manager',
          role: 'warehouse_manager'
        }, 'site-ke-01', 'picker')
      ).rejects.toThrow('Zero-Trust Guard: Mandatory HR identity verification required before hire activation.');
    });

    it('provisions new employee into employees store upon complete dual approval', async () => {
      const cand = await recruitmentService.createCandidate({
        country_code: 'KE',
        name: 'Grace Mutua',
        email: 'grace.mutua@siifmart.com',
        phone: '+254744556677'
      });

      // 1. HR approval
      await recruitmentService.approveCandidateHR(cand.id, {
        id: 'hr-1',
        name: 'Sarah HR',
        role: 'country_hr_director'
      });

      // 2. Finance approval
      await recruitmentService.approveCandidateSalaryFinance(cand.id, {
        id: 'fin-1',
        name: 'Ahmed Finance',
        role: 'country_finance_director'
      }, 36000);

      // Mock employeesService.create
      vi.spyOn(employeesService, 'getNextCode').mockResolvedValue('KE-SIIF0099');
      vi.spyOn(employeesService, 'create').mockResolvedValue({
        id: 'emp-grace-01',
        code: 'KE-SIIF0099',
        name: 'Grace Mutua',
        email: 'grace.mutua@siifmart.com',
        phone: '+254744556677',
        role: 'picker',
        siteId: 'site-ke-01',
        department: 'Operations',
        salary: 36000,
        status: 'Active',
        joinDate: '2026-10-10',
        avatar: '',
        performanceScore: 100,
        specialization: 'Floor Operations',
        attendanceRate: 100,
        badges: ['New Hire']
      } as any);

      const newEmp = await recruitmentService.finalizeAndActivateHire(
        cand.id,
        { id: 'wm-1', name: 'Kennedy Manager', role: 'warehouse_manager' },
        'site-ke-01',
        'picker'
      );

      expect(newEmp.code).toBe('KE-SIIF0099');
      expect(newEmp.status).toBe('Active');
      expect(newEmp.role).toBe('picker');
      expect(newEmp.siteId).toBe('site-ke-01');
    });
  });
});
