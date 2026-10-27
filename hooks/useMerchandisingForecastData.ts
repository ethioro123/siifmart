import { useQuery } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { salesService } from '../services/sales.service';
import { purchaseOrdersService } from '../services/purchase-orders.service';
import { transfersService } from '../services/transfers.service';
import { productsService } from '../services/products.service';
import { logger } from '../utils/logger';
import type { Product, PurchaseOrder, SaleRecord } from '../types';
import type { TransferRecord } from '../types/infrastructure';

interface ForecastDataResult {
    products: Product[];
    sales30d: SaleRecord[];
    openPOs: PurchaseOrder[];
    openTransfers: TransferRecord[];
}

export function useMerchandisingForecastData(enabled: boolean = true) {
    const { user } = useStore();
    const { activeSite, activeRegionCode, effectiveCountry, settings, products: fallbackProducts } = useData();
    const activeCountry = (effectiveCountry || settings?.country || 'ET').toUpperCase();
    const activeSiteId = activeSite?.id;

    return useQuery<ForecastDataResult>({
        queryKey: ['merchandising_forecast_dataset', activeCountry, activeSiteId, activeRegionCode, user?.id],
        queryFn: async () => {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

            try {
                // Rule 10 & Multi-Country Sovereignty:
                // Concurrently fetch full 30-day completed sales with line items,
                // open pipeline purchase orders, active in-flight transfers, and catalog products
                const [salesRes, poRes, transfersRes, prodsRes] = await Promise.all([
                    salesService.getAll(activeSiteId, 500, 0, {
                        startDate: startDateStr,
                        status: 'Completed',
                        includeItems: true,
                        countryCode: activeCountry
                    }).catch(err => {
                        logger.warn('useMerchandisingForecastData', 'Failed to fetch 30d sales:', err);
                        return { data: [] as SaleRecord[], count: 0 };
                    }),
                    purchaseOrdersService.getAll(activeSiteId, 100, 0, {
                        includeItems: true,
                        countryCode: activeCountry
                    }).catch(err => {
                        logger.warn('useMerchandisingForecastData', 'Failed to fetch open POs:', err);
                        return { data: [] as PurchaseOrder[], count: 0 };
                    }),
                    transfersService.getAll(activeSiteId, 50, activeRegionCode || undefined, activeCountry).catch(err => {
                        logger.warn('useMerchandisingForecastData', 'Failed to fetch transfers:', err);
                        return [] as TransferRecord[];
                    }),
                    productsService.getAll(activeSiteId, 500, 0, undefined, undefined, false).catch(err => {
                        logger.warn('useMerchandisingForecastData', 'Failed to fetch products catalog:', err);
                        return { data: [] as Product[], count: 0 };
                    })
                ]);

                const resolvedProducts = prodsRes.data && prodsRes.data.length > 0
                    ? prodsRes.data
                    : (fallbackProducts || []);

                return {
                    products: resolvedProducts,
                    sales30d: salesRes.data || [],
                    openPOs: poRes.data || [],
                    openTransfers: Array.isArray(transfersRes) ? transfersRes : []
                };
            } catch (error) {
                logger.error('useMerchandisingForecastData', 'Critical failure loading forecast dataset:', error as Error);
                return {
                    products: fallbackProducts || [],
                    sales30d: [],
                    openPOs: [],
                    openTransfers: []
                };
            }
        },
        enabled: enabled && Boolean(user?.id),
        staleTime: 30_000
    });
}
