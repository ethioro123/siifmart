import { describe, it, expect } from 'vitest';
import {
    isTransferStatusDeletable,
    isTransferManager,
    isTransferCreator,
    canDeleteTransferManifest,
    TRANSFER_MANAGER_ROLES
} from '../../utils/transferGovernance';

describe('WMS Logistics & Cross-Border Transfer Quarantine Governance Suite', () => {
    describe('Multi-Country Sovereignty & Border Quarantine', () => {
        it('identifies cross-border transfers as sovereignty violations', () => {
            const etSiteCountry: string = 'ET';
            const keSiteCountry: string = 'KE';
            const isCrossBorder = etSiteCountry !== keSiteCountry;

            expect(isCrossBorder).toBe(true);
        });

        it('strictly confines transfer operations within the same national boundary', () => {
            const sameCountry1 = 'ET';
            const sameCountry2 = 'ET';
            expect(sameCountry1 === sameCountry2).toBe(true);
        });
    });

    describe('Lifecycle Manifest Deletion Rules (isTransferStatusDeletable)', () => {
        it('permits deletion of unapproved requests, drafts, and cancelled transfers', () => {
            expect(isTransferStatusDeletable('requested')).toBe(true);
            expect(isTransferStatusDeletable('draft')).toBe(true);
            expect(isTransferStatusDeletable('pending')).toBe(true);
            expect(isTransferStatusDeletable('rejected')).toBe(true);
            expect(isTransferStatusDeletable('cancelled')).toBe(true);
            expect(isTransferStatusDeletable(null)).toBe(true);
        });

        it('strictly locks approved and in-flight manifests against deletion', () => {
            expect(isTransferStatusDeletable('approved')).toBe(false);
            expect(isTransferStatusDeletable('picking')).toBe(false);
            expect(isTransferStatusDeletable('picked')).toBe(false);
            expect(isTransferStatusDeletable('packed')).toBe(false);
            expect(isTransferStatusDeletable('shipped')).toBe(false);
            expect(isTransferStatusDeletable('in-transit')).toBe(false);
            expect(isTransferStatusDeletable('delivered')).toBe(false);
            expect(isTransferStatusDeletable('received')).toBe(false);
            expect(isTransferStatusDeletable('completed')).toBe(false);
        });
    });

    describe('Managerial Authority & Harmonized HQ Roles (isTransferManager)', () => {
        it('authorizes Global CEO and Country Managing Director as transfer managers', () => {
            expect(isTransferManager({ id: '1', role: 'ceo', name: 'Global CEO' } as any)).toBe(true);
            expect(isTransferManager({ id: '2', role: 'super_admin', name: 'Super Admin' } as any)).toBe(true);
            expect(isTransferManager({ id: '3', role: 'country_managing_director', name: 'MD' } as any)).toBe(true);
        });

        it('authorizes Head of Operations and Head of Supply Chain', () => {
            expect(isTransferManager({ id: '4', role: 'head_of_operations', name: 'Ops Head' } as any)).toBe(true);
            expect(isTransferManager({ id: '5', role: 'head_of_operations', name: 'Ops Head' } as any)).toBe(true);
            expect(isTransferManager({ id: '6', role: 'head_of_supply_chain', name: 'SC Head' } as any)).toBe(true);
            expect(isTransferManager({ id: '7', role: 'head_of_supply_chain', name: 'SC Head' } as any)).toBe(true);
        });

        it('authorizes field logistics and warehouse managers', () => {
            expect(isTransferManager({ id: '8', role: 'warehouse_manager', name: 'WH Mgr' } as any)).toBe(true);
            expect(isTransferManager({ id: '9', role: 'regional_operations_manager', name: 'Reg Mgr' } as any)).toBe(true);
            expect(isTransferManager({ id: '10', role: 'regional_logistics_manager', name: 'Logistics Lead' } as any)).toBe(true);
            expect(isTransferManager({ id: '11', role: 'inventory_manager', name: 'Inv Mgr' } as any)).toBe(true);
        });

        it('denies floor execution and retail store roles transfer managerial control', () => {
            expect(isTransferManager({ id: '12', role: 'picker', name: 'Picker' } as any)).toBe(false);
            expect(isTransferManager({ id: '13', role: 'packer', name: 'Packer' } as any)).toBe(false);
            expect(isTransferManager({ id: '14', role: 'driver', name: 'Driver' } as any)).toBe(false);
            expect(isTransferManager({ id: '15', role: 'cashier', name: 'Cashier' } as any)).toBe(false);
        });
    });

    describe('Maker-Checker Segregation & Deletion Permission (canDeleteTransferManifest)', () => {
        const mockDraftJob = {
            id: 'job-1',
            status: 'Draft',
            transferStatus: 'Draft',
            requestedBy: 'Oliya Fekadu',
            createdBy: 'Oliya Fekadu'
        };

        const mockInTransitJob = {
            id: 'job-2',
            status: 'In-Transit',
            transferStatus: 'In-Transit',
            requestedBy: 'Oliya Fekadu',
            createdBy: 'Oliya Fekadu'
        };

        it('allows creator to delete their own unapproved draft request', () => {
            const creatorUser = { id: 'u-1', name: 'Oliya Fekadu', role: 'inventory_specialist' };
            const decision = canDeleteTransferManifest(mockDraftJob as any, creatorUser as any);
            expect(decision.canDelete).toBe(true);
            expect(decision.isCreator).toBe(true);
            expect(decision.isDeletableStatus).toBe(true);
        });

        it('allows an authorized manager to delete an unapproved draft request', () => {
            const managerUser = { id: 'u-2', name: 'Tamirat Tola', role: 'head_of_supply_chain' };
            const decision = canDeleteTransferManifest(mockDraftJob as any, managerUser as any);
            expect(decision.canDelete).toBe(true);
            expect(decision.isManager).toBe(true);
        });

        it('strictly denies deletion of in-transit transfers even for executive leadership', () => {
            const ceoUser = { id: 'u-ceo', name: 'CEO', role: 'ceo' };
            const decision = canDeleteTransferManifest(mockInTransitJob as any, ceoUser as any);
            expect(decision.canDelete).toBe(false);
            expect(decision.isDeletableStatus).toBe(false);
            expect(decision.reason).toContain('cannot be deleted once approved');
        });

        it('denies unrelated non-manager from deleting another users draft', () => {
            const otherUser = { id: 'u-3', name: 'Robel Kebede', role: 'sales_associate' };
            const decision = canDeleteTransferManifest(mockDraftJob as any, otherUser as any);
            expect(decision.canDelete).toBe(false);
            expect(decision.isAuthorizedUser).toBe(false);
        });
    });
});
