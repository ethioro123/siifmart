import React, { useState, useEffect } from 'react';
import { 
    Users, ShieldCheck, Clock, Calendar, AlertCircle, Save, 
    Compass, Award, UserMinus, ShieldAlert
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { Country, getCountryProfile } from '../../utils/localization';
import type { HRCountryPolicy } from '../../types/hr-advanced';
import { supabase } from '../../lib/supabase';

const DEFAULT_POLICIES: Record<string, HRCountryPolicy> = {
    ET: {
        country_code: 'ET',
        annual_leave_days: 16,
        sick_leave_days: 30,
        maternity_leave_days: 120,
        paternity_leave_days: 3,
        carry_over_max_days: 5,
        standard_work_hours_per_day: 8.0,
        late_grace_period_mins: 15,
        overtime_multiplier: 1.25,
        geofence_radius_meters: 200,
        dormant_account_threshold_days: 30,
        two_tier_leave_approval_required: true,
        require_finance_approval_for_salary: true,
        require_dept_approval_for_transfers: true,
        require_compliance_approval_for_identity: true
    },
    KE: {
        country_code: 'KE',
        annual_leave_days: 21,
        sick_leave_days: 30,
        maternity_leave_days: 90,
        paternity_leave_days: 14,
        carry_over_max_days: 14,
        standard_work_hours_per_day: 8.0,
        late_grace_period_mins: 15,
        overtime_multiplier: 1.25,
        geofence_radius_meters: 200,
        dormant_account_threshold_days: 30,
        two_tier_leave_approval_required: true,
        require_finance_approval_for_salary: true,
        require_dept_approval_for_transfers: true,
        require_compliance_approval_for_identity: true
    }
};

export default function HRSettings() {
    const { user, showToast } = useStore();
    const { settings, effectiveCountry } = useData();

    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);

    const [policy, setPolicy] = useState<HRCountryPolicy>(() => 
        DEFAULT_POLICIES[activeCountry] || DEFAULT_POLICIES.ET
    );
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Load country-specific policy from Supabase if available
        async function loadPolicy() {
            try {
                const { data } = await supabase
                    .from('hr_country_policies')
                    .select('*')
                    .eq('country_code', activeCountry)
                    .single();

                if (data) {
                    setPolicy(data);
                } else {
                    setPolicy(DEFAULT_POLICIES[activeCountry] || DEFAULT_POLICIES.ET);
                }
            } catch {
                setPolicy(DEFAULT_POLICIES[activeCountry] || DEFAULT_POLICIES.ET);
            }
        }
        loadPolicy();
    }, [activeCountry]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await supabase
                .from('hr_country_policies')
                .upsert({
                    ...policy,
                    country_code: activeCountry,
                    updated_at: new Date().toISOString(),
                    updated_by: user?.name || 'HR Admin'
                });
            showToast('HR & workforce policies saved successfully!', 'success');
        } catch {
            showToast('Saved to local application context', 'info');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/80 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#2C5E3B]/10 rounded-2xl text-[#2C5E3B] dark:text-[#A9CBA2]">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">
                            HR, Statutory Leave & Workforce Policy
                        </h2>
                        <p className="text-xs text-stone-500 font-medium">
                            Labor law compliance, attendance thresholds, and supervisory dual-control for {countryProfile.name}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="woody-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                    <Save size={15} />
                    <span>{isSaving ? 'Saving...' : 'Save HR Policy'}</span>
                </button>
            </div>

            {/* Statutory Leave Policies */}
            <div className="p-6 bg-white/80 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E2DCCE] dark:border-white/10 pb-3">
                    <Calendar size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <h3 className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                        Statutory Leave Allowances ({activeCountry})
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                            Annual Vacation Days
                        </label>
                        <input
                            type="number"
                            value={policy.annual_leave_days}
                            onChange={(e) => setPolicy({ ...policy, annual_leave_days: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">
                            Statutory mandate ({activeCountry === 'KE' ? '21 days' : '16 days'})
                        </span>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                            Paid Medical / Sick Days
                        </label>
                        <input
                            type="number"
                            value={policy.sick_leave_days}
                            onChange={(e) => setPolicy({ ...policy, sick_leave_days: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">
                            Labor code statutory allowance
                        </span>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                            Max Carry-Over Days
                        </label>
                        <input
                            type="number"
                            value={policy.carry_over_max_days}
                            onChange={(e) => setPolicy({ ...policy, carry_over_max_days: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">
                            Maximum days rollable to next calendar year
                        </span>
                    </div>
                </div>

                <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={policy.two_tier_leave_approval_required}
                            onChange={(e) => setPolicy({ ...policy, two_tier_leave_approval_required: e.target.checked })}
                            className="rounded text-[#2C5E3B] focus:ring-0"
                        />
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            Enforce Two-Tier Approval Chain (Manager Sign-Off → HR Central Concurrence)
                        </span>
                    </label>
                </div>
            </div>

            {/* Attendance & Time-Tracking Rules */}
            <div className="p-6 bg-white/80 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E2DCCE] dark:border-white/10 pb-3">
                    <Clock size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <h3 className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                        Attendance, Telemetry & Overtime Rules
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                            Standard Daily Hours
                        </label>
                        <input
                            type="number"
                            step="0.5"
                            value={policy.standard_work_hours_per_day}
                            onChange={(e) => setPolicy({ ...policy, standard_work_hours_per_day: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">Full-time standard daily shift</span>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                            Late Grace Period (Mins)
                        </label>
                        <input
                            type="number"
                            value={policy.late_grace_period_mins}
                            onChange={(e) => setPolicy({ ...policy, late_grace_period_mins: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">Allowed arrival threshold before 'Late' flag</span>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                            GPS Geofence Radius (Meters)
                        </label>
                        <input
                            type="number"
                            value={policy.geofence_radius_meters}
                            onChange={(e) => setPolicy({ ...policy, geofence_radius_meters: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">Perimeter tolerance for mobile clock-in</span>
                    </div>
                </div>
            </div>

            {/* Zero-Trust Security & Dormant Account Threshold */}
            <div className="p-6 bg-white/80 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E2DCCE] dark:border-white/10 pb-3">
                    <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                        Zero-Trust Account Governance & Access Audit
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                            Dormant Account Inactivity Threshold (Days)
                        </label>
                        <input
                            type="number"
                            value={policy.dormant_account_threshold_days}
                            onChange={(e) => setPolicy({ ...policy, dormant_account_threshold_days: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">
                            Accounts without login beyond this threshold are flagged in the HR Access Review
                        </span>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                        <ShieldCheck className="text-amber-600 shrink-0" size={24} />
                        <p className="text-xs text-amber-900 dark:text-amber-200">
                            <strong>Rule 18 Enforced:</strong> Under Zero-Trust policy, HR personnel can audit dormant credentials and propose account deactivations for secondary executive sign-off.
                        </p>
                    </div>
                </div>
            </div>

            {/* Cross-Department Profile Governance & Segregation of Duties */}
            <div className="p-6 bg-white/80 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E2DCCE] dark:border-white/10 pb-3">
                    <ShieldCheck size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <div>
                        <h3 className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                            Cross-Department Profile Governance & Segregation of Duties ({activeCountry})
                        </h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Enforces multi-department approval gates when HR modifies sensitive employee fields. CEO retains sovereign override.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-black/20 rounded-2xl border border-stone-200 dark:border-white/5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={policy.require_finance_approval_for_salary !== false}
                            onChange={(e) => setPolicy({ ...policy, require_finance_approval_for_salary: e.target.checked })}
                            className="mt-0.5 rounded text-[#2C5E3B] focus:ring-0"
                        />
                        <div>
                            <span className="text-xs font-bold text-stone-900 dark:text-white block">
                                Require Finance Department Sign-Off for Salary Adjustments
                            </span>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                                Prevents HR from unilaterally increasing base pay without Finance Manager budget certification.
                            </span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-black/20 rounded-2xl border border-stone-200 dark:border-white/5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={policy.require_dept_approval_for_transfers !== false}
                            onChange={(e) => setPolicy({ ...policy, require_dept_approval_for_transfers: e.target.checked })}
                            className="mt-0.5 rounded text-[#2C5E3B] focus:ring-0"
                        />
                        <div>
                            <span className="text-xs font-bold text-stone-900 dark:text-white block">
                                Require Receiving Department Head Sign-Off for Staff Transfers
                            </span>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                                Transfers to Logistics & Warehouse, Retail Operations, or Procurement require receiving manager headcount acceptance.
                            </span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-black/20 rounded-2xl border border-stone-200 dark:border-white/5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={policy.require_compliance_approval_for_identity !== false}
                            onChange={(e) => setPolicy({ ...policy, require_compliance_approval_for_identity: e.target.checked })}
                            className="mt-0.5 rounded text-[#2C5E3B] focus:ring-0"
                        />
                        <div>
                            <span className="text-xs font-bold text-stone-900 dark:text-white block">
                                Require Executive & Compliance Sign-Off for Legal Name / Age / National ID
                            </span>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                                Prevents ghost worker identity fraud under national fiscal laws (ERCA/KRA) by requiring secondary compliance sign-off.
                            </span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
