/**
 * Regional Operations & Dynamic Budget Governance Service
 * Handles administrative region definitions, site allocations,
 * and dynamic real-time budget threshold controls.
 */

import { supabase } from '../lib/supabase';
import type { Region } from '../types';
import { logger } from '../utils/logger';
import { normalizeCountryCode } from '../utils/siteIdGenerator';
import { getCountryProfile } from '../utils/localization';
import { formatRegionCode, isValidRegionCodeFormat } from '../utils/regionIdGenerator';

export interface CreateRegionInput {
    code: string;
    name: string;
    country: string;
    city?: string;
    default_currency: string;
    default_language?: string;
    admin_hub_site_id?: string;
    regional_manager_id?: string;
    monthly_procurement_budget?: number;
    autonomous_po_limit?: number;
    monthly_expense_budget?: number;
    autonomous_expense_limit?: number;
    status?: 'active' | 'suspended' | 'planning';
    change_reason?: string;
}

export interface UpdateRegionInput {
    name?: string;
    city?: string;
    admin_hub_site_id?: string | null;
    regional_manager_id?: string | null;
    monthly_procurement_budget?: number;
    autonomous_po_limit?: number;
    monthly_expense_budget?: number;
    autonomous_expense_limit?: number;
    status?: 'active' | 'suspended' | 'planning';
    change_reason?: string;
}

export interface RegionBudgetStatus {
    regionCode: string;
    regionName: string;
    currency: string;
    monthlyBudget: number;
    autonomousPoLimit: number;
    currentMonthSpend: number;
    remainingBudget: number;
    percentUsed: number;
    isOverBudget: boolean;
    isNearCap: boolean; // >= 85%
}

