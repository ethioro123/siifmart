import { supabase } from '../lib/supabase';

export const systemLogsService = {
    async create(log: {
        user_name: string;
        action: string;
        details?: string;
        module: string;
        ip_address?: string;
    }) {
        const { data: { user } } = await supabase.auth.getUser();

        // Map frontend log properties to actual Supabase system_logs database schema columns
        const dbLog = {
            user_id: user?.id || null,
            action: log.action,
            details: log.details ? `${log.user_name}: ${log.details}` : log.user_name,
            module: log.module,
            ip: log.ip_address || null
        };

        const { data, error } = await supabase
            .from('system_logs')
            .insert(dbLog)
            .select('*');

        if (error) throw error;
        
        const createdRow = data && data[0] ? data[0] : null;

        return {
            id: createdRow?.id || crypto.randomUUID(),
            created_at: createdRow?.timestamp || new Date().toISOString(),
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
            // Order by timestamp since created_at does not exist in public.system_logs table
            .order('timestamp', { ascending: false })
            .limit(100);

        if (module) {
            query = query.eq('module', module);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        return data.map((l: any) => {
            // Parse username back from details if formatted as "UserName: Details"
            let userName = 'System';
            let details = l.details || '';
            const colonIndex = details.indexOf(': ');
            if (colonIndex > 0) {
                userName = details.substring(0, colonIndex);
                details = details.substring(colonIndex + 2);
            }

            return {
                id: l.id,
                created_at: l.timestamp,
                user_name: userName,
                action: l.action,
                details: details,
                module: l.module,
                ip_address: l.ip
            };
        });
    }
};
