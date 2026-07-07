import React from 'react';
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
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cyber-gray border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-cyber-gray">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="text-cyber-primary" />
            New Entry
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Title *</label>
            <input
              type="text"
              placeholder="Entry title..."
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyber-primary/50 focus:outline-none"
              autoFocus
              aria-label="Title"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Short Description</label>
            <input
              type="text"
              placeholder="Brief summary..."
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyber-primary/50 focus:outline-none"
              aria-label="Description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Type</label>
              <select
                value={newEntry.type}
                onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as KnowledgeEntry['type'] })}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-primary/50"
                aria-label="Type"
              >
                {Object.entries(ENTRY_TYPES).map(([key, t]) => (
                  <option key={key} value={key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Related To</label>
              <select
                value={newEntry.department}
                onChange={(e) => setNewEntry({ ...newEntry, department: e.target.value as KnowledgeEntry['department'] })}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-primary/50"
                aria-label="Department"
              >
                {Object.entries(DEPARTMENTS).map(([key, d]) => (
                  <option key={key} value={key}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Content</label>
            <textarea
              placeholder="Write your content here..."
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              rows={6}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyber-primary/50 focus:outline-none resize-none"
              aria-label="Content"
            />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-cyber-gray">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-400 hover:text-white font-medium">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="bg-cyber-primary text-black px-6 py-2.5 rounded-xl font-bold hover:bg-cyber-accent transition-all flex items-center gap-2 disabled:opacity-50"
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
