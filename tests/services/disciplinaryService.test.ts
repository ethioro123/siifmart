import { describe, it, expect, beforeEach, vi } from 'vitest';
import { disciplinaryService } from '../../services/disciplinary.service';
import type { DisciplinaryType, DisciplinarySeverity } from '../../types/hr-advanced';

// Mock supabase & systemLogsService
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('Simulated network error for local fallback testing') }),
            insert: vi.fn(() => ({
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: new Error('Simulated insert fallback') })
            })),
            update: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null })
            }))
        }))
    }
}));

vi.mock('../../services/system-logs.service', () => ({
    systemLogsService: {
        create: vi.fn().mockResolvedValue(true)
    }
}));

describe('Disciplinary Service & Zero-Trust Governance', () => {
    beforeEach(() => {
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    it('issues a disciplinary notice with a valid UUID and country scoping', async () => {
        const notice = await disciplinaryService.issueDisciplinaryNotice({
            country_code: 'ET',
            site_id: 'ET-ADDIS-01',
            employee_id: '11111111-1111-4111-a111-111111111111',
            employee_name: 'Abebe Bikila',
            record_type: 'Written Warning',
            severity: 'Medium',
            title: 'Attendance Failure',
            description: 'Unexcused absence on shift',
            action_taken: 'Mandatory meeting and 30-day warning',
            issued_by: 'Supervisory Manager',
            issued_by_role: 'store_manager',
            expires_at: '2026-12-31',
            confidential_notes: 'First offense'
        });

        expect(notice).toBeDefined();
        // RFC4122 UUID pattern
        expect(notice.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(notice.country_code).toBe('ET');
        expect(notice.site_id).toBe('ET-ADDIS-01');
        expect(notice.employee_name).toBe('Abebe Bikila');
        expect(notice.appeal_status).toBe('None');
        expect(notice.expires_at).toBe('2026-12-31');
        expect(notice.confidential_notes).toBe('First offense');
    });

    it('maintains multi-country isolation between Kenya and Ethiopia', async () => {
        await disciplinaryService.issueDisciplinaryNotice({
            country_code: 'ET',
            employee_id: '22222222-2222-4222-a222-222222222222',
            employee_name: 'Dawit Getachew',
            record_type: 'Verbal Warning',
            severity: 'Low',
            title: 'Late Arrival',
            description: 'Tardy by 20 mins',
            action_taken: 'Verbal reminder',
            issued_by: 'Store Lead',
            issued_by_role: 'store_supervisor'
        });

        await disciplinaryService.issueDisciplinaryNotice({
            country_code: 'KE',
            employee_id: '33333333-3333-4333-a333-333333333333',
            employee_name: 'Kamau Njoroge',
            record_type: 'Final Warning',
            severity: 'Critical',
            title: 'Safety Breach',
            description: 'Forklift operation without inspection',
            action_taken: 'Immediate 14-day suspension',
            issued_by: 'Warehouse Lead',
            issued_by_role: 'warehouse_manager'
        });

        const etRecords = await disciplinaryService.fetchDisciplinaryRecords('ET');
        const keRecords = await disciplinaryService.fetchDisciplinaryRecords('KE');

        expect(etRecords.some(r => r.employee_name === 'Dawit Getachew')).toBe(true);
        expect(etRecords.some(r => r.employee_name === 'Kamau Njoroge')).toBe(false);

        expect(keRecords.some(r => r.employee_name === 'Kamau Njoroge')).toBe(true);
        expect(keRecords.some(r => r.employee_name === 'Dawit Getachew')).toBe(false);
    });

    it('allows filing a formal appeal by the target employee', async () => {
        const empId = '44444444-4444-4444-a444-444444444444';
        const notice = await disciplinaryService.issueDisciplinaryNotice({
            country_code: 'ET',
            employee_id: empId,
            employee_name: 'Sara Tesfaye',
            record_type: 'Written Warning',
            severity: 'High',
            title: 'Stock Discrepancy',
            description: 'Unaccounted shrinkage in aisle 4',
            action_taken: 'Written warning',
            issued_by: 'Inventory Manager',
            issued_by_role: 'inventory_manager'
        });

        const success = await disciplinaryService.fileAppeal(
            notice.id,
            empId,
            'I was off-duty during the count; CCTV verifies I was not in aisle 4.'
        );

        expect(success).toBe(true);

        const records = await disciplinaryService.fetchDisciplinaryRecords('ET', empId);
        const updated = records.find(r => r.id === notice.id);
        expect(updated?.appeal_status).toBe('Pending Appeal');
        expect(updated?.confidential_notes).toContain('[Appeal filed]');
    });

    it('enforces 4-Eyes Maker-Checker rule: issuer cannot adjudicate the appeal', async () => {
        const empId = '55555555-5555-4555-a555-555555555555';
        const notice = await disciplinaryService.issueDisciplinaryNotice({
            country_code: 'ET',
            employee_id: empId,
            employee_name: 'Kassahun Belay',
            record_type: 'Suspension',
            severity: 'Critical',
            title: 'Misconduct Investigation',
            description: 'Till discrepancy',
            action_taken: 'Suspended pending audit',
            issued_by: 'Michael Scott',
            issued_by_role: 'store_manager'
        });

        await disciplinaryService.fileAppeal(notice.id, empId, 'Grounds for appeal');

        // Issuer attempts to resolve by matching name
        await expect(
            disciplinaryService.resolveAppeal(
                notice.id,
                'Overturned',
                { id: 'mgr-001', name: 'Michael Scott', role: 'store_manager' }
            )
        ).rejects.toThrow('Maker-Checker violation');

        // Independent reviewer adjudicates
        const resolved = await disciplinaryService.resolveAppeal(
            notice.id,
            'Overturned',
            { id: 'hr-dir-01', name: 'Helen Mirren', role: 'head_of_hr' },
            'CCTV reviewed and staff member exonerated.'
        );

        expect(resolved).toBe(true);

        const records = await disciplinaryService.fetchDisciplinaryRecords('ET', empId);
        const resolvedNotice = records.find(r => r.id === notice.id);
        expect(resolvedNotice?.appeal_status).toBe('Overturned');
        expect(resolvedNotice?.confidential_notes).toContain('Overturned by Helen Mirren');
    });
});
