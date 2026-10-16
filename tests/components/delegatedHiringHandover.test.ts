import { describe, it, expect } from 'vitest';
import { isManagerialRole, SYSTEM_ROLES } from '../../utils/roles';
import { generateEmployeeEmail, parseEmployeeCode } from '../../utils/employeeIdGenerator';

describe('Delegated Hiring & Credential Handover Governance', () => {
    describe('1. Zero-Trust Access: Managers vs. Level 4 Staff', () => {
        it('allows Level 1, 2, and 3 managers to manage hiring and credential handover', () => {
            // Level 1
            expect(isManagerialRole('super_admin')).toBe(true);

            // Level 2
            expect(isManagerialRole('operations_manager')).toBe(true);
            expect(isManagerialRole('regional_manager')).toBe(true);
            expect(isManagerialRole('hr_manager')).toBe(true);

            // Level 3 (Site & Operational Leadership)
            expect(isManagerialRole('store_manager')).toBe(true);
            expect(isManagerialRole('warehouse_manager')).toBe(true);
            expect(isManagerialRole('logistics_manager')).toBe(true);
            expect(isManagerialRole('inventory_manager')).toBe(true);
            expect(isManagerialRole('dispatch_manager')).toBe(true);
            expect(isManagerialRole('assistant_manager')).toBe(true);
            expect(isManagerialRole('shift_lead')).toBe(true);
            expect(isManagerialRole('store_supervisor')).toBe(true);
        });

        it('strictly blocks Level 4 floor staff from onboarding and credential handover', () => {
            const level4Roles = [
                'cashier',
                'sales_associate',
                'stock_clerk',
                'picker',
                'packer',
                'receiver',
                'driver',
                'forklift_operator',
                'inventory_specialist',
                'customer_service',
                'pos'
            ];

            for (const roleId of level4Roles) {
                expect(isManagerialRole(roleId)).toBe(false);
                const roleDef = SYSTEM_ROLES.find(r => r.id === roleId);
                expect(roleDef?.level).toBe(4);
            }
        });
    });

    describe('2. Sovereign Credential Derivation for Handover Slip', () => {
        it('generates the sovereign login email matching corporate standards', () => {
            expect(generateEmployeeEmail('KE-SIIF0045')).toBe('KE-SIIF0045@siifmart.com');
            expect(generateEmployeeEmail('ET-SIIF0012')).toBe('ET-SIIF0012@siifmart.com');
            expect(generateEmployeeEmail('UG-SIIF0001')).toBe('UG-SIIF0001@siifmart.com');
        });

        it('extracts the exact 4-digit quick terminal PIN from employee code sequence', () => {
            const parsedKE = parseEmployeeCode('KE-SIIF0045');
            expect(parsedKE?.seq).toBe(45);
            expect(String(parsedKE?.seq).padStart(4, '0')).toBe('0045');

            const parsedET = parseEmployeeCode('ET-SIIF0120');
            expect(parsedET?.seq).toBe(120);
            expect(String(parsedET?.seq).padStart(4, '0')).toBe('0120');
        });
    });
});
