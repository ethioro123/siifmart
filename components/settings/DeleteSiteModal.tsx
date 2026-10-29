import React from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Location">
      <div className="space-y-4">
        <div className="bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-2xl p-4">
          <h4 className="text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-semibold mb-2 flex items-center gap-2 text-sm">
            <AlertTriangle size={18} />
            Permanent Deletion Warning
          </h4>
          <p className="text-xs text-[var(--theme-text-secondary)] mb-3 leading-relaxed">
            You are about to permanently delete <span className="font-semibold text-[var(--theme-text-primary)]">"{siteToDelete?.name}"</span>
          </p>
          <div className="text-[11px] text-[var(--theme-text-secondary)] space-y-1.5 border-t border-[var(--theme-status-danger-border)] pt-2.5">
            <p className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--theme-status-danger-bg)]" />
              All products at this location will be deleted
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--theme-status-danger-bg)]" />
              All employees assigned here will be unassigned
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--theme-status-danger-bg)]" />
              All sales and inventory records will be affected
            </p>
            <p className="text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-semibold mt-2">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-2 block">
            To confirm, type <span className="font-mono font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] px-2 py-0.5 rounded-md border border-[var(--theme-status-danger-border)]">DELETE</span> below:
          </label>
          <input
            type="text"
            className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 text-xs font-mono font-medium text-[var(--theme-text-primary)] focus:outline-hidden focus:ring-2 ring-[var(--theme-status-danger-border)] border-[var(--theme-status-danger-border)] transition-all placeholder:text-[var(--theme-text-muted)]"
            placeholder="Type DELETE to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmDeleteSite();
            }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] transition-all cursor-pointer active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDeleteSite}
            disabled={deleteConfirmText !== "DELETE" || isDeleting}
            className="flex-1 h-11 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-primary)] font-semibold text-xs rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
