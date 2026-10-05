import { Employee } from '../types';
import type { AccessAuditRecord } from '../types/hr-advanced';
import { calculateNetSalary } from '../utils/employeeProfileData';
import { systemLogsService } from './system-logs.service';
import { supabase } from '../lib/supabase';

export interface HeadcountSummary {
    totalHeadcount: number;
    activeCount: number;
    onLeaveCount: number;
    terminatedCount: number;
    byDepartment: Record<string, number>;
    bySite: Record<string, number>;
}

export interface StatutoryComplianceReport {
    countryCode: string;
    totalGrossPayroll: number;
    totalTaxWithheld: number;
    totalPensionContributions: number;
    totalShifContributions?: number;
    netPayrollDisbursed: number;
    employeeCount: number;
    statutoryAuthority: string;
}

export const hrAnalyticsService = {
    getHeadcountSummary(employees: Employee[], countryCode: string = 'ET'): HeadcountSummary {
        const country = (countryCode || 'ET').toUpperCase();
        const scoped = employees.filter(e => {
            const empCountry = (e.country || e.country_code || 'ET').toUpperCase();
            return empCountry === country;
        });

        const summary: HeadcountSummary = {
            totalHeadcount: scoped.length,
            activeCount: scoped.filter(e => e.status === 'Active').length,
            onLeaveCount: scoped.filter(e => e.status === 'On Leave').length,
            terminatedCount: scoped.filter(e => e.status === 'Terminated').length,
            byDepartment: {},
            bySite: {}
        };

        for (const e of scoped) {
            const dept = e.department || 'General Operations';
            summary.byDepartment[dept] = (summary.byDepartment[dept] || 0) + 1;

            const site = e.siteId || 'Unassigned';
            summary.bySite[site] = (summary.bySite[site] || 0) + 1;
        }

        return summary;
    },

    getStatutoryComplianceReport(employees: Employee[], countryCode: string = 'ET'): StatutoryComplianceReport {
        const country = (countryCode || 'ET').toUpperCase();
        const scoped = employees.filter(e => {
            const empCountry = (e.country || e.country_code || 'ET').toUpperCase();
            return empCountry === country && e.status === 'Active';
        });

        let totalGross = 0;
        let totalTax = 0;
        let totalPension = 0;
        let totalShif = 0;
        let totalNet = 0;

        for (const emp of scoped) {
            const salary = emp.salary || 12000;
            const res = calculateNetSalary(salary, country);
            totalGross += res.grossSalary;
            totalTax += res.taxDeduction;
            totalPension += res.pensionDeduction;
            totalNet += res.netSalary;
            if (country === 'KE') {
                totalShif += Math.round(salary * 0.0275);
            }
        }

        return {
            countryCode: country,
            totalGrossPayroll: totalGross,
            totalTaxWithheld: totalTax,
            totalPensionContributions: totalPension,
            totalShifContributions: country === 'KE' ? totalShif : undefined,
            netPayrollDisbursed: totalNet,
            employeeCount: scoped.length,
            statutoryAuthority: country === 'KE' ? 'Kenya Revenue Authority (KRA) & NSSF' : 'Ministry of Revenues (ERCA) & POESSA'
        };
    },

    getAccessAuditReport(
        employees: Employee[],
        countryCode: string = 'ET',
        dormantDaysThreshold: number = 30
    ): AccessAuditRecord[] {
        const country = (countryCode || 'ET').toUpperCase();
        const now = Date.now();
        const thresholdMs = dormantDaysThreshold * 24 * 60 * 60 * 1000;

        return employees
            .filter(e => ((e.country || e.country_code || 'ET').toUpperCase() === country))
            .map(e => {
                const lastLogin = e.lastLoginAt || e.last_login_at;
                let daysSinceLogin = 999;
                let isDormant = false;

                if (lastLogin) {
                    const loginTime = new Date(lastLogin).getTime();
                    daysSinceLogin = Math.floor((now - loginTime) / (24 * 60 * 60 * 1000));
                    isDormant = (now - loginTime) > thresholdMs;
                } else {
                    isDormant = true;
                }

                return {
                    user_id: e.id,
                    employee_id: e.id,
                    name: e.name,
                    email: e.email,
                    role: e.role,
                    site_id: e.siteId,
                    country_code: country,
                    last_login_at: lastLogin,
                    is_dormant: isDormant && e.status === 'Active',
                    days_since_last_login: daysSinceLogin,
                    deactivation_requested: false
                };
            })
            .sort((a, b) => b.days_since_last_login - a.days_since_last_login);
    },

    async requestAccountDeactivation(
        userId: string,
        requester: { id: string; name: string; role: string },
        reason: string
    ): Promise<boolean> {
        try {
            await systemLogsService.create({
                user_name: requester.name,
                action: 'ACCOUNT_DEACTIVATION_REQUESTED',
                module: 'Human Resources',
                details: JSON.stringify({
                    targetUserId: userId,
                    requestedBy: requester.name,
                    requesterRole: requester.role,
                    reason
                })
            });
            return true;
        } catch {
            return false;
        }
    }
};
