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
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { setSelectedEntry(null); setIsEditing(false); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to List</span>
        </button>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 size={16} className="text-cyber-primary animate-spin" />}
          <button
            onClick={() => toggleStar(selectedEntry)}
            className={`p-2 rounded-lg transition-all ${selectedEntry.isStarred ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400 hover:text-yellow-400'}`}
            title={selectedEntry.isStarred ? 'Unstar' : 'Star'}
          >
            <Star size={18} className={selectedEntry.isStarred ? 'fill-current' : ''} />
          </button>
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                title="Edit"
              >
                <Edit3 size={18} />
              </button>
              <button
                onClick={() => deleteEntry(selectedEntry.id)}
                className="p-2 bg-white/10 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateEntry}
                disabled={isSaving}
                className="bg-cyber-primary text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-cyber-accent transition-all flex items-center gap-2 disabled:opacity-50"
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
        <div className="bg-cyber-gray rounded-2xl border border-white/10 p-6 md:p-8">
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
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:border-cyber-primary/50 focus:outline-none"
                aria-label="Title"
              />
              <textarea
                value={selectedEntry.description}
                onChange={(e) => onUpdate({ ...selectedEntry, description: e.target.value })}
                rows={2}
                placeholder="Short description..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-400 focus:border-cyber-primary/50 focus:outline-none resize-none"
                aria-label="Description"
              />
            </div>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{selectedEntry.title}</h1>
              {selectedEntry.description && (
                <p className="text-gray-400 text-lg mb-6">{selectedEntry.description}</p>
              )}
            </>
          )}

          {/* Timestamp */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-white/10">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} />
              <span className="text-sm">{formatDate(selectedEntry.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock size={14} />
              <span className="text-sm">{formatTime(selectedEntry.createdAt)}</span>
            </div>
            {selectedEntry.updatedAt && selectedEntry.updatedAt !== selectedEntry.createdAt && (
              <div className="text-xs text-gray-600">
                Updated: {formatDate(selectedEntry.updatedAt)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="mb-8">
            <h3 className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-4">Content</h3>
            {isEditing ? (
              <textarea
                value={selectedEntry.content || ''}
                onChange={(e) => onUpdate({ ...selectedEntry, content: e.target.value })}
                rows={12}
                placeholder="Write your content here..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-cyber-primary/50 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                aria-label="Content"
              />
            ) : (
              <div className="bg-black/30 rounded-xl p-6 min-h-[200px]">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selectedEntry.content || selectedEntry.description || 'No content added yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {(selectedEntry.tags?.length > 0 || isEditing) && (
            <div>
              <h3 className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedEntry.tags?.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
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
