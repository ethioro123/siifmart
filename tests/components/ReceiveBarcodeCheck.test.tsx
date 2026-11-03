// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReceiveBarcodeCheck } from '../../components/fulfillment/receive/hooks/useReceiveBarcodeCheck';
import { ReceiveSplitCard } from '../../components/fulfillment/receive/ReceiveSplitCard';
import { supabase } from '../../lib/supabase';

import { receiving } from '../../utils/translations/warehouse/receiving';

afterEach(cleanup);

const mockT = (key: string, params?: Record<string, string | number>) => {
    const cleanKey = key.replace('warehouse.', '');
    const raw = (receiving as any)[cleanKey]?.en || key;
    if (params) {
        let text = raw;
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, String(v));
        });
        return text;
    }
    return raw;
};

describe('Receive Barcode Verification & Feedback Engine', () => {
    it('informs user and attaches when barcode is already registered to current product', async () => {
        const setSplitVariants = vi.fn();
        const setBarcodeInput = vi.fn();

        const { result } = renderHook(() =>
            useReceiveBarcodeCheck({
                splitReceivingItem: {
                    productId: 'prod-123',
                    productName: 'Sunflower Cooking Oil 1L',
                    sku: 'ET-OIL-001',
                    barcode: '49998715'
                },
                siteId: 'site-adama',
                allProducts: [],
                setSplitVariants,
                setBarcodeInput,
                t: mockT
            })
        );

        await act(async () => {
            await result.current.handleAddBarcode('variant-1', '49998715');
        });

        const feedback = result.current.barcodeFeedback['variant-1'];
        expect(feedback).toBeTruthy();
        expect(feedback?.status).toBe('registered_this');
        expect(feedback?.barcode).toBe('49998715');
        expect(feedback?.message).toContain('Sunflower Cooking Oil 1L');
        expect(setSplitVariants).toHaveBeenCalled();
        expect(setBarcodeInput).toHaveBeenCalled();
    });

    it('identifies conflict when barcode is registered under another product in the database', async () => {
        const setSplitVariants = vi.fn();
        const setBarcodeInput = vi.fn();

        // Mock Supabase returning a different product
        vi.spyOn(supabase, 'from').mockReturnValue({
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 'other-prod-456',
                        name: 'Baby Formula Premium 800g',
                        sku: 'ET-BABY-002',
                        barcode: '49998715',
                        barcodes: []
                    }
                ],
                error: null
            })
        } as any);

        const { result } = renderHook(() =>
            useReceiveBarcodeCheck({
                splitReceivingItem: {
                    productId: 'prod-123',
                    productName: 'Sunflower Cooking Oil 1L',
                    sku: 'ET-OIL-001'
                },
                siteId: 'site-adama',
                allProducts: [],
                setSplitVariants,
                setBarcodeInput,
                t: mockT
            })
        );

        await act(async () => {
            await result.current.handleAddBarcode('variant-1', '49998715');
        });

        const feedback = result.current.barcodeFeedback['variant-1'];
        expect(feedback).toBeTruthy();
        expect(feedback?.status).toBe('registered_other');
        expect(feedback?.barcode).toBe('49998715');
        expect(feedback?.productName).toBe('Baby Formula Premium 800g');
        expect(feedback?.sku).toBe('ET-BABY-002');
    });

    it('tells user barcode is OK to add automatically when not in database', async () => {
        const setSplitVariants = vi.fn();
        const setBarcodeInput = vi.fn();

        vi.spyOn(supabase, 'from').mockReturnValue({
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
                data: [],
                error: null
            })
        } as any);

        const { result } = renderHook(() =>
            useReceiveBarcodeCheck({
                splitReceivingItem: {
                    productId: 'prod-123',
                    productName: 'Fresh Whole Milk 1L',
                    sku: 'ET-MILK-001'
                },
                siteId: 'site-adama',
                allProducts: [],
                setSplitVariants,
                setBarcodeInput,
                t: mockT
            })
        );

        await act(async () => {
            await result.current.handleAddBarcode('variant-1', '49998715');
        });

        const feedback = result.current.barcodeFeedback['variant-1'];
        expect(feedback).toBeTruthy();
        expect(feedback?.status).toBe('available');
        expect(feedback?.barcode).toBe('49998715');
        expect(feedback?.message).toContain('Fresh Whole Milk 1L');
        expect(setSplitVariants).toHaveBeenCalled();
    });

    it('renders the database information banner in ReceiveSplitCard and supports dismissing', () => {
        const onDismiss = vi.fn();
        render(
            <ReceiveSplitCard
                variant={{
                    id: 'variant-1',
                    sku: 'ET-OIL-001',
                    skuType: 'existing',
                    quantity: 10,
                    barcodes: ['49998715']
                }}
                index={0}
                totalSplits={1}
                barcodeInput=""
                barcodeFeedback={{
                    barcode: '49998715',
                    status: 'available',
                    message: 'This barcode is OK to add to this product automatically: Sunflower Cooking Oil',
                    productName: 'Sunflower Cooking Oil',
                    sku: 'ET-OIL-001'
                }}
                onUpdateVariant={vi.fn()}
                onRemoveVariant={vi.fn()}
                onBarcodeInput={vi.fn()}
                onAddBarcode={vi.fn()}
                onRemoveBarcode={vi.fn()}
                onDismissFeedback={onDismiss}
                onFocusScan={vi.fn()}
                scanOnlyHandlers={{ onKeyDown: vi.fn(), onPaste: vi.fn() }}
                t={mockT}
            />
        );

        expect(screen.getByText('OK to Add')).toBeTruthy();
        expect(screen.getAllByText('49998715').length).toBeGreaterThan(0);
        expect(screen.getByText(/This barcode is OK to add to this product automatically/)).toBeTruthy();

        const dismissBtn = screen.getByLabelText('Dismiss');
        fireEvent.click(dismissBtn);
        expect(onDismiss).toHaveBeenCalled();
    });
});
