// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ latest: vi.fn(), mutate: vi.fn(), notify: vi.fn(), process: vi.fn() }));
vi.mock('../../components/financials/FinanceContext', () => ({ useFinance: () => ({ isPayrollModalOpen: true, setIsPayrollModalOpen: vi.fn(), employees: [], totalSalaries: 150, totalBonuses: 0, user: { id: 'finance', name: 'Finance', role: 'country_finance_director' }, currencySymbol: 'ETB', effectiveCountry: 'ET', activeSite: { id: 'warehouse' }, addNotification: mock.notify, processPayroll: mock.process }) }));
vi.mock('../../components/Modal', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('../../services/payroll-runs.service', () => ({ payrollRunsService: { getLatestRun: mock.latest } }));
vi.mock('../../hooks/usePayrollCommands', () => ({ usePayrollCommands: () => ({ mutateAsync: mock.mutate, isPending: false }) }));
import { PayrollModal } from '../../components/financials/PayrollModal';
beforeEach(() => { vi.clearAllMocks(); mock.latest.mockResolvedValue({ id: 'run', period: 'November 2026', countryCode: 'ET', status: 'approved', hrApprovedBy: 'HR', financeApprovedBy: 'Finance', totalNetPayout: 100 }); }); afterEach(cleanup);
it('prepares the expense and never invokes the former local Paid expense or claims disbursement', async () => {
 mock.mutate.mockResolvedValue({ id: 'run', status: 'prepared', totalNetPayout: 100, hrApprovedBy: 'HR', financeApprovedBy: 'Finance' });
 render(<PayrollModal />); fireEvent.click(await screen.findByRole('button', { name: 'Prepare payroll expense' }));
 await waitFor(() => expect(mock.notify).toHaveBeenCalledWith('success', 'Payroll expense prepared. No completed payment has been recorded.'));
 expect(mock.mutate).toHaveBeenCalledWith({ action: 'prepare', id: 'run' }); expect(mock.process).not.toHaveBeenCalled();
 expect(screen.queryByText('Completed payment recorded')).toBeNull();
});
it('propagates failed preparation without a success notification or following payment operation', async () => {
 mock.mutate.mockRejectedValue(new Error('Expense transaction rejected')); render(<PayrollModal />);
 fireEvent.click(await screen.findByRole('button', { name: 'Prepare payroll expense' }));
 await waitFor(() => expect(mock.notify).toHaveBeenCalledWith('alert', 'Expense transaction rejected'));
 expect(mock.notify).not.toHaveBeenCalledWith('success', expect.any(String)); expect(mock.process).not.toHaveBeenCalled();
});
