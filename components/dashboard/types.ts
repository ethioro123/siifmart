export type CentralOpsViewMode = 'executive' | 'financial' | 'inventory' | 'network' | 'telemetry' | 'team' | 'all';
export type FacilityScope = 'all' | 'store' | 'warehouse';

export type StoreAuditType = 'unannounced_walkthrough' | 'cash_spot_audit' | 'planogram_check' | 'full_inspection';
export type StoreAuditStatus = 'passed' | 'flagged' | 'action_required' | 'escalated_to_hq';

export interface StoreOperationsAudit {
    id: string;
    country_code: string;
    site_id: string;
    site_name?: string;
    auditor_id: string;
    auditor_name: string;
    manager_on_duty_id?: string;
    manager_on_duty_name?: string;
    audit_type: StoreAuditType;
    planogram_score: number;
    planogram_notes?: string;
    shelf_hygiene_score: number;
    halal_catalog_compliant: boolean;
    cash_counted?: number;
    cash_expected?: number;
    cash_variance?: number;
    register_id?: string;
    findings?: string;
    corrective_actions?: string;
    status: StoreAuditStatus;
    created_at: string;
    updated_at?: string;
}

export interface SitePerformance {
    id: string;
    name: string;
    type: string;
    address: string;
    revenue: number;
    staffCount: number;
    lowStock: number;
    transactionCount: number;
}

export type NeutralSwatch = 'champagne' | 'cashmere' | 'mocha' | 'walnut' | 'obsidian' | 'silk' | 'slate' | 'graphite';

export interface GlassKPICardProps {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
    swatch?: NeutralSwatch;
    sub?: string;
    route?: string;
    trend?: string;
}


