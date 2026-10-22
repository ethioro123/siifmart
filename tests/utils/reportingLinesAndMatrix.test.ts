import { describe, it, expect } from 'vitest';
import {
    ROLE_REPORTING_REGISTRY,
    getRoleReportingMeta,
    HIERARCHY_LEVEL_CONFIGS
} from '../../components/org-chart/hooks/orgReportingLines';

describe('Dual-Control Reporting Lines & Supervisory Matrix Engine', () => {
    it('verifies Level 1 Global Executive and Level 2 Country Executive Leadership roles', () => {
        const ceo = getRoleReportingMeta('super_admin');
        expect(ceo.level).toBe(1);
        expect(ceo.levelCategory).toBe('executive');
        expect(ceo.reportsToRole).toBeNull();
        expect(ceo.isManagerial).toBe(true);
        expect(ceo.managesRoles.length).toBeGreaterThan(0);

        const cmd = getRoleReportingMeta('country_managing_director');
        expect(cmd.level).toBe(2);
        expect(cmd.levelCategory).toBe('executive');
        expect(cmd.reportsToRole).toBe('super_admin');
        expect(cmd.isManagerial).toBe(true);
    });

    it('verifies Level 3 Corporate Directorates, Level 4 Regional Directors, and Level 5 Regional Functional Leads', () => {
        const l3Directors = [
            'operations_manager',
            'finance_manager',
            'hr_manager',
            'procurement_manager',
            'supply_chain_manager',
            'merchandising_manager'
        ];

        l3Directors.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(3);
            expect(meta.levelCategory).toBe('director');
            expect(meta.isManagerial).toBe(true);
            expect(meta.reportsToLabel).toBeTruthy();
        });

        const rm = getRoleReportingMeta('regional_manager');
        expect(rm.level).toBe(4);
        expect(rm.levelCategory).toBe('director');
        expect(rm.isManagerial).toBe(true);

        const l5Leads = [
            'regional_procurement_lead',
            'regional_finance_officer',
            'regional_merchandising_lead',
            'regional_hr_officer',
            'regional_logistics_lead',
            'regional_security_supervisor'
        ];

        l5Leads.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(5);
            expect(meta.levelCategory).toBe('director');
            expect(meta.isManagerial).toBe(true);
        });
    });

    it('verifies Level 6 Facility Captains, Level 7 Dept Managers & Level 8 Floor Supervisors', () => {
        const l6Captains = ['store_manager', 'warehouse_manager'];
        l6Captains.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(6);
            expect(meta.levelCategory).toBe('supervisor');
            expect(meta.isManagerial).toBe(true);
        });

        const l7Managers = [
            'logistics_manager',
            'inventory_manager',
            'security_manager',
            'dispatch_manager',
            'cs_manager',
            'vendor_relations_manager'
        ];
        l7Managers.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(7);
            expect(meta.levelCategory).toBe('supervisor');
            expect(meta.isManagerial).toBe(true);
        });

        const l8Supervisors = [
            'assistant_manager',
            'shift_lead',
            'store_supervisor',
            'fleet_maintenance_supervisor'
        ];
        l8Supervisors.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(8);
            expect(meta.levelCategory).toBe('supervisor');
            expect(meta.isManagerial).toBe(true);
            expect(meta.reportsToRole).toBeTruthy();
            expect(meta.reportsToLabel).toBeTruthy();
        });
    });

    it('verifies Level 9 Specialists & Level 10 Frontline Workforce', () => {
        const l9Specialists = [
            'dispatcher',
            'demand_planner',
            'replenishment_planner',
            'buyer',
            'auditor',
            'accountant',
            'treasury_officer',
            'tax_compliance_officer',
            'credit_control_officer',
            'data_analyst',
            'payroll_specialist',
            'talent_recruiter',
            'training_coordinator',
            'loss_prevention',
            'it_support'
        ];

        l9Specialists.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(9);
            expect(meta.levelCategory).toBe('specialist');
            expect(meta.isManagerial).toBe(false);
            expect(meta.reportsToRole).toBeTruthy();
            expect(meta.reportsToLabel).toBeTruthy();
        });

        const l10Frontline = [
            'cashier',
            'sales_associate',
            'stock_clerk',
            'merchandiser',
            'returns_clerk',
            'receiver',
            'picker',
            'packer',
            'forklift_operator',
            'driver',
            'inventory_specialist'
        ];

        l10Frontline.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(10);
            expect(meta.levelCategory).toBe('specialist');
            expect(meta.isManagerial).toBe(false);
            expect(meta.reportsToRole).toBeTruthy();
            expect(meta.reportsToLabel).toBeTruthy();
        });
    });

    it('validates critical Dotted-Line functional compliance connections', () => {
        // Cashier -> Finance Manager
        const cashier = getRoleReportingMeta('cashier');
        expect(cashier.dottedLineRole).toBe('finance_manager');
        expect(cashier.dottedLineLabel).toContain('Finance');

        // Receiver -> Procurement Manager / Inbound QC
        const receiver = getRoleReportingMeta('receiver');
        expect(receiver.dottedLineRole).toBe('procurement_manager');
        expect(receiver.dottedLineLabel).toContain('Procurement');

        // Driver -> Fleet Maintenance Supervisor
        const driver = getRoleReportingMeta('driver');
        expect(driver.dottedLineRole).toBe('fleet_maintenance_supervisor');
        expect(driver.dottedLineLabel).toContain('Fleet Maint.');

        // Inventory Specialist -> Finance / Internal Auditor
        const invSpec = getRoleReportingMeta('inventory_specialist');
        expect(invSpec.dottedLineRole).toBe('finance_manager');
        expect(invSpec.dottedLineLabel).toContain('Auditor');

        // Payroll Specialist -> Finance Manager
        const payroll = getRoleReportingMeta('payroll_specialist');
        expect(payroll.dottedLineRole).toBe('finance_manager');
        expect(payroll.dottedLineLabel).toContain('Finance');

        // Store Merchandiser -> Corporate Merchandising Manager
        const storeMerch = getRoleReportingMeta('merchandiser');
        expect(storeMerch.dottedLineRole).toBe('merchandising_manager');
        expect(storeMerch.dottedLineLabel).toContain('Merchandising');
    });

    it('verifies Hierarchy Level Configs for L1 through L10', () => {
        for (let lvl = 1; lvl <= 10; lvl++) {
            expect(HIERARCHY_LEVEL_CONFIGS[lvl]).toBeDefined();
        }

        expect(HIERARCHY_LEVEL_CONFIGS[1].badge).toBe('L1 Global Exec');
        expect(HIERARCHY_LEVEL_CONFIGS[2].badge).toBe('L2 Country Exec');
        expect(HIERARCHY_LEVEL_CONFIGS[3].badge).toBe('L3 HQ Director');
        expect(HIERARCHY_LEVEL_CONFIGS[4].badge).toBe('L4 Regional Dir');
        expect(HIERARCHY_LEVEL_CONFIGS[5].badge).toBe('L5 Regional Lead');
        expect(HIERARCHY_LEVEL_CONFIGS[6].badge).toBe('L6 Facility Captain');
        expect(HIERARCHY_LEVEL_CONFIGS[7].badge).toBe('L7 Dept Manager');
        expect(HIERARCHY_LEVEL_CONFIGS[8].badge).toBe('L8 Supervisor');
        expect(HIERARCHY_LEVEL_CONFIGS[9].badge).toBe('L9 Specialist');
        expect(HIERARCHY_LEVEL_CONFIGS[10].badge).toBe('L10 Frontline');
    });

    it('gracefully handles unknown roles with safe fallback', () => {
        const unknown = getRoleReportingMeta('unknown_custom_role');
        expect(unknown.level).toBe(10);
        expect(unknown.reportsToLabel).toBeTruthy();
        expect(unknown.isManagerial).toBe(false);
    });
});
