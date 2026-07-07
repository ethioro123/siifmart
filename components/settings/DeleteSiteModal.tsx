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
    <Modal isOpen={isOpen} onClose={onClose} title="⚠️ Delete Location">
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
            <AlertTriangle size={20} />
            Permanent Deletion Warning
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            You are about to permanently delete <span className="font-bold text-white">"{siteToDelete?.name}"</span>
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• All products at this location will be deleted</p>
            <p>• All employees assigned here will be unassigned</p>
            <p>• All sales and inventory records will be affected</p>
            <p className="text-red-400 font-bold mt-2">⚠️ This action cannot be undone!</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300 font-bold mb-2 block">
            To confirm, type <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">DELETE</span> below:
          </label>
          <input
            type="text"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-red-500 font-mono"
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
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteSite}
            disabled={deleteConfirmText !== "DELETE" || isDeleting}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
