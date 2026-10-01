// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getCountryAdminDefaults, isAdminSite, findCountryAdminSite } from '../../utils/countryAdmin';
import { useCountryScoping } from '../../contexts/hooks/useCountryScoping';
import { sitesService } from '../../services/sites.service';
import type { Site } from '../../types';

describe('Country Administration Central HQ System', () => {
    describe('getCountryAdminDefaults', () => {
        it('returns historic Central Operations (SITE-0001) for Ethiopia (ET)', () => {
            const defaults = getCountryAdminDefaults('ET');
            expect(defaults.code).toBe('SITE-0001');
            expect(defaults.name).toBe('Central Operations');
            expect(defaults.type).toBe('Administration');
            expect(defaults.country).toBe('ET');
            expect(defaults.currency).toBe('ETB');
            expect(defaults.status).toBe('Active');
        });

        it('returns Kenya Central Operations (SITE-KE-0001) with KSh currency for Kenya (KE)', () => {
            const defaults = getCountryAdminDefaults('KE');
            expect(defaults.code).toBe('SITE-KE-0001');
            expect(defaults.name).toBe('Kenya Central Operations');
            expect(defaults.type).toBe('Administration');
            expect(defaults.country).toBe('KE');
            expect(defaults.currency).toBe('KSh');
            expect(defaults.status).toBe('Active');
        });

        it('returns Uganda Central Operations (SITE-UG-0001) with USh currency for Uganda (UG)', () => {
            const defaults = getCountryAdminDefaults('UG');
            expect(defaults.code).toBe('SITE-UG-0001');
            expect(defaults.name).toBe('Uganda Central Operations');
            expect(defaults.type).toBe('Administration');
            expect(defaults.country).toBe('UG');
            expect(defaults.currency).toBe('USh');
        });

        it('returns Rwanda Central Operations (SITE-RW-0001) with RWF currency for Rwanda (RW)', () => {
            const defaults = getCountryAdminDefaults('RW');
            expect(defaults.code).toBe('SITE-RW-0001');
            expect(defaults.name).toBe('Rwanda Central Operations');
            expect(defaults.type).toBe('Administration');
            expect(defaults.country).toBe('RW');
            expect(defaults.currency).toBe('RWF');
        });

        it('returns Tanzania Central Operations (SITE-TZ-0001) with TSh currency for Tanzania (TZ)', () => {
            const defaults = getCountryAdminDefaults('TZ');
            expect(defaults.code).toBe('SITE-TZ-0001');
            expect(defaults.name).toBe('Tanzania Central Operations');
            expect(defaults.type).toBe('Administration');
            expect(defaults.country).toBe('TZ');
            expect(defaults.currency).toBe('TSh');
        });
    });

    describe('isAdminSite', () => {
        it('identifies Administration, Administrative, and HQ site types', () => {
            expect(isAdminSite({ type: 'Administration' })).toBe(true);
            expect(isAdminSite({ type: 'Administrative' })).toBe(true);
            expect(isAdminSite({ type: 'HQ' })).toBe(true);
            expect(isAdminSite({ type: 'Headquarters' })).toBe(true);
            expect(isAdminSite({ type: 'Central Operations' })).toBe(true);
        });

        it('returns false for Store, Warehouse, and Distribution Center', () => {
            expect(isAdminSite({ type: 'Store' })).toBe(false);
            expect(isAdminSite({ type: 'Warehouse' })).toBe(false);
            expect(isAdminSite({ type: 'Distribution Center' })).toBe(false);
            expect(isAdminSite(null)).toBe(false);
            expect(isAdminSite(undefined)).toBe(false);
        });
    });

    describe('findCountryAdminSite', () => {
        const mockSiteList: Site[] = [
            {
                id: 'eth-hq',
                code: 'SITE-0001',
                name: 'Central Operations',
                type: 'Administration',
                address: 'Addis Ababa',
                status: 'Active',
                country: 'ET',
                currency: 'ETB'
            },
            {
                id: 'eth-store-1',
                code: 'SITE-0002',
                name: 'Bole Retail Store',
                type: 'Store',
                address: 'Bole',
                status: 'Active',
                country: 'ET',
                currency: 'ETB'
            },
            {
                id: 'ke-dc-1',
                code: 'SITE-KE-0002',
                name: 'Nairobi DC',
                type: 'Distribution Center',
                address: 'Industrial Area',
                status: 'Active',
                country: 'KE',
                currency: 'KSh'
            },
            {
                id: 'ke-hq',
                code: 'SITE-KE-0001',
                name: 'Kenya Central Operations',
                type: 'Administration',
                address: 'Nairobi CBD',
                status: 'Active',
                country: 'KE',
                currency: 'KSh'
            }
        ];

        it('correctly resolves Ethiopia Central Operations for ET', () => {
            const admin = findCountryAdminSite(mockSiteList, 'ET');
            expect(admin).toBeDefined();
            expect(admin?.id).toBe('eth-hq');
            expect(admin?.country).toBe('ET');
            expect(admin?.name).toBe('Central Operations');
        });

        it('correctly resolves Kenya Central Operations for KE with zero ET bleeding', () => {
            const admin = findCountryAdminSite(mockSiteList, 'KE');
            expect(admin).toBeDefined();
            expect(admin?.id).toBe('ke-hq');
            expect(admin?.country).toBe('KE');
            expect(admin?.name).toBe('Kenya Central Operations');
            expect(admin?.currency).toBe('KSh');
        });

        it('returns undefined if a country has no Administration site and prevents cross-country fallback', () => {
            const admin = findCountryAdminSite(mockSiteList, 'UG');
            expect(admin).toBeUndefined();
        });
    });

    describe('Auto-Provisioning & Delete Protection in sitesService', () => {
        it('has ensureCountryAdministrationSite method defined', () => {
            expect(typeof sitesService.ensureCountryAdministrationSite).toBe('function');
        });
    });

    describe('useCountryScoping with Administration Central HQ', () => {
        it('prioritizes switching to Administration Central HQ when switching countries', () => {
            const setActiveSiteId = vi.fn();
            const sitesWithAdmin: Site[] = [
                { id: 'et-1', code: 'SITE-0001', name: 'Central Operations', type: 'Administration', address: 'Bole', status: 'Active', country: 'ET', currency: 'ETB' },
                { id: 'ke-store-1', code: 'SITE-KE-0002', name: 'Westlands Store', type: 'Store', address: 'Westlands', status: 'Active', country: 'KE', currency: 'KSh' },
                { id: 'ke-admin-1', code: 'SITE-KE-0001', name: 'Kenya Central Operations', type: 'Administration', address: 'Nairobi CBD', status: 'Active', country: 'KE', currency: 'KSh' },
            ];

            renderHook(() =>
                useCountryScoping({
                    country: 'KE',
                    sites: sitesWithAdmin,
                    activeSiteId: 'et-1', // was in Ethiopia
                    setActiveSiteId,
                    allOrders: [],
                    allSales: [],
                    employees: [],
                    movements: [],
                    shifts: [],
                    expenses: [],
                    allProducts: [],
                    suppliers: []
                })
            );

            // Must switch to Kenya Central Operations ('ke-admin-1'), NOT Westlands Store ('ke-store-1')!
            expect(setActiveSiteId).toHaveBeenCalledWith('ke-admin-1');
        });
    });
});

