import { describe, it, expect } from 'vitest';
import {
    isDeliveryJob,
    isFloorJob,
    isFloorWorkerRole,
    isDriverRole,
    canWorkerPerformJob,
    getJobAssignmentEligibility,
    FLOOR_JOB_TYPES,
    DELIVERY_JOB_TYPES,
    FLOOR_WORKER_ROLES
} from '../../utils/fulfillmentRoles';

describe('Fulfillment Roles & Job Eligibility Engine', () => {
    describe('Job Classification', () => {
        it('classifies delivery jobs correctly', () => {
            expect(isDeliveryJob('DRIVER')).toBe(true);
            expect(isDeliveryJob('driver')).toBe(true);
            expect(isDeliveryJob('DISPATCH')).toBe(true);
            expect(isDeliveryJob('dispatch')).toBe(true);
            expect(isDeliveryJob('DELIVERY')).toBe(true);

            expect(isDeliveryJob('PICK')).toBe(false);
            expect(isDeliveryJob('PACK')).toBe(false);
            expect(isDeliveryJob('RECEIVE')).toBe(false);
            expect(isDeliveryJob('PUTAWAY')).toBe(false);
            expect(isDeliveryJob('')).toBe(false);
            expect(isDeliveryJob(undefined)).toBe(false);
        });

        it('classifies floor jobs correctly', () => {
            for (const jobType of FLOOR_JOB_TYPES) {
                expect(isFloorJob(jobType)).toBe(true);
                expect(isFloorJob(jobType.toLowerCase())).toBe(true);
            }

            expect(isFloorJob('DRIVER')).toBe(false);
            expect(isFloorJob('DISPATCH')).toBe(false);
            expect(isFloorJob('')).toBe(false);
        });
    });

    describe('Floor Worker Cross-Functional Interchangeability', () => {
        it('allows floor workers to perform ANY floor job regardless of specific role', () => {
            for (const role of FLOOR_WORKER_ROLES) {
                for (const jobType of FLOOR_JOB_TYPES) {
                    const allowed = canWorkerPerformJob(role, jobType);
                    expect(allowed, `Expected role '${role}' to be able to perform '${jobType}'`).toBe(true);
                }
            }
        });

        it('specifically allows pickers to pack, receive, and putaway', () => {
            expect(canWorkerPerformJob('picker', 'PACK')).toBe(true);
            expect(canWorkerPerformJob('picker', 'RECEIVE')).toBe(true);
            expect(canWorkerPerformJob('picker', 'PUTAWAY')).toBe(true);
            expect(canWorkerPerformJob('picker', 'COUNT')).toBe(true);
        });

        it('specifically allows packers to pick, receive, and putaway', () => {
            expect(canWorkerPerformJob('packer', 'PICK')).toBe(true);
            expect(canWorkerPerformJob('packer', 'RECEIVE')).toBe(true);
            expect(canWorkerPerformJob('packer', 'PUTAWAY')).toBe(true);
        });

        it('specifically allows receivers to pick, pack, and putaway', () => {
            expect(canWorkerPerformJob('receiver', 'PICK')).toBe(true);
            expect(canWorkerPerformJob('receiver', 'PACK')).toBe(true);
            expect(canWorkerPerformJob('receiver', 'PUTAWAY')).toBe(true);
        });
    });

    describe('Driver Capabilities (Floor Work + Deliveries)', () => {
        it('allows drivers to perform ALL floor jobs', () => {
            for (const jobType of FLOOR_JOB_TYPES) {
                const allowed = canWorkerPerformJob('driver', jobType);
                expect(allowed, `Expected driver to be able to perform floor job '${jobType}'`).toBe(true);
            }
        });

        it('allows drivers to perform all delivery jobs', () => {
            for (const deliveryJob of DELIVERY_JOB_TYPES) {
                expect(canWorkerPerformJob('driver', deliveryJob)).toBe(true);
            }
        });
    });

    describe('Delivery Lockdown Law (Floor Workers CANNOT Deliver)', () => {
        it('strictly blocks floor workers from performing delivery jobs', () => {
            for (const role of FLOOR_WORKER_ROLES) {
                for (const deliveryJob of DELIVERY_JOB_TYPES) {
                    const allowed = canWorkerPerformJob(role, deliveryJob);
                    expect(allowed, `Expected floor worker '${role}' to be BLOCKED from '${deliveryJob}'`).toBe(false);

                    const eligibility = getJobAssignmentEligibility(role, deliveryJob);
                    expect(eligibility.eligible).toBe(false);
                    expect(eligibility.reason).toContain('Floor workers cannot be assigned to delivery missions');
                }
            }
        });

        it('blocks picker from DRIVER and DISPATCH missions', () => {
            expect(canWorkerPerformJob('picker', 'DRIVER')).toBe(false);
            expect(canWorkerPerformJob('picker', 'DISPATCH')).toBe(false);
            expect(canWorkerPerformJob('picker', 'DELIVERY')).toBe(false);
        });

        it('blocks packer from DRIVER and DISPATCH missions', () => {
            expect(canWorkerPerformJob('packer', 'DRIVER')).toBe(false);
            expect(canWorkerPerformJob('packer', 'DISPATCH')).toBe(false);
        });

        it('blocks receiver from DRIVER and DISPATCH missions', () => {
            expect(canWorkerPerformJob('receiver', 'DRIVER')).toBe(false);
            expect(canWorkerPerformJob('receiver', 'DISPATCH')).toBe(false);
        });
    });

    describe('Management & Oversight Authority', () => {
        it('allows warehouse managers and dispatchers to oversee/perform floor and delivery jobs', () => {
            expect(canWorkerPerformJob('warehouse_manager', 'PICK')).toBe(true);
            expect(canWorkerPerformJob('warehouse_manager', 'DRIVER')).toBe(true);
            expect(canWorkerPerformJob('dispatcher', 'DISPATCH')).toBe(true);
            expect(canWorkerPerformJob('dispatcher', 'PICK')).toBe(true);
            expect(canWorkerPerformJob('group_ceo', 'DRIVER')).toBe(true);
        });
    });

    describe('Invalid and Edge Cases', () => {
        it('handles null, undefined, or empty inputs gracefully', () => {
            expect(canWorkerPerformJob(null, 'PICK')).toBe(false);
            expect(canWorkerPerformJob('picker', null)).toBe(false);
            expect(canWorkerPerformJob(undefined, undefined)).toBe(false);
            expect(getJobAssignmentEligibility(null, null).eligible).toBe(false);
        });

        it('rejects unauthorized roles like cashier from warehouse jobs', () => {
            expect(canWorkerPerformJob('cashier', 'PICK')).toBe(false);
            expect(canWorkerPerformJob('cashier', 'DRIVER')).toBe(false);
        });
    });
});
