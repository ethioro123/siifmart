import { describe, it, expect } from 'vitest';
import {
    ROLE_REPORTING_REGISTRY,
    getRoleReportingMeta,
    HIERARCHY_LEVEL_CONFIGS
} from '../../components/org-chart/hooks/orgReportingLines';

describe('Dual-Control Reporting Lines & Supervisory Matrix Engine', () => {
    it('verifies Level 1 Global Executive and Level 2 Country Executive Leadership roles', () => {
        const groupCeo = getRoleReportingMeta('group_ceo');
        expect(groupCeo.level).toBe(1);
        expect(groupCeo.levelCategory).toBe('executive');
        expect(groupCeo.reportsToRole).toBeNull();
        expect(groupCeo.reportsToLabel).toContain('Board');
        expect(groupCeo.isManagerial).toBe(true);
        expect(groupCeo.managesRoles.length).toBeGreaterThan(0);

        const groupCoo = getRoleReportingMeta('group_coo');
        expect(groupCoo.level).toBe(1);
        expect(groupCoo.levelCategory).toBe('executive');
        expect(groupCoo.reportsToRole).toBe('group_ceo');
        expect(groupCoo.reportsToLabel).toContain('CEO');
        expect(groupCoo.isManagerial).toBe(true);
        expect(groupCoo.managesRoles.length).toBeGreaterThan(0);

        const groupCfo = getRoleReportingMeta('group_cfo');
        expect(groupCfo.level).toBe(1);
        expect(groupCfo.levelCategory).toBe('executive');
        expect(groupCfo.reportsToRole).toBe('group_ceo');
        expect(groupCfo.reportsToLabel).toContain('CEO');
        expect(groupCfo.isManagerial).toBe(true);
        expect(groupCfo.managesRoles.length).toBeGreaterThan(0);

        const groupCco = getRoleReportingMeta('group_cco');
        expect(groupCco.level).toBe(1);
        expect(groupCco.reportsToRole).toBe('group_ceo');
        expect(groupCco.isManagerial).toBe(true);

        const groupCsco = getRoleReportingMeta('group_csco');
        expect(groupCsco.level).toBe(1);
        expect(groupCsco.reportsToRole).toBe('group_ceo');
        expect(groupCsco.isManagerial).toBe(true);

        const groupChro = getRoleReportingMeta('group_chro');
        expect(groupChro.level).toBe(1);
        expect(groupChro.reportsToRole).toBe('group_ceo');
        expect(groupChro.isManagerial).toBe(true);

        const groupCto = getRoleReportingMeta('group_cto');
        expect(groupCto.level).toBe(1);
        expect(groupCto.reportsToRole).toBe('group_ceo');
        expect(groupCto.isManagerial).toBe(true);

        const groupCio = getRoleReportingMeta('group_cio');
        expect(groupCio.level).toBe(1);
        expect(groupCio.reportsToRole).toBe('group_ceo');
        expect(groupCio.isManagerial).toBe(true);

        const groupClco = getRoleReportingMeta('group_clco');
        expect(groupClco.level).toBe(1);
        expect(groupClco.reportsToRole).toBe('group_ceo');
        expect(groupClco.isManagerial).toBe(true);

        const groupCae = getRoleReportingMeta('group_cae');
        expect(groupCae.level).toBe(1);
        expect(groupCae.reportsToRole).toBeNull();
        expect(groupCae.reportsToLabel).toContain('Audit Committee');
        expect(groupCae.dottedLineRole).toBe('group_ceo');
        expect(groupCae.isManagerial).toBe(true);

        const ceo = getRoleReportingMeta('super_admin');
        expect(ceo.level).toBe(1);
        expect(ceo.levelCategory).toBe('executive');
        expect(ceo.reportsToRole).toBeNull();
        expect(ceo.isManagerial).toBe(true);
        expect(ceo.managesRoles.length).toBeGreaterThan(0);

        const cmd = getRoleReportingMeta('country_managing_director');
        expect(cmd.level).toBe(2);
        expect(cmd.levelCategory).toBe('executive');
        expect(cmd.reportsToRole).toBe('group_coo');
        expect(cmd.isManagerial).toBe(true);
    });

    it('verifies Level 3 Corporate Directorates, Level 4 Regional Directors, and Level 5 Regional Department Managers', () => {
        const l3Directors = [
            'head_of_operations',
            'head_of_finance',
            'head_of_hr',
            'head_of_procurement',
            'head_of_supply_chain',
            'head_of_merchandising'
        ];

        l3Directors.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(3);
            expect(meta.levelCategory).toBe('director');
            expect(meta.isManagerial).toBe(true);
            expect(meta.reportsToLabel).toBeTruthy();
        });

        const rm = getRoleReportingMeta('regional_operations_manager');
        expect(rm.level).toBe(4);
        expect(rm.levelCategory).toBe('director');
        expect(rm.isManagerial).toBe(true);

        const l5Leads = [
            'regional_procurement_manager',
            'regional_finance_manager',
            'regional_merchandising_manager',
            'regional_hr_manager',
            'regional_logistics_manager',
            'regional_security_manager'
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
        // Cashier -> Head of Finance
        const cashier = getRoleReportingMeta('cashier');
        expect(cashier.dottedLineRole).toBe('head_of_finance');
        expect(cashier.dottedLineLabel).toContain('Finance');

        // Receiver -> Head of Procurement / Inbound QC
        const receiver = getRoleReportingMeta('receiver');
        expect(receiver.dottedLineRole).toBe('head_of_procurement');
        expect(receiver.dottedLineLabel).toContain('Procurement');

        // Driver -> Fleet Maintenance Supervisor
        const driver = getRoleReportingMeta('driver');
        expect(driver.dottedLineRole).toBe('fleet_maintenance_supervisor');
        expect(driver.dottedLineLabel).toContain('Fleet Maint.');

        // Inventory Specialist -> Finance / Internal Auditor
        const invSpec = getRoleReportingMeta('inventory_specialist');
        expect(invSpec.dottedLineRole).toBe('head_of_finance');
        expect(invSpec.dottedLineLabel).toContain('Auditor');

        // Payroll Specialist -> Head of Finance
        const payroll = getRoleReportingMeta('payroll_specialist');
        expect(payroll.dottedLineRole).toBe('head_of_finance');
        expect(payroll.dottedLineLabel).toContain('Finance');

        // Store Merchandiser -> Corporate Head of Merchandising
        const storeMerch = getRoleReportingMeta('merchandiser');
        expect(storeMerch.dottedLineRole).toBe('head_of_merchandising');
        expect(storeMerch.dottedLineLabel).toContain('Merchandising');

        // Head of Finance -> Group CFO (solid) & Country MD (dotted)
        const hof = getRoleReportingMeta('head_of_finance');
        expect(hof.reportsToRole).toBe('group_cfo');
        expect(hof.dottedLineRole).toBe('country_managing_director');

        // Head of Procurement -> Group CCO (solid)
        const hop = getRoleReportingMeta('head_of_procurement');
        expect(hop.reportsToRole).toBe('group_cco');

        // Head of Supply Chain -> Group CSCO (solid)
        const hosc = getRoleReportingMeta('head_of_supply_chain');
        expect(hosc.reportsToRole).toBe('group_csco');

        // Head of HR -> Group CHRO (solid)
        const hohr = getRoleReportingMeta('head_of_hr');
        expect(hohr.reportsToRole).toBe('group_chro');

        // Head of IT -> Group CTO (solid)
        const hoit = getRoleReportingMeta('head_of_it');
        expect(hoit.reportsToRole).toBe('group_cto');

        // Head of Audit -> Group CAE (solid)
        const hoa = getRoleReportingMeta('head_of_audit');
        expect(hoa.reportsToRole).toBe('group_cae');

        // Regional Finance Manager -> Head of Finance (solid) & Regional Operations Manager (dotted)
        const rfm = getRoleReportingMeta('regional_finance_manager');
        expect(rfm.reportsToRole).toBe('head_of_finance');
        expect(rfm.dottedLineRole).toBe('regional_operations_manager');
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
