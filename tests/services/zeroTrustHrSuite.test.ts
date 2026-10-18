import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leaveRequestsService, getStatutoryLeaveConfig, STATUTORY_LEAVE_POLICIES } from '../../services/leave-requests.service';
import { attendanceService } from '../../services/attendance.service';
import { terminationsService } from '../../services/terminations.service';
import { employeeDocumentsService } from '../../services/employee-documents.service';
import { hasPermission } from '../../services/permissions.service';
import { calculateNetSalary, getEmployeeLeaveRequests } from '../../utils/employeeProfileData';

let inMemoryDocs: any[] = [];
let inMemoryLeaves: any[] = [];
let inMemoryTerminations: any[] = [];

vi.mock('../../lib/supabase', () => {
  const docChainable: any = {};
  docChainable.select = vi.fn().mockReturnValue(docChainable);
  docChainable.insert = vi.fn().mockImplementation((records: any[]) => {
    if (Array.isArray(records)) records.forEach(r => inMemoryDocs.push(r));
    return docChainable;
  });
  docChainable.eq = vi.fn().mockReturnValue(docChainable);
  docChainable.order = vi.fn().mockImplementation(() => Promise.resolve({ data: inMemoryDocs, error: null }));
  docChainable.single = vi.fn().mockImplementation(() => Promise.resolve({ data: inMemoryDocs[inMemoryDocs.length - 1] || null, error: null }));

  const leaveChainable: any = {};
  leaveChainable.select = vi.fn().mockReturnValue(leaveChainable);
  leaveChainable.insert = vi.fn().mockImplementation((record: any) => {
    const raw = Array.isArray(record) ? record[0] : record;
    const rec = { ...raw, id: raw.id || `LR-${Date.now()}` };
    inMemoryLeaves.push(rec);
    return {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: rec, error: null })
      }),
      then: (onfulfilled: any) => Promise.resolve({ data: rec, error: null }).then(onfulfilled)
    };
  });
  leaveChainable.update = vi.fn().mockImplementation((updates: any) => {
    return {
      eq: vi.fn().mockImplementation((col: string, val: any) => {
        const idx = inMemoryLeaves.findIndex(r => r[col] === val || r.id === val);
        if (idx !== -1) {
          inMemoryLeaves[idx] = { ...inMemoryLeaves[idx], ...updates };
        }
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: inMemoryLeaves[idx] || updates, error: null })
          }),
          then: (onfulfilled: any) => Promise.resolve({ data: inMemoryLeaves[idx] || updates, error: null }).then(onfulfilled)
        };
      })
    };
  });
  leaveChainable.eq = vi.fn().mockImplementation((col: string, val: any) => {
    const filtered = inMemoryLeaves.filter(r => r[col] === val || r.id === val);
    return {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: filtered, error: null })
      }),
      order: vi.fn().mockResolvedValue({ data: filtered, error: null }),
      single: vi.fn().mockResolvedValue({ data: filtered[0] || null, error: null }),
      then: (onfulfilled: any) => Promise.resolve({ data: filtered, error: null }).then(onfulfilled)
    };
  });
  leaveChainable.order = vi.fn().mockImplementation(() => Promise.resolve({ data: inMemoryLeaves, error: null }));

  const terminationChainable: any = {};
  terminationChainable.select = vi.fn().mockReturnValue(terminationChainable);
  terminationChainable.insert = vi.fn().mockImplementation((records: any[] | any) => {
    const raw = Array.isArray(records) ? records[0] : records;
    const record = { ...raw, created_at: raw.created_at || new Date().toISOString(), updated_at: raw.updated_at || new Date().toISOString() };
    inMemoryTerminations.push(record);
    return { select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: record, error: null }) }) };
  });
  terminationChainable.update = vi.fn().mockImplementation((updates: any) => ({
    eq: vi.fn().mockImplementation((col: string, val: any) => {
      const idx = inMemoryTerminations.findIndex(r => r[col] === val || r.id === val);
      if (idx !== -1) inMemoryTerminations[idx] = { ...inMemoryTerminations[idx], ...updates };
      return Promise.resolve({ data: inMemoryTerminations[idx] || updates, error: null });
    })
  }));

  const defaultChainable: any = {};
  defaultChainable.select = vi.fn().mockReturnValue(defaultChainable);
  defaultChainable.insert = vi.fn().mockReturnValue(defaultChainable);
  defaultChainable.update = vi.fn().mockReturnValue(defaultChainable);
  defaultChainable.delete = vi.fn().mockReturnValue(defaultChainable);
  defaultChainable.eq = vi.fn().mockReturnValue(defaultChainable);
  defaultChainable.order = vi.fn().mockReturnValue(defaultChainable);
  defaultChainable.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Offline mock' } });
  defaultChainable.limit = vi.fn().mockResolvedValue({ data: null, error: { message: 'Offline mock' } });
  defaultChainable.then = (onfulfilled: any, onrejected: any) =>
    Promise.resolve({ data: null, error: { message: 'Offline mock' } }).then(onfulfilled, onrejected);

  return {
    supabase: {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'employee_documents') return docChainable;
        if (table === 'leave_requests') return leaveChainable;
        if (table === 'termination_requests') return terminationChainable;
        return defaultChainable;
      })
    }
  };
});

