// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../../types';
const { handoff } = vi.hoisted(() => ({ handoff: vi.fn() }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ products: [], activeSite: { id: 'store' }, effectiveCountry: 'KE', settings: {}, allProducts: [], addNotification: vi.fn() }) }));
vi.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('../../hooks/useLabelPrintJob', () => ({ useLabelPrintJob: () => ({ print: handoff, isPrinting: false }) }));
vi.mock('react-barcode', () => ({ default: () => <span>Barcode preview</span> }));
import LabelPrintModal from '../../components/LabelPrintModal';
const product = { id: 'coffee', siteId: 'store', name: 'Coffee', sku: 'KE-C', price: 100 } as Product;
afterEach(cleanup); beforeEach(() => vi.clearAllMocks());
describe('central label print dialog', () => {
    it('keeps the draft and selection when print handoff fails', async () => {
        handoff.mockResolvedValue(false); const onClose = vi.fn(), onPrint = vi.fn();
        render(<LabelPrintModal isOpen onClose={onClose} onPrint={onPrint} labels={[{ product, quantity: 1 }]} />);
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /pos.printLabelCount/ })); });
        expect(handoff).toHaveBeenCalledOnce(); expect(onClose).not.toHaveBeenCalled(); expect(onPrint).not.toHaveBeenCalled();
    });
    it('clears the caller selection only after confirmed print dialog handoff', async () => {
        handoff.mockResolvedValue(true); const onClose = vi.fn(), onPrint = vi.fn();
        render(<LabelPrintModal isOpen onClose={onClose} onPrint={onPrint} labels={[{ product, quantity: 1 }]} />);
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /pos.printLabelCount/ })); });
        expect(onPrint).toHaveBeenCalledOnce(); expect(onClose).toHaveBeenCalledOnce();
    });
});
