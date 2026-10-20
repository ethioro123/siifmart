import React from 'react';
import { Plus } from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';
import { useMerchandisingCampaigns } from '../../hooks/useMerchandisingCampaigns';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { logger } from '../../utils/logger';

const APPROVERS = new Set(['super_admin', 'ceo', 'head_of_merchandising', 'merchandising_head', 'merchandising_manager', 'regional_merchandising_lead']);

export const PromosTab: React.FC = () => {
   const { activeCountry, setIsPromoModalOpen, currencySymbol } = useMerchandising();
   const { user } = useStore();
   const { addNotification } = useData();
   const { data: proposals = [], isLoading, error, approve } = useMerchandisingCampaigns(activeCountry);

   const handleApprove = async (id: string) => {
      try {
         await approve.mutateAsync(id);
         addNotification('success', 'Campaign plan approved. POS discount activation is separate.');
      } catch (cause) {
         logger.error('PromosTab', 'Campaign approval failed', cause as Error);
         addNotification('alert', `Approval failed: ${(cause as Error).message}`);
      }
   };

   return <section className="space-y-5" aria-label="Campaign proposals">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5">
         <div>
            <h3 className="font-semibold text-[var(--theme-text-primary)]">Campaign plans</h3>
            <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Approval records the plan. It does not activate a discount at POS.</p>
         </div>
         <button type="button" onClick={() => setIsPromoModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-white">
            <Plus size={15} /> New proposal
         </button>
      </div>
      {isLoading && <p className="text-sm text-[var(--theme-text-secondary)]">Loading campaign plans…</p>}
      {error && <p className="text-sm text-[var(--theme-text-secondary)]">Could not load campaign plans: {(error as Error).message}</p>}
      {!isLoading && !error && proposals.length === 0 && <p className="rounded-2xl border border-[var(--theme-border)] p-6 text-sm text-[var(--theme-text-secondary)]">No campaign plans yet.</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
         {proposals.map(proposal => <article key={proposal.id} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5">
            <div className="flex items-start justify-between gap-2">
               <h4 className="font-mono font-semibold text-[var(--theme-text-primary)]">{proposal.code}</h4>
               <span className="text-xs font-semibold capitalize text-[var(--theme-text-secondary)]">{proposal.status}</span>
            </div>
            <p className="mt-3 text-sm text-[var(--theme-text-primary)]">
               {proposal.discount_type === 'FIXED' ? currencySymbol : ''}{proposal.discount_value}{proposal.discount_type === 'PERCENTAGE' ? '%' : ''} discount
            </p>
            <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
               {proposal.region_code || proposal.country_code} · Expires {proposal.expiry_date}
            </p>
            {proposal.status === 'pending' && APPROVERS.has((user?.role || '').toLowerCase()) && proposal.requested_by_employee_id !== user?.id &&
               <button type="button" disabled={approve.isPending} onClick={() => handleApprove(proposal.id)}
                  className="mt-4 rounded-xl border border-[var(--theme-border)] px-3 py-2 text-xs font-semibold text-[var(--theme-text-primary)] disabled:opacity-50">
                  Approve plan
               </button>}
         </article>)}
      </div>
   </section>;
};
