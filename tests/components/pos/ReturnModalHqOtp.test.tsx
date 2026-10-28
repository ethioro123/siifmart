// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReturnModal } from '../../../components/pos/modals/ReturnModal';

const mockUsePOS = vi.fn();
const mockUseLanguage = vi.fn();
const mockUseStore = vi.fn();
const mockUseData = vi.fn();

vi.mock('../../../components/pos/POSContext', () => ({
    usePOS: () => mockUsePOS()
}));

vi.mock('../../../contexts/LanguageContext', () => ({
    useLanguage: () => mockUseLanguage()
}));

vi.mock('../../../contexts/CentralStore', () => ({
    useStore: () => mockUseStore()
}));

vi.mock('../../../contexts/DataContext', () => ({
    useData: () => mockUseData()
}));

describe('ReturnModal: Central HQ Cash Refund 6-digit OTP Dual Control', () => {
    it('enforces 6-digit Central HQ Finance OTP for cash payouts and blocks store manager pins', async () => {
        const handleProcessReturn = vi.fn();
        const updateReturnConfig = vi.fn();
        const handleSearchForReturn = vi.fn();

        mockUsePOS.mockReturnValue({
            isReturnModalOpen: true,
            setIsReturnModalOpen: vi.fn(),
            foundSaleForReturn: {
                id: 'SALE-001',
                receiptNumber: 'TX-9001',
                date: '2026-10-28',
                items: [
                    { id: 'PROD-1', name: 'Cooking Oil 5L', price: 1200, quantity: 2 }
                ]
            },
            setFoundSaleForReturn: vi.fn(),
            returnSearchId: 'TX-9001',
            setReturnSearchId: vi.fn(),
            handleSearchForReturn,
            returnConfig: { 'PROD-1': { qty: 1, condition: 'Resalable', reason: 'Customer Changed Mind' } },
            updateReturnConfig,
            handleProcessReturn,
            isProcessing: false
        });

        mockUseLanguage.mockReturnValue({
            t: (k: string) => k,
            isKenya: false
        });

        mockUseStore.mockReturnValue({
            user: { id: 'CASHIER-01', name: 'Cashier User', code: '1111', role: 'cashier' }
        });

        mockUseData.mockReturnValue({
            settings: { managerSecurityPin: '9999' },
            employees: [
                { id: 'SM-01', name: 'Store Manager', code: '2222', role: 'store_manager' },
                { id: 'HQ-FIN-01', name: 'Country Finance Director', code: '123456', role: 'country_finance_director' }
            ]
        });

        render(<ReturnModal />);

        // Switch tender to Cash (HQ OTP)
        const cashButton = screen.getByText('Cash (HQ OTP)');
        fireEvent.click(cashButton);

        // Click Request HQ OTP
        const requestOtpButton = screen.getByText('Request HQ OTP');
        fireEvent.click(requestOtpButton);

        // Verify the OTP PIN pad view is displayed
        expect(screen.getByText('Central HQ Authorization OTP Required')).toBeDefined();

        // 1. Enter Store Manager 4-digit PIN (2222)
        // Store Manager is blocked: "Central HQ Policy: Physical cash payouts require a 6-digit Central HQ Finance OTP."
        // We type 2222 into pinpad
        const num2Buttons = screen.getAllByRole('button', { name: '2' });
        // Click 2 four times
        fireEvent.click(num2Buttons[0]);
        fireEvent.click(num2Buttons[0]);
        fireEvent.click(num2Buttons[0]);
        fireEvent.click(num2Buttons[0]);

        const verifyButton = screen.getByRole('button', { name: /pos\.verifyHqOtpAndDispense/i });
        // Because cash requires 6 digits, verify button is disabled until 6 digits entered
        expect((verifyButton as HTMLButtonElement).disabled).toBe(true);
    });
});
