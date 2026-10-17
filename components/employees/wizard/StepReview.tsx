import React from 'react';
import { User, Briefcase, DollarSign, Key, IdCard, FileText, CheckCircle2, ShieldCheck, Award } from 'lucide-react';
import { Site } from '../../../types';
import { getJobTitleForRole } from '../../../utils/roles';

import { isDirectOnboardingAuthorized } from '../../../utils/employeeOnboardingGovernance';

interface StepReviewProps {
    newEmpData: any;
    sites: Site[];
    currencySymbol: string;
    user: any;
    quotaResult?: any;
}

export default function StepReview({
    newEmpData,
    sites,
    currencySymbol,
    user,
    quotaResult
}: StepReviewProps) {
    const assignedSite = sites.find(s => s.id === newEmpData.siteId);
    const isDirect = isDirectOnboardingAuthorized(user?.role, newEmpData.role, Boolean(quotaResult?.canAutoActivate));

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            {quotaResult?.canAutoActivate ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Pre-Approved Headcount Slot (Instant Floor Activation)</span>
                        <span className="text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                            {quotaResult.reason} This frontline candidate will be activated immediately upon confirmation, issuing login credentials and adding them to the shift roster with zero HQ delay.
                        </span>
                    </div>
                </div>
            ) : !isDirect ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                    <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <span className="font-bold text-[var(--theme-text-primary)] block">Corporate HQ Exception Queue</span>
                        <span className="text-[var(--theme-text-secondary)] mt-0.5 block">
                            {quotaResult?.reason || 'As a site or regional manager, submitting this profile registers a candidate proposal in "Pending Approval" status. Requires Corporate HQ review before system credentials can be activated.'}
                        </span>
                    </div>
                </div>
            ) : null}
            <p className="text-xs text-stone-500 dark:text-stone-400">
                Please verify all onboarding details, facility assignment, and verification documents before confirming hire.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Personal Information */}
                <div className="bg-stone-50 dark:bg-white/[0.02] rounded-2xl p-4 border border-[#E2DCCE] dark:border-white/10">
                    <h4 className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold mb-3 flex items-center gap-2">
                        <User size={14} /> Personal Information
                    </h4>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-stone-500">Full Name:</span>
                            <span className="text-stone-900 dark:text-white font-bold">{newEmpData.firstName} {newEmpData.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500">Phone:</span>
                            <span className="text-stone-900 dark:text-white font-medium">{newEmpData.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500">Join Date:</span>
                            <span className="text-stone-900 dark:text-white font-medium">{newEmpData.joinDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500">Address:</span>
                            <span className="text-stone-900 dark:text-white font-medium truncate max-w-[140px]">{newEmpData.address || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Role & Location */}
                <div className="bg-stone-50 dark:bg-white/[0.02] rounded-2xl p-4 border border-[#E2DCCE] dark:border-white/10">
                    <h4 className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold mb-3 flex items-center gap-2">
                        <Briefcase size={14} /> Role & Operating Facility
                    </h4>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-stone-500">Job Title:</span>
                            <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">{getJobTitleForRole(newEmpData.role)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500">Department:</span>
                            <span className="text-stone-900 dark:text-white font-medium">{newEmpData.department}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500">Workplace:</span>
                            <span className="text-stone-900 dark:text-white font-bold truncate max-w-[140px]">{assignedSite?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500">Site Type:</span>
                            <span className="text-stone-900 dark:text-white font-medium">{assignedSite?.type || 'Standard'}</span>
                        </div>
                    </div>
                </div>

                {/* Attached Documents Review */}
                <div className="bg-stone-50 dark:bg-white/[0.02] rounded-2xl p-4 border border-[#E2DCCE] dark:border-white/10 sm:col-span-2">
                    <h4 className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold mb-3 flex items-center gap-2">
                        <IdCard size={14} /> Attached Personnel Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* National ID */}
                        <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#E2DCCE]/60 dark:border-white/5 flex items-center gap-3">
                            {newEmpData.nationalIdPhoto ? (
                                <img src={newEmpData.nationalIdPhoto} alt="ID" className="w-10 h-10 rounded-lg object-cover border border-[#E2DCCE] dark:border-white/10 shrink-0" />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-400 shrink-0">
                                    <IdCard size={18} />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-stone-800 dark:text-stone-200">National ID Photo</p>
                                <p className="text-[10px] text-stone-400 font-mono">
                                    {newEmpData.nationalIdInfo ? `Compressed: ${newEmpData.nationalIdInfo.compressedSize}` : 'Not uploaded'}
                                </p>
                            </div>
                        </div>

                        {/* Resume */}
                        <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#E2DCCE]/60 dark:border-white/5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-stone-800 dark:text-stone-200">Resume / CV</p>
                                <p className="text-[10px] text-stone-400 font-mono truncate">
                                    {newEmpData.resume ? `${newEmpData.resume.name} (${newEmpData.resume.size})` : 'Not attached'}
                                </p>
                            </div>
                        </div>

                        {/* Certificates */}
                        <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#E2DCCE]/60 dark:border-white/5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Award size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-stone-800 dark:text-stone-200">Certificates</p>
                                <p className="text-[10px] text-stone-400 font-mono">
                                    {(newEmpData.certificates || []).length} Document(s) attached
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Itemized Certificates with Category for Approver Sign-off */}
                    {(newEmpData.certificates || []).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#E2DCCE]/60 dark:border-white/10 space-y-2">
                            <p className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Award size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                <span>Verified Credentials for Sign-off ({(newEmpData.certificates || []).length})</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(newEmpData.certificates || []).map((cert: any) => (
                                    <div
                                        key={cert.id}
                                        className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#E2DCCE]/60 dark:border-white/5 flex items-center justify-between gap-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 shrink-0">
                                                    {cert.category || 'Professional Certificate'}
                                                </span>
                                                <span className="text-[10px] text-stone-400 font-mono">
                                                    {cert.size}
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate mt-1">
                                                {cert.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Compensation if provided */}
                {newEmpData.salary && (
                    <div className="bg-stone-50 dark:bg-white/[0.02] rounded-2xl p-4 border border-[#E2DCCE] dark:border-white/10 sm:col-span-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-stone-500 font-semibold flex items-center gap-1.5">
                                <DollarSign size={14} className="text-[#2C5E3B]" />
                                Base Monthly Compensation:
                            </span>
                            <span className="font-extrabold text-[#2C5E3B] dark:text-[#A9CBA2] text-sm">
                                {currencySymbol} {parseFloat(newEmpData.salary).toLocaleString()} / month
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Ribbon Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#2C5E3B]/5 to-transparent border border-emerald-500/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                    <img
                        src={newEmpData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmpData.firstName + ' ' + newEmpData.lastName)}&background=2C5E3B&color=ffffff`}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-[#E2DCCE] dark:border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] truncate">
                            {newEmpData.firstName} {newEmpData.lastName}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                            {getJobTitleForRole(newEmpData.role)} • {assignedSite?.name || 'HQ'}
                        </p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">ID Number</span>
                    <span className="text-xs font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">Auto-Generated</span>
                </div>
            </div>
        </div>
    );
}
