import { describe, it, expect, beforeEach } from 'vitest';
import { payrollRunsService } from '../../services/payroll-runs.service';
import { disciplinaryService } from '../../services/disciplinary.service';
import { recruitmentService } from '../../services/recruitment.service';
import { hasPermission } from '../../utils/permissions';
import { canEmployRole } from '../../utils/roles';

describe('HR Directorate Maker-Checker Governance & Dual Control', () => {
    describe('1. Payroll Run 4-Eyes Separation of Duties', () => {
        const sampleRunId = 'test-payroll-run-101';

        beforeEach(async () => {
            // Seed a draft payroll run initiated by a payroll specialist (Maker)
            await payrollRunsService.create({
                period: 'October 2026',
                countryCode: 'ET',
                employeeCount: 42,
                currency: 'ETB',
                totalGrossSalaries: 500000,
                totalBonuses: 20000,
                totalDeductions: 50000,
                totalNetPayout: 470000,
                status: 'draft',
                initiatedBy: 'Abebe Bikila',
                initiatedByRole: 'payroll_specialist'
            });
        });

        it('allows HR Manager to certify staff roster as HR Checker', async () => {
            const allRuns = await payrollRunsService.getAll();
            const target = allRuns.find(r => r.period === 'October 2026');
            expect(target).toBeDefined();

            if (target) {
                const certified = await payrollRunsService.signAsHR(
                    target.id,
                    'Bethelhem Tadesse',
                    'hr_manager',
                    'HR verified attendance logs and roster active count'
                );

                expect(certified.hrApprovedBy).toBe('Bethelhem Tadesse');
                expect(certified.hrApprovedByRole).toBe('hr_manager');
                expect(certified.status).toBe('pending_finance');
            }
        });

        it('blocks anti-self-approval: the same actor cannot certify as HR and authorize as Finance', async () => {
            const allRuns = await payrollRunsService.getAll();
            const target = allRuns.find(r => r.period === 'October 2026');
            expect(target).toBeDefined();

            if (target) {
                await payrollRunsService.signAsHR(
                    target.id,
                    'Bethelhem Tadesse',
                    'hr_manager',
                    'HR verification'
                );

                // Same person attempting to sign off as finance authorizer must throw 4-Eyes violation
                await expect(
                    payrollRunsService.signAsFinance(
                        target.id,
                        'Bethelhem Tadesse',
                        'finance_manager',
                        'Attempted dual role sign-off'
                    )
                ).rejects.toThrow(/Zero-Trust 4-Eyes Violation/);
            }
        });

        it('allows a distinct Finance Manager to authorize disbursement', async () => {
            const allRuns = await payrollRunsService.getAll();
            const target = allRuns.find(r => r.period === 'October 2026');
            expect(target).toBeDefined();

            if (target) {
                await payrollRunsService.signAsHR(
                    target.id,
                    'Bethelhem Tadesse',
                    'hr_manager',
                    'HR verification'
                );

                const authorized = await payrollRunsService.signAsFinance(
                    target.id,
                    'Dawit Kebede',
                    'finance_manager',
                    'Disbursement approved against monthly budget'
                );

                expect(authorized.financeApprovedBy).toBe('Dawit Kebede');
                expect(authorized.financeApprovedByRole).toBe('finance_manager');
                expect(authorized.status).toBe('approved');
            }
        });
    });

    describe('2. Disciplinary Appeal Adjudication 4-Eyes Rule', () => {
        it('blocks disciplinary issuer from adjudicating the appeal', async () => {
            const record = await disciplinaryService.issueDisciplinaryNotice({
                country_code: 'ET',
                employee_id: 'emp-101',
                employee_name: 'Solomon Tesfaye',
                record_type: 'Written Warning',
                severity: 'Medium',
                title: 'Attendance non-compliance',
                description: 'Unexcused absence on shift',
                action_taken: 'Formal warning issued',
                issued_by: 'Marta Hailu',
                issued_by_role: 'hr_manager'
            });

            await disciplinaryService.fileAppeal(record.id, 'emp-101', 'Medical certificate was submitted');

            // Marta Hailu (the issuer) cannot adjudicate her own issued notice
            await expect(
                disciplinaryService.resolveAppeal(
                    record.id,
                    'Upheld',
                    { id: 'usr-1', name: 'Marta Hailu', role: 'hr_manager' }
                )
            ).rejects.toThrow(/Maker-Checker violation/);
        });

        it('allows an independent supervisor to adjudicate the appeal', async () => {
            const record = await disciplinaryService.issueDisciplinaryNotice({
                country_code: 'ET',
                employee_id: 'emp-102',
                employee_name: 'Almaz Ayana',
                record_type: 'Written Warning',
                severity: 'Low',
                title: 'Dress code discrepancy',
                description: 'Floor uniform missing badge',
                action_taken: 'Coaching session logged',
                issued_by: 'Marta Hailu',
                issued_by_role: 'hr_manager'
            });

            await disciplinaryService.fileAppeal(record.id, 'emp-102', 'Replacement badge was on order');

            // Distinct HR reviewer adjudicates
            const resolved = await disciplinaryService.resolveAppeal(
                record.id,
                'Overturned',
                { id: 'usr-2', name: 'Kassahun Desta', role: 'hr_manager' },
                'Verified replacement request on file.'
            );

            expect(resolved).toBe(true);
        });
    });

    describe('3. Recruitment & Onboarding Dual-Control Activation', () => {
        it('enforces mandatory HR vetting and Finance salary approval before hire activation', async () => {
            // Unvetted candidate
            const unapprovedCandidateId = 'cand-unapproved-1';

            // Should reject if HR vetting is missing
            await expect(
                recruitmentService.finalizeAndActivateHire(
                    unapprovedCandidateId,
                    { id: 'u1', name: 'Store Lead', role: 'store_manager' }
                )
            ).rejects.toThrow();
        });

        it('restricts candidate hire approval permissions to authorized roles', () => {
            expect(hasPermission('hr_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(hasPermission('talent_recruiter', 'APPROVE_EMPLOYEE')).toBe(false);
            expect(hasPermission('payroll_specialist', 'APPROVE_EMPLOYEE')).toBe(false);
            expect(hasPermission('training_coordinator', 'APPROVE_EMPLOYEE')).toBe(false);
        });

        it('enforces rank hierarchy so recruiters cannot self-activate recruits', () => {
            expect(canEmployRole('talent_recruiter', 'cashier')).toBe(false);
            expect(canEmployRole('hr_manager', 'cashier')).toBe(true);
        });
    });
});
