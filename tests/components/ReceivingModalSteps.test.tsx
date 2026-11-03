// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReceiveSplitCard } from '../../components/fulfillment/receive/ReceiveSplitCard';
import { ReceiveStepIndicator } from '../../components/fulfillment/receive/steps/ReceiveStepIndicator';
import { Step1ReceiveIntake } from '../../components/fulfillment/receive/steps/Step1ReceiveIntake';
import { Step3ReceiveHandover } from '../../components/fulfillment/receive/steps/Step3ReceiveHandover';
import { hasValidReceivingCounts } from '../../utils/receivingCountValidation';
import type { PurchaseOrder } from '../../types';
vi.mock('../../components/fulfillment/ItemAttributeBadges', () => ({ ItemAttributeBadges: () => <div>Product specifications</div> }));
const po = { id: 'po', poNumber: 'AAAA0004', supplierName: 'Moli' } as PurchaseOrder;
const t = (key: string) => key;
afterEach(cleanup);
describe('receiving modal steps', () => {
 it('shows readable step labels and locks handover before valid counts', () => {
  const change = vi.fn();
  render(<ReceiveStepIndicator currentStep="INTAKE" setStep={change} hasQuantityEntered={false} t={t} />);
  expect(screen.queryByText('warehouse.manifestIntake')).toBeNull();
  expect(screen.getAllByText('Manifest Intake').length).toBeGreaterThan(0);
  const handover = screen.getByRole('button', { name: /Review/ });
  expect((handover as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(handover);
  expect(change).not.toHaveBeenCalled();
 });
 it('has no duplicate intake advance action and masks expected quantity', () => {
  render(<Step1ReceiveIntake splitReceivingItem={{ productName: 'Diaper', sku: 'ETBB002' }} splitReceivingPO={po} allProducts={[]} isBlindReceiving expectedSellable={98765} previouslyReceived={0} t={t} />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByText(/98765/)).toBeNull();
  expect(screen.getByText('warehouse.blindModeActiveTitle')).toBeTruthy();
 });
 it('keeps printing available without a duplicate save or premature received claim', () => {
  render(<Step3ReceiveHandover splitReceivingPO={po} splitReceivingItem={{}} splitVariants={[{ id: 'lot', sku: 'ETBB002', skuType: 'existing', quantity: 3 }]} totalScanned={3} isSubmitting={false} onPrintLabels={vi.fn()} t={t} />);
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.getByRole('button', { name: /printPalletAndIntakeLabels/ })).toBeTruthy();
  expect(screen.getByText('warehouse.countedNotSaved')).toBeTruthy();
 });
 it('keeps physical count and condition visible while secondary lot tools are collapsed', () => {
  const update = vi.fn();
  const { container } = render(<ReceiveSplitCard variant={{ id: 'lot', sku: 'ETBB002', skuType: 'existing', quantity: 0, batchNumber: 'LOT-20261103-ETBB002-01' }} index={0} totalSplits={1} barcodeInput="" onUpdateVariant={update} onRemoveVariant={vi.fn()} onBarcodeInput={vi.fn()} onAddBarcode={vi.fn()} onRemoveBarcode={vi.fn()} onFocusScan={vi.fn()} scanOnlyHandlers={{ onKeyDown: vi.fn(), onPaste: vi.fn() }} t={t} />);
  expect(container.querySelector('details')?.open).toBe(false);
  fireEvent.change(screen.getByRole('spinbutton', { name: 'warehouse.quantityToReceive' }), { target: { value: '12' } });
  expect(update).toHaveBeenCalledWith({ quantity: 12 });
  expect(screen.getByRole('combobox', { name: 'warehouse.condition' })).toBeTruthy();
  expect(screen.getByLabelText('warehouse.expiryDate')).toBeTruthy();
 });
 it('requires valid counts on every retained split without using expected quantities', () => {
  for (const splits of [[], [{ quantity: 0 }], [{ quantity: 2 }, { quantity: 0 }], [{ quantity: -1 }], [{ quantity: NaN }], [{ quantity: Infinity }]]) expect(hasValidReceivingCounts(splits)).toBe(false);
  expect(hasValidReceivingCounts([{ quantity: 4 }, { quantity: 2 }])).toBe(true);
 });
});
