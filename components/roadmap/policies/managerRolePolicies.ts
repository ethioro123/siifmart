import { KnowledgeEntry } from '../RoadmapTypes';
import { CORPORATE_DIRECTOR_POLICIES } from './corporateDirectorPolicies';
import { SUPPLY_CHAIN_DIRECTOR_POLICIES } from './supplyChainDirectorPolicies';
import { SITE_MANAGER_POLICIES } from './siteManagerPolicies';
import { SITE_FUNCTIONAL_LEAD_POLICIES } from './siteFunctionalLeadPolicies';
import { SITE_FRONTLINE_LEAD_POLICIES } from './siteFrontlineLeadPolicies';

/**
 * MANAGER_ROLE_POLICIES
 * Assembled policies for all 16 enterprise managerial roles across corporate directorates,
 * supply chain heads, site facility managers, and frontline leads in strict compliance
 * with Rule 18 ("The Captain Owns the Ship").
 */
export const MANAGER_ROLE_POLICIES: KnowledgeEntry[] = [
  ...CORPORATE_DIRECTOR_POLICIES,
  ...SUPPLY_CHAIN_DIRECTOR_POLICIES,
  ...SITE_MANAGER_POLICIES,
  ...SITE_FUNCTIONAL_LEAD_POLICIES,
  ...SITE_FRONTLINE_LEAD_POLICIES
];

export {
  CORPORATE_DIRECTOR_POLICIES,
  SUPPLY_CHAIN_DIRECTOR_POLICIES,
  SITE_MANAGER_POLICIES,
  SITE_FUNCTIONAL_LEAD_POLICIES,
  SITE_FRONTLINE_LEAD_POLICIES
};
