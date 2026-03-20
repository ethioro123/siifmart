import { supabase } from '../lib/supabase';

export const systemLogsService = {
    async create(log: {
        user_name: string;
        action: string;
        details?: string;
        module: string;
        ip_address?: string;
    }) {
        const { data, error } = await supabase
            .from('system_logs')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAll(module?: string) {
        let query = supabase
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (module) {
            query = query.eq('module', module);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((l: any) => ({
            ...l,
            userName: l.user_name,
            ip: l.ip_address
        }));
    }
};
