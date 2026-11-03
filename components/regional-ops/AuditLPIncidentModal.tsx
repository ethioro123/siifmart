import React, { useState } from 'react';
import {
  ShieldAlert, X, AlertTriangle, CheckCircle2, UserCheck,
  Building2, FileText, Send, ArrowRight
} from 'lucide-react';
import type { ShiftRecord, Employee } from '../../types';
import type { OverrideVelocityBreach } from '../../hooks/useRegionalOperationsData';
import { formatCompactNumber } from '../../utils/formatting';
import { tasksService } from '../../services/tasks.service';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { logger } from '../../utils/logger';

interface AuditLPIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  breach: OverrideVelocityBreach | null;
  regionCode: string;
  regionalShifts: ShiftRecord[];
  regionalEmployees: Employee[];
  currencySymbol: string;
  onAuditCompleted?: () => void;
}

export function AuditLPIncidentModal({
  isOpen,
  onClose,
  breach,
  regionCode,
  regionalShifts,
  regionalEmployees,
  currencySymbol,
  onAuditCompleted
}: AuditLPIncidentModalProps) {
  const { addNotification } = useData();
  const { user } = useStore();

  // Find candidate investigators in territory
  const candidateInvestigators = regionalEmployees.filter(e =>
    ['regional_security_manager', 'store_operations_auditor', 'regional_compliance_manager', 'regional_operations_manager', 'auditor'].includes(e.role || '')
  );

  const defaultInvestigator = candidateInvestigators[0]?.id || regionalEmployees[0]?.id || '';
  const [selectedInvestigatorId, setSelectedInvestigatorId] = useState(defaultInvestigator);
  const [priority, setPriority] = useState<'High' | 'Medium'>('High');
  const [investigationNotes, setInvestigationNotes] = useState(
    'Formal Loss Prevention inquiry triggered under SOP-MGT-020. Managerial override velocity exceeded 3.0% 24h ceiling. Audit shift reconciliation and till drawer logs.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !breach) return null;

  // Filter shifts for this site with variances or flags
  const siteFlaggedShifts = regionalShifts.filter(s =>
    s.siteId === breach.siteId && (
      (s.variance !== undefined && s.variance !== null && s.variance !== 0) ||
      s.status === 'Flagged' ||
      s.reconciliationStatus === 'Discrepancy_Flagged'
    )
  );

  const handleDispatchInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const assignedEmp = regionalEmployees.find(e => e.id === selectedInvestigatorId);
      await tasksService.create({
        title: `SOP-MGT-020 LP Audit: ${breach.siteName}`,
        description: `${investigationNotes} [Manager: ${breach.managerName}, Velocity: ${breach.velocityRate}%, Flagged Overrides: ${breach.totalOverrides}]. Immediate supervisory inspection required.`,
        assignedTo: selectedInvestigatorId || 'UNASSIGNED',
        priority,
        status: 'Pending',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        regionCode,
        siteId: breach.siteId,
        taskType: 'LP_INVESTIGATION',
        createdBy: user?.name || 'Regional Operations'
      });

      addNotification?.('success', `Loss Prevention investigation dispatched to ${assignedEmp?.name || 'Security Lead'}.`);
      onAuditCompleted?.();
      onClose();
    } catch (err: any) {
      logger.error('AuditLPIncidentModal', 'Failed to dispatch LP task', err);
      addNotification?.('alert', err.message || 'Failed to dispatch LP audit task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOffReview = () => {
    addNotification?.('success', `Supervisory review signed off for ${breach.siteName} under SOP-MGT-020.`);
    onAuditCompleted?.();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-[var(--theme-text-primary)]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--theme-border-subtle)] flex items-start justify-between gap-3 bg-[var(--theme-status-danger-bg)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="audit-modal-title" className="text-base font-bold text-[var(--theme-text-primary)]">
                  Loss Prevention Audit
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]">
                  SOP-MGT-020 Breach
                </span>
              </div>
              <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                {breach.siteName} &bull; Managerial Override Velocity Breach Review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Key Breach Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
              <span className="text-[10px] text-[var(--theme-text-secondary)] block">Override Velocity</span>
              <span className="text-lg font-bold font-mono text-[var(--theme-status-danger-text)] mt-1 block">
                {breach.velocityRate}%
              </span>
              <span className="text-[9px] text-[var(--theme-text-muted)]">Ceiling: &lt; 3.0%</span>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
              <span className="text-[10px] text-[var(--theme-text-secondary)] block">Flagged Overrides</span>
              <span className="text-lg font-bold font-mono text-[var(--theme-text-primary)] mt-1 block">
                {breach.totalOverrides}
              </span>
              <span className="text-[9px] text-[var(--theme-text-muted)]">24h audit window</span>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
              <span className="text-[10px] text-[var(--theme-text-secondary)] block">Transactions Base</span>
              <span className="text-lg font-bold font-mono text-[var(--theme-text-primary)] mt-1 block">
                {breach.totalTransactions}
              </span>
              <span className="text-[9px] text-[var(--theme-text-muted)]">Sales & Shifts</span>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
              <span className="text-[10px] text-[var(--theme-text-secondary)] block">Supervisor In Charge</span>
              <span className="text-xs font-bold text-[var(--theme-text-primary)] mt-1.5 block truncate">
                {breach.managerName}
              </span>
              <span className="text-[9px] text-[var(--theme-text-muted)]">Facility Manager</span>
            </div>
          </div>

          {/* Flagged Till & Shift Reconciliations */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--theme-status-warning-text)]" />
              <span>Flagged Till & Shift Overrides ({siteFlaggedShifts.length})</span>
            </h3>

            {siteFlaggedShifts.length === 0 ? (
              <p className="text-xs text-[var(--theme-text-muted)] p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                Velocity breach calculated based on managerial override audit telemetry. No individual till cash shortages recorded.
              </p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {siteFlaggedShifts.map(s => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[var(--theme-text-primary)]">
                        Shift #{s.shiftNumber || s.id.slice(0, 8)}
                      </span>
                      <span className="text-[11px] text-[var(--theme-text-secondary)] ml-2">
                        Cashier: {s.cashierName || 'Cashier'} &bull; {s.discrepancyReason || 'Supervisory override flagged'}
                      </span>
                    </div>
                    {s.variance !== undefined && (
                      <span className="font-mono font-bold text-[var(--theme-status-danger-text)]">
                        {formatCompactNumber(s.variance, { currency: currencySymbol })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dispatch LP Action Form */}
          <form onSubmit={handleDispatchInvestigation} className="p-4 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
              <span>Initiate Formal LP Investigation Task</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] block mb-1">
                  Assign Lead Investigator
                </label>
                <select
                  value={selectedInvestigatorId}
                  onChange={(e) => setSelectedInvestigatorId(e.target.value)}
                  className="w-full min-h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                >
                  {candidateInvestigators.length > 0 ? (
                    candidateInvestigators.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role?.replace(/_/g, ' ')})
                      </option>
                    ))
                  ) : (
                    regionalEmployees.slice(0, 5).map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role?.replace(/_/g, ' ')})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] block mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'High' | 'Medium')}
                  className="w-full min-h-10 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                >
                  <option value="High">High (48-Hour Resolution)</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] block mb-1">
                Audit Terms & Instructions
              </label>
              <textarea
                rows={2}
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSignOffReview}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--theme-status-success-text)]" />
                <span>Supervisory Sign-Off Only</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-10 px-5 py-2.5 rounded-xl bg-[var(--theme-status-danger-bg)] hover:bg-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-[var(--theme-status-danger-border)] shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Dispatching...' : 'Dispatch LP Investigation'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
