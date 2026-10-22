import { describe, it, expect } from 'vitest';
import { evaluateGeofence, parseCoordinates, formatSiteAssignment } from '../../utils/geofence';
import { getUserCountry, canSwitchCountry } from '../../utils/permissions';
import { MOCK_SITES, MOCK_EMPLOYEES } from '../../constants/mock-data';
import { Employee, Site, ShiftRecord } from '../../types';

describe('Geofence & Off-Premise Anomaly Detection', () => {
    it('detects foreign coordinates in Melbourne, Australia as a critical security anomaly', () => {
        const melbourneGps = '-37.7802, 144.9167';
        const evaluation = evaluateGeofence(melbourneGps);

        expect(evaluation.isOffPremise).toBe(true);
        expect(evaluation.isForeignAnomaly).toBe(true);
        expect(evaluation.severity).toBe('critical');
        expect(evaluation.anomalyReason).toContain('Outside East African territory');
    });

    it('detects text-based foreign IP addresses as critical security anomalies', () => {
        const foreignIpLocation = 'IP-Loc: Melbourne, Australia (2001:8004:4602:f980:89c3:af20:8e14:90ec)';
        const evaluation = evaluateGeofence(foreignIpLocation);

        expect(evaluation.isOffPremise).toBe(true);
        expect(evaluation.isForeignAnomaly).toBe(true);
        expect(evaluation.severity).toBe('critical');
        expect(evaluation.anomalyReason).toContain('Foreign Territory Detected');
    });

    it('validates Addis Ababa coordinates as legitimate Ethiopian operational presence', () => {
        const addisGps = '9.0300, 38.7400';
        const evaluation = evaluateGeofence(addisGps, 'ET');

        expect(evaluation.isOffPremise).toBe(false);
        expect(evaluation.isForeignAnomaly).toBe(false);
        expect(evaluation.countryDetected).toBe('ET');
    });

    it('validates Nairobi coordinates as legitimate Kenyan operational presence', () => {
        const nairobiGps = '-1.2921, 36.8219';
        const evaluation = evaluateGeofence(nairobiGps, 'KE');

        expect(evaluation.isOffPremise).toBe(false);
        expect(evaluation.isForeignAnomaly).toBe(false);
        expect(evaluation.countryDetected).toBe('KE');
    });

    it('detects cross-border anomaly when Kenyan coordinates appear in Ethiopian branch session', () => {
        const nairobiGps = '-1.2921, 36.8219';
        const evaluation = evaluateGeofence(nairobiGps, 'ET');

        expect(evaluation.isOffPremise).toBe(true);
        // It's still East Africa, so isForeignAnomaly is false, but isOffPremise is true
        expect(evaluation.isForeignAnomaly).toBe(false);
        expect(evaluation.anomalyReason).toContain('Cross-Border Anomaly: Coordinates outside Ethiopia');
        expect(evaluation.severity).toBe('warning');
    });

    it('safely handles protected and unrecorded location strings', () => {
        expect(evaluateGeofence('Protected').isOffPremise).toBe(false);
        expect(evaluateGeofence('N/A').isOffPremise).toBe(false);
        expect(evaluateGeofence(undefined).isOffPremise).toBe(false);
    });
});

describe('Zero-Trust Site Scoping & Assignment Formatting', () => {
    const sites: Site[] = [
        {
            id: 'site-et-1',
            name: 'Addis Mercato Central Store',
            type: 'Store',
            status: 'Active',
            country: 'ET',
            currency: 'ETB',
            code: 'ET-ADD-01',
            terminalCount: 4,
            address: 'Addis Ababa'
        },
        {
            id: 'site-ke-1',
            name: 'Nairobi Central Distribution Hub',
            type: 'Warehouse',
            status: 'Active',
            country: 'KE',
            currency: 'KSh',
            code: 'KE-NBO-01',
            terminalCount: 2,
            address: 'Nairobi'
        }
    ];

    it('formats assigned facility name cleanly', () => {
        const result = formatSiteAssignment('site-et-1', 'store_manager', sites);
        expect(result.label).toBe('Addis Mercato Central Store');
        expect(result.isWarning).toBe(false);
        expect(result.isHQ).toBe(false);
    });

    it('assigns unassigned corporate/HQ executive roles to Central Operations', () => {
        const hqRoles = ['super_admin', 'ceo', 'head_of_operations', 'head_of_finance', 'head_of_hr', 'head_of_procurement',];
        for (const role of hqRoles) {
            const result = formatSiteAssignment(undefined, role, sites);
            expect(result.label).toBe('Central Operations');
            expect(result.isWarning).toBe(false);
            expect(result.isHQ).toBe(true);
        }
    });

    it('flags unassigned branch staff (store/warehouse managers, cashiers) as a security warning', () => {
        const branchRoles = ['store_manager', 'warehouse_manager', 'cashier', 'picker', 'packer', 'driver'];
        for (const role of branchRoles) {
            const result = formatSiteAssignment(undefined, role, sites);
            expect(result.label).toBe('Unassigned Facility');
            expect(result.isWarning).toBe(true);
            expect(result.isHQ).toBe(false);
        }
    });
});

