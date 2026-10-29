import {
  Store, Warehouse, Building2, ShoppingCart, Truck,
  Users, BarChart3, Lightbulb, Target, Star,
  FileText, BookOpen
} from 'lucide-react';
import type { BrainstormNodeDB } from '../../services/supabase.service';

// ============================================================================
// TYPES
// ============================================================================

export interface KnowledgeEntry {
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

export const DEPARTMENTS = {
  stores: { label: 'Stores', icon: Store, color: 'bg-[var(--theme-status-success-bg)]', text: 'text-[var(--theme-status-success-text)]', bgLight: 'bg-[var(--theme-status-success-bg)]' },
  warehouses: { label: 'Warehouses', icon: Warehouse, color: 'bg-[var(--theme-status-info-bg)]', text: 'text-[var(--theme-status-info-text)]', bgLight: 'bg-[var(--theme-status-info-bg)]' },
  admin: { label: 'Administration', icon: Building2, color: 'bg-purple-500', text: 'text-purple-400', bgLight: 'bg-purple-500/20' },
  pos: { label: 'Point of Sale', icon: ShoppingCart, color: 'bg-orange-500', text: 'text-orange-400', bgLight: 'bg-orange-500/20' },
  logistics: { label: 'Logistics', icon: Truck, color: 'bg-[var(--theme-status-danger-bg)]', text: 'text-[var(--theme-status-danger-text)]', bgLight: 'bg-[var(--theme-status-danger-bg)]' },
  hr: { label: 'Human Resources', icon: Users, color: 'bg-indigo-500', text: 'text-indigo-400', bgLight: 'bg-indigo-500/20' },
  finance: { label: 'Finance', icon: BarChart3, color: 'bg-[var(--theme-status-warning-bg)]', text: 'text-[var(--theme-status-warning-text)]', bgLight: 'bg-[var(--theme-status-warning-bg)]' },
  general: { label: 'General', icon: Lightbulb, color: 'bg-gray-500', text: 'text-gray-400', bgLight: 'bg-gray-500/20' },
  policy: { label: 'Policy', icon: FileText, color: 'bg-cyan-500', text: 'text-cyan-400', bgLight: 'bg-cyan-500/20' },
  workflow: { label: 'Workflow', icon: Target, color: 'bg-pink-500', text: 'text-pink-400', bgLight: 'bg-pink-500/20' }
};

export const ENTRY_TYPES = {
  idea: { label: 'Idea', icon: Lightbulb, color: 'text-[var(--theme-status-warning-text)]', bg: 'bg-[var(--theme-status-warning-bg)]' },
  policy: { label: 'Policy', icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  workflow: { label: 'Workflow', icon: Target, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  note: { label: 'Note', icon: BookOpen, color: 'text-[var(--theme-status-info-text)]', bg: 'bg-[var(--theme-status-info-bg)]' },
  improvement: { label: 'Improvement', icon: Star, color: 'text-[var(--theme-status-success-text)]', bg: 'bg-[var(--theme-status-success-bg)]' }
};

export const STATUSES = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  active: { label: 'Active', color: 'text-[var(--theme-status-success-text)]', bg: 'bg-[var(--theme-status-success-bg)]' },
  archived: { label: 'Archived', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  implemented: { label: 'Implemented', color: 'text-cyan-400', bg: 'bg-cyan-500/20' }
};

// ============================================================================
// HELPER: Map DB to local state
// ============================================================================
export const mapDBToLocal = (db: BrainstormNodeDB): KnowledgeEntry => ({
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
