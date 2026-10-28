import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { approvalInboxService } from '../services/approval-inbox.service';
import { APPROVAL_INBOX_KEY, APPROVAL_INBOX_ROLES, APPROVAL_QUEUES } from '../utils/unifiedApprovalInbox';

// Only tables already published in both environments. Other queues refresh on navigation/focus/manual refresh.
const LIVE_TABLES = new Set(['inventory_requests', 'purchase_orders', 'wms_jobs']);
export function useApprovalInbox(subscribe = false) {
  const { user } = useStore();
  const { effectiveCountry } = useData();
  const location = useLocation();
  const client = useQueryClient();
  const country = effectiveCountry || user?.country_code || user?.country || '';
  const enabled = Boolean(user?.id && country && APPROVAL_INBOX_ROLES.has(user.role));
  const key = useMemo(() => [APPROVAL_INBOX_KEY, user?.id, user?.role, country,
    user?.regionCode || user?.region_code, user?.siteId], [user?.id, user?.role, country, user?.regionCode, user?.region_code, user?.siteId]);
  const query = useQuery({ queryKey: key, queryFn: () => approvalInboxService.allReviews(country), enabled,
    staleTime: 15_000, refetchOnMount: true, refetchOnWindowFocus: true, refetchOnReconnect: true, retry: 1 });
  const sources = [...new Set((query.data?.queues || []).filter(q => q.status === 'ready')
    .map(q => APPROVAL_QUEUES[q.key]?.table).filter(table => LIVE_TABLES.has(table)))].sort().join(',');
  useEffect(() => { if (subscribe && enabled) void client.fetchQuery({ queryKey: key, queryFn: () => approvalInboxService.allReviews(country), staleTime: 15_000 }).catch(() => undefined); },
    [subscribe, enabled, location.key, country, client, key]);
  useEffect(() => {
    if (!subscribe || !enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => { void client.invalidateQueries({ queryKey: key }); }, 250); };
    const channel = supabase.channel('approval-inbox:' + user?.id + ':' + country);
    for (const table of sources.split(',').filter(Boolean)) channel.on('postgres_changes',
      { event: '*', schema: 'public', table, filter: 'country_code=eq.' + country }, refresh);
    if (sources) channel.subscribe(status => { if (status === 'SUBSCRIBED') void client.fetchQuery({ queryKey: key, queryFn: () => approvalInboxService.allReviews(country), staleTime: 15_000 }).catch(() => undefined); });
    const unsubscribe = client.getMutationCache().subscribe(event => {
      if (event.type === 'updated' && event.action.type === 'success') refresh();
    });
    const events = ['payroll:updated', 'salary:approved', 'salary:rejected', 'salary:created'];
    events.forEach(event => window.addEventListener(event, refresh));
    return () => { clearTimeout(timer); unsubscribe(); events.forEach(event => window.removeEventListener(event, refresh)); void supabase.removeChannel(channel); };
  }, [subscribe, enabled, country, user?.id, sources, client, key]);
  return { ...query, enabled };
}
