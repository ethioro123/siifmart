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
        expect(groupCoo.reportsToLabel).toContain('group_ceo');
        expect(groupCoo.isManagerial).toBe(true);
        expect(groupCoo.managesRoles.length).toBeGreaterThan(0);

        const groupCfo = getRoleReportingMeta('group_cfo');
        expect(groupCfo.level).toBe(1);
        expect(groupCfo.levelCategory).toBe('executive');
        expect(groupCfo.reportsToRole).toBe('group_ceo');
        expect(groupCfo.reportsToLabel).toContain('group_ceo');
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

        const ceo = getRoleReportingMeta('group_ceo');
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
        expect(cmd.managesRoles).toContain('country_operations_director');
        expect(cmd.managesRoles).toContain('country_finance_director');
        expect(cmd.managesRoles).toContain('country_commercial_director');
        expect(cmd.managesRoles).toContain('country_supply_chain_director');
        expect(cmd.managesRoles).toContain('country_hr_director');
        expect(cmd.managesRoles).toContain('country_technology_director');
        expect(cmd.managesRoles).toContain('country_compliance_manager');
    });

    it('verifies Level 2 Country Functional Directors solid and dotted-line reporting structure', () => {
        const countryRoles = [
            { role: 'country_operations_director', dotted: 'group_coo' },
            { role: 'country_finance_director', dotted: 'group_cfo' },
            { role: 'country_commercial_director', dotted: 'group_cco' },
            { role: 'country_supply_chain_director', dotted: 'group_csco' },
            { role: 'country_hr_director', dotted: 'group_chro' },
            { role: 'country_technology_director', dotted: 'group_cto' },
            { role: 'country_compliance_manager', dotted: 'group_cae' }
        ];

        countryRoles.forEach(({ role, dotted }) => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(2);
            expect(meta.levelCategory).toBe('director');
            expect(meta.reportsToRole).toBe('country_managing_director');
            expect(meta.dottedLineRole).toBe(dotted);
            expect(meta.isManagerial).toBe(true);
            expect(meta.managesRoles.length).toBeGreaterThan(0);
        });
    });

    it('verifies Level 3 Corporate Directorates, Level 4 Regional Directors, and Level 5 Regional Department Managers', () => {
        const l3Directors = ['country_operations_director', 'country_finance_director', 'country_hr_director', 'country_commercial_director', 'country_supply_chain_director'];

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
        expect(rm.reportsToRole).toBe('country_operations_director');
        expect(rm.isManagerial).toBe(true);

        const aom = getRoleReportingMeta('area_operations_manager');
        expect(aom.level).toBe(4);
        expect(aom.levelCategory).toBe('director');
        expect(aom.reportsToRole).toBe('regional_operations_manager');
        expect(aom.dottedLineRole).toBe('country_operations_director');
        expect(aom.isManagerial).toBe(true);

        const rscm = getRoleReportingMeta('regional_supply_chain_manager');
        expect(rscm.level).toBe(5);
        expect(rscm.levelCategory).toBe('director');
        expect(rscm.reportsToRole).toBe('country_supply_chain_director');
        expect(rscm.dottedLineRole).toBe('regional_operations_manager');
        expect(rscm.isManagerial).toBe(true);

        const l5Leads = ['regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_merchandising_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager'];

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

        const l7Managers = ['warehouse_operations_manager', 'transport_fleet_manager', 'regional_supply_chain_manager', 'inventory_manager', 'regional_security_manager', 'dispatch_supervisor', 'cs_manager', 'vendor_relations_manager'];
        l7Managers.forEach(role => {
            const meta = getRoleReportingMeta(role);
            expect(meta.level).toBe(7);
            expect(meta.levelCategory).toBe('supervisor');
            expect(meta.isManagerial).toBe(true);
        });

        const l8Supervisors = ['assistant_store_manager', 'shift_supervisor', 'receiving_supervisor', 'stock_control_supervisor', 'pos_supervisor', 'inventory_control_supervisor', 'putaway_replenishment_supervisor', 'picking_supervisor', 'packing_supervisor', 'dispatch_supervisor', 'returns_waste_supervisor', 'fleet_maintenance_supervisor', 'receiving_team_leader', 'picking_team_leader', 'packing_team_leader', 'dispatch_team_leader'];
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

        const l10Frontline = ['cashier', 'sales_associate', 'store_associate', 'stock_clerk', 'merchandiser', 'returns_clerk', 'receiver', 'receiving_operator', 'putaway_operator', 'replenishment_operator', 'inventory_controller', 'stock_counter', 'dispatch_operator', 'returns_operator', 'fleet_mechanic', 'picker', 'packer', 'forklift_operator', 'driver', 'inventory_specialist'];

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
        // Cashier -> Regional Finance Manager (Daily Drawer Reconciliations & Till Limits)
        const cashier = getRoleReportingMeta('cashier');
        expect(cashier.reportsToRole).toBe('pos_supervisor');
        expect(cashier.dottedLineRole).toBe('regional_finance_manager');
        expect(cashier.dottedLineLabel).toContain('Finance');

        // Store Merchandiser -> Regional Merchandising Manager
        const storeMerch = getRoleReportingMeta('merchandiser');
        expect(storeMerch.reportsToRole).toBe('shift_supervisor');
        expect(storeMerch.dottedLineRole).toBe('regional_merchandising_manager');
        expect(storeMerch.dottedLineLabel).toContain('Merchandising');

        // Store Facility & Floor Supervisors
        const sm = getRoleReportingMeta('store_manager');
        expect(sm.reportsToRole).toBe('area_operations_manager');
        expect(sm.dottedLineRole).toBe('regional_operations_manager');

        const asm = getRoleReportingMeta('assistant_store_manager');
        expect(asm.reportsToRole).toBe('store_manager');
        expect(asm.dottedLineRole).toBe('area_operations_manager');

        const posSup = getRoleReportingMeta('pos_supervisor');
        expect(posSup.reportsToRole).toBe('assistant_store_manager');
        expect(posSup.dottedLineRole).toBe('regional_finance_manager');

        const stockSup = getRoleReportingMeta('stock_control_supervisor');
        expect(stockSup.reportsToRole).toBe('assistant_store_manager');
        expect(stockSup.dottedLineRole).toBe('regional_security_manager');

        const shiftSup = getRoleReportingMeta('shift_supervisor');
        expect(shiftSup.reportsToRole).toBe('assistant_store_manager');
        expect(shiftSup.dottedLineRole).toBe('store_manager');

        const storeSup = getRoleReportingMeta('shift_supervisor');
        expect(storeSup.reportsToRole).toBe('assistant_store_manager');
        expect(storeSup.dottedLineRole).toBe('store_manager');

        // Warehouse & Supply Chain Leadership Matrix
        const wm = getRoleReportingMeta('warehouse_manager');
        expect(wm.reportsToRole).toBe('regional_supply_chain_manager');
        expect(wm.dottedLineRole).toBe('country_supply_chain_director');

        const wom = getRoleReportingMeta('warehouse_operations_manager');
        expect(wom.reportsToRole).toBe('warehouse_manager');
        expect(wom.dottedLineRole).toBe('regional_supply_chain_manager');

        const tfm = getRoleReportingMeta('transport_fleet_manager');
        expect(tfm.reportsToRole).toBe('regional_supply_chain_manager');
        expect(tfm.dottedLineRole).toBe('warehouse_manager');

        const ics = getRoleReportingMeta('inventory_control_supervisor');
        expect(ics.reportsToRole).toBe('warehouse_manager');
        expect(ics.dottedLineRole).toBe('country_compliance_manager');

        const prs = getRoleReportingMeta('putaway_replenishment_supervisor');
        expect(prs.reportsToRole).toBe('warehouse_operations_manager');
        expect(prs.dottedLineRole).toBe('warehouse_manager');

        const ps = getRoleReportingMeta('picking_supervisor');
        expect(ps.reportsToRole).toBe('warehouse_operations_manager');
        expect(ps.dottedLineRole).toBe('warehouse_manager');

        const pks = getRoleReportingMeta('packing_supervisor');
        expect(pks.reportsToRole).toBe('warehouse_operations_manager');
        expect(pks.dottedLineRole).toBe('warehouse_manager');

        const ds = getRoleReportingMeta('dispatch_supervisor');
        expect(ds.reportsToRole).toBe('transport_fleet_manager');
        expect(ds.dottedLineRole).toBe('warehouse_manager');

        const rws = getRoleReportingMeta('returns_waste_supervisor');
        expect(rws.reportsToRole).toBe('warehouse_manager');
        expect(rws.dottedLineRole).toBe('country_compliance_manager');

        // Receiver -> Receiving Supervisor / Inbound QC
        const receiver = getRoleReportingMeta('receiver');
        expect(receiver.dottedLineRole).toBe('receiving_supervisor');
        expect(receiver.dottedLineLabel).toContain('Receiving Supervisor');

        // Driver -> Fleet Maintenance Supervisor
        const driver = getRoleReportingMeta('driver');
        expect(driver.dottedLineRole).toBe('fleet_maintenance_supervisor');
        expect(driver.dottedLineLabel).toContain('Fleet Maint.');

        // Inventory Specialist -> Finance / Internal Auditor
        const invSpec = getRoleReportingMeta('inventory_specialist');
        expect(invSpec.dottedLineRole).toBe('country_finance_director');
        expect(invSpec.dottedLineLabel).toContain('Auditor');

        // Payroll Specialist -> Head of Finance
        const payroll = getRoleReportingMeta('payroll_specialist');
        expect(payroll.dottedLineRole).toBe('country_finance_director');
        expect(payroll.dottedLineLabel).toContain('Finance');

        // Head of Finance -> Group CFO (solid) & Country MD (dotted)
        const hof = getRoleReportingMeta('country_finance_director');
        expect(hof.reportsToRole).toBe('group_cfo');
        expect(hof.dottedLineRole).toBe('country_managing_director');

        // Head of Procurement -> Group CCO (solid)
        const hop = getRoleReportingMeta('country_commercial_director');
        expect(hop.reportsToRole).toBe('group_cco');

        // Head of Supply Chain -> Group CSCO (solid)
        const hosc = getRoleReportingMeta('country_supply_chain_director');
        expect(hosc.reportsToRole).toBe('group_csco');

        // Head of HR -> Group CHRO (solid)
        const hohr = getRoleReportingMeta('country_hr_director');
        expect(hohr.reportsToRole).toBe('group_chro');

        // Head of IT -> Group CTO (solid)
        const hoit = getRoleReportingMeta('country_technology_director');
        expect(hoit.reportsToRole).toBe('group_cto');

        // Head of Audit -> Group CAE (solid)
        const hoa = getRoleReportingMeta('country_compliance_manager');
        expect(hoa.reportsToRole).toBe('group_cae');

        // Regional Finance Manager -> Country Finance Director (solid) & Regional Operations Manager (dotted)
        const rfm = getRoleReportingMeta('regional_finance_manager');
        expect(rfm.reportsToRole).toBe('country_finance_director');
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
