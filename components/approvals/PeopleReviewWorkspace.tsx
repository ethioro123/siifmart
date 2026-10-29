import React, { lazy, Suspense, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { APPROVAL_INBOX_KEY } from '../../utils/unifiedApprovalInbox';
import type { ApprovalQueueSummary } from '../../types/unifiedApprovalInbox';
import { ModuleErrorBoundary } from '../shared/ModuleErrorBoundary';

const SalaryReviews = lazy(() => import('../employees/SalaryApprovalQueueModal'));
const HeadcountReviews = lazy(() => import('../employees/modals/HeadcountQuotaApprovalModal').then(module => ({ default: module.HeadcountQuotaApprovalModal })));
const ProfileReviews = lazy(() => import('../employees/modals/EmployeeChangeApprovalModal').then(module => ({ default: module.EmployeeChangeApprovalModal })));
type PeopleQueue = 'salary' | 'headcount' | 'employee_changes';
const labels: Record<PeopleQueue, string> = { salary: 'Salary changes', headcount: 'Headcount requests', employee_changes: 'Employee profile changes' };

export function PeopleReviewWorkspace({ queues }: { queues: ApprovalQueueSummary[] }) {
  const { user } = useStore();
  const { effectiveCountry, activeSite } = useData();
  if (!user?.id || !effectiveCountry) return null;
  return <PeopleReviewPanel key={`${user.id}:${user.role}:${effectiveCountry}:${activeSite?.id}`} queues={queues} actor={user.id} country={effectiveCountry} />;
}
function PeopleReviewPanel({ queues, actor, country }: { queues: ApprovalQueueSummary[]; actor: string; country: string }) {
  const [selected, setSelected] = useState<PeopleQueue | null>(null);
  const client = useQueryClient();
  const available = (Object.keys(labels) as PeopleQueue[]).filter(key => queues.some(queue => queue.key === key && queue.status === 'ready'));
  if (!available.length) return null;
  const refresh = () => { void client.invalidateQueries({ queryKey: [APPROVAL_INBOX_KEY, actor] }); };
  const close = () => { setSelected(null); refresh(); };
  const chosen = selected && available.includes(selected) ? selected : null;
  const refreshRequests = () => {
    refresh();
    const keys = chosen === 'salary' ? ['salary_requests', 'salary-requests'] : chosen === 'headcount' ? ['headcount_quota_requests'] : ['employee_change_requests'];
    keys.forEach(key => { void client.invalidateQueries({ queryKey: [key] }); });
  };
  return <section aria-labelledby="people-reviews-title" className="border-t border-[var(--theme-border)] pt-4 space-y-3">
    <h2 id="people-reviews-title" className="text-lg font-semibold">People reviews</h2>
    <p className="text-sm text-[var(--theme-text-secondary)]">Open the authorized review queue here. Salary, workforce capacity and employee changes retain their independent approval stages.</p>
    <ul className="divide-y divide-[var(--theme-border)]">{available.map(key => {
      const queue = queues.find(item => item.key === key)!;
      return <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><h3 className="font-semibold text-sm">{labels[key]}</h3><p className="text-sm text-[var(--theme-text-secondary)]">{queue.count} decision stages awaiting review</p></div>
        <button type="button" onClick={() => setSelected(key)} className="min-h-11 px-4 rounded-[10px] border border-[var(--theme-border)] text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Review {labels[key].toLowerCase()}</button></li>;
    })}</ul>
    {chosen && <ModuleErrorBoundary moduleName="People approval review"><Suspense fallback={<p role="status">Loading review workspace…</p>}>
      <p className="sr-only">Reviewing requests within {country}.</p>
      {chosen === 'salary' && <SalaryReviews isOpen onClose={close} onRequestsUpdated={refreshRequests} />}
      {chosen === 'headcount' && <HeadcountReviews isOpen onClose={close} onRequestsUpdated={refreshRequests} />}
      {chosen === 'employee_changes' && <ProfileReviews isOpen onClose={close} onRequestsUpdated={refreshRequests} />}
    </Suspense></ModuleErrorBoundary>}
  </section>;
}
