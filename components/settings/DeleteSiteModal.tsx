import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import type { Site } from '../../types';
import { useSiteClosureRequest } from '../../hooks/useSiteClosureRequest';
interface DeleteSiteModalProps {
  isOpen: boolean; onClose: () => void; siteToDelete: Site | null;
  confirmDeleteSite: () => void; deleteConfirmText: string;
  setDeleteConfirmText: (val: string) => void; isDeleting: boolean;
}
export function DeleteSiteModal({ isOpen, onClose, siteToDelete }: DeleteSiteModalProps) {
  const [reason, setReason] = useState('');
  const request = useSiteClosureRequest();
  useEffect(() => { if (isOpen) { setReason(''); request.reset(); } }, [isOpen, siteToDelete?.id]);
  const control = 'min-h-11 px-4 rounded-xl border border-[var(--theme-border)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
  return <Modal isOpen={isOpen} onClose={() => { if (!request.isPending) onClose(); }} title="Request facility closure">
    <div className="space-y-4 text-[var(--theme-text-primary)]">
      <p className="text-sm">Request closure of {siteToDelete?.name}. The facility remains open until the required independent reviews are completed. Its records are retained.</p>
      {request.isSuccess ? <div role="status" className="space-y-3"><p>Closure request submitted for review.</p><Link className={control} to="/approvals" onClick={onClose}>View requests in Approvals</Link></div> : <>
        <label className="block text-sm">Reason for closure<textarea className={`${control} block w-full mt-2 bg-[var(--theme-bg-card)] py-3`} value={reason} maxLength={1200} onChange={e => setReason(e.target.value)} disabled={request.isPending} /></label>
        <p className="text-xs text-[var(--theme-text-secondary)]">Enter at least 10 characters. Open the lifecycle workspace in Approvals to track department clearance.</p>
        {request.error && <p role="alert" className="text-sm text-[var(--theme-status-danger-text)]">{request.error.message}</p>}
        <button type="button" className={`${control} bg-[var(--theme-accent)] text-[var(--theme-accent-text)]`} disabled={!siteToDelete || reason.trim().length < 10 || request.isPending} onClick={() => siteToDelete && request.mutate({ siteId: siteToDelete.id, reason })}>{request.isPending ? 'Submitting…' : 'Submit closure request'}</button>
      </>}
      <button type="button" className={control} onClick={onClose} disabled={request.isPending}>Close</button>
    </div>
  </Modal>;
}
