// Characterization of confirmed audit gaps, not assertions of safe behavior.
import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ stock: 10, updates: vi.fn(), reads: vi.fn() }));
vi.mock('../../services/supabase.service', () => ({ productsService: {
 getBySKU: db.reads,
 update: db.updates,
 ensureTransferReceiptProduct: vi.fn()
} }));
vi.mock('../../utils/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
import { processReceivingStockIntake, rollbackReceivingStockIntake } from '../../components/pos-command/hooks/utils/receivingIntake';
const params = () => ({ transferId: 'transfer', destSiteId: 'store',
 transferReceivingItems: [{sku:'ET-OIL-1L',name:'Cooking oil',receivedQty:5,condition:'Good'}],
 allProducts: [], receiverName:'Receiver',timestampStr:'2026-11-06T00:00:00Z',addNotification:vi.fn() });
beforeEach(() => {
 vi.clearAllMocks();db.stock=10;
 db.reads.mockImplementation(async () => ({id:'product',stock:db.stock}));
 db.updates.mockImplementation(async (_id:string,update:{stock:number}) => {db.stock=update.stock;return {id:'product',stock:db.stock};});
});
describe('product movement audit: demonstrated failure cases', () => {
 it('documents that rollback restores an old balance over an intervening sale',async () => {
  const receipt=await processReceivingStockIntake(params());
  expect(db.stock).toBe(15);
  db.stock-=1; // A real sale happens after intake but before completion fails.
  await rollbackReceivingStockIntake(receipt.appliedItems);
  expect(db.stock).toBe(10); // Correct compensation would leave 9, not 10.
  expect(db.stock).not.toBe(9);
 });
 it('documents a lost increment when two receiving clients read the same starting stock',async () => {
  db.reads.mockResolvedValue({id:'product',stock:10});
  // Model two clients that obtained stock=10 before either update committed.
  const first=await processReceivingStockIntake(params());
  const second=await processReceivingStockIntake(params());
  expect(first.success&&second.success).toBe(true);
  expect(db.stock).toBe(15); // Correct atomic increments would leave 20.
  expect(db.stock).not.toBe(20);
 });
});
