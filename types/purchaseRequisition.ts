export type PurchaseRequisitionStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Converted';

export interface PurchaseRequisitionItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_cost?: number;
}

export interface PurchaseRequisition {
  id: string;
  request_number: string;
  requester_employee_id: string;
  requester_name: string;
  requester_site_id: string;
  destination_site_id: string;
  country_code: string;
  region_code: string | null;
  title: string;
  business_reason: string;
  items: PurchaseRequisitionItem[];
  estimated_total: number;
  currency: string;
  status: PurchaseRequisitionStatus;
  reviewed_by_employee_id: string | null;
  reviewed_at: string | null;
  decision_reason: string | null;
  purchase_order_id: string | null;
  created_at: string;
}
