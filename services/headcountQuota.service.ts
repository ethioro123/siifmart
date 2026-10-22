import { supabase } from '../lib/supabase';
import { UserRole } from '../types';
import { FacilityHeadcountQuota, RegionalDelegationRule, HeadcountQuotaRequest } from '../types/employee';
import { logger } from '../utils/logger';

/**
 * Level 10 Frontline Execution Roles eligible for fast-track onboarding within pre-approved facility quotas.
 * Kept as LEVEL_4_FRONTLINE_ROLES export alias for backward compatibility.
 */
export const LEVEL_10_FRONTLINE_ROLES: UserRole[] = ['cashier', 'sales_associate', 'stock_clerk', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'returns_clerk', 'customer_service'];
export const LEVEL_4_FRONTLINE_ROLES = LEVEL_10_FRONTLINE_ROLES;

export interface QuotaEvaluationResult {
  canAutoActivate: boolean;
  approvedQuota: number;
  activeCount: number;
  openSlots: number;
  reason: string;
  tier: 'FRONTLINE_FAST_TRACK' | 'HQ_GOVERNANCE';
  standardGrade?: string;
}

export const headcountQuotaService = {
  /**
   * Fetch all headcount quotas configured for a specific facility
   */
  async getFacilityQuotas(siteId: string): Promise<FacilityHeadcountQuota[]> {
    try {
      const { data, error } = await supabase
        .from('facility_headcount_quotas')
        .select('*')
        .eq('site_id', siteId);

      if (error) throw error;
      return (data || []).map(q => ({
        id: q.id,
        siteId: q.site_id,
        role: q.role as UserRole,
        approvedQuota: q.approved_quota,
        standardGrade: q.standard_grade,
        maxMonthlySalary: q.max_monthly_salary ? Number(q.max_monthly_salary) : undefined,
        countryCode: q.country_code,
        created_at: q.created_at,
        updated_at: q.updated_at
      }));
    } catch (err) {
      logger.error('headcountQuotaService.getFacilityQuotas', 'Failed to fetch quotas', err);
      return [];
    }
  },

  /**
   * Fetch regional delegation policies (spend limit, margin floor, etc.)
   */
  async getRegionalDelegationRule(regionCode: string, countryCode = 'ET'): Promise<RegionalDelegationRule | null> {
    try {
      const { data, error } = await supabase
        .from('regional_delegation_rules')
        .select('*')
        .eq('region_code', regionCode)
        .eq('country_code', countryCode)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        regionCode: data.region_code,
        countryCode: data.country_code,
        maxAutonomousPoAmount: Number(data.max_autonomous_po_amount || 150000),
        minMarginThresholdPct: Number(data.min_margin_threshold_pct || 15),
        maxPettyCashVoucher: Number(data.max_petty_cash_voucher || 15000),
        autoActivateL4WithinQuota: Boolean(data.auto_activate_l4_within_quota ?? true)
      };
    } catch (err) {
      logger.error('headcountQuotaService.getRegionalDelegationRule', 'Failed to fetch delegation rule', err);
      return null;
    }
  },

  /**
   * Evaluates if a new hire can be instantly activated on the frontline without waiting on HQ.
   */
  async evaluateFrontlineOnboarding(
    siteId: string,
    role: UserRole,
    proposedSalary?: number
  ): Promise<QuotaEvaluationResult> {
    // 1. Only Level 4 operational frontline roles qualify for fast-track onboarding
    if (!LEVEL_4_FRONTLINE_ROLES.includes(role)) {
      return {
        canAutoActivate: false,
        approvedQuota: 0,
        activeCount: 0,
        openSlots: 0,
        reason: 'Supervisory and managerial appointments require corporate HQ committee approval.',
        tier: 'HQ_GOVERNANCE'
      };
    }

    try {
      // 2. Query configured quota for this site & role
      const { data: quotaRecord, error: quotaErr } = await supabase
        .from('facility_headcount_quotas')
        .select('*')
        .eq('site_id', siteId)
        .eq('role', role)
        .maybeSingle();

      if (quotaErr && quotaErr.code !== 'PGRST116') {
        logger.warn('headcountQuotaService', 'Quota query failed, using baseline fallback', { error: quotaErr.message });
      }

      // Default baseline: 10 positions for frontline roles if not explicitly configured
      const approvedQuota = quotaRecord ? quotaRecord.approved_quota : 10;
      const maxAllowedSalary = quotaRecord?.max_monthly_salary ? Number(quotaRecord.max_monthly_salary) : null;
      const standardGrade = quotaRecord?.standard_grade || 'L4-GRADE-1';

      // 3. Count current active workers stationed at this site with this role
      const { count: activeCount, error: countErr } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('role', role)
        .eq('status', 'Active');

      if (countErr) {
        logger.warn('headcountQuotaService', 'Active count check failed', { error: countErr.message });
      }

      const currentActive = activeCount || 0;
      const openSlots = Math.max(0, approvedQuota - currentActive);

      // 4. Check quota availability
      if (currentActive >= approvedQuota) {
        return {
          canAutoActivate: false,
          approvedQuota,
          activeCount: currentActive,
          openSlots: 0,
          reason: `Facility headcount quota full (${currentActive}/${approvedQuota} filled). Requires HQ budget expansion.`,
          tier: 'HQ_GOVERNANCE',
          standardGrade
        };
      }

      // 5. Check salary band variance
      if (maxAllowedSalary && proposedSalary && proposedSalary > maxAllowedSalary) {
        return {
          canAutoActivate: false,
          approvedQuota,
          activeCount: currentActive,
          openSlots,
          reason: `Proposed compensation (${proposedSalary}) exceeds standard grade cap (${maxAllowedSalary}). Escalated to HQ Finance.`,
          tier: 'HQ_GOVERNANCE',
          standardGrade
        };
      }

      // 6. Pre-approved slot verified
      return {
        canAutoActivate: true,
        approvedQuota,
        activeCount: currentActive,
        openSlots,
        reason: `Approved open slot available (${openSlots} remaining). Instant floor activation authorized.`,
        tier: 'FRONTLINE_FAST_TRACK',
        standardGrade
      };
    } catch (err) {
      logger.error('headcountQuotaService.evaluateFrontlineOnboarding', 'Evaluation error', err);
      return {
        canAutoActivate: false,
        approvedQuota: 0,
        activeCount: 0,
        openSlots: 0,
        reason: 'Error verifying facility headcount quotas. Handing off to HQ governance.',
        tier: 'HQ_GOVERNANCE'
      };
    }
  },

  /**
   * Submit a Headcount Quota Increase Request from Region to HQ
   */
  async submitQuotaRequest(params: Omit<HeadcountQuotaRequest, 'id' | 'status' | 'requestedAt' | 'reviewedBy' | 'reviewedAt' | 'reviewNotes'>): Promise<HeadcountQuotaRequest | null> {
    try {
      const payload = {
        site_id: params.siteId,
        site_name: params.siteName,
        region_code: params.regionCode,
        country_code: params.countryCode || 'ET',
        role: params.role,
        current_quota: params.currentQuota,
        requested_quota: params.requestedQuota,
        increase_amount: params.increaseAmount,
        request_type: params.requestType,
        reason: params.reason,
        justification_metrics: params.justificationMetrics || {},
        requested_by: params.requestedBy,
        requested_by_role: params.requestedByRole || 'regional_operations_manager',
        status: 'PENDING'
      };

      const { data, error } = await supabase
        .from('headcount_quota_requests')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        siteId: data.site_id,
        siteName: data.site_name,
        regionCode: data.region_code,
        countryCode: data.country_code,
        role: data.role as UserRole,
        currentQuota: data.current_quota,
        requestedQuota: data.requested_quota,
        increaseAmount: data.increase_amount,
        requestType: data.request_type,
        reason: data.reason,
        justificationMetrics: data.justification_metrics,
        status: data.status,
        requestedBy: data.requested_by,
        requestedByRole: data.requested_by_role,
        requestedAt: data.requested_at
      };
    } catch (err) {
      logger.error('headcountQuotaService.submitQuotaRequest', 'Failed to submit quota request', err);
      return null;
    }
  },

  /**
   * Fetch Headcount Quota Requests for Region or Corporate HQ
   */
  async getQuotaRequests(countryCode: string, regionCode?: string, status?: string): Promise<HeadcountQuotaRequest[]> {
    try {
      let query = supabase
        .from('headcount_quota_requests')
        .select('*')
        .eq('country_code', countryCode);

      if (regionCode) {
        query = query.eq('region_code', regionCode);
      }
      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }

      query = query.order('requested_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        siteId: r.site_id,
        siteName: r.site_name,
        regionCode: r.region_code,
        countryCode: r.country_code,
        role: r.role as UserRole,
        currentQuota: r.current_quota,
        requestedQuota: r.requested_quota,
        increaseAmount: r.increase_amount,
        requestType: r.request_type,
        reason: r.reason,
        justificationMetrics: r.justification_metrics,
        status: r.status,
        requestedBy: r.requested_by,
        requestedByRole: r.requested_by_role,
        requestedAt: r.requested_at,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at,
        reviewNotes: r.review_notes
      }));
    } catch (err) {
      logger.error('headcountQuotaService.getQuotaRequests', 'Failed to fetch quota requests', err);
      return [];
    }
  },

  /**
   * Review (Approve / Reject) Headcount Quota Request by Corporate HQ
   */
  async reviewQuotaRequest(
    requestId: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewerName: string,
    reviewNotes?: string
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const { data: request, error: fetchErr } = await supabase
        .from('headcount_quota_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchErr || !request) throw fetchErr || new Error('Request not found');

      const { error: updateErr } = await supabase
        .from('headcount_quota_requests')
        .update({
          status: decision,
          reviewed_by: reviewerName,
          reviewed_at: now,
          review_notes: reviewNotes || null,
          updated_at: now
        })
        .eq('id', requestId);

      if (updateErr) throw updateErr;

      // If approved, update the facility_headcount_quotas table
      if (decision === 'APPROVED') {
        await supabase
          .from('facility_headcount_quotas')
          .update({
            approved_quota: request.requested_quota,
            updated_at: now
          })
          .eq('site_id', request.site_id)
          .eq('role', request.role);
      }

      return true;
    } catch (err) {
      logger.error('headcountQuotaService.reviewQuotaRequest', 'Failed to review quota request', err);
      return false;
    }
  }
};