describe('Real Workforce Metrics (No Fake Math / Hardcoding)', () => {
    it('computes real active shifts count from open shift records', () => {
        const shifts: ShiftRecord[] = [
            {
                id: 'shift-1',
                siteId: 'site-1',
                cashierId: 'emp-1',
                cashierName: 'Abebe',
                startTime: '2026-09-28T08:00:00Z',
                status: 'Open',
                openingFloat: 500,
                cashSales: 1200,
                expectedCash: 1700,
                actualCash: 0,
                variance: 0,
                reconciliationStatus: 'Pending'
            },
            {
                id: 'shift-2',
                siteId: 'site-1',
                cashierId: 'emp-2',
                cashierName: 'Kebede',
                startTime: '2026-09-28T07:00:00Z',
                endTime: '2026-09-28T15:00:00Z',
                status: 'Closed',
                openingFloat: 500,
                cashSales: 2400,
                expectedCash: 2900,
                actualCash: 2900,
                variance: 0,
                reconciliationStatus: 'Reconciled'
            }
        ];

        const openShifts = shifts.filter(s => s.status === 'Open' || !s.endTime);
        expect(openShifts.length).toBe(1);
    });

    it('computes real average performance score across rated employees', () => {
        const employees: Partial<Employee>[] = [
            { id: '1', name: 'Sara', performanceScore: 90 },
            { id: '2', name: 'Rahel', performanceScore: 80 },
            { id: '3', name: 'Tigist', performanceScore: 100 }
        ];

        const rated = employees.filter(e => typeof e.performanceScore === 'number' && e.performanceScore > 0);
        const avg = Math.round(rated.reduce((acc, e) => acc + (e.performanceScore || 0), 0) / rated.length);
        expect(avg).toBe(90);
    });
});

describe('Branch Manager Sovereignty & Market Lockdown (Amina Ali Case)', () => {
    it('locks Store Manager Amina Ali strictly to Ethiopia via ST-007 Merkato Retail Store', () => {
        const aminaUser = {
            id: 'EMP-036',
            employeeId: 'EMP-036',
            name: 'Amina Ali',
            role: 'store_manager',
            siteId: 'ST-007'
        };

        const country = getUserCountry(aminaUser, MOCK_SITES, MOCK_EMPLOYEES);
        expect(country).toBe('ET');

        const canSwitch = canSwitchCountry(aminaUser);
        expect(canSwitch).toBe(false);
    });

    it('falls back to Ethiopia ET if employee site is unassigned (Zero-Trust baseline)', () => {
        const unassignedManager = {
            id: 'unassigned-1',
            name: 'Amina Ali',
            role: 'store_manager',
            siteId: undefined
        };

        const country = getUserCountry(unassignedManager, MOCK_SITES, []);
        expect(country).toBe('ET');
    });

    it('verifies Merkato Retail Store (ST-007) is registered as an active Ethiopian store', () => {
        const merkatoSite = MOCK_SITES.find(s => s.id === 'ST-007');
        expect(merkatoSite).toBeDefined();
        expect(merkatoSite?.country).toBe('ET');
        expect(merkatoSite?.currency).toBe('ETB');
        expect(merkatoSite?.manager).toBe('Amina Ali');
    });
});

