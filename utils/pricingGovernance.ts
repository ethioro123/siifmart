import type { PendingInventoryChange, Product } from '../types';

/**
 * Zero-Trust price governance (SOP-MER-037).
 * Pure helpers: no hooks, no I/O.
 */

/** Country gross-margin floor (%). Below this, Finance co-approval is mandatory. */
export const MARGIN_FLOOR_PCT = 15;

/** Marker stored in inventory_requests.adjustment_reason to identify price governance requests. */
export const PRICE_CHANGE_TAG = 'PRICE_CHANGE';

/** Roles allowed to approve a price change that falls below the margin floor. */
export const FINANCE_COAPPROVER_ROLES: readonly string[] = [
    'head_of_finance', 'finance_head', 'finance_manager',
    'country_managing_director', 'admin',
    'super_admin', 'CEO', 'ceo'
];

export type PriceProposal = Pick<Product, 'price' | 'costPrice' | 'salePrice' | 'isOnSale'>;

export const computeMarginPct = (price?: number, cost?: number): number | null => {
    if (!price || price <= 0 || !cost || cost <= 0) return null;
    return ((price - cost) / price) * 100;
};

/** Effective selling price that the customer pays (sale price wins when on sale). */
export const effectivePrice = (p: Partial<PriceProposal>): number | undefined =>
    p.isOnSale && p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;

export const isBelowMarginFloor = (
    proposal: Partial<PriceProposal>,
    floorPct: number = MARGIN_FLOOR_PCT
): boolean => {
    const margin = computeMarginPct(effectivePrice(proposal), proposal.costPrice);
    return margin !== null && margin < floorPct;
};

export const isPriceChangeRequest = (change: Pick<PendingInventoryChange, 'changeType' | 'adjustmentReason'>): boolean =>
    change.changeType === 'edit' && (change.adjustmentReason || '').startsWith(PRICE_CHANGE_TAG);

export const requiresFinanceCoApproval = (change: PendingInventoryChange): boolean =>
    isPriceChangeRequest(change) && !!change.proposedChanges && isBelowMarginFloor(change.proposedChanges);

export const canApproveBelowFloor = (role?: string | null): boolean =>
    !!role && FINANCE_COAPPROVER_ROLES.includes(role);

interface BuildPriceChangeParams {
    product: Product;
    proposal: PriceProposal;
    requestedBy: string;
    countryCode: string;
    source: string;
}

/**
 * Builds an `inventory_requests` row (changeType 'edit') for a price change.
 * Cost is always included so approvers and the DB trigger can evaluate margin.
 */
export const buildPriceChangeRequest = ({
    product,
    proposal,
    requestedBy,
    countryCode,
    source
}: BuildPriceChangeParams): Omit<PendingInventoryChange, 'id'> => {
    const proposedChanges: Partial<Product> = {
        price: proposal.price,
        costPrice: proposal.costPrice ?? product.costPrice,
        salePrice: proposal.salePrice ?? product.salePrice,
        isOnSale: proposal.isOnSale ?? product.isOnSale
    };
    const belowFloor = isBelowMarginFloor(proposedChanges);
    const margin = computeMarginPct(effectivePrice(proposedChanges), proposedChanges.costPrice);
    const marginNote = margin === null ? 'margin n/a' : `margin ${margin.toFixed(1)}%`;

    return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        siteId: (product.siteId || (product as { site_id?: string }).site_id || '') as string,
        countryCode: countryCode.toUpperCase(),
        changeType: 'edit',
        requestedBy,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        proposedChanges,
        adjustmentReason: `${PRICE_CHANGE_TAG}: ${source} (${marginNote}${belowFloor ? `, below ${MARGIN_FLOOR_PCT}% floor - Finance co-approval required` : ''})`
    };
};
