import { describe, it, expect } from 'vitest';
import { authService } from '../../services/auth.service';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import { APPROVAL_WORKFLOWS } from '../../services/permissions.service';
import { canEmployRole, canViewCostPrice } from '../../utils/roles';
import { canWorkerPerformJob } from '../../utils/fulfillmentRoles';

describe('Procurement Manager Role & Sourcing Governance Engine (SOP-MGT-024)', () => {
    describe('Module Access Controls', () => {
        it('allows procurement_manager to access procurement, pricing, and inventory modules', () => {
            expect(canAccessModule('procurement_manager', 'procurement')).toBe(true);
            expect(canAccessModule('procurement_manager', 'pricing')).toBe(true);
            expect(canAccessModule('procurement_manager', 'inventory')).toBe(true);
        });

        it('blocks procurement_manager from cashier POS and system settings modules', () => {
            expect(canAccessModule('procurement_manager', 'pos')).toBe(false);
            expect(canAccessModule('procurement_manager', 'settings')).toBe(false);
        });
    });

    describe('Segregation of Duties & Receiving Prohibitions (Zero Self-Receiving)', () => {
        it('strictly blocks procurement_manager from physical dock and PO receiving', () => {
            expect(authService.checkPermission('procurement_manager', 'procurement.receive')).toBe(false);
            expect(authService.checkPermission('procurement_manager', 'warehouse.receive')).toBe(false);
            expect(hasPermission('procurement_manager', 'RECEIVE_PO')).toBe(false);
        });

        it('strictly blocks sourcing buyer from physical dock and PO receiving', () => {
            expect(authService.checkPermission('buyer', 'procurement.receive')).toBe(false);
            expect(hasPermission('buyer', 'RECEIVE_PO')).toBe(false);
        });
    });

    describe('Authorized Sourcing & PO Governance Powers', () => {
        it('grants full PO lifecycle management permissions', () => {
            expect(authService.checkPermission('procurement_manager', 'procurement.view')).toBe(true);
            expect(authService.checkPermission('procurement_manager', 'procurement.create_po')).toBe(true);
            expect(authService.checkPermission('procurement_manager', 'procurement.edit_po')).toBe(true);
            expect(authService.checkPermission('procurement_manager', 'procurement.approve_po')).toBe(true);
            expect(authService.checkPermission('procurement_manager', 'procurement.delete_po')).toBe(true);

            expect(hasPermission('procurement_manager', 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission('procurement_manager', 'CREATE_PO')).toBe(true);
            expect(hasPermission('procurement_manager', 'APPROVE_PO')).toBe(true);
            expect(hasPermission('procurement_manager', 'DELETE_PO')).toBe(true);
            expect(hasPermission('procurement_manager', 'MANAGE_SUPPLIERS')).toBe(true);
        });

        it('grants cost price transparency and pricing view for margin protection', () => {
            expect(canViewCostPrice('procurement_manager')).toBe(true);
            expect(authService.checkPermission('procurement_manager', 'pricing.view')).toBe(true);
            expect(hasPermission('procurement_manager', 'ACCESS_PRICING')).toBe(true);
            expect(hasPermission('procurement_manager', 'VIEW_COST_PRICE')).toBe(true);

            // Prohibits unilateral retail shelf price alterations (Finance & Merchandising remit)
            expect(authService.checkPermission('procurement_manager', 'pricing.edit')).toBe(false);
            expect(authService.checkPermission('procurement_manager', 'pricing.approve_promo')).toBe(false);
            expect(hasPermission('procurement_manager', 'EDIT_PRICE')).toBe(false);
            expect(hasPermission('procurement_manager', 'APPROVE_PRICE_CHANGE')).toBe(false);
        });

        it('blocks live cashier till operations (Zero Live Till Operation)', () => {
            expect(authService.checkPermission('procurement_manager', 'pos.create_sale')).toBe(false);
            expect(authService.checkPermission('procurement_manager', 'pos.void_sale')).toBe(false);
            expect(authService.checkPermission('procurement_manager', 'pos.refund')).toBe(false);
            expect(hasPermission('procurement_manager', 'PROCESS_SALE')).toBe(false);
        });
    });

    describe('Supervisory Sourcing Hiring Authority (canEmployRole)', () => {
        it('authorizes procurement_manager to hire Buyers, Demand Planners, Vendor Relations Managers, Customs Specialists, and Inbound QC Inspectors', () => {
            expect(canEmployRole('procurement_manager', 'buyer')).toBe(true);
            expect(canEmployRole('procurement_manager', 'demand_planner')).toBe(true);
            expect(canEmployRole('procurement_manager', 'vendor_relations_manager')).toBe(true);
            expect(canEmployRole('procurement_manager', 'customs_import_specialist')).toBe(true);
            expect(canEmployRole('procurement_manager', 'inbound_qc_inspector')).toBe(true);
        });

        it('blocks procurement_manager from hiring superiors or peers', () => {
            expect(canEmployRole('procurement_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('procurement_manager', 'regional_manager')).toBe(false);
            expect(canEmployRole('procurement_manager', 'operations_manager')).toBe(false);
            expect(canEmployRole('procurement_manager', 'finance_manager')).toBe(false);
            expect(canEmployRole('procurement_manager', 'procurement_manager')).toBe(false);
        });
    });

    describe('Procurement & Sourcing Team Roles (vendor_relations_manager, customs_import_specialist, inbound_qc_inspector)', () => {
        describe('Vendor Relations Manager', () => {
            it('grants procurement, pricing, and supplier management permissions', () => {
                expect(canAccessModule('vendor_relations_manager', 'procurement')).toBe(true);
                expect(canAccessModule('vendor_relations_manager', 'pricing')).toBe(true);
                expect(canAccessModule('vendor_relations_manager', 'inventory')).toBe(true);
                expect(hasPermission('vendor_relations_manager', 'MANAGE_SUPPLIERS')).toBe(true);
                expect(canViewCostPrice('vendor_relations_manager')).toBe(true);
            });

            it('strictly enforces Segregation of Duties and Zero Self-Receiving', () => {
                expect(authService.checkPermission('vendor_relations_manager', 'procurement.receive')).toBe(false);
                expect(authService.checkPermission('vendor_relations_manager', 'warehouse.receive')).toBe(false);
                expect(hasPermission('vendor_relations_manager', 'RECEIVE_PO')).toBe(false);
                expect(hasPermission('vendor_relations_manager', 'PROCESS_SALE')).toBe(false);
                expect(hasPermission('vendor_relations_manager', 'EDIT_PRICE')).toBe(false);
            });
        });

        describe('Customs & Import Specialist', () => {
            it('grants procurement and inventory access for cross-border freight and LC tracking', () => {
                expect(canAccessModule('customs_import_specialist', 'procurement')).toBe(true);
                expect(canAccessModule('customs_import_specialist', 'inventory')).toBe(true);
            });

            it('strictly blocks dock receiving, POS sales, and pricing alterations', () => {
                expect(authService.checkPermission('customs_import_specialist', 'procurement.receive')).toBe(false);
                expect(authService.checkPermission('customs_import_specialist', 'warehouse.receive')).toBe(false);
                expect(hasPermission('customs_import_specialist', 'RECEIVE_PO')).toBe(false);
                expect(hasPermission('customs_import_specialist', 'PROCESS_SALE')).toBe(false);
                expect(hasPermission('customs_import_specialist', 'EDIT_PRICE')).toBe(false);
            });
        });

        describe('Inbound QC Inspector', () => {
            it('grants dock inspection, warehouse tasks, and procurement visibility', () => {
                expect(canAccessModule('inbound_qc_inspector', 'warehouse')).toBe(true);
                expect(canAccessModule('inbound_qc_inspector', 'procurement')).toBe(true);
                expect(canAccessModule('inbound_qc_inspector', 'inventory')).toBe(true);
                expect(authService.checkPermission('inbound_qc_inspector', 'warehouse.receive')).toBe(true);
            });

            it('strictly enforces Delivery Lockdown (Rule 15): allows floor jobs, locks out delivery', () => {
                expect(canWorkerPerformJob('inbound_qc_inspector', 'RECEIVE')).toBe(true);
                expect(canWorkerPerformJob('inbound_qc_inspector', 'COUNT')).toBe(true);
                expect(canWorkerPerformJob('inbound_qc_inspector', 'DELIVERY')).toBe(false);
                expect(canWorkerPerformJob('inbound_qc_inspector', 'DRIVER')).toBe(false);
            });
        });
    });

    describe('Approval Workflow Thresholds (SOP-MGT-024)', () => {
        it('includes procurement_manager as primary authority for purchase orders', () => {
            const poWorkflow = APPROVAL_WORKFLOWS.purchase_order;
            const tier1 = poWorkflow.levels.find(l => l.threshold === 10000);
            expect(tier1?.roles).toContain('procurement_manager');

            const tier2 = poWorkflow.levels.find(l => l.threshold === 50000);
            expect(tier2?.roles).toContain('procurement_manager');

            const tier3 = poWorkflow.levels.find(l => l.threshold === Infinity);
            expect(tier3?.roles).toContain('procurement_manager');
        });
    });

    describe('Administration (admin) Procurement Governance Access', () => {
        it('allows admin role to access procurement module and manage full PO lifecycle', () => {
            expect(canAccessModule('admin', 'procurement')).toBe(true);
            expect(authService.checkPermission('admin', 'procurement.view')).toBe(true);
            expect(authService.checkPermission('admin', 'procurement.create_po')).toBe(true);
            expect(authService.checkPermission('admin', 'procurement.edit_po')).toBe(true);
            expect(authService.checkPermission('admin', 'procurement.approve_po')).toBe(true);
            expect(authService.checkPermission('admin', 'procurement.delete_po')).toBe(true);

            expect(hasPermission('admin', 'ACCESS_PROCUREMENT')).toBe(true);
            expect(hasPermission('admin', 'CREATE_PO')).toBe(true);
            expect(hasPermission('admin', 'APPROVE_PO')).toBe(true);
            expect(hasPermission('admin', 'DELETE_PO')).toBe(true);
            expect(hasPermission('admin', 'MANAGE_SUPPLIERS')).toBe(true);
        });

        it('strictly prohibits admin from dock receiving (Segregation of Duties)', () => {
            expect(authService.checkPermission('admin', 'procurement.receive')).toBe(false);
            expect(hasPermission('admin', 'RECEIVE_PO')).toBe(false);
        });
    });
});

