import React from 'react';
import { DollarSign, Star, Calendar, PhoneCall, Building2, GitBranch } from 'lucide-react';
import type { Employee, Site } from '../../../types';
import { getRoleHierarchy } from '../../../utils/roles';
import { isRegionalWorkforceRole } from '../../../utils/roleSegregation';

interface StepDetailsProps {
    newEmpData: any;
    setNewEmpData: (data: any) => void;
    availableDepartments: string[];
    canAdjustPayroll: boolean;
    currencySymbol: string;
    employees: Employee[];
    sites: Site[];
}

export default function StepDetails({
    newEmpData,
    setNewEmpData,
    availableDepartments,
    canAdjustPayroll,
    currencySymbol,
    employees,
    sites
}: StepDetailsProps) {
    const selectedSite = sites.find(site => site.id === newEmpData.siteId);
    const targetCountry = selectedSite?.country;
    const eligibleManagers = employees.filter(employee => {
        if (!employee.id || employee.status !== 'Active') return false;
        if (getRoleHierarchy(employee.role) <= getRoleHierarchy(newEmpData.role)) return false;
        const managerSite = sites.find(site => site.id === (employee.siteId || employee.site_id));
        const managerCountry = employee.country || employee.country_code || managerSite?.country;
        const isGlobalExecutive = ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae'].includes(employee.role);
        const countryMatches = !targetCountry || (managerCountry
            ? String(managerCountry).toUpperCase() === String(targetCountry).toUpperCase()
            : isGlobalExecutive);
        const targetRegion = selectedSite?.regionCode || selectedSite?.region_code;
        const managerRegion = employee.regionCode || employee.region_code || managerSite?.regionCode || managerSite?.region_code;
        const regionMatches = !isRegionalWorkforceRole(newEmpData.role)
            || employee.scopeLevel !== 'REGIONAL'
            || !targetRegion
            || !managerRegion
            || targetRegion.toLowerCase() === managerRegion.toLowerCase();
        return countryMatches && regionMatches;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const reportingSelect = (label: string, value: string | undefined, key: 'reportsToEmployeeId' | 'functionalManagerEmployeeId') => (
        <label className="block">
            <span className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">{label}</span>
            <select
                value={value || ''}
                onChange={event => setNewEmpData({ ...newEmpData, [key]: event.target.value || undefined })}
                className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] outline-none text-sm"
            >
                <option value="">Unassigned</option>
                {eligibleManagers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                        {manager.name} · {manager.jobTitle || manager.job_title || manager.role}
                    </option>
                ))}
            </select>
        </label>
    );

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div>
                <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">Job Title</label>
                <input
                    type="text"
                    maxLength={120}
                    className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-medium"
                    value={newEmpData.jobTitle || ''}
                    onChange={e => setNewEmpData({ ...newEmpData, jobTitle: e.target.value })}
                    placeholder="Enter the employee's job title"
                    aria-label="Job Title"
                />
                <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">This HR title is independent of the app access profile.</p>
            </div>

            <section className="rounded-xl border border-[#E2DCCE] dark:border-white/10 p-3.5 space-y-3" aria-label="Reporting relationships">
                <div className="flex items-center gap-2">
                    <GitBranch size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <h3 className="text-[11px] text-stone-700 dark:text-stone-200 uppercase font-bold">Reporting Relationships</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reportingSelect('Primary manager', newEmpData.reportsToEmployeeId, 'reportsToEmployeeId')}
                    {reportingSelect('Functional manager', newEmpData.functionalManagerEmployeeId, 'functionalManagerEmployeeId')}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">Choose an active employee in the same country with a higher reporting level. Global executives may be selected across countries. Leave a line unassigned when no manager has been appointed.</p>
            </section>

            {/* Department */}
            <div>
                <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-2 flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    Department Assignment
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableDepartments.map(dept => (
                        <button
                            key={dept}
                            type="button"
                            onClick={() => setNewEmpData({ ...newEmpData, department: dept })}
                            className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                                newEmpData.department === dept
                                    ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] shadow-xs'
                                    : 'bg-white dark:bg-black/20 text-stone-600 dark:text-stone-300 border-[#E2DCCE] dark:border-white/5 hover:border-stone-400'
                            }`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            </div>

            {/* Compensation & Specialization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                    <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 flex items-center justify-between">
                        <span>Monthly Base Salary ({currencySymbol})</span>
                        {!canAdjustPayroll && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(HR / Admin Only)</span>
                        )}
                    </label>
                    <div className="relative">
                        <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="number"
                            disabled={!canAdjustPayroll}
                            className={`w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-mono ${
                                !canAdjustPayroll ? 'opacity-50 cursor-not-allowed bg-stone-100 dark:bg-black/50' : ''
                            }`}
                            value={newEmpData.salary}
                            onChange={e => setNewEmpData({ ...newEmpData, salary: e.target.value })}
                            placeholder={!canAdjustPayroll ? "Restricted" : "0.00"}
                            aria-label="Monthly Salary"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">
                        Specialization / Skill Domain
                    </label>
                    <div className="relative">
                        <Star size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-medium"
                            placeholder="e.g. Cold Chain, Inventory Audit"
                            value={newEmpData.specialization}
                            onChange={e => setNewEmpData({ ...newEmpData, specialization: e.target.value })}
                            aria-label="Specialization"
                        />
                    </div>
                </div>
            </div>

            {/* Start Date & Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                    <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">
                        Start / Joining Date
                    </label>
                    <div className="relative">
                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="date"
                            className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-medium"
                            value={newEmpData.joinDate}
                            onChange={e => setNewEmpData({ ...newEmpData, joinDate: e.target.value })}
                            aria-label="Start Date"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">
                        Emergency Contact (Name & Phone)
                    </label>
                    <div className="relative">
                        <PhoneCall size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-medium"
                            placeholder="e.g. Next of Kin (+251 9...)"
                            value={newEmpData.emergencyContact}
                            onChange={e => setNewEmpData({ ...newEmpData, emergencyContact: e.target.value })}
                            aria-label="Emergency Contact"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
