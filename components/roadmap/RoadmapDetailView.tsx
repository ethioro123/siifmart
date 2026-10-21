import React from 'react';
import {
  Save, Trash2, Edit3, Star, ArrowLeft, Loader2, Calendar, Clock
} from 'lucide-react';
import { KnowledgeEntry, DEPARTMENTS, ENTRY_TYPES, STATUSES } from './RoadmapTypes';
import { formatDateTime } from '../../utils/formatting';

interface RoadmapDetailViewProps {
  selectedEntry: KnowledgeEntry;
  isEditing: boolean;
  isSaving: boolean;
  setSelectedEntry: (entry: KnowledgeEntry | null) => void;
  setIsEditing: (val: boolean) => void;
  updateEntry: () => void;
  deleteEntry: (id: string) => void;
  toggleStar: (entry: KnowledgeEntry) => void;
  onUpdate: (updated: KnowledgeEntry) => void;
}

export const RoadmapDetailView: React.FC<RoadmapDetailViewProps> = ({
  selectedEntry,
  isEditing,
  isSaving,
  setSelectedEntry,
  setIsEditing,
  updateEntry,
  deleteEntry,
  toggleStar,
  onUpdate
}) => {
  const dept = DEPARTMENTS[selectedEntry.department];
  const entryType = ENTRY_TYPES[selectedEntry.type];
  const status = STATUSES[selectedEntry.status];

  const formatDate = (date: string) => formatDateTime(date);
  const formatTime = (date: string) => formatDateTime(date, { showTime: true });

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => { setSelectedEntry(null); setIsEditing(false); }}
          className="min-h-11 flex items-center gap-2 px-2 -ml-2 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to List</span>
        </button>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 size={16} className="text-[var(--theme-accent)] animate-spin" aria-label="Saving" />}
          <button
            type="button"
            onClick={() => toggleStar(selectedEntry)}
            className={`min-h-11 min-w-11 flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${selectedEntry.isStarred ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning)]' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-status-warning)]'}`}
            aria-label={selectedEntry.isStarred ? 'Remove star' : 'Add star'}
            aria-pressed={Boolean(selectedEntry.isStarred)}
          >
            <Star size={18} className={selectedEntry.isStarred ? 'fill-current' : ''} />
          </button>
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                aria-label="Edit entry"
              >
                <Edit3 size={18} />
              </button>
              <button
                type="button"
                onClick={() => deleteEntry(selectedEntry.id)}
                className="min-h-11 min-w-11 flex items-center justify-center bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-status-danger)] hover:bg-[var(--theme-status-danger-bg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]"
                aria-label="Delete entry"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-11 px-4 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateEntry}
                disabled={isSaving}
                className="min-h-11 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] px-4 rounded-xl font-semibold text-sm hover:bg-[var(--theme-primary-hover)] transition-colors flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              >
                <Save size={16} />
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] p-4 sm:p-6 md:p-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${dept.bgLight}`}>
              <dept.icon size={14} className={dept.text} />
              <span className={`text-xs font-bold ${dept.text}`}>{dept.label}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${entryType.bg}`}>
              <entryType.icon size={14} className={entryType.color} />
              <span className={`text-xs font-bold ${entryType.color}`}>{entryType.label}</span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg ${status.bg}`}>
              <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
            </div>
          </div>

          {/* Title & Description */}
          {isEditing ? (
            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={selectedEntry.title}
                onChange={(e) => onUpdate({ ...selectedEntry, title: e.target.value })}
                className="w-full min-h-11 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 py-3 text-2xl font-bold text-[var(--theme-input-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                aria-label="Title"
              />
              <textarea
                value={selectedEntry.description}
                onChange={(e) => onUpdate({ ...selectedEntry, description: e.target.value })}
                rows={2}
                placeholder="Short description..."
                className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 py-3 text-[var(--theme-input-text)] placeholder:text-[var(--theme-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] resize-y"
                aria-label="Description"
              />
            </div>
          ) : (
            <>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--theme-text-primary)] mb-3">{selectedEntry.title}</h1>
              {selectedEntry.description && (
                <p className="text-[var(--theme-text-secondary)] text-lg mb-6">{selectedEntry.description}</p>
              )}
            </>
          )}

          {/* Timestamp */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-[var(--theme-border)]">
            <div className="flex items-center gap-2 text-[var(--theme-text-secondary)]">
              <Calendar size={14} />
              <span className="text-sm">{formatDate(selectedEntry.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--theme-text-secondary)]">
              <Clock size={14} />
              <span className="text-sm">{formatTime(selectedEntry.createdAt)}</span>
            </div>
            {selectedEntry.updatedAt && selectedEntry.updatedAt !== selectedEntry.createdAt && (
              <div className="text-xs text-[var(--theme-text-muted)]">
                Updated: {formatDate(selectedEntry.updatedAt)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="mb-8">
            <h3 className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold tracking-widest mb-4">Content</h3>
            {isEditing ? (
              <textarea
                value={selectedEntry.content || ''}
                onChange={(e) => onUpdate({ ...selectedEntry, content: e.target.value })}
                rows={12}
                placeholder="Write your content here..."
                className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 py-4 text-[var(--theme-input-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] resize-y font-mono text-sm leading-relaxed"
                aria-label="Content"
              />
            ) : (
              <div className="bg-[var(--theme-bg-subtle)] rounded-xl p-4 sm:p-6 min-h-[160px]">
                <p className="text-[var(--theme-text-primary)] whitespace-pre-wrap leading-relaxed">
                  {selectedEntry.content || selectedEntry.description || 'No content added yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {(selectedEntry.tags?.length > 0 || isEditing) && (
            <div>
              <h3 className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold tracking-widest mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedEntry.tags?.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg text-sm text-[var(--theme-text-primary)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetailView;
