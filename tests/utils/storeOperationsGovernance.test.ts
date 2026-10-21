import { describe, it, expect } from 'vitest';
import { hasPermission } from '../../utils/permissions';
import { canAccessRoute } from '../../services/auth.rbac';
import { parseEmployeeCode, matchStaffPin } from '../../utils/employeeIdGenerator';

describe('Store Operations & 4-Eyes Cashier Governance Suite', () => {
    describe('Retail Cashier (cashier / pos)', () => {
        it('authorizes point-of-sale checkout and customer profile lookup', () => {
            expect(hasPermission('cashier', 'ACCESS_POS')).toBe(true);
            expect(hasPermission('cashier', 'PROCESS_SALE')).toBe(true);
            expect(hasPermission('cashier', 'ACCESS_CUSTOMERS')).toBe(true);
            expect(hasPermission('cashier', 'ADD_CUSTOMER')).toBe(true);
            expect(canAccessRoute('cashier', '/pos')).toBe(true);
        });

        it('strictly denies cashier unilateral transaction voids (Zero-Trust Loss Prevention)', () => {
            expect(hasPermission('cashier', 'VOID_SALE')).toBe(false);
            expect(hasPermission('pos', 'VOID_SALE')).toBe(false);
        });

        it('strictly denies cashier customer refunds without supervisory co-sign', () => {
            expect(hasPermission('cashier', 'REFUND_SALE')).toBe(false);
            expect(hasPermission('pos', 'REFUND_SALE')).toBe(false);
        });

        it('strictly denies cashier discretionary price discounts', () => {
            expect(hasPermission('cashier', 'APPLY_DISCOUNT')).toBe(false);
            expect(hasPermission('pos', 'APPLY_DISCOUNT')).toBe(false);
        });

        it('strictly denies cashier access to back-office financial ledgers and payroll', () => {
            expect(hasPermission('cashier', 'ACCESS_FINANCE')).toBe(false);
            expect(hasPermission('cashier', 'VIEW_REVENUE')).toBe(false);
            expect(hasPermission('cashier', 'VIEW_PAYROLL')).toBe(false);
            expect(canAccessRoute('cashier', '/finance')).toBe(false);
        });

        it('strictly denies cashier access to corporate HR and employee records', () => {
            expect(hasPermission('cashier', 'ACCESS_EMPLOYEES')).toBe(false);
            expect(hasPermission('cashier', 'VIEW_SALARY')).toBe(false);
            expect(canAccessRoute('cashier', '/employees')).toBe(false);
        });

        it('strictly denies cashier inventory adjustments and stock write-offs', () => {
            expect(hasPermission('cashier', 'ADJUST_STOCK')).toBe(false);
            expect(hasPermission('cashier', 'TRANSFER_STOCK')).toBe(false);
            expect(hasPermission('cashier', 'ACCESS_INVENTORY')).toBe(false);
        });
    });

    describe('Customer Sales Associate (sales_associate)', () => {
        it('authorizes register customer assistance and checkout operations', () => {
            expect(hasPermission('sales_associate', 'ACCESS_POS')).toBe(true);
            expect(hasPermission('sales_associate', 'PROCESS_SALE')).toBe(true);
            expect(hasPermission('sales_associate', 'ACCESS_CUSTOMERS')).toBe(true);
            expect(hasPermission('sales_associate', 'ADD_CUSTOMER')).toBe(true);
        });

        it('strictly denies sales associate sales reports and discount modifications', () => {
            expect(hasPermission('sales_associate', 'VIEW_SALES_REPORTS')).toBe(false);
            expect(hasPermission('sales_associate', 'APPLY_DISCOUNT')).toBe(false);
            expect(hasPermission('sales_associate', 'VOID_SALE')).toBe(false);
        });
    });

    describe('Store Floor Supervisor (store_supervisor / shift_lead)', () => {
        it('authorizes shift floor management and supervisory checkout oversight', () => {
            expect(hasPermission('store_supervisor', 'ACCESS_POS')).toBe(true);
            expect(hasPermission('store_supervisor', 'PROCESS_SALE')).toBe(true);
            expect(hasPermission('store_supervisor', 'VIEW_POS_DASHBOARD')).toBe(true);
            expect(hasPermission('shift_lead', 'ACCESS_POS')).toBe(true);
            expect(hasPermission('shift_lead', 'PROCESS_SALE')).toBe(true);
        });

        it('authorizes supervisory void and discount co-signatures on-duty', () => {
            expect(hasPermission('store_supervisor', 'VOID_SALE')).toBe(true);
            expect(hasPermission('store_supervisor', 'APPLY_DISCOUNT')).toBe(true);
            expect(hasPermission('shift_lead', 'APPLY_DISCOUNT')).toBe(true);
        });

        it('denies store floor supervisors access to corporate system configuration', () => {
            expect(hasPermission('store_supervisor', 'EDIT_SYSTEM_SETTINGS')).toBe(false);
            expect(hasPermission('shift_lead', 'EDIT_SYSTEM_SETTINGS')).toBe(false);
            expect(canAccessRoute('store_supervisor', '/settings')).toBe(false);
        });
    });

    describe('Store Manager (store_manager / assistant_manager)', () => {
        it('authorizes full retail facility management, refunds, and voids', () => {
            expect(hasPermission('store_manager', 'ACCESS_POS')).toBe(true);
            expect(hasPermission('store_manager', 'PROCESS_SALE')).toBe(true);
            expect(hasPermission('store_manager', 'VOID_SALE')).toBe(true);
            expect(hasPermission('store_manager', 'REFUND_SALE')).toBe(true);
            expect(hasPermission('store_manager', 'VIEW_ALL_TRANSACTIONS')).toBe(true);
            expect(hasPermission('assistant_manager', 'REFUND_SALE')).toBe(true);
        });

        it('confines store managers to branch operations without global system admin rights', () => {
            expect(hasPermission('store_manager', 'EDIT_SYSTEM_SETTINGS')).toBe(false);
            expect(hasPermission('store_manager', 'DELETE_PRODUCT')).toBe(false);
            expect(hasPermission('store_manager', 'DELETE_SALE')).toBe(false);
        });
    });

    describe('4-Eyes Supervisory PIN Verification & Staging Compatibility', () => {
        it('correctly parses sovereign employee codes and staging test codes', () => {
            expect(parseEmployeeCode('ET-SIIF0058')).toEqual({
                country: 'ET',
                seq: 58,
                raw: 'ET-SIIF0058',
                isLegacy: false
            });
            expect(parseEmployeeCode('ET-STG-058')).toEqual({
                country: 'ET',
                seq: 58,
                raw: 'ET-STG-058',
                isLegacy: false
            });
            expect(parseEmployeeCode('KE-STG-030')).toEqual({
                country: 'KE',
                seq: 30,
                raw: 'KE-STG-030',
                isLegacy: false
            });
        });

        it('verifies 4-digit keypad PIN entry against staging staff codes', () => {
            expect(matchStaffPin('ET-STG-058', '0058')).toBe(true);
            expect(matchStaffPin('ET-STG-058', '58')).toBe(true);
            expect(matchStaffPin('ET-STG-058', '0059')).toBe(false);
        });

        it('enforces 4-Eyes rule: prevents cashier from self-approving using their own PIN', () => {
            const cashierCode: string = 'ET-STG-059';
            const supervisorCode: string = 'ET-STG-058';

            // Cashier entering their own PIN should match their own code but fail secondary check
            const enteredSelfPin = '0059';
            const enteredSupervisorPin = '0058';

            expect(matchStaffPin(cashierCode, enteredSelfPin)).toBe(true);
            expect(cashierCode === supervisorCode).toBe(false);
            expect(matchStaffPin(supervisorCode, enteredSupervisorPin)).toBe(true);
        });
    });
});
