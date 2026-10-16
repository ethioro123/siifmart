import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, AlertTriangle, ShieldAlert,
  ArrowUpRight, Clock, ShieldCheck, DollarSign, Receipt
} from 'lucide-react';
import type { PurchaseOrder, Region, ExpenseRecord } from '../../types';
import { formatCompactNumber } from '../../utils/formatting';
import { formatPONumber } from '../../utils/jobIdFormatter';
import { usePurchaseOrderMutations } from '../../hooks/usePurchaseOrderMutations';
import { expensesService } from '../../services/expenses.service';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { logger } from '../../utils/logger';

interface RegionalProcurementDeskProps {
  currentRegion: Region | null;
  pendingAutonomousPOs: PurchaseOrder[];
  pendingEscalatedPOs: PurchaseOrder[];
  monthlySpent: number;
  monthlyBudget: number;
  budgetPercent: number;
  isOverBudget: boolean;
  isNearCap: boolean;
  autonomousLimit: number;
  currencySymbol: string;
}

export const RegionalProcurementDesk: React.FC<RegionalProcurementDeskProps> = ({
  currentRegion,
  pendingAutonomousPOs,
  pendingEscalatedPOs,
  monthlySpent,
  monthlyBudget,
  budgetPercent,
  isOverBudget,
  isNearCap,
  autonomousLimit,
  currencySymbol
}) => {
  const { user } = useStore();
  const { addNotification, sites } = useData();
  const { approvePOMutation } = usePurchaseOrderMutations();
  const [activeTab, setActiveTab] = useState<'autonomous' | 'escalated' | 'expenses'>('autonomous');
  const [pendingExpenses, setPendingExpenses] = useState<ExpenseRecord[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const AUTONOMOUS_EXPENSE_LIMIT = 25_000;

  useEffect(() => {
    let isMounted = true;
    const fetchExpenses = async () => {
      setLoadingExpenses(true);
      try {
        const countryCode = currentRegion?.country === 'Ethiopia' || currentRegion?.country === 'ET' ? 'ET' : 'KE';
        const res = await expensesService.getAll(undefined, 50, 0, {
          countryCode,
          status: 'Pending'
        });
        if (isMounted) {
          const regionalSiteIds = new Set(
            sites
              .filter(s => s.region_code === currentRegion?.code || (s as any).regionCode === currentRegion?.code)
              .map(s => s.id)
          );
          const filtered = (res.data || []).filter(e => regionalSiteIds.has(e.siteId));
          setPendingExpenses(filtered);
        }
      } catch (err) {
        logger.error('RegionalProcurementDesk', 'Failed to load regional expenses', err);
      } finally {
        if (isMounted) setLoadingExpenses(false);
      }
    };
    fetchExpenses();
    return () => { isMounted = false; };
  }, [currentRegion, sites]);

  const handleApproveExpense = async (expense: ExpenseRecord) => {
    if (!user) return;
    try {
      await expensesService.approve(expense.id, {
        id: user.id,
        name: user.name || 'Regional Finance Officer',
        role: user.role || 'regional_finance_officer'
      });
      setPendingExpenses(prev => prev.filter(e => e.id !== expense.id));
      addNotification?.('success', `Petty cash request of ${formatCompactNumber(expense.amount, { currency: currencySymbol })} approved autonomously.`);
    } catch (err: any) {
      logger.error('RegionalProcurementDesk', 'Failed to approve expense', err);
      addNotification?.('alert', err.message || 'Approval failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & SOP Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
            Autonomous Procurement Desk (SOP-MGT-020)
          </h3>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Regional authority up to {formatCompactNumber(autonomousLimit, { currency: currencySymbol })} per PO. POs exceeding threshold require Central HQ approval.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
          <button
            type="button"
            onClick={() => setActiveTab('autonomous')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'autonomous'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            Autonomous Sign-Off ({pendingAutonomousPOs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('escalated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'escalated'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            HQ Escalated ({pendingEscalatedPOs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'expenses'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            Store Petty Cash ({pendingExpenses.length})
          </button>
        </div>
      </div>

      {/* Monthly Budget Guardrail Card */}
      <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[var(--theme-accent)]" />
            <span className="font-semibold text-[var(--theme-text-primary)]">
              Regional Procurement Budget Ceiling
            </span>
          </div>
          <span className="font-mono font-bold text-[var(--theme-text-primary)]">
            {formatCompactNumber(monthlySpent, { currency: currencySymbol })}
            {monthlyBudget > 0 && (
              <span className="text-[var(--theme-text-secondary)] font-normal">
                {' '}/ {formatCompactNumber(monthlyBudget, { currency: currencySymbol })} ({budgetPercent}%)
              </span>
            )}
          </span>
        </div>

        {monthlyBudget > 0 ? (
          <div className="w-full bg-[var(--theme-border)] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget
                  ? 'bg-rose-500'
                  : isNearCap
                    ? 'bg-amber-500'
                    : 'bg-[var(--theme-accent)]'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        ) : (
          <p className="text-[11px] text-[var(--theme-text-secondary)]">
            Dynamic monthly procurement ceiling currently active.
          </p>
        )}

        {/* Warning Banner if Near or Over Budget */}
        {isOverBudget && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              <strong>Budget Exceeded:</strong> Regional monthly procurement ceiling has been surpassed. All new purchase orders are automatically routed to HQ Central Operations.
            </span>
          </div>
        )}

        {isNearCap && !isOverBudget && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Budget Alert:</strong> Territory spend has reached {budgetPercent}% of monthly ceiling. Exercise caution on non-critical replenishment.
            </span>
          </div>
        )}
      </div>

      {/* PO Lists */}
      {activeTab === 'autonomous' ? (
        pendingAutonomousPOs.length === 0 ? (
          <div className="p-8 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-3" />
            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
              No Pending Autonomous POs
            </h4>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
              All purchase orders within the autonomous limit of {formatCompactNumber(autonomousLimit, { currency: currencySymbol })} are fully approved.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingAutonomousPOs.map(po => (
              <div
                key={po.id}
                className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                      {formatPONumber(po)}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      SOP-MGT-020 Autonomous
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-1">
                    <span className="font-medium text-[var(--theme-text-primary)]">{po.supplierName}</span>
                    <span>•</span>
                    <span>{po.itemsCount || po.lineItems?.length || 0} line items</span>
                    <span>•</span>
                    <span>Created {po.date || po.createdAt?.split('T')[0]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <span className="font-mono font-bold text-sm text-[var(--theme-text-primary)]">
                    {formatCompactNumber(po.totalAmount, { currency: currencySymbol })}
                  </span>
                  <button
                    type="button"
                    onClick={() => approvePOMutation.mutate(po)}
                    disabled={approvePOMutation.isPending}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve PO</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'escalated' ? (
        pendingEscalatedPOs.length === 0 ? (
          <div className="p-8 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-3" />
            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
              No Escalated POs
            </h4>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
              No purchase orders currently require corporate HQ sign-off.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingEscalatedPOs.map(po => (
              <div
                key={po.id}
                className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 opacity-90"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                      {formatPONumber(po)}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Escalated to HQ
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-1">
                    <span className="font-medium text-[var(--theme-text-primary)]">{po.supplierName}</span>
                    <span>•</span>
                    <span className="text-rose-500">
                      Exceeds {formatCompactNumber(autonomousLimit, { currency: currencySymbol })} limit
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <span className="font-mono font-bold text-sm text-[var(--theme-text-primary)]">
                    {formatCompactNumber(po.totalAmount, { currency: currencySymbol })}
                  </span>
                  <span className="text-xs text-[var(--theme-text-secondary)] flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Pending CEO / Operations Review
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Store Petty Cash & Expenses Tab */
        loadingExpenses ? (
          <div className="p-8 text-center text-xs text-[var(--theme-text-secondary)] animate-pulse">
            Loading store petty cash requests...
          </div>
        ) : pendingExpenses.length === 0 ? (
          <div className="p-8 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-3" />
            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
              No Pending Petty Cash Requests
            </h4>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
              All regional store maintenance and emergency expense drafts have been settled.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingExpenses.map(expense => {
              const site = sites.find(s => s.id === expense.siteId);
              const isAutonomous = expense.amount <= AUTONOMOUS_EXPENSE_LIMIT;

              return (
                <div
                  key={expense.id}
                  className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        {expense.description || `${expense.category} Expense`}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                        isAutonomous
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      }`}>
                        {isAutonomous ? 'Local Sign-Off' : 'Treasury Escalate'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-1">
                      <span className="font-medium text-[var(--theme-text-primary)]">{site?.name || 'Local Facility'}</span>
                      <span>•</span>
                      <span>{expense.category}</span>
                      <span>•</span>
                      <span>Requested by {expense.createdByName || 'Store Manager'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-[var(--theme-text-primary)]">
                        {formatCompactNumber(expense.amount, { currency: currencySymbol })}
                      </span>
                      <p className="text-[10px] text-[var(--theme-text-secondary)]">Store Expense</p>
                    </div>

                    {isAutonomous ? (
                      <button
                        type="button"
                        onClick={() => handleApproveExpense(expense)}
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize Petty Cash</span>
                      </button>
                    ) : (
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Exceeds 25K Limit
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
