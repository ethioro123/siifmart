/**
 * Zero-Trust POS & Cash Governance Types
 * Defines data structures for mid-day cash safe drops, supervisory overrides,
 * velocity tracking, and multi-country sovereign denominations.
 * Traceability: .agent/RULES.md (Rule 1, Rule 2, Rule 7, Rule 18)
 */

export type OverrideType =
    | 'cart_void'
    | 'line_void'
    | 'price_override'
    | 'manual_discount'
    | 'return_refund'
    | 'no_sale_drawer_kick'
    | 'cash_threshold_bypass';

export type OverrideReasonCode =
    | 'customer_walkout'
    | 'wrong_item_scanned'
    | 'pricing_dispute'
    | 'accidental_duplicate'
    | 'damaged_defective_item'
    | 'manager_discretion_courtesy'
    | 'change_making'
    | 'till_audit_inspection'
    | 'cash_drawer_jam'
    | 'other_authorized';

export const OVERRIDE_REASON_LABELS: Record<OverrideReasonCode, string> = {
    customer_walkout: 'Customer Walkout / Left Without Paying',
    wrong_item_scanned: 'Wrong Item or Barcode Scanned',
    pricing_dispute: 'Shelf vs POS Price Mismatch',
    accidental_duplicate: 'Accidental Duplicate Scan',
    damaged_defective_item: 'Damaged or Expired Item Detected',
    manager_discretion_courtesy: 'Manager Approved Courtesy / Policy',
    change_making: 'Change Making / Denomination Exchange',
    till_audit_inspection: 'Spot Till Audit / Cash Inspection',
    cash_drawer_jam: 'Mechanical Till Drawer Jam',
    other_authorized: 'Other Authorized Supervisory Action'
};

export interface CashDropRecord {
    id: string;
    country_code: string;
    site_id: string;
    shift_id: string;
    drop_number: string;
    amount: number;
    currency: string;
    safe_bag_number?: string;
    denominations: Record<string, number>;
    reason: string;
    notes?: string;
    cashier_id: string;
    cashier_name: string;
    supervisor_id: string;
    supervisor_name: string;
    supervisor_role: string;
    device_id?: string;
    gps_coordinates?: string;
    status: 'deposited_in_safe' | 'transferred_to_bank' | 'audited' | 'variance_flagged';
    created_at: string;
    updated_at: string;
}

export interface SupervisoryOverrideRecord {
    id: string;
    country_code: string;
    site_id: string;
    shift_id?: string;
    cashier_id: string;
    cashier_name: string;
    supervisor_id: string;
    supervisor_name: string;
    supervisor_role: string;
    override_type: OverrideType;
    reason_code: OverrideReasonCode;
    reason_details?: string;
    item_sku?: string;
    item_name?: string;
    original_value: number;
    override_value: number;
    device_id?: string;
    gps_coordinates?: string;
    created_at: string;
}

export interface CashThresholdPolicy {
    country_code: string;
    currency: string;
    warning_threshold: number; // e.g. 15,000 ETB / 35,000 KSh
    maximum_threshold: number; // e.g. 20,000 ETB / 50,000 KSh (triggers mandatory cash drop)
    denominations: number[];
}

export const SOVEREIGN_CASH_POLICIES: Record<'ET' | 'KE', CashThresholdPolicy> = {
    ET: {
        country_code: 'ET',
        currency: 'ETB',
        warning_threshold: 15000,
        maximum_threshold: 20000,
        denominations: [200, 100, 50, 10, 5, 1]
    },
    KE: {
        country_code: 'KE',
        currency: 'KSh',
        warning_threshold: 35000,
        maximum_threshold: 50000,
        denominations: [1000, 500, 200, 100, 50, 20, 10, 5, 1]
    }
};

export interface RegisterLiveStatus {
    shiftId: string;
    shiftNumber?: string;
    cashierId: string;
    cashierName: string;
    siteId: string;
    startTime: string;
    openingFloat: number;
    cashSales: number;
    cashDrops: number;
    netDrawerCash: number;
    thresholdLimit: number;
    status: 'normal' | 'warning' | 'critical_drop_required';
    lastDropAt?: string;
}
