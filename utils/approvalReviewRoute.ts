import { APPROVAL_QUEUES } from './unifiedApprovalInbox';

// Permit only known review entry points for roles already authorized by the
// existing module permissions. This resolves site/mobile redirects, not RLS.
const reviewRoles: Record<string, readonly string[]> = {
  product: ['regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager'],
  price: ['regional_merchandising_manager','country_commercial_director','country_managing_director'],
  planogram: ['regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager'],
  price_finance: ['country_finance_director'],
  campaigns: ['group_ceo','country_commercial_director','regional_merchandising_manager'],
  purchase_orders: ['group_ceo','country_commercial_director','regional_procurement_manager'],
  po_finance: ['country_finance_director'],
  expenses: ['group_ceo','country_managing_director','country_finance_director','regional_finance_manager','regional_operations_manager'],
  margin: ['group_ceo','country_managing_director','country_finance_director'],
  inventory: ['group_ceo','country_managing_director','regional_operations_manager','regional_procurement_manager','country_operations_director','country_commercial_director'],
  transfers: ['group_ceo','country_managing_director','regional_operations_manager','country_operations_director','warehouse_manager','country_supply_chain_director','regional_supply_chain_manager','inventory_manager','regional_logistics_manager'],
  payroll_hr: ['group_ceo','country_managing_director','country_hr_director','hr_generalist'],
  payroll_finance: ['group_ceo','country_managing_director','country_finance_director']
};
const reviewModules: Record<string,string> = { '/pricing':'pricing', '/finance':'finance', '/procurement':'procurement', '/inventory':'inventory', '/wms-ops':'warehouse' };
export function isApprovalReviewRoute(role: string, module: string | undefined, pathname: string, search: string): boolean {
  if (!module || reviewModules[pathname] !== module) return false;
  const params = new URLSearchParams(search);
  return Object.entries(reviewRoles).some(([key,roles]) => {
    if (!roles.includes(role)) return false;
    const href = APPROVAL_QUEUES[key]?.href;
    if (!href) return false;
    const [path,query] = href.split('?');
    return path === pathname && [...new URLSearchParams(query)].every(([key,value]) => params.get(key) === value);
  });
}
