import { describe, it, expect, vi, beforeEach } from 'vitest';
import { systemConfigService } from '../../services/config.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => {
    const mockFrom = vi.fn();
    return {
        supabase: {
            from: mockFrom
        },
        isSupabaseConfigured: () => true
    };
});

describe('systemConfigService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('updateSettings', () => {
        it('safely filters out columns not in LIVE_SYSTEM_CONFIG_COLUMNS to prevent PGRST204', async () => {
            const mockSingle = vi.fn().mockResolvedValue({
                data: {
                    id: '00000000-0000-0000-0000-000000000001',
                    store_name: 'SIIFMART Kenya',
                    currency: 'KSh',
                    tax_rate: 16
                },
                error: null
            });
            const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
            const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
            (supabase.from as any).mockReturnValue({ upsert: mockUpsert });

            const result = await systemConfigService.updateSettings({
                country: 'KE',
                currency: 'KSh',
                storeName: 'SIIFMART Kenya',
                taxRate: 16,
                complianceStandard: 'KRA Electronic Tax Invoice Management System (eTIMS)',
                taxAuthority: 'Kenya Revenue Authority (KRA)',
                eTimsEnabled: true
            }, 'CEO');

            // Verify upsert call: must NOT contain complianceStandard, taxAuthority, or non-existent columns
            const sentPayload = mockUpsert.mock.calls[0][0];
            expect(sentPayload).toBeDefined();
            expect(sentPayload.store_name).toBe('SIIFMART Kenya');
            expect(sentPayload.currency).toBe('KSh');
            expect(sentPayload.tax_rate).toBe(16);

            // Raw unmapped camelCase keys must NOT be present
            expect(sentPayload.complianceStandard).toBeUndefined();
            expect(sentPayload.taxAuthority).toBeUndefined();
            expect(sentPayload.eTimsEnabled).toBeUndefined();

            // Un-migrated snake_case columns must NOT be present in DB payload
            expect(sentPayload.compliance_standard).toBeUndefined();
            expect(sentPayload.tax_authority).toBeUndefined();
            expect(sentPayload.country).toBeUndefined();

            // The returned object must still retain the requested overrides
            expect(result.country).toBe('KE');
            expect(result.currency).toBe('KSh');
            expect(result.complianceStandard).toBe('KRA Electronic Tax Invoice Management System (eTIMS)');
            expect(result.taxAuthority).toBe('Kenya Revenue Authority (KRA)');
            expect(result.eTimsEnabled).toBe(true);
        });

        it('maps camelCase properties to snake_case column names correctly', async () => {
            const mockSingle = vi.fn().mockResolvedValue({
                data: {
                    id: '00000000-0000-0000-0000-000000000001',
                    pos_terminal_id: 'TERM-009',
                    pos_guest_checkout: false,
                    default_vat_rate: 15
                },
                error: null
            });
            const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
            const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
            (supabase.from as any).mockReturnValue({ upsert: mockUpsert });

            await systemConfigService.updateSettings({
                posTerminalId: 'TERM-009',
                posGuestCheckout: false,
                defaultVatRate: 15
            }, 'Admin');

            const sentPayload = mockUpsert.mock.calls[0][0];
            expect(sentPayload.pos_terminal_id).toBe('TERM-009');
            expect(sentPayload.pos_guest_checkout).toBe(false);
            expect(sentPayload.default_vat_rate).toBe(15);
        });
    });

    describe('getSettings', () => {
        it('correctly maps snake_case DB columns to SystemConfig and derives defaults', async () => {
            const mockMaybeSingle = vi.fn().mockResolvedValue({
                data: {
                    id: '00000000-0000-0000-0000-000000000001',
                    store_name: 'SIIFMART Addis',
                    currency: 'ETB',
                    tax_rate: 15,
                    date_format: 'DD/MM/YYYY'
                },
                error: null
            });
            const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            (supabase.from as any).mockReturnValue({ select: mockSelect });

            const config = await systemConfigService.getSettings();

            expect(config.storeName).toBe('SIIFMART Addis');
            expect(config.currency).toBe('ETB');
            expect(config.country).toBe('ET');
            expect(config.taxAuthority).toContain('ERCA');
        });

        it('correctly maps Uganda currency and timezone to UG and configures URA without defaulting to ET', async () => {
            const mockMaybeSingle = vi.fn().mockResolvedValue({
                data: {
                    id: '00000000-0000-0000-0000-000000000001',
                    currency: 'USh',
                    timezone: 'Africa/Kampala',
                    tax_rate: 18
                },
                error: null
            });
            const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            (supabase.from as any).mockReturnValue({ select: mockSelect });

            const config = await systemConfigService.getSettings();

            expect(config.country).toBe('UG');
            expect(config.currency).toBe('USh');
            expect(config.timezone).toBe('Africa/Kampala');
            expect(config.taxRate).toBe(18);
            expect(config.taxAuthority).toContain('Uganda Revenue Authority');
            expect(config.taxAuthority).not.toContain('ERCA');
        });

        it('correctly maps Rwanda and Tanzania to their sovereign country profiles', async () => {
            const rwandaConfig = systemConfigService._mapSettings({
                currency: 'RWF',
                timezone: 'Africa/Kigali'
            });
            expect(rwandaConfig.country).toBe('RW');
            expect(rwandaConfig.taxAuthority).toContain('Rwanda');

            const tanzaniaConfig = systemConfigService._mapSettings({
                currency: 'TSh',
                timezone: 'Africa/Dar_es_Salaam'
            });
            expect(tanzaniaConfig.country).toBe('TZ');
            expect(tanzaniaConfig.taxAuthority).toContain('Tanzania');
        });
    });
});
