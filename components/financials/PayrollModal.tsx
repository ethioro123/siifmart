import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import Modal from '../Modal';
import { payrollRunsService } from '../../services/payroll-runs.service';
import type { PayrollRun } from '../../types';
import { PayrollHrCard } from './payroll/PayrollHrCard';
import { PayrollFinanceCard } from './payroll/PayrollFinanceCard';

export const PayrollModal: React.FC = () => {
  const {
    isPayrollModalOpen,
    setIsPayrollModalOpen,
    employees,
    totalSalaries,
    totalBonuses,
    user,
    currencySymbol,
    effectiveCountry,
    activeSite,
    addNotification,
    processPayroll
  } = useFinance();

  const [activeRun, setActiveRun] = useState<PayrollRun | null>(null);
  const [isLoadingRun, setIsLoadingRun] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [hrNotesInput, setHrNotesInput] = useState('');
  const [financeNotesInput, setFinanceNotesInput] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Period label e.g., "October 2026"
  const currentMonthYear = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const activeEmployees = employees.filter(
    e => (!activeSite?.id || e.siteId === activeSite.id || e.site_id === activeSite.id) && e.status === 'Active'
  );

  const totalPayout = totalSalaries + totalBonuses;

  // Load latest payroll run for the active country/site
  const loadActiveRun = useCallback(async () => {
    setIsLoadingRun(true);
    try {
      const run = await payrollRunsService.getLatestRun(
        activeSite?.id,
        effectiveCountry,
        currentMonthYear
      );
      setActiveRun(run);
    } catch {
      // Handled gracefully
    } finally {
      setIsLoadingRun(false);
    }
  }, [activeSite?.id, effectiveCountry, currentMonthYear]);

  useEffect(() => {
    if (isPayrollModalOpen) {
      loadActiveRun();
    }
  }, [isPayrollModalOpen, loadActiveRun]);

  // Role Checks
  const userRole = (user?.role || '').toLowerCase();
  const userName = user?.name || user?.email || 'User';

  const isSuperAdminOrCeo = userRole === 'super_admin' || userRole === 'ceo';
  const isHR = isSuperAdminOrCeo || ['hr', 'hr_manager', 'admin'].includes(userRole);
  const isFinance = isSuperAdminOrCeo || ['finance_manager', 'accountant', 'admin'].includes(userRole);
  const isRegionalHR = userRole === 'regional_hr_officer';

  const isHrSigned = Boolean(activeRun?.hrApprovedBy);
  const isFinanceSigned = Boolean(activeRun?.financeApprovedBy);
  const isDualApproved = isHrSigned && isFinanceSigned;
  const isDisbursed = activeRun?.status === 'disbursed';

  // Anti-Self-Approval
  const isCurrentUserHrSignatory =
    activeRun?.hrApprovedBy &&
    activeRun.hrApprovedBy.trim().toLowerCase() === userName.trim().toLowerCase();

  const isCurrentUserFinanceSignatory =
    activeRun?.financeApprovedBy &&
    activeRun.financeApprovedBy.trim().toLowerCase() === userName.trim().toLowerCase();

  // Handlers
  const handleInitiateRun = async () => {
    setIsActionLoading(true);
    try {
      const newRun = await payrollRunsService.create({
        period: currentMonthYear,
        countryCode: effectiveCountry,
        siteId: activeSite?.id,
        employeeCount: activeEmployees.length,
        currency: currencySymbol,
        totalGrossSalaries: totalSalaries,
        totalBonuses: totalBonuses,
        totalDeductions: 0,
        totalNetPayout: totalPayout,
        status: 'pending_verification',
        initiatedBy: userName,
        initiatedByRole: userRole
      });
      setActiveRun(newRun);
      addNotification('info', `Payroll run initiated for ${currentMonthYear}. Awaiting dual sign-off.`);
    } catch (err: any) {
      addNotification('alert', err.message || 'Failed to initiate run');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSignHR = async () => {
    if (!activeRun) return;
    setIsActionLoading(true);
    try {
      const updated = await payrollRunsService.signAsHR(
        activeRun.id,
        userName,
        user?.role || 'hr_manager',
        hrNotesInput || 'Headcount, attendance, and leave deductions verified.'
      );
      setActiveRun(updated);
      setHrNotesInput('');
      addNotification('success', 'HR verification certified. Awaiting Finance authorization.');
    } catch (err: any) {
      addNotification('alert', err.message || 'HR sign-off failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSignFinance = async () => {
    if (!activeRun) return;
    setIsActionLoading(true);
    try {
      const updated = await payrollRunsService.signAsFinance(
        activeRun.id,
        userName,
        user?.role || 'finance_manager',
        financeNotesInput || 'Bank liquidity and statutory tax withholdings verified.'
      );
      setActiveRun(updated);
      setFinanceNotesInput('');
      addNotification('success', 'Finance authorization completed.');
    } catch (err: any) {
      addNotification('alert', err.message || 'Finance sign-off failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDisburse = async () => {
    if (!activeRun) return;
    setIsActionLoading(true);
    try {
      await payrollRunsService.disburse(activeRun.id, userName);
      await processPayroll(activeSite?.id || 'SITE-0001', userName);
      addNotification('success', `Payroll disbursed: ${currencySymbol} ${totalPayout.toLocaleString()}`);
      setIsPayrollModalOpen(false);
    } catch (err: any) {
      addNotification('alert', err.message || 'Disbursement failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeRun || !rejectionReason.trim()) {
      addNotification('alert', 'Please provide a reason for requesting revisions.');
      return;
    }
    setIsActionLoading(true);
    try {
      const updated = await payrollRunsService.reject(
        activeRun.id,
        userName,
        userRole,
        rejectionReason
      );
      setActiveRun(updated);
      setIsRejecting(false);
      setRejectionReason('');
      addNotification('alert', `Payroll run flagged for revision: ${rejectionReason}`);
    } catch (err: any) {
      addNotification('alert', err.message || 'Rejection failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isPayrollModalOpen}
      onClose={() => setIsPayrollModalOpen(false)}
      title="Zero-Trust Payroll Authorization"
      size="md"
    >
      <div className="p-5 space-y-5 max-h-[85vh] overflow-y-auto">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                  4-Eyes Dual Control Sign-Off
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20">
                  {effectiveCountry} TENANT
                </span>
              </div>
              <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                Both HR and Finance sign-offs are strictly mandatory before funds disburse.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[var(--theme-text-secondary)] block font-medium">Payroll Cycle</span>
            <span className="text-xs font-semibold text-[var(--theme-text-primary)] font-mono">{currentMonthYear}</span>
          </div>
        </div>

        {/* Division of Responsibility Callout */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
              Division of Responsibility: HR & Payroll Governance
            </span>
            {isRegionalHR && (
              <span className="text-[10px] font-semibold text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/10 px-2 py-0.5 rounded-full border border-[#0071E3]/20">
                Regional Auditor
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px] text-[var(--theme-text-secondary)]">
            <div className="p-2 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
              <strong className="text-[var(--theme-text-primary)] block font-medium">1. Regional HR</strong>
              Audits site clock-ins, shift rosters, and approved leave deductions.
            </div>
            <div className="p-2 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
              <strong className="text-[var(--theme-text-primary)] block font-medium">2. HQ HR / Managing Director</strong>
              Performs sovereign country verification and certifies the payroll batch.
            </div>
            <div className="p-2 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
              <strong className="text-[var(--theme-text-primary)] block font-medium">3. Finance Division</strong>
              Authorizes statutory tax, bank liquidity, and dispatches disbursements.
            </div>
          </div>
          {isRegionalHR && (
            <p className="text-[11px] text-[#0071E3] dark:text-[#2997FF] font-medium pt-1">
              Notice: As a Regional HR Officer, your local site attendance and leave logs feed directly into this sovereign cycle. Final country-level certification is centralized at Country HQ / Managing Director.
            </p>
          )}
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-center">
            <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Active Staff</p>
            <p className="text-base font-bold text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">{activeEmployees.length}</p>
          </div>
          <div className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-center">
            <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Base Salary</p>
            <p className="text-base font-bold text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
              {currencySymbol} {totalSalaries.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold tracking-wider">Total Payout</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
              {currencySymbol} {totalPayout.toLocaleString()}
            </p>
          </div>
        </div>

        {/* If no run initiated yet */}
        {!activeRun && !isLoadingRun && (
          <div className="p-6 border border-dashed border-[var(--theme-border)] rounded-2xl bg-[var(--theme-bg-card)] text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] flex items-center justify-center mx-auto">
              <Briefcase size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                No Active Payroll Run for {currentMonthYear}
              </h4>
              <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                Initiate the batch to begin the cross-departmental verification pipeline.
              </p>
            </div>
            <button
              type="button"
              onClick={handleInitiateRun}
              disabled={isActionLoading || activeEmployees.length === 0}
              className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
            >
              {isActionLoading ? <Loader2 size={13} className="animate-spin" /> : <Briefcase size={14} />}
              Initialize {currentMonthYear} Batch
            </button>
          </div>
        )}

        {/* Active Run Dual Sign-off Cards */}
        {activeRun && (
          <div className="space-y-4">
            {/* Department 1: HR Certification */}
            <PayrollHrCard
              activeRun={activeRun}
              isHrSigned={isHrSigned}
              isHR={isHR}
              isCurrentUserFinanceSignatory={Boolean(isCurrentUserFinanceSignatory)}
              isSuperAdminOrCeo={isSuperAdminOrCeo}
              hrNotesInput={hrNotesInput}
              setHrNotesInput={setHrNotesInput}
              handleSignHR={handleSignHR}
              isActionLoading={isActionLoading}
            />

            {/* Department 2: Finance Authorization */}
            <PayrollFinanceCard
              activeRun={activeRun}
              isFinanceSigned={isFinanceSigned}
              isFinance={isFinance}
              isCurrentUserHrSignatory={Boolean(isCurrentUserHrSignatory)}
              isSuperAdminOrCeo={isSuperAdminOrCeo}
              financeNotesInput={financeNotesInput}
              setFinanceNotesInput={setFinanceNotesInput}
              handleSignFinance={handleSignFinance}
              isActionLoading={isActionLoading}
            />

            {/* Rejection / Request Revision Box */}
            {isRejecting ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2.5">
                <h5 className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Request Revision / Reject Batch
                </h5>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Specify the discrepancy or reason for revision..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] outline-none focus:ring-1 focus:ring-rose-500 transition-all resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isActionLoading || !rejectionReason.trim()}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              !isDisbursed && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="text-xs text-[var(--theme-text-secondary)] hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <XCircle size={14} /> Request Revision
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="pt-4 border-t border-[var(--theme-border)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsPayrollModalOpen(false)}
            className="px-4 py-2 text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
          >
            Close
          </button>

          {activeRun && !isDisbursed && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDisburse}
                disabled={!isDualApproved || isActionLoading}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
                  isDualApproved
                    ? 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm cursor-pointer'
                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] cursor-not-allowed opacity-60'
                }`}
                title={!isDualApproved ? 'Both HR and Finance must sign before disbursing' : 'Disburse payout'}
              >
                {isActionLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {isDualApproved ? 'Disburse Payout' : 'Awaiting Dual Sign-Off'}
              </button>
            </div>
          )}

          {isDisbursed && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Disbursed &amp; Reconciled
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PayrollModal;
