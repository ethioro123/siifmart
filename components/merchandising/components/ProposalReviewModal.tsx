import React, { useState } from 'react';
import Modal from '../../Modal';
import { ProposalDiffView } from './ProposalDiffView';
import { ProductEditApprovalProgress } from '../../inventory/ProductEditApprovalProgress';
import { PlanogramRevisionReview } from '../planogram/PlanogramRevisionReview';
import { useStore } from '../../../contexts/CentralStore';
import { proposalApprovalBlock } from '../../../utils/proposalReviewPolicy';
import type { PendingInventoryChange, Product } from '../../../types';

interface Props {
  request: PendingInventoryChange; currentProduct?: Partial<Product>; country: string;
  currencySymbol: string; submitting: boolean; onClose: () => void; onApprove: () => Promise<void>;
}
export function ProposalReviewModal({ request, currentProduct, country, currencySymbol, submitting, onClose, onApprove }: Props) {
  const { user } = useStore();
  const [error,setError] = useState('');
  const block = proposalApprovalBlock(request,user,currentProduct || request.currentProduct);
  const confirm = async () => { if (block || submitting) return; setError(''); try { await onApprove(); } catch (error) { setError(error instanceof Error ? error.message : 'Approval could not be recorded. Please retry.'); } };
  if (request.layoutRevisionId || request.layout_revision_id) return <PlanogramRevisionReview request={request} country={country} submitting={submitting} approvalBlock={block} onClose={onClose} onApprove={onApprove} />;
  return <Modal isOpen onClose={onClose} title="Review proposal" size="xl" closeOnEscape={!submitting} closeOnClickOutside={!submitting}
    footer={<div className="flex justify-end gap-3"><button type="button" disabled={submitting} onClick={onClose} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4">Close</button>
      <button type="button" disabled={Boolean(block) || submitting} onClick={() => void confirm()} className="min-h-11 rounded-xl bg-[var(--theme-accent)] px-4 text-[var(--theme-btn-primary-text)] disabled:opacity-50">{submitting ? 'Recording approval…' : 'Record regional approval'}</button></div>}>
    <h3 className="font-semibold text-[var(--theme-text-primary)]">{request.productName}</h3>
    <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">SKU: {request.productSku} · Requested by {request.requestedBy} · {request.status}</p>
    <ProposalDiffView request={request} currentProduct={currentProduct || request.currentProduct} currencySymbol={currencySymbol} />
    <div className="mt-4"><ProductEditApprovalProgress request={request} /></div>
    {block && <p role="status" className="mt-4 text-sm text-[var(--theme-text-secondary)]">{block}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-[var(--theme-status-danger-text)]">{error}</p>}
  </Modal>;
}
