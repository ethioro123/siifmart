import { describe, it, expect } from 'vitest';
import { validateRegionalBoundary } from '../../utils/roleSegregation';

describe('Employee Regional Boundaries & Handover Security Tests', () => {
    describe('validateRegionalBoundary', () => {
        it('allows HQ executives and non-regional managers to assign across sites', () => {
            const hqResult = validateRegionalBoundary('group_ceo', undefined, { regionCode: 'ADDIS' });
            expect(hqResult).toBeNull();

            const hrManagerResult = validateRegionalBoundary('country_hr_director', undefined, { regionCode: 'OROMIA' });
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

});
