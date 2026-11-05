import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PurchaseOrder, SaleRecord } from '../../types';

interface SimLedgerState {
  poStatus: string;
  poOrderedQty: number;
  warehouseReceivedQty: number;
  warehouseStock: number;
  storeStock: number;
  invoiceMatchStatus: string;
  invoiceStatus: string;
  paymentRunTotal: number;
  shiftOpen: boolean;
  shiftOpeningFloat: number;
  shiftCashSales: number;
  shiftCashDrops: number;
  shiftExpectedCash: number;
  shiftActualCash: number;
  shiftReconciliationStatus: string;
  customerSpent: number;
  customerPoints: number;
}

const state = vi.hoisted((): SimLedgerState => ({
  poStatus: 'Draft',
  poOrderedQty: 0,
  warehouseReceivedQty: 0,
  warehouseStock: 0,
  storeStock: 0,
  invoiceMatchStatus: 'Pending_Match',
  invoiceStatus: 'Draft',
  paymentRunTotal: 0,
  shiftOpen: false,
  shiftOpeningFloat: 0,
  shiftCashSales: 0,
  shiftCashDrops: 0,
  shiftExpectedCash: 0,
  shiftActualCash: 0,
  shiftReconciliationStatus: 'Pending',
  customerSpent: 0,
  customerPoints: 50,
}));

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  readPO: vi.fn(),
  logs: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mocks.from, rpc: mocks.rpc },
}));
vi.mock('../../services/purchase-orders.read', () => ({
  getById: mocks.readPO,
  getAll: vi.fn(),
  getMetrics: vi.fn(),
}));
vi.mock('../../utils/poDeliveryRequirements', () => ({
  validatePODelivery: () => null,
}));
vi.mock('../../services/system-logs.service', () => ({
  systemLogsService: { create: mocks.logs },
}));
vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { purchaseOrdersService } from '../../services/purchase-orders.service';
import { accountsPayableService } from '../../services/accounts-payable.service';
import { transferIntakeService } from '../../services/transfer-intake.service';
import { shiftsService } from '../../services/shifts.service';
import { salesService } from '../../services/sales.service';
import { counterControlService } from '../../services/counter-control.service';

const WH_SITE_ID = 'c1111111-1111-4000-8000-000000000110';
const STORE_SITE_ID = 'c1111111-1111-4000-8000-000000000113';
const PO_ID = '11111111-1111-4111-8111-111111111111';
const TRANSFER_JOB_ID = '22222222-2222-4222-8222-222222222222';
const INVOICE_ID = '33333333-3333-4333-8333-333333333333';
const SHIFT_ID = '44444444-4444-4444-8444-444444444444';
const SALE_ID = '55555555-5555-4555-8555-555555555555';
const PRODUCT_ID = '66666666-6666-4666-8666-666666666666';
const CUSTOMER_ID = '77777777-7777-4777-8777-777777777777';

