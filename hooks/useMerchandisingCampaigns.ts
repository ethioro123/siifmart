import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  merchandisingCampaignsService,
  CampaignListParams,
  CampaignListResult
} from '../services/merchandising-campaigns.service';

export type UseMerchandisingCampaignsParams = string | CampaignListParams;

export function useMerchandisingCampaigns(params: UseMerchandisingCampaignsParams) {
  const queryClient = useQueryClient();

  const options: CampaignListParams = typeof params === 'string'
    ? { countryCode: params, page: 1, pageSize: 25, status: 'all' }
    : {
        countryCode: params.countryCode,
        regionCode: params.regionCode,
        siteId: params.siteId,
        status: params.status || 'all',
        page: params.page || 1,
        pageSize: params.pageSize || 25
      };

  const queryKey = [
    'merchandising_campaigns',
    options.countryCode,
    options.regionCode || 'all',
    options.siteId || 'all',
    options.status || 'all',
    options.page || 1,
    options.pageSize || 25
  ];

  const query = useQuery<CampaignListResult>({
    queryKey,
    queryFn: () => merchandisingCampaignsService.list(options),
    enabled: Boolean(options.countryCode)
  });

  const create = useMutation({
    mutationFn: merchandisingCampaignsService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchandising_campaigns'] })
  });

  const approve = useMutation({
    mutationFn: (id: string) => merchandisingCampaignsService.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchandising_campaigns'] })
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      merchandisingCampaignsService.reject(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchandising_campaigns'] })
  });

  return {
    ...query,
    data: query.data?.proposals || [],
    proposals: query.data?.proposals || [],
    totalCount: query.data?.totalCount || 0,
    currentPage: query.data?.page || options.page || 1,
    pageSize: query.data?.pageSize || options.pageSize || 25,
    create,
    approve,
    reject
  };
}
