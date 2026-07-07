import React, { useState, useEffect } from 'react';
import {
  Plus, Star, Loader2, Database, Search,
  Calendar, Clock, BookOpen, Shield,
  ChevronRight, CheckCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatDateTime, formatRole } from '../utils/formatting';
import { useStore } from '../contexts/CentralStore';
import { brainstormService } from '../services/supabase.service';
import { KnowledgeEntry, DEPARTMENTS, ENTRY_TYPES, STATUSES, mapDBToLocal } from '../components/roadmap/RoadmapTypes';
import { RoadmapDetailView } from '../components/roadmap/RoadmapDetailView';
import { RoadmapCreateModal } from '../components/roadmap/RoadmapCreateModal';
import { logger } from '../utils/logger';

export default function Roadmap() {
  const { addNotification } = useData();
  const { user } = useStore();

  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin' ||
    user?.role?.toLowerCase().replace('_', ' ') === 'super admin';

  // Load data from Supabase with timeout
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        const dataPromise = brainstormService.getAll();
        const data = await Promise.race([dataPromise, timeoutPromise]) as any[];
        if (isMounted) {
          setEntries(data.map(mapDBToLocal));
        }
      } catch (error) {
        logger.warn('Roadmap', 'Failed to load knowledge base:');
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
      setNewEntry({ title: '', description: '', content: '', department: 'general', type: 'note', priority: 'medium', status: 'active', tags: [] });
      setIsCreating(false);
      addNotification('success', 'Entry saved!');
    } catch (error) {
      logger.error('Roadmap', 'Failed to create entry:', error);
      addNotification('alert', 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

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
      logger.error('Roadmap', 'Failed to update entry:', error);
      addNotification('alert', 'Failed to update entry');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    setIsSaving(true);
    try {
      await brainstormService.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      setSelectedEntry(null);
      addNotification('info', 'Entry deleted');
    } catch (error) {
      logger.error('Roadmap', 'Failed to delete entry:', error);
      addNotification('alert', 'Failed to delete entry');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStar = async (entry: KnowledgeEntry) => {
    const newStarred = !entry.isStarred;
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isStarred: newStarred } : e));
    if (selectedEntry?.id === entry.id) {
      setSelectedEntry({ ...selectedEntry, isStarred: newStarred });
    }
    try {
      await brainstormService.update(entry.id, { is_starred: newStarred });
    } catch {
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
    }
  };

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

  const formatDate = (date: string) => formatDateTime(date);
  const formatTime = (date: string) => formatDateTime(date, { showTime: true });

  // Access denied
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
    return (
      <RoadmapDetailView
        selectedEntry={selectedEntry}
        isEditing={isEditing}
        isSaving={isSaving}
        setSelectedEntry={setSelectedEntry}
        setIsEditing={setIsEditing}
        updateEntry={updateEntry}
        deleteEntry={deleteEntry}
        toggleStar={toggleStar}
        onUpdate={setSelectedEntry}
      />
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
            aria-label="Search entries"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          aria-label="Filter by department"
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
          aria-label="Filter by type"
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
                  <div className={`w-12 h-12 rounded-xl ${dept.bgLight} flex items-center justify-center flex-shrink-0`}>
                    <dept.icon size={24} className={dept.text} />
                  </div>
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
                  <ChevronRight size={20} className="text-gray-600 group-hover:text-cyber-primary transition-colors flex-shrink-0" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <RoadmapCreateModal
          newEntry={newEntry}
          setNewEntry={setNewEntry}
          isSaving={isSaving}
          onSave={createEntry}
          onClose={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}
