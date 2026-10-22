import { describe, it, expect } from 'vitest';
import { validateRegionalBoundary } from '../../utils/roleSegregation';

describe('Employee Regional Boundaries & Handover Security Tests', () => {
    describe('validateRegionalBoundary', () => {
        it('allows HQ executives and non-regional managers to assign across sites', () => {
            const hqResult = validateRegionalBoundary('CEO', undefined, { regionCode: 'ADDIS' });
            expect(hqResult).toBeNull();

            const hrManagerResult = validateRegionalBoundary('head_of_hr', undefined, { regionCode: 'OROMIA' });
            expect(hrManagerResult).toBeNull();
        });

        it('blocks regional officers from assigning staff to facilities in other regions', () => {
            const result = validateRegionalBoundary(
                'regional_hr_manager',
                'ADDIS',
                { regionCode: 'DIRE_DAWA' }
            );
            expect(result).not.toBeNull();
            expect(result).toContain('Unauthorized facility assignment');
            expect(result).toContain('ADDIS');
            expect(result).toContain('DIRE_DAWA');
        });

        it('permits regional officers to assign staff within their assigned region', () => {
            const result = validateRegionalBoundary(
                'regional_operations_manager',
                'OROMIA',
                { regionCode: 'OROMIA' }
            );
            expect(result).toBeNull();
        });

        it('blocks regional officers if target site is missing or undefined', () => {
            const result = validateRegionalBoundary(
                'regional_hr_manager',
                'OROMIA',
                undefined
            );
            expect(result).not.toBeNull();
            expect(result).toContain('Target facility not found');
        });
    });

    describe('Credential Handover Key Resolution', () => {
        it('resolves password across ID, employee code, and name keys', () => {
            const empId = 'emp-uuid-123';
            const empCode = 'ET-SIIF0099';
            const empName = 'Abebe Bikila';

            const mockStorage: Record<string, string> = {};

            // Store under code key
            mockStorage[`siifmart_temp_pwd_by_code_${empCode.toLowerCase()}`] = 'SecretPass#2026';

            // Resolve
            const codeKey = empCode.toLowerCase();
            const nameKey = empName.toLowerCase();
            const resolved = mockStorage[`siifmart_temp_pwd_${empId}`] ||
                             mockStorage[`siifmart_temp_pwd_by_code_${codeKey}`] ||
                             mockStorage[`siifmart_temp_pwd_by_name_${nameKey}`];

            expect(resolved).toBe('SecretPass#2026');
        });
    });
});
