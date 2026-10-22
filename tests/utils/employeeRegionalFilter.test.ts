import { describe, it, expect } from 'vitest';
import { Employee, Site } from '../../types';

describe('Employee Regional Filtering & Territorial Organization', () => {
    const mockSites: Partial<Site>[] = [
        { id: 'site-bole', name: 'Bole Supermarket', regionCode: 'ET-ADD', type: 'Store' },
        { id: 'site-merkato', name: 'Merkato Retail Store', regionCode: 'ET-ADD', type: 'Store' },
        { id: 'site-adama-dc', name: 'Adama DC', regionCode: 'ET-ADA', type: 'Warehouse' },
        { id: 'site-harar', name: 'Harar Logistics Hub', regionCode: 'ET-DIR', type: 'Warehouse' },
        { id: 'site-eastleigh', name: 'Eastleigh 01', regionCode: 'KE-NRB', type: 'Store' },
    ];

    const mockEmployees: Partial<Employee>[] = [
        { id: '1', name: 'Sara Tesfaye', role: 'head_of_operations', regionCode: 'ET-ADD', siteId: 'site-bole', scopeLevel: 'HQ' },
        { id: '2', name: 'Tomas Tesfaye', role: 'store_manager', regionCode: 'ET-ADD', siteId: 'site-bole', scopeLevel: 'REGIONAL' },
        { id: '3', name: 'Amina Ali', role: 'picker', regionCode: 'ET-ADD', siteId: 'site-merkato', scopeLevel: 'REGIONAL' },
        { id: '4', name: 'Helen Getachew', role: 'warehouse_manager', regionCode: 'ET-ADA', siteId: 'site-adama-dc', scopeLevel: 'REGIONAL' },
        { id: '5', name: 'Shukri Kamal', role: 'super_admin', regionCode: 'ET-DIR', siteId: 'site-harar', scopeLevel: 'HQ' },
        { id: '6', name: 'Betelhem Bekele', role: 'store_manager', regionCode: 'ET-DIR', siteId: 'site-harar', scopeLevel: 'REGIONAL' },
        { id: '7', name: 'Kamau Ndenga', role: 'regional_operations_manager', regionCode: 'KE-NRB', siteId: 'site-eastleigh', scopeLevel: 'REGIONAL' },
        { id: '8', name: 'Omondi Samuel', role: 'head_of_operations', regionCode: 'KE-NRB', siteId: 'site-eastleigh', scopeLevel: 'HQ' },
    ];

    it('filters sites strictly belonging to the chosen region code', () => {
        const filterRegion = 'ET-ADD';
        const scoped = mockSites.filter(s => s.regionCode === filterRegion);
        expect(scoped).toHaveLength(2);
        expect(scoped.map(s => s.id)).toEqual(['site-bole', 'site-merkato']);
    });

    it('filters employees strictly belonging to the chosen region code', () => {
        const filterRegion = 'ET-ADA';
        const filtered = mockEmployees.filter(e => e.regionCode === filterRegion);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Helen Getachew');
    });

    it('organizes staff into HQ corporate directors and REGIONAL field teams', () => {
        const hqStaff = mockEmployees.filter(e => e.scopeLevel === 'HQ');
        const regionalStaff = mockEmployees.filter(e => e.scopeLevel === 'REGIONAL');

        expect(hqStaff.map(e => e.role)).toEqual(['head_of_operations', 'super_admin',]);
        expect(regionalStaff.map(e => e.role)).toEqual(['store_manager', 'picker', 'warehouse_manager', 'store_manager', 'regional_operations_manager']);
    });

    it('resets location when changing to a region that does not include the active location', () => {
        let activeSite = 'site-adama-dc';
        const newRegion = 'ET-ADD';
        const matches = mockSites.some(s => s.id === activeSite && s.regionCode === newRegion);
        if (!matches) {
            activeSite = 'All';
        }
        expect(activeSite).toBe('All');
    });

    it('preserves location when changing to a region that includes the active location', () => {
        let activeSite = 'site-bole';
        const newRegion = 'ET-ADD';
        const matches = mockSites.some(s => s.id === activeSite && s.regionCode === newRegion);
        if (!matches) {
            activeSite = 'All';
        }
        expect(activeSite).toBe('site-bole');
    });
});
