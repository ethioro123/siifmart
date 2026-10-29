import React, { lazy, Suspense, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import type { ApprovalQueueSummary } from '../../types/unifiedApprovalInbox';
import { APPROVAL_INBOX_KEY } from '../../utils/unifiedApprovalInbox';
import { ModuleErrorBoundary } from '../shared/ModuleErrorBoundary';
const Recruitment = lazy(() => import('../employees/recruitment/RecruitmentPipelineTab'));
const Finance = lazy(() => import('./FinanceReviewAdapter'));
type Review = 'recruitment' | 'payroll' | 'margin';
const entries: { key: Review; label: string; queues: string[] }[] = [
  { key: 'recruitment', label: 'Recruitment and candidate clearances', queues: ['hiring_requests', 'candidate_hr', 'candidate_finance'] },
  { key: 'payroll', label: 'Payroll certification and finance sign-off', queues: ['payroll_hr', 'payroll_finance'] },
  { key: 'margin', label: 'Margin exceptions', queues: ['margin'] }
];
export function RemainingReviewWorkspace({ queues }: { queues: ApprovalQueueSummary[] }) {
  const { user } = useStore(); const { effectiveCountry, activeSite } = useData();
  if (!user?.id || !effectiveCountry || !activeSite?.id) return null;
  return <ReviewPanel key={`${user.id}:${user.role}:${effectiveCountry}:${activeSite.id}`} actor={user.id} queues={queues} />;
}
function ReviewPanel({ actor, queues }: { actor: string; queues: ApprovalQueueSummary[] }) {
  const [selected, setSelected] = useState<Review | null>(null);
  const client = useQueryClient();
  const available = entries.filter(entry => entry.queues.some(key => queues.some(queue => queue.key === key && queue.status === 'ready')));
  const active = available.find(entry => entry.key === selected);
  const close = () => { setSelected(null); void client.invalidateQueries({ queryKey: [APPROVAL_INBOX_KEY, actor] }); };
  if (!available.length) return null;
  return <section aria-labelledby="remaining-reviews-title" className="space-y-4 border-t border-[var(--theme-border)] pt-4">
    <h2 id="remaining-reviews-title" className="text-lg font-semibold">Specialist review workspaces</h2>
    <p className="text-sm text-[var(--theme-text-secondary)]">Open one workflow at a time. Its existing evidence and independent decision stages remain in place.</p>
    <div className="flex flex-wrap gap-3">{available.map(entry => <button key={entry.key} type="button" aria-pressed={selected === entry.key} onClick={() => setSelected(entry.key)} className="min-h-11 px-4 rounded-[10px] border border-[var(--theme-border)] text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">{entry.label}</button>)}</div>
    {active && <section aria-label={active.label} className="space-y-4"><header className="flex flex-wrap justify-between items-center gap-3"><h3 className="font-semibold">{active.label}</h3><button type="button" className="min-h-11 px-4 rounded-[10px] border border-[var(--theme-border)]" onClick={close}>Close specialist workspace</button></header>
      <ModuleErrorBoundary key={active.key} moduleName={active.label}><Suspense fallback={<p role="status">Loading review workspace…</p>}>
        {active.key === 'recruitment' ? <Recruitment reviewOnly /> : <Finance mode={active.key} />}
      </Suspense></ModuleErrorBoundary>
    </section>}
  </section>;
}
