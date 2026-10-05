import { describe, it, expect } from 'vitest';
import {
    resolveReceivingPolicy,
    maxReceivable,
    buildOverReceiveMessage
} from '../../utils/receivingPolicy';
import { cleanSku, resolveSmartPutawayLocation } from '../../components/fulfillment/receivingSplitHelpers';
import type { SystemConfig, Product } from '../../types';

describe('Receiving Policy, Blind Verification & Price Tag Strategy', () => {
    it('resolves country-partitioned receiving policy with strict multi-tenant isolation', () => {
        const mockSettings: Partial<SystemConfig> = {
            country: 'ET',
            receivingLogic: 'blind',
            overReceiveTolerancePct: 0,
            poPriceApplyAt: 'putaway',
            printPriceTagAt: 'store',
            countryConfigs: {
                ET: {
                    receivingLogic: 'blind',
                    overReceiveTolerancePct: 0,
                    poPriceApplyAt: 'putaway',
                    printPriceTagAt: 'store'
                },
                KE: {
                    receivingLogic: 'verified',
                    overReceiveTolerancePct: 5,
                    poPriceApplyAt: 'receive',
                    printPriceTagAt: 'store'
                }
            } as any
        };

        const etPolicy = resolveReceivingPolicy(mockSettings, 'ET');
        expect(etPolicy.blind).toBe(true);
        expect(etPolicy.overReceiveTolerancePct).toBe(0);
        expect(etPolicy.poPriceApplyAt).toBe('putaway');
        expect(etPolicy.printPriceTagAt).toBe('store');

        const kePolicy = resolveReceivingPolicy(mockSettings, 'KE');
        expect(kePolicy.blind).toBe(false);
        expect(kePolicy.overReceiveTolerancePct).toBe(5);
        expect(kePolicy.poPriceApplyAt).toBe('receive');
        expect(kePolicy.printPriceTagAt).toBe('store');
    });

    it('calculates maxReceivable with configured country tolerance', () => {
        // Zero tolerance (default)
        expect(maxReceivable(100, 0)).toBe(100);
        // 5% tolerance
        expect(maxReceivable(100, 5)).toBe(105);
        // 10% tolerance on fractional quantity
        expect(maxReceivable(45, 10)).toBe(49);
    });

    it('enforces Zero-Trust Blind Receiving by hiding expected quantities in error alerts', () => {
        const payload = { received: 100, expected: 100, attempted: 10, allowed: 100 };

        // Blind mode MUST NOT expose 100/100 or quantities
        const blindMessage = buildOverReceiveMessage(true, payload);
        expect(blindMessage).not.toContain('100');
        expect(blindMessage).toContain('Recount the goods and report the variance');

        // Verified mode exposes counts for operator convenience
        const verifiedMessage = buildOverReceiveMessage(false, payload);
        expect(verifiedMessage).toContain('100/100');
    });

    it('prefers SKU memory for putaway location when known, bypassing dock/on-order', async () => {
        const existingProduct: Partial<Product> = {
            id: 'prod-1',
            sku: 'KE-FD001',
            location: 'BAY-A-04'
        };

        const location = await resolveSmartPutawayLocation(
            existingProduct as Product,
            'Packaged Food',
            'site-1'
        );
        expect(location).toBe('BAY-A-04');
    });

    it('ignores transient locations like On Order or Receiving Dock for SKU memory', async () => {
        const onOrderProduct: Partial<Product> = {
            id: 'prod-2',
            sku: 'KE-FD002',
            location: 'On Order'
        };

        const location = await resolveSmartPutawayLocation(
            onOrderProduct as Product,
            'NonExistentCategory',
            'site-1'
        );
        // Falls back to empty string when no category mapping exists
        expect(location).toBe('');
    });

    it('normalizes SKUs cleanly for duplicate check', () => {
        expect(cleanSku('ke-fd-001')).toBe('KEFD001');
        expect(cleanSku('KE FD 001')).toBe('KEFD001');
        expect(cleanSku(undefined)).toBe('');
    });
});
