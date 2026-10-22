/**
 * Fulfillment Role & Job Eligibility Engine
 * Enforces the Floor Worker Interchangeability & Delivery Lockdown Law:
 * 1. Floor workers (picker, packer, receiver, inventory_specialist, forklift_operator, stock_clerk)
 *    and drivers can perform ALL floor work (PICK, PACK, RECEIVE, PUTAWAY, COUNT, REPLENISH, TRANSFER, etc.)
 *    regardless of their specific title.
 * 2. Drivers CAN do all floor jobs in addition to delivery missions.
 * 3. Floor workers CANNOT do delivery jobs (DRIVER, DELIVERY, DISPATCH). Only verified drivers can perform deliveries.
 */

export const DELIVERY_JOB_TYPES = ['DRIVER', 'DELIVERY', 'DISPATCH'] as const;
export type DeliveryJobType = typeof DELIVERY_JOB_TYPES[number];

export const FLOOR_JOB_TYPES = [
    'PICK',
    'PACK',
    'RECEIVE',
    'PUTAWAY',
    'COUNT',
    'TRANSFER',
    'REPLENISH',
    'WASTE',
    'RETURNS',
    'LABELS'
] as const;
export type FloorJobType = typeof FLOOR_JOB_TYPES[number];

export const FLOOR_WORKER_ROLES = [
    'picker',
    'packer',
    'receiver',
    'inventory_specialist',
    'forklift_operator',
    'stock_clerk',
    'inbound_qc_inspector',
    'returns_clerk'
] as const;

export const DRIVER_ROLES = [
    'driver'
] as const;

export const FULFILLMENT_MANAGER_ROLES = [
    'super_admin',
    'admin',
    'manager',
    'regional_operations_manager',
    'head_of_operations',
    'warehouse_manager',
    'dispatcher',
    'logistics_manager',
    'inventory_manager',
    'fleet_maintenance_supervisor'
] as const;

export const ALL_WAREHOUSE_ROLES = [
    ...FULFILLMENT_MANAGER_ROLES,
    ...FLOOR_WORKER_ROLES,
    ...DRIVER_ROLES
] as const;

/**
 * Checks if a job type is classified as a delivery mission.
 */
export function isDeliveryJob(jobType: string | undefined | null): boolean {
    if (!jobType) return false;
    const normalized = jobType.trim().toUpperCase();
    return (DELIVERY_JOB_TYPES as readonly string[]).includes(normalized);
}

/**
 * Checks if a job type is classified as an internal warehouse/store floor job.
 */
export function isFloorJob(jobType: string | undefined | null): boolean {
    if (!jobType) return false;
    const normalized = jobType.trim().toUpperCase();
    return (FLOOR_JOB_TYPES as readonly string[]).includes(normalized);
}

/**
 * Checks if an employee role is a floor worker.
 */
export function isFloorWorkerRole(role: string | undefined | null): boolean {
    if (!role) return false;
    const normalized = role.trim().toLowerCase();
    return (FLOOR_WORKER_ROLES as readonly string[]).includes(normalized);
}

/**
 * Checks if an employee role is a driver.
 */
export function isDriverRole(role: string | undefined | null): boolean {
    if (!role) return false;
    const normalized = role.trim().toLowerCase();
    return (DRIVER_ROLES as readonly string[]).includes(normalized);
}

/**
 * Checks if an employee role is a warehouse or fulfillment manager / supervisor / dispatcher.
 */
export function isFulfillmentManagerRole(role: string | undefined | null): boolean {
    if (!role) return false;
    const normalized = role.trim().toLowerCase();
    return (FULFILLMENT_MANAGER_ROLES as readonly string[]).includes(normalized);
}

/**
 * Determines whether a worker can perform a given job type.
 *
 * Rules:
 * - Drivers: CAN perform delivery jobs AND all floor jobs.
 * - Floor workers: CAN perform ALL floor jobs, but CANNOT perform delivery jobs.
 * - Fulfillment Managers: CAN perform / oversee both.
 */
export function canWorkerPerformJob(role: string | undefined | null, jobType: string | undefined | null): boolean {
    if (!role || !jobType) return false;
    const normalizedRole = role.trim().toLowerCase();
    const normalizedJob = jobType.trim().toUpperCase();

    // 1. Delivery jobs (DRIVER, DISPATCH, DELIVERY)
    if (isDeliveryJob(normalizedJob)) {
        // Floor workers are strictly locked out of delivery missions
        if (isFloorWorkerRole(normalizedRole)) {
            return false;
        }
        // Drivers and dispatchers/managers can perform delivery
        if (isDriverRole(normalizedRole) || isFulfillmentManagerRole(normalizedRole)) {
            return true;
        }
        return false;
    }

    // 2. Floor jobs (PICK, PACK, RECEIVE, PUTAWAY, COUNT, TRANSFER, etc.)
    if (isFloorJob(normalizedJob)) {
        // Both floor workers and drivers are 100% cross-functional on floor jobs
        if (isFloorWorkerRole(normalizedRole) || isDriverRole(normalizedRole)) {
            return true;
        }
        if (isFulfillmentManagerRole(normalizedRole)) {
            return true;
        }
        return false;
    }

    // 3. Fallback for custom or unlisted jobs:
    // If it's any warehouse-capable role, allow floor work, but block if role is floor worker and job mentions delivery
    if ((ALL_WAREHOUSE_ROLES as readonly string[]).includes(normalizedRole)) {
        if (isFloorWorkerRole(normalizedRole) && normalizedJob.includes('DELIV')) {
            return false;
        }
        return true;
    }

    return false;
}

/**
 * Detailed eligibility evaluation with user-friendly human rejection messages.
 */
export function getJobAssignmentEligibility(
    role: string | undefined | null,
    jobType: string | undefined | null
): { eligible: boolean; reason?: string } {
    if (!role || !jobType) {
        return { eligible: false, reason: 'Missing worker role or job type' };
    }

    const normalizedRole = role.trim().toLowerCase();
    const normalizedJob = jobType.trim().toUpperCase();

    if (isDeliveryJob(normalizedJob) && isFloorWorkerRole(normalizedRole)) {
        return {
            eligible: false,
            reason: 'Floor workers cannot be assigned to delivery missions. Only verified drivers can perform deliveries.'
        };
    }

    if (!canWorkerPerformJob(normalizedRole, normalizedJob)) {
        return {
            eligible: false,
            reason: `Role '${role}' is not authorized to perform '${jobType}' jobs.`
        };
    }

    return { eligible: true };
}
