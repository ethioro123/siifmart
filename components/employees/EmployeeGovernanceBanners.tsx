import React from 'react';
import { ShieldCheck, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { PayrollRun } from '../../types';

interface EmployeeGovernanceBannersProps {
   pendingSalaryCount: number;
   onOpenSalaryQueue: () => void;
   pendingChangeCount: number;
   onOpenChangeModal: () => void;
   pendingPayrollRun: PayrollRun | null;
   canViewAll: boolean;
   userRole?: string;
   onCertifyPayroll: () => void;
   onNavigateFinance: () => void;
   onAttestRegionalPayroll?: () => void;
   pendingRecruitsCount?: number;
   filterStatus?: string;
   onFilterPendingRecruits?: () => void;
   onShowAllRecruits?: () => void;
   pendingQuotaCount?: number;
   onOpenQuotaModal?: () => void;
}

export const EmployeeGovernanceBanners: React.FC<EmployeeGovernanceBannersProps> = ({
   pendingSalaryCount,
   onOpenSalaryQueue,
   pendingChangeCount,
   onOpenChangeModal,
   pendingPayrollRun,
   canViewAll,
   userRole,
   onCertifyPayroll,
   onNavigateFinance,
   onAttestRegionalPayroll,
   pendingRecruitsCount = 0,
   filterStatus = 'All',
   onFilterPendingRecruits,
   onShowAllRecruits,
   pendingQuotaCount = 0,
   onOpenQuotaModal
}) => {
   return (
      <div className="space-y-3">
         {/* Governance Banner: Compensation Adjustments */}
         {pendingSalaryCount > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                     <ShieldCheck size={18} />
                  </div>
                  <div>
                     <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        {pendingSalaryCount} Compensation Adjustment {pendingSalaryCount === 1 ? 'Proposal' : 'Proposals'} Awaiting Authorization
                     </h4>
                     <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Dual-Control 4-Eyes Governance: Compensation changes proposed by HR require Finance Manager or CEO co-signature.
                     </p>
                  </div>
               </div>
               <button
                  type="button"
                  onClick={onOpenSalaryQueue}
                  className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0 shadow-xs active:scale-[0.98]"
               >
                  Review Salary Queue
               </button>
            </div>
         )}

         {/* Governance Banner: Profile Changes */}
         {pendingChangeCount > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                     <ShieldCheck size={18} />
                  </div>
                  <div>
                     <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        {pendingChangeCount} Cross-Department Profile {pendingChangeCount === 1 ? 'Change' : 'Changes'} Awaiting Sign-Off
                     </h4>
                     <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Segregation of Duties: HR modifications to legal identity, departments, or roles require managerial authorization.
                     </p>
                  </div>
               </div>
               <button
                  type="button"
                  onClick={onOpenChangeModal}
                  className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0 shadow-xs active:scale-[0.98]"
               >
                  Review Approvals Queue
               </button>
            </div>
         )}

         {/* Governance Banner: Payroll Certification */}
         {pendingPayrollRun && !pendingPayrollRun.hrApprovedBy && pendingPayrollRun.status !== 'disbursed' && pendingPayrollRun.status !== 'rejected' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                     <DollarSign size={18} />
                  </div>
                  <div>
                     <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        Monthly Payroll Cycle ({pendingPayrollRun.period}) Awaiting HR Certification
                     </h4>
                     <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        {userRole === 'regional_hr_officer'
                           ? 'Division of Responsibility: Regional HR continuously audits branch headcount, attendance, and leave. Country-wide payroll cycle certification is finalized at Country HQ / Managing Director.'
                           : 'Zero-Trust Multi-Department Governance: Staff roster, active attendance, and leave deductions must be certified by HQ HR or Managing Director before release.'}
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-2 shrink-0">
                  {pendingPayrollRun.regionalAttestedBy ? (
                     <span
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1"
                        title={`Attested by ${pendingPayrollRun.regionalAttestedBy} (${pendingPayrollRun.regionalAttestedByRole || 'Regional HR'})`}
                     >
                        <ShieldCheck size={12} />
                        <span>Regional Audit Attested</span>
                     </span>
                  ) : userRole === 'regional_hr_officer' && onAttestRegionalPayroll ? (
                     <button
                        type="button"
                        onClick={onAttestRegionalPayroll}
                        className="h-9 px-3.5 rounded-xl bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                     >
                        <ShieldCheck size={14} />
                        <span>Attest Regional Audit</span>
                     </button>
                  ) : null}
                  <button
                     type="button"
                     onClick={onNavigateFinance}
                     className="h-9 px-3.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-semibold text-xs transition-colors cursor-pointer active:scale-[0.98]"
                  >
                     Details in Financials
                  </button>
                  {canViewAll && (userRole === 'hr' || userRole === 'hr_manager' || userRole === 'admin' || userRole === 'super_admin') && (
                     <button
                        type="button"
                        onClick={onCertifyPayroll}
                        className="h-9 px-3.5 rounded-xl bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                     >
                        <ShieldCheck size={14} />
                        <span>Certify Roster</span>
                     </button>
                  )}
               </div>
            </div>
         )}

         {/* Pending Recruits Alert */}
         {pendingRecruitsCount > 0 && onFilterPendingRecruits && onShowAllRecruits && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                     <AlertTriangle size={18} />
                  </div>
                  <div>
                     <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        {pendingRecruitsCount} Pending Onboarding {pendingRecruitsCount === 1 ? 'Recruit' : 'Recruits'} Awaiting Approval
                     </h4>
                     <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Talent onboarded with "Pending Approval" require authorization from HR or Super Admin before activating system access.
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  {filterStatus !== 'Pending Approval' ? (
                     <button
                        type="button"
                        onClick={onFilterPendingRecruits}
                        className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer active:scale-[0.98]"
                     >
                        Filter Pending ({pendingRecruitsCount})
                     </button>
                  ) : (
                     <button
                        type="button"
                        onClick={onShowAllRecruits}
                        className="h-9 px-3.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-semibold text-xs transition-colors cursor-pointer active:scale-[0.98]"
                     >
                        Show All
                     </button>
                  )}
               </div>
            </div>
         )}

         {/* Headcount Quota Surge Alert */}
         {(pendingQuotaCount ?? 0) > 0 && onOpenQuotaModal && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                     <TrendingUp size={18} />
                  </div>
                  <div>
                     <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        {pendingQuotaCount} Regional Headcount Quota {pendingQuotaCount === 1 ? 'Surge' : 'Surges'} Awaiting HQ Review
                     </h4>
                     <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Capacity & Delegation Governance: Regional administration offices require Corporate HQ sign-off to exceed branch staffing ceilings.
                     </p>
                  </div>
               </div>
               <button
                  type="button"
                  onClick={onOpenQuotaModal}
                  className="h-9 px-3.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0 shadow-xs active:scale-[0.98]"
               >
                  Review Quota Requests
               </button>
            </div>
         )}
      </div>
   );
};
