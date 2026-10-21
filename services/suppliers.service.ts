import { supabase } from '../lib/supabase';
import type { Supplier } from '../types';

export type SupplierDraft = Pick<Supplier, 'name' | 'type' | 'contact' | 'category'> &
  Partial<Pick<Supplier, 'email' | 'phone' | 'taxId' | 'nationalId' | 'location' |
    'leadTime' | 'bankName' | 'bankAccountName' | 'bankAccountNumber' |
    'status' | 'rating' | 'regionCode'>> & {
    countryCode: string;
  };

const supplierColumns = 'id,name,type,contact,email,phone,category,status,rating,lead_time,tax_id,national_id,location,country_code,region_code,created_by,verification_status,bank_name,bank_account_name,bank_account_number,created_at,updated_at';

function mapSupplier(row: any): Supplier {
  return {
    id: row.id, name: row.name, type: row.type, contact: row.contact,
    email: row.email, phone: row.phone, category: row.category,
    status: row.status, rating: row.rating, leadTime: row.lead_time,
    taxId: row.tax_id, nationalId: row.national_id, location: row.location,
    countryCode: row.country_code, regionCode: row.region_code,
    createdBy: row.created_by,
    verificationStatus: row.verification_status,
    bankName: row.bank_name, bankAccountName: row.bank_account_name,
    bankAccountNumber: row.bank_account_number
  };
}

export const suppliersService = {
  async getAll(limit = 50, offset = 0, countryCode?: string, includeExactCount = true) {
    let query = supabase.from('suppliers')
      .select(supplierColumns, includeExactCount ? { count: 'exact' } : undefined);
    if (countryCode) query = query.eq('country_code', countryCode);
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return { data: (data || []).map(mapSupplier), count: count || 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('suppliers')
      .select(supplierColumns).eq('id', id).single();
    if (error) throw error;
    return mapSupplier(data);
  },

  async create(supplier: SupplierDraft) {
    const name = supplier.name.trim();
    const contact = supplier.contact.trim();
    if (!name || !contact || !supplier.countryCode) {
      throw new Error('Supplier name, contact, and country are required');
    }
    if (supplier.taxId?.trim()) {
      const { data: existing, error: lookupError } = await supabase.from('suppliers')
        .select('id,name').eq('tax_id', supplier.taxId.trim())
        .eq('country_code', supplier.countryCode).maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) throw new Error(`Zero-Trust Vendor Guard: Tax ID / TIN "${supplier.taxId.trim()}" is already registered under supplier "${existing.name}".`);
    }
    const { data, error } = await supabase.from('suppliers').insert({
      name, type: supplier.type, contact,
      email: supplier.email?.trim() || null,
      phone: supplier.phone?.trim() || null,
      category: supplier.category.trim(), status: 'Active',
      lead_time: supplier.leadTime ?? null,
      tax_id: supplier.taxId?.trim() || null,
      national_id: supplier.nationalId?.trim() || null,
      location: supplier.location?.trim() || null,
      country_code: supplier.countryCode,
      region_code: supplier.regionCode || null,
      verification_status: 'pending',
      bank_name: supplier.bankName?.trim() || null,
      bank_account_name: supplier.bankAccountName?.trim() || null,
      bank_account_number: supplier.bankAccountNumber?.trim() || null
    }).select(supplierColumns).single();
    if (error) throw error;
    return mapSupplier(data);
  },

  async update(id: string, updates: Partial<SupplierDraft>) {
    const fields: Record<string, unknown> = {};
    if (updates.name !== undefined) fields.name = updates.name.trim();
    if (updates.type !== undefined) fields.type = updates.type;
    if (updates.contact !== undefined) fields.contact = updates.contact.trim();
    if (updates.email !== undefined) fields.email = updates.email?.trim() || null;
    if (updates.phone !== undefined) fields.phone = updates.phone?.trim() || null;
    if (updates.category !== undefined) fields.category = updates.category.trim();
    if (updates.leadTime !== undefined) fields.lead_time = updates.leadTime;
    if (updates.taxId !== undefined) fields.tax_id = updates.taxId?.trim() || null;
    if (updates.nationalId !== undefined) fields.national_id = updates.nationalId?.trim() || null;
    if (updates.location !== undefined) fields.location = updates.location?.trim() || null;
    if (updates.bankName !== undefined) fields.bank_name = updates.bankName?.trim() || null;
    if (updates.bankAccountName !== undefined) fields.bank_account_name = updates.bankAccountName?.trim() || null;
    if (updates.bankAccountNumber !== undefined) fields.bank_account_number = updates.bankAccountNumber?.trim() || null;
    if (!Object.keys(fields).length) throw new Error('No supplier changes provided');
    const { data, error } = await supabase.from('suppliers')
      .update(fields).eq('id', id).select(supplierColumns).single();
    if (error) throw error;
    return mapSupplier(data);
  },

  async verify(id: string, employeeId: string) {
    const { data, error } = await supabase.from('suppliers')
      .update({ verification_status: 'verified', verified_by: employeeId,
        verified_at: new Date().toISOString() })
      .eq('id', id).eq('verification_status', 'pending')
      .select(supplierColumns).single();
    if (error) throw error;
    return mapSupplier(data);
  },

  async delete(id: string) {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  }
};
