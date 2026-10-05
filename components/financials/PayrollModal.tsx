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
      // Handled
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
  const isHR = isSuperAdminOrCeo || ['hr', 'hr_manager'].includes(userRole);
  const isFinance = isSuperAdminOrCeo || ['finance_manager', 'accountant'].includes(userRole);

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
      <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between p-4 bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-xl shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1E3F27] dark:text-white">4-Eyes Dual Control</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2C5E3B]/30 text-[#A9CBA2]">
                  {effectiveCountry} TENANT
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-gray-400">
                Both HR and Finance sign-offs are strictly mandatory before funds disburse.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-500 dark:text-gray-400 block font-medium">Payroll Cycle</span>
            <span className="text-sm font-bold text-[#1E3F27] dark:text-white font-mono">{currentMonthYear}</span>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 bg-stone-100/80 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/5 rounded-xl text-center">
            <p className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider">Active Staff</p>
            <p className="text-lg font-bold text-[#1E3F27] dark:text-white font-mono mt-1">{activeEmployees.length}</p>
          </div>
          <div className="p-3.5 bg-stone-100/80 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/5 rounded-xl text-center">
            <p className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider">Base Salary</p>
            <p className="text-lg font-bold text-[#1E3F27] dark:text-white font-mono mt-1">
              {currencySymbol} {totalSalaries.toLocaleString()}
            </p>
          </div>
          <div className="p-3.5 bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 rounded-xl text-center">
            <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold tracking-wider">Total Payout</p>
            <p className="text-lg font-bold text-[#2C5E3B] dark:text-[#A9CBA2] font-mono mt-1">
              {currencySymbol} {totalPayout.toLocaleString()}
            </p>
          </div>
        </div>

        {/* If no run initiated yet */}
        {!activeRun && !isLoadingRun && (
          <div className="p-5 border border-dashed border-[#E2DCCE] dark:border-white/10 rounded-2xl bg-stone-50 dark:bg-white/5 text-center space-y-3">
            <Briefcase size={36} className="mx-auto text-stone-400 dark:text-gray-400" />
            <div>
              <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white">No Active Payroll Run for {currentMonthYear}</h4>
              <p className="text-xs text-stone-500 dark:text-gray-400 mt-1">
                Initiate the batch to begin the cross-departmental verification pipeline.
              </p>
            </div>
            <button
              onClick={handleInitiateRun}
              disabled={isActionLoading || activeEmployees.length === 0}
              className="px-5 py-2.5 woody-btn-primary font-bold rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Briefcase size={14} />}
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
              <div className="p-4 bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-500/30 rounded-2xl space-y-2">
                <h5 className="text-xs font-bold text-rose-700 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Request Revision / Reject Batch
                </h5>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Specify the discrepancy or reason for revision..."
                  rows={2}
                  className="woody-input"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1 text-xs text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isActionLoading || !rejectionReason.trim()}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
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
                    className="text-xs text-stone-500 hover:text-rose-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <XCircle size={14} /> Request Revision
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="pt-4 border-t border-[#E2DCCE] dark:border-white/5 flex items-center justify-between gap-3">
          <button
            onClick={() => setIsPayrollModalOpen(false)}
            className="px-4 py-2 text-xs font-bold text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors"
          >
            Close
          </button>

          {activeRun && !isDisbursed && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDisburse}
                disabled={!isDualApproved || isActionLoading}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                  isDualApproved
                    ? 'woody-btn-primary shadow-lg cursor-pointer'
                    : 'bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-gray-500 border border-[#E2DCCE] dark:border-white/5 cursor-not-allowed'
                }`}
                title={!isDualApproved ? 'Both HR and Finance must sign before disbursing' : 'Disburse payout'}
              >
                {isActionLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {isDualApproved ? 'Disburse Payout' : 'Awaiting Dual Sign-Off'}
              </button>
            </div>
          )}

          {isDisbursed && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Disbursed &amp; Reconciled
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PayrollModal;
