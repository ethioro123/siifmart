import { describe, it, expect } from 'vitest';
import {
    ROLE_REPORTING_REGISTRY,
    getRoleReportingMeta,
    HIERARCHY_LEVEL_CONFIGS
} from '../../components/org-chart/hooks/orgReportingLines';

describe('Dual-Control Reporting Lines & Supervisory Matrix Engine', () => {
    it('verifies Level 1 Executive Leadership roles', () => {
        const ceo = getRoleReportingMeta('super_admin');
        expect(ceo.level).toBe(1);
        expect(ceo.levelCategory).toBe('executive');
        expect(ceo.reportsToRole).toBeNull();
        expect(ceo.isManagerial).toBe(true);
        expect(ceo.managesRoles.length).toBeGreaterThan(0);
    });

    it('verifies Level 2 Corporate Directorates and reporting to CEO', () => {
        const directors = [
            'regional_manager',
            'operations_manager',
            'finance_manager',
            'hr_manager',
            'procurement_manager',
            'supply_chain_manager',
            'merchandising_manager'
        ];

        directors.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(2);
            expect(meta.levelCategory).toBe('director');
            expect(meta.isManagerial).toBe(true);
            expect(meta.reportsToLabel).toBeTruthy();
        });
    });

    it('verifies Level 3 Facility Operations Managers & Floor Supervisors', () => {
        const supervisors = [
            'store_manager',
            'warehouse_manager',
            'logistics_manager',
            'inventory_manager',
            'security_manager',
            'dispatch_manager',
            'assistant_manager',
            'shift_lead',
            'store_supervisor',
            'fleet_maintenance_supervisor'
        ];

        supervisors.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(3);
            expect(meta.levelCategory).toBe('supervisor');
            expect(meta.isManagerial).toBe(true);
            expect(meta.reportsToRole).toBeTruthy();
            expect(meta.reportsToLabel).toBeTruthy();
        });
    });

    it('verifies Level 4 Operational Specialists & Frontline Workforce', () => {
        const specialists = [
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
            'dispatcher',
            'inventory_specialist',
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

        specialists.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(4);
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

    it('verifies Hierarchy Level Configs for L1 through L4', () => {
        expect(HIERARCHY_LEVEL_CONFIGS[1]).toBeDefined();
        expect(HIERARCHY_LEVEL_CONFIGS[2]).toBeDefined();
        expect(HIERARCHY_LEVEL_CONFIGS[3]).toBeDefined();
        expect(HIERARCHY_LEVEL_CONFIGS[4]).toBeDefined();

        expect(HIERARCHY_LEVEL_CONFIGS[1].badge).toBe('L1 Executive');
        expect(HIERARCHY_LEVEL_CONFIGS[2].badge).toBe('L2 Director');
        expect(HIERARCHY_LEVEL_CONFIGS[3].badge).toBe('L3 Supervisor');
        expect(HIERARCHY_LEVEL_CONFIGS[4].badge).toBe('L4 Specialist');
    });

    it('gracefully handles unknown roles with safe fallback', () => {
        const unknown = getRoleReportingMeta('unknown_custom_role');
        expect(unknown.level).toBe(4);
        expect(unknown.reportsToLabel).toBeTruthy();
        expect(unknown.isManagerial).toBe(false);
    });
});
