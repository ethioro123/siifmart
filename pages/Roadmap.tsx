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
import { DEFAULT_ROADMAP_POLICIES } from '../components/roadmap/defaultRoadmapPolicies';
import { RoadmapDetailView } from '../components/roadmap/RoadmapDetailView';
import { RoadmapCreateModal } from '../components/roadmap/RoadmapCreateModal';
import { logger } from '../utils/logger';

export default function Roadmap() {
  const { addNotification } = useData();
  const { user } = useStore();

  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
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
          const dbEntries = (data || []).map(mapDBToLocal);
          const normalize = (t: string) => (t || '').toLowerCase().replace(/\s*\(sop-[a-z0-9-]+\)\s*/i, '').replace(/[^a-z0-9]/g, '');
          const combined = [...dbEntries];

          DEFAULT_ROADMAP_POLICIES.forEach(dp => {
            const existingIdx = combined.findIndex(e =>
              e.id === dp.id ||
              normalize(e.title) === normalize(dp.title) ||
              (e.title && dp.title && (e.title.toLowerCase().includes(dp.title.toLowerCase()) || dp.title.toLowerCase().includes(e.title.toLowerCase())))
            );

            if (existingIdx !== -1) {
              const existing = combined[existingIdx];
              const needsEnrichment = !existing.description ||
                existing.description.trim() === 'No description' ||
                !existing.content ||
                existing.content.length < 50;

              if (needsEnrichment) {
                const enriched: KnowledgeEntry = {
                  ...existing,
                  description: existing.description && existing.description !== 'No description' ? existing.description : dp.description,
                  content: existing.content && existing.content.length >= 50 ? existing.content : dp.content,
                  department: dp.department || existing.department,
                  type: dp.type || existing.type,
                  priority: dp.priority || existing.priority,
                  tags: Array.from(new Set([...(existing.tags || []), ...(dp.tags || [])]))
                };
                combined[existingIdx] = enriched;

                brainstormService.update(existing.id, {
                  description: enriched.description,
                  notes: enriched.content,
                  department: enriched.department,
                  priority: enriched.priority,
                  tags: enriched.tags
                }).catch(() => {});
              }
            } else {
              combined.push(dp);
            }
          });
          setEntries(combined);
        }
      } catch (error) {
        logger.warn('Roadmap', 'Failed to load knowledge base from Supabase, loading default policies:');
        if (isMounted) {
          setIsUsingFallback(true);
          setEntries(DEFAULT_ROADMAP_POLICIES);
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
          <div className="w-24 h-24 rounded-full bg-[var(--theme-status-danger-bg)] flex items-center justify-center mx-auto mb-6">
            <Shield size={48} className="text-[var(--theme-status-danger)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-3">Access restricted</h2>
          <p className="text-[var(--theme-text-secondary)] mb-6">
            The Knowledge Base is available to CEOs.
          </p>
          <p className="text-sm text-[var(--theme-text-muted)]">
            Current role: <span className="text-[var(--theme-text-primary)]">{formatRole(user?.role) || 'Unknown'}</span>
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
          <Loader2 size={40} className="text-[var(--theme-accent)] animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-[var(--theme-text-secondary)]" role="status">Loading knowledge base…</p>
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
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] flex items-center gap-3">
            <BookOpen className="text-[var(--theme-accent)]" />
            Knowledge Base
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${isUsingFallback ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning)]' : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success)]'}`}>
              <Database size={12} aria-hidden="true" /> {isUsingFallback ? 'Default policies' : 'Connected'}
            </span>
          </h2>
          <p className="text-[var(--theme-text-secondary)] text-sm mt-1">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · Policies, ideas, workflows, and notes
          </p>
          {isUsingFallback && <p className="mt-2 text-sm text-[var(--theme-status-warning)]" role="status">Showing default policies because the knowledge base service could not be reached.</p>}
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="min-h-11 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[var(--theme-primary-hover)] transition-colors flex items-center gap-2 self-start md:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-app)]"
        >
          <Plus size={18} />
          New Entry
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-11 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl pl-11 pr-4 py-3 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
            aria-label="Search entries"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          aria-label="Filter by department"
          className="min-h-11 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] min-w-[150px]"
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
          className="min-h-11 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] min-w-[150px]"
        >
          <option value="all">All Types</option>
          {Object.entries(ENTRY_TYPES).map(([key, t]) => (
            <option key={key} value={key}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Entries List */}
      {(searchQuery || filterDepartment !== 'all' || filterType !== 'all') && (
        <div className="flex items-center justify-between gap-3 mb-3 text-sm">
          <p className="text-[var(--theme-text-secondary)]" role="status">Showing {filteredEntries.length} of {entries.length} entries</p>
          <button type="button" onClick={() => { setSearchQuery(''); setFilterDepartment('all'); setFilterType('all'); }} className="min-h-11 px-3 text-[var(--theme-accent)] hover:bg-[var(--theme-accent-muted)] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Clear filters</button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl">
            <BookOpen size={40} className="mx-auto mb-4 text-[var(--theme-text-muted)]" aria-hidden="true" />
            <p className="text-[var(--theme-text-primary)] font-semibold">{entries.length === 0 ? 'No entries yet' : 'No matching entries'}</p>
            <p className="text-[var(--theme-text-secondary)] text-sm mt-1">{entries.length === 0 ? 'Create an entry to capture a policy, idea, workflow, or note.' : 'Try another search or clear your filters.'}</p>
          </div>
        ) : (
          filteredEntries.map(entry => {
            const dept = DEPARTMENTS[entry.department];
            const entryType = ENTRY_TYPES[entry.type];

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedEntry(entry)}
                className="w-full min-h-11 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 text-left transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
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
