import React, { useState } from 'react';
import { X, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import type { Site, UserRole } from '../../types';
import { headcountQuotaService, LEVEL_4_FRONTLINE_ROLES } from '../../services/headcountQuota.service';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { formatRole } from '../../utils/formatting';

interface RequestQuotaAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionalSites: Site[];
  regionCode: string;
  onSuccess?: () => void;
}

export const RequestQuotaAdjustmentModal: React.FC<RequestQuotaAdjustmentModalProps> = ({
  isOpen,
  onClose,
  regionalSites,
  regionCode,
  onSuccess
}) => {
  const { user } = useStore();
  const { addNotification, effectiveCountry } = useData();

  const [siteId, setSiteId] = useState(regionalSites[0]?.id || '');
  const [role, setRole] = useState<UserRole>('cashier');
  const [currentQuota, setCurrentQuota] = useState(5);
  const [requestedQuota, setRequestedQuota] = useState(8);
  const [requestType, setRequestType] = useState<'TEMPORARY_SURGE' | 'PERMANENT_EXPANSION'>('TEMPORARY_SURGE');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedSite = regionalSites.find(s => s.id === siteId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addNotification?.('alert', 'Please provide a business justification for this quota request.');
      return;
    }
    if (requestedQuota <= currentQuota) {
      addNotification?.('alert', 'Requested quota must exceed current approved quota.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await headcountQuotaService.submitQuotaRequest({
        siteId,
        siteName: selectedSite?.name || 'Local Facility',
        regionCode,
        countryCode: effectiveCountry || 'ET',
        role,
        currentQuota,
        requestedQuota,
        increaseAmount: requestedQuota - currentQuota,
        requestType,
        reason: reason.trim(),
        requestedBy: user?.name || 'Regional Operations Manager',
        requestedByRole: user?.role || 'regional_operations_manager'
      });

      if (result) {
        addNotification?.('success', `Headcount quota request (+${requestedQuota - currentQuota} ${formatRole(role)}) submitted to Corporate HQ.`);
        onSuccess?.();
        onClose();
      } else {
        addNotification?.('alert', 'Failed to submit quota adjustment request.');
      }
    } catch {
      addNotification?.('alert', 'Error submitting quota request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-xs animate-in fade-in">
      <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-status-info-border)] flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">Request Headcount Quota Surge</h3>
              <p className="text-xs text-[var(--theme-text-secondary)]">Submit staffing ceiling adjustment to Corporate HQ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1 block">Facility / Branch</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] transition-colors"
              >
                {regionalSites.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1 block">Frontline Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] transition-colors"
              >
                {LEVEL_4_FRONTLINE_ROLES.map(r => (
                  <option key={r} value={r}>{formatRole(r)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1 block">Current Quota</label>
              <input
                type="number"
                value={currentQuota}
                onChange={(e) => setCurrentQuota(Number(e.target.value))}
                min={1}
                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1 block">Requested Quota</label>
              <input
                type="number"
                value={requestedQuota}
                onChange={(e) => setRequestedQuota(Number(e.target.value))}
                min={currentQuota + 1}
                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1 block">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRequestType('TEMPORARY_SURGE')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  requestType === 'TEMPORARY_SURGE'
                    ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border-[var(--theme-status-info-border)]'
                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                }`}
              >
                Temporary Peak Surge
              </button>
              <button
                type="button"
                onClick={() => setRequestType('PERMANENT_EXPANSION')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  requestType === 'PERMANENT_EXPANSION'
                    ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border-[var(--theme-border-accent)]'
                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                }`}
              >
                Permanent Store Expansion
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1 block">Business Rationale</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Foot traffic surge during evening rush; queue wait time exceeded corporate standard. Sales revenue up 22%."
              rows={3}
              className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-xs text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)] transition-colors placeholder:text-[var(--theme-text-secondary)]/60"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-95 text-[var(--theme-text-primary)] text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>Submit to Corporate HQ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
