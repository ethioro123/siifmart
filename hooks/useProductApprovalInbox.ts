import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { approvalInboxService } from '../services/approval-inbox.service';
import { PRODUCT_APPROVAL_ROLES, PRODUCT_APPROVAL_INBOX_KEY } from '../utils/approvalInbox';

export function useProductApprovalInbox(subscribe = false) {
  const { user } = useStore();
  const { effectiveCountry } = useData();
  const location = useLocation();
  const queryClient = useQueryClient();
  const country = effectiveCountry || user?.country_code || user?.country || '';
  const enabled = Boolean(user?.id && country && PRODUCT_APPROVAL_ROLES.has(user.role));
  const key = useMemo(() => [PRODUCT_APPROVAL_INBOX_KEY, user?.id, user?.role, country,
    user?.regionCode || user?.region_code, user?.siteId], [user?.id, user?.role, country, user?.regionCode, user?.region_code, user?.siteId]);
  const [live, setLive] = useState(false);
  const query = useQuery({ queryKey: key, queryFn: () => approvalInboxService.productReviews(country), enabled,
    staleTime: 15_000, refetchOnMount: 'always', refetchOnWindowFocus: 'always', refetchOnReconnect: 'always', retry: 1 });
  useEffect(() => {
    if (subscribe && enabled) void queryClient.invalidateQueries({ queryKey: key });
  }, [subscribe, enabled, location.key, queryClient, key]);
  useEffect(() => {
    if (!subscribe || !enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setLive(false);
    const channel = supabase.channel('product-approval-inbox:' + user?.id + ':' + country)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_requests', filter: 'country_code=eq.' + country }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => { void queryClient.invalidateQueries({ queryKey: key }); }, 250);
      }).subscribe(status => { setLive(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') void queryClient.invalidateQueries({ queryKey: key });
      });
    return () => { clearTimeout(timer); void supabase.removeChannel(channel); };
  }, [subscribe, enabled, country, user?.id, queryClient, key]);
  return { ...query, enabled, live };
}
