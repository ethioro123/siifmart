import React, { useEffect, useState, useMemo } from 'react';
import { X, Building2, MapPin, DollarSign, ShieldAlert, Check, Sparkles, AlertTriangle } from 'lucide-react';
import type { Region, Site, Employee } from '../../../types';
import type { CreateRegionInput } from '../../../services/regions.service';
import { useCreateRegionMutation } from '../../../hooks/useRegionMutations';
import { normalizeCountryCode } from '../../../utils/siteIdGenerator';
import { getCountryProfile, Country } from '../../../utils/localization';
import {
    generateNextSmartRegionCode,
    validateRegionCodeInput,
    formatRegionCode
} from '../../../utils/regionIdGenerator';
import { CreateRegionBudgetFields } from './CreateRegionBudgetFields';

interface CreateRegionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    country: string; // 'KE', 'ET', 'UG', 'RW', 'TZ'
    currency: string; // 'KES', 'ETB', etc.
    sites: Site[];
    employees: Employee[];
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    existingRegions?: Region[];
    existingRegionCodes?: string[];
}

export const CreateRegionModal: React.FC<CreateRegionModalProps> = ({
    isOpen,
    onClose,
    onCreated,
    country,
    currency,
    sites,
    employees,
    addNotification,
    existingRegions,
    existingRegionCodes
}) => {
    const createRegionMutation = useCreateRegionMutation();
    const selectedCountry = normalizeCountryCode(country) as Country;
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [city, setCity] = useState('');
    const [isCodeManual, setIsCodeManual] = useState(false);
    const [adminHubSiteId, setAdminHubSiteId] = useState('');
    const [regionalManagerId, setRegionalManagerId] = useState('');
    const [monthlyBudget, setMonthlyBudget] = useState('0');
    const [autonomousLimit, setAutonomousLimit] = useState('0');
    const [monthlyExpenseBudget, setMonthlyExpenseBudget] = useState('0');
    const [autonomousExpenseLimit, setAutonomousExpenseLimit] = useState('0');
    const [changeReason, setChangeReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const activeProfile = getCountryProfile(selectedCountry);

    // Build consolidated list of existing region codes across database, prop, and sites
    const knownExistingCodes = useMemo(() => {
        const set = new Set<string>();
        if (existingRegionCodes) {
            existingRegionCodes.forEach(c => set.add(c.trim().toUpperCase()));
        }
        if (existingRegions) {
            existingRegions.forEach(r => set.add(r.code.trim().toUpperCase()));
        }
        sites.forEach(s => {
            const reg = s.region_code || s.regionCode;
            if (reg && reg.includes('-')) set.add(reg.trim().toUpperCase());
        });
        return Array.from(set);
    }, [existingRegionCodes, existingRegions, sites]);

    useEffect(() => {
        if (!isOpen) return;
        setName('');
        setCode('');
        setCity('');
        setIsCodeManual(false);
        setAdminHubSiteId('');
        setRegionalManagerId('');
        setMonthlyBudget('0');
        setAutonomousLimit('0');
        setMonthlyExpenseBudget('0');
        setAutonomousExpenseLimit('0');
        setChangeReason('');
    }, [isOpen, selectedCountry]);

    if (!isOpen) return null;

    // Filter sites to current sovereign country
    const countrySites = sites.filter(s => s.country && normalizeCountryCode(s.country) === selectedCountry);

    const countryEmployees = employees.filter(e => {
        const employeeCountry = e.country || e.country_code;
        if (!employeeCountry) return false;
        const empCountry = normalizeCountryCode(employeeCountry);
        const isRegionalManager = e.role?.toLowerCase().replace(/[\s-]+/g, '_') === 'regional_operations_manager';
        const isActive = !e.status || ['active', 'enabled'].includes(e.status.toLowerCase());
        return empCountry === selectedCountry && isRegionalManager && isActive;
    });

    const currencyCode = activeProfile.currencyCode;
    const administrationSites = countrySites.filter(s => ['administration', 'administrative'].includes(s.type?.toLowerCase()));

    // Smart auto-generation for Region Name
    const handleNameChange = (newName: string) => {
        setName(newName);
        if (!isCodeManual) {
            const smart = generateNextSmartRegionCode({
                name: newName,
                city,
                country: selectedCountry,
                existingCodes: knownExistingCodes
            });
            setCode(smart);
        }
    };

    // Smart auto-generation for City
    const handleCityChange = (newCity: string) => {
        setCity(newCity);
        if (!isCodeManual && !name) {
            const smart = generateNextSmartRegionCode({
                name,
                city: newCity,
                country: selectedCountry,
                existingCodes: knownExistingCodes
            });
            setCode(smart);
        }
    };

    // Manual code editing
    const handleCodeChange = (rawInput: string) => {
        setIsCodeManual(true);
        const clean = rawInput.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7);
        setCode(clean);
    };

    const handleApplySuggestion = (suggested: string) => {
        setCode(suggested);
        setIsCodeManual(false);
    };

    // Live validation against format and collision
    const codeValidation = validateRegionCodeInput({
        code,
        country: selectedCountry,
        existingCodes: knownExistingCodes,
        name,
        city
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            addNotification('alert', 'Region name is required');
            return;
        }

        const validation = validateRegionCodeInput({
            code,
            country: selectedCountry,
            existingCodes: knownExistingCodes,
            name,
            city
        });

        if (!validation.valid) {
            addNotification('alert', validation.error || 'Territorial code is invalid or already in use');
            if (validation.suggestedCode) {
                setCode(validation.suggestedCode);
                setIsCodeManual(false);
            }
            return;
        }

        if (!changeReason.trim()) {
            addNotification('alert', 'Please provide a reason for creating this region');
            return;
        }

        const parsedBudget = Number(monthlyBudget);
        const parsedLimit = Number(autonomousLimit);
        const parsedExpenseBudget = Number(monthlyExpenseBudget);
        const parsedExpenseLimit = Number(autonomousExpenseLimit);

        if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
            addNotification('alert', 'Monthly budget must be a positive number');
            return;
        }

        if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
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
            const formattedCode = formatRegionCode(code, selectedCountry);
            const payload: CreateRegionInput = {
                name: name.trim(),
                code: formattedCode,
                country: selectedCountry,
                city: city.trim() || undefined,
                default_currency: currencyCode,
                admin_hub_site_id: adminHubSiteId || undefined,
                regional_manager_id: regionalManagerId || undefined,
                monthly_procurement_budget: parsedBudget,
                autonomous_po_limit: parsedLimit,
                monthly_expense_budget: parsedExpenseBudget,
                autonomous_expense_limit: parsedExpenseLimit,
                status: 'active',
                change_reason: changeReason.trim()
            };

            await createRegionMutation.mutateAsync(payload);
            addNotification('success', `Region "${name}" (${formattedCode}) provisioned successfully`);
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
                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Provision Operational Region
                            </h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)]">
                                Establish decentralized administrative authority for {activeProfile.name || selectedCountry}
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
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="e.g. Mombasa Coastal"
                                required
                                className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-[var(--theme-text-primary)]">
                                    Territorial Code * ({selectedCountry}-XXX)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => handleApplySuggestion(generateNextSmartRegionCode({
                                        name,
                                        city,
                                        country: selectedCountry,
                                        existingCodes: knownExistingCodes
                                    }))}
                                    className="text-[10px] text-[var(--theme-accent)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                    title="Auto-calculate the next unique 3 letters"
                                >
                                    <Sparkles size={11} />
                                    <span>Next Unique</span>
                                </button>
                            </div>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                placeholder={`e.g. ${selectedCountry}-ADD`}
                                required
                                maxLength={7}
                                className={`w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-subtle)] border rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] uppercase ${
                                    !codeValidation.valid ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-[var(--theme-border)]'
                                }`}
                            />
                            {!codeValidation.valid && (
                                <div className="mt-1.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-1 text-[11px] text-amber-700 dark:text-amber-300">
                                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                        <AlertTriangle size={12} className="shrink-0 text-amber-500" />
                                        <span className="truncate">{codeValidation.error}</span>
                                    </div>
                                    {codeValidation.suggestedCode && (
                                        <button
                                            type="button"
                                            onClick={() => handleApplySuggestion(codeValidation.suggestedCode!)}
                                            className="shrink-0 px-2 py-0.5 rounded font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer text-[10px]"
                                        >
                                            Use {codeValidation.suggestedCode}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* City */}
                    <div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                                Principal City / Capital
                            </label>
                            <div className="relative">
                                <MapPin size={14} className="absolute left-3 top-2.5 text-[var(--theme-text-secondary)]" />
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => handleCityChange(e.target.value)}
                                    placeholder="e.g. Mombasa"
                                    className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                                />
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
                            className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                        >
                            <option value="">Designate Later / Virtual Office</option>
                            {administrationSites.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code}) - {s.type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Appoint Regional Operations Manager */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                            Regional Operations Manager Appointment
                        </label>
                        <select
                            value={regionalManagerId}
                            onChange={(e) => setRegionalManagerId(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                        >
                            <option value="">Select Later (Unassigned)</option>
                            {countryEmployees.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.name} ({e.role || 'Staff'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                            Reason for creating this region *
                        </label>
                        <textarea
                            value={changeReason}
                            onChange={(e) => setChangeReason(e.target.value)}
                            required
                            maxLength={500}
                            rows={2}
                            placeholder="Record the business reason for this change"
                            className="w-full px-3 py-2 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                        />
                    </div>

                    {/* Dynamic Budget & Dynamic Spend Limits */}
                    <CreateRegionBudgetFields
                        currency={currency}
                        monthlyBudget={monthlyBudget}
                        setMonthlyBudget={setMonthlyBudget}
                        autonomousLimit={autonomousLimit}
                        setAutonomousLimit={setAutonomousLimit}
                        monthlyExpenseBudget={monthlyExpenseBudget}
                        setMonthlyExpenseBudget={setMonthlyExpenseBudget}
                        autonomousExpenseLimit={autonomousExpenseLimit}
                        setAutonomousExpenseLimit={setAutonomousExpenseLimit}
                    />

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
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-accent)]/90 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
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
