import { supabase } from '../lib/supabase';
import type { Customer } from '../types';

export const customersService = {
    async getAll(limit?: number) {
        let query = supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((c: any) => ({
            ...c,
            loyaltyPoints: c.loyalty_points || 0,
            totalSpent: c.total_spent || 0,
            lastVisit: c.last_visit
        }));
    },

    async search(term: string, limit: number = 20) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
            .limit(limit);

        if (error) throw error;
        return data.map((c: any) => ({
            ...c,
            loyaltyPoints: c.loyalty_points || 0,
            totalSpent: c.total_spent || 0,
            lastVisit: c.last_visit
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async getByPhone(phone: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async create(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
        const dbCustomer = {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            loyalty_points: customer.loyaltyPoints,
            total_spent: customer.totalSpent,
            last_visit: customer.lastVisit,
            tier: customer.tier,
            notes: customer.notes
        };
        const { data, error } = await supabase
            .from('customers')
            .insert(dbCustomer)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async update(id: string, updates: Partial<Customer>) {
        const dbUpdates: any = { ...updates };
        if (updates.loyaltyPoints !== undefined) {
            dbUpdates.loyalty_points = updates.loyaltyPoints;
            delete dbUpdates.loyaltyPoints;
        }
        if (updates.totalSpent !== undefined) {
            dbUpdates.total_spent = updates.totalSpent;
            delete dbUpdates.totalSpent;
        }
        if (updates.lastVisit !== undefined) {
            dbUpdates.last_visit = updates.lastVisit;
            delete dbUpdates.lastVisit;
        }

        const { data, error } = await supabase
            .from('customers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateLoyaltyPoints(id: string, points: number) {
        const customer = await this.getById(id);
        return await this.update(id, {
            loyaltyPoints: customer.loyaltyPoints + points
        });
    },

    async updateTier(id: string, tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum') {
        return await this.update(id, { tier });
    }
};
