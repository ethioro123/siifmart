// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POSCommandHeader } from '../../../components/pos-command/layout/POSCommandHeader';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockPOSCommandState = {
  activeShift: {
    id: 'shift-101',
    cashierName: 'Abebe Bikila',
    cashierCode: 'STF-001',
    counterNumber: 'Counter 1',
    openingFloat: 500,
    startTime: '2026-10-30T08:00:00Z',
  },
  handleLockScreen: vi.fn(),
  handleReprint: vi.fn(),
  handleEndShift: vi.fn(),
  setIsStartShiftModalOpen: vi.fn(),
  setIsReceivingModalOpen: vi.fn(),
  setIsStockListOpen: vi.fn(),
  setIsPrintHubOpen: vi.fn(),
  dateRange: 'This Quarter',
  setDateRange: vi.fn(),
};

vi.mock('../../../components/pos-command/POSCommandContext', () => ({
  usePOSCommand: () => mockPOSCommandState,
}));

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'common.back': 'Back',
        'posCommand.stockList': 'Stock List',
        'posCommand.receiveLabel': 'Receive',
        'posCommand.safeLedgerLabel': 'Safe Ledger',
        'posCommand.printAction': 'Print',
        'posCommand.lockScreen': 'Lock',
        'posCommand.endShift': 'End Shift',
        'posCommand.startShift': 'Start Shift',
        'posCommand.onboardTalent': 'Onboard Talent',
        'posCommand.drawerInactive': 'Drawer Inactive',
        'posCommand.reprintReceipt': 'Reprint Receipt',
        'posCommand.printLabels': 'Print Labels',
      };
      return dict[key] || key;
    },
  }),
}));

vi.mock('../../../contexts/CentralStore', () => ({
  useStore: () => ({
    user: { id: 'usr-1', name: 'Store Manager', role: 'store_manager', code: 'MGR-001' },
  }),
}));

vi.mock('../../../contexts/DataContext', () => ({
  useData: () => ({
    activeSite: { id: 'site-1', name: 'Bishoftu Lakefront Supermarket', code: 'ET-STG-101', country: 'ET' },
    effectiveCountry: 'ET',
    settings: { country: 'ET' },
  }),
}));

vi.mock('../../../components/dashboard/widgets/CyberClock', () => ({
  CyberClock: () => <div data-testid="cyber-clock">05:17 PM</div>,
}));

vi.mock('../../../components/pos-command/CommandProductUpdatesNotice', () => ({
  CommandProductUpdatesNotice: () => <div data-testid="product-updates-notice">Product Updates</div>,
}));

vi.mock('../../../components/DateRangeSelector', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <button data-testid="date-range-selector" onClick={() => onChange('This Month')}>
      {value}
    </button>
  ),
}));

describe('POSCommandHeader', () => {
  const mockOpenSafeLedger = vi.fn();
  const mockOpenOnboardTalent = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders store identity, station code, active shift badge, and clock', () => {
    render(
      <POSCommandHeader
        canOnboard={true}
        onOpenSafeLedger={mockOpenSafeLedger}
        onOpenOnboardTalent={mockOpenOnboardTalent}
      />
    );

    expect(screen.getByText('Bishoftu Lakefront Supermarket')).toBeTruthy();
    expect(screen.getByText('ET-STG-101')).toBeTruthy();
    expect(screen.getByText('STF-001')).toBeTruthy();
    expect(screen.getByText('Counter 1')).toBeTruthy();
    expect(screen.getByTestId('cyber-clock')).toBeTruthy();
  });

  it('handles navigation via the back button', () => {
    render(
      <POSCommandHeader
        canOnboard={true}
        onOpenSafeLedger={mockOpenSafeLedger}
        onOpenOnboardTalent={mockOpenOnboardTalent}
      />
    );

    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('handles terminal locking and ending active shift', () => {
    render(
      <POSCommandHeader
        canOnboard={true}
        onOpenSafeLedger={mockOpenSafeLedger}
        onOpenOnboardTalent={mockOpenOnboardTalent}
      />
    );

    const lockButton = screen.getByRole('button', { name: /Lock/i });
    fireEvent.click(lockButton);
    expect(mockPOSCommandState.handleLockScreen).toHaveBeenCalled();

    const endShiftButton = screen.getByRole('button', { name: /End Shift/i });
    fireEvent.click(endShiftButton);
    expect(mockPOSCommandState.handleEndShift).toHaveBeenCalled();
  });

  it('renders operational action buttons and triggers inventory actions', () => {
    render(
      <POSCommandHeader
        canOnboard={true}
        onOpenSafeLedger={mockOpenSafeLedger}
        onOpenOnboardTalent={mockOpenOnboardTalent}
      />
    );

    const stockListBtn = screen.getByRole('button', { name: /Stock List/i });
    fireEvent.click(stockListBtn);
    expect(mockPOSCommandState.setIsStockListOpen).toHaveBeenCalledWith(true);

    const receiveBtn = screen.getByRole('button', { name: /Receive/i });
    fireEvent.click(receiveBtn);
    expect(mockPOSCommandState.setIsReceivingModalOpen).toHaveBeenCalledWith(true);

    const safeLedgerBtn = screen.getByRole('button', { name: /Safe Ledger/i });
    fireEvent.click(safeLedgerBtn);
    expect(mockOpenSafeLedger).toHaveBeenCalled();
  });

  it('toggles print dropdown and allows reprint and print hub triggers', () => {
    render(
      <POSCommandHeader
        canOnboard={true}
        onOpenSafeLedger={mockOpenSafeLedger}
        onOpenOnboardTalent={mockOpenOnboardTalent}
      />
    );

    const printTrigger = screen.getByRole('button', { name: /Print/i });
    fireEvent.click(printTrigger);

    const reprintBtn = screen.getByRole('button', { name: /Reprint Receipt/i });
    expect(reprintBtn).toBeTruthy();
    fireEvent.click(reprintBtn);
    expect(mockPOSCommandState.handleReprint).toHaveBeenCalled();

    fireEvent.click(printTrigger);
    const printLabelsBtn = screen.getByRole('button', { name: /Print Labels/i });
    fireEvent.click(printLabelsBtn);
    expect(mockPOSCommandState.setIsPrintHubOpen).toHaveBeenCalledWith(true);
  });

  it('renders onboard talent button when canOnboard is true and triggers callback', () => {
    render(
      <POSCommandHeader
        canOnboard={true}
        onOpenSafeLedger={mockOpenSafeLedger}
        onOpenOnboardTalent={mockOpenOnboardTalent}
      />
    );

    const onboardBtn = screen.getByRole('button', { name: /Onboard Talent/i });
    fireEvent.click(onboardBtn);
    expect(mockOpenOnboardTalent).toHaveBeenCalled();
  });

  it('renders date range filter and alerts notice', () => {
    render(
      <POSCommandHeader
        canOnboard={true}
        onOpenSafeLedger={mockOpenSafeLedger}
        onOpenOnboardTalent={mockOpenOnboardTalent}
      />
    );

    expect(screen.getByTestId('date-range-selector')).toBeTruthy();
    expect(screen.getByTestId('product-updates-notice')).toBeTruthy();
  });
});
