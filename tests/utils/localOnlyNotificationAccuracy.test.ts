// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useFinanceActions } from '../../contexts/hooks/useFinanceActions';
import { usePromotionsAndPOSState } from '../../contexts/hooks/usePromotionsAndPOSState';
import { useDiscountCodesState } from '../../contexts/hooks/useDiscountCodesState';
import type { Employee, ExpenseRecord, HeldOrder, Promotion } from '../../types';

const mocks = vi.hoisted(() => ({ update: vi.fn(), invalidate: vi.fn(), from: vi.fn(), saveHeldOrders: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ setQueryData: mocks.invalidate }) }));
vi.mock('../../services/supabase.service', () => ({
  productsService: { update: mocks.update }, suppliersService: { create: vi.fn() }
}));
vi.mock('../../lib/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('../../services/db/pos.db', () => ({ posDB: { saveHeldOrders: mocks.saveHeldOrders } }));
vi.mock('../../constants/mock-data', () => ({ MOCK_PROMOTIONS: [] }));
vi.mock('../../utils/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

function financeDeps() {
  return {
    activeSiteId: 'site-a', activeSite: undefined, products: [], allProducts: [],
    employees: [{ id: 'staff', siteId: 'site-a', status: 'Active', salary: 1000 } as Employee],
    setProducts: vi.fn(), setExpenses: vi.fn(), setSuppliers: vi.fn(),
    addNotification: vi.fn(), logSystemEvent: vi.fn(), queries: { refetchAll: vi.fn() }
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.saveHeldOrders.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('Omit unconfirmed save and payment notices', () => {
  it('does not claim an in-memory expense or payroll preparation was saved or paid', async () => {
    const deps = financeDeps();
    const { result } = renderHook(() => useFinanceActions(deps));
    const expense = { id: 'expense-a' } as ExpenseRecord;
    await result.current.addExpense(expense);
    await result.current.deleteExpense(expense.id);
    await result.current.processPayroll('site-a', 'Manager');
    expect(deps.setExpenses).toHaveBeenCalledTimes(3);
    expect(deps.addNotification).not.toHaveBeenCalled();
    expect(deps.logSystemEvent).not.toHaveBeenCalled();
  });

  it('does not announce a stock adjustment when the product does not exist', async () => {
    const deps = financeDeps();
    const { result } = renderHook(() => useFinanceActions(deps));
    await result.current.adjustStock('missing', 5, 'IN', 'Correction', 'Manager');
    expect(mocks.update).not.toHaveBeenCalled();
    expect(deps.addNotification).toHaveBeenCalledWith('alert', 'Failed to adjust stock');
    expect(deps.addNotification).not.toHaveBeenCalledWith('success', expect.anything());
  });

  it('does not announce a persisted promotion or held order for in-memory updates', () => {
    const addNotification = vi.fn();
    const { result } = renderHook(() => usePromotionsAndPOSState({ addNotification }));
    const promotion = { id: 'promo-a', code: 'PROMO' } as Promotion;
    act(() => result.current.addPromotion(promotion));
    expect(result.current.promotions).toHaveLength(1);
    act(() => result.current.updatePromotion({ ...promotion, code: 'EDIT' }));
    act(() => result.current.deletePromotion(promotion.id));
    act(() => result.current.holdOrder({ id: 'hold-a' } as HeldOrder));
    expect(result.current.heldOrders).toHaveLength(1);
    expect(addNotification).not.toHaveBeenCalled();
  });

  it('does not announce a saved discount code for in-memory changes', () => {
    const addNotification = vi.fn();
    const { result } = renderHook(() => useDiscountCodesState({ addNotification }));
    const code = { ...result.current.discountCodes[0], id: 'draft-code', code: 'DRAFT' };
    act(() => result.current.addDiscountCode(code));
    expect(result.current.discountCodes.some(item => item.id === code.id)).toBe(true);
    act(() => result.current.updateDiscountCode({ ...code, code: 'EDIT' }));
    act(() => result.current.deleteDiscountCode(code.id));
    expect(addNotification).not.toHaveBeenCalled();
  });
});
