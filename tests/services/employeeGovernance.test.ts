import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    evaluateEmployeeProfileChanges, 
    isSovereignCEO, 
    canApproveChangeRequest 
} from '../../utils/employeeGovernance';
import { Employee } from '../../types';

describe('Zero-Trust Employee Governance & Cross-Department Approvals', () => {
    const mockEmployee: Employee = {
        id: 'emp-001',
        code: 'SIIF-ET-0001',
        siteId: 'site-bole',
        name: 'Abebe Bikila',
        age: 30,
        dateOfBirth: '1996-05-15',
        nationalIdNumber: 'ET-ID-12345',
        role: 'cashier',
        email: 'abebe@siifmart.com',
        phone: '+251911223344',
        status: 'Active',
        joinDate: '2024-01-01',
        department: 'Retail Operations',
        avatar: '',
        performanceScore: 95,
        salary: 15000,
        address: 'Bole Medhanialem, House 45',
        emergencyContact: 'Tigist Bikila (+251922334455)'
    };

    describe('CEO Sovereign Universal Authority', () => {
        it('identifies CEO and super_admin as sovereign roles', () => {
            expect(isSovereignCEO('super_admin')).toBe(true);
            expect(isSovereignCEO('admin')).toBe(true);
            expect(isSovereignCEO('ceo')).toBe(true);
            expect(isSovereignCEO('hr_manager')).toBe(false);
            expect(isSovereignCEO('hr')).toBe(false);
        });

        it('bypasses all approvals when CEO edits name, age, salary, and department', () => {
            const result = evaluateEmployeeProfileChanges(
                mockEmployee,
                {
                    name: 'Abebe B. Bikila',
                    age: 31,
                    salary: 20000,
                    department: 'Logistics & Warehouse'
                },
                'super_admin'
            );

            expect(result.requiresApproval).toBe(false);
            expect(result.requiredApprovers).toHaveLength(0);
            expect(result.diffs).toHaveLength(0);
        });
    });

    describe('HR Cross-Department Approval Gates', () => {
        it('requires Executive/Compliance sign-off when HR edits legal name or age', () => {
            const result = evaluateEmployeeProfileChanges(
                mockEmployee,
                {
                    name: 'Abebe Kebede Bikila',
                    age: 32
                },
                'hr_manager'
            );

            expect(result.requiresApproval).toBe(true);
            expect(result.requiredApprovers).toContain('Executive / Compliance');
            expect(result.governanceCategories).toContain('identity');
            expect(result.diffs).toHaveLength(2);
        });

        it('requires Finance Department sign-off when HR alters base salary', () => {
            const result = evaluateEmployeeProfileChanges(
                mockEmployee,
                {
                    salary: 18000
                },
                'hr'
            );

            expect(result.requiresApproval).toBe(true);
            expect(result.requiredApprovers).toContain('Finance Department');
            expect(result.governanceCategories).toContain('compensation');
            expect(result.diffs[0].field).toBe('salary');
            expect(result.diffs[0].oldValue).toBe(15000);
            expect(result.diffs[0].newValue).toBe(18000);
        });

        it('requires receiving Department Head sign-off when HR reassigns department', () => {
            const warehouseTransfer = evaluateEmployeeProfileChanges(
                mockEmployee,
                {
                    department: 'Logistics & Warehouse'
                },
                'hr_manager'
            );

            expect(warehouseTransfer.requiresApproval).toBe(true);
            expect(warehouseTransfer.requiredApprovers).toContain('Logistics & Warehouse');

            const procurementTransfer = evaluateEmployeeProfileChanges(
                mockEmployee,
                {
                    department: 'Procurement'
                },
                'hr_manager'
            );

            expect(procurementTransfer.requiresApproval).toBe(true);
            expect(procurementTransfer.requiredApprovers).toContain('Procurement');
        });

        it('requires Operations Management sign-off when HR changes role clearance', () => {
            const roleChange = evaluateEmployeeProfileChanges(
                mockEmployee,
                {
                    role: 'store_supervisor'
                },
                'hr'
            );

            expect(roleChange.requiresApproval).toBe(true);
            expect(roleChange.requiredApprovers).toContain('Operations Management');
            expect(roleChange.governanceCategories).toContain('role_privilege');
        });

        it('allows direct update with 0 approvals when HR only modifies contact details', () => {
            const contactUpdate = evaluateEmployeeProfileChanges(
                mockEmployee,
                {
                    phone: '+251999887766',
                    address: 'CMC Michael, Apt 3B',
                    emergencyContact: 'Brother (+251911001122)',
                    specialization: 'High Shrink Audits'
                },
                'hr'
            );

            expect(contactUpdate.requiresApproval).toBe(false);
            expect(contactUpdate.requiredApprovers).toHaveLength(0);
            expect(contactUpdate.diffs).toHaveLength(0);
        });

        it('aggregates multiple required authorities for composite requests', () => {
            const compositeChange = evaluateEmployeeProfileChanges(
                mockEmployee,
                {
                    name: 'Abebe B.',
                    salary: 22000,
                    department: 'Logistics & Warehouse'
                },
                'hr'
            );

            expect(compositeChange.requiresApproval).toBe(true);
            expect(compositeChange.requiredApprovers).toContain('Executive / Compliance');
            expect(compositeChange.requiredApprovers).toContain('Finance Department');
            expect(compositeChange.requiredApprovers).toContain('Logistics & Warehouse');
            expect(compositeChange.diffs).toHaveLength(3);
        });
    });

    describe('Segregation of Duties Authorization Checks', () => {
        it('grants CEO universal authorization to approve any department request', () => {
            expect(canApproveChangeRequest('super_admin', 'Finance Department')).toBe(true);
            expect(canApproveChangeRequest('super_admin', 'Logistics & Warehouse')).toBe(true);
            expect(canApproveChangeRequest('super_admin', 'Executive / Compliance')).toBe(true);
        });

        it('authorizes Finance Manager only for Finance requests', () => {
            expect(canApproveChangeRequest('finance_manager', 'Finance Department')).toBe(true);
            expect(canApproveChangeRequest('finance_manager', 'Logistics & Warehouse')).toBe(false);
            expect(canApproveChangeRequest('finance_manager', 'Executive / Compliance')).toBe(false);
        });

        it('authorizes Warehouse Manager only for Warehouse requests', () => {
            expect(canApproveChangeRequest('warehouse_manager', 'Logistics & Warehouse')).toBe(true);
            expect(canApproveChangeRequest('warehouse_manager', 'Finance Department')).toBe(false);
        });

        it('denies standard HR roles from approving governed requests', () => {
            expect(canApproveChangeRequest('hr', 'Finance Department')).toBe(false);
            expect(canApproveChangeRequest('hr_manager', 'Finance Department')).toBe(false);
            expect(canApproveChangeRequest('cashier', 'Finance Department')).toBe(false);
        });

        it('enforces regional boundary: Regional Manager can only approve requests in their assigned region', () => {
            expect(canApproveChangeRequest('regional_manager', 'Operations Management', {
                userRegionCode: 'ke_nairobi',
                targetRegionCode: 'ke_nairobi'
            })).toBe(true);

            expect(canApproveChangeRequest('regional_manager', 'Operations Management', {
                userRegionCode: 'ke_nairobi',
                targetRegionCode: 'ke_mombasa'
            })).toBe(false);

            expect(canApproveChangeRequest('super_admin', 'Operations Management', {
                userRegionCode: 'ke_nairobi',
                targetRegionCode: 'ke_mombasa'
            })).toBe(true);
        });
    });
});
