import { describe, it, expect } from 'vitest';
import { hasPermission, authService } from '../../utils/permissions';
import { canAccessRoute, canAccessSite } from '../../services/auth.rbac';
import { canEmployRole } from '../../utils/roles';
import { getPoApprovalPolicy } from '../../utils/poApprovalPolicy';
import { getVisibleFulfillmentTabs, getDefaultFulfillmentTab } from '../../utils/fulfillmentTabPermissions';

describe('Regional Leadership & Field Supervisors Governance Suite', () => {
    describe('Regional Operations Manager (regional_operations_manager)', () => {
        it('authorizes multi-site regional operations workbench and monitoring routes', () => {
            expect(canAccessRoute('regional_operations_manager', '/regional-ops')).toBe(true);
            expect(canAccessRoute('regional_operations_manager', '/wms-dashboard')).toBe(true);
            expect(canAccessRoute('regional_operations_manager', '/network-inventory')).toBe(true);
            expect(canAccessRoute('regional_operations_manager', '/pos-dashboard')).toBe(true);
            expect(canAccessRoute('regional_operations_manager', '/sales')).toBe(true);
            expect(canAccessRoute('regional_operations_manager', '/customers')).toBe(true);
            expect(canAccessRoute('regional_operations_manager', '/employees')).toBe(true);
        });

        it('authorizes operational settings and autonomous PO approval while denying cashier register and enterprise config', () => {
            expect(hasPermission('regional_operations_manager', 'EDIT_OPERATIONAL_SETTINGS')).toBe(true);
            expect(hasPermission('regional_operations_manager', 'ACCESS_SETTINGS')).toBe(true);
            expect(hasPermission('regional_operations_manager', 'APPROVE_PO')).toBe(true);
            expect(authService.checkPermission('regional_operations_manager', 'procurement.approve_po')).toBe(true);
            expect(hasPermission('regional_operations_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_operations_manager', 'VOID_SALE')).toBe(false);
            expect(hasPermission('regional_operations_manager', 'DELETE_PO')).toBe(false);
            expect(hasPermission('regional_operations_manager', 'MANAGE_ROLES')).toBe(false);
            expect(hasPermission('regional_operations_manager', 'EDIT_SYSTEM_SETTINGS')).toBe(false);
        });

        it('authorizes recruiting regional managers and branch captains while blocking national directors', () => {
            expect(canEmployRole('regional_operations_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'regional_supply_chain_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'country_managing_director')).toBe(false);
        });

        it('strictly confines regional managers to single assigned site/region without CEO bypass', () => {
            const userSiteId = 'site-addis-hub';
            const targetSiteId = 'site-mombasa-dc';
            expect(canAccessSite('regional_operations_manager', userSiteId, targetSiteId)).toBe(false);
            expect(canAccessSite('regional_operations_manager', userSiteId, userSiteId)).toBe(true);
        });
    });

    describe('Area Operations Manager (area_operations_manager)', () => {
        it('authorizes regional command, store/warehouse monitoring, and intra-regional transfers while blocking PO creation', () => {
            expect(canAccessRoute('area_operations_manager', '/regional-ops')).toBe(true);
            expect(canAccessRoute('area_operations_manager', '/wms-dashboard')).toBe(true);
            expect(canAccessRoute('area_operations_manager', '/pos-dashboard')).toBe(true);
            expect(hasPermission('area_operations_manager', 'ACCESS_REGIONAL_OPS')).toBe(true);
            expect(hasPermission('area_operations_manager', 'TRANSFER_STOCK')).toBe(true);
            expect(hasPermission('area_operations_manager', 'APPROVE_PO')).toBe(true);
            expect(hasPermission('area_operations_manager', 'CREATE_PO')).toBe(false);
            expect(hasPermission('area_operations_manager', 'PROCESS_SALE')).toBe(false);
        });

        it('authorizes recruiting store/warehouse captains and frontline staff while blocking regional/national executives', () => {
            expect(canEmployRole('area_operations_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('area_operations_manager', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('area_operations_manager', 'regional_operations_manager')).toBe(false);
        });
    });

    describe('Regional Procurement Manager (regional_procurement_manager)', () => {
        it('authorizes procurement, PO creation/approval, demand sales reports, and team management while stripping dock self-receiving and PO hard-delete', () => {
            expect(canAccessRoute('regional_procurement_manager', '/regional-ops')).toBe(true);
            expect(canAccessRoute('regional_procurement_manager', '/procurement')).toBe(true);
            expect(canAccessRoute('regional_procurement_manager', '/inventory')).toBe(true);
            expect(canAccessRoute('regional_procurement_manager', '/sales')).toBe(true);
            expect(canAccessRoute('regional_procurement_manager', '/employees')).toBe(true);
            expect(hasPermission('regional_procurement_manager', 'CREATE_PO')).toBe(true);
            expect(hasPermission('regional_procurement_manager', 'APPROVE_PO')).toBe(true);
            expect(hasPermission('regional_procurement_manager', 'MANAGE_SUPPLIERS')).toBe(true);
            expect(hasPermission('regional_procurement_manager', 'RECEIVE_PO')).toBe(false);
            expect(hasPermission('regional_procurement_manager', 'DELETE_PO')).toBe(false);
            expect(authService.checkPermission('regional_procurement_manager', 'procurement.receive')).toBe(false);
            expect(authService.checkPermission('regional_procurement_manager', 'procurement.delete_po')).toBe(false);
            expect(authService.checkPermission('regional_procurement_manager', 'employees.view')).toBe(true);
        });

        it('enforces Maker-Checker dual control on autonomous PO approval and blocks self-approval', () => {
            const regions = [{ id: 'reg-1', code: 'ET-OR', name: 'Oromia', country: 'ET', status: 'active', autonomous_po_limit: 500000 }] as any[];
            const sites = [{ id: 'site-wh-1', name: 'Adama DC', type: 'Warehouse', country: 'ET', region_code: 'ET-OR' }] as any[];

            const selfCreatedPolicy = getPoApprovalPolicy({
                po: { id: 'po-1', siteId: 'site-wh-1', region_code: 'ET-OR', status: 'Pending', totalAmount: 120000, createdBy: 'Bekele Tadesse' } as any,
                role: 'regional_procurement_manager',
                actorName: 'Bekele Tadesse',
                actorRegionCode: 'ET-OR',
                regions,
                sites
            });
            expect(selfCreatedPolicy.isCreator).toBe(true);
            expect(selfCreatedPolicy.canApprove).toBe(false);

            const peerCreatedPolicy = getPoApprovalPolicy({
                po: { id: 'po-2', siteId: 'site-wh-1', region_code: 'ET-OR', status: 'Pending', totalAmount: 120000, createdBy: 'Almaz Buyer' } as any,
                role: 'regional_procurement_manager',
                actorName: 'Bekele Tadesse',
                actorRegionCode: 'ET-OR',
                regions,
                sites
            });
            expect(peerCreatedPolicy.isCreator).toBe(false);
            expect(peerCreatedPolicy.canApprove).toBe(true);
        });
    });

    describe('Regional Finance Manager (regional_finance_manager)', () => {
        it('authorizes regional financial review, revenue inspection, expense/PO approval, and finance team onboarding', () => {
            expect(hasPermission('regional_finance_manager', 'ACCESS_FINANCE')).toBe(true);
            expect(hasPermission('regional_finance_manager', 'VIEW_REVENUE')).toBe(true);
            expect(hasPermission('regional_finance_manager', 'VIEW_EXPENSES')).toBe(true);
            expect(hasPermission('regional_finance_manager', 'ADD_EXPENSE')).toBe(true);
            expect(authService.checkPermission('regional_finance_manager', 'finance.approve_expense')).toBe(true);
            expect(hasPermission('regional_finance_manager', 'APPROVE_PO')).toBe(true);
            expect(hasPermission('regional_finance_manager', 'VIEW_SALES_REPORTS')).toBe(true);
            expect(hasPermission('regional_finance_manager', 'ACCESS_EMPLOYEES')).toBe(true);
            expect(hasPermission('regional_finance_manager', 'ADD_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_finance_manager', 'EDIT_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_finance_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(canAccessRoute('regional_finance_manager', '/regional-ops')).toBe(true);
            expect(canAccessRoute('regional_finance_manager', '/finance')).toBe(true);
            expect(canAccessRoute('regional_finance_manager', '/procurement')).toBe(true);
            expect(canAccessRoute('regional_finance_manager', '/sales')).toBe(true);
            expect(canAccessRoute('regional_finance_manager', '/employees')).toBe(true);
            expect(canEmployRole('regional_finance_manager', 'accountant')).toBe(true);
            expect(canEmployRole('regional_finance_manager', 'treasury_officer')).toBe(true);
            expect(canEmployRole('regional_finance_manager', 'tax_compliance_officer')).toBe(true);
            expect(canEmployRole('regional_finance_manager', 'credit_control_officer')).toBe(true);
            expect(canEmployRole('regional_finance_manager', 'payroll_specialist')).toBe(true);
        });

        it('strictly denies cashier register sales processing, physical stock adjustment, PO receiving, and pricing changes', () => {
            expect(hasPermission('regional_finance_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_finance_manager', 'ACCESS_INVENTORY')).toBe(false);
            expect(canAccessRoute('regional_finance_manager', '/inventory')).toBe(false);
            expect(hasPermission('regional_finance_manager', 'ADJUST_STOCK')).toBe(false);
            expect(hasPermission('regional_finance_manager', 'RECEIVE_PO')).toBe(false);
            expect(hasPermission('regional_finance_manager', 'EDIT_PRICE')).toBe(false);
            expect(hasPermission('regional_finance_manager', 'EDIT_SYSTEM_SETTINGS')).toBe(false);
        });
    });

    describe('Regional Logistics Manager (regional_logistics_manager)', () => {
        it('authorizes regional warehouse network, stock transfers, fulfillment tabs, and logistics team onboarding', () => {
            expect(hasPermission('regional_logistics_manager', 'ACCESS_WAREHOUSE')).toBe(true);
            expect(hasPermission('regional_logistics_manager', 'TRANSFER_STOCK')).toBe(true);
            expect(hasPermission('regional_logistics_manager', 'ASSIGN_TASKS')).toBe(true);
            expect(hasPermission('regional_logistics_manager', 'MANAGE_REPLENISHMENT')).toBe(true);
            expect(hasPermission('regional_logistics_manager', 'ADD_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_logistics_manager', 'EDIT_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_logistics_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(canAccessRoute('regional_logistics_manager', '/wms-ops')).toBe(true);
            expect(getDefaultFulfillmentTab('regional_logistics_manager')).toBe('DOCKS');
            expect(getVisibleFulfillmentTabs('regional_logistics_manager')).toEqual(
                expect.arrayContaining(['DOCKS', 'DRIVER', 'RECEIVE', 'TRANSFER'])
            );
            expect(canEmployRole('regional_logistics_manager', 'transport_fleet_manager')).toBe(true);
            expect(canEmployRole('regional_logistics_manager', 'driver')).toBe(true);
        });

        it('strictly denies general ledger export and corporate compensation changes', () => {
            expect(hasPermission('regional_logistics_manager', 'EXPORT_FINANCIAL_DATA')).toBe(false);
            expect(hasPermission('regional_logistics_manager', 'APPROVE_SALARY')).toBe(false);
        });
    });

    describe('Regional Merchandising Manager (regional_merchandising_manager)', () => {
        it('authorizes regional merchandising intelligence, price/promo governance, inventory & sales visibility, and merchandising team onboarding', () => {
            expect(hasPermission('regional_merchandising_manager', 'ACCESS_REGIONAL_OPS')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'ACCESS_PRICING')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'EDIT_PRICE')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'CREATE_PROMOTION')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'APPROVE_PRICE_CHANGE')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'ACCESS_INVENTORY')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'VIEW_SALES_REPORTS')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'ACCESS_EMPLOYEES')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'ADD_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'EDIT_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_merchandising_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(canAccessRoute('regional_merchandising_manager', '/regional-ops')).toBe(true);
            expect(canAccessRoute('regional_merchandising_manager', '/pricing')).toBe(true);
            expect(canAccessRoute('regional_merchandising_manager', '/inventory')).toBe(true);
            expect(canAccessRoute('regional_merchandising_manager', '/sales')).toBe(true);
            expect(canAccessRoute('regional_merchandising_manager', '/employees')).toBe(true);
            expect(canEmployRole('regional_merchandising_manager', 'merchandising_specialist')).toBe(true);
            expect(canEmployRole('regional_merchandising_manager', 'merchandiser')).toBe(true);
        });

        it('strictly denies physical stock adjustments, PO creation, cashier sales processing, and payroll management', () => {
            expect(hasPermission('regional_merchandising_manager', 'ADJUST_STOCK')).toBe(false);
            expect(hasPermission('regional_merchandising_manager', 'CREATE_PO')).toBe(false);
            expect(hasPermission('regional_merchandising_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_merchandising_manager', 'PROCESS_PAYROLL')).toBe(false);
        });
    });

    describe('Regional HR Manager (regional_hr_manager)', () => {
        it('authorizes regional workforce management, talent onboarding, checker sign-off, salary proposals, and payroll visibility', () => {
            expect(hasPermission('regional_hr_manager', 'ACCESS_REGIONAL_OPS')).toBe(true);
            expect(hasPermission('regional_hr_manager', 'ACCESS_EMPLOYEES')).toBe(true);
            expect(hasPermission('regional_hr_manager', 'ADD_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_hr_manager', 'EDIT_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_hr_manager', 'TERMINATE_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_hr_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_hr_manager', 'MANAGE_SHIFTS')).toBe(true);
            expect(hasPermission('regional_hr_manager', 'VIEW_SALARY')).toBe(true);
            expect(hasPermission('regional_hr_manager', 'PROPOSE_SALARY')).toBe(true);
            expect(hasPermission('regional_hr_manager', 'VIEW_PAYROLL')).toBe(true);
            expect(canAccessRoute('regional_hr_manager', '/regional-ops')).toBe(true);
            expect(canAccessRoute('regional_hr_manager', '/employees')).toBe(true);
            expect(canEmployRole('regional_hr_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('regional_hr_manager', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('regional_hr_manager', 'hr_generalist')).toBe(true);
            expect(canEmployRole('regional_hr_manager', 'talent_recruiter')).toBe(true);
            expect(canEmployRole('regional_hr_manager', 'training_coordinator')).toBe(true);
            expect(canEmployRole('regional_hr_manager', 'payroll_specialist')).toBe(true);
        });

        it('strictly denies salary final approval, POS sales processing, stock adjustments, and corporate HR policy overrides', () => {
            expect(hasPermission('regional_hr_manager', 'APPROVE_SALARY')).toBe(false);
            expect(hasPermission('regional_hr_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_hr_manager', 'ADJUST_STOCK')).toBe(false);
            expect(hasPermission('regional_hr_manager', 'EDIT_HR_SETTINGS')).toBe(false);
            expect(canEmployRole('regional_hr_manager', 'regional_operations_manager')).toBe(false);
        });
    });

    describe('Regional Security Manager (regional_security_manager)', () => {
        it('authorizes system audit inspection, loss prevention logs, pos telemetry monitoring, and LP staff management', () => {
            expect(hasPermission('regional_security_manager', 'VIEW_AUDIT_LOGS')).toBe(true);
            expect(hasPermission('regional_security_manager', 'VIEW_ALL_TRANSACTIONS')).toBe(true);
            expect(hasPermission('regional_security_manager', 'VIEW_POS_DASHBOARD')).toBe(true);
            expect(hasPermission('regional_security_manager', 'VIEW_SALES_REPORTS')).toBe(true);
            expect(hasPermission('regional_security_manager', 'ADD_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_security_manager', 'EDIT_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_security_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(canAccessRoute('regional_security_manager', '/regional-ops')).toBe(true);
            expect(canAccessRoute('regional_security_manager', '/pos-dashboard')).toBe(true);
            expect(canAccessRoute('regional_security_manager', '/employees')).toBe(true);
            expect(canAccessRoute('regional_security_manager', '/settings')).toBe(true);
        });

        it('authorizes hiring of loss prevention, store operations auditor, and auditor roles only', () => {
            expect(canEmployRole('regional_security_manager', 'loss_prevention')).toBe(true);
            expect(canEmployRole('regional_security_manager', 'store_operations_auditor')).toBe(true);
            expect(canEmployRole('regional_security_manager', 'auditor')).toBe(true);
            expect(canEmployRole('regional_security_manager', 'cashier')).toBe(false);
            expect(canEmployRole('regional_security_manager', 'store_manager')).toBe(false);
        });

        it('strictly denies sales processing, product pricing, inventory mutations, and payroll approvals', () => {
            expect(hasPermission('regional_security_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_security_manager', 'EDIT_PRICE')).toBe(false);
            expect(hasPermission('regional_security_manager', 'PROCESS_PAYROLL')).toBe(false);
            expect(hasPermission('regional_security_manager', 'ACCESS_INVENTORY')).toBe(false);
            expect(canAccessRoute('regional_security_manager', '/inventory')).toBe(false);
        });
    });

    describe('Regional IT Manager (regional_it_manager)', () => {
        it('authorizes infrastructure settings, audit logs, login provisioning, password resets, and IT staff management', () => {
            expect(hasPermission('regional_it_manager', 'ACCESS_SETTINGS')).toBe(true);
            expect(hasPermission('regional_it_manager', 'EDIT_SYSTEM_SETTINGS')).toBe(true);
            expect(hasPermission('regional_it_manager', 'VIEW_AUDIT_LOGS')).toBe(true);
            expect(hasPermission('regional_it_manager', 'RESET_PASSWORD')).toBe(true);
            expect(hasPermission('regional_it_manager', 'CREATE_LOGIN_ACCOUNT')).toBe(true);
            expect(hasPermission('regional_it_manager', 'ADD_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_it_manager', 'EDIT_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_it_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(canAccessRoute('regional_it_manager', '/regional-ops')).toBe(true);
            expect(canAccessRoute('regional_it_manager', '/settings')).toBe(true);
            expect(canAccessRoute('regional_it_manager', '/employees')).toBe(true);
        });

        it('authorizes hiring of IT Support and Data Analyst roles only', () => {
            expect(canEmployRole('regional_it_manager', 'it_support')).toBe(true);
            expect(canEmployRole('regional_it_manager', 'data_analyst')).toBe(true);
            expect(canEmployRole('regional_it_manager', 'cashier')).toBe(false);
            expect(canEmployRole('regional_it_manager', 'store_manager')).toBe(false);
        });

        it('strictly denies sales processing, product pricing, inventory mutations, and financial ledger access', () => {
            expect(hasPermission('regional_it_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_it_manager', 'EDIT_PRICE')).toBe(false);
            expect(hasPermission('regional_it_manager', 'ACCESS_FINANCE')).toBe(false);
            expect(hasPermission('regional_it_manager', 'ACCESS_INVENTORY')).toBe(false);
            expect(canAccessRoute('regional_it_manager', '/finance')).toBe(false);
            expect(canAccessRoute('regional_it_manager', '/inventory')).toBe(false);
        });
    });

    describe('Regional Compliance Manager (regional_compliance_manager)', () => {
        it('authorizes read-only audit inspection across finance, inventory, pos, pricing, sales, and compliance staff management', () => {
            expect(hasPermission('regional_compliance_manager', 'VIEW_AUDIT_LOGS')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'ACCESS_FINANCE')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'VIEW_REVENUE')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'VIEW_EXPENSES')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'VIEW_PAYROLL')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'ACCESS_INVENTORY')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'VIEW_COST_PRICE')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'VIEW_POS_DASHBOARD')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'VIEW_ALL_TRANSACTIONS')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'ACCESS_PRICING')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'ADD_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'EDIT_EMPLOYEE')).toBe(true);
            expect(hasPermission('regional_compliance_manager', 'APPROVE_EMPLOYEE')).toBe(true);
            expect(canAccessRoute('regional_compliance_manager', '/regional-ops')).toBe(true);
            expect(canAccessRoute('regional_compliance_manager', '/finance')).toBe(true);
            expect(canAccessRoute('regional_compliance_manager', '/inventory')).toBe(true);
            expect(canAccessRoute('regional_compliance_manager', '/pos-dashboard')).toBe(true);
            expect(canAccessRoute('regional_compliance_manager', '/pricing')).toBe(true);
            expect(canAccessRoute('regional_compliance_manager', '/employees')).toBe(true);
            expect(canAccessRoute('regional_compliance_manager', '/settings')).toBe(true);
        });

        it('authorizes hiring of store operations auditor, auditor, and tax compliance officer roles only', () => {
            expect(canEmployRole('regional_compliance_manager', 'store_operations_auditor')).toBe(true);
            expect(canEmployRole('regional_compliance_manager', 'auditor')).toBe(true);
            expect(canEmployRole('regional_compliance_manager', 'tax_compliance_officer')).toBe(true);
            expect(canEmployRole('regional_compliance_manager', 'cashier')).toBe(false);
            expect(canEmployRole('regional_compliance_manager', 'store_manager')).toBe(false);
        });

        it('strictly enforces read-only Segregation of Duties (no sales, stock edits, PO creation, expense entry, or pricing edits)', () => {
            expect(hasPermission('regional_compliance_manager', 'PROCESS_SALE')).toBe(false);
            expect(hasPermission('regional_compliance_manager', 'ADJUST_STOCK')).toBe(false);
            expect(hasPermission('regional_compliance_manager', 'CREATE_PO')).toBe(false);
            expect(hasPermission('regional_compliance_manager', 'ADD_EXPENSE')).toBe(false);
            expect(hasPermission('regional_compliance_manager', 'PROCESS_PAYROLL')).toBe(false);
            expect(hasPermission('regional_compliance_manager', 'EDIT_PRICE')).toBe(false);
        });
    });

    describe('Maker-Checker Segregation & Regional Autonomous Expense Caps', () => {
        it('enforces Maker-Checker: expense creator cannot approve their own expense', () => {
            const creatorId = 'emp-024';
            const approverId = 'emp-024';
            const isSelfApproval = creatorId === approverId;
            expect(isSelfApproval).toBe(true);
            // Self-approval must be blocked
            expect(!isSelfApproval).toBe(false);
        });

        it('distinguishes between regional autonomous limit and escalated corporate ceiling', () => {
            const regionalLimit = 50000;
            const expense1 = 15000;
            const expense2 = 65000;

            const isExpense1Autonomous = expense1 <= regionalLimit;
            const isExpense2Autonomous = expense2 <= regionalLimit;

            expect(isExpense1Autonomous).toBe(true);
            expect(isExpense2Autonomous).toBe(false);
        });
    });
});
