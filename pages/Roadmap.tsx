import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Link2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Store,
  Warehouse,
  Building2,
  ShoppingCart,
  Truck,
  Users,
  BarChart3,
  Lightbulb,
  Target,
  RefreshCw,
  Star,
  Eye,
  EyeOff,
  Pin,
  ArrowRight,
  Loader2,
  Database,
  Rocket,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { brainstormService, type BrainstormNodeDB } from '../services/supabase.service';

// ============================================================================
// TYPES
// ============================================================================

interface BrainstormNode {
  id: string;
  title: string;
  description: string;
  department: 'stores' | 'warehouses' | 'admin' | 'pos' | 'logistics' | 'hr' | 'finance' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'idea' | 'planning' | 'in-progress' | 'completed';
  x: number;
  y: number;
  connections: string[];
  createdAt: string;
  // Advanced fields
  dueDate?: string | null;
  progress: number;
  tags: string[];
  isStarred: boolean;
  completedAt?: string | null;
  notes?: string;
  color?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEPARTMENTS = {
  stores: { label: 'Stores', icon: Store, color: 'from-emerald-500 to-teal-500', border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500' },
  warehouses: { label: 'Warehouses', icon: Warehouse, color: 'from-blue-500 to-cyan-500', border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500' },
  admin: { label: 'Administration', icon: Building2, color: 'from-purple-500 to-violet-500', border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-500' },
  pos: { label: 'Point of Sale', icon: ShoppingCart, color: 'from-orange-500 to-amber-500', border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-500' },
  logistics: { label: 'Logistics', icon: Truck, color: 'from-rose-500 to-pink-500', border: 'border-rose-500', text: 'text-rose-400', bg: 'bg-rose-500' },
  hr: { label: 'Human Resources', icon: Users, color: 'from-indigo-500 to-blue-500', border: 'border-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500' },
  finance: { label: 'Finance', icon: BarChart3, color: 'from-yellow-500 to-orange-500', border: 'border-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500' },
  general: { label: 'General', icon: Lightbulb, color: 'from-gray-500 to-slate-500', border: 'border-gray-500', text: 'text-gray-400', bg: 'bg-gray-500' }
};

const PRIORITIES = {
  low: { label: 'Low', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  medium: { label: 'Medium', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' }
};

const STATUSES = {
  idea: { label: 'Idea', icon: Lightbulb, color: 'text-yellow-400' },
  planning: { label: 'Planning', icon: Target, color: 'text-blue-400' },
  'in-progress': { label: 'In Progress', icon: RefreshCw, color: 'text-orange-400' },
  completed: { label: 'Completed', icon: Star, color: 'text-green-400' }
};

const NODE_WIDTH = 300;
const NODE_HEIGHT = 160;

// ============================================================================
// HELPER: Map DB to local state
// ============================================================================
const mapDBToLocal = (db: BrainstormNodeDB): BrainstormNode => ({
  id: db.id,
  title: db.title,
  description: db.description,
  department: db.department as BrainstormNode['department'],
  priority: db.priority as BrainstormNode['priority'],
  status: db.status as BrainstormNode['status'],
  x: db.x,
  y: db.y,
  connections: db.connections || [],
  createdAt: db.created_at,
  // Advanced fields
  dueDate: db.due_date || null,
  progress: db.progress || 0,
  tags: db.tags || [],
  isStarred: db.is_starred || false,
  completedAt: db.completed_at || null,
  notes: db.notes || '',
  color: db.color || undefined
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Roadmap() {
  const { addNotification } = useData();
  const { user } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // State
  const [nodes, setNodes] = useState<BrainstormNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [editingNode, setEditingNode] = useState<BrainstormNode | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [showConnections, setShowConnections] = useState(true);

  // New node form
  const [newNode, setNewNode] = useState<Partial<BrainstormNode>>({
    title: '',
    description: '',
    department: 'general',
    priority: 'medium',
    status: 'idea'
  });

  // Check if user is super_admin
  const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin' ||
    user?.role?.toLowerCase().replace('_', ' ') === 'super admin';

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await brainstormService.getAll();
        setNodes(data.map(mapDBToLocal));

        // Load view state from localStorage
        const viewState = brainstormService.getViewState();
        if (viewState) {
          setOffset(viewState.offset);
          setScale(viewState.scale);
        }
      } catch (error) {
        console.error('Failed to load brainstorm data:', error);
        addNotification('alert', 'Failed to load brainstorm data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save view state on change
  useEffect(() => {
    const debounce = setTimeout(() => {
      brainstormService.saveViewState({ offset, scale });
    }, 500);
    return () => clearTimeout(debounce);
  }, [offset, scale]);

  // Create node
  const createNode = async () => {
    if (!newNode.title?.trim()) {
      addNotification('alert', 'Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const nodeData = {
        title: newNode.title,
        description: newNode.description || '',
        department: newNode.department || 'general',
        priority: newNode.priority || 'medium',
        status: newNode.status || 'idea',
        x: (canvasRef.current?.clientWidth || 800) / 2 / scale - offset.x - NODE_WIDTH / 2 + Math.random() * 100 - 50,
        y: (canvasRef.current?.clientHeight || 600) / 2 / scale - offset.y - NODE_HEIGHT / 2 + Math.random() * 100 - 50,
        connections: [],
        created_by: user?.name || 'System'
      };

      const created = await brainstormService.create(nodeData);
      setNodes(prev => [...prev, mapDBToLocal(created)]);
      setNewNode({ title: '', description: '', department: 'general', priority: 'medium', status: 'idea' });
      setIsCreating(false);
      addNotification('success', 'Idea saved to database!');
    } catch (error) {
      console.error('Failed to create node:', error);
      addNotification('alert', 'Failed to save idea. Check if the brainstorm_nodes table exists.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update node position (debounced save)
  const saveNodePosition = useCallback(async (id: string, x: number, y: number) => {
    try {
      await brainstormService.update(id, { x, y });
    } catch (error) {
      console.warn('Failed to save position:', error);
    }
  }, []);

  // Update node
  const updateNode = async (id: string, updates: Partial<BrainstormNode>) => {
    setIsSaving(true);
    try {
      await brainstormService.update(id, {
        title: updates.title,
        description: updates.description,
        department: updates.department,
        priority: updates.priority,
        status: updates.status,
        connections: updates.connections
      });
      setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
      setEditingNode(null);
      addNotification('success', 'Idea updated!');
    } catch (error) {
      console.error('Failed to update node:', error);
      addNotification('alert', 'Failed to update idea');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete node
  const deleteNode = async (id: string) => {
    setIsSaving(true);
    try {
      await brainstormService.delete(id);
      setNodes(prev => prev.filter(n => n.id !== id).map(n => ({
        ...n,
        connections: n.connections.filter(c => c !== id)
      })));
      addNotification('info', 'Idea deleted');
    } catch (error) {
      console.error('Failed to delete node:', error);
      addNotification('alert', 'Failed to delete idea');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle complete
  const quickToggleComplete = async (node: BrainstormNode) => {
    const newStatus = node.status === 'completed' ? 'idea' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
    const progress = newStatus === 'completed' ? 100 : node.progress;

    // Optimistic update
    setNodes(prev => prev.map(n =>
      n.id === node.id ? { ...n, status: newStatus, completedAt, progress } : n
    ));

    try {
      await brainstormService.update(node.id, {
        status: newStatus,
        completed_at: completedAt,
        progress
      });
      addNotification('success', newStatus === 'completed' ? '✅ Marked complete!' : 'Reopened idea');
    } catch (error) {
      // Rollback on error
      setNodes(prev => prev.map(n => n.id === node.id ? node : n));
      addNotification('alert', 'Failed to update');
    }
  };

  // Quick toggle star
  const quickToggleStar = async (node: BrainstormNode) => {
    const newStarred = !node.isStarred;

    // Optimistic update
    setNodes(prev => prev.map(n =>
      n.id === node.id ? { ...n, isStarred: newStarred } : n
    ));

    try {
      await brainstormService.update(node.id, { is_starred: newStarred });
    } catch (error) {
      // Rollback on error
      setNodes(prev => prev.map(n => n.id === node.id ? node : n));
    }
  };

  // Quick update progress
  const quickUpdateProgress = async (node: BrainstormNode, progress: number) => {
    setNodes(prev => prev.map(n =>
      n.id === node.id ? { ...n, progress } : n
    ));
    try {
      await brainstormService.update(node.id, { progress });
    } catch (error) {
      console.warn('Failed to save progress');
    }
  };

  // Connect nodes
  const connectNodes = async (toId: string) => {
    if (!connectingFrom || connectingFrom === toId) {
      setConnectingFrom(null);
      return;
    }

    const fromNode = nodes.find(n => n.id === connectingFrom);
    if (!fromNode || fromNode.connections.includes(toId)) {
      setConnectingFrom(null);
      return;
    }

    const newConnections = [...fromNode.connections, toId];

    try {
      await brainstormService.update(connectingFrom, { connections: newConnections });
      setNodes(prev => prev.map(n =>
        n.id === connectingFrom ? { ...n, connections: newConnections } : n
      ));
      addNotification('success', 'Ideas connected!');
    } catch (error) {
      console.error('Failed to connect:', error);
    }
    setConnectingFrom(null);
  };

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x * scale, y: e.clientY - offset.y * scale });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: (e.clientX - panStart.x) / scale,
        y: (e.clientY - panStart.y) / scale
      });
    }
    if (draggingNode) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left) / scale - offset.x - dragOffset.x;
        const y = (e.clientY - rect.top) / scale - offset.y - dragOffset.y;
        setNodes(prev => prev.map(n => n.id === draggingNode ? { ...n, x, y } : n));
      }
    }
  }, [isPanning, panStart, scale, draggingNode, dragOffset, offset]);

  const handleMouseUp = useCallback(() => {
    if (draggingNode) {
      const node = nodes.find(n => n.id === draggingNode);
      if (node) {
        saveNodePosition(node.id, node.x, node.y);
      }
    }
    setIsPanning(false);
    setDraggingNode(null);
  }, [draggingNode, nodes, saveNodePosition]);

  // Node drag handlers
  const startDragNode = (e: React.MouseEvent, node: BrainstormNode) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDraggingNode(node.id);
      setDragOffset({
        x: (e.clientX - rect.left) / scale - offset.x - node.x,
        y: (e.clientY - rect.top) / scale - offset.y - node.y
      });
    }
  };

  // Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(2, Math.max(0.3, prev * delta)));
  };

  // Reset view
  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Filter nodes
  const visibleNodes = nodes.filter(n => {
    if (filterDepartment !== 'all' && n.department !== filterDepartment) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Get all connections
  const allConnections: { from: string; to: string }[] = [];
  nodes.forEach(node => {
    node.connections.forEach(toId => {
      if (visibleNodes.find(n => n.id === toId)) {
        allConnections.push({ from: node.id, to: toId });
      }
    });
  });

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
            The Brainstorm Canvas is exclusively available to <span className="text-cyber-primary font-bold">Super Administrators</span>.
          </p>
          <p className="text-sm text-gray-500">
            Current role: <span className="text-white">{user?.role || 'Unknown'}</span>
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
          <p className="text-gray-400">Loading brainstorm canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Rocket className="text-cyber-primary" />
            Brainstorm Canvas
            <span className="text-xs bg-cyber-primary/20 text-cyber-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Database size={10} /> Synced
            </span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {nodes.length} ideas • {allConnections.length} connections • Super Admin Only
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 size={16} className="text-cyber-primary animate-spin" />}
          <button
            onClick={() => setShowConnections(!showConnections)}
            className={`p-2 rounded-lg transition-all ${showConnections ? 'bg-cyber-primary/20 text-cyber-primary' : 'bg-white/5 text-gray-400'}`}
            title="Toggle connections"
          >
            {showConnections ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" title="Zoom in">
            <ZoomIn size={18} />
          </button>
          <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" title="Zoom out">
            <ZoomOut size={18} />
          </button>
          <button onClick={resetView} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" title="Reset view">
            <Maximize2 size={18} />
          </button>
          <span className="text-xs text-gray-500 font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-cyber-primary text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-cyber-accent transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] flex items-center gap-2"
          >
            <Plus size={18} />
            New Idea
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <input
            type="text"
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cyber-gray border border-white/10 rounded-lg pl-4 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyber-primary/50 focus:outline-none"
            aria-label="Search ideas"
          />
        </div>
        <button
          onClick={() => setFilterDepartment('all')}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filterDepartment === 'all' ? 'bg-cyber-primary text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          All
        </button>
        {Object.entries(DEPARTMENTS).map(([key, dept]) => (
          <button
            key={key}
            onClick={() => setFilterDepartment(key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${filterDepartment === key ? `bg-gradient-to-r ${dept.color} text-white` : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            title={`Filter by ${dept.label}`}
          >
            <dept.icon size={12} />
            <span className="hidden md:inline">{dept.label}</span>
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyber-gray via-black to-cyber-gray cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid background */}
        <div
          className="canvas-bg absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(0,255,157,0.03) 1px, transparent 0),
              linear-gradient(to right, rgba(0,255,157,0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,255,157,0.02) 1px, transparent 1px)
            `,
            backgroundSize: `${40 * scale}px ${40 * scale}px, ${200 * scale}px ${200 * scale}px, ${200 * scale}px ${200 * scale}px`,
            backgroundPosition: `${offset.x * scale}px ${offset.y * scale}px`
          }}
        />

        {/* SVG Connections */}
        {showConnections && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(0, 255, 157, 0.6)" />
              </marker>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0, 255, 157, 0.3)" />
                <stop offset="100%" stopColor="rgba(0, 255, 157, 0.6)" />
              </linearGradient>
            </defs>
            {allConnections.map((conn, i) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              const fromX = (fromNode.x + NODE_WIDTH / 2 + offset.x) * scale;
              const fromY = (fromNode.y + NODE_HEIGHT / 2 + offset.y) * scale;
              const toX = (toNode.x + NODE_WIDTH / 2 + offset.x) * scale;
              const toY = (toNode.y + NODE_HEIGHT / 2 + offset.y) * scale;

              const midX = (fromX + toX) / 2;
              const curvature = Math.abs(toX - fromX) * 0.2;

              return (
                <g key={i}>
                  <path
                    d={`M ${fromX} ${fromY} Q ${midX} ${fromY - curvature} ${toX} ${toY}`}
                    stroke="url(#connectionGradient)"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="transition-all duration-300"
                  />
                  <circle cx={fromX} cy={fromY} r="5" fill="rgba(0, 255, 157, 0.4)" />
                  <circle cx={fromX} cy={fromY} r="3" fill="rgba(0, 255, 157, 0.8)" />
                </g>
              );
            })}
          </svg>
        )}

        {/* Nodes */}
        {visibleNodes.map(node => {
          const dept = DEPARTMENTS[node.department];
          const priority = PRIORITIES[node.priority];
          const status = STATUSES[node.status];
          const isCompleted = node.status === 'completed';

          return (
            <div
              key={node.id}
              className={`absolute group cursor-move select-none ${connectingFrom === node.id ? 'ring-2 ring-cyber-primary ring-offset-2 ring-offset-black z-50' : ''} ${isCompleted ? 'opacity-75' : ''}`}
              style={{
                left: (node.x + offset.x) * scale,
                top: (node.y + offset.y) * scale,
                width: NODE_WIDTH * scale,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
              onMouseDown={(e) => {
                if (connectingFrom && connectingFrom !== node.id) {
                  connectNodes(node.id);
                } else {
                  startDragNode(e, node);
                }
              }}
            >
              <div className={`bg-gradient-to-br from-cyber-gray via-black to-cyber-gray border-2 ${isCompleted ? 'border-green-500/40' : dept.border + '/40'} rounded-2xl p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(0,255,157,0.1)] transition-all duration-300 hover:border-opacity-80 ${connectingFrom && connectingFrom !== node.id ? 'hover:ring-2 hover:ring-green-400 hover:scale-105' : 'hover:scale-102'} ${isCompleted ? 'bg-green-900/10' : ''}`}>

                {/* Star & Complete indicators */}
                <div className="absolute -top-2 -left-2 flex gap-1">
                  {node.isStarred && (
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg border-2 border-black">
                      <Star size={12} className="text-black fill-black" />
                    </div>
                  )}
                </div>
                {isCompleted && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-black">
                    <Star size={14} className="text-black" />
                  </div>
                )}

                {/* Department badge & Priority */}
                <div className="flex items-start justify-between mb-2">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-lg bg-gradient-to-r ${dept.color}/30 border border-white/10`}>
                    <dept.icon size={12} className={dept.text} />
                    <span className={`text-[10px] font-bold uppercase ${dept.text}`}>{dept.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${priority.color}`}>
                    {priority.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className={`text-white font-bold text-sm mb-1 line-clamp-1 ${isCompleted ? 'line-through opacity-70' : ''}`}>{node.title}</h3>
                <p className="text-gray-400 text-xs line-clamp-2 mb-3 min-h-[32px]">{node.description || 'No description'}</p>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-gray-500 uppercase font-bold">Progress</span>
                    <span className={`text-[10px] font-bold ${node.progress >= 100 ? 'text-green-400' : 'text-gray-400'}`}>{node.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${node.progress >= 100 ? 'bg-green-500' : node.progress >= 50 ? 'bg-cyber-primary' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, node.progress)}%` }}
                    />
                  </div>
                </div>

                {/* Status & Quick Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className={`flex items-center gap-2 ${status.color}`}>
                    <status.icon size={12} />
                    <span className="text-[10px] font-medium">{status.label}</span>
                  </div>

                  <div className="flex gap-1">
                    {/* Quick Complete Toggle - Always visible */}
                    <button
                      onClick={(e) => { e.stopPropagation(); quickToggleComplete(node); }}
                      className={`p-1.5 rounded-lg transition-all ${isCompleted ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-green-500/20 hover:text-green-400'}`}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark complete'}
                    >
                      <Star size={12} className={isCompleted ? 'fill-current' : ''} />
                    </button>
                    {/* Quick Star Toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); quickToggleStar(node); }}
                      className={`p-1.5 rounded-lg transition-all ${node.isStarred ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400'}`}
                      title={node.isStarred ? 'Unstar' : 'Star this idea'}
                    >
                      <Pin size={12} />
                    </button>
                    {/* Other actions on hover */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConnectingFrom(connectingFrom === node.id ? null : node.id); }}
                        className={`p-1.5 rounded-lg transition-colors ${connectingFrom === node.id ? 'bg-cyber-primary text-black' : 'bg-white/10 text-gray-400 hover:text-cyber-primary hover:bg-white/20'}`}
                        title="Connect to another idea"
                      >
                        <Link2 size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingNode(node); }}
                        className="p-1.5 bg-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
                        title="Edit idea"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                        className="p-1.5 bg-white/10 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete idea"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Connection count badge */}
                {node.connections.length > 0 && (
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-cyber-primary text-black text-xs font-bold flex items-center justify-center shadow-lg border-2 border-black">
                    {node.connections.length}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-primary/20 to-transparent flex items-center justify-center mx-auto mb-6 border border-cyber-primary/30">
                <Lightbulb size={40} className="text-cyber-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Start Brainstorming</h3>
              <p className="text-gray-400 mb-6">
                Create your first idea and connect them visually. Your canvas syncs automatically to the cloud.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-cyber-primary text-black px-6 py-3 rounded-xl font-bold hover:bg-cyber-accent transition-all flex items-center gap-2 mx-auto shadow-[0_0_30px_rgba(0,255,157,0.3)]"
              >
                <Plus size={20} />
                Create Your First Idea
              </button>
            </div>
          </div>
        )}

        {/* Connection mode indicator */}
        {connectingFrom && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyber-primary text-black px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-3 shadow-2xl z-50 border-2 border-white/20">
            <Link2 size={18} className="animate-pulse" />
            Click another idea to connect
            <button onClick={() => setConnectingFrom(null)} className="p-1.5 bg-black/20 rounded-lg hover:bg-black/40 transition-colors" aria-label="Cancel Connection">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {
        isCreating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-cyber-gray border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lightbulb className="text-cyber-primary" />
                  New Idea
                </h3>
                <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white" title="Close">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Title *</label>
                  <input
                    type="text"
                    placeholder="What's your idea?"
                    value={newNode.title}
                    onChange={(e) => setNewNode({ ...newNode, title: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyber-primary/50 focus:outline-none"
                    autoFocus
                    aria-label="Idea title"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Description</label>
                  <textarea
                    placeholder="Describe your idea in detail..."
                    value={newNode.description}
                    onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
                    rows={4}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyber-primary/50 focus:outline-none resize-none"
                    aria-label="Idea description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Department</label>
                    <select
                      value={newNode.department}
                      onChange={(e) => setNewNode({ ...newNode, department: e.target.value as BrainstormNode['department'] })}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-cyber-primary/50"
                      aria-label="Select department"
                    >
                      {Object.entries(DEPARTMENTS).map(([key, dept]) => (
                        <option key={key} value={key}>{dept.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Priority</label>
                    <select
                      value={newNode.priority}
                      onChange={(e) => setNewNode({ ...newNode, priority: e.target.value as BrainstormNode['priority'] })}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-cyber-primary/50"
                      aria-label="Select priority"
                    >
                      {Object.entries(PRIORITIES).map(([key, p]) => (
                        <option key={key} value={key}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Status</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(STATUSES).map(([key, s]) => (
                      <button
                        key={key}
                        onClick={() => setNewNode({ ...newNode, status: key as BrainstormNode['status'] })}
                        className={`py-2.5 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${newNode.status === key ? 'bg-white/20 text-white ring-2 ring-cyber-primary' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        title={s.label}
                      >
                        <s.icon size={16} className={s.color} />
                        <span className="text-[10px]">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setIsCreating(false)} className="px-6 py-2.5 text-gray-400 hover:text-white font-medium">
                  Cancel
                </button>
                <button
                  onClick={createNode}
                  disabled={isSaving}
                  className="bg-cyber-primary text-black px-6 py-2.5 rounded-xl font-bold hover:bg-cyber-accent transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save to Cloud
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Modal */}
      {
        editingNode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-cyber-gray border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit3 className="text-cyber-primary" />
                  Edit Idea
                </h3>
                <button onClick={() => setEditingNode(null)} className="text-gray-400 hover:text-white" title="Close">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Title</label>
                  <input
                    type="text"
                    value={editingNode.title}
                    onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary/50 focus:outline-none"
                    aria-label="Edit idea title"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Description</label>
                  <textarea
                    value={editingNode.description}
                    onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                    rows={4}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyber-primary/50 focus:outline-none resize-none"
                    aria-label="Edit idea description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Department</label>
                    <select
                      value={editingNode.department}
                      onChange={(e) => setEditingNode({ ...editingNode, department: e.target.value as BrainstormNode['department'] })}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none"
                      aria-label="Edit department"
                    >
                      {Object.entries(DEPARTMENTS).map(([key, dept]) => (
                        <option key={key} value={key}>{dept.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Priority</label>
                    <select
                      value={editingNode.priority}
                      onChange={(e) => setEditingNode({ ...editingNode, priority: e.target.value as BrainstormNode['priority'] })}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none"
                      aria-label="Edit priority"
                    >
                      {Object.entries(PRIORITIES).map(([key, p]) => (
                        <option key={key} value={key}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Status</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(STATUSES).map(([key, s]) => (
                      <button
                        key={key}
                        onClick={() => setEditingNode({ ...editingNode, status: key as BrainstormNode['status'] })}
                        className={`py-2.5 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${editingNode.status === key ? 'bg-white/20 text-white ring-2 ring-cyber-primary' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        title={s.label}
                      >
                        <s.icon size={16} className={s.color} />
                        <span className="text-[10px]">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Connections */}
                {editingNode.connections.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Connections ({editingNode.connections.length})</label>
                    <div className="flex flex-wrap gap-2">
                      {editingNode.connections.map(connId => {
                        const connNode = nodes.find(n => n.id === connId);
                        if (!connNode) return null;
                        return (
                          <div key={connId} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm border border-white/10">
                            <ArrowRight size={12} className="text-cyber-primary" />
                            <span className="text-gray-300">{connNode.title}</span>
                            <button
                              onClick={() => {
                                setEditingNode({
                                  ...editingNode,
                                  connections: editingNode.connections.filter(c => c !== connId)
                                });
                              }}
                              className="text-gray-500 hover:text-red-400 transition-colors"
                              title="Remove connection"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setEditingNode(null)} className="px-6 py-2.5 text-gray-400 hover:text-white font-medium">
                  Cancel
                </button>
                <button
                  onClick={() => updateNode(editingNode.id, editingNode)}
                  disabled={isSaving}
                  className="bg-cyber-primary text-black px-6 py-2.5 rounded-xl font-bold hover:bg-cyber-accent transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
