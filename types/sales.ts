import { Product } from './product';
import { PaymentMethod } from './auth';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastVisit: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  notes?: string;
}

export interface CartItem extends Product {
  productId?: string; // Compatibility alias
  quantity: number;
}

export interface SaleRecord {
  id: string;
  siteId: string;
  site_id?: string; // Supabase compatibility
  date: string;
  created_at?: string; // Supabase compatibility
  createdAt?: string;

  subtotal: number;
  tax: number;
  taxBreakdown?: { name: string; rate: number; amount: number; compound: boolean }[];
  total: number;
  method: PaymentMethod;
  status: 'Completed' | 'Pending' | 'Refunded' | 'Partially Refunded' | 'Cancelled' | 'Void';
  items: CartItem[];
  itemCount?: number;
  amountTendered?: number;
  change?: number;
  cashierName?: string;
  cashierId?: string;
  cashier_id?: string;
  type?: 'In-Store' | 'Delivery' | 'Pickup';
  customerId?: string;
  customer_id?: string; // Supabase compatibility
  customerName?: string;
  customer_name?: string;
  fulfillmentStatus?: 'Pending' | 'Picking' | 'Packing' | 'Shipped' | 'Delivered';
  release_status?: 'AUTOMATIC' | 'PENDING' | 'RELEASED';
  receiptNumber?: string; // Friendly ID (e.g., REC-0001)
  mobilePaymentChannel?: string;
  mobileTransactionRef?: string;
  customerPhone?: string;
  countryCode?: string;
  country_code?: string;
}

export type ReturnReason = 'Defective' | 'Expired' | 'Customer Changed Mind' | 'Wrong Item';
export type ReturnCondition = 'Resalable' | 'Damaged';

export interface ReturnItem {
  productId: string;
  quantity: number;
  reason: ReturnReason;
  condition: ReturnCondition;
  refundAmount: number;
}

export interface ReturnRequest {
  id: string;
  originalSaleId: string;
  date: string;
  items: ReturnItem[];
  totalRefund: number;
  processedBy: string;
  queryId?: string; // Helper for search
}

export interface ShiftRecord {
  id: string;
  shiftNumber?: string | number;
  shift_number?: string | number;
  siteId: string;
  site_id?: string; // Supabase compatibility
  homeSiteId?: string;
  home_site_id?: string;
  cashierId: string;
  cashierName: string;
  counterNumber?: string;
  counter_number?: string;
  terminalId?: string;
  terminal_id?: string;
  cashierCode?: string;
  cashier_code?: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  cashSales: number;
  cardSales?: number;
  mobileSales?: number;
  expenses?: number;
  expectedCash?: number;
  actualCash?: number;
  variance?: number;
  denominations?: Record<string, number>;
  discrepancyReason?: string;
  status: 'Open' | 'Closed' | 'Audited' | 'Flagged';
  notes?: string;
  closedBy?: string;
  reconciledBy?: string;
  reconciledAt?: string;
  reconciliationStatus?: 'Pending' | 'Reconciled' | 'Discrepancy_Flagged';
  hqNotes?: string;
  cashDrops?: number;
  cash_drops?: number;
  dropCount?: number;
  countryCode?: string;
  country_code?: string;
  supervisorId?: string;
  supervisorName?: string;
  supervisorRole?: string;
  supervisorSignedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}


export interface HeldOrder {
  id: string;
  siteId: string;
  time: string;
  items: CartItem[];
  note: string;
  customerName?: string;
}
