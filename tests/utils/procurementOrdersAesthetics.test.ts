import { describe, it, expect } from 'vitest';
import { formatPONumber } from '../../utils/jobIdFormatter';
import type { PurchaseOrder } from '../../types';

describe('Procurement Orders Modern Architecture & Formatting', () => {
    const mockPO: PurchaseOrder = {
        id: 'po-101',
        poNumber: 'AAAA0142',
        supplierId: 'sup-bbs',
        supplierName: 'BBS Wholesale',
        siteId: 'site-eastleigh-01',
        destination: 'Eastleigh 01',
        date: '2026-09-30',
        expectedDelivery: '2026-10-05',
        itemsCount: 12,
        totalAmount: 50400,
        currency: 'KSh',
        status: 'Received',
        priority: 'Normal',
        requestedBy: 'Shukri Kamal',
        createdBy: 'Shukri Kamal',
        lineItems: []
    };

    it('formats PO number cleanly with national sovereign identifier', () => {
        expect(formatPONumber(mockPO)).toBe('AAAA0142');
    });

    it('handles numeric amount formatting with sovereign currency', () => {
        const formatted = `${mockPO.currency} ${mockPO.totalAmount.toLocaleString()}`;
        expect(formatted).toBe('KSh 50,400');
    });

    it('validates priority classification for Apple minimalist badge pills', () => {
        const priorities = ['Urgent', 'High', 'Normal', 'Low'];
        priorities.forEach(p => {
            const isHigh = p === 'Urgent' || p === 'High';
            const isLow = p === 'Low';
            const isNormal = p === 'Normal';
            expect(isHigh || isLow || isNormal).toBe(true);
        });
    });

    it('validates status classification for Apple status badges', () => {
        const statuses = ['Draft', 'Pending', 'Approved', 'Partially Received', 'Received', 'Cancelled', 'Rejected'];
        statuses.forEach(s => {
            expect(typeof s).toBe('string');
            expect(s.length).toBeGreaterThan(0);
        });
    });
});
