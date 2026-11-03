import React from 'react';
import Modal from '../Modal';
import { Site } from '../../types';

interface DeleteSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteToDelete: Site | null;
  confirmDeleteSite: () => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (val: string) => void;
  isDeleting: boolean;
}

export function DeleteSiteModal({
  isOpen,
  onClose,
  siteToDelete,
  confirmDeleteSite,
  deleteConfirmText,
  setDeleteConfirmText,
  isDeleting
}: DeleteSiteModalProps) {
  return <Modal isOpen={isOpen} onClose={onClose} title="Facility history is protected">
    <div className="space-y-4 text-[var(--theme-text-primary)]">
      <p>Permanent deletion of "{siteToDelete?.name}" is disabled. Stock, employee assignments and transaction history must be preserved.</p>
      <p>Facility closure requires review of outstanding operations before its status changes to Closed.</p>
      <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-xl border border-[var(--theme-border)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Close</button>
    </div>
  </Modal>;
}
