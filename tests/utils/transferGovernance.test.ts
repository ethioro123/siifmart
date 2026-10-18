import { describe, it, expect } from 'vitest';
import {
    isTransferStatusDeletable,
    isTransferManager,
    isTransferCreator,
    canDeleteTransferManifest,
    DELETABLE_TRANSFER_STATUSES,
    NON_DELETABLE_TRANSFER_STATUSES
} from '../../utils/transferGovernance';
import type { WMSJob, User } from '../../types';

describe('Transfer Manifest Governance & Deletion Lifecycle', () => {
    describe('1. Lifecycle Status Boundaries', () => {
        it('allows deletion for pre-approval and rejected statuses', () => {
            const allowed = ['Requested', 'Draft', 'Pending', 'Rejected', 'Cancelled', 'requested', 'REJECTED'];
            for (const status of allowed) {
                expect(isTransferStatusDeletable(status)).toBe(true);
            }
        });

        it('strictly forbids deletion for approved or active execution statuses', () => {
            const forbidden = [
                'Approved',
                'Picking',
                'Picked',
                'Packed',
                'Shipped',
                'In-Transit',
                'In Transit',
                'Delivered',
                'Partially Delivered',
                'Received',
                'Completed',
                'approved',
                'picking'
            ];
            for (const status of forbidden) {
                expect(isTransferStatusDeletable(status)).toBe(false);
            }
        });
    });

    describe('2. Manager Role Authorization', () => {
        it('authorizes executive and operational managers', () => {
            const managerRoles = [
                'super_admin',
                'CEO',
                'admin',
                'warehouse_manager',
                'operations_manager',
                'supply_chain_manager',
                'logistics_manager',
                'regional_manager',
                'inventory_manager',
                'regional_logistics_lead'
            ];

            for (const role of managerRoles) {
                const user = { id: 'u1', name: 'Manager Bob', role: role as any, avatar: '', title: '' };
                expect(isTransferManager(user)).toBe(true);
            }
        });

        it('denies non-approver roles from transfer approval authority', () => {
            const floorRoles = ['cashier', 'picker', 'packer', 'receiver', 'stock_clerk', 'sales_associate', 'driver', 'inventory_specialist', 'replenishment_planner', 'dispatcher', 'dispatch_manager', 'assistant_manager', 'store_manager'];

            for (const role of floorRoles) {
                const user = { id: 'u2', name: 'Staff Alice', role: role as any, avatar: '', title: '' };
                expect(isTransferManager(user)).toBe(false);
            }
        });
    });

    describe('3. Manifest Creator Identification', () => {
        const mockJob: Partial<WMSJob> = {
            id: 'job-101',
            jobNumber: 'TRF-101',
            requestedBy: 'Kennedy Odhiambo Odhiambo',
            createdBy: 'Kennedy Odhiambo Odhiambo'
        };

        it('identifies creator when user name matches exactly or case-insensitively', () => {
            const creatorUser: User = {
                id: 'usr-kennedy',
                name: 'Kennedy Odhiambo Odhiambo',
                role: 'stock_clerk',
                avatar: '',
                title: 'Clerk'
            };
            expect(isTransferCreator(mockJob, creatorUser)).toBe(true);

            const caseUser: User = {
                id: 'usr-diff-id',
                name: 'kennedy odhiambo odhiambo ',
                role: 'stock_clerk',
                avatar: '',
                title: 'Clerk'
            };
            expect(isTransferCreator(mockJob, caseUser)).toBe(true);
        });

        it('identifies creator when job createdBy or requestedBy references user ID or email', () => {
            const idJob: Partial<WMSJob> = {
                id: 'job-102',
                requestedBy: 'usr-1234'
            };
            const user: User = {
                id: 'usr-1234',
                name: 'John Doe',
                role: 'stock_clerk',
                avatar: '',
                title: 'Clerk'
            };
            expect(isTransferCreator(idJob, user)).toBe(true);
        });

        it('returns false when user is not the creator', () => {
            const otherUser: User = {
                id: 'usr-other',
                name: 'Peter Omondi',
                role: 'stock_clerk',
                avatar: '',
                title: 'Clerk'
            };
            expect(isTransferCreator(mockJob, otherUser)).toBe(false);
        });
    });

    describe('4. Comprehensive Permission Evaluator (canDeleteTransferManifest)', () => {
        const creatorUser: User = {
            id: 'usr-kennedy',
            name: 'Kennedy Odhiambo Odhiambo',
            role: 'stock_clerk',
            avatar: '',
            title: 'Clerk'
        };

        const managerUser: User = {
            id: 'usr-mgr',
            name: 'Store Manager Sarah',
            role: 'warehouse_manager',
            avatar: '',
            title: 'Store Manager'
        };

        const bystanderUser: User = {
            id: 'usr-other',
            name: 'Other Clerk',
            role: 'picker',
            avatar: '',
            title: 'Picker'
        };

        const rejectedJob: Partial<WMSJob> = {
            id: 'job-5OHHVC',
            jobNumber: '5OHHVC',
            transferStatus: 'Rejected',
            requestedBy: 'Kennedy Odhiambo Odhiambo'
        };

        const requestedJob: Partial<WMSJob> = {
            id: 'job-REQ1',
            jobNumber: 'REQ1',
            transferStatus: 'Requested',
            requestedBy: 'Kennedy Odhiambo Odhiambo'
        };

        const approvedJob: Partial<WMSJob> = {
            id: 'job-APP1',
            jobNumber: 'APP1',
            transferStatus: 'Approved',
            requestedBy: 'Kennedy Odhiambo Odhiambo'
        };

        const inTransitJob: Partial<WMSJob> = {
            id: 'job-TRANS1',
            jobNumber: 'TRANS1',
            transferStatus: 'In-Transit',
            requestedBy: 'Kennedy Odhiambo Odhiambo'
        };

        it('allows creator to delete their rejected manifest (#5OHHVC)', () => {
            const result = canDeleteTransferManifest(rejectedJob, creatorUser);
            expect(result.canDelete).toBe(true);
            expect(result.isCreator).toBe(true);
            expect(result.isDeletableStatus).toBe(true);
            expect(result.reason).toBeNull();
        });

        it('allows creator to delete their unapproved transfer request before approval', () => {
            const result = canDeleteTransferManifest(requestedJob, creatorUser);
            expect(result.canDelete).toBe(true);
            expect(result.isCreator).toBe(true);
            expect(result.reason).toBeNull();
        });

        it('allows an authorized manager to delete unapproved or rejected manifest', () => {
            const resReq = canDeleteTransferManifest(requestedJob, managerUser);
            expect(resReq.canDelete).toBe(true);
            expect(resReq.isManager).toBe(true);

            const resRej = canDeleteTransferManifest(rejectedJob, managerUser);
            expect(resRej.canDelete).toBe(true);
            expect(resRej.isManager).toBe(true);
        });

        it('blocks creator from deleting manifest once it has been approved', () => {
            const result = canDeleteTransferManifest(approvedJob, creatorUser);
            expect(result.canDelete).toBe(false);
            expect(result.isDeletableStatus).toBe(false);
            expect(result.reason).toContain('once approved or in active execution');
        });

        it('blocks manager from deleting manifest once it has been approved', () => {
            const result = canDeleteTransferManifest(approvedJob, managerUser);
            expect(result.canDelete).toBe(false);
            expect(result.isDeletableStatus).toBe(false);
            expect(result.reason).toContain('once approved or in active execution');
        });

        it('blocks deletion of in-transit manifests for all parties', () => {
            expect(canDeleteTransferManifest(inTransitJob, creatorUser).canDelete).toBe(false);
            expect(canDeleteTransferManifest(inTransitJob, managerUser).canDelete).toBe(false);
        });

        it('denies third-party non-manager staff from deleting another persons request', () => {
            const result = canDeleteTransferManifest(requestedJob, bystanderUser);
            expect(result.canDelete).toBe(false);
            expect(result.isDeletableStatus).toBe(true);
            expect(result.isAuthorizedUser).toBe(false);
            expect(result.reason).toContain('Only the manifest creator or an authorized manager');
        });
    });
});
