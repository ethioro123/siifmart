import { supabase } from '../lib/supabase';
import type { DiscountCode } from '../types';
import { logger } from '../utils/logger';
import { DiscountCodeSchema } from '../schemas/discount-code.schema';

export function mapDiscountCodeRow(row: any): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type as 'PERCENTAGE' | 'FIXED',
    value: Number(row.value) || 0,
    country: row.country_code || 'ET',
    country_code: row.country_code || 'ET',
    currency: row.currency || (row.country_code === 'KE' ? 'KSh' : 'ETB'),
    minPurchaseAmount: row.min_purchase_amount != null ? Number(row.min_purchase_amount) : undefined,
    maxDiscountAmount: row.max_discount_amount != null ? Number(row.max_discount_amount) : undefined,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    usageLimit: row.usage_limit != null ? Number(row.usage_limit) : undefined,
    usageCount: Number(row.usage_count) || 0,
    perCustomerLimit: row.per_customer_limit != null ? Number(row.per_customer_limit) : undefined,
    status: row.status || 'Active',
    applicableSites: Array.isArray(row.applicable_sites) ? row.applicable_sites : undefined,
    description: row.description || undefined,
    createdBy: row.created_by || 'System',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const discountCodesService = {
  /**
   * Fetch discount codes scoped strictly to target country.
   */
  async getAll(targetCountry: string = 'ET'): Promise<DiscountCode[]> {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('country_code', targetCountry)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message?.includes('country_code does not exist')) {
          logger.warn('discountCodesService.getAll', 'discount_codes.country_code column pending migration — querying all and filtering in-memory');
          const fallbackRes = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
          if (!fallbackRes.error && fallbackRes.data) {
            return fallbackRes.data
              .map(mapDiscountCodeRow)
              .filter(dc => (dc.country_code || dc.country || 'ET') === targetCountry);
          }
        }
        logger.error('discountCodesService.getAll', 'Failed to fetch discount codes', error);
        throw error;
      }

      return (data || []).map(mapDiscountCodeRow);
    } catch (err) {
      logger.error('discountCodesService.getAll', 'Unexpected error fetching discount codes', err);
      throw err;
    }
  },

  /**
   * Validate a promotional discount code at checkout.
   * Strictly enforces country isolation and validity parameters.
   */
  async validateCode(
    code: string,
    targetCountry: string = 'ET',
    siteId?: string,
    subtotal?: number
  ): Promise<{ valid: boolean; discountCode?: DiscountCode; error?: string }> {
    const cleanCode = code.toUpperCase().trim();
    if (!cleanCode) {
      return { valid: false, error: 'Discount code cannot be empty' };
    }

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', cleanCode)
        .eq('country_code', targetCountry)
        .maybeSingle();

      if (error) {
        logger.error('discountCodesService.validateCode', 'Query error validating discount code', error);
        return { valid: false, error: 'Error verifying discount code' };
      }

      if (!data) {
        return { valid: false, error: 'Invalid discount code for this market' };
      }

      const discountCode = mapDiscountCodeRow(data);

      if (discountCode.status !== 'Active') {
        return { valid: false, error: 'This discount code is not active' };
      }

      const now = new Date();
      const validFrom = new Date(discountCode.validFrom);
      const validUntil = new Date(discountCode.validUntil);

      if (now < validFrom) {
        return { valid: false, error: 'This discount code is not yet valid' };
      }

      if (now > validUntil) {
        return { valid: false, error: 'This discount code has expired' };
      }

      if (discountCode.usageLimit !== undefined && discountCode.usageCount >= discountCode.usageLimit) {
        return { valid: false, error: 'This discount code has reached its usage limit' };
      }

      if (
        discountCode.minPurchaseAmount !== undefined &&
        subtotal !== undefined &&
        subtotal < discountCode.minPurchaseAmount
      ) {
        return {
          valid: false,
          error: `Minimum purchase of ${discountCode.currency || ''} ${discountCode.minPurchaseAmount} required`,
        };
      }

      if (discountCode.applicableSites && discountCode.applicableSites.length > 0 && siteId) {
        if (!discountCode.applicableSites.includes(siteId)) {
          return { valid: false, error: 'This discount code is not valid at this location' };
        }
      }

      return { valid: true, discountCode };
    } catch (err) {
      logger.error('discountCodesService.validateCode', 'Unexpected validation error', err);
      return { valid: false, error: 'Failed to validate discount code' };
    }
  },

  /**
   * Create a new authorized discount code with explicit allowlist & Zod validation.
   */
  async create(rawInput: unknown): Promise<void> {
    const validated = DiscountCodeSchema.parse(rawInput);
    const id = validated.id || `DC-${Date.now()}`;
    const country = validated.country || validated.country_code || 'ET';

    const insertPayload = {
      id,
      code: validated.code.toUpperCase().trim(),
      name: validated.name.trim(),
      type: validated.type,
      value: validated.value,
      country_code: country,
      currency: validated.currency || (country === 'KE' ? 'KSh' : 'ETB'),
      min_purchase_amount: validated.minPurchaseAmount ?? 0,
      max_discount_amount: validated.maxDiscountAmount ?? null,
      valid_from: validated.validFrom,
      valid_until: validated.validUntil,
      usage_limit: validated.usageLimit ?? null,
      usage_count: validated.usageCount ?? 0,
      per_customer_limit: validated.perCustomerLimit ?? null,
      status: validated.status ?? 'Active',
      applicable_sites: validated.applicableSites ?? null,
      description: validated.description ?? null,
      created_by: validated.createdBy || 'HQ Admin',
    };

    const { error } = await supabase.from('discount_codes').insert(insertPayload);

    if (error) {
      logger.error('discountCodesService.create', 'Failed to insert discount code', error);
      throw error;
    }

    logger.info('discountCodesService.create', `Discount code ${validated.code} created for market ${country}`);
  },

  /**
   * Update an existing discount code using explicit allowlist.
   */
  async update(id: string, rawInput: unknown): Promise<void> {
    const validated = DiscountCodeSchema.partial().parse(rawInput);

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) updatePayload.name = validated.name.trim();
    if (validated.type !== undefined) updatePayload.type = validated.type;
    if (validated.value !== undefined) updatePayload.value = validated.value;
    if (validated.minPurchaseAmount !== undefined) updatePayload.min_purchase_amount = validated.minPurchaseAmount;
    if (validated.maxDiscountAmount !== undefined) updatePayload.max_discount_amount = validated.maxDiscountAmount;
    if (validated.validFrom !== undefined) updatePayload.valid_from = validated.validFrom;
    if (validated.validUntil !== undefined) updatePayload.valid_until = validated.validUntil;
    if (validated.usageLimit !== undefined) updatePayload.usage_limit = validated.usageLimit;
    if (validated.status !== undefined) updatePayload.status = validated.status;
    if (validated.applicableSites !== undefined) updatePayload.applicable_sites = validated.applicableSites;
    if (validated.description !== undefined) updatePayload.description = validated.description;
    if (validated.country !== undefined || validated.country_code !== undefined) {
      updatePayload.country_code = validated.country || validated.country_code;
    }

    const { error } = await supabase
      .from('discount_codes')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      logger.error('discountCodesService.update', `Failed to update discount code ${id}`, error);
      throw error;
    }

    logger.info('discountCodesService.update', `Discount code ${id} updated`);
  },

  /**
   * Delete a discount code.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('discountCodesService.delete', `Failed to delete discount code ${id}`, error);
      throw error;
    }

    logger.info('discountCodesService.delete', `Discount code ${id} deleted`);
  },

  /**
   * Atomically increment code usage count after checkout.
   */
  async incrementUsage(codeId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_discount_usage', { code_id: codeId });
      if (error) {
        // Fallback to direct update if RPC is missing
        logger.warn('discountCodesService.incrementUsage', 'RPC failed, attempting fallback update', { error: error.message });
        const { data } = await supabase.from('discount_codes').select('usage_count').eq('id', codeId).single();
        if (data) {
          await supabase.from('discount_codes').update({ usage_count: (data.usage_count || 0) + 1 }).eq('id', codeId);
        }
      }
    } catch (err) {
      logger.error('discountCodesService.incrementUsage', 'Failed to increment discount code usage', err);
    }
  },
};
