import React, { useEffect, useState } from 'react';
import {
    Building2, UserCheck, ShieldAlert, CheckCircle2,
    Sliders, MapPin, Store, AlertTriangle
} from 'lucide-react';
import type { Region, Site, Employee } from '../../../types';
import { regionsService, RegionBudgetStatus } from '../../../services/regions.service';
import { getCountryProfile } from '../../../utils/localization';

interface RegionCardProps {
    region: Region;
    sites: Site[];
    employees: Employee[];
    onEdit: (region: Region) => void;
    canManageGovernance?: boolean;
}

export const RegionCard: React.FC<RegionCardProps> = ({
    region,
    sites,
    employees,
    onEdit,
    canManageGovernance = false
}) => {
    const [budgetStatus, setBudgetStatus] = useState<RegionBudgetStatus | null>(null);
    const [isLoadingBudget, setIsLoadingBudget] = useState<boolean>(true);
    const [budgetError, setBudgetError] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        async function fetchBudget() {
            setIsLoadingBudget(true);
            setBudgetError(false);
            try {
                const status = await regionsService.getRegionBudgetStatus(region.code);
                if (isMounted) {
                    if (!status) {
                        setBudgetError(true);
                    } else {
                        setBudgetStatus(status);
                    }
                }
            } catch {
                if (isMounted) {
                    setBudgetError(true);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingBudget(false);
                }
            }
        }
        fetchBudget();
        return () => {
            isMounted = false;
        };
    }, [region.code, region.monthly_procurement_budget]);

    // Find assigned sites
    const assignedSites = sites.filter(
        s => s.regionCode === region.code || s.region_code === region.code
    );

    // Find Administrative Hub Site
    const hubSite = sites.find(s => s.id === region.admin_hub_site_id);

    // Find Regional Operations Manager
    const regionalManager = employees.find(e => e.id === region.regional_manager_id);

    const currency = region.default_currency || getCountryProfile(region.country).currencyCode;
    const monthlyBudget = region.monthly_procurement_budget ?? 0;
    const autonomousLimit = region.autonomous_po_limit;
    const currentSpend = budgetStatus?.currentMonthSpend ?? 0;
    const percentUsed = budgetStatus?.percentUsed ?? (monthlyBudget > 0 ? (currentSpend / monthlyBudget) * 100 : 0);
    const isOverBudget = budgetStatus?.isOverBudget ?? (monthlyBudget > 0 && currentSpend > monthlyBudget);
    const isNearCap = budgetStatus?.isNearCap ?? (monthlyBudget > 0 && percentUsed >= 85);

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs hover:border-[var(--theme-accent)]/40 transition-all flex flex-col justify-between">
            <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                    {region.name}
                                </h4>
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                    {region.code}
                                </span>
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 flex items-center gap-1">
                                <MapPin size={12} />
                                <span>{region.city ? `${region.city}, ` : ''}{region.country}</span>
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        {region.status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-status-success-bg)]/10 text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]/20">
                                <CheckCircle2 size={12} />
                                Active
                            </span>
                        )}
                        {region.status === 'suspended' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-status-danger-bg)]/10 text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]/20">
                                <ShieldAlert size={12} />
                                Suspended
                            </span>
                        )}
                        {region.status === 'planning' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-accent)]/20">
                                Planning
                            </span>
                        )}
                    </div>
                </div>

                {/* Regional Administration Details */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-[var(--theme-border)] text-xs mb-4">
                    <div>
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">Admin Hub Site</span>
                        <span className="font-medium text-[var(--theme-text-primary)] truncate block mt-0.5">
                            {hubSite ? hubSite.name : 'Not Designated'}
                        </span>
                    </div>
                    <div>
                        <span className="text-[11px] text-[var(--theme-text-secondary)] block">Regional Operations Manager</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <UserCheck size={13} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                            <span className="font-medium text-[var(--theme-text-primary)] truncate">
                                {regionalManager ? regionalManager.name : 'Unassigned'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Live Procurement Budget & Threshold Controls */}
                <div className="bg-[var(--theme-bg-subtle)] rounded-xl p-3.5 border border-[var(--theme-border)] mb-4">
                    {budgetError || (!isLoadingBudget && !budgetStatus) ? (
                        <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-semibold text-[var(--theme-text-primary)]">
                                    Monthly Procurement Budget
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)]/10 px-2 py-0.5 rounded border border-[var(--theme-status-warning-border)]/20">
                                    <AlertTriangle size={12} />
                                    Spend Unverified
                                </span>
                            </div>
                            <div className="w-full h-2 bg-[var(--theme-border)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--theme-status-warning-bg)]/30 w-full" />
                            </div>
                            <div className="mt-2 text-[11px] text-[var(--theme-text-secondary)]">
                                Budget Cap: {monthlyBudget.toLocaleString()} {currency} (Live purchase order spend could not be verified)
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-semibold text-[var(--theme-text-primary)]">
                                    Monthly Procurement Budget
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                    {isLoadingBudget ? 'Calculating...' : `${currentSpend.toLocaleString()} / ${monthlyBudget.toLocaleString()} ${currency}`}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-[var(--theme-border)] rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${
                                        isOverBudget
                                            ? 'bg-[var(--theme-status-danger-bg)]'
                                            : isNearCap
                                            ? 'bg-[var(--theme-status-warning-bg)]'
                                            : 'bg-[var(--theme-status-success-bg)]'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, percentUsed))}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-2 text-[11px]">
                                <span className="text-[var(--theme-text-secondary)]">
                                    {percentUsed.toFixed(1)}% utilized this calendar month
                                </span>
                                {isOverBudget && (
                                    <span className="flex items-center gap-1 text-[var(--theme-status-danger-text)] font-medium">
                                        <AlertTriangle size={12} />
                                        Over Budget Cap
                                    </span>
                                )}
                                {!isOverBudget && isNearCap && (
                                    <span className="flex items-center gap-1 text-[var(--theme-status-warning-text)] font-medium">
                                        <AlertTriangle size={12} />
                                        Near Budget Cap (85%+)
                                    </span>
                                )}
                            </div>
                        </>
                    )}

                    {/* Autonomous Spending Thresholds */}
                    <div className="mt-3 pt-2.5 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--theme-text-secondary)]">Autonomous PO Limit:</span>
                        <span className="font-mono font-medium text-[var(--theme-text-primary)]">
                            {autonomousLimit == null ? 'Not configured' : autonomousLimit > 0 ? `${autonomousLimit.toLocaleString()} ${currency}` : '0 (HQ Approval Required)'}
                        </span>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-[var(--theme-border)]/40 flex items-center justify-between text-[11px]">
                        <span className="text-[var(--theme-text-secondary)]">Autonomous Expense Limit:</span>
                        <span className="font-mono font-medium text-[var(--theme-text-primary)]">
                            {(region.autonomous_expense_limit ?? 25000) > 0 ? `${(region.autonomous_expense_limit ?? 25000).toLocaleString()} ${currency}` : '0 (HQ Approval Required)'}
                        </span>
                    </div>
                </div>

                {/* Sites Affiliated */}
                <div className="flex items-center justify-between text-xs px-1 mb-2">
                    <span className="text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                        <Store size={14} />
                        Assigned Sites
                    </span>
                    <span className="font-semibold text-[var(--theme-text-primary)]">
                        {assignedSites.length} {assignedSites.length === 1 ? 'Site' : 'Sites'}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[var(--theme-border)] flex items-center justify-end gap-2">
                {canManageGovernance ? (
                    <button
                        type="button"
                        onClick={() => onEdit(region)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer border border-[var(--theme-border)]"
                    >
                        <Sliders size={14} />
                        <span>Governance & Limits</span>
                    </button>
                ) : (
                    <span className="text-[11px] text-[var(--theme-text-secondary)] italic flex items-center gap-1.5">
                        <ShieldAlert size={13} className="text-[var(--theme-text-secondary)]" />
                        HQ Executive Governance Locked
                    </span>
                )}
            </div>
        </div>
    );
};
