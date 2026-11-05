// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InventoryHeader, InventoryTab } from '../../components/inventory/InventoryHeader';

vi.mock('../../components/Protected', () => ({
    ProtectedButton: ({ children, onClick, className }: any) => (
        <button type="button" onClick={onClick} className={className}>
            {children}
        </button>
    )
}));

afterEach(cleanup);

describe('Inventory Navigation & Header Design Standard Verification', () => {
    const defaultProps = {
        isReadOnly: false,
        canCreateProduct: true,
        handleOpenAddProduct: vi.fn(),
        setIsPrintHubOpen: vi.fn(),
        setLabelsToPrint: vi.fn(),
        activeTab: 'overview' as InventoryTab,
        setActiveTab: vi.fn(),
        hasViewedBarcodeAudit: false,
        barcodeApprovalsCount: 5,
        pendingCount: 3
    };

    it('renders all 6 inventory navigation tabs with sentence-case labels and icons', () => {
        render(<InventoryHeader {...defaultProps} />);

        const expectedTabs = [
            'Overview',
            'Stock List',
            'Zones',
            'Movements',
            'Barcode Audit',
            'Stock Reviews'
        ];

        expectedTabs.forEach(label => {
            const tabButton = screen.getByRole('button', { name: new RegExp(label, 'i') });
            expect(tabButton).toBeTruthy();
            expect(tabButton.className).toContain('min-h-11');
            expect(tabButton.className).toContain('touch-manipulation');
        });
    });

    it('applies accessible aria-pressed and visual selected styling to the active tab', () => {
        const { rerender } = render(<InventoryHeader {...defaultProps} activeTab="stock" />);

        const stockTab = screen.getByRole('button', { name: /Stock List/i });
        expect(stockTab.getAttribute('aria-pressed')).toBe('true');
        expect(stockTab.className).toContain('bg-[var(--theme-bg-card)]');
        expect(stockTab.className).toContain('text-[var(--theme-text-primary)]');

        const overviewTab = screen.getByRole('button', { name: /Overview/i });
        expect(overviewTab.getAttribute('aria-pressed')).toBe('false');
        expect(overviewTab.className).toContain('text-[var(--theme-text-secondary)]');

        rerender(<InventoryHeader {...defaultProps} activeTab="zones" />);
        const zonesTab = screen.getByRole('button', { name: /Zones/i });
        expect(zonesTab.getAttribute('aria-pressed')).toBe('true');
    });

    it('triggers setActiveTab callback when user clicks a navigation tab', () => {
        const setActiveTab = vi.fn();
        render(<InventoryHeader {...defaultProps} setActiveTab={setActiveTab} />);

        fireEvent.click(screen.getByRole('button', { name: /Movements/i }));
        expect(setActiveTab).toHaveBeenCalledWith('movements');

        fireEvent.click(screen.getByRole('button', { name: /Stock Reviews/i }));
        expect(setActiveTab).toHaveBeenCalledWith('pending');
    });

    it('renders notification count badges when pending items exist', () => {
        render(<InventoryHeader {...defaultProps} barcodeApprovalsCount={7} pendingCount={4} />);

        expect(screen.getByText('7')).toBeTruthy();
        expect(screen.getByText('4')).toBeTruthy();
    });

    it('hides barcode count badge when hasViewedBarcodeAudit is true', () => {
        render(<InventoryHeader {...defaultProps} hasViewedBarcodeAudit={true} barcodeApprovalsCount={7} pendingCount={0} />);

        expect(screen.queryByText('7')).toBeNull();
    });

    it('renders Live Management Mode badge when isReadOnly is false and Read-Only when true', () => {
        const { rerender } = render(<InventoryHeader {...defaultProps} isReadOnly={false} />);
        expect(screen.getByText('Live Management Mode')).toBeTruthy();

        rerender(<InventoryHeader {...defaultProps} isReadOnly={true} />);
        expect(screen.getByText('Read-Only Mode')).toBeTruthy();
    });
});
