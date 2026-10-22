import { describe, it, expect, beforeEach, vi } from 'vitest';
import { salaryRequestsService } from '../../services/salary-requests.service';
import { authService } from '../../services/auth.service';
import { hasPermission } from '../../utils/permissions';
import { CONFLICTING_DUTIES } from '../../services/permissions.service';

let inMemoryDb: any[] = [];

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockImplementation((_table: string) => {
            const createQuery = (conditions: { col: string; val: any }[] = [], limitVal?: number, offsetVal: number = 0) => {
                const getFiltered = () => {
                    let rows = [...inMemoryDb];
                    for (const c of conditions) {
                        rows = rows.filter(r => r[c.col] === c.val || (c.col === 'id' && r.id === c.val));
                    }
                    if (offsetVal > 0) rows = rows.slice(offsetVal);
                    if (limitVal !== undefined) rows = rows.slice(0, limitVal);
                    return rows;
                };

                const builder: any = {
                    select: vi.fn(() => builder),
                    eq: vi.fn((col: string, val: any) => createQuery([...conditions, { col, val }], limitVal, offsetVal)),
                    limit: vi.fn((l: number) => createQuery(conditions, l, offsetVal)),
                    range: vi.fn((from: number, to: number) => createQuery(conditions, to - from + 1, from)),
                    order: vi.fn(() => builder),
                    single: vi.fn(() => {
                        const rows = getFiltered();
                        return Promise.resolve({ data: rows[0] || null, error: rows[0] ? null : { message: 'Not found' } });
                    }),
                    maybeSingle: vi.fn(() => {
                        const rows = getFiltered();
                        return Promise.resolve({ data: rows[0] || null, error: null });
                    }),
                    then: (onfulfilled: any) => Promise.resolve({ data: getFiltered(), error: null }).then(onfulfilled)
                };
                return builder;
            };

            const root: any = createQuery();
            root.insert = vi.fn().mockImplementation((record: any) => {
                const rec = { id: record.id || `SR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...record };
                inMemoryDb.push(rec);
                return {
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: rec, error: null })
                    }),
                    then: (onfulfilled: any) => Promise.resolve({ data: rec, error: null }).then(onfulfilled)
                };
            });
            root.update = vi.fn().mockImplementation((updates: any) => {
                return {
                    eq: vi.fn().mockImplementation((col: string, val: any) => {
                        const idx = inMemoryDb.findIndex(r => r[col] === val || r.id === val);
                        if (idx !== -1) {
                            inMemoryDb[idx] = { ...inMemoryDb[idx], ...updates };
                        }
                        return Promise.resolve({ data: inMemoryDb[idx] || updates, error: null });
                    })
                };
            });
            return root;
        })
    }
}));

describe('Dual-Control Salary Approval Queue (SOP-GOV-018 & Zero-Trust SoD)', () => {
    beforeEach(() => {
        inMemoryDb = [];
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
        (salaryRequestsService as any)._clearCache();
    });

    describe('Permissions & Separation of Duties (SoD)', () => {
        it('grants HR propose_salary permission while strictly withholding approve_salary', () => {
            expect(authService.checkPermission('hr', 'employees.propose_salary')).toBe(true);
            expect(authService.checkPermission('hr', 'employees.approve_salary')).toBe(false);
            expect(hasPermission('hr', 'PROPOSE_SALARY')).toBe(true);
            expect(hasPermission('hr', 'APPROVE_SALARY')).toBe(false);
        });

        it('grants Head of Human Resources propose_salary while strictly withholding approve_salary', () => {
            expect(authService.checkPermission('head_of_hr', 'employees.propose_salary')).toBe(true);
            expect(authService.checkPermission('head_of_hr', 'employees.approve_salary')).toBe(false);
            expect(hasPermission('head_of_hr', 'PROPOSE_SALARY')).toBe(true);
            expect(hasPermission('head_of_hr', 'APPROVE_SALARY')).toBe(false);
        });

        it('grants Head of Finance approve_salary permission while withholding direct propose_salary', () => {
            expect(authService.checkPermission('head_of_finance', 'employees.approve_salary')).toBe(true);
            expect(authService.checkPermission('head_of_finance', 'employees.propose_salary')).toBe(false);
            expect(hasPermission('head_of_finance', 'APPROVE_SALARY')).toBe(true);
            expect(hasPermission('head_of_finance', 'PROPOSE_SALARY')).toBe(false);
        });

        it('grants CEO and Super Admin full dual-control permissions including executive override', () => {
            expect(authService.checkPermission('super_admin', 'employees.propose_salary')).toBe(true);
            expect(authService.checkPermission('super_admin', 'employees.approve_salary')).toBe(true);
            expect(authService.checkPermission('CEO', 'employees.propose_salary')).toBe(true);
            expect(authService.checkPermission('CEO', 'employees.approve_salary')).toBe(true);
        });

        it('enforces conflicting duty matrix between propose_salary and approve_salary', () => {
            expect(CONFLICTING_DUTIES['employees.propose_salary']).toContain('employees.approve_salary');
            expect(CONFLICTING_DUTIES['employees.approve_salary']).toContain('employees.propose_salary');
        });
    });

    describe('Salary Requests Lifecycle (create, approve, reject)', () => {
        it('creates a salary change request in pending status with country scoping', async () => {
            const req = await salaryRequestsService.create({
                employeeId: 'emp-001',
                employeeName: 'Abebe Bikila',
                currentSalary: 20000,
                proposedSalary: 25000,
                currency: 'ETB',
                siteId: 'site-addis-01',
                countryCode: 'ET',
                reason: 'Annual merit increase and performance excellence',
                status: 'pending',
                requestedBy: 'Sara HR',
                requestedByRole: 'hr',
                requestedAt: new Date().toISOString()
            });

            expect(req.id).toBeDefined();
            expect(req.status).toBe('pending');
            expect(req.proposedSalary).toBe(25000);
            expect(req.countryCode).toBe('ET');

            const pending = await salaryRequestsService.getPending('site-addis-01', 'ET');
            expect(pending.some(p => p.id === req.id)).toBe(true);
        });

        it('approves a pending request and updates approver metadata', async () => {
            const req = await salaryRequestsService.create({
                employeeId: 'emp-002',
                employeeName: 'Kipchoge Keino',
                currentSalary: 30000,
                proposedSalary: 38000,
                currency: 'KSh',
                siteId: 'site-nairobi-01',
                countryCode: 'KE',
                reason: 'Promotion to Senior Dispatch Lead',
                status: 'pending',
                requestedBy: 'John HR',
                requestedByRole: 'hr',
                requestedAt: new Date().toISOString()
            });

            const approved = await salaryRequestsService.approve(req.id, {
                id: 'fin-001',
                name: 'David Finance',
                role: 'head_of_finance'
            });

            expect(approved.status).toBe('approved');
            expect(approved.approvedBy).toBe('David Finance');
            expect(approved.approvedByRole).toBe('head_of_finance');
            expect(approved.approvedAt).toBeDefined();

            // Should no longer appear in pending list
            const pendingAfter = await salaryRequestsService.getPending('site-nairobi-01', 'KE');
            expect(pendingAfter.some(p => p.id === req.id)).toBe(false);
        });

        it('rejects a pending request with mandatory reason', async () => {
            const req = await salaryRequestsService.create({
                employeeId: 'emp-003',
                employeeName: 'Almaz Ayana',
                currentSalary: 18000,
                proposedSalary: 28000,
                currency: 'ETB',
                siteId: 'site-addis-02',
                countryCode: 'ET',
                reason: 'Exceptional inventory count accuracy',
                status: 'pending',
                requestedBy: 'Sara HR',
                requestedByRole: 'hr',
                requestedAt: new Date().toISOString()
            });

            const rejected = await salaryRequestsService.reject(
                req.id,
                { id: 'fin-001', name: 'David Finance', role: 'head_of_finance' },
                'Exceeds departmental Q4 compensation budget ceiling'
            );

            expect(rejected.status).toBe('rejected');
            expect(rejected.rejectedBy).toBe('David Finance');
            expect(rejected.rejectionReason).toBe('Exceeds departmental Q4 compensation budget ceiling');
            expect(rejected.rejectedAt).toBeDefined();

            // Should no longer be pending
            const pendingAfter = await salaryRequestsService.getPending('site-addis-02', 'ET');
            expect(pendingAfter.some(p => p.id === req.id)).toBe(false);
        });

        it('isolates salary requests strictly by countryCode', async () => {
            const etReq = await salaryRequestsService.create({
                employeeId: 'emp-et-1',
                employeeName: 'Ethiopian Worker',
                currentSalary: 15000,
                proposedSalary: 18000,
                currency: 'ETB',
                countryCode: 'ET',
                reason: 'ET Branch Review',
                status: 'pending',
                requestedBy: 'HR ET',
                requestedByRole: 'hr',
                requestedAt: new Date().toISOString()
            });

            const keReq = await salaryRequestsService.create({
                employeeId: 'emp-ke-1',
                employeeName: 'Kenyan Worker',
                currentSalary: 25000,
                proposedSalary: 30000,
                currency: 'KSh',
                countryCode: 'KE',
                reason: 'KE Branch Review',
                status: 'pending',
                requestedBy: 'HR KE',
                requestedByRole: 'hr',
                requestedAt: new Date().toISOString()
            });

            const etList = await salaryRequestsService.getAll(undefined, 'ET');
            const keList = await salaryRequestsService.getAll(undefined, 'KE');

            expect(etList.some(r => r.id === etReq.id)).toBe(true);
            expect(etList.some(r => r.id === keReq.id)).toBe(false);

            expect(keList.some(r => r.id === keReq.id)).toBe(true);
            expect(keList.some(r => r.id === etReq.id)).toBe(false);
        });

        it('supports bounded pagination and status-specific queries beyond 25 records', async () => {
            for (let i = 1; i <= 30; i++) {
                await salaryRequestsService.create({
                    employeeId: `emp-page-${i}`,
                    employeeName: `Worker ${i}`,
                    currentSalary: 10000 + i * 100,
                    proposedSalary: 12000 + i * 100,
                    currency: 'ETB',
                    countryCode: 'ET',
                    reason: `Adjustment ${i}`,
                    status: 'pending',
                    requestedBy: 'HR Lead',
                    requestedByRole: 'hr',
                    requestedAt: new Date(Date.now() - i * 1000).toISOString()
                });
            }

            const page1 = await salaryRequestsService.getPending(undefined, 'ET', 25, 0);
            expect(page1.length).toBe(25);

            const page2 = await salaryRequestsService.getPending(undefined, 'ET', 25, 25);
            expect(page2.length).toBe(5);

            const page1Ids = new Set(page1.map(r => r.id));
            expect(page2.every(r => !page1Ids.has(r.id))).toBe(true);
        });
    });
});
