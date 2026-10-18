import React, { useState } from 'react';
import { X, Building2, MapPin, DollarSign, ShieldAlert, Check } from 'lucide-react';
import type { Site, Employee } from '../../../types';
import type { CreateRegionInput } from '../../../services/regions.service';
import { useCreateRegionMutation } from '../../../hooks/useRegionMutations';
import { normalizeCountryCode } from '../../../utils/siteIdGenerator';

interface CreateRegionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    country: string; // 'KE', 'ET', 'UG', 'RW', 'TZ'
    currency: string; // 'KES', 'ETB', etc.
    sites: Site[];
    employees: Employee[];
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
}

export const CreateRegionModal: React.FC<CreateRegionModalProps> = ({
    isOpen,
    onClose,
    onCreated,
    country,
    currency,
    sites,
    employees,
    addNotification
}) => {
    const createRegionMutation = useCreateRegionMutation();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [city, setCity] = useState('');
    const [adminHubSiteId, setAdminHubSiteId] = useState('');
    const [regionalManagerId, setRegionalManagerId] = useState('');
    const [monthlyBudget, setMonthlyBudget] = useState('5000000');
    const [autonomousLimit, setAutonomousLimit] = useState('150000');
    const [monthlyExpenseBudget, setMonthlyExpenseBudget] = useState('500000');
    const [autonomousExpenseLimit, setAutonomousExpenseLimit] = useState('25000');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const normCountry = normalizeCountryCode(country);

    // Filter sites to current sovereign country
    const countrySites = sites.filter(s => normalizeCountryCode(s.country) === normCountry);

    // Filter potential regional managers
    const countryEmployees = employees.filter(e => {
        const empCountry = normalizeCountryCode(e.country || e.country_code);
        return empCountry === normCountry;
    });

    const handleGenerateCode = (regionName: string) => {
        setName(regionName);
        if (!code || code.startsWith(`${country.toLowerCase()}_`)) {
            const cleanSlug = regionName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .slice(0, 15);
            setCode(`${country.toLowerCase()}_${cleanSlug}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            addNotification('alert', 'Region name is required');
            return;
        }
        if (!code.trim()) {
            addNotification('alert', 'Territorial code is required');
            return;
        }

        const parsedBudget = Number(monthlyBudget);
        const parsedLimit = Number(autonomousLimit);
        const parsedExpenseBudget = Number(monthlyExpenseBudget);
        const parsedExpenseLimit = Number(autonomousExpenseLimit);

        if (isNaN(parsedBudget) || parsedBudget < 0) {
            addNotification('alert', 'Monthly budget must be a positive number');
            return;
        }

        if (isNaN(parsedLimit) || parsedLimit < 0) {
            addNotification('alert', 'Autonomous PO limit must be a positive number');
            return;
        }

        if (isNaN(parsedExpenseBudget) || parsedExpenseBudget < 0) {
            addNotification('alert', 'Monthly expense budget must be a positive number');
            return;
        }

        if (isNaN(parsedExpenseLimit) || parsedExpenseLimit < 0) {
            addNotification('alert', 'Autonomous expense limit must be a positive number');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: CreateRegionInput = {
                name: name.trim(),
                code: code.trim().toLowerCase(),
                country: normCountry,
                city: city.trim() || undefined,
                default_currency: currency,
                admin_hub_site_id: adminHubSiteId || undefined,
                regional_manager_id: regionalManagerId || undefined,
                monthly_procurement_budget: parsedBudget,
                autonomous_po_limit: parsedLimit,
                monthly_expense_budget: parsedExpenseBudget,
                autonomous_expense_limit: parsedExpenseLimit,
                status: 'active'
            };

            await createRegionMutation.mutateAsync(payload);
            addNotification('success', `Region "${name}" provisioned successfully`);
            onCreated();
            onClose();
        } catch (err) {
            addNotification('alert', `Error: ${err instanceof Error ? err.message : 'Failed to provision region'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Provision Operational Region
                            </h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)]">
                                Establish decentralized administrative authority for {country === 'KE' ? 'Kenya' : 'Ethiopia'}
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
                    {/* Region Name & Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Region Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => handleGenerateCode(e.target.value)}
                                placeholder="e.g. Mombasa Coastal"
                                required
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Territorial Code *
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                placeholder="e.g. ke_mombasa"
                                required
                                className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                            />
                        </div>
                    </div>

                    {/* City & Sovereign Market */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Principal City / Capital
                            </label>
                            <div className="relative">
                                <MapPin size={14} className="absolute left-3 top-2.5 text-[var(--theme-text-secondary)]" />
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="e.g. Mombasa"
                                    className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Sovereign Jurisdiction
                            </label>
                            <div className="px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-secondary)] flex items-center justify-between">
                                <span>{country === 'KE' ? 'Kenya' : 'Ethiopia'}</span>
                                <span className="font-mono text-[10px] font-semibold text-[var(--theme-text-primary)]">{currency}</span>
                            </div>
                        </div>
                    </div>

                    {/* Administrative Hub Site */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                            Administrative Hub Site
                        </label>
                        <select
                            value={adminHubSiteId}
                            onChange={(e) => setAdminHubSiteId(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                        >
                            <option value="">Designate Later / Virtual Office</option>
                            {countrySites.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code}) - {s.type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Appoint Regional Manager */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                            Regional Manager Appointment
                        </label>
                        <select
                            value={regionalManagerId}
                            onChange={(e) => setRegionalManagerId(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                        >
                            <option value="">Select Later (Unassigned)</option>
                            {countryEmployees.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.name} ({e.role || 'Staff'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamic Budget & Dynamic PO Controls (HQ Centralized Limit) */}
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3">
                        <div className="flex items-center gap-2">
                            <DollarSign size={15} className="text-[#0071E3] dark:text-[#2997FF]" />
                            <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                Dynamic HQ Budget & Autonomous Spend Limits
                            </h4>
                        </div>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            Values are stored dynamically in the central database and can be adjusted anytime by National HQ.
                        </p>

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
                                    placeholder="5000000"
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
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
                                    value={autonomousLimit}
                                    onChange={(e) => setAutonomousLimit(e.target.value)}
                                    placeholder="150000"
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
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
                                    placeholder="500000"
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
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
                                    value={autonomousExpenseLimit}
                                    onChange={(e) => setAutonomousExpenseLimit(e.target.value)}
                                    placeholder="25000"
                                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[#0071E3]"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-1.5 text-[11px] text-[var(--theme-text-secondary)] pt-1">
                            <ShieldAlert size={13} className="shrink-0 text-[#0071E3] dark:text-[#2997FF] mt-0.5" />
                            <span>
                                Orders or expenses exceeding regional autonomous limits automatically require 4-eyes approval from National HQ before issuance.
                            </span>
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
                            <span>{isSubmitting ? 'Provisioning...' : 'Provision Region'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
