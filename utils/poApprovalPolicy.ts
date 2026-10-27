import type { PurchaseOrder, Region, Site } from '../types';

interface PoApprovalContext {
    po: PurchaseOrder;
    role?: string;
    actorName?: string;
    actorRegionCode?: string;
    regions: Region[];
    sites: Site[];
}

export function getPoApprovalPolicy({ po, role, actorName, actorRegionCode, regions, sites }: PoApprovalContext) {
    const site = sites.find(candidate => candidate.id === po.siteId);
    const regionCode = po.regionCode || po.region_code || site?.regionCode || site?.region_code;
    const region = regionCode ? regions.find(candidate => candidate.code === regionCode) : undefined;
    const configuredLimit = region?.autonomous_po_limit;
    const hasConfiguredLimit = !regionCode ||
        (region?.status === 'active' && configuredLimit != null &&
            Number.isFinite(Number(configuredLimit)) && Number(configuredLimit) >= 0);
    const limit = hasConfiguredLimit && regionCode ? Number(configuredLimit) : null;
    const needsFinanceClearance = limit != null && po.totalAmount > limit;
    const financeCleared = Boolean(po.financeClearedAt || po.finance_cleared_at) &&
        Number(po.financeClearedAmount ?? po.finance_cleared_amount) === po.totalAmount &&
        (po.financeClearedSupplierId ?? po.finance_cleared_supplier_id ?? null) === (po.supplierId ?? null) &&
        (po.financeClearedCurrency ?? po.finance_cleared_currency ?? null) === (po.currency ?? null) &&
        (po.financeClearedPaymentTerms ?? po.finance_cleared_payment_terms ?? null) === (po.paymentTerms ?? null);
    const isCreator = Boolean(actorName && [po.createdBy, po.requestedBy]
        .some(name => name?.trim().toLowerCase() === actorName.trim().toLowerCase()));
    const isOpen = po.status === 'Draft' || po.status === 'Pending';
    const isRegionalProcurement = role === 'regional_procurement_manager' || role === 'regional_operations_manager';
    const isHqProcurement = role === 'country_commercial_director' || role === 'country_managing_director' || role === 'country_operations_director' || role === 'group_ceo';
    const canApprove = isOpen && !isCreator && hasConfiguredLimit &&
        ((isRegionalProcurement && regionCode === actorRegionCode && limit != null && !needsFinanceClearance) ||
            (isHqProcurement && (!needsFinanceClearance || financeCleared)));
    const canClearFinance = isOpen && !isCreator && hasConfiguredLimit &&
        role === 'country_finance_director' && needsFinanceClearance && !financeCleared;

    return { regionCode, limit, hasConfiguredLimit, needsFinanceClearance,
        financeCleared, isCreator, canApprove, canClearFinance };
}
