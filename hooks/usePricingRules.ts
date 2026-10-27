import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pricingRulesService } from '../services/pricing-rules.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import type { PricingRule } from '../types';
import { logger } from '../utils/logger';

const KEY = 'pricing_rules';

/** Persisted, country-scoped pricing rules with bounded pagination, search, and filters. */
export function usePricingRules(countryCode: string) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'paused'>('all');

    const queryClient = useQueryClient();
    const { user } = useStore();
    const { addNotification } = useData();

    const query = useQuery({
        queryKey: [KEY, countryCode, user?.id, page, pageSize, search, statusFilter],
        queryFn: () => pricingRulesService.getPage({
            countryCode,
            page,
            pageSize,
            search,
            status: statusFilter
        }),
        staleTime: 5 * 60 * 1000
    });

    useEffect(() => { setPage(1); setSearch(''); setStatusFilter('all'); }, [countryCode, user?.id]);
    useEffect(() => {
        if (query.data && page > query.data.totalPages) setPage(query.data.totalPages);
    }, [query.data, page]);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: [KEY, countryCode] });

    const createRule = useMutation({
        mutationFn: (rule: Omit<PricingRule, 'id'>) =>
            pricingRulesService.create(rule, countryCode, user?.name || 'Unknown'),
        onSuccess: (rule) => {
            invalidate();
            addNotification('success', `Pricing Rule '${rule.name}' saved and enabled.`);
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
            addNotification('info', 'Pricing Rule deleted');
        },
        onError: (error: Error) => {
            logger.error('usePricingRules', 'delete failed', error);
            addNotification('alert', `Could not delete rule: ${error.message}`);
        }
    });

    return {
        rules: query.data?.rules ?? [],
        totalCount: query.data?.totalCount ?? 0,
        totalPages: query.data?.totalPages ?? 1,
        page,
        setPage,
        pageSize,
        setPageSize,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        isLoading: query.isFetching,
        error: query.error instanceof Error ? query.error.message : null,
        retry: () => { void query.refetch(); },
        createRule,
        toggleRule,
        deleteRule,
        fetchAllActive: () => pricingRulesService.getAllActive(countryCode)
    };
}
