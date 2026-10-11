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

    async create(rule: Omit<PricingRule, 'id'>, countryCode: string, createdBy: string): Promise<PricingRule> {
        const { data, error } = await supabase
            .from('pricing_rules')
            .insert({
                country_code: countryCode.toUpperCase(),
                name: rule.name,
                target_category: rule.targetCategory,
                condition: rule.condition,
                threshold: rule.threshold,
                action: rule.action,
                value: rule.value,
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
