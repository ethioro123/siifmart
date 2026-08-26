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
            user_name: (log.user_name && String(log.user_name).trim()) || 'System',
            action: (log.action && String(log.action).trim()) || 'SYSTEM_EVENT',
            details: log.details || null,
            module: (log.module && String(log.module).trim()) || 'General',
            ip_address: log.ip_address || null
        };

        try {
            const { error } = await supabase
                .from('system_logs')
                .insert(dbLog);

            if (error) {
                // Non-blocking failure
            }
        } catch {
            // Non-blocking failure
        }

        return {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            user_name: dbLog.user_name,
            action: dbLog.action,
            details: dbLog.details || '',
            module: dbLog.module,
            ip_address: dbLog.ip_address || null
        };
    },

    async getAll(module?: string) {
        try {
            let query = supabase
                .from('system_logs')
                .select('id, user_name, action, details, module, ip_address, created_at')
                .order('created_at', { ascending: false })
                .limit(100);

            if (module) {
                query = query.eq('module', module);
            }

            const { data, error } = await query;
            if (error) {
                return [];
            }

            return (data || []).map((l: any) => ({
                id: l.id,
                created_at: l.created_at,
                user_name: l.user_name || 'System',
                action: l.action,
                details: l.details || '',
                module: l.module,
                ip_address: l.ip_address || null
            }));
        } catch {
            return [];
        }
    },
};
