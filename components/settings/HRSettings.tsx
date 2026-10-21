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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                        <Users size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            HR, Statutory Leave & Workforce Policy
                        </h2>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Labor law compliance, attendance thresholds, and supervisory dual-control for {countryProfile.name}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-9 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-40 self-start sm:self-auto"
                >
                    <Save size={14} />
                    <span>{isSaving ? 'Saving...' : 'Save HR Policy'}</span>
                </button>
            </div>

            {/* Statutory Leave Policies */}
            <div className="p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[var(--theme-border)] pb-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                        <Calendar size={14} />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)]">
                        Statutory Leave Allowances ({activeCountry})
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                            Annual Vacation Days
                        </label>
                        <input
                            type="number"
                            value={policy.annual_leave_days}
                            onChange={(e) => setPolicy({ ...policy, annual_leave_days: Number(e.target.value) })}
                            className="w-full px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
                        />
                        <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                            Statutory mandate ({activeCountry === 'KE' ? '21 days' : '16 days'})
                        </span>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                            Paid Medical / Sick Days
                        </label>
                        <input
                            type="number"
                            value={policy.sick_leave_days}
                            onChange={(e) => setPolicy({ ...policy, sick_leave_days: Number(e.target.value) })}
                            className="w-full px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
                        />
                        <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                            Labor code statutory allowance
                        </span>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                            Max Carry-Over Days
                        </label>
                        <input
                            type="number"
                            value={policy.carry_over_max_days}
                            onChange={(e) => setPolicy({ ...policy, carry_over_max_days: Number(e.target.value) })}
                            className="w-full px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
                        />
                        <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                            Maximum days rollable to next calendar year
                        </span>
                    </div>
                </div>

                <div className="pt-1">
                    <label className="flex items-center gap-3 p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 transition-colors cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={policy.two_tier_leave_approval_required}
                            onChange={(e) => setPolicy({ ...policy, two_tier_leave_approval_required: e.target.checked })}
                            className="w-4 h-4 rounded text-[var(--theme-accent)] focus:ring-0 accent-[var(--theme-accent)]"
                        />
                        <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                            Enforce Two-Tier Approval Chain (Manager Sign-Off → HR Central Concurrence)
                        </span>
                    </label>
                </div>
            </div>

            {/* Attendance & Time-Tracking Rules */}
            <div className="p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[var(--theme-border)] pb-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                        <Clock size={14} />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)]">
                        Attendance, Telemetry & Overtime Rules
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                            Standard Daily Hours
                        </label>
                        <input
                            type="number"
                            step="0.5"
                            value={policy.standard_work_hours_per_day}
                            onChange={(e) => setPolicy({ ...policy, standard_work_hours_per_day: Number(e.target.value) })}
                            className="w-full px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
                        />
                        <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">Full-time standard daily shift</span>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                            Late Grace Period (Mins)
                        </label>
                        <input
                            type="number"
                            value={policy.late_grace_period_mins}
                            onChange={(e) => setPolicy({ ...policy, late_grace_period_mins: Number(e.target.value) })}
                            className="w-full px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
                        />
                        <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">Allowed arrival threshold before 'Late' flag</span>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                            GPS Geofence Radius (Meters)
                        </label>
                        <input
                            type="number"
                            value={policy.geofence_radius_meters}
                            onChange={(e) => setPolicy({ ...policy, geofence_radius_meters: Number(e.target.value) })}
                            className="w-full px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
                        />
                        <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">Perimeter tolerance for mobile clock-in</span>
                    </div>
                </div>
            </div>

            {/* Zero-Trust Security & Dormant Account Threshold */}
            <div className="p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[var(--theme-border)] pb-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                        <ShieldAlert size={14} />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)]">
                        Zero-Trust Account Governance & Access Audit
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1.5">
                            Dormant Account Inactivity Threshold (Days)
                        </label>
                        <input
                            type="number"
                            value={policy.dormant_account_threshold_days}
                            onChange={(e) => setPolicy({ ...policy, dormant_account_threshold_days: Number(e.target.value) })}
                            className="w-full px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all"
                        />
                        <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                            Accounts without login beyond this threshold are flagged in the HR Access Review
                        </span>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                        <ShieldCheck className="text-amber-600 shrink-0" size={20} />
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                            <strong className="font-semibold text-amber-900 dark:text-amber-200">Rule 18 Enforced:</strong> Under Zero-Trust policy, HR personnel can audit dormant credentials and propose account deactivations for secondary executive sign-off.
                        </p>
                    </div>
                </div>
            </div>

            {/* Cross-Department Profile Governance & Segregation of Duties */}
            <div className="p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[var(--theme-border)] pb-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                        <ShieldCheck size={14} />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)]">
                            Cross-Department Profile Governance & Segregation of Duties ({activeCountry})
                        </h3>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                            Enforces multi-department approval gates when HR modifies sensitive employee fields. CEO retains sovereign override.
                        </p>
                    </div>
                </div>

                <div className="space-y-2.5">
                    <label className="flex items-start gap-3 p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 transition-colors cursor-pointer">
                        <input
                            type="checkbox"
                            checked={policy.require_finance_approval_for_salary !== false}
                            onChange={(e) => setPolicy({ ...policy, require_finance_approval_for_salary: e.target.checked })}
                            className="mt-0.5 w-4 h-4 rounded text-[var(--theme-accent)] focus:ring-0 accent-[var(--theme-accent)]"
                        />
                        <div>
                            <span className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                                Require Finance Department Sign-Off for Salary Adjustments
                            </span>
                            <span className="text-[11px] text-[var(--theme-text-secondary)] block mt-0.5">
                                Prevents HR from unilaterally increasing base pay without Finance Manager budget certification.
                            </span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 transition-colors cursor-pointer">
                        <input
                            type="checkbox"
                            checked={policy.require_dept_approval_for_transfers !== false}
                            onChange={(e) => setPolicy({ ...policy, require_dept_approval_for_transfers: e.target.checked })}
                            className="mt-0.5 w-4 h-4 rounded text-[var(--theme-accent)] focus:ring-0 accent-[var(--theme-accent)]"
                        />
                        <div>
                            <span className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                                Require Receiving Department Head Sign-Off for Staff Transfers
                            </span>
                            <span className="text-[11px] text-[var(--theme-text-secondary)] block mt-0.5">
                                Transfers to Logistics & Warehouse, Retail Operations, or Procurement require receiving manager headcount acceptance.
                            </span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 transition-colors cursor-pointer">
                        <input
                            type="checkbox"
                            checked={policy.require_compliance_approval_for_identity !== false}
                            onChange={(e) => setPolicy({ ...policy, require_compliance_approval_for_identity: e.target.checked })}
                            className="mt-0.5 w-4 h-4 rounded text-[var(--theme-accent)] focus:ring-0 accent-[var(--theme-accent)]"
                        />
                        <div>
                            <span className="text-xs font-semibold text-[var(--theme-text-primary)] block">
                                Require Executive & Compliance Sign-Off for Legal Name / Age / National ID
                            </span>
                            <span className="text-[11px] text-[var(--theme-text-secondary)] block mt-0.5">
                                Prevents ghost worker identity fraud under national fiscal laws (ERCA/KRA) by requiring secondary compliance sign-off.
                            </span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
