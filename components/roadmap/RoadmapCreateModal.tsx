import React, { useEffect } from 'react';
import { Plus, X, Save, Loader2 } from 'lucide-react';
import { KnowledgeEntry, DEPARTMENTS, ENTRY_TYPES } from './RoadmapTypes';

interface RoadmapCreateModalProps {
  newEntry: Partial<KnowledgeEntry>;
  setNewEntry: React.Dispatch<React.SetStateAction<Partial<KnowledgeEntry>>>;
  isSaving: boolean;
  onSave: () => void;
  onClose: () => void;
}

export const RoadmapCreateModal: React.FC<RoadmapCreateModalProps> = ({
  newEntry,
  setNewEntry,
  isSaving,
  onSave,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, onClose]);

  return (
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-3 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="roadmap-create-title" className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl w-full max-w-lg shadow-xl max-h-[calc(100dvh-24px)] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-[var(--theme-border)] flex items-center justify-between sticky top-0 bg-[var(--theme-bg-card)] z-10">
          <h3 id="roadmap-create-title" className="text-xl font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Plus className="text-[var(--theme-accent)]" aria-hidden="true" />
            New Entry
          </h3>
          <button type="button" onClick={onClose} disabled={isSaving} className="min-h-11 min-w-11 flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] disabled:opacity-50" aria-label="Close new entry dialog">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div>
            <label htmlFor="roadmap-entry-title" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-2 block">Title <span aria-hidden="true">*</span></label>
            <input
              id="roadmap-entry-title"
              type="text"
              required
              placeholder="Entry title..."
              value={newEntry.title || ''}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              className="w-full min-h-11 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 py-3 text-[var(--theme-input-text)] placeholder:text-[var(--theme-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="roadmap-entry-description" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-2 block">Short description</label>
            <input
              id="roadmap-entry-description"
              type="text"
              placeholder="Brief summary..."
              value={newEntry.description || ''}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              className="w-full min-h-11 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 py-3 text-[var(--theme-input-text)] placeholder:text-[var(--theme-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="roadmap-entry-type" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-2 block">Type</label>
              <select
                id="roadmap-entry-type"
                value={newEntry.type}
                onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as KnowledgeEntry['type'] })}
                className="w-full min-h-11 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 py-3 text-[var(--theme-input-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              >
                {Object.entries(ENTRY_TYPES).map(([key, t]) => (
                  <option key={key} value={key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="roadmap-entry-department" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-2 block">Related to</label>
              <select
                id="roadmap-entry-department"
                value={newEntry.department}
                onChange={(e) => setNewEntry({ ...newEntry, department: e.target.value as KnowledgeEntry['department'] })}
                className="w-full min-h-11 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 py-3 text-[var(--theme-input-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              >
                {Object.entries(DEPARTMENTS).map(([key, d]) => (
                  <option key={key} value={key}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="roadmap-entry-content" className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-2 block">Content</label>
            <textarea
              id="roadmap-entry-content"
              placeholder="Write your content here..."
              value={newEntry.content || ''}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              rows={6}
              className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 py-3 text-[var(--theme-input-text)] placeholder:text-[var(--theme-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] resize-y"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-[var(--theme-border)] flex justify-end gap-3 sticky bottom-0 bg-[var(--theme-bg-card)]">
          <button type="button" onClick={onClose} disabled={isSaving} className="min-h-11 px-5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !newEntry.title?.trim()}
            className="min-h-11 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] px-5 rounded-xl font-semibold hover:bg-[var(--theme-primary-hover)] transition-colors flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapCreateModal;