describe('Zero-Trust HR Suite Tests', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    inMemoryDocs = [];
    inMemoryLeaves = [];
    inMemoryTerminations = [];
    terminationsService._clearCache();
    (leaveRequestsService as any)._clearCache();
  });

  describe('Finding 1 & 6: Leave Requests & Statutory Policies', () => {
    it('enforces country-specific statutory policies (ET: 16d / 30d, KE: 21d / 30d)', () => {
      const etPolicy = getStatutoryLeaveConfig('ET');
      expect(etPolicy.countryCode).toBe('ET');
      expect(etPolicy.annualLeaveDays).toBe(16);
      expect(etPolicy.sickLeaveDays).toBe(30);

      const kePolicy = getStatutoryLeaveConfig('KE');
      expect(kePolicy.countryCode).toBe('KE');
      expect(kePolicy.annualLeaveDays).toBe(21);
      expect(kePolicy.sickLeaveDays).toBe(30);
    });

    it('creates leave request scoped to country without fake pre-seeded data', async () => {
      const emptyLeaves = getEmployeeLeaveRequests('EMP-999');
      expect(emptyLeaves).toEqual([]);

      const leave = await leaveRequestsService.createLeave({
        country_code: 'ET',
        site_id: 'SITE-ET-01',
        employee_id: 'EMP-001',
        employee_name: 'Abebe Bikila',
        leave_type: 'Annual Leave',
        start_date: '2026-10-10',
        end_date: '2026-10-15',
        days: 5,
        reason: 'Family visit',
        requested_by: 'Abebe Bikila'
      });

      expect(leave.id).toBeDefined();
      expect(leave.status).toBe('Pending');
      expect(leave.country_code).toBe('ET');
    });

    it('enforces 4-Eyes principle: employee CANNOT approve their own leave request', async () => {
      const leave = await leaveRequestsService.createLeave({
        country_code: 'ET',
        employee_id: 'EMP-002',
        employee_name: 'Almaz Ayana',
        leave_type: 'Sick Leave',
        start_date: '2026-10-05',
        end_date: '2026-10-06',
        days: 2,
        reason: 'Medical rest',
        requested_by: 'Almaz Ayana'
      });

      await expect(
        leaveRequestsService.reviewLeave(
          leave.id,
          { id: 'EMP-002', name: 'Almaz Ayana', role: 'store_manager' },
          'Approved'
        )
      ).rejects.toThrow(/Maker-Checker violation/);
    });

    it('allows supervisory manager to approve valid leave request', async () => {
      const leave = await leaveRequestsService.createLeave({
        country_code: 'KE',
        employee_id: 'EMP-KE-01',
        employee_name: 'Eliud Kipchoge',
        leave_type: 'Annual Leave',
        start_date: '2026-11-01',
        end_date: '2026-11-05',
        days: 4,
        reason: 'Rest period',
        requested_by: 'Eliud Kipchoge'
      });

      const approved = await leaveRequestsService.reviewLeave(
        leave.id,
        { id: 'MGR-KE-01', name: 'Supervisory Manager', role: 'hr_manager' },
        'Approved'
      );

      expect(approved).toBe(true);
    });
  });

  describe('Finding 2: Employee Documents & PII Management', () => {
    it('persists structured document record with file metadata', async () => {
      const doc = await employeeDocumentsService.addDocument({
        country_code: 'ET',
        employee_id: 'EMP-001',
        name: 'National_ID_Card.png',
        doc_type: 'National ID',
        file_url: 'https://storage.siifmart.com/docs/nid_001.png',
        file_size: 450000,
        uploaded_by: 'HR Officer'
      });

      expect(doc.id).toBeDefined();
      expect(doc.doc_type).toBe('National ID');
      expect(doc.verified).toBe(false);

      const docs = await employeeDocumentsService.fetchDocuments('EMP-001', 'ET');
      expect(docs.length).toBeGreaterThan(0);
      expect(docs.some(d => d.id === doc.id)).toBe(true);
    });
  });

  describe('Finding 3: Statutory Payslips & Sovereign Tax Computation', () => {
    it('computes ERCA progressive income tax and pension for Ethiopia (ET)', () => {
      const payslip = calculateNetSalary(30000, 'ET');
      expect(payslip.grossSalary).toBe(30000);
      expect(payslip.pensionDeduction).toBe(2100); // 7% employee pension
      expect(payslip.taxDeduction).toBeGreaterThan(0);
      expect(payslip.netSalary).toBe(payslip.grossSalary - payslip.taxDeduction - payslip.pensionDeduction);
    });

    it('computes KRA PAYE, NSSF, and SHIF deductions for Kenya (KE)', () => {
      const payslip = calculateNetSalary(50000, 'KE');
      expect(payslip.grossSalary).toBe(50000);
      expect(payslip.pensionDeduction).toBeGreaterThan(0);
      expect(payslip.taxDeduction).toBeGreaterThan(0);
      expect(payslip.netSalary).toBe(payslip.grossSalary - payslip.taxDeduction - payslip.pensionDeduction);
    });
  });

  describe('Finding 4: 4-Eyes Dual-Control Terminations & Rule 18 Audit', () => {
    it('proposes termination with mandatory structured reason code and checklist', async () => {
      const term = await terminationsService.proposeTermination({
        country_code: 'ET',
        site_id: 'SITE-01',
        employee_id: 'EMP-BAD-01',
        employee_name: 'Untrusted Cashier',
        employee_role: 'cashier',
        reason_code: 'gross_misconduct',
        reason_details: 'Drawer theft caught on camera during shift close.',
        effective_date: '2026-10-04',
        assets_returned: true,
        pos_access_revoked: true,
        wms_badge_deactivated: false,
        keys_surrendered: true,
        cash_drawer_reconciled: true,
        proposed_by: 'MGR-001',
        proposed_by_name: 'Store Manager John',
        proposed_by_role: 'store_manager'
      });

      expect(term.id).toBeDefined();
      expect(term.status).toBe('pending_approval');
      expect(term.reason_code).toBe('gross_misconduct');
      expect(term.pos_access_revoked).toBe(true);
    });

    it('rejects self-approval of termination (4-Eyes Maker-Checker principle)', async () => {
      const term = await terminationsService.proposeTermination({
        country_code: 'ET',
        employee_id: 'EMP-003',
        employee_name: 'Worker',
        employee_role: 'picker',
        reason_code: 'voluntary_resignation',
        reason_details: 'Pursuing university degree.',
        effective_date: '2026-10-15',
        assets_returned: false,
        pos_access_revoked: false,
        wms_badge_deactivated: false,
        keys_surrendered: false,
        cash_drawer_reconciled: false,
        proposed_by: 'MGR-HR-01',
        proposed_by_name: 'HR Officer Martha',
        proposed_by_role: 'hr'
      });

      await expect(
        terminationsService.approveTermination(term.id, {
          id: 'MGR-HR-01',
          name: 'HR Officer Martha',
          role: 'hr'
        })
      ).rejects.toThrow(/Maker-Checker violation/);
    });

    it('approves termination by secondary authorized manager', async () => {
      const term = await terminationsService.proposeTermination({
        country_code: 'ET',
        employee_id: 'EMP-004',
        employee_name: 'Worker 4',
        employee_role: 'cashier',
        reason_code: 'job_abandonment',
        reason_details: 'Unexcused consecutive absence for 8 days.',
        effective_date: '2026-10-04',
        assets_returned: false,
        pos_access_revoked: true,
        wms_badge_deactivated: false,
        keys_surrendered: false,
        cash_drawer_reconciled: true,
        proposed_by: 'MGR-STORE-02',
        proposed_by_name: 'Store Lead',
        proposed_by_role: 'store_manager'
      });

      const approved = await terminationsService.approveTermination(term.id, {
        id: 'HR-DIRECTOR-01',
        name: 'HR Director',
        role: 'hr_manager'
      });

      expect(approved).toBe(true);
    });
  });

  describe('Finding 7: Attendance & Dynamic Rates', () => {
    it('records clock-in with GPS metadata and calculates dynamic attendance rate', async () => {
      const clockIn = await attendanceService.clockIn({
        country_code: 'ET',
        site_id: 'SITE-01',
        employee_id: 'EMP-ATT-01',
        employee_name: 'Haile Gebrselassie',
        gps_coordinates: '9.0105,38.7612',
        device_info: 'DEV-POS-04'
      });

      expect(clockIn.id).toBeDefined();
      expect(clockIn.status).toBe('Present');
      expect(clockIn.clock_in).toBeDefined();

      const clockOut = await attendanceService.clockOut(clockIn.id);
      expect(clockOut).toBeDefined();
      expect(clockOut!.clock_out).toBeDefined();
      expect(clockOut!.hours_worked).toBeDefined();

      const rate = attendanceService.calculateDynamicAttendanceRate([clockOut!]);
      expect(rate).toBe(100);
    });
  });

  describe('Finding 8: Permission Matrix Hardening', () => {
    it('restricts hr_manager from executing raw unilateral employee deletion', () => {
      // hr_manager cannot delete employees directly (requires CEO or dual-control offboarding)
      const canDelete = hasPermission('hr_manager', 'employees.delete');
      expect(canDelete).toBe(false);

      // super_admin retains root authority
      const superAdminCanDelete = hasPermission('super_admin', 'employees.delete');
      expect(superAdminCanDelete).toBe(true);
    });
  });
});
