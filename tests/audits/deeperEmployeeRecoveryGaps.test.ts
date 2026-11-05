// @vitest-environment jsdom
// Audit reproductions: passing tests document gaps, not desired production behavior.
import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ from: vi.fn(), create: vi.fn(), nextCode: vi.fn(), logs: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { from: mock.from } }));
vi.mock('../../services/employees.service', () => ({ employeesService: { create: mock.create, getNextCode: mock.nextCode } }));
vi.mock('../../services/system-logs.service', () => ({ systemLogsService: { create: mock.logs } }));
vi.mock('../../utils/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
const row = {
 id: 'notice', country_code: 'ET', site_id: 'warehouse', employee_id: 'worker', employee_name: 'Audit worker',
 record_type: 'Written Warning' as const, severity: 'High' as const, title: 'Audit notice', description: 'Audit details',
 action_taken: 'Review', appeal_status: 'Pending Appeal' as const, issued_by: 'issuer', issued_by_role: 'regional_hr_manager',
 issued_at: '2026-11-06T00:00:00Z', created_at: '2026-11-06T00:00:00Z', confidential_notes: 'Restricted personnel evidence'
};
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); localStorage.clear(); mock.logs.mockResolvedValue({ id: 'log' }); });
function failedMutation() {
 const response = { data: null, error: { code: '42501', message: 'Permission denied' } };
 mock.from.mockReturnValue({ insert: () => ({ select: () => ({ single: async () => response }) }), update: () => ({ eq: async () => response }) });
}
it('reports an issued disciplinary notice even when persistence is denied', async () => {
 failedMutation(); const { disciplinaryService } = await import('../../services/disciplinary.service');
 const saved = await disciplinaryService.issueDisciplinaryNotice(row);
 expect(saved.id).toBeTruthy(); expect(localStorage.getItem('siifmart_disciplinary_backup')).toContain('Restricted personnel evidence');
 expect(mock.logs).toHaveBeenCalledWith(expect.objectContaining({ action: 'DISCIPLINARY_NOTICE_ISSUED' }));
});
it('returns a previous user personnel cache after the current read is denied', async () => {
 localStorage.setItem('siifmart_disciplinary_backup', JSON.stringify([row]));
 mock.from.mockReturnValue({ select: () => ({ eq: () => ({ order: async () => ({ data: null, error: { message: 'Permission denied for current user' } }) }) }) });
 const { disciplinaryService } = await import('../../services/disciplinary.service');
 const records = await disciplinaryService.fetchDisciplinaryRecords('ET');
 expect(records[0].confidential_notes).toBe('Restricted personnel evidence');
});
it('acknowledges an appeal that the server refused', async () => {
 failedMutation(); const { disciplinaryService } = await import('../../services/disciplinary.service');
 expect(await disciplinaryService.fileAppeal('notice', 'worker', 'Review this evidence')).toBe(true);
});
it('acknowledges an adjudication that the server refused', async () => {
 failedMutation(); const { disciplinaryService } = await import('../../services/disciplinary.service');
 expect(await disciplinaryService.resolveAppeal('notice', 'Upheld', { id: 'reviewer', name: 'Reviewer', role: 'regional_hr_manager' })).toBe(true);
});
it('the approved recruitment path still sends an Active insert that the live onboarding guard rejects', async () => {
 mock.nextCode.mockResolvedValue('ET-SIIF9999');
 mock.create.mockRejectedValue(new Error('New employees require independent onboarding approval'));
 const { saveLocalCands } = await import('../../services/recruitment-storage');
 saveLocalCands([{ id: 'candidate', country_code: 'ET', site_id: 'warehouse', role: 'picker', name: 'Audit hire', email: 'audit@example.invalid', phone: '', stage: 'offered', interview_score: 90, technical_score: 90, culture_fit_score: 90, offered_salary: 100, hr_approved_at: '2026-11-06', hr_approved_by: 'hr', hiring_manager_approved_at: '2026-11-06', hiring_manager_approved_by: 'manager', created_at: '2026-11-06', updated_at: '2026-11-06' }]);
 const { recruitmentService } = await import('../../services/recruitment.service');
 await expect(recruitmentService.finalizeAndActivateHire('candidate', { id: 'reviewer', name: 'HR reviewer', role: 'country_hr_director' })).rejects.toThrow('New employees require independent onboarding approval');
 expect(mock.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'Active' }));
});
