import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { merchandisingCampaignsService } from '../services/merchandising-campaigns.service';

export function useMerchandisingCampaigns(countryCode: string) {
  const queryClient = useQueryClient();
  const queryKey = ['merchandising_campaigns', countryCode];
  const query = useQuery({
    queryKey,
    queryFn: () => merchandisingCampaignsService.list(countryCode)
  });
  const create = useMutation({
    mutationFn: merchandisingCampaignsService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
  const approve = useMutation({
    mutationFn: merchandisingCampaignsService.approve,
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
  return { ...query, create, approve };
}
