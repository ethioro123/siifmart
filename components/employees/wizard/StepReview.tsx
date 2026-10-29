import React from 'react';
import { User, Briefcase, DollarSign, Key, IdCard, FileText, CheckCircle2, ShieldCheck, Award } from 'lucide-react';
import { Site } from '../../../types';
import { getJobTitleForRole, SYSTEM_ROLES } from '../../../utils/roles';

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
                <div className="p-3.5 rounded-2xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <span className="font-bold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] block">Pre-Approved Headcount Slot (Instant Floor Activation)</span>
                        <span className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-0.5 block">
                            {quotaResult.reason} This frontline candidate will be activated immediately upon confirmation, issuing login credentials and adding them to the shift roster with zero HQ delay.
                        </span>
                    </div>
                </div>
            ) : !isDirect ? (
                <div className="p-3.5 rounded-2xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] flex items-start gap-3">
                    <ShieldCheck size={18} className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <span className="font-bold text-[var(--theme-text-primary)] block">Corporate HQ Exception Queue</span>
                        <span className="text-[var(--theme-text-secondary)] mt-0.5 block">
                            {quotaResult?.reason || 'Submitting this profile creates a candidate proposal in "Pending Approval" status. HR leadership must review it before system access is activated.'}
                        </span>
                    </div>
                </div>
            ) : null}
            <p className="text-xs text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                Please verify all onboarding details, facility assignment, and verification documents before confirming hire.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Personal Information */}
                <div className="bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_2%,transparent)] rounded-2xl p-4 border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]">
                    <h4 className="text-xs text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] uppercase font-bold mb-3 flex items-center gap-2">
                        <User size={14} /> Personal Information
                    </h4>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-[var(--theme-text-secondary)]">Full Name:</span>
                            <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">{newEmpData.firstName} {newEmpData.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--theme-text-secondary)]">Phone:</span>
                            <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-medium">{newEmpData.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--theme-text-secondary)]">Join Date:</span>
                            <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-medium">{newEmpData.joinDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--theme-text-secondary)]">Address:</span>
                            <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-medium truncate max-w-[140px]">{newEmpData.address || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Role & Location */}
                <div className="bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_2%,transparent)] rounded-2xl p-4 border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]">
                    <h4 className="text-xs text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] uppercase font-bold mb-3 flex items-center gap-2">
                        <Briefcase size={14} /> Role & Operating Facility
                    </h4>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-[var(--theme-text-secondary)]">Job Title:</span>
                            <span className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] font-bold">{newEmpData.jobTitle || getJobTitleForRole(newEmpData.role)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--theme-text-secondary)]">App Access:</span>
                            <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-medium">{newEmpData.createAppAccount === false ? 'No login' : 'Login enabled'} · {SYSTEM_ROLES.find(role => role.id === newEmpData.role)?.label || newEmpData.role}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--theme-text-secondary)]">Department:</span>
                            <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-medium">{newEmpData.department}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--theme-text-secondary)]">Workplace:</span>
                            <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold truncate max-w-[140px]">{assignedSite?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--theme-text-secondary)]">Site Type:</span>
                            <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-medium">{assignedSite?.type || 'Standard'}</span>
                        </div>
                    </div>
                </div>

                {/* Attached Documents Review */}
                <div className="bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_2%,transparent)] rounded-2xl p-4 border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] sm:col-span-2">
                    <h4 className="text-xs text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] uppercase font-bold mb-3 flex items-center gap-2">
                        <IdCard size={14} /> Attached Personnel Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* National ID */}
                        <div className="p-2.5 rounded-xl bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] border border-[var(--theme-border)]/60 border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] flex items-center gap-3">
                            {newEmpData.nationalIdPhoto ? (
                                <img src={newEmpData.nationalIdPhoto} alt="ID" className="w-10 h-10 rounded-lg object-cover border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] shrink-0" />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] flex items-center justify-center text-[var(--theme-text-muted)] shrink-0">
                                    <IdCard size={18} />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">National ID Photo</p>
                                <p className="text-[10px] text-[var(--theme-text-muted)] font-mono">
                                    {newEmpData.nationalIdInfo ? `Compressed: ${newEmpData.nationalIdInfo.compressedSize}` : 'Not uploaded'}
                                </p>
                            </div>
                        </div>

                        {/* Resume */}
                        <div className="p-2.5 rounded-xl bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] border border-[var(--theme-border)]/60 border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--theme-status-info-bg)] bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] flex items-center justify-center shrink-0">
                                <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">Resume / CV</p>
                                <p className="text-[10px] text-[var(--theme-text-muted)] font-mono truncate">
                                    {newEmpData.resume ? `${newEmpData.resume.name} (${newEmpData.resume.size})` : 'Not attached'}
                                </p>
                            </div>
                        </div>

                        {/* Certificates */}
                        <div className="p-2.5 rounded-xl bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] border border-[var(--theme-border)]/60 border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                                <Award size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">Certificates</p>
                                <p className="text-[10px] text-[var(--theme-text-muted)] font-mono">
                                    {(newEmpData.certificates || []).length} Document(s) attached
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Itemized Certificates with Category for Approver Sign-off */}
                    {(newEmpData.certificates || []).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[var(--theme-border)]/60 border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] space-y-2">
                            <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                <Award size={13} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]" />
                                <span>Verified Credentials for Sign-off ({(newEmpData.certificates || []).length})</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(newEmpData.certificates || []).map((cert: any) => (
                                    <div
                                        key={cert.id}
                                        className="p-2.5 rounded-xl bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] border border-[var(--theme-border)]/60 border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] flex items-center justify-between gap-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--theme-primary)]/10 dark:bg-[var(--theme-primary-muted)]/10 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] border border-[var(--theme-border)]/20 shrink-0">
                                                    {cert.category || 'Professional Certificate'}
                                                </span>
                                                <span className="text-[10px] text-[var(--theme-text-muted)] font-mono">
                                                    {cert.size}
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] truncate mt-1">
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
                    <div className="bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_2%,transparent)] rounded-2xl p-4 border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] sm:col-span-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[var(--theme-text-secondary)] font-semibold flex items-center gap-1.5">
                                <DollarSign size={14} className="text-[var(--theme-primary)]" />
                                Base Monthly Compensation:
                            </span>
                            <span className="font-extrabold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] text-sm">
                                {currencySymbol} {parseFloat(newEmpData.salary).toLocaleString()} / month
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Ribbon Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--theme-status-success)] via-[color-mix(in_srgb,var(--theme-status-success)_5%,transparent)] to-transparent border border-[var(--theme-status-success-border)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                    <img
                        src={newEmpData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmpData.firstName + ' ' + newEmpData.lastName)}&background=2C5E3B&color=ffffff`}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] shrink-0"
                    />
                    <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] truncate">
                            {newEmpData.firstName} {newEmpData.lastName}
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] font-medium">
                            {newEmpData.jobTitle || getJobTitleForRole(newEmpData.role)} • {assignedSite?.name || 'HQ'}
                        </p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold block">ID Number</span>
                    <span className="text-xs font-mono font-bold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">Auto-Generated</span>
                </div>
            </div>
        </div>
    );
}
