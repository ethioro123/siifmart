export interface PriceApprovalRoute {
  workflow?: 'price';
  targetCount?: number;
  regionCodes?: string[];
  scopeLabel?: string;
  minMarginPct?: number;
  canApprove: boolean;
  canFinance: boolean;
  canReject: boolean;
  requiresFinance?: boolean;
  financeCleared?: boolean;
  requiresCountry?: boolean;
  block?: string | null;
  valid?: boolean;
}
