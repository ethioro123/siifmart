import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';
import { useMerchandisingCampaigns } from '../../hooks/useMerchandisingCampaigns';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { logger } from '../../utils/logger';
import { CampaignRejectModal } from './CampaignRejectModal';
import type { CampaignProposal } from '../../services/merchandising-campaigns.service';

const APPROVERS = new Set([
  'group_ceo',
  'super_admin',
  'ceo',
  'country_commercial_director',
  'regional_merchandising_manager',
  'regional_merchandising_lead',
  'merchandising_manager',
  'head_of_merchandising',
  'merchandising_head'
]);

type StatusTab = 'all' | 'pending' | 'approved' | 'rejected';

export const PromosTab: React.FC = () => {
  const { activeCountry, setIsPromoModalOpen, currencySymbol } = useMerchandising();
  const { user } = useStore();
  const { addNotification, activeRegionCode } = useData();

  const [statusFilter, setStatusFilter] = useState<StatusTab>('pending');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rejectModalProposal, setRejectModalProposal] = useState<CampaignProposal | null>(null);

  const {
    proposals = [],
    totalCount = 0,
    pageSize = 25,
    isLoading,
    error,
    approve,
    reject
  } = useMerchandisingCampaigns({
    countryCode: activeCountry,
    regionCode: activeRegionCode || undefined,
    status: statusFilter,
    page: currentPage,
    pageSize: 25
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const userRole = (user?.role || '').toLowerCase();
  const isApprover = APPROVERS.has(userRole);

  const handleApprove = async (proposal: CampaignProposal) => {
    try {
      await approve.mutateAsync(proposal.id);
      addNotification('success', `Campaign plan ${proposal.code} approved. POS discount activation is separate.`);
    } catch (cause) {
      logger.error('PromosTab', 'Campaign approval failed', cause as Error);
      addNotification('alert', `Approval failed: ${(cause as Error).message}`);
    }
  };

  const handleConfirmReject = async (id: string, reason: string) => {
    try {
      await reject.mutateAsync({ id, reason });
      addNotification('success', 'Campaign proposal rejected with logged audit reason.');
    } catch (cause) {
      logger.error('PromosTab', 'Campaign rejection failed', cause as Error);
      addNotification('alert', `Rejection failed: ${(cause as Error).message}`);
    }
  };

  return (
    <section className="space-y-5" aria-label="Campaign proposals">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[var(--theme-text-primary)]">Campaign Plans & Governance</h3>
            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
              {activeCountry} {activeRegionCode ? `· ${activeRegionCode}` : '· National'}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
            Approval records the campaign plan in merchandising governance. POS promotional discount activation remains a separate release.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPromoModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
        >
          <Plus size={15} /> Propose Campaign
        </button>
      </div>

      {/* Filter Tabs & Pagination Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-3">
        <div className="flex items-center gap-1.5">
          {(['pending', 'approved', 'rejected', 'all'] as StatusTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setStatusFilter(tab);
                setCurrentPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                  : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              {tab === 'all' ? 'All Plans' : tab === 'pending' ? 'Review Queue' : `${tab} Plans`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
          <span>Showing {proposals.length} of {totalCount} records</span>
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-[11px] px-1 font-semibold">{currentPage} / {totalPages}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content State */}
      {isLoading && (
        <p className="p-8 text-center text-sm text-[var(--theme-text-secondary)]">Loading campaign plans…</p>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-xs text-rose-500">
          Could not load campaign plans: {(error as Error).message}
        </div>
      )}
      {!isLoading && !error && proposals.length === 0 && (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-8 text-center text-xs text-[var(--theme-text-secondary)]">
          No {statusFilter !== 'all' ? statusFilter : ''} campaign plans found for {activeCountry}.
        </div>
      )}

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {proposals.map((proposal) => {
          const isPending = proposal.status === 'pending';
          const isApproved = proposal.status === 'approved';
          const isRejected = proposal.status === 'rejected';
          const canDecide = isPending && isApprover && proposal.requested_by_employee_id !== user?.id;

          return (
            <article
              key={proposal.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="space-y-3">
                {/* Header: Code & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-mono text-sm font-bold tracking-tight text-[var(--theme-text-primary)]">
                      {proposal.code}
                    </h4>
                    <span className="mt-0.5 block text-[10px] text-[var(--theme-text-muted)]">
                      Scope: {proposal.country_code} {proposal.region_code ? `· Reg: ${proposal.region_code}` : '· National'}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isApproved
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : isRejected
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isApproved && <CheckCircle2 size={11} />}
                    {isRejected && <XCircle size={11} />}
                    {isPending && <Clock size={11} />}
                    {proposal.status}
                  </span>
                </div>

                {/* Discount Banner (Whole Number Strictly Verified) */}
                <div className="rounded-xl bg-[var(--theme-bg-subtle)] p-3 border border-[var(--theme-border)]">
                  <div className="text-base font-bold font-mono text-[var(--theme-text-primary)]">
                    {proposal.discount_type === 'PERCENTAGE'
                      ? `${Math.round(proposal.discount_value)}% DISCOUNT`
                      : `${currencySymbol} ${Math.round(proposal.discount_value)} OFF`}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--theme-text-secondary)]">
                    <Calendar size={12} className="text-[var(--theme-text-muted)]" />
                    <span>Expires {proposal.expiry_date}</span>
                  </div>
                </div>

                {/* Requester & Decision History */}
                <div className="space-y-1.5 text-[11px] text-[var(--theme-text-secondary)] pt-1 border-t border-[var(--theme-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--theme-text-muted)]">Requester:</span>
                    <span className="font-medium text-[var(--theme-text-primary)]">
                      {proposal.requester?.name || 'Staff Member'} {proposal.requester?.role ? `(${proposal.requester.role})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--theme-text-muted)]">Requested:</span>
                    <span>{new Date(proposal.requested_at).toLocaleDateString()}</span>
                  </div>

                  {isApproved && (
                    <div className="mt-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2 text-[10px]">
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={12} />
                        <span>Approved by {proposal.approver?.name || 'Executive'}</span>
                      </div>
                      <div className="text-[var(--theme-text-muted)] mt-0.5">
                        {proposal.approved_at ? new Date(proposal.approved_at).toLocaleString() : 'Approved'} · Plan registered
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div className="mt-2 rounded-lg bg-rose-500/5 border border-rose-500/10 p-2 text-[10px]">
                      <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <XCircle size={12} />
                        <span>Rejected by {proposal.rejector?.name || 'Executive'}</span>
                      </div>
                      {proposal.rejection_reason && (
                        <div className="mt-1 text-[var(--theme-text-primary)] italic">
                          "{proposal.rejection_reason}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Approver */}
              {canDecide && (
                <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex items-center gap-2">
                  <button
                    type="button"
                    disabled={approve.isPending || reject.isPending}
                    onClick={() => handleApprove(proposal)}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold transition-opacity disabled:opacity-50"
                  >
                    Approve Plan
                  </button>
                  <button
                    type="button"
                    disabled={approve.isPending || reject.isPending}
                    onClick={() => setRejectModalProposal(proposal)}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Rejection Reason Modal */}
      <CampaignRejectModal
        isOpen={Boolean(rejectModalProposal)}
        onClose={() => setRejectModalProposal(null)}
        proposal={rejectModalProposal}
        onConfirmReject={handleConfirmReject}
        isSubmitting={reject.isPending}
      />
    </section>
  );
};
