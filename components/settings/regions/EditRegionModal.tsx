import React, { useState } from 'react';
import { X, Building2, DollarSign, ShieldAlert, Check, Store, CheckSquare, Square } from 'lucide-react';
import type { Region, Site, Employee } from '../../../types';
import { regionsService, UpdateRegionInput } from '../../../services/regions.service';

interface EditRegionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    region: Region;
    sites: Site[];
    employees: Employee[];
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
}

export const EditRegionModal: React.FC<EditRegionModalProps> = ({
    isOpen,
    onClose,
    onUpdated,
    region,
    sites,
    employees,
    addNotification
}) => {
    const [name, setName] = useState(region.name);
    const [city, setCity] = useState(region.city || '');
    const [status, setStatus] = useState<'active' | 'suspended' | 'planning'>(region.status || 'active');
    const [adminHubSiteId, setAdminHubSiteId] = useState(region.admin_hub_site_id || '');
    const [regionalManagerId, setRegionalManagerId] = useState(region.regional_manager_id || '');
    const [monthlyBudget, setMonthlyBudget] = useState(String(region.monthly_procurement_budget ?? 0));
    const [autonomousLimit, setAutonomousLimit] = useState(String(region.autonomous_po_limit ?? 150000));
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial assigned sites state
    const [assignedSiteIds, setAssignedSiteIds] = useState<string[]>(() =>
        sites
            .filter(s => s.regionCode === region.code || s.region_code === region.code)
            .map(s => s.id)
    );

    if (!isOpen) return null;

    // Filter sites to region's country
    const countrySites = sites.filter(s => {
        const sCountry = s.country?.toUpperCase();
        const rCountry = region.country?.toUpperCase();
        return (
            (rCountry?.includes('KE') && (sCountry === 'KE' || sCountry === 'KENYA')) ||
            (rCountry?.includes('ET') && (sCountry === 'ET' || sCountry === 'ETHIOPIA'))
        );
    });

    // Filter employees to region's country
    const countryEmployees = employees.filter(e => {
        const eCountry = (e.country || e.country_code)?.toUpperCase();
        const rCountry = region.country?.toUpperCase();
        return (
            (rCountry?.includes('KE') && (eCountry === 'KE' || eCountry === 'KENYA')) ||
            (rCountry?.includes('ET') && (eCountry === 'ET' || eCountry === 'ETHIOPIA'))
        );
    });

    const toggleSite = (siteId: string) => {
        setAssignedSiteIds(prev =>
            prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedBudget = Number(monthlyBudget);
        const parsedLimit = Number(autonomousLimit);

        if (isNaN(parsedBudget) || parsedBudget < 0) {
            addNotification('alert', 'Monthly budget must be a positive number');
            return;
        }

        if (isNaN(parsedLimit) || parsedLimit < 0) {
            addNotification('alert', 'Autonomous PO limit must be a positive number');
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
                status
            };

            const updated = await regionsService.updateRegion(region.code, updateInput);
            if (!updated) {
                throw new Error('Failed to update region settings');
            }

            // Sync site allocations
            for (const site of countrySites) {
                const wasAssigned = site.regionCode === region.code || site.region_code === region.code;
                const isNowAssigned = assignedSiteIds.includes(site.id);

                if (!wasAssigned && isNowAssigned) {
                    await regionsService.assignSiteToRegion(site.id, region.code);
                } else if (wasAssigned && !isNowAssigned) {
                    await regionsService.assignSiteToRegion(site.id, null);
                }
            }

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Configure Region: {region.name}
                            </h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                Code: {region.code} ({region.country})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-100px)] overflow-y-auto custom-scrollbar">
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
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Operational Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                            >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended (Frozen)</option>
                                <option value="planning">Planning / Pre-launch</option>
                            </select>
                        </div>
                    </div>

                    {/* Admin Hub & Regional Manager */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Administrative Hub Site
                            </label>
                            <select
                                value={adminHubSiteId}
                                onChange={(e) => setAdminHubSiteId(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                            >
                                <option value="">No Hub Designated</option>
                                {countrySites.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Regional Manager
                            </label>
                            <select
                                value={regionalManagerId}
                                onChange={(e) => setRegionalManagerId(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
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
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3">
                        <div className="flex items-center gap-2">
                            <DollarSign size={15} className="text-[#0071E3] dark:text-[#2997FF]" />
                            <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                Dynamic Budget Thresholds (Central HQ Governance)
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                                    Monthly Procurement Budget ({region.default_currency || 'KES'})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="10000"
                                    value={monthlyBudget}
                                    onChange={(e) => setMonthlyBudget(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                                    Autonomous PO Limit ({region.default_currency || 'KES'})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="5000"
                                    value={autonomousLimit}
                                    onChange={(e) => setAutonomousLimit(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-1.5 text-[11px] text-[var(--theme-text-secondary)]">
                            <ShieldAlert size={13} className="shrink-0 text-[#0071E3] dark:text-[#2997FF] mt-0.5" />
                            <span>
                                Set Autonomous PO Limit to 0 to require HQ sign-off on all regional purchases, or raise it to expand regional autonomy.
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

                        <div className="max-h-40 overflow-y-auto custom-scrollbar border border-[var(--theme-border)] rounded-xl p-2 bg-[var(--theme-bg-subtle)] space-y-1">
                            {countrySites.length === 0 ? (
                                <p className="text-xs text-[var(--theme-text-secondary)] py-2 text-center">
                                    No sites found in this sovereign country.
                                </p>
                            ) : (
                                countrySites.map(site => {
                                    const isSelected = assignedSiteIds.includes(site.id);
                                    return (
                                        <button
                                            key={site.id}
                                            type="button"
                                            onClick={() => toggleSite(site.id)}
                                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--theme-bg-card)] text-left transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isSelected ? (
                                                    <CheckSquare size={16} className="text-[#0071E3] dark:text-[#2997FF]" />
                                                ) : (
                                                    <Square size={16} className="text-[var(--theme-text-secondary)]" />
                                                )}
                                                <span className="text-xs font-medium text-[var(--theme-text-primary)]">
                                                    {site.name}
                                                </span>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
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

                    {/* Footer Actions */}
                    <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0071E3] text-white hover:bg-[#0071E3]/90 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                            <Check size={14} />
                            <span>{isSubmitting ? 'Saving...' : 'Save Configuration'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
