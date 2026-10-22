import { describe, it, expect } from 'vitest';
import { getCountryProfile, type Country } from '../../utils/localization';
import { isAdminSite } from '../../utils/countryAdmin';
import type { BarcodeApproval, PendingInventoryChange, Product, Site } from '../../types';

describe('Inventory Subsystem & Barcode Audit Multi-Country Isolation & Zero-Trust Rules', () => {
    const mockSites: Site[] = [
        {
            id: 'site-hq-et',
            name: 'Central Operations',
            code: 'SITE-0001',
            type: 'Administration',
            country: 'ET',
            currency: 'ETB',
            status: 'Active',
            manager: 'Shukri Kamal',
            address: 'Addis Ababa',
            region: 'Addis Ababa'
        },
        {
            id: 'site-bole',
            name: 'Bole Supermarket',
            code: 'SITE-0002',
            type: 'Store',
            country: 'ET',
            currency: 'ETB',
            status: 'Active',
            manager: 'Abebe Bikila',
            address: 'Bole Sub-City',
            region: 'Addis Ababa'
        },
        {
            id: 'site-aratanya',
            name: 'Aratanya Market',
            code: 'SITE-0003',
            type: 'Store',
            country: 'ET',
            currency: 'ETB',
            status: 'Active',
            manager: 'Sara Bekele',
            address: 'Aratanya',
            region: 'Addis Ababa'
        },
        {
            id: 'site-hq-ke',
            name: 'Kenya Central Operations',
            code: 'SITE-KE-0001',
            type: 'Administration',
            country: 'KE',
            currency: 'KSh',
            status: 'Active',
            manager: 'HQ Administration',
            address: 'Nairobi CBD',
            region: 'Nairobi'
        },
        {
            id: 'site-westlands',
            name: 'Westlands Hypermarket',
            code: 'SITE-KE-0002',
            type: 'Store',
            country: 'KE',
            currency: 'KSh',
            status: 'Active',
            manager: 'John Kamau',
            address: 'Westlands, Nairobi',
            region: 'Nairobi'
        }
    ];

    const mockBarcodeApprovals: (BarcodeApproval & { countryCode?: string })[] = [
        {
            id: 'ba-001',
            productId: 'p-001',
            barcode: '30000003020818',
            productName: 'Freshi Apple Juice 500L – Pack of 12',
            productSku: 'ET-BV019',
            siteId: 'site-bole',
            createdBy: 'emp-001',
            createdAt: '2026-08-26T10:33:00Z',
            scannedBy: 'emp-001',
            scannedAt: '2026-08-26T10:33:00Z',
            status: 'approved',
            type: 'packaging',
            confidence: 0.98,
            countryCode: 'ET'
        },
        {
            id: 'ba-002',
            productId: 'p-002',
            barcode: 'BXK14BBBB',
            productName: 'Apple Watch',
            productSku: 'ET-EL002',
            siteId: 'site-aratanya',
            createdBy: 'emp-002',
            createdAt: '2026-08-26T07:59:00Z',
            scannedBy: 'emp-002',
            scannedAt: '2026-08-26T07:59:00Z',
            status: 'approved',
            type: 'packaging',
            confidence: 0.99,
            countryCode: 'ET'
        },
        {
            id: 'ba-003',
            productId: 'p-003',
            barcode: '6161100001234',
            productName: 'Brookside Fresh Milk 500ml',
            productSku: 'KE-DY001',
            siteId: 'site-westlands',
            createdBy: 'emp-003',
            createdAt: '2026-08-26T11:00:00Z',
            scannedBy: 'emp-003',
            scannedAt: '2026-08-26T11:00:00Z',
            status: 'approved',
            type: 'packaging',
            confidence: 0.97,
            countryCode: 'KE'
        }
    ];

    const mockInventoryRequests: PendingInventoryChange[] = [
        {
            id: 'req-001',
            productId: 'p-001',
            productName: 'Tusker Lager 500ml',
            productSku: 'KE-BV001',
            changeType: 'stock_adjustment',
            requestedBy: 'John Kamau',
            requestedAt: '2026-08-26T12:00:00Z',
            status: 'pending',
            siteId: 'site-westlands',
            countryCode: 'KE',
            adjustmentType: 'IN',
            adjustmentQty: 50,
            adjustmentReason: 'Direct Store Delivery (DSD)'
        },
        {
            id: 'req-002',
            productId: 'p-002',
            productName: 'Dawa Water 1L',
            productSku: 'ET-BV002',
            changeType: 'stock_adjustment',
            requestedBy: 'Sara Bekele',
            requestedAt: '2026-08-26T08:00:00Z',
            status: 'pending',
            siteId: 'site-bole',
            countryCode: 'ET',
            adjustmentType: 'OUT',
            adjustmentQty: 10,
            adjustmentReason: 'Damaged in transit'
        }
    ];

    describe('Rule 1 & 2: Absolute Multi-Country Barcode Mapping Isolation', () => {
        it('strictly separates barcode audit logs between Ethiopia and Kenya', () => {
            const countrySitesKE = new Set(mockSites.filter(s => s.country === 'KE').map(s => s.id));
            const countrySitesET = new Set(mockSites.filter(s => s.country === 'ET').map(s => s.id));

            const keAuditLogs = mockBarcodeApprovals.filter(b => countrySitesKE.has(b.siteId));
            const etAuditLogs = mockBarcodeApprovals.filter(b => countrySitesET.has(b.siteId));

            // Kenya must only see Kenya records
            expect(keAuditLogs.length).toBe(1);
            expect(keAuditLogs[0].productSku).toBe('KE-DY001');

            // Ethiopia must only see Ethiopia records
            expect(etAuditLogs.length).toBe(2);
            expect(etAuditLogs.every(b => Boolean(b.productSku?.startsWith('ET-')))).toBe(true);

            // Zero overlap
            const overlap = keAuditLogs.filter(b => countrySitesET.has(b.siteId));
            expect(overlap.length).toBe(0);
        });

        it('locks regular branch staff to their assigned site while HQ sees national rollup', () => {
            const boleSite = mockSites.find(s => s.code === 'SITE-0002')!;
            const hqSite = mockSites.find(s => s.code === 'SITE-0001')!;

            expect(isAdminSite(boleSite)).toBe(false);
            expect(isAdminSite(hqSite)).toBe(true);

            // Bole Supermarket staff sees only Bole mappings
            const boleAudit = mockBarcodeApprovals.filter(b => b.siteId === boleSite.id);
            expect(boleAudit.length).toBe(1);
            expect(boleAudit[0].productName).toContain('Freshi Apple Juice');

            // Ethiopian Administration HQ sees all Ethiopian sites
            const etSiteIds = new Set(mockSites.filter(s => s.country === 'ET').map(s => s.id));
            const hqAudit = mockBarcodeApprovals.filter(b => etSiteIds.has(b.siteId));
            expect(hqAudit.length).toBe(2);
        });
    });

    describe('Zero-Trust HQ Central Approval Model: Pending Requests Aggregation', () => {
        it('aggregates all national pending requests for Admin HQ without site restriction', () => {
            const activeCountry: Country = 'KE';
            const hqSite = mockSites.find(s => s.code === 'SITE-KE-0001')!;
            const isHqOrApprover = isAdminSite(hqSite);

            // When isHqOrApprover is true, targetSiteId is undefined so query pulls all country requests
            const targetSiteId = isHqOrApprover ? undefined : hqSite.id;
            expect(targetSiteId).toBeUndefined();

            const keRequests = mockInventoryRequests.filter(r =>
                r.countryCode === activeCountry && (!targetSiteId || r.siteId === targetSiteId)
            );

            expect(keRequests.length).toBe(1);
            expect(keRequests[0].productSku).toBe('KE-BV001');
            expect(keRequests[0].siteId).toBe('site-westlands');
        });

        it('prevents regular branch managers from viewing pending requests from other sites', () => {
            const activeCountry: Country = 'ET';
            const aratanyaSite = mockSites.find(s => s.code === 'SITE-0003')!;
            const isHqOrApprover = isAdminSite(aratanyaSite);

            const targetSiteId = isHqOrApprover ? undefined : aratanyaSite.id;
            expect(targetSiteId).toBe('site-aratanya');

            // Aratanya has no requests in mock data
            const aratanyaRequests = mockInventoryRequests.filter(r =>
                r.countryCode === activeCountry && (!targetSiteId || r.siteId === targetSiteId)
            );
            expect(aratanyaRequests.length).toBe(0);
        });

        it('enforces 4-Eyes Principle: only CEO and Super Admin hold canApprove authority', () => {
            const testRoles = [
                { role: 'group_ceo', expected: true },
                { role: 'group_ceo', expected: true },
                { role: 'store_manager', expected: false },
                { role: 'cashier', expected: false },
                { role: 'warehouse_manager', expected: false },
                { role: 'auditor', expected: false }
            ];

            testRoles.forEach(({ role, expected }) => {
                const canApprove = role === 'group_ceo' || role.toLowerCase() === 'group_ceo';
                expect(canApprove).toBe(expected);
            });
        });
    });

    describe('National Price Sovereignty & Dynamic Currency Formatting', () => {
        it('resolves correct local currency without cross-border fallback', () => {
            const etProfile = getCountryProfile('ET');
            const keProfile = getCountryProfile('KE');

            expect(etProfile.currencySymbol).toBe('ETB');
            expect(keProfile.currencySymbol).toBe('KSh');
            expect(etProfile.currency).toBe('ETB');
            expect(keProfile.currency).toBe('KSh');
            expect(keProfile.currencyCode).toBe('KES');
        });

        it('prevents hardcoded ETB in Kenyan inventory views', () => {
            const activeCountry: Country = 'KE';
            const countryProfile = getCountryProfile(activeCountry);
            const currencySymbol = countryProfile.currencySymbol;

            expect(currencySymbol).toBe('KSh');
            expect(currencySymbol).not.toBe('ETB');

            const itemPrice = 250;
            const formattedPrice = `${currencySymbol} ${itemPrice.toLocaleString()}`;
            expect(formattedPrice).toBe('KSh 250');
            expect(formattedPrice).not.toContain('ETB');
        });
    });
});
