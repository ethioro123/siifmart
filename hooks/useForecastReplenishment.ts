import { useMutation, useQueryClient } from '@tanstack/react-query';
import { merchandisingForecastService } from '../services/merchandising-forecast.service';

export function useForecastReplenishment(country: string | undefined, siteId: string | undefined, userId: string | undefined) {
    const client = useQueryClient();
    return useMutation({
        mutationKey: ['forecast_replenishment', country, siteId, userId],
        mutationFn: ({ productId, quantity }: { productId: string; quantity: number; country: string; siteId: string }) => merchandisingForecastService.request(productId, quantity),
        onSuccess: async (_result, variables) => {
            await client.invalidateQueries({ queryKey: ['merchandising_forecast_dataset', variables.country, variables.siteId] });
        },
    });
}
