import { describe, it, expect } from 'vitest';
import { mapJobAssignmentRow } from '../../services/job-assignments.service';

describe('Job Assignments Realtime Mapping', () => {
    it('normalizes raw Postgres snake_case CDC payload into camelCase domain properties', () => {
        const rawPayload = {
            id: 'asg-uuid-1234',
            job_id: 'job-uuid-5678',
            employee_id: 'emp-uuid-9999',
            employee_name: 'Abebe Bikila',
            assigned_at: '2026-10-15T08:00:00Z',
            started_at: '2026-10-15T08:05:00Z',
            completed_at: null,
            status: 'Assigned',
            notes: 'Urgent priority pick',
            estimated_duration: 25,
            actual_duration: null,
            units_processed: 12,
            accuracy_rate: 98.5
        };

        const mapped = mapJobAssignmentRow(rawPayload);

        expect(mapped.id).toBe('asg-uuid-1234');
        expect(mapped.jobId).toBe('job-uuid-5678');
        expect(mapped.employeeId).toBe('emp-uuid-9999');
        expect(mapped.employeeName).toBe('Abebe Bikila');
        expect(mapped.assignedAt).toBe('2026-10-15T08:00:00Z');
        expect(mapped.startedAt).toBe('2026-10-15T08:05:00Z');
        expect(mapped.status).toBe('Assigned');
        expect(mapped.estimatedDuration).toBe(25);
        expect(mapped.unitsProcessed).toBe(12);
        expect(mapped.accuracyRate).toBe(98.5);
    });

    it('gracefully handles pre-mapped camelCase objects', () => {
        const preMapped = {
            id: 'asg-2',
            jobId: 'job-2',
            employeeId: 'emp-2',
            employeeName: 'John Kamau',
            assignedAt: '2026-10-15T09:00:00Z',
            status: 'In-Progress' as const
        };

        const result = mapJobAssignmentRow(preMapped);

        expect(result.jobId).toBe('job-2');
        expect(result.employeeId).toBe('emp-2');
        expect(result.employeeName).toBe('John Kamau');
        expect(result.status).toBe('In-Progress');
    });

    it('returns null/undefined when passed falsy input', () => {
        expect(mapJobAssignmentRow(null)).toBeNull();
        expect(mapJobAssignmentRow(undefined)).toBeUndefined();
    });
});
