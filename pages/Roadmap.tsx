import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Store,
  Warehouse,
  Building2,
  ShoppingCart,
  Truck,
  Users,
  BarChart3,
  Lightbulb,
  Target,
  Star,
  Loader2,
  Database,
  Search,
  Calendar,
  Clock,
  Tag,
  FileText,
  BookOpen,
  Shield,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatDateTime, formatRole } from '../utils/formatting';
import { useStore } from '../contexts/CentralStore';
import { brainstormService, type BrainstormNodeDB } from '../services/supabase.service';

// ============================================================================
// TYPES
// ============================================================================

interface KnowledgeEntry {
  id: string;
  title: string;
  description: string;
  department: 'stores' | 'warehouses' | 'admin' | 'pos' | 'logistics' | 'hr' | 'finance' | 'general' | 'policy' | 'workflow';
  type: 'idea' | 'policy' | 'workflow' | 'note' | 'improvement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'archived' | 'implemented';
  createdAt: string;
  updatedAt?: string;
  content?: string;
  tags: string[];
  isStarred: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEPARTMENTS = {
  stores: { label: 'Stores', icon: Store, color: 'bg-emerald-500', text: 'text-emerald-400', bgLight: 'bg-emerald-500/20' },
  warehouses: { label: 'Warehouses', icon: Warehouse, color: 'bg-blue-500', text: 'text-blue-400', bgLight: 'bg-blue-500/20' },
  admin: { label: 'Administration', icon: Building2, color: 'bg-purple-500', text: 'text-purple-400', bgLight: 'bg-purple-500/20' },
  pos: { label: 'Point of Sale', icon: ShoppingCart, color: 'bg-orange-500', text: 'text-orange-400', bgLight: 'bg-orange-500/20' },
  logistics: { label: 'Logistics', icon: Truck, color: 'bg-rose-500', text: 'text-rose-400', bgLight: 'bg-rose-500/20' },
  hr: { label: 'Human Resources', icon: Users, color: 'bg-indigo-500', text: 'text-indigo-400', bgLight: 'bg-indigo-500/20' },
  finance: { label: 'Finance', icon: BarChart3, color: 'bg-yellow-500', text: 'text-yellow-400', bgLight: 'bg-yellow-500/20' },
  general: { label: 'General', icon: Lightbulb, color: 'bg-gray-500', text: 'text-gray-400', bgLight: 'bg-gray-500/20' },
  policy: { label: 'Policy', icon: FileText, color: 'bg-cyan-500', text: 'text-cyan-400', bgLight: 'bg-cyan-500/20' },
  workflow: { label: 'Workflow', icon: Target, color: 'bg-pink-500', text: 'text-pink-400', bgLight: 'bg-pink-500/20' }
};

const ENTRY_TYPES = {
  idea: { label: 'Idea', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  policy: { label: 'Policy', icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  workflow: { label: 'Workflow', icon: Target, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  note: { label: 'Note', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  improvement: { label: 'Improvement', icon: Star, color: 'text-green-400', bg: 'bg-green-500/20' }
};

const STATUSES = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/20' },
  archived: { label: 'Archived', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  implemented: { label: 'Implemented', color: 'text-cyan-400', bg: 'bg-cyan-500/20' }
};

// ============================================================================
// HELPER: Map DB to local state
// ============================================================================
const mapDBToLocal = (db: BrainstormNodeDB): KnowledgeEntry => ({
  id: db.id,
  title: db.title,
  description: db.description,
  department: db.department as KnowledgeEntry['department'],
  type: (db.status === 'idea' ? 'idea' : db.status === 'planning' ? 'workflow' : db.status === 'completed' ? 'improvement' : 'note') as KnowledgeEntry['type'],
  priority: db.priority as KnowledgeEntry['priority'],
  status: db.status === 'completed' ? 'implemented' : 'active' as KnowledgeEntry['status'],
  createdAt: db.created_at,
  updatedAt: db.updated_at,
  content: db.notes || db.description,
  tags: db.tags || [],
  isStarred: db.is_starred || false
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Roadmap() {
  const { addNotification } = useData();
  const { user } = useStore();

  // State
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // New entry form
  const [newEntry, setNewEntry] = useState<Partial<KnowledgeEntry>>({
    title: '',
    description: '',
    content: '',
    department: 'general',
    type: 'note',
    priority: 'medium',
    status: 'active',
    tags: []
  });

  // Check if user is super_admin
  const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin' ||
    user?.role?.toLowerCase().replace('_', ' ') === 'super admin';

  // Load data from Supabase with timeout
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        const dataPromise = brainstormService.getAll();

        const data = await Promise.race([dataPromise, timeoutPromise]) as any[];
        if (isMounted) {
          setEntries(data.map(mapDBToLocal));
        }
      } catch (error) {
        console.warn('Failed to load knowledge base:', error);
        // Don't show error notification - just show empty state
        if (isMounted) {
          setEntries([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Create entry
  const createEntry = async () => {
    if (!newEntry.title?.trim()) {
      addNotification('alert', 'Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const entryData = {
        title: newEntry.title,
        description: newEntry.description || '',
        department: newEntry.department || 'general',
        priority: newEntry.priority || 'medium',
        status: newEntry.type === 'idea' ? 'idea' : 'in-progress',
        notes: newEntry.content || '',
        tags: newEntry.tags || [],
        x: 0,
        y: 0,
        connections: [],
        created_by: user?.name || 'System'
      };

      const created = await brainstormService.create(entryData);
      setEntries(prev => [mapDBToLocal(created), ...prev]);
      setNewEntry({
        title: '',
        description: '',
        content: '',
        department: 'general',
        type: 'note',
        priority: 'medium',
        status: 'active',
        tags: []
      });
      setIsCreating(false);
      addNotification('success', 'Entry saved!');
    } catch (error) {
      console.error('Failed to create entry:', error);
      addNotification('alert', 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  // Update entry
  const updateEntry = async () => {
    if (!selectedEntry) return;

    setIsSaving(true);
    try {
      await brainstormService.update(selectedEntry.id, {
        title: selectedEntry.title,
        description: selectedEntry.description,
        department: selectedEntry.department,
        priority: selectedEntry.priority,
        notes: selectedEntry.content,
        tags: selectedEntry.tags,
        is_starred: selectedEntry.isStarred
      });
      setEntries(prev => prev.map(e => e.id === selectedEntry.id ? selectedEntry : e));
      setIsEditing(false);
      addNotification('success', 'Entry updated!');
    } catch (error) {
      console.error('Failed to update entry:', error);
      addNotification('alert', 'Failed to update entry');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    setIsSaving(true);
    try {
      await brainstormService.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      setSelectedEntry(null);
      addNotification('info', 'Entry deleted');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      addNotification('alert', 'Failed to delete entry');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle star
  const toggleStar = async (entry: KnowledgeEntry) => {
    const newStarred = !entry.isStarred;
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isStarred: newStarred } : e));
    if (selectedEntry?.id === entry.id) {
      setSelectedEntry({ ...selectedEntry, isStarred: newStarred });
    }
    try {
      await brainstormService.update(entry.id, { is_starred: newStarred });
    } catch (error) {
      // Rollback
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
    }
  };

  // Filter entries
  const filteredEntries = entries.filter(e => {
    if (filterDepartment !== 'all' && e.department !== filterDepartment) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.content?.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatDate = (date: string) => {
    return formatDateTime(date);
  };
  const formatTime = (date: string) => {
    return formatDateTime(date, { showTime: true });
  };

  // Access denied for non-super_admin
  if (!isSuperAdmin) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield size={48} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Access Restricted</h2>
          <p className="text-gray-400 mb-6">
            The Knowledge Base is exclusively available to <span className="text-cyber-primary font-bold">CEOs</span>.
          </p>
          <p className="text-sm text-gray-500">
            Current role: <span className="text-white">{formatRole(user?.role) || 'Unknown'}</span>
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-cyber-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  // Detail View
  if (selectedEntry) {
    const dept = DEPARTMENTS[selectedEntry.department];
    const entryType = ENTRY_TYPES[selectedEntry.type];
    const status = STATUSES[selectedEntry.status];

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
                  onChange={(e) => setSelectedEntry({ ...selectedEntry, title: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:border-cyber-primary/50 focus:outline-none"
                />
                <textarea
                  value={selectedEntry.description}
                  onChange={(e) => setSelectedEntry({ ...selectedEntry, description: e.target.value })}
                  rows={2}
                  placeholder="Short description..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-400 focus:border-cyber-primary/50 focus:outline-none resize-none"
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
                  onChange={(e) => setSelectedEntry({ ...selectedEntry, content: e.target.value })}
                  rows={12}
                  placeholder="Write your content here..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-cyber-primary/50 focus:outline-none resize-none font-mono text-sm leading-relaxed"
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
  }

  // List View
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-cyber-primary" />
            Knowledge Base
            <span className="text-xs bg-cyber-primary/20 text-cyber-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Database size={10} /> Synced
            </span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {entries.length} entries • Policies, Ideas, Workflows & Notes
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-cyber-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-cyber-accent transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] flex items-center gap-2 self-start md:self-auto"
        >
          <Plus size={18} />
          New Entry
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cyber-gray border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-cyber-primary/50 focus:outline-none"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="bg-cyber-gray border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-primary/50 min-w-[150px]"
        >
          <option value="all">All Areas</option>
          {Object.entries(DEPARTMENTS).map(([key, d]) => (
            <option key={key} value={key}>{d.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-cyber-gray border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-primary/50 min-w-[150px]"
        >
          <option value="all">All Types</option>
          {Object.entries(ENTRY_TYPES).map(([key, t]) => (
            <option key={key} value={key}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500 font-medium">No entries found</p>
            <p className="text-gray-600 text-sm mt-1">Create your first entry to get started</p>
          </div>
        ) : (
          filteredEntries.map(entry => {
            const dept = DEPARTMENTS[entry.department];
            const entryType = ENTRY_TYPES[entry.type];

            return (
              <button
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="w-full bg-cyber-gray hover:bg-cyber-gray/80 border border-white/10 hover:border-white/20 rounded-2xl p-5 text-left transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${dept.bgLight} flex items-center justify-center flex-shrink-0`}>
                    <dept.icon size={24} className={dept.text} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {entry.isStarred && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                      <h3 className="text-white font-bold truncate">{entry.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{entry.description || 'No description'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entryType.bg} ${entryType.color}`}>
                        {entryType.label}
                      </span>
                      <span className="text-gray-600 text-xs">•</span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(entry.createdAt)}
                      </span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={20} className="text-gray-600 group-hover:text-cyber-primary transition-colors flex-shrink-0" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cyber-gray border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-cyber-gray">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="text-cyber-primary" />
                New Entry
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white" title="Close">
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Type</label>
                  <select
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as KnowledgeEntry['type'] })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-primary/50"
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
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-cyber-gray">
              <button onClick={() => setIsCreating(false)} className="px-6 py-2.5 text-gray-400 hover:text-white font-medium">
                Cancel
              </button>
              <button
                onClick={createEntry}
                disabled={isSaving}
                className="bg-cyber-primary text-black px-6 py-2.5 rounded-xl font-bold hover:bg-cyber-accent transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
