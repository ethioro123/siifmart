// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
    calculateNetSalary,
    generateEmployeePayslips,
    getEmployeeDocuments,
    addEmployeeDocument,
    removeEmployeeDocument,
    getEmployeeLeaveRequests,
    addEmployeeLeaveRequest,
    updateEmployeeLeaveRequestStatus
} from '../../utils/employeeProfileData';
import { Employee } from '../../types';

describe('employeeProfileData utils', () => {
    const mockEmployee: Employee = {
        id: 'emp-test-01',
        code: 'EMP-001',
        name: 'Abebe Bikila',
        role: 'cashier',
        email: 'abebe@siifmart.com',
        phone: '+251 91 123 4567',
        status: 'Active',
        joinDate: '2025-01-10',
        department: 'Retail Operations',
        avatar: '',
        performanceScore: 92,
        siteId: 'site-01',
        salary: 10000
    };

    beforeEach(() => {
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    describe('calculateNetSalary', () => {
        it('should correctly calculate gross, tax (15%), pension (7%), and net take-home salary', () => {
            const result = calculateNetSalary(10000);
            expect(result.grossSalary).toBe(10000);
            expect(result.taxDeduction).toBe(1500); // 15% of 10000
            expect(result.pensionDeduction).toBe(700); // 7% of 10000
            expect(result.netSalary).toBe(7800); // 10000 - 1500 - 700
        });

        it('should handle zero or undefined salary gracefully', () => {
            const zeroResult = calculateNetSalary(0);
            expect(zeroResult.grossSalary).toBe(0);
            expect(zeroResult.taxDeduction).toBe(0);
            expect(zeroResult.pensionDeduction).toBe(0);
            expect(zeroResult.netSalary).toBe(0);
        });
    });

    describe('generateEmployeePayslips', () => {
        it('should generate 4 recent payslips for the employee', () => {
            const payslips = generateEmployeePayslips(mockEmployee, 'ETB');
            expect(payslips).toHaveLength(4);
            expect(payslips[0].grossSalary).toBe(10000);
            expect(payslips[0].netSalary).toBe(7800);
            expect(payslips[0].status).toBe('Disbursed');
            expect(payslips[0].id).toContain('SLIP-');
        });
    });

    describe('Documents Storage', () => {
        it('should provide default documents when storage is empty', () => {
            const docs = getEmployeeDocuments('emp-test-01');
            expect(docs.length).toBeGreaterThan(0);
            expect(docs[0].name).toContain('Employment_Contract');
        });

        it('should add a document and persist in storage', () => {
            const newDoc = addEmployeeDocument('emp-test-01', 'Medical_Report.pdf', '1.2 MB', 'data:application/pdf;base64,123');
            expect(newDoc.name).toBe('Medical_Report.pdf');
            expect(newDoc.size).toBe('1.2 MB');

            const docs = getEmployeeDocuments('emp-test-01');
            expect(docs.some(d => d.id === newDoc.id)).toBe(true);
        });

        it('should remove a document', () => {
            const newDoc = addEmployeeDocument('emp-test-01', 'Delete_Me.pdf', '500 KB');
            removeEmployeeDocument('emp-test-01', newDoc.id);

            const docs = getEmployeeDocuments('emp-test-01');
            expect(docs.some(d => d.id === newDoc.id)).toBe(false);
        });
    });

    describe('Leave Requests Storage & Actions', () => {
        it('should return empty leaves when no records exist', () => {
            const leaves = getEmployeeLeaveRequests('emp-test-01');
            expect(leaves).toEqual([]);
        });

        it('should add a leave request and compute number of days', () => {
            const req = addEmployeeLeaveRequest('emp-test-01', {
                type: 'Annual Leave',
                startDate: '2026-04-10',
                endDate: '2026-04-14',
                reason: 'Family visit'
            });

            expect(req.status).toBe('Pending');
            expect(req.days).toBe(5); // 10th to 14th inclusive
            expect(req.reason).toBe('Family visit');

            const leaves = getEmployeeLeaveRequests('emp-test-01');
            expect(leaves.some(l => l.id === req.id)).toBe(true);
        });

        it('should update status to Approved or Rejected', () => {
            const req = addEmployeeLeaveRequest('emp-test-01', {
                type: 'Sick Leave',
                startDate: '2026-05-01',
                endDate: '2026-05-02'
            });

            updateEmployeeLeaveRequestStatus('emp-test-01', req.id, 'Approved');
            let updatedLeaves = getEmployeeLeaveRequests('emp-test-01');
            expect(updatedLeaves.find(l => l.id === req.id)?.status).toBe('Approved');

            updateEmployeeLeaveRequestStatus('emp-test-01', req.id, 'Rejected');
            updatedLeaves = getEmployeeLeaveRequests('emp-test-01');
            expect(updatedLeaves.find(l => l.id === req.id)?.status).toBe('Rejected');
        });
    });
});