describe('End-to-End Buying-to-Selling Stateful Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.poStatus = 'Draft';
    state.poOrderedQty = 0;
    state.warehouseReceivedQty = 0;
    state.warehouseStock = 0;
    state.storeStock = 0;
    state.invoiceMatchStatus = 'Pending_Match';
    state.invoiceStatus = 'Draft';
    state.paymentRunTotal = 0;
    state.shiftOpen = false;
    state.shiftOpeningFloat = 0;
    state.shiftCashSales = 0;
    state.shiftCashDrops = 0;
    state.shiftExpectedCash = 0;
    state.shiftActualCash = 0;
    state.shiftReconciliationStatus = 'Pending';
    state.customerSpent = 0;
    state.customerPoints = 50;

    mocks.logs.mockResolvedValue({});
    mocks.from.mockImplementation((table: string) => {
      if (table === 'sites') {
        return {
          select: () => ({
            eq: (_col: string, id: string) => ({
              maybeSingle: async () => ({
                data:
                  id === WH_SITE_ID
                    ? { type: 'Warehouse', name: 'Adama Industrial Warehouse', country: 'ET', region_code: 'OROMIA' }
                    : { type: 'Store', name: 'Bishoftu Lakefront Supermarket', country: 'ET', region_code: 'OROMIA' },
              }),
            }),
          }),
        };
      }
      if (table === 'sales') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: SALE_ID,
                  site_id: STORE_SITE_ID,
                  customer_id: CUSTOMER_ID,
                  sale_date: '2026-11-06T09:30:00Z',
                  subtotal: 1050,
                  tax: 0,
                  total: 1050,
                  payment_method: 'Cash',
                  status: 'Completed',
                  amount_tendered: 1050,
                  change: 0,
                  country_code: 'ET',
                  currency: 'ETB',
                  sale_items: [
                    {
                      product_id: PRODUCT_ID,
                      product_name: 'SIIFMART Halal Sunflower Oil 5L',
                      quantity: 3,
                      price: 350,
                      cost_price: 250,
                      sku: 'ET-SIM-OIL',
                    },
                  ],
                },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected direct table access: ${table}`);
    });

    mocks.rpc.mockImplementation(async (fn: string, args: Record<string, any>) => {
      switch (fn) {
        case 'save_purchase_order_document': {
          const qty = Number(args.p_items?.[0]?.quantity || 0);
          state.poOrderedQty = qty;
          state.poStatus = args.p_header?.status || 'Pending';
          return { data: { id: args.p_id, po_number: 'PO-ET-2026-001' }, error: null };
        }
        case 'save_receiving_split': {
          const splitQty = Number(args.p_jobs?.[0]?.lineItems?.[0]?.expectedQty || 0);
          state.warehouseReceivedQty += splitQty;
          return { data: { saved: true, jobIds: ['putaway-job-1'] }, error: null };
        }
        case 'finalize_receiving_session': {
          state.poStatus = state.warehouseReceivedQty >= state.poOrderedQty ? 'Received' : 'Partially Received';
          state.warehouseStock += state.warehouseReceivedQty;
          return { data: { id: args.p_po, status: state.poStatus, saved: true }, error: null };
        }
        case 'create_vendor_invoice_atomic': {
          const item = args.p_items?.[0];
          const matched =
            Number(item?.invoiced_quantity) === state.warehouseReceivedQty &&
            Number(item?.invoiced_unit_price) === 250;
          state.invoiceMatchStatus = matched ? 'Matched' : 'Discrepancy_Quantity';
          state.invoiceStatus = matched ? 'Pending_Approval' : 'Draft';
          return {
            data: {
              invoice: {
                id: INVOICE_ID,
                ...args.p_header,
                match_status: state.invoiceMatchStatus,
                status: state.invoiceStatus,
              },
              items: [
                {
                  id: 'inv-item-1',
                  invoice_id: INVOICE_ID,
                  ...item,
                  po_quantity: state.poOrderedQty,
                  received_quantity: state.warehouseReceivedQty,
                  po_unit_price: 250,
                  total_price: Number(item.invoiced_quantity) * Number(item.invoiced_unit_price),
                },
              ],
            },
            error: null,
          };
        }
        case 'create_payment_run_atomic': {
          if (args.p_country !== 'ET' || args.p_currency !== 'ETB') {
            return { data: null, error: new Error('Cross-border payment run blocked') };
          }
          state.invoiceStatus = 'Paid';
          state.paymentRunTotal = 5000;
          return {
            data: {
              id: 'pay-run-1',
              run_number: 'PR-ET-001',
              country_code: 'ET',
              currency: 'ETB',
              payment_channel: args.p_channel,
              total_amount: 5000,
              invoice_count: args.p_ids.length,
              status: 'Completed',
            },
            error: null,
          };
        }
        case 'accept_verified_transfer': {
          const transferredQty = 12;
          state.warehouseStock -= transferredQty;
          state.storeStock += transferredQty;
          return {
            data: {
              saved: true,
              jobId: args.p_job,
              siteId: STORE_SITE_ID,
              countryCode: 'ET',
              receivedAt: '2026-11-06T09:20:00Z',
              hasDiscrepancy: false,
            },
            error: null,
          };
        }
        case 'open_counter_shift': {
          state.shiftOpen = true;
          state.shiftOpeningFloat = Number(args.p_float);
          state.shiftExpectedCash = Number(args.p_float);
          return {
            data: {
              id: args.p_request,
              site_id: args.p_site,
              country_code: 'ET',
              cashier_id: 'cashier-et-1',
              cashier_name: 'Ifnan Gobena',
              counter_number: args.p_counter,
              opening_float: args.p_float,
              status: 'Open',
            },
            error: null,
          };
        }
        case 'create_pos_sale_atomic': {
          const soldQty = Number(args.p_items?.[0]?.quantity || 0);
          const saleTotal = soldQty * 350;
          state.storeStock -= soldQty;
          state.shiftCashSales += saleTotal;
          state.shiftExpectedCash = state.shiftOpeningFloat + state.shiftCashSales - state.shiftCashDrops;
          state.customerSpent += saleTotal;
          state.customerPoints =
            state.customerPoints + Math.floor(saleTotal / 100) - Number(args.p_sale?.points_redeemed || 0);
          return {
            data: {
              id: args.p_sale.id,
              site_id: args.p_sale.site_id,
              status: 'Completed',
              subtotal: saleTotal,
              tax: 0,
              total: saleTotal,
              receipt_number: 'RCP-ET-0001',
            },
            error: null,
          };
        }
        case 'submit_counter_count': {
          const counted = Object.entries(args.p_denominations || {}).reduce(
            (sum, [denom, count]) => sum + Number(denom) * Number(count),
            0
          );
          state.shiftActualCash = counted;
          state.shiftOpen = false;
          return {
            data: {
              id: args.p_shift,
              site_id: STORE_SITE_ID,
              country_code: 'ET',
              opening_float: state.shiftOpeningFloat,
              cash_sales: state.shiftCashSales,
              cash_drops: state.shiftCashDrops,
              expected_cash: state.shiftExpectedCash,
              actual_cash: state.shiftActualCash,
              variance: state.shiftActualCash - state.shiftExpectedCash,
              status: 'Closed',
              count_submitted_at: '2026-11-06T17:00:00Z',
            },
            error: null,
          };
        }
        case 'review_counter_shift': {
          if (args.p_stage === 'finance') {
            state.shiftReconciliationStatus = args.p_action;
          }
          return {
            data: {
              id: args.p_shift,
              supervisor_signed_at: args.p_stage === 'supervisor' ? '2026-11-06T17:05:00Z' : undefined,
              finance_sign_off_at: args.p_stage === 'finance' ? '2026-11-06T17:10:00Z' : undefined,
              reconciliation_status: state.shiftReconciliationStatus,
            },
            error: null,
          };
        }
        default:
          throw new Error(`Unhandled RPC in simulation: ${fn}`);
      }
    });
  });

  it('simulates the complete lifecycle from PO creation to POS checkout and shift reconciliation', async () => {
    // 1. BUYING POINT: Create Purchase Order for Adama Industrial Warehouse (20 units @ 250 ETB = 5000 ETB)
    const draftPO: PurchaseOrder = {
      id: PO_ID,
      siteId: WH_SITE_ID,
      supplierId: 'd199c210-acf8-4744-9939-63f93a9b03c2',
      supplierName: 'Oromia Grain & Oilseeds Farmers Union',
      date: '2026-11-06',
      status: 'Pending',
      totalAmount: 5000,
      itemsCount: 1,
      expectedDelivery: '2026-11-10',
      currency: 'ETB',
      countryCode: 'ET',
      lineItems: [],
    };
    mocks.readPO.mockResolvedValue({ ...draftPO, poNumber: 'PO-ET-2026-001' });

    await purchaseOrdersService.create(draftPO, [
      {
        productId: PRODUCT_ID,
        productName: 'SIIFMART Halal Sunflower Oil 5L',
        sku: 'ET-SIM-OIL',
        quantity: 20,
        unitCost: 250,
        totalCost: 5000,
        retailPrice: 350,
      },
    ]);
    expect(state.poOrderedQty).toBe(20);
    expect(state.poStatus).toBe('Pending');

    //Reject PO sent to a retail store instead of Warehouse/DC
    await expect(
      purchaseOrdersService.create({ ...draftPO, siteId: STORE_SITE_ID }, [])
    ).rejects.toThrow(/Purchase orders can only be sent to a Warehouse or Distribution Center/);

    // 2. WAREHOUSE INBOUND: Blind Receiving (20 units) & Session Finalization
    await mocks.rpc('save_receiving_split', {
      p_request: 'req-1',
      p_po: PO_ID,
      p_item: 'po-item-1',
      p_jobs: [{ lineItems: [{ productId: PRODUCT_ID, sku: 'ET-SIM-OIL', expectedQty: 20, condition: 'Good' }] }],
      p_previous: 0,
    });
    await mocks.rpc('finalize_receiving_session', { p_po: PO_ID });
    expect(state.poStatus).toBe('Received');
    expect(state.warehouseStock).toBe(20);

    // 3. ACCOUNTS PAYABLE: 3-Way Match Vendor Invoice & Payment Run
    const invoice = await accountsPayableService.createInvoice(
      {
        invoiceNumber: 'INV-ET-2026-001',
        vendorId: 'd199c210-acf8-4744-9939-63f93a9b03c2',
        vendorName: 'Oromia Grain & Oilseeds Farmers Union',
        poId: PO_ID,
        siteId: WH_SITE_ID,
        countryCode: 'ET',
        invoiceDate: '2026-11-06',
        dueDate: '2026-12-06',
        subtotal: 5000,
        taxAmount: 0,
        totalAmount: 5000,
        currency: 'ETB',
        items: [],
      },
      [
        {
          productId: PRODUCT_ID,
          sku: 'ET-SIM-OIL',
          itemName: 'SIIFMART Halal Sunflower Oil 5L',
          poQuantity: 20,
          receivedQuantity: 20,
          invoicedQuantity: 20,
          poUnitPrice: 250,
          invoicedUnitPrice: 250,
          taxRate: 0,
          totalPrice: 5000,
        },
      ],
      { id: 'finance-maker-et', name: 'Tolera Feyisa' }
    );
    expect(invoice.matchStatus).toBe('Matched');

    // Cross-border payment run must be blocked
    await expect(
      accountsPayableService.createPaymentRun([INVOICE_ID], 'Bank_Transfer', { id: 'fin-dir', name: 'Dawit' }, 'KE', 'KES')
    ).rejects.toThrow('Cross-border payment run blocked');

    const paymentRun = await accountsPayableService.createPaymentRun(
      [INVOICE_ID],
      'Bank_Transfer',
      { id: 'fin-dir', name: 'Dawit Haile' },
      'ET',
      'ETB'
    );
    expect(paymentRun.totalAmount).toBe(5000);
    expect(state.invoiceStatus).toBe('Paid');

    // 4. INTER-BRANCH REPLENISHMENT: Transfer 12 units from Adama Warehouse -> Bishoftu Store
    const transferConfirmation = await transferIntakeService.accept(TRANSFER_JOB_ID);
    expect(transferConfirmation.saved).toBe(true);
    expect(state.warehouseStock).toBe(8);
    expect(state.storeStock).toBe(12);

    // 5. SELLING POINT: Open Shift -> POS Checkout (3 units @ 350 ETB) -> Blind Counter Close -> Reconcile
    const openedShift = await shiftsService.create({
      id: SHIFT_ID,
      siteId: STORE_SITE_ID,
      counterNumber: 'Counter 4',
      openingFloat: 500,
    });
    expect(openedShift.status).toBe('Open');
    expect(state.shiftOpeningFloat).toBe(500);

    const salePayload: Omit<SaleRecord, 'created_at' | 'updated_at'> & { pointsRedeemed?: number } = {
      id: SALE_ID,
      siteId: STORE_SITE_ID,
      customerId: CUSTOMER_ID,
      date: '2026-11-06T09:30:00Z',
      subtotal: 1050,
      tax: 0,
      total: 1050,
      method: 'Cash',
      status: 'Completed',
      amountTendered: 1050,
      change: 0,
      cashierName: 'Ifnan Gobena',
      countryCode: 'ET',
      type: 'In-Store',
      pointsRedeemed: 5,
      items: [],
    };

    const completedSale = await salesService.create(salePayload, [
      { id: PRODUCT_ID, quantity: 3, price: 350, costPrice: 250 },
    ]);
    expect(completedSale.total).toBe(1050);
    expect(state.storeStock).toBe(9);
    expect(state.customerSpent).toBe(1050);
    expect(state.customerPoints).toBe(55); // 50 initial + 10 earned - 5 redeemed

    // Cashier closes shift with blind denomination count matching 500 float + 1050 cash sales = 1550 ETB
    await shiftsService.update(SHIFT_ID, {
      status: 'Closed',
      denominations: { '200': 7, '100': 1, '50': 1 },
      discrepancyReason: 'Exact blind count',
    });
    expect(state.shiftActualCash).toBe(1550);
    expect(state.shiftExpectedCash).toBe(1550);

    // Supervisor & Finance dual-control sign-off
    await counterControlService.review(SHIFT_ID, 'supervisor', 'Reconciled', 'Verified by Shift Supervisor');
    await shiftsService.reconcile(SHIFT_ID, 'Dawit Haile', 'Reconciled', 'Verified by Country Finance Director');
    expect(state.shiftReconciliationStatus).toBe('Reconciled');
  });
});
