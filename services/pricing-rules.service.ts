import { supabase } from '../lib/supabase';
import type { PricingRule } from '../types';
import { logger } from '../utils/logger';

const COLUMNS = 'id, country_code, name, target_category, condition, threshold, action, value, is_active';

interface PricingRuleRow {
    id: string;
    name: string;
    target_category: string;
    condition: PricingRule['condition'];
    threshold: number | string;
    action: PricingRule['action'];
    value: number | string;
    is_active: boolean;
}

export const mapPricingRuleRow = (row: PricingRuleRow): PricingRule => ({
    id: row.id,
    name: row.name,
    targetCategory: row.target_category,
    condition: row.condition,
    threshold: Number(row.threshold) || 0,
    action: row.action,
    value: Number(row.value) || 0,
    isActive: row.is_active
});

export interface PricingRulesPageInput {
    countryCode: string;
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'all' | 'enabled' | 'paused';
}

export interface PricingRulesPageResult {
    rules: PricingRule[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const pricingRulesService = {
    /** Rules are always scoped to a single country (sovereignty). */
    async getAll(countryCode: string): Promise<PricingRule[]> {
        const { data, error } = await supabase
            .from('pricing_rules')
            .select(COLUMNS)
            .eq('country_code', countryCode.toUpperCase())
            .order('created_at', { ascending: false })
            .limit(25);
        if (error) {
            logger.error('pricingRulesService', 'getAll failed', error);
            throw error;
        }
        return ((data || []) as PricingRuleRow[]).map(mapPricingRuleRow);
    },

    /** Returns all active rules for cross-rule simulation and conflict detection. */
    async getAllActive(countryCode: string): Promise<PricingRule[]> {
        const rules: PricingRule[] = [];
        for (let page = 1; page <= 200; page++) {
            const result = await this.getPage({ countryCode, page, pageSize: 100, status: 'enabled' });
            rules.push(...result.rules);
            if (page >= result.totalPages) return rules;
            if (!result.rules.length) throw new Error('Pricing rules changed while loading. Retry the scenario.');
        }
        throw new Error('Too many enabled pricing rules to evaluate safely.');
    },

    /** Bounded pagination, search and status filtering for pricing rules. */
    async getPage(input: PricingRulesPageInput): Promise<PricingRulesPageResult> {
        const pageSize = Math.max(1, Math.min(input.pageSize || 25, 100));
        const page = Math.max(1, input.page || 1);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('pricing_rules')
            .select(COLUMNS, { count: 'exact' })
            .eq('country_code', input.countryCode.toUpperCase());

        if (input.status === 'enabled') {
            query = query.eq('is_active', true);
        } else if (input.status === 'paused') {
            query = query.eq('is_active', false);
        }

        if (input.search && input.search.trim()) {
            query = query.ilike('name', `%${input.search.trim()}%`);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false }).order('id', { ascending: false })
            .range(from, to);

        if (error) {
            logger.error('pricingRulesService', 'getPage failed', error);
            throw error;
        }

        const totalCount = count ?? 0;
        const rules = ((data || []) as PricingRuleRow[]).map(mapPricingRuleRow);
        return {
            rules,
            totalCount,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(totalCount / pageSize))
        };
    },

    async create(rule: Omit<PricingRule, 'id'>, countryCode: string, createdBy: string): Promise<PricingRule> {
        // Normalize action identifier to match database CHECK constraint
        const normalizedAction: PricingRule['action'] = (rule.action as any) === 'Set Margin %' || rule.action?.includes('Margin')
            ? 'Set to Cost + Margin'
            : rule.action;

        const { data, error } = await supabase
            .from('pricing_rules')
            .insert({
                country_code: countryCode.toUpperCase(),
                name: rule.name.trim(),
                target_category: rule.targetCategory,
                condition: rule.condition,
                threshold: Math.round(Number(rule.threshold) || 0),
                action: normalizedAction,
                value: Math.round(Number(rule.value) || 0),
                is_active: rule.isActive,
                created_by: createdBy
            })
            .select(COLUMNS)
            .single();
        if (error) {
            logger.error('pricingRulesService', 'create failed', error);
            throw error;
        }
        return mapPricingRuleRow(data as PricingRuleRow);
    },

    /** Explicit column allowlist: only the active flag is mutable after creation. */
    async setActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase.from('pricing_rules').update({ is_active: isActive }).eq('id', id);
        if (error) {
            logger.error('pricingRulesService', 'setActive failed', error);
            throw error;
        }
    },

    async remove(id: string): Promise<void> {
        const { error } = await supabase.from('pricing_rules').delete().eq('id', id);
        if (error) {
            logger.error('pricingRulesService', 'remove failed', error);
            throw error;
        }
    }
};
