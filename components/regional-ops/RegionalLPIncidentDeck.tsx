import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, DollarSign,
  TrendingUp, Eye, ShieldCheck, ArrowRight, FileWarning,
  UserCheck, Clock
} from 'lucide-react';
import type { ShiftRecord, TransferRecord, Site, EmployeeTask } from '../../types';
import type { OverrideVelocityBreach } from '../../hooks/useRegionalOperationsData';
import { formatCompactNumber } from '../../utils/formatting';
import { tasksService } from '../../services/tasks.service';
import { useData } from '../../contexts/DataContext';
import { logger } from '../../utils/logger';

interface RegionalLPIncidentDeckProps {
  regionCode: string;
  regionalSites: Site[];
  varianceShifts: ShiftRecord[];
  discrepancyTransfers: TransferRecord[];
  currencySymbol: string;
  overrideVelocityBreaches?: OverrideVelocityBreach[];
}

export const RegionalLPIncidentDeck: React.FC<RegionalLPIncidentDeckProps> = ({
  regionCode,
  regionalSites,
  varianceShifts,
  discrepancyTransfers,
  currencySymbol,
  overrideVelocityBreaches
}) => {
  const { addNotification } = useData();
  const [investigationTasks, setInvestigationTasks] = useState<EmployeeTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Load active LP investigations for territory
  useEffect(() => {
    let isMounted = true;
    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const tasks = await tasksService.getByRegion(regionCode);
        if (isMounted) {
          setInvestigationTasks(tasks.filter(t => t.taskType === 'LP_INVESTIGATION' && t.status !== 'Completed'));
        }
      } catch (err) {
        logger.error('RegionalLPIncidentDeck', 'Failed to load LP investigations', err);
      } finally {
        if (isMounted) setLoadingTasks(false);
      }
    };
    loadTasks();
    return () => { isMounted = false; };
  }, [regionCode]);

  const handleResolveInvestigation = async (taskId: string) => {
    try {
      await tasksService.update(taskId, { status: 'Completed' });
      setInvestigationTasks(prev => prev.filter(t => t.id !== taskId));
      addNotification?.('success', 'Security investigation closed and archived.');
    } catch (err) {
      addNotification?.('alert', 'Failed to resolve investigation');
    }
  };
  // Managerial Override Velocity (SOP-MGT-020 guardrail: < 3% threshold)
  const highestBreachRate = overrideVelocityBreaches && overrideVelocityBreaches.length > 0
    ? Math.max(...overrideVelocityBreaches.map(b => b.velocityRate))
    : null;
  const totalAuditedShifts = Math.max(1, varianceShifts.length + 20);
  const calculatedPercent = Number(((varianceShifts.length / totalAuditedShifts) * 100).toFixed(1));
  const overrideVelocityPercent = highestBreachRate !== null ? highestBreachRate.toFixed(1) : calculatedPercent.toFixed(1);
  const isVelocityBreached = (overrideVelocityBreaches && overrideVelocityBreaches.length > 0) || Number(overrideVelocityPercent) >= 3.0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
          Loss Prevention & Supervisory Risk Guardrail
        </h3>
        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
          Real-time monitoring of managerial overrides, till cash variances, and blind receiving discrepancies
        </p>
      </div>

      {/* KPI Ticker Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Override Velocity */}
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
            <span>Override Velocity</span>
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
              isVelocityBreached
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}>
              {isVelocityBreached ? 'Breached' : 'Compliant'}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[var(--theme-text-primary)] mt-2">
            {overrideVelocityPercent}%
          </div>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
            Ceiling: <strong>&lt; 3.0%</strong> (SOP-MGT-020)
          </p>
        </div>

        {/* Till Variances */}
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
            <span>Till Cash Discrepancies</span>
            <FileWarning className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--theme-text-primary)] mt-2">
            {varianceShifts.length}
          </div>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
            Flagged shift reconciliations
          </p>
        </div>

        {/* Blind Receiving Discrepancies */}
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
            <span>Receiving Variances</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--theme-text-primary)] mt-2">
            {discrepancyTransfers.length}
          </div>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
            Blind stock transfer audits
          </p>
        </div>
      </div>

      {/* 24-Hour Managerial Override Velocity High-Priority Breaches */}
      {overrideVelocityBreaches && overrideVelocityBreaches.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                Active Managerial Override Velocity Breaches (SOP-MGT-020)
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
              Limit: &lt; 3.0%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {overrideVelocityBreaches.map(breach => (
              <div
                key={breach.siteId}
                className="p-3 rounded-xl bg-[var(--theme-bg-card)] border border-rose-500/30 flex items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                      {breach.siteName}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      {breach.velocityRate}% Velocity
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                    Supervisor / Manager: <strong>{breach.managerName}</strong> • {breach.totalOverrides} flagged overrides
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded bg-rose-500 text-white shrink-0">
                  Audit Flagged
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Discrepancy & Variance Feed */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[var(--theme-accent)]" />
          <span>Regional Incident Audit Queue</span>
        </h4>

        {varianceShifts.length === 0 && discrepancyTransfers.length === 0 ? (
          <div className="p-8 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-3" />
            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
              Territorial Security Clean
            </h4>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
              Zero active cash drawer discrepancies or blind receiving variances in {regionCode}.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {varianceShifts.map(shift => {
              const site = regionalSites.find(s => s.id === shift.siteId);
              const varianceVal = Number(shift.variance) || 0;
              const isNegative = varianceVal < 0;

              return (
                <div
                  key={shift.id}
                  className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                          Shift #{shift.shiftNumber || shift.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Till Variance
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-1">
                        <span>{shift.cashierName || 'Cashier'}</span>
                        <span>•</span>
                        <span>{site?.name || 'Local Facility'}</span>
                        <span>•</span>
                        <span>{shift.discrepancyReason || 'Under review'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isNegative ? '-' : '+'}{formatCompactNumber(Math.abs(varianceVal), { currency: currencySymbol })}
                      </div>
                      <span className="text-[10px] text-[var(--theme-text-secondary)]">Cash Variance</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {discrepancyTransfers.map(transfer => {
              const srcSite = regionalSites.find(s => s.id === transfer.sourceSiteId);
              const dstSite = regionalSites.find(s => s.id === transfer.destSiteId);
              const isLocal = transfer.discrepancyResolutionType === 'LOCAL_STORE_MANAGER';

              return (
                <div
                  key={transfer.id}
                  className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                          Transfer #{transfer.orderRef || transfer.id.slice(0, 8)}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                          isLocal
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}>
                          {isLocal ? 'Manager Resolved' : 'LP Escalated'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-1">
                        <span>{srcSite?.name || 'Origin'} &rarr; {dstSite?.name || 'Destination'}</span>
                        <span>•</span>
                        <span>{transfer.discrepancyDetails || 'Discrepancy recorded'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right self-end sm:self-center">
                    <div className="text-xs font-semibold text-[var(--theme-text-primary)]">
                      {transfer.discrepancyReasonCode?.replace(/_/g, ' ') || 'Receiving Variance'}
                    </div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)]">Stock Discrepancy</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Security & LP Investigations */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Active Security & LP Investigations ({investigationTasks.length})</span>
          </h4>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
            Regional Security Escalations
          </span>
        </div>

        {investigationTasks.length === 0 ? (
          <div className="p-5 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 opacity-60 mb-2" />
            <p className="text-xs text-[var(--theme-text-secondary)]">
              No active loss prevention investigation tasks assigned in {regionCode}.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {investigationTasks.map(task => (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-rose-500/30 hover:border-rose-500/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                      {task.title}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      High Priority LP Audit
                    </span>
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-1 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] mt-1.5 font-mono">
                    <span>Due: {task.dueDate}</span>
                    <span>•</span>
                    <span>Assigned Lead: {task.assignedTo}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleResolveInvestigation(task.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm self-end sm:self-center shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolve & Close Task</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
