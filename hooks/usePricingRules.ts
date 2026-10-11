import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pricingRulesService } from '../services/pricing-rules.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import type { PricingRule } from '../types';
import { logger } from '../utils/logger';

const KEY = 'pricing_rules';

/** Persisted, country-scoped pricing rules. Loaded only when Merchandising is mounted. */
export function usePricingRules(countryCode: string) {
    const queryClient = useQueryClient();
    const { user } = useStore();
    const { addNotification } = useData();

    const query = useQuery({
        queryKey: [KEY, countryCode],
        queryFn: () => pricingRulesService.getAll(countryCode),
        staleTime: 10 * 60 * 1000
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: [KEY, countryCode] });

    const createRule = useMutation({
        mutationFn: (rule: Omit<PricingRule, 'id'>) =>
            pricingRulesService.create(rule, countryCode, user?.name || 'Unknown'),
        onSuccess: (rule) => {
            invalidate();
            addNotification('success', `Automation Rule '${rule.name}' saved.`);
        },
        onError: (error: Error) => {
            logger.error('usePricingRules', 'create failed', error);
            addNotification('alert', `Could not save rule: ${error.message}`);
        }
    });

    const toggleRule = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => pricingRulesService.setActive(id, isActive),
        onSuccess: invalidate,
        onError: (error: Error) => {
            logger.error('usePricingRules', 'toggle failed', error);
            addNotification('alert', `Could not update rule: ${error.message}`);
        }
    });

    const deleteRule = useMutation({
        mutationFn: (id: string) => pricingRulesService.remove(id),
        onSuccess: () => {
            invalidate();
            addNotification('info', 'Automation Rule deleted');
        },
        onError: (error: Error) => {
            logger.error('usePricingRules', 'delete failed', error);
            addNotification('alert', `Could not delete rule: ${error.message}`);
        }
    });

    return { rules: query.data ?? [], isLoading: query.isLoading, createRule, toggleRule, deleteRule };
}
