import { describe, it, expect } from 'vitest';
import { hrAnalyticsService } from '../../services/hr-analytics.service';
import { Employee } from '../../types';

describe('hrAnalyticsService Statutory Compliance & Dormancy Audit', () => {
    const mockEmployees: Partial<Employee>[] = [
        {
            id: 'emp-et-1',
            name: 'Abebe Bikila',
            email: 'abebe@siifmart.et',
            role: 'warehouse_manager',
            country: 'ET',
            status: 'Active',
            salary: 20000,
            lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        },
        {
            id: 'emp-et-2',
            name: 'Tola Bekele',
            email: 'tola@siifmart.et',
            role: 'receiver',
            country: 'ET',
            status: 'Active',
            salary: 10000,
            lastLoginAt: undefined // Never logged in -> Dormant
        },
        {
            id: 'emp-et-3',
            name: 'Dormant Staff',
            email: 'dormant@siifmart.et',
            role: 'picker',
            country: 'ET',
            status: 'Active',
            salary: 8000,
            lastLoginAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago -> Dormant
        },
        {
            id: 'emp-ke-1',
            name: 'Jomo Kenyatta',
            email: 'jomo@siifmart.ke',
            role: 'store_manager',
            country: 'KE',
            status: 'Active',
            salary: 50000,
            lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    it('calculates Ethiopian statutory compliance with ERCA progressive tax and 7% POESSA pension', () => {
        const report = hrAnalyticsService.getStatutoryComplianceReport(mockEmployees as Employee[], 'ET');
        expect(report.countryCode).toBe('ET');
        expect(report.employeeCount).toBe(3);
        expect(report.statutoryAuthority).toBe('Ministry of Revenues (ERCA) & POESSA');
        expect(report.totalGrossPayroll).toBe(38000);
        // POESSA Pension should be 7% of gross: 38000 * 0.07 = 2660
        expect(report.totalPensionContributions).toBe(2660);
        expect(report.netPayrollDisbursed).toBe(report.totalGrossPayroll - report.totalTaxWithheld - report.totalPensionContributions);
        expect(report.totalShifContributions).toBeUndefined();
    });

    it('calculates Kenyan statutory compliance with KRA PAYE, NSSF, and 2.75% SHIF', () => {
        const report = hrAnalyticsService.getStatutoryComplianceReport(mockEmployees as Employee[], 'KE');
        expect(report.countryCode).toBe('KE');
        expect(report.employeeCount).toBe(1);
        expect(report.statutoryAuthority).toBe('Kenya Revenue Authority (KRA) & NSSF');
        expect(report.totalGrossPayroll).toBe(50000);
        expect(report.totalShifContributions).toBe(Math.round(50000 * 0.0275));
    });

    it('correctly audits dormant accounts based on inactivity threshold and never-logged-in status', () => {
        const records = hrAnalyticsService.getAccessAuditReport(mockEmployees as Employee[], 'ET', 30);
        expect(records.length).toBe(3);

        const tola = records.find(r => r.user_id === 'emp-et-2');
        expect(tola?.is_dormant).toBe(true);
        expect(tola?.last_login_at).toBeUndefined();

        const dormant = records.find(r => r.user_id === 'emp-et-3');
        expect(dormant?.is_dormant).toBe(true);
        expect(dormant?.days_since_last_login).toBeGreaterThan(30);

        const abebe = records.find(r => r.user_id === 'emp-et-1');
        expect(abebe?.is_dormant).toBe(false);
    });

    it('strictly isolates Kenya and Ethiopia records across border boundaries', () => {
        const etReport = hrAnalyticsService.getStatutoryComplianceReport(mockEmployees as Employee[], 'ET');
        const keReport = hrAnalyticsService.getStatutoryComplianceReport(mockEmployees as Employee[], 'KE');

        expect(etReport.employeeCount).toBe(3);
        expect(keReport.employeeCount).toBe(1);
    });
});