export const regionsService = {
    /**
     * Fetch all operational regions, optionally scoped by country.
     * Enforces Rule 10: Specific column projection, no naked select(*).
     */
    async getRegions(countryCodeOrName?: string): Promise<Region[]> {
        try {
            let query = supabase
                .from('regions')
                .select(`
                    code,
                    name,
                    country,
                    city,
                    default_currency,
                    default_language,
                    admin_hub_site_id,
                    regional_manager_id,
                    monthly_procurement_budget,
                    autonomous_po_limit,
                    monthly_expense_budget,
                    autonomous_expense_limit,
                    status,
                    created_at,
                    updated_at
                `);

            if (countryCodeOrName) {
                const normalized = normalizeCountryCode(countryCodeOrName);
                query = query.eq('country', normalized);
            }

            const { data, error } = await query.order('name', { ascending: true });

            if (error) {
                logger.error('regionsService', 'Error fetching regions', error);
                throw error;
            }

            return (data || []).map(r => ({
                code: r.code,
                name: r.name || r.code,
                country: r.country,
                city: r.city || '',
                default_currency: r.default_currency,
                default_language: r.default_language,
                admin_hub_site_id: r.admin_hub_site_id,
                regional_manager_id: r.regional_manager_id,
                monthly_procurement_budget: Number(r.monthly_procurement_budget || 0),
                autonomous_po_limit: r.autonomous_po_limit == null ? undefined : Number(r.autonomous_po_limit),
                monthly_expense_budget: Number(r.monthly_expense_budget || 0),
                autonomous_expense_limit: Number(r.autonomous_expense_limit || 25000),
                status: r.status || 'active',
                created_at: r.created_at,
                updated_at: r.updated_at
            }));
        } catch (err) {
            logger.error('regionsService', 'Critical failure in getRegions', err as Error);
            throw err;
        }
    },

    /**
     * Fetch a single region by its unique territorial code (e.g. 'ke_mombasa')
     */
    async getRegionByCode(code: string): Promise<Region | null> {
        try {
            const cleanCode = code.trim().toUpperCase();
            let { data, error } = await supabase
                .from('regions')
                .select(`
                    code,
                    name,
                    country,
                    city,
                    default_currency,
                    default_language,
                    admin_hub_site_id,
                    regional_manager_id,
                    monthly_procurement_budget,
                    autonomous_po_limit,
                    monthly_expense_budget,
                    autonomous_expense_limit,
                    status,
                    created_at,
                    updated_at
                `)
                .eq('code', cleanCode)
                .maybeSingle();

            if (!data && cleanCode !== code.trim()) {
                const retry = await supabase
                    .from('regions')
                    .select(`
                        code,
                        name,
                        country,
                        city,
                        default_currency,
                        default_language,
                        admin_hub_site_id,
                        regional_manager_id,
                        monthly_procurement_budget,
                        autonomous_po_limit,
                        monthly_expense_budget,
                        autonomous_expense_limit,
                        status,
                        created_at,
                        updated_at
                    `)
                    .eq('code', code.trim())
                    .maybeSingle();
                data = retry.data;
                error = retry.error;
            }

            if (error) {
                logger.error('regionsService', `Error fetching region ${code}`, error);
                throw error;
            }

            if (!data) return null;

            return {
                code: data.code,
                name: data.name || data.code,
                country: data.country,
                city: data.city || '',
                default_currency: data.default_currency,
                default_language: data.default_language,
                admin_hub_site_id: data.admin_hub_site_id,
                regional_manager_id: data.regional_manager_id,
                monthly_procurement_budget: Number(data.monthly_procurement_budget || 0),
                autonomous_po_limit: data.autonomous_po_limit == null ? undefined : Number(data.autonomous_po_limit),
                monthly_expense_budget: Number(data.monthly_expense_budget || 0),
                autonomous_expense_limit: Number(data.autonomous_expense_limit || 25000),
                status: data.status || 'active',
                created_at: data.created_at,
                updated_at: data.updated_at
            };
        } catch (err) {
            logger.error('regionsService', `Critical failure in getRegionByCode ${code}`, err as Error);
            throw err;
        }
    },

    /**
     * Provision a new operational region under Main HQ governance.
     */
    async createRegion(input: CreateRegionInput): Promise<Region> {
        try {
            const changeReason = input.change_reason?.trim();
            if (!changeReason) throw new Error('A reason is required when creating a region');
            if (input.autonomous_po_limit == null || !Number.isFinite(input.autonomous_po_limit) || input.autonomous_po_limit < 0) {
                throw new Error('Set the regional PO approval limit before creating a region');
            }

            const normalizedCountry = normalizeCountryCode(input.country);
            const normalizedCode = formatRegionCode(input.code, normalizedCountry);

            if (!isValidRegionCodeFormat(normalizedCode)) {
                throw new Error(`Region code "${input.code}" is invalid. Territorial code must follow format XXX (3-4 uppercase letters).`);
            }

            const payload = {
                code: normalizedCode,
                name: input.name.trim(),
                country: normalizedCountry,
                city: input.city || null,
                default_currency: input.default_currency,
                default_language: input.default_language || 'en',
                admin_hub_site_id: input.admin_hub_site_id || null,
                regional_manager_id: input.regional_manager_id || null,
                monthly_procurement_budget: input.monthly_procurement_budget ?? 0,
                autonomous_po_limit: input.autonomous_po_limit,
                monthly_expense_budget: input.monthly_expense_budget ?? 0,
                autonomous_expense_limit: input.autonomous_expense_limit ?? 25000,
                status: input.status || 'active',
                last_change_reason: changeReason,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase.rpc('create_region_with_admin_hub', {
                p_region: payload
            });

            if (error) {
                logger.error('regionsService', 'Failed to create region', error);
                throw error;
            }

            const created = await this.getRegionByCode(typeof data === 'string' ? data : payload.code);
            if (!created) throw new Error('The region was created but could not be loaded');
            return created;
        } catch (err) {
            logger.error('regionsService', 'Exception in createRegion', err as Error);
            throw err;
        }
    },

    /**
     * Update regional settings, leadership, or budget guardrails.
     * Enforces Rule 2.4: Explicit column allowlist only.
     */
    async updateRegion(code: string, updates: UpdateRegionInput): Promise<boolean> {
        try {
            const changeReason = updates.change_reason?.trim();
            if (!changeReason) throw new Error('A reason is required when changing regional settings');
            const allowedUpdates: Record<string, string | number | null> = {
                updated_at: new Date().toISOString(),
                last_change_reason: changeReason
            };

            if (updates.name !== undefined) allowedUpdates.name = updates.name.trim();
            if (updates.city !== undefined) allowedUpdates.city = updates.city;
            if (updates.admin_hub_site_id !== undefined) allowedUpdates.admin_hub_site_id = updates.admin_hub_site_id;
            if (updates.regional_manager_id !== undefined) allowedUpdates.regional_manager_id = updates.regional_manager_id;
            if (updates.monthly_procurement_budget !== undefined) allowedUpdates.monthly_procurement_budget = updates.monthly_procurement_budget;
            if (updates.autonomous_po_limit !== undefined) allowedUpdates.autonomous_po_limit = updates.autonomous_po_limit;
            if (updates.monthly_expense_budget !== undefined) allowedUpdates.monthly_expense_budget = updates.monthly_expense_budget;
            if (updates.autonomous_expense_limit !== undefined) allowedUpdates.autonomous_expense_limit = updates.autonomous_expense_limit;
            if (updates.status !== undefined) allowedUpdates.status = updates.status;

            const { data, error } = await supabase
                .from('regions')
                .update(allowedUpdates)
                .eq('code', code)
                .select('code')
                .maybeSingle();

            if (error) {
                logger.error('regionsService', `Failed to update region ${code}`, error);
                throw error;
            }

            if (!data) throw new Error(`Region ${code} was not updated; it may be outside your authorized scope`);
            return true;
        } catch (err) {
            logger.error('regionsService', `Exception in updateRegion ${code}`, err as Error);
            throw err;
        }
    },

    async updateRegionAndSiteAssignments(
        code: string,
        updates: UpdateRegionInput,
        toAssign: string[],
        toUnassign: string[]
    ): Promise<void> {
        const { error } = await supabase.rpc('update_region_and_site_assignments', {
            p_code: code,
            p_updates: updates,
            p_to_assign: toAssign,
            p_to_unassign: toUnassign
        });
        if (error) {
            logger.error('regionsService', `Failed to atomically update region ${code}`, error);
            throw error;
        }
    },

    /**
     * Calculate real-time dynamic budget status for a region.
     * Evaluates actual current-month PO spend against the database-configured budget cap.
     */
    async getRegionBudgetStatus(regionCode: string): Promise<RegionBudgetStatus | null> {
        try {
            const region = await this.getRegionByCode(regionCode);
            if (!region) return null;

            // 1. Get all sites in this region
            const { data: sitesData, error: sitesErr } = await supabase
                .from('sites')
                .select('id')
                .eq('region_code', regionCode);

            if (sitesErr) {
                logger.error('regionsService', `Failed to fetch sites for region ${regionCode}`, sitesErr);
                throw new Error(`Unable to fetch sites for region budget: ${sitesErr.message}`);
            }

            const siteIds = (sitesData || []).map(s => s.id);

            let currentMonthSpend = 0;

            if (siteIds.length > 0) {
                // 2. Calculate beginning of current calendar month
                const timezone = getCountryProfile(region.country).timezone;
                const dateParts = new Intl.DateTimeFormat('en-CA', {
                    timeZone: timezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).formatToParts(new Date());
                const datePart = (type: 'year' | 'month' | 'day') => dateParts.find(part => part.type === type)?.value;
                const year = datePart('year');
                const month = datePart('month');
                if (!year || !month) throw new Error(`Unable to determine the ${region.country} business date`);
                const startOfMonth = `${year}-${month}-01`;
                const nextMonthDate = new Date(Date.UTC(Number(year), Number(month), 1));
                const endOfMonth = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0')}-01`;

                // 3. Query purchase orders for these sites within the current month
                const { data: poData, error: poErr } = await supabase
                    .from('purchase_orders')
                    .select('total_amount')
                    .in('site_id', siteIds)
                    .gte('order_date', startOfMonth)
                    .lt('order_date', endOfMonth)
                    .in('status', ['Approved', 'Ordered', 'Partially Received', 'Received']);

                if (poErr) {
                    logger.error('regionsService', 'Failed to fetch PO spend for region budget check', poErr);
                    throw new Error(`Unable to fetch PO spend for region budget: ${poErr.message}`);
                } else if (poData) {
                    currentMonthSpend = poData.reduce((sum, po) => sum + Number(po.total_amount || 0), 0);
                }
            }

            const monthlyBudget = Number(region.monthly_procurement_budget || 0);
            const remainingBudget = Math.max(0, monthlyBudget - currentMonthSpend);
            const percentUsed = monthlyBudget > 0 ? (currentMonthSpend / monthlyBudget) * 100 : 0;

            return {
                regionCode: region.code,
                regionName: region.name,
                currency: region.default_currency || getCountryProfile(region.country).currencyCode,
                monthlyBudget,
                autonomousPoLimit: Number(region.autonomous_po_limit ?? 0),
                currentMonthSpend,
                remainingBudget,
                percentUsed,
                isOverBudget: monthlyBudget > 0 && currentMonthSpend >= monthlyBudget,
                isNearCap: percentUsed >= 85
            };
        } catch (err) {
            logger.error('regionsService', `Exception in getRegionBudgetStatus ${regionCode}`, err as Error);
            throw err;
        }
    },

    /**
     * Assign a facility/site to an operational region.
     */
    async assignSiteToRegion(siteId: string, regionCode: string | null): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('sites')
                .update({ region_code: regionCode })
                .eq('id', siteId)
                .select('id')
                .maybeSingle();

            if (error) {
                logger.error('regionsService', `Failed to assign site ${siteId} to region ${regionCode}`, error);
                throw error;
            }

            if (!data) throw new Error(`Site ${siteId} was not updated; it may be outside your authorized scope`);
            return true;
        } catch (err) {
            logger.error('regionsService', `Exception in assignSiteToRegion`, err as Error);
            throw err;
        }
    }
};
