export type ProductSuggestionStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Accepted for Sourcing'
  | 'Declined'
  | 'Duplicate';

export interface ProductSuggestion {
  id: string;
  submitter_employee_id: string;
  site_id: string;
  country_code: string;
  region_code: string | null;
  product_name: string;
  category: string | null;
  brand_or_example: string | null;
  product_details: string | null;
  demand_signal: string;
  customer_request_count: number | null;
  status: ProductSuggestionStatus;
  review_note: string | null;
  reviewed_by_employee_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
