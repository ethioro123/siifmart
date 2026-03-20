import { supabase } from '../lib/supabase';
import type { Supplier } from '../types';

export const suppliersService = {
    async getAll(limit: number = 50, offset: number = 0) {
        const { data, error, count } = await supabase
            .from('suppliers')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        const mappedData = data.map((s: any) => ({
            ...s,
            leadTime: s.lead_time,
            taxId: s.tax_id,
            nationalId: s.national_id
        }));

        return { data: mappedData, count: count || 0 };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async create(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
        const dbSupplier = {
            name: supplier.name,
            type: supplier.type,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            category: supplier.category,
            status: supplier.status,
            rating: supplier.rating,
            lead_time: supplier.leadTime,
            tax_id: supplier.taxId,
            national_id: supplier.nationalId,
            location: supplier.location
        };
        const { data, error } = await supabase
            .from('suppliers')
            .insert(dbSupplier)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async update(id: string, updates: Partial<Supplier>) {
        const dbUpdates: any = { ...updates };
        if (updates.leadTime !== undefined) { dbUpdates.lead_time = updates.leadTime; delete dbUpdates.leadTime; }
        if (updates.taxId !== undefined) { dbUpdates.tax_id = updates.taxId; delete dbUpdates.taxId; }
        if (updates.nationalId !== undefined) { dbUpdates.national_id = updates.nationalId; delete dbUpdates.nationalId; }

        const { data, error } = await supabase
            .from('suppliers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
