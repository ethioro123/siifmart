import { supabase } from '../lib/supabase';
import type { Supplier } from '../types';
import { logger } from '../utils/logger';

export const suppliersService = {
    async getAll(limit: number = 50, offset: number = 0, countryCode?: string) {
        let query = supabase
            .from('suppliers')
            .select('*', { count: 'exact' });

        if (countryCode) {
            query = query.eq('country_code', countryCode);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            // Graceful fallback if country_code column was not queried properly
            if (error.code === '42703' && countryCode) {
                logger.warn('SuppliersService', 'country_code column not on suppliers table, retrying unpartitioned');
                const fallback = await supabase
                    .from('suppliers')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);
                if (fallback.error) throw fallback.error;
                return {
                    data: (fallback.data || []).map((s: any) => ({
                        ...s,
                        countryCode: s.country_code || countryCode || 'ET',
                        leadTime: s.lead_time,
                        taxId: s.tax_id,
                        nationalId: s.national_id
                    })),
                    count: fallback.count || 0
                };
            }
            throw error;
        }

        const mappedData = (data || []).map((s: any) => ({
            ...s,
            countryCode: s.country_code || countryCode || 'ET',
            leadTime: s.lead_time,
            taxId: s.tax_id,
            nationalId: s.national_id,
            verificationStatus: s.verification_status || 'verified',
            bankName: s.bank_name,
            bankAccountName: s.bank_account_name,
            bankAccountNumber: s.bank_account_number
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
            countryCode: data.country_code,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id,
            verificationStatus: data.verification_status || 'verified',
            bankName: data.bank_name,
            bankAccountName: data.bank_account_name,
            bankAccountNumber: data.bank_account_number
        };
    },

    async create(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'> & { countryCode?: string; bankName?: string; bankAccountNumber?: string; bankAccountName?: string }) {
        const country = supplier.countryCode || 'ET';

        // Zero-Trust Duplicate Tax ID / TIN Guard
        if (supplier.taxId && supplier.taxId.trim()) {
            const { data: existing } = await supabase
                .from('suppliers')
                .select('id, name')
                .eq('tax_id', supplier.taxId.trim())
                .eq('country_code', country)
                .maybeSingle();

            if (existing) {
                throw new Error(`Zero-Trust Vendor Guard: Tax ID / TIN "${supplier.taxId}" is already registered under supplier "${existing.name}".`);
            }
        }

        const dbSupplier: any = {
            name: supplier.name,
            type: supplier.type,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            category: supplier.category,
            status: supplier.status || 'Active',
            rating: supplier.rating || 5,
            lead_time: supplier.leadTime,
            tax_id: supplier.taxId,
            national_id: supplier.nationalId,
            location: supplier.location,
            country_code: country,
            verification_status: 'verified',
            bank_name: supplier.bankName,
            bank_account_name: supplier.bankAccountName,
            bank_account_number: supplier.bankAccountNumber
        };

        let { data, error } = await supabase
            .from('suppliers')
            .insert(dbSupplier)
            .select()
            .single();

        if (error && (error.code === '42703' || error.message?.includes('country_code') || error.message?.includes('bank_name'))) {
            // Column compatibility retry
            const { country_code: _, verification_status: __, bank_name: ___, bank_account_name: ____, bank_account_number: _____, ...basic } = dbSupplier;
            const retry = await supabase.from('suppliers').insert(basic).select().single();
            data = retry.data;
            error = retry.error;
        }

        if (error) throw error;
        return {
            ...data,
            countryCode: data.country_code || country,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async update(id: string, updates: Partial<Supplier> & { countryCode?: string; bankName?: string; bankAccountNumber?: string }) {
        const dbUpdates: any = { ...updates };
        if (updates.leadTime !== undefined) { dbUpdates.lead_time = updates.leadTime; delete dbUpdates.leadTime; }
        if (updates.taxId !== undefined) { dbUpdates.tax_id = updates.taxId; delete dbUpdates.taxId; }
        if (updates.nationalId !== undefined) { dbUpdates.national_id = updates.nationalId; delete dbUpdates.nationalId; }
        if (updates.countryCode !== undefined) { dbUpdates.country_code = updates.countryCode; delete dbUpdates.countryCode; }
        if (updates.bankName !== undefined) { dbUpdates.bank_name = updates.bankName; delete dbUpdates.bankName; }
        if (updates.bankAccountNumber !== undefined) { dbUpdates.bank_account_number = updates.bankAccountNumber; delete dbUpdates.bankAccountNumber; }

        const { data, error } = await supabase
            .from('suppliers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            countryCode: data.country_code,
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
