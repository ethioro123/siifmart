import Modal from '../../Modal';
import { isEligibleRegionalHub, isEligibleRegionalManager } from '../../../utils/regionalAdministration';
import type { RegionalAdminEmployee } from '../../../types/regionalAdministration';
import React, { useState } from 'react';
import { X, Building2, DollarSign, ShieldAlert, Check, Store, CheckSquare, Square } from 'lucide-react';
import type { Region, Site } from '../../../types';
import type { UpdateRegionInput } from '../../../services/regions.service';
import { useUpdateRegionMutation } from '../../../hooks/useRegionMutations';
import { normalizeCountryCode } from '../../../utils/siteIdGenerator';
import { getCountryProfile } from '../../../utils/localization';

interface EditRegionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    region: Region;
    regions?: Region[];
    sites: Site[];
    employees: RegionalAdminEmployee[];
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
}

export const EditRegionModal: React.FC<EditRegionModalProps> = ({
    isOpen,
    onClose,
    onUpdated,
    region,
    regions = [],
    sites,
    employees,
    addNotification
}) => {
    const updateRegionMutation = useUpdateRegionMutation();
    const [name, setName] = useState(region.name);
    const [city, setCity] = useState(region.city || '');
    const [status, setStatus] = useState<'active' | 'suspended' | 'planning'>(region.status || 'active');
    const [adminHubSiteId, setAdminHubSiteId] = useState(region.admin_hub_site_id || '');
    const [regionalManagerId, setRegionalManagerId] = useState(region.regional_manager_id || '');
    const [monthlyBudget, setMonthlyBudget] = useState(String(region.monthly_procurement_budget ?? 0));
    const [autonomousLimit, setAutonomousLimit] = useState(String(region.autonomous_po_limit ?? ''));
    const [monthlyExpenseBudget, setMonthlyExpenseBudget] = useState(String(region.monthly_expense_budget ?? 0));
    const [autonomousExpenseLimit, setAutonomousExpenseLimit] = useState(String(region.autonomous_expense_limit ?? 0));
    const [changeReason, setChangeReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial assigned sites state
    const [assignedSiteIds, setAssignedSiteIds] = useState<string[]>(() =>
        sites
            .filter(s => s.regionCode === region.code || s.region_code === region.code)
            .map(s => s.id)
    );

    if (!isOpen) return null;

    const normRegionCountry = normalizeCountryCode(region.country);

    // Filter sites to region's country
    const countrySites = sites.filter(s => Boolean(s.country) && normalizeCountryCode(s.country) === normRegionCountry);

    // Filter employees to region's country
    const countryEmployees = employees.filter(e => {
        const employeeCountry = e.country || e.country_code;
        if (!employeeCountry) return false;
        const empCountry = normalizeCountryCode(employeeCountry);
        const isRegionalManager = isEligibleRegionalManager(e, region.code);
        const isActive = !e.status || ['active', 'enabled'].includes(e.status.toLowerCase());
        return empCountry === normRegionCountry && isRegionalManager && isActive;
    });
    const administrationSites = countrySites.filter(s => isEligibleRegionalHub(s, region.code, regions));
    const currency = region.default_currency || getCountryProfile(normRegionCountry).currencyCode;

    const toggleSite = (siteId: string) => {
        setAssignedSiteIds(prev =>
            prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!changeReason.trim()) {
            addNotification('alert', 'Please provide a reason for changing regional settings');
            return;
        }
        const parsedBudget = Number(monthlyBudget);
        const parsedLimit = Number(autonomousLimit);
        const parsedExpenseBudget = Number(monthlyExpenseBudget);
        const parsedExpenseLimit = Number(autonomousExpenseLimit);

        if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
            addNotification('alert', 'Monthly procurement budget must be a positive number');
            return;
        }

        if (!autonomousLimit.trim() || !Number.isFinite(parsedLimit) || parsedLimit < 0) {
            addNotification('alert', 'Autonomous PO limit must be a positive number');
            return;
        }

        if (!Number.isFinite(parsedExpenseBudget) || parsedExpenseBudget < 0) {
            addNotification('alert', 'Monthly expense budget must be a positive number');
            return;
        }

        if (!Number.isFinite(parsedExpenseLimit) || parsedExpenseLimit < 0) {
            addNotification('alert', 'Autonomous expense limit must be a positive number');
            return;
        }

        setIsSubmitting(true);
        try {
            const updateInput: UpdateRegionInput = {
                name: name.trim(),
                city: city.trim() || undefined,
                admin_hub_site_id: adminHubSiteId || null,
                regional_manager_id: regionalManagerId || null,
                monthly_procurement_budget: parsedBudget,
                autonomous_po_limit: parsedLimit,
                monthly_expense_budget: parsedExpenseBudget,
                autonomous_expense_limit: parsedExpenseLimit,
                status,
                change_reason: changeReason.trim()
            };

            const toAssign: string[] = [];
            const toUnassign: string[] = [];
            for (const site of countrySites) {
                const wasAssigned = site.regionCode === region.code || site.region_code === region.code;
                const isNowAssigned = assignedSiteIds.includes(site.id);

                if (!wasAssigned && isNowAssigned) {
                    toAssign.push(site.id);
                } else if (wasAssigned && !isNowAssigned) {
                    toUnassign.push(site.id);
                }
            }

            await updateRegionMutation.mutateAsync({
                code: region.code,
                updates: updateInput,
                siteAllocations: {
                    toAssign,
                    toUnassign,
                    allSites: countrySites
                }
            });

            addNotification('success', `Region "${name}" updated successfully`);
            onUpdated();
            onClose();
        } catch (err) {
            addNotification('alert', `Error: ${err instanceof Error ? err.message : 'Update failed'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { if (!isSubmitting) onClose(); }} title={`Configure region: ${region.name} (${region.code})`} size="lg" closeOnEscape={!isSubmitting} closeOnClickOutside={!isSubmitting}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Region Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Operational Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'active' | 'suspended' | 'planning')}
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                            >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended (Frozen)</option>
                                <option value="planning">Planning / Pre-launch</option>
                            </select>
                        </div>
                    </div>

                    {/* Admin Hub & Regional Operations Manager */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Administrative Hub Site
                            </label>
                            <select
                                aria-label="Administrative hub site"
                                value={adminHubSiteId}
                                onChange={(e) => setAdminHubSiteId(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                            >
                                <option value="">No Hub Designated</option>
                                {administrationSites.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Regional Operations Manager
                            </label>
                            <select
                                aria-label="Regional Operations Manager"
                                value={regionalManagerId}
                                onChange={(e) => setRegionalManagerId(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                            >
                                <option value="">Unassigned</option>
                                {countryEmployees.map(e => (
                                    <option key={e.id} value={e.id}>
                                        {e.name} ({e.role || 'Staff'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Central HQ Budget & Autonomous Spending Limit */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                            Reason for this change *
                        </label>
                        <textarea
                            value={changeReason}
                            onChange={(e) => setChangeReason(e.target.value)}
                            required
                            maxLength={500}
                            rows={2}
                            placeholder="Record why these settings are changing"
                            className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                        />
                    </div>

                    {/* Dynamic Central HQ Budget & Autonomous Spending Limit */}
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border-[var(--theme-border)] space-y-3">
                        <div className="flex items-center gap-2">
                            <DollarSign size={15} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                            <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                Dynamic Budget Thresholds (Central HQ Governance)
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                                    Monthly Procurement Budget ({currency})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="10000"
                                    value={monthlyBudget}
                                    onChange={(e) => setMonthlyBudget(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                                    Autonomous PO Limit ({currency})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="5000"
                                    aria-label="Autonomous PO limit"
                                    value={autonomousLimit}
                                    onChange={(e) => setAutonomousLimit(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[var(--theme-border)]/50">
                            <div>
                                <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                                    Monthly Expense Budget ({currency})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="5000"
                                    value={monthlyExpenseBudget}
                                    onChange={(e) => setMonthlyExpenseBudget(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                                    Autonomous Expense Limit ({currency})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    aria-label="Autonomous expense limit"
                                    value={autonomousExpenseLimit}
                                    onChange={(e) => setAutonomousExpenseLimit(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-1.5 text-[11px] text-[var(--theme-text-secondary)]">
                            <ShieldAlert size={13} className="shrink-0 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] mt-0.5" />
                            <span>
                                A zero autonomous limit requires escalation to the authorized country or group approver. Raising limits expands decentralized autonomy.
                            </span>
                        </div>
                    </div>

                    {/* Site Allocations */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                                <Store size={14} />
                                Assigned Operational Sites ({assignedSiteIds.length})
                            </label>
                            <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                Select all sites governed by this regional admin
                            </span>
                        </div>

                        <div className="max-h-40 overflow-y-auto custom-scrollbar border-[var(--theme-border)] rounded-xl p-2 bg-[var(--theme-bg-subtle)] space-y-1">
                            {countrySites.length === 0 ? (
                                <p className="text-xs text-[var(--theme-text-secondary)] py-2 text-center">
                                    No sites found in this sovereign country.
                                </p>
                            ) : (
                                countrySites.map(site => {
                                    const isSelected = assignedSiteIds.includes(site.id);
                                    const isProtectedHub = site.code === `${site.country}-HQ` || regions.some(r => r.admin_hub_site_id === site.id);
                                    return (
                                        <button
                                            key={site.id}
                                            type="button"
                                            onClick={() => toggleSite(site.id)}
                                            disabled={isProtectedHub}
                                            title={isProtectedHub ? 'Change designated hubs through the hub selector; country HQ stays outside regions' : undefined}
                                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--theme-bg-card)] text-left transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isSelected ? (
                                                    <CheckSquare size={16} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                                                ) : (
                                                    <Square size={16} className="text-[var(--theme-text-secondary)]" />
                                                )}
                                                <span className="text-xs font-medium text-[var(--theme-text-primary)]">
                                                    {site.name}
                                                </span>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                                    {site.code}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-[var(--theme-text-secondary)]">
                                                {site.type}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-[var(--theme-text-secondary)]">Manager choices require an active Regional Operations Manager assigned to this region in Employees. Assign staffing after creating a new region.</p>
                    {/* Footer Actions */}
                    <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--theme-accent)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-accent)]/90 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                            <Check size={14} />
                            <span>{isSubmitting ? 'Saving...' : 'Save Configuration'}</span>
                        </button>
                    </div>
                </form>
        </Modal>
    );
};
