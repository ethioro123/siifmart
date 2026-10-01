import { supabase } from '../lib/supabase';
import type { ExpenseRecord } from '../types';

export const expensesService = {
    async getAll(siteId?: string, limit: number = 50, offset: number = 0, filters?: { startDate?: string; endDate?: string; category?: string; status?: string; search?: string }) {
        let query = supabase
            .from('expenses')
            .select('*', { count: 'exact' })
            .order('expense_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        if (filters?.startDate) {
            query = query.gte('expense_date', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('expense_date', filters.endDate);
        }

        if (filters?.category && filters.category !== 'All') {
            query = query.eq('category', filters.category);
        }

        if (filters?.status && filters.status !== 'All') {
            query = query.eq('status', filters.status);
        }

        if (filters?.search) {
            query = query.ilike('description', `%${filters.search}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((e: any) => ({
            ...e,
            siteId: e.site_id,
            date: e.expense_date,
            approvedBy: e.approved_by
        }));

        return { data: mappedData, count: count || 0 };
    },

    async create(expense: Omit<ExpenseRecord, 'id' | 'created_at' | 'updated_at'>) {
        const dbExpense = {
            site_id: expense.siteId,
            expense_date: expense.date,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            status: expense.status,
            approved_by: expense.approvedBy
        };
        const { data, error } = await supabase
            .from('expenses')
            .insert(dbExpense)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.expense_date,
            approvedBy: data.approved_by
        };
    },

    async update(id: string, updates: Partial<ExpenseRecord>) {
        const dbUpdates: Record<string, any> = {};
        if (updates.siteId !== undefined) dbUpdates.site_id = updates.siteId;
        if (updates.date !== undefined) dbUpdates.expense_date = updates.date;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy;

        const { data, error } = await supabase
            .from('expenses')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.expense_date,
            approvedBy: data.approved_by
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // NEW: Server-Side Financial Analytics with Multi-Country Tenant Isolation
    async getFinancialMetrics(siteId?: string, startDate?: string, endDate?: string, countryCode?: string) {
        // Construct params with explicit country isolation
        const params: Record<string, any> = {
            p_country_code: countryCode || 'ET'
        };
        if (siteId && siteId !== 'All') params.p_site_id = siteId;
        if (startDate) params.p_start_date = startDate;
        if (endDate) params.p_end_date = endDate;

        const { data, error } = await supabase
            .rpc('get_financial_metrics', params);

        if (error) throw error;
        return data;
    }
};
