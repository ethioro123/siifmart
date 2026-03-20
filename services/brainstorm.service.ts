import { supabase } from '../lib/supabase';


export interface BrainstormNodeDB {
    id: string;
    title: string;
    description: string;
    department: string;
    priority: string;
    status: string;
    x: number;
    y: number;
    connections: string[];
    created_at: string;
    updated_at: string;
    created_by: string;
    // Advanced fields
    due_date?: string | null;
    progress?: number;
    tags?: string[];
    is_starred?: boolean;
    completed_at?: string | null;
    notes?: string;
    color?: string;
}

export const brainstormService = {
    async getAll(): Promise<BrainstormNodeDB[]> {
        const { data, error } = await supabase
            .from('brainstorm_nodes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Table might not exist yet - return empty array
            console.warn('brainstorm_nodes table may not exist:', error);
            return [];
        }
        return data || [];
    },

    async create(node: Omit<BrainstormNodeDB, 'id' | 'created_at' | 'updated_at'>): Promise<BrainstormNodeDB> {
        const { data, error } = await supabase
            .from('brainstorm_nodes')
            .insert({
                title: node.title,
                description: node.description,
                notes: node.notes,
                department: node.department,
                priority: node.priority,
                status: node.status,
                tags: node.tags,
                is_starred: node.is_starred,
                x: node.x,
                y: node.y,
                connections: node.connections,
                created_by: node.created_by,
                due_date: node.due_date,
                progress: node.progress,
                completed_at: node.completed_at,
                color: node.color
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<BrainstormNodeDB>): Promise<BrainstormNodeDB> {
        const { data, error } = await supabase
            .from('brainstorm_nodes')
            .update({
                title: updates.title,
                description: updates.description,
                notes: updates.notes,
                department: updates.department,
                priority: updates.priority,
                status: updates.status,
                tags: updates.tags,
                is_starred: updates.is_starred,
                x: updates.x,
                y: updates.y,
                connections: updates.connections,
                due_date: updates.due_date,
                progress: updates.progress,
                completed_at: updates.completed_at,
                color: updates.color,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        // First, remove this node from all connections
        const { data: allNodes } = await supabase
            .from('brainstorm_nodes')
            .select('id, connections');

        if (allNodes) {
            for (const node of allNodes) {
                if (node.connections?.includes(id)) {
                    await supabase
                        .from('brainstorm_nodes')
                        .update({ connections: node.connections.filter((c: string) => c !== id) })
                        .eq('id', node.id);
                }
            }
        }

        const { error } = await supabase
            .from('brainstorm_nodes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async saveViewState(state: { offset: { x: number; y: number }; scale: number }): Promise<void> {
        // Save view state to localStorage as fallback (per-user preference)
        localStorage.setItem('siifmart_brainstorm_view', JSON.stringify(state));
    },

    getViewState(): { offset: { x: number; y: number }; scale: number } | null {
        try {
            const saved = localStorage.getItem('siifmart_brainstorm_view');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    }
};
