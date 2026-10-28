import type { PurchaseOrder, Region, Site } from '../types';

export const REGIONAL_PO_LIMIT_DEFAULT = 10_000_000;
export const COUNTRY_PO_LIMIT_DEFAULT = 100_000_000;

export interface PoApprovalContext {
    po: PurchaseOrder;
    role?: string;
    actorName?: string;
    actorRegionCode?: string;
    actorCountryCode?: string;
    regions: Region[];
    sites: Site[];
}

export function getPoApprovalPolicy({
    po, role, actorName, actorRegionCode, actorCountryCode, regions, sites
}: PoApprovalContext) {
    const site = sites.find(candidate => candidate.id === po.siteId);
    const regionCode = po.regionCode || po.region_code || site?.regionCode || site?.region_code;
    const region = regionCode ? regions.find(candidate => candidate.code === regionCode) : undefined;
    const configuredLimit = region?.autonomous_po_limit;
    const hasConfiguredLimit = !regionCode ||
        (region?.status === 'active' && configuredLimit != null &&
            Number.isFinite(Number(configuredLimit)) && Number(configuredLimit) >= 0);

    const limit = hasConfiguredLimit && regionCode && configuredLimit != null
        ? Number(configuredLimit)
        : REGIONAL_PO_LIMIT_DEFAULT;
    const countryLimit = COUNTRY_PO_LIMIT_DEFAULT;

    const poCountry = (po.country_code || (po as any).countryCode || site?.country || '').toUpperCase();
    const isGlobalExecutive = ['group_ceo', 'group_cfo', 'super_admin'].includes(role || '');
    const isCountryMatch = !actorCountryCode || !poCountry || isGlobalExecutive ||
        actorCountryCode.toUpperCase() === poCountry;

    const isCreator = Boolean(actorName && [po.createdBy, po.requestedBy]
        .some(name => name?.trim().toLowerCase() === actorName.trim().toLowerCase()));
    const isOpen = po.status === 'Draft' || po.status === 'Pending';

    const isRegionalTier = po.totalAmount <= limit;
    const isCountryTier = po.totalAmount > limit && po.totalAmount <= countryLimit;
    const isGroupTier = po.totalAmount > countryLimit;
    const tier: 1 | 2 | 3 = isRegionalTier ? 1 : isCountryTier ? 2 : 3;

    const tierLabel = isRegionalTier
        ? 'Regional Autonomous (≤ 10M)'
        : isCountryTier
            ? 'Country Commercial (10M - 100M)'
            : 'Group Executive (> 100M)';

    const needsFinanceClearance = po.totalAmount > limit;
    const financeCleared = Boolean(po.financeClearedAt || po.finance_cleared_at) &&
        Number(po.financeClearedAmount ?? po.finance_cleared_amount) === po.totalAmount &&
        (po.financeClearedSupplierId ?? po.finance_cleared_supplier_id ?? null) === (po.supplierId ?? null) &&
        (po.financeClearedCurrency ?? po.finance_cleared_currency ?? null) === (po.currency ?? null) &&
        (po.financeClearedPaymentTerms ?? po.finance_cleared_payment_terms ?? null) === (po.paymentTerms ?? null);

    const countryMdRecommended = Boolean(
        (po as any).countryMdRecommendedAt || (po as any).country_md_recommended_at
    );

    // Level-specific approval authority
    const isRegionalProcurement = role === 'regional_procurement_manager' || role === 'regional_operations_manager';
    const isCountryExecutive = role === 'country_commercial_director' || role === 'country_managing_director' || role === 'country_operations_director' || role === 'head_of_procurement';

    let canApprove = false;
    if (isOpen && !isCreator && isCountryMatch && hasConfiguredLimit) {
        if (isRegionalTier) {
            // Level 1: Regional Procurement Manager approves within assigned region (or higher executives)
            canApprove = (isRegionalProcurement && (!actorRegionCode || regionCode === actorRegionCode)) ||
                isCountryExecutive || isGlobalExecutive;
        } else if (isCountryTier) {
            // Level 2 & 3: Country Finance clearance -> Country Commercial Director or Country MD approves
            canApprove = financeCleared && (isCountryExecutive || isGlobalExecutive);
        } else if (isGroupTier) {
            // Level 4 & 5: Country MD recommendation -> Group Finance clearance -> Group CFO / Group CEO approves
            canApprove = financeCleared && (countryMdRecommended || role === 'group_ceo' || role === 'super_admin') && isGlobalExecutive;
        }
    }

    const canClearFinance = isOpen && !isCreator && isCountryMatch && hasConfiguredLimit &&
        needsFinanceClearance && !financeCleared &&
        ['country_finance_director', 'head_of_finance', 'group_cfo', 'super_admin'].includes(role || '');

    const canRecommendCountryMd = isOpen && !isCreator && isCountryMatch && hasConfiguredLimit &&
        isGroupTier && !countryMdRecommended &&
        ['country_managing_director', 'super_admin'].includes(role || '');

    let statusMessage = '';
    if (!isOpen) {
        statusMessage = `Order is ${po.status}.`;
    } else if (isCreator) {
        statusMessage = 'Maker-checker rule: Creator or requester cannot approve their own order.';
    } else if (!isCountryMatch) {
        statusMessage = 'Multi-country isolation: Approver is outside the order country.';
    } else if (isRegionalTier) {
        statusMessage = 'Awaiting Regional Procurement Manager approval.';
    } else if (isCountryTier) {
        statusMessage = financeCleared
            ? 'Country Finance cleared; awaiting Country Commercial Director / Country MD sign-off.'
            : 'Country Finance clearance required before Country leadership approval.';
    } else {
        if (!countryMdRecommended) {
            statusMessage = 'Awaiting Country Managing Director recommendation for > 100M spend.';
        } else if (!financeCleared) {
            statusMessage = 'Country MD recommended; awaiting Group Finance clearance.';
        } else {
            statusMessage = 'Group Finance cleared; awaiting Group CFO / Group CEO final sign-off.';
        }
    }

    return {
        regionCode,
        limit,
        countryLimit,
        hasConfiguredLimit,
        needsFinanceClearance,
        financeCleared,
        countryMdRecommended,
        isCreator,
        isCountryMatch,
        isRegionalTier,
        isCountryTier,
        isGroupTier,
        tier,
        tierLabel,
        canApprove,
        canClearFinance,
        canRecommendCountryMd,
        statusMessage
    };
}
