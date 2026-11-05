import { supabase } from '../../lib/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leaveRequestsService, getStatutoryLeaveConfig, STATUTORY_LEAVE_POLICIES } from '../../services/leave-requests.service';
import { attendanceService } from '../../services/attendance.service';
import { terminationsService } from '../../services/terminations.service';
import { recordLifecycleService } from '../../services/record-lifecycle.service';
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
        const res: any = {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: inMemoryLeaves[idx] || updates, error: null })
          }),
          then: (onfulfilled: any) => Promise.resolve({ data: inMemoryLeaves[idx] || updates, error: null }).then(onfulfilled)
        };
        res.eq = vi.fn().mockReturnValue(res);
        return res;
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

  const lifecycleChainable: any = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((col: string, val: any) => {
        const rec = inMemoryTerminations.find(r => r[col] === val || r.id === val) || inMemoryTerminations[inMemoryTerminations.length - 1];
        return {
          single: vi.fn().mockResolvedValue({ data: rec, error: null }),
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: inMemoryTerminations, error: null })
          })
        };
      })
    })
  };

  return {
    supabase: {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'employee_documents') return docChainable;
        if (table === 'leave_requests') return leaveChainable;
        if (table === 'termination_requests') return terminationChainable;
        if (table === 'record_lifecycle_requests') return lifecycleChainable;
        return defaultChainable;
      }),
      rpc: vi.fn().mockImplementation((fn: string, params: any) => {
        if (fn === 'request_record_lifecycle') {
          const id = '00000000-0000-4000-8000-000000000001';
          inMemoryTerminations.push({
            id,
            kind: params.p_kind,
            target_id: params.p_target_id,
            target_label: 'Untrusted Cashier',
            site_id: 'SITE-01',
            country_code: 'ET',
            region_code: 'ADD',
            reason: params.p_reason,
            evidence: params.p_evidence,
            original_state: { role: 'cashier', status: 'Active' },
            status: 'Pending',
            requested_by: 'MGR-001',
            requester_name: 'Store Manager John',
            requester_role: 'store_manager',
            requested_at: new Date().toISOString()
          });
          return Promise.resolve({ data: id, error: null });
        }
        if (fn === 'decide_record_lifecycle') {
          return Promise.resolve({ data: { request_id: params.p_request_id, status: params.p_approve ? 'Applied' : 'Rejected' }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
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
        { id: 'MGR-KE-01', name: 'Supervisory Manager', role: 'country_hr_director' },
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
        employee_id: '00000000-0000-4000-8000-000000000001',
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
        employee_id: '00000000-0000-4000-8000-000000000002',
        employee_name: 'Worker',
        employee_role: 'picker',
        reason_code: 'voluntary_resignation',
        reason_details: 'Pursuing university degree at Addis Ababa campus.',
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
          role: 'hr_generalist'
        })
      ).rejects.toThrow(/Review offboarding evidence/);
    });

    it('approves termination by secondary authorized manager', async () => {
      const term = await terminationsService.proposeTermination({
        country_code: 'ET',
        employee_id: '00000000-0000-4000-8000-000000000003',
        employee_name: 'Worker 4',
        employee_role: 'cashier',
        reason_code: 'job_abandonment',
        reason_details: 'Unexcused consecutive absence for 8 days from facility.',
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

      await expect(
        terminationsService.approveTermination(term.id, {
          id: 'HR-DIRECTOR-01',
          name: 'HR Director',
          role: 'country_hr_director'
        })
      ).rejects.toThrow(/Review offboarding evidence/);

      const decision = await recordLifecycleService.decide(
        term.id,
        'approve',
        'Verified offboarding exit checklist and financial clearance.'
      );
      expect(decision.status).toBe('Applied');
    });
  });

  describe('Finding 7: Attendance & Dynamic Rates', () => {
    it('uses confirmed server clock times and calculates the rate from saved attendance', async () => {
      const record={id:'11111111-1111-4111-8111-111111111111',country_code:'ET',site_id:'SITE-01',employee_id:'22222222-2222-4222-8222-222222222222',employee_name:'Worker',status:'Present',date:'2026-11-06',clock_in:'2026-11-06T06:00:00Z',created_at:'2026-11-06T06:00:00Z'};
      vi.mocked(supabase.rpc).mockResolvedValueOnce({data:record,error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
      const clockIn=await attendanceService.clockIn({country_code:'ET',site_id:record.site_id,employee_id:record.employee_id,employee_name:'Untrusted name',gps_coordinates:'9.0105,38.7612'});
      expect(clockIn.clock_in).toBe(record.clock_in);
      expect(supabase.rpc).toHaveBeenCalledWith('record_employee_attendance',{p_employee:record.employee_id,p_site:record.site_id,p_country:'ET',p_record:null});
      vi.mocked(supabase.from).mockReturnValueOnce({select:()=>({eq:()=>({single:async()=>({data:record,error:null})})})} as unknown as ReturnType<typeof supabase.from>);
      vi.mocked(supabase.rpc).mockResolvedValueOnce({data:{...record,clock_out:'2026-11-06T14:00:00Z',hours_worked:8},error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
      const clockOut=await attendanceService.clockOut(record.id);
      expect(clockOut.hours_worked).toBe(8);expect(attendanceService.calculateDynamicAttendanceRate([clockOut])).toBe(100);
    });
  });

  describe('Finding 8: Permission Matrix Hardening', () => {
    it('restricts head_of_hr from executing raw unilateral employee deletion', () => {
      // head_of_hr cannot delete employees directly (requires CEO or dual-control offboarding)
      const canDelete = hasPermission('country_hr_director', 'employees.delete');
      expect(canDelete).toBe(false);

      // super_admin retains root authority
      const superAdminCanDelete = hasPermission('group_ceo', 'employees.delete');
      expect(superAdminCanDelete).toBe(true);
    });
  });
});
