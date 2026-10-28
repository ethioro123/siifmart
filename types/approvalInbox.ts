export type ProductApprovalKind = 'planogram' | 'price' | 'product';
export interface ProductApprovalInboxItem {
  id: string; requestId: string; revisionId: string | null; siteId: string; siteName: string;
  submittedAt: string; requester: string; productCount: number; kind: ProductApprovalKind; title: string;
}
export interface ProductApprovalInbox {
  total: number; planogramCount: number; priceCount: number; productCount: number;
  items: ProductApprovalInboxItem[];
}
