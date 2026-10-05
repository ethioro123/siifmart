import { describe, it, expect, vi, beforeEach } from 'vitest';
import { systemLogsService } from '../../services/system-logs.service';
import { supabase } from '../../lib/supabase';
import { getDeviceId } from '../../utils/deviceIdentifier';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnValue({
            insert: vi.fn().mockResolvedValue({ error: null }),
            select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                }),
            }),
        }),
    },
}));

vi.mock('../../utils/geolocationHelper', () => ({
    getCachedAuditLocation: vi.fn().mockResolvedValue('GPS: 9.0300, 38.7400'),
    fetchLoginLocation: vi.fn().mockResolvedValue('GPS: 9.0300, 38.7400'),
}));

describe('Zero-Trust System Logs & Rule 5 Audit Trail Compliance (Step 4)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates an audit log entry automatically populated with employee_id, site_id, device_id, and GPS', async () => {
        const payload = {
            action: 'PUTAWAY_JOB_COMPLETED',
            module: 'Fulfillment',
            user_name: 'Abebe Worker',
            employee_id: 'emp-wms-101',
            site_id: 'WH-001',
            country_code: 'ET',
            details: {
                sku: 'ET-DY001',
                location: 'A-01-02',
                quantity: 20,
            },
        };

        const result = await systemLogsService.create(payload);

        expect(result.action).toBe('PUTAWAY_JOB_COMPLETED');
        expect(result.employee_id).toBe('emp-wms-101');
        expect(result.site_id).toBe('WH-001');
        expect(result.country_code).toBe('ET');
        expect(result.gps_location).toBe('GPS: 9.0300, 38.7400');
        expect(result.device_id).toBeTruthy();

        // Verify supabase insert was called with enriched columns and envelope
        expect(supabase.from).toHaveBeenCalledWith('system_logs');
        const insertMock = (supabase.from as any)().insert;
        expect(insertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'PUTAWAY_JOB_COMPLETED',
                employee_id: 'emp-wms-101',
                site_id: 'WH-001',
                country_code: 'ET',
                device_id: expect.stringMatching(/^DEV-/),
                gps_location: 'GPS: 9.0300, 38.7400',
                details: expect.stringContaining('"employeeId":"emp-wms-101"'),
            })
        );
    });

    it('generates a stable persistent deviceId for the terminal (Rule 5)', () => {
        const devId1 = getDeviceId();
        const devId2 = getDeviceId();
        expect(devId1).toBeTruthy();
        expect(devId1).toMatch(/^DEV-/);
        expect(devId1).toBe(devId2); // Persistent
    });

    it('preserves string details while packaging inside Rule 5 envelope', async () => {
        const payload = {
            action: 'TRANSFER_RECEIVED_CLEAN',
            module: 'Fulfillment',
            user_name: 'Sara Manager',
            employee_id: 'emp-mgr-202',
            site_id: 'ST-001',
            country_code: 'ET',
            details: 'Transfer TRF-500 received with 0 discrepancies',
        };

        const result = await systemLogsService.create(payload);
        const parsed = JSON.parse(result.details);

        expect(parsed.employeeId).toBe('emp-mgr-202');
        expect(parsed.siteId).toBe('ST-001');
        expect(parsed.deviceId).toBeTruthy();
        expect(parsed.gpsLocation).toBe('GPS: 9.0300, 38.7400');
        expect(parsed.message).toBe('Transfer TRF-500 received with 0 discrepancies');
    });
});
