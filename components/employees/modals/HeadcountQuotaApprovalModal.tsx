import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, TrendingUp, Clock, AlertCircle, Building2, Loader2, Sparkles } from 'lucide-react';
import Modal from '../../Modal';
import type { HeadcountQuotaRequest } from '../../../types/employee';
import { headcountQuotaService } from '../../../services/headcountQuota.service';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { formatRole } from '../../../utils/formatting';

interface HeadcountQuotaApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestsUpdated?: () => void;
}

export const HeadcountQuotaApprovalModal: React.FC<HeadcountQuotaApprovalModalProps> = ({
  isOpen,
  onClose,
  onRequestsUpdated
}) => {
  const { user } = useStore();
  const { effectiveCountry, addNotification } = useData();

  const [requests, setRequests] = useState<HeadcountQuotaRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const canApprove = [
    'CEO', 'ceo', 'super_admin', 'admin', 'hr_manager', 'operations_manager', 'regional_manager'
  ].includes(user?.role || '');

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await headcountQuotaService.getQuotaRequests(effectiveCountry || 'ET');
      setRequests(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, effectiveCountry]);

  const handleApprove = async (req: HeadcountQuotaRequest) => {
    setActionId(req.id);
    try {
      const success = await headcountQuotaService.reviewQuotaRequest(
        req.id,
        'APPROVED',
        user?.name || 'Corporate Executive',
        'Authorized by Corporate HQ executive operations desk.'
      );

      if (success) {
        setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED' } : r));
        addNotification?.('success', `Approved +${req.increaseAmount} ${formatRole(req.role)} slots for ${req.siteName || req.siteId}.`);
        onRequestsUpdated?.();
      } else {
        addNotification?.('alert', 'Failed to approve quota request.');
      }
    } catch (err: any) {
      addNotification?.('alert', err.message || 'Approval failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (req: HeadcountQuotaRequest) => {
    if (!rejectionReason.trim()) {
      addNotification?.('alert', 'Please provide a justification for declining this request.');
      return;
    }
    setActionId(req.id);
    try {
      const success = await headcountQuotaService.reviewQuotaRequest(
        req.id,
        'REJECTED',
        user?.name || 'Corporate Executive',
        rejectionReason.trim()
      );

      if (success) {
        setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'REJECTED', reviewNotes: rejectionReason.trim() } : r));
        setRejectionModalId(null);
        setRejectionReason('');
        addNotification?.('info', `Declined headcount quota request for ${req.siteName || req.siteId}.`);
        onRequestsUpdated?.();
      } else {
        addNotification?.('alert', 'Failed to decline request.');
      }
    } catch (err: any) {
      addNotification?.('alert', err.message || 'Rejection failed');
    } finally {
      setActionId(null);
    }
  };

  const filteredRequests = requests.filter(r => r.status === filterStatus);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Headcount Quota Governance & Capacity Authorization" size="xl">
      <div className="space-y-5 p-2">
        {/* Header Summary */}
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--theme-text-primary)]">
                Corporate Headcount Ceiling Authority ({effectiveCountry || 'ET'})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] border border-blue-500/20">
                HQ Tier Governance
              </span>
            </div>
            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
              Review and authorize facility staffing ceiling adjustments requested by regional administration offices.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-1 shrink-0">
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === status
                    ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                {status === 'PENDING' ? 'Pending' : status === 'APPROVED' ? 'Approved' : 'Declined'}
              </button>
            ))}
          </div>
        </div>

        {/* Request List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--theme-accent)]" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 opacity-60 mb-2" />
            No {filterStatus.toLowerCase()} headcount quota requests recorded for this country.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredRequests.map(req => {
              const isActioning = actionId === req.id;
              const isRejecting = rejectionModalId === req.id;

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[var(--theme-text-primary)]">
                        {formatRole(req.role)}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                        {req.siteName || req.siteId}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Region: {req.regionCode}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {req.requestType === 'TEMPORARY_SURGE' ? 'Temporary Surge' : 'Permanent Expansion'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {req.currentQuota} &rarr; {req.requestedQuota} (+{req.increaseAmount} Slots)
                      </span>
                    </div>
                  </div>

                  {/* Justification Box */}
                  <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]/60 text-xs space-y-1">
                    <p className="font-medium text-[var(--theme-text-secondary)]">
                      Operational Justification:
                    </p>
                    <p className="text-[var(--theme-text-primary)]">
                      &ldquo;{req.reason}&rdquo;
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[var(--theme-text-secondary)] pt-1">
                    <span>
                      Requested by <strong className="text-[var(--theme-text-primary)]">{req.requestedBy}</strong> ({req.requestedByRole})
                      {req.requestedAt && ` on ${new Date(req.requestedAt).toLocaleDateString()}`}
                    </span>

                    {req.status === 'PENDING' && canApprove && (
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {isRejecting ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Reason for declining..."
                              className="px-2.5 py-1 text-xs rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)]"
                            />
                            <button
                              type="button"
                              onClick={() => handleReject(req)}
                              disabled={isActioning}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectionModalId(null)}
                              className="px-2 py-1 rounded-lg text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setRejectionModalId(req.id)}
                              disabled={isActioning}
                              className="px-3 py-1.5 rounded-lg border border-[var(--theme-border)] hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-xs transition-colors"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              disabled={isActioning}
                              className="px-3.5 py-1.5 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                            >
                              {isActioning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Authorize Capacity Expansion</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {req.status !== 'PENDING' && (
                      <span className="font-semibold text-xs">
                        {req.status === 'APPROVED' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Approved by {req.reviewedBy || 'Corporate HQ'}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400">
                            Declined: {req.reviewNotes || 'Corporate policy restriction'}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
