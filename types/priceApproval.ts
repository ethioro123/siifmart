export interface PriceApprovalRoute {
  workflow?: 'price';
  canApprove: boolean;
  canFinance: boolean;
  canReject: boolean;
  requiresFinance?: boolean;
  financeCleared?: boolean;
  requiresCountry?: boolean;
  block?: string | null;
  valid?: boolean;
}
