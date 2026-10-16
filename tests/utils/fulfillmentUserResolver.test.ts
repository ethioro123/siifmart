import { describe, it, expect } from 'vitest';
import { resolveFulfillmentWorker } from '../../utils/fulfillmentUserResolver';

describe('fulfillmentUserResolver', () => {
    const mockEmployees = [
        {
            id: '7e39c928-f0b8-4a40-8d51-4fd6ce569aae',
            code: 'KE-SIIF0044',
            name: 'Kennedy Odhiambo Odhiambo',
            email: 'KE-SIIF0044@siifmart.com'
        },
        {
            id: '89448901-e7db-4d31-b5f2-459ed1b61fdf',
            code: 'KE-SIIF0046',
            name: 'Gideon Jakaranda',
            email: 'KE-SIIF0046@siifmart.com'
        }
    ];

    it('resolves employee directly from loaded employee array', () => {
        const worker = resolveFulfillmentWorker({
            userId: '89448901-e7db-4d31-b5f2-459ed1b61fdf',
            employees: mockEmployees
        });

        expect(worker.name).toBe('Gideon Jakaranda');
        expect(worker.code).toBe('KE-SIIF0046');
        expect(worker.display).toBe('Gideon Jakaranda (KE-SIIF0046)');
        expect(worker.initials).toBe('G');
    });

    it('resolves employee by case-insensitive name or code', () => {
        const worker = resolveFulfillmentWorker({
            userId: 'gideon jakaranda',
            employees: mockEmployees
        });
        expect(worker.code).toBe('KE-SIIF0046');
    });

    it('resolves from known registry when employee is not in scoped employees list (cross-site/HQ)', () => {
        // Shukri Kamal is in ET, not in Kenya local state
        const worker = resolveFulfillmentWorker({
            userId: '0e045a53-fe4b-49f2-90a7-aa11984fbab4',
            employees: mockEmployees // ET employee not present
        });

        expect(worker.name).toBe('Shukri Kamal');
        expect(worker.code).toBe('ET-SIIF0001');
        expect(worker.display).toBe('Shukri Kamal (ET-SIIF0001)');
        expect(worker.initials).toBe('S');
    });

    it('resolves facility manager when job worker is null or empty', () => {
        const worker = resolveFulfillmentWorker({
            userId: null,
            job: {
                siteId: 'b74b26ff-da36-4381-912c-63c2b45b5d16', // Eastleigh 01
                completedBy: null
            },
            employees: []
        });

        expect(worker.name).toBe('Kennedy Odhiambo');
        expect(worker.code).toBe('KE-SIIF0044');
        expect(worker.display).toBe('Kennedy Odhiambo (KE-SIIF0044)');
    });

    it('never returns "Unknown User", "Unknown", or raw hexadecimal UUID', () => {
        const testInputs = [
            undefined,
            null,
            '',
            'random-unmatched-string',
            '11111111-2222-3333-4444-555555555555'
        ];

        testInputs.forEach(input => {
            const worker = resolveFulfillmentWorker({
                userId: input,
                currentUser: { name: 'Kennedy Odhiambo', code: 'KE-SIIF0044' }
            });

            expect(worker.name).not.toBe('Unknown User');
            expect(worker.name).not.toBe('Unknown');
            expect(worker.name).not.toBe('System');
            expect(worker.name).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}/i);
            expect(worker.display.length).toBeGreaterThan(0);
        });
    });
});
