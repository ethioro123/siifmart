import React, { lazy, Suspense } from 'react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import type { ApprovalQueueSummary } from '../../types/unifiedApprovalInbox';
import { approvalWorkspaceTarget } from '../../utils/approvalWorkspaceTarget';
import { ModuleErrorBoundary } from '../shared/ModuleErrorBoundary';
const Catalog = lazy(() => import('./ApprovalWorkspace').then(m => ({ default: m.ApprovalWorkspace })));
const Requisitions = lazy(() => import('./RequisitionReviewWorkspace').then(m => ({ default: m.RequisitionReviewWorkspace })));
const Orders = lazy(() => import('./PurchaseOrderReviewWorkspace').then(m => ({ default: m.PurchaseOrderReviewWorkspace })));
const People = lazy(() => import('./PeopleReviewWorkspace').then(m => ({ default: m.PeopleReviewWorkspace })));
const Specialist = lazy(() => import('./RemainingReviewWorkspace').then(m => ({ default: m.RemainingReviewWorkspace })));
const Personnel = lazy(() => import('./LeaveAndAttestationWorkspace').then(m => ({ default: m.LeaveAndAttestationWorkspace })));
const Expenses = lazy(() => import('./ExpenseReviewWorkspace').then(m => ({ default: m.ExpenseReviewWorkspace })));
const Campaigns = lazy(() => import('../merchandising/PromosTab').then(m => ({ default: m.CampaignReviewPanel })));
export function ApprovalReviewHost({ queueKey, queues }: { queueKey: string; queues: ApprovalQueueSummary[] }) {
 const { user } = useStore(); const { activeSite, effectiveCountry } = useData();
 const target = queueKey === 'barcode' ? 'catalog' : approvalWorkspaceTarget(queueKey);
 if (!user?.id || !effectiveCountry || !target) return null;
 if (queueKey !== 'barcode' && !queues.some(q => q.key === queueKey && q.status === 'ready')) return <p role="status">This queue is unavailable. Refresh the inbox to check your access.</p>;
 return <ModuleErrorBoundary key={`${user.id}:${user.role}:${effectiveCountry}:${activeSite?.id}:${queueKey}`} moduleName="Approval review"><Suspense fallback={<p role="status">Loading review workspace…</p>}>
  {target === 'catalog' && <Catalog initialQueue={queueKey === 'barcode' ? 'barcode' : queueKey === 'inventory' ? 'inventory' : 'product'} />}
  {target === 'requisitions' && <Requisitions />}
  {target === 'orders' && <Orders />}
  {target === 'people' && <People queues={queues.filter(q => q.key === queueKey)} />}
  {target === 'specialist' && <Specialist queues={queues.filter(q => q.key === queueKey)} />}
  {target === 'personnel' && <Personnel queues={queues.filter(q => q.key === queueKey)} />}
  {target === 'expenses' && <Expenses />}
  {target === 'campaigns' && <Campaigns activeCountry={effectiveCountry} currencySymbol={effectiveCountry === 'KE' ? 'KES' : 'ETB'} />}
 </Suspense></ModuleErrorBoundary>;
}
