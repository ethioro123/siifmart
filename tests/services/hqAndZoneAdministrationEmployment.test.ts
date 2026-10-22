import { describe, it, expect, vi, beforeEach } from 'vitest';
import { employeesService } from '../../services/employees.service';
import { canEmployRole, getRoleHierarchy, canViewLocation, SYSTEM_ROLES } from '../../utils/roles';
import {
    validateRoleSiteAssignment,
    autoSelectSiteForRole,
    canRoleBeAtSiteType,
    getRequiredSiteType
} from '../../utils/roleSegregation';
import { supabase } from '../../lib/supabase';
import type { Employee, Site, UserRole } from '../../types';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn()
    }
}));

describe('HQ and Zone Administration Employment & Hierarchy Lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockSites: Site[] = [
        {
            id: 'site-et-hq',
            name: 'SIIFMART Central Operations (HQ)',
            type: 'Administration',
            code: 'ET-ADD-ADM-01',
            regionCode: 'ET-ADD',
            region_code: 'ET-ADD',
            country: 'ET',
            address: 'Addis Ababa Bole Subcity',
            status: 'Active'
        },
        {
            id: 'site-ke-hq',
            name: 'Kenya Central Operations (HQ)',
            type: 'Administration',
            code: 'KE-NRB-ADM-13',
            regionCode: 'KE-NRB',
            region_code: 'KE-NRB',
            country: 'KE',
            address: 'Nairobi Kilimani',
            status: 'Active'
        },
        {
            id: 'site-et-dire-wh',
            name: 'Dire Dawa Logistics Hub',
            type: 'Warehouse',
            code: 'ET-DIR-WH-02',
            regionCode: 'ET-DIR',
            region_code: 'ET-DIR',
            country: 'ET',
            address: 'Dire Dawa Industrial Park',
            status: 'Active'
        },
        {
            id: 'site-ke-kileleshwa-store',
            name: 'Kileleshwa Retail Store',
            type: 'Store',
            code: 'KE-NRB-STR-17',
            regionCode: 'KE-NRB',
            region_code: 'KE-NRB',
            country: 'KE',
            address: 'Nairobi Kileleshwa',
            status: 'Active'
        }
    ];

    describe('1. Employment at HQ (Administration Sites)', () => {
        it('permits corporate, finance, hr, procurement and executive roles at HQ', () => {
            const hqRoles: UserRole[] = [
                'super_admin',
                'admin',
                'head_of_hr',
                'head_of_finance',
                'head_of_procurement',
                'head_of_supply_chain',
                'head_of_merchandising',
                'accountant',
                'treasury_officer',
                'tax_compliance_officer',
                'credit_control_officer',
                'buyer',
                'auditor',
                'it_support',
                'payroll_specialist'
            ];

            hqRoles.forEach(role => {
                expect(getRequiredSiteType(role)).toBe('Administration');
                expect(canRoleBeAtSiteType(role, 'Administration')).toBe(true);
                expect(validateRoleSiteAssignment(role, 'Administration')).toBeNull();
            });
        });

        it('strictly blocks store-only and warehouse-only staff from being employed at HQ', () => {
            const storeRoles: UserRole[] = ['cashier', 'sales_associate', 'store_manager', 'store_supervisor'];
            const warehouseRoles: UserRole[] = ['picker', 'packer', 'receiver', 'forklift_operator', 'warehouse_manager'];

            storeRoles.forEach(role => {
                expect(canRoleBeAtSiteType(role, 'Administration')).toBe(false);
                const error = validateRoleSiteAssignment(role, 'Administration');
                expect(error).toContain('must be assigned to a Store location');
            });

            warehouseRoles.forEach(role => {
                expect(canRoleBeAtSiteType(role, 'Administration')).toBe(false);
                const error = validateRoleSiteAssignment(role, 'Administration');
                expect(error).toContain('must be assigned to a Warehouse location');
            });
        });

        it('autoSelectSiteForRole automatically selects HQ facility for corporate roles', () => {
            const selectedHq = autoSelectSiteForRole('head_of_finance', mockSites);
            expect(selectedHq).toBe('site-et-hq');

            const selectedWh = autoSelectSiteForRole('forklift_operator', mockSites);
            expect(selectedWh).toBe('site-et-dire-wh');

            const selectedStore = autoSelectSiteForRole('cashier', mockSites);
            expect(selectedStore).toBe('site-ke-kileleshwa-store');
        });
    });

    describe('2. Employment at Zone Administration (Territorial Operational Zones)', () => {
        it('allows Regional & Zone Administration roles flexible deployment across any facility type', () => {
            const zoneAdminRoles: UserRole[] = [
                'regional_operations_manager',
                'regional_procurement_manager',
                'regional_finance_manager',
                'regional_hr_manager',
                'regional_logistics_manager',
                'regional_security_manager',
                'store_operations_auditor',
                'head_of_operations'
            ];

            zoneAdminRoles.forEach(role => {
                expect(getRequiredSiteType(role)).toBe('Any');
                expect(canRoleBeAtSiteType(role, 'Administration')).toBe(true);
                expect(canRoleBeAtSiteType(role, 'Warehouse')).toBe(true);
                expect(canRoleBeAtSiteType(role, 'Store')).toBe(true);
                expect(validateRoleSiteAssignment(role, 'Administration')).toBeNull();
                expect(validateRoleSiteAssignment(role, 'Warehouse')).toBeNull();
                expect(validateRoleSiteAssignment(role, 'Store')).toBeNull();
            });
        });

        it('auto-resolves and stores region_code from site when employing at Zone Administration', async () => {
            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'emp-zone-01',
                            code: 'ET-SIIF0050',
                            site_id: 'site-et-dire-wh',
                            region_code: 'ET-DIR',
                            name: 'Dire Dawa Regional Lead',
                            role: 'regional_logistics_manager',
                            email: 'et-siif0050@siifmart.com',
                            phone: '+251911000050',
                            status: 'Active',
                            join_date: '2026-10-12',
                            department: 'Transport',
                            performance_score: 100,
                            attendance_rate: 100
                        },
                        error: null
                    })
                })
            });

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: { region_code: 'ET-DIR' },
                                    error: null
                                })
                            })
                        })
                    } as any;
                }
                if (table === 'employees') {
                    return { insert: insertMock } as any;
                }
                return {} as any;
            });

            const created = await employeesService.create({
                id: 'emp-zone-01',
                code: 'ET-SIIF0050',
                siteId: 'site-et-dire-wh',
                name: 'Dire Dawa Regional Lead',
                role: 'regional_logistics_manager',
                email: 'et-siif0050@siifmart.com',
                phone: '+251911000050',
                status: 'Active',
                joinDate: '2026-10-12',
                department: 'Transport',
                avatar: '',
                performanceScore: 100,
                attendanceRate: 100
            });

            expect(insertMock).toHaveBeenCalled();
            const insertedPayload = insertMock.mock.calls[0][0];
            expect(insertedPayload.site_id).toBe('site-et-dire-wh');
            expect(insertedPayload.region_code).toBe('ET-DIR');
            expect(created.regionCode).toBe('ET-DIR');
        });

        it('correctly filters employees by territorial region_code for zone governance', async () => {
            const mockRegionalIds = [
                { id: 'emp-z1', role: 'regional_operations_manager', name: 'Abebe Zone Mgr', created_at: '2026-10-12' },
                { id: 'emp-z2', role: 'cashier', name: 'Almaz Cashier', created_at: '2026-10-12' }
            ];

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                then: (resolve: any) => resolve({ data: mockRegionalIds, error: null, count: 2 })
            };

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                if (table === 'employees') {
                    return {
                        select: vi.fn((_cols: string, opts?: any) => {
                            if (opts?.count === 'exact') return mockQuery;
                            return {
                                in: vi.fn().mockResolvedValue({
                                    data: [
                                        { id: 'emp-z1', role: 'regional_operations_manager', name: 'Abebe Zone Mgr', region_code: 'ET-DIR' },
                                        { id: 'emp-z2', role: 'cashier', name: 'Almaz Cashier', region_code: 'ET-DIR' }
                                    ],
                                    error: null
                                })
                            };
                        })
                    } as any;
                }
                return {} as any;
            });

            const result = await employeesService.getPaginated(
                undefined,
                1,
                20,
                '',
                { regionCode: 'ET-DIR' }
            );

            expect(mockQuery.eq).toHaveBeenCalledWith('region_code', 'ET-DIR');
            expect(result.data.length).toBe(2);
            expect(result.data[0].role).toBe('regional_operations_manager');
        });
    });

    describe('3. Organizational Hierarchy & Hiring Governance', () => {
        it('CEO (Rank 100) possesses unrestricted hiring authority across all levels below CEO', () => {
            expect(canEmployRole('super_admin', 'super_admin')).toBe(false); // cannot employ another CEO
            expect(canEmployRole('super_admin', 'CEO')).toBe(false);

            // Level 2 - Directors & Regional
            expect(canEmployRole('super_admin', 'regional_operations_manager')).toBe(true);
            expect(canEmployRole('super_admin', 'head_of_operations')).toBe(true);
            expect(canEmployRole('super_admin', 'head_of_finance')).toBe(true);
            expect(canEmployRole('super_admin', 'head_of_hr')).toBe(true);
            expect(canEmployRole('super_admin', 'head_of_procurement')).toBe(true);

            // Level 3 - Site Managers
            expect(canEmployRole('super_admin', 'store_manager')).toBe(true);
            expect(canEmployRole('super_admin', 'warehouse_manager')).toBe(true);

            // Level 4 - Staff
            expect(canEmployRole('super_admin', 'cashier')).toBe(true);
            expect(canEmployRole('super_admin', 'picker')).toBe(true);
        });

        it('Head of Human Resources (Rank 85) cannot hire CEO or peer directors, but can hire Level 3 managers and Level 4 staff', () => {
            // Cannot hire superiors
            expect(canEmployRole('head_of_hr', 'super_admin')).toBe(false);
            expect(canEmployRole('head_of_hr', 'regional_operations_manager')).toBe(false);
            expect(canEmployRole('head_of_hr', 'head_of_operations')).toBe(false);

            // Cannot hire peers (Level 2)
            expect(canEmployRole('head_of_hr', 'head_of_hr')).toBe(false);
            expect(canEmployRole('head_of_hr', 'head_of_finance')).toBe(false);
            expect(canEmployRole('head_of_hr', 'head_of_procurement')).toBe(false);

            // Can hire Level 3 facility managers
            expect(canEmployRole('head_of_hr', 'store_manager')).toBe(true);
            expect(canEmployRole('head_of_hr', 'warehouse_manager')).toBe(true);

            // Can hire Level 4 staff
            expect(canEmployRole('head_of_hr', 'cashier')).toBe(true);
            expect(canEmployRole('head_of_hr', 'picker')).toBe(true);
            expect(canEmployRole('head_of_hr', 'accountant')).toBe(true);
        });

        it('Regional Manager (Rank 95) can employ territorial managers and staff below Level 2 rank', () => {
            expect(canEmployRole('regional_operations_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('regional_operations_manager', 'regional_operations_manager')).toBe(false);

            expect(canEmployRole('regional_operations_manager', 'head_of_operations')).toBe(false); // peer L2
            expect(canEmployRole('regional_operations_manager', 'store_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'warehouse_manager')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'cashier')).toBe(true);
            expect(canEmployRole('regional_operations_manager', 'picker')).toBe(true);
        });

        it('Site Managers (Rank 80) can only hire within their facility domain and rank below them', () => {
            // Store Manager
            expect(canEmployRole('store_manager', 'super_admin')).toBe(false);
            expect(canEmployRole('store_manager', 'regional_operations_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'store_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'warehouse_manager')).toBe(false);
            expect(canEmployRole('store_manager', 'assistant_manager')).toBe(true);
            expect(canEmployRole('store_manager', 'shift_lead')).toBe(true);
            expect(canEmployRole('store_manager', 'cashier')).toBe(true);

            // Warehouse Manager
            expect(canEmployRole('warehouse_manager', 'store_manager')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'warehouse_manager')).toBe(false);
            expect(canEmployRole('warehouse_manager', 'picker')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'forklift_operator')).toBe(true);
            expect(canEmployRole('warehouse_manager', 'driver')).toBe(true);
        });

        it('Staff (Level 4, Rank 20-30) possess zero hiring authority', () => {
            const staffRoles: UserRole[] = ['cashier', 'picker', 'driver', 'stock_clerk', 'sales_associate'];
            staffRoles.forEach(role => {
                expect(canEmployRole(role, 'cashier')).toBe(false);
                expect(canEmployRole(role, 'sales_associate')).toBe(false);
                expect(canEmployRole(role, 'picker')).toBe(false);
                expect(canEmployRole(role, 'super_admin')).toBe(false);
            });
        });
    });

    describe('4. Directory Hierarchy Sorting & Seniority Rank', () => {
        it('verifies strict descending hierarchy ranks from Executive to Staff', () => {
            const ceoRank = getRoleHierarchy('super_admin');
            const opsMgrRank = getRoleHierarchy('head_of_operations');
            const regionalMgrRank = getRoleHierarchy('regional_operations_manager');
            const hrMgrRank = getRoleHierarchy('head_of_hr');
            const storeMgrRank = getRoleHierarchy('store_manager');
            const shiftLeadRank = getRoleHierarchy('shift_lead');
            const cashierRank = getRoleHierarchy('cashier');
            const pickerRank = getRoleHierarchy('picker');
            const driverRank = getRoleHierarchy('driver');

            expect(ceoRank).toBe(100);
            expect(opsMgrRank).toBe(95);
            expect(regionalMgrRank).toBe(90);
            expect(hrMgrRank).toBe(85);
            expect(storeMgrRank).toBe(80);
            expect(shiftLeadRank).toBe(55);
            expect(cashierRank).toBe(30);
            expect(pickerRank).toBe(22);
            expect(driverRank).toBe(20);

            expect(ceoRank).toBeGreaterThan(opsMgrRank);
            expect(opsMgrRank).toBeGreaterThan(regionalMgrRank);
            expect(regionalMgrRank).toBeGreaterThan(hrMgrRank);
            expect(hrMgrRank).toBeGreaterThan(storeMgrRank);
            expect(storeMgrRank).toBeGreaterThan(shiftLeadRank);
            expect(shiftLeadRank).toBeGreaterThan(cashierRank);
            expect(cashierRank).toBeGreaterThan(pickerRank);
            expect(pickerRank).toBeGreaterThan(driverRank);
        });

        it('sorts paginated directory globally by rank descending before slicing', async () => {
            const mockRawEmployees = [
                { id: 'emp-1', role: 'cashier', name: 'Zack Cashier', created_at: '2026-10-12' },
                { id: 'emp-2', role: 'super_admin', name: 'Executive CEO', created_at: '2026-10-12' },
                { id: 'emp-3', role: 'store_manager', name: 'Berta Store Mgr', created_at: '2026-10-12' },
                { id: 'emp-4', role: 'head_of_hr', name: 'Charlie HR', created_at: '2026-10-12' }
            ];

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                then: (resolve: any) => resolve({ data: mockRawEmployees, error: null, count: 4 })
            };

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                if (table === 'employees') {
                    return {
                        select: vi.fn((_cols: string, opts?: any) => {
                            if (opts?.count === 'exact') return mockQuery;
                            return {
                                in: vi.fn().mockResolvedValue({
                                    data: [
                                        { id: 'emp-2', role: 'super_admin', name: 'Executive CEO' },
                                        { id: 'emp-4', role: 'head_of_hr', name: 'Charlie HR' },
                                        { id: 'emp-3', role: 'store_manager', name: 'Berta Store Mgr' },
                                        { id: 'emp-1', role: 'cashier', name: 'Zack Cashier' }
                                    ],
                                    error: null
                                })
                            };
                        })
                    } as any;
                }
                return {} as any;
            });

            const result = await employeesService.getPaginated(undefined, 1, 10, '');

            expect(result.data.length).toBe(4);
            expect(result.data[0].role).toBe('super_admin');
            expect(result.data[1].role).toBe('head_of_hr');
            expect(result.data[2].role).toBe('store_manager');
            expect(result.data[3].role).toBe('cashier');
        });

        it('enforces supervisory visibility hierarchy rules via canViewLocation', () => {
            // CEO can view everyone
            expect(canViewLocation('super_admin', 'head_of_hr', false)).toBe(true);
            expect(canViewLocation('super_admin', 'cashier', false)).toBe(true);

            // HR can view all except CEO
            expect(canViewLocation('head_of_hr', 'store_manager', false)).toBe(true);
            expect(canViewLocation('head_of_hr', 'cashier', false)).toBe(true);
            expect(canViewLocation('head_of_hr', 'super_admin', false)).toBe(false);

            // Store Manager can only view below their rank
            expect(canViewLocation('store_manager', 'cashier', false)).toBe(true);
            expect(canViewLocation('store_manager', 'shift_lead', false)).toBe(true);
            expect(canViewLocation('store_manager', 'store_manager', false)).toBe(false);
            expect(canViewLocation('store_manager', 'head_of_hr', false)).toBe(false);

            // Self view is always permitted
            expect(canViewLocation('cashier', 'cashier', true)).toBe(true);
        });
    });
});
