import type { WMSJob, User } from '../types';
import { isManagerialRole } from './roles';

/**
 * Manifest statuses that are permissible for deletion.
 * Only unapproved draft/requests or rejected/cancelled transfers can be deleted.
 */
export const DELETABLE_TRANSFER_STATUSES = [
    'requested',
    'draft',
    'pending',
    'rejected',
    'cancelled'
] as const;

/**
 * Manifest statuses that are strictly locked against deletion.
 * Once approved, picked, in-transit, or received, deletion is forbidden to protect inventory integrity.
 */
export const NON_DELETABLE_TRANSFER_STATUSES = [
    'approved',
    'picking',
    'picked',
    'packed',
    'shipped',
    'in-transit',
    'in transit',
    'delivered',
    'partially delivered',
    'received',
    'completed'
] as const;

/**
 * Roles with managerial authority over warehouse transfers.
 */
export const TRANSFER_MANAGER_ROLES = [
    'super_admin',
    'ceo',
    'admin',
    'warehouse_manager',
    'store_manager',
    'operations_manager',
    'supply_chain_manager',
    'logistics_manager',
    'regional_logistics_lead',
    'regional_manager',
    'inventory_manager',
    'dispatch_manager',
    'assistant_manager'
] as const;

/**
 * Checks whether a transfer manifest's lifecycle status allows deletion.
 * Returns true only for pre-approval ('Requested', 'Draft', 'Pending')
 * or rejected/cancelled ('Rejected', 'Cancelled') manifests.
 */
export const isTransferStatusDeletable = (status?: string | null): boolean => {
    if (!status) return true; // Default unassigned is treated as pre-approval draft
    const normalized = status.trim().toLowerCase();
    if (NON_DELETABLE_TRANSFER_STATUSES.includes(normalized as any)) {
        return false;
    }
    return DELETABLE_TRANSFER_STATUSES.includes(normalized as any);
};

/**
 * Checks if a user has managerial role permissions over transfer manifests.
 */
export const isTransferManager = (user?: User | null): boolean => {
    if (!user || !user.role) return false;
    const role = user.role.toLowerCase();
    return TRANSFER_MANAGER_ROLES.includes(role as any) || isManagerialRole(user.role);
};

/**
 * Checks whether the user is the creator or requester of the transfer manifest.
 */
export const isTransferCreator = (job?: Partial<WMSJob> | null, user?: User | null): boolean => {
    if (!job || !user) return false;

    const userName = (user.name || '').trim().toLowerCase();
    const userId = (user.id || '').trim().toLowerCase();
    const userEmail = ((user as any).email || '').trim().toLowerCase();

    // Collect candidate identifiers from the manifest
    const candidates: string[] = [];

    const addCandidate = (val: unknown) => {
        if (!val) return;
        if (typeof val === 'string') {
            const trimmed = val.trim().toLowerCase();
            if (trimmed) candidates.push(trimmed);
        } else if (typeof val === 'object' && val !== null) {
            const obj = val as Record<string, unknown>;
            if (typeof obj.name === 'string') addCandidate(obj.name);
            if (typeof obj.id === 'string') addCandidate(obj.id);
            if (typeof obj.email === 'string') addCandidate(obj.email);
        }
    };

    addCandidate(job.requestedBy);
    addCandidate((job as any).requested_by);
    addCandidate((job as any).requestedById);
    addCandidate((job as any).requested_by_id);
    addCandidate(job.createdBy);
    addCandidate((job as any).created_by);
    addCandidate((job as any).createdById);
    addCandidate((job as any).created_by_id);

    return candidates.some(candidate =>
        (userName && candidate === userName) ||
        (userId && candidate === userId) ||
        (userEmail && candidate === userEmail)
    );
};

export interface TransferDeletionPermission {
    canDelete: boolean;
    isDeletableStatus: boolean;
    isAuthorizedUser: boolean;
    isManager: boolean;
    isCreator: boolean;
    reason: string | null;
}

/**
 * Enterprise lifecycle and zero-trust permission evaluator for transfer manifest deletion.
 * Enforces:
 * 1. Status rule: Deletion allowed ONLY prior to approval or after rejection.
 * 2. Actor rule: Deletion allowed ONLY by the creator or an authorized manager.
 */
export const canDeleteTransferManifest = (
    job?: Partial<WMSJob> | null,
    user?: User | null
): TransferDeletionPermission => {
    if (!job) {
        return {
            canDelete: false,
            isDeletableStatus: false,
            isAuthorizedUser: false,
            isManager: false,
            isCreator: false,
            reason: 'Manifest not found.'
        };
    }

    const status = job.transferStatus || job.status || 'Requested';
    const statusDeletable = isTransferStatusDeletable(status);
    const manager = isTransferManager(user);
    const creator = isTransferCreator(job, user);
    const authorized = manager || creator;

    if (!statusDeletable) {
        return {
            canDelete: false,
            isDeletableStatus: false,
            isAuthorizedUser: authorized,
            isManager: manager,
            isCreator: creator,
            reason: 'Manifest cannot be deleted once approved or in active execution.'
        };
    }

    if (!authorized) {
        return {
            canDelete: false,
            isDeletableStatus: true,
            isAuthorizedUser: false,
            isManager: false,
            isCreator: false,
            reason: 'Only the manifest creator or an authorized manager can delete this manifest.'
        };
    }

    return {
        canDelete: true,
        isDeletableStatus: true,
        isAuthorizedUser: true,
        isManager: manager,
        isCreator: creator,
        reason: null
    };
};
