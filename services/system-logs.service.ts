import { supabase } from '../lib/supabase';

export const systemLogsService = {
    async create(log: {
        user_name: string;
        action: string;
        details?: string;
        module: string;
        ip_address?: string;
    }) {


        // Map frontend log properties to actual Supabase system_logs database schema columns
        // Actual columns: id, user_name (NOT NULL), action, details, module, ip_address, created_at
        const dbLog = {
            user_name: log.user_name,
            action: log.action,
            details: log.details || null,
            module: log.module,
            ip_address: log.ip_address || null
        };

        const { error } = await supabase
            .from('system_logs')
            .insert(dbLog);

        if (error) throw error;

        return {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            user_name: log.user_name,
            action: log.action,
            details: log.details || '',
            module: log.module,
            ip_address: log.ip_address || null
        };
    },

    async getAll(module?: string) {
        let query = supabase
            .from('system_logs')
            .select('*')
            // Order by created_at which is the actual timestamp column in public.system_logs table
            .order('created_at', { ascending: false })
            .limit(100);

        if (module) {
            query = query.eq('module', module);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        return data.map((l: any) => ({
            id: l.id,
            created_at: l.created_at,
            user_name: l.user_name || 'System',
            action: l.action,
            details: l.details || '',
            module: l.module,
            ip_address: l.ip_address
        }));
    }
};
