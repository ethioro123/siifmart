import React, { useState } from 'react';
import { Upload, MapPin, Eye, EyeOff, Camera, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Site } from '../../../types';
import { getActiveRolePolicy } from '../../../services/zeroTrustPolicies.service';

interface StepIdentityProps {
    newEmpData: any;
    setNewEmpData: (data: any) => void;
    handlePhotoClick: () => void;
    user: any;
    sites: Site[];
    activeSite: Site | null | undefined;
}

export default function StepIdentity({
    newEmpData,
    setNewEmpData,
    handlePhotoClick,
    user,
    sites,
    activeSite
}: StepIdentityProps) {
    const [showPassword, setShowPassword] = useState(false);
    const effectiveRegion = user?.regionCode || (user as any)?.region_code || activeSite?.regionCode || (activeSite as any)?.region_code;
    const isRegional = Boolean(
        user?.scopeLevel === 'REGIONAL' ||
        (user as any)?.scope_level === 'REGIONAL' ||
        ['regional_operations_manager', 'regional_hr_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_logistics_manager', 'regional_security_manager'].includes(user?.role || '') ||
        (['hr_generalist', 'talent_recruiter', 'training_coordinator'].includes(user?.role || '') && Boolean(effectiveRegion))
    );
    const isHQ = !isRegional && ['group_ceo', 'country_managing_director', 'country_hr_director', 'hr_generalist', 'talent_recruiter', 'country_operations_director', 'country_finance_director'].includes(user?.role || '');

    const selectableSites = React.useMemo(() => {
        if (isHQ) return sites;
        if (isRegional && effectiveRegion) {
            return sites.filter(s => s.regionCode === effectiveRegion || (s as any).region_code === effectiveRegion);
        }
        return sites.filter(s => s.id === (newEmpData.siteId || activeSite?.id));
    }, [isHQ, isRegional, sites, effectiveRegion, newEmpData.siteId, activeSite?.id]);

    const canAssignSites = isHQ || (isRegional && selectableSites.length > 0);

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Photo Avatar */}
                <div
                    onClick={handlePhotoClick}
                    className="w-28 h-28 sm:w-32 sm:h-32 bg-stone-100 dark:bg-black/30 border-2 border-dashed border-[#E2DCCE] dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-stone-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:border-[#2C5E3B] cursor-pointer transition-all group overflow-hidden relative flex-shrink-0"
                    title="Upload Profile Picture"
                >
                    {newEmpData.avatar ? (
                        <img src={newEmpData.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <Upload size={22} className="mb-1.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-bold text-center px-2">Profile Photo</span>
                        </>
                    )}
                    {newEmpData.avatar && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={20} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Name & Credentials */}
                <div className="flex-1 w-full space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">
                                First Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                id="candidate_first_name"
                                name="candidate_first_name"
                                type="text"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="words"
                                spellCheck={false}
                                data-lpignore="true"
                                data-1p-ignore="true"
                                data-bwignore="true"
                                data-form-type="other"
                                className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-medium"
                                value={newEmpData.firstName}
                                onChange={e => setNewEmpData({ ...newEmpData, firstName: e.target.value })}
                                placeholder="Given Name"
                                aria-label="First Name"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">
                                Last Name
                            </label>
                            <input
                                id="candidate_last_name"
                                name="candidate_last_name"
                                type="text"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="words"
                                spellCheck={false}
                                data-lpignore="true"
                                data-1p-ignore="true"
                                data-bwignore="true"
                                data-form-type="other"
                                className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-medium"
                                value={newEmpData.lastName}
                                onChange={e => setNewEmpData({ ...newEmpData, lastName: e.target.value })}
                                placeholder="Surname"
                                aria-label="Last Name"
                            />
                        </div>
                    </div>

                    <div className="bg-stone-50 dark:bg-white/[0.02] rounded-xl px-3 py-2 border border-[#E2DCCE]/60 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-bold uppercase">System Email</span>
                        <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-semibold flex items-center gap-1.5">
                            <Mail size={13} className="shrink-0" />
                            <span>Auto-assigned from Employee ID</span>
                        </p>
                    </div>

                    <label className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <input
                            type="checkbox"
                            checked={newEmpData.createAppAccount !== false}
                            onChange={e => setNewEmpData({ ...newEmpData, createAppAccount: e.target.checked, password: e.target.checked ? newEmpData.password : '' })}
                            className="mt-0.5 accent-[#2C5E3B]"
                        />
                        <span>
                            <span className="block font-semibold">Create app login</span>
                            <span className="block text-[11px] text-stone-500 dark:text-stone-400">Turn this off for employees who need a workforce record but no SIIFMART account.</span>
                        </span>
                    </label>

                    {newEmpData.createAppAccount !== false && <div>
                        <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">
                            Password (For System Login) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="candidate_temp_password"
                                name="candidate_temp_password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                autoCorrect="off"
                                spellCheck={false}
                                data-lpignore="true"
                                data-1p-ignore="true"
                                data-bwignore="true"
                                data-form-type="other"
                                className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 pr-10 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-mono"
                                value={newEmpData.password}
                                onChange={e => setNewEmpData({ ...newEmpData, password: e.target.value })}
                                placeholder={
                                    getActiveRolePolicy(newEmpData.role).password_complexity === 'high'
                                        ? 'Min 12 chars (Upper, lower, num, symbol)'
                                        : getActiveRolePolicy(newEmpData.role).password_complexity === 'medium'
                                        ? 'Min 8 chars (letters and numbers)'
                                        : 'Minimum 6 characters'
                                }
                                aria-label="Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1">
                            <ShieldCheck size={11} className="text-[#0071E3] dark:text-[#2997FF]" />
                            <span>
                                Policy: {getActiveRolePolicy(newEmpData.role).password_complexity.toUpperCase()} complexity required for this role
                            </span>
                        </p>
                    </div>}
                </div>
            </div>

            {/* Workplace Location */}
            <div>
                <label className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold mb-1.5 flex items-center gap-1.5">
                    <MapPin size={14} /> Assigned Workplace Facility ID <span className="text-rose-500">*</span>
                </label>
                {canAssignSites ? (
                    <div>
                        <select
                            className={`w-full bg-white dark:bg-black/30 border ${
                                !newEmpData.siteId ? 'border-amber-500/80 ring-2 ring-amber-500/20' : 'border-[#E2DCCE] dark:border-white/10'
                            } text-stone-900 dark:text-white rounded-xl px-3 py-2.5 outline-none focus:border-[#2C5E3B] dark:focus:border-emerald-500 text-sm font-medium`}
                            value={newEmpData.siteId || ''}
                            onChange={e => setNewEmpData({ ...newEmpData, siteId: e.target.value })}
                            aria-label="Assign Workplace Facility ID"
                        >
                            <option value="" disabled className="text-stone-400">-- Select Workplace Facility (Mandatory) --</option>
                            {selectableSites.map(s => (
                                <option key={s.id} value={s.id} className="text-black">
                                    {s.name} [{s.code}] ({s.type})
                                </option>
                            ))}
                        </select>
                        {!newEmpData.siteId && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
                                <AlertTriangle size={12} className="shrink-0" />
                                <span>Facility assignment is mandatory for role-scoping and security control (except CEO).</span>
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="w-full bg-stone-50 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2.5 text-stone-900 dark:text-white flex items-center justify-between">
                        <span className="font-semibold text-sm">
                            {(() => {
                                const s = sites.find(st => st.id === newEmpData.siteId) || activeSite;
                                return s ? `${s.name} [${s.code}]` : 'Unassigned Location';
                            })()}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                            {sites.find(s => s.id === newEmpData.siteId)?.type || activeSite?.type || 'Site'}
                        </span>
                    </div>
                )}
            </div>

            {/* Phone & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                    <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">Phone Number</label>
                    <input
                        className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-medium"
                        value={newEmpData.phone}
                        placeholder={activeSite?.country === 'KE' || sites.find(s => s.id === newEmpData.siteId)?.country === 'KE' ? "e.g. +254 712 345 678" : "e.g. +251 911 000 000"}
                        onChange={e => setNewEmpData({ ...newEmpData, phone: e.target.value })}
                        aria-label="Phone Number"
                    />
                </div>
                <div>
                    <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">Residential Address</label>
                    <input
                        className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-medium"
                        value={newEmpData.address}
                        placeholder="City, Subcity / District"
                        onChange={e => setNewEmpData({ ...newEmpData, address: e.target.value })}
                        aria-label="Address"
                    />
                </div>
            </div>
        </div>
    );
}
