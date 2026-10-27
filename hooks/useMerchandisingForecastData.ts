import { useQuery } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { merchandisingForecastService } from '../services/merchandising-forecast.service';

export function useMerchandisingForecastData(enabled = true) {
    const { user } = useStore();
    const { activeSite, activeRegionCode, effectiveCountry } = useData();
    const country = effectiveCountry?.toUpperCase();
    const site = activeSite?.id;
    return useQuery({
        queryKey: ['merchandising_forecast_dataset', country, site, activeRegionCode, user?.id],
        queryFn: () => merchandisingForecastService.get(site!, country!),
        enabled: enabled && Boolean(user?.id && country && site && site !== 'All'),
        staleTime: 30_000,
    });
}
