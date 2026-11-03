// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlindReceiptReview, ReceiptEvidence } from '../../components/fulfillment/receive/BlindReceiptReview';
import { receiptReview } from '../../utils/translations/warehouse/receiptReview';
import type { ReceiptDetail } from '../../types/blind-receipt-review';
const state = vi.hoisted(() => ({ value: undefined as unknown, correction: vi.fn(), decision: vi.fn(), issue: vi.fn() }));
vi.mock('../../components/Modal', () => ({ default: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div> }));
vi.mock('../../hooks/useBlindReceiptReview', () => ({ useBlindReceiptReview: () => ({
 queue: { data: { pages: [[{ id:'receipt',product_name:'Coffee',po_number:'PO-1',employee_name:'Counter',physical_qty:3,needs_review:false,reviewed:false }]] },refetch:vi.fn() },
 detail: { data: state.value }, correction: { isPending:false,mutateAsync:state.correction },decision:{isPending:false,mutateAsync:state.decision},issue:{isPending:false,mutateAsync:state.issue}
}) }));
const t = (key: string) => key;
const base = {
 id:'receipt', po_id:'po', item_id:'item', site_id:'site', country_code:'ET', po_number:'PO-1', product_name:'Coffee', sku:'ET-COF', employee_name:'Counter',
 physical_qty:3,expected_qty:98765,previous_qty:0,created_at:'2026-11-04',can_review:false,can_correct:true,needs_review:false,issue:null,
 lines:[{jobId:'job',quantity:3,condition:'Good',batch:'LOT-1',expiry:null}], corrections:[],decisions:[]
} as ReceiptDetail;
afterEach(() => { cleanup(); state.value=undefined; vi.clearAllMocks(); });
describe('blind receipt oversight', () => {
 it('keeps order comparisons hidden from the original counter even if extra data is present', () => {
  render(<ReceiptEvidence value={base} t={t} />);
  expect(screen.queryByText('98765')).toBeNull();
  expect(screen.queryByText('warehouse.receiptOrdered')).toBeNull();
  expect(screen.getByText('warehouse.receiptOriginalCount')).toBeTruthy();
 });
 it('shows comparisons to an independent manager after submission', () => {
  render(<ReceiptEvidence value={{...base,can_review:true,can_correct:false}} t={t} />);
  expect(screen.getByText('98765')).toBeTruthy();
  expect(screen.getByText('warehouse.receiptPartialNote')).toBeTruthy();
 });
 it('does not require a manager action for a routine receipt', () => {
  state.value={...base,can_review:true,can_correct:false};
  render(<BlindReceiptReview site="site" country="ET" actor="manager" role="warehouse_manager" t={t} onSaved={vi.fn()} />);
  fireEvent.click(screen.getByRole('button',{name:'warehouse.receiptReviewTitle'}));
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:/Coffee/}));
  expect(screen.queryByRole('button',{name:'warehouse.receiptConfirmReview'})).toBeNull();
 });
 it('requires a reason before a manager can acknowledge an exception', () => {
  state.value={...base,can_review:true,can_correct:false,needs_review:true};
  render(<BlindReceiptReview site="site" country="ET" actor="manager" role="warehouse_manager" t={t} onSaved={vi.fn()} />);
  fireEvent.click(screen.getByRole('button',{name:'warehouse.receiptReviewTitle'}));
  fireEvent.click(screen.getByRole('button',{name:/Coffee/}));
  const confirm=screen.getByRole('button',{name:'warehouse.receiptConfirmReview'}) as HTMLButtonElement;
  expect(confirm.disabled).toBe(true);
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'Delivery evidence checked'}});
  expect(confirm.disabled).toBe(false);
 });
 it('has all new labels translated into English, Amharic and Oromo', () => {
  for(const entry of Object.values(receiptReview)) for(const locale of ['en','am','or']) expect((entry as Record<string,string>)[locale]?.trim()).toBeTruthy();
 });
});
