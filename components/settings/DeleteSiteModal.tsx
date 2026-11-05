import { Link } from 'react-router-dom';
import React from 'react';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';
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
}: DeleteSiteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Facility History Protected">
      <div className="space-y-5 text-[var(--theme-text-primary)]">
        <div className="p-4 bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] rounded-2xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] flex items-center justify-center shrink-0">
            <ShieldAlert size={18} className="text-[var(--theme-status-warning-text)]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[var(--theme-status-warning-text)] uppercase tracking-wider">
              Zero-Trust Audit Enforcement
            </h4>
            <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
              Permanent deletion of <strong className="text-[var(--theme-text-primary)]">"{siteToDelete?.name}"</strong> is prohibited. Stock movements, worker badge assignments, and fiscal transaction history must remain immutable.
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
          To decommission or transition this facility, submit a formal closure request through executive governance. Outstanding orders and stock transfers must be resolved first.
        </p>

        <div className="pt-3 border-t border-[var(--theme-border)] flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 rounded-xl border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]/30"
          >
            <X size={14} />
            Close
          </button>
          <Link
            to="/approvals"
            onClick={onClose}
            className="min-h-11 px-5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-accent-text,var(--theme-text-primary))] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]/30"
          >
            <span>Open Approvals Hub</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
