import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordLifecycleService } from '../services/record-lifecycle.service';
import type { LifecycleKind } from '../types/recordLifecycle';
export function useRecordLifecycle(actor: string, country: string, open: boolean, page: number, history: boolean) {
  const cache = useQueryClient();
  const key = ['record-lifecycle', actor, country];
  const list = useQuery({ queryKey: [...key, page, history], queryFn: () => recordLifecycleService.list(country, page, history), enabled: open && Boolean(actor && country), staleTime: 15_000 });
  const request = useMutation({ mutationFn: (input: { kind: LifecycleKind; targetId: string; reason: string; evidence: Record<string, string | boolean> }) =>
    recordLifecycleService.request(input.kind, input.targetId, input.reason, input.evidence), onSuccess: () => cache.invalidateQueries({ queryKey: key }) });
  const decide = useMutation({ mutationFn: (input: { id: string; decision: 'approve' | 'reject' | 'withdraw'; reason: string }) => recordLifecycleService.decide(input.id, input.decision, input.reason),
    onSuccess: async (result) => {
      const record = list.data?.rows.find(row => row.id === result.request_id);
      await Promise.all([cache.invalidateQueries({ queryKey: key }), cache.invalidateQueries({ queryKey: ['lifecycle-events', actor, result.request_id] })]);
      if (result.status === 'Applied' && record) {
        await cache.invalidateQueries({ queryKey: ['lifecycle-targets', actor, country, record.kind] });
        await cache.invalidateQueries({ predicate: query => {
          const k = query.queryKey;
          if (k[0] === 'regional-operating-summary') return k[1] === actor && k[2] === record.region_code && k[3] === country;
          if (record.kind === 'site' && k[0] === 'sites') return k[1] === actor && k[2] === country;
          if (record.kind === 'employee') return (k[0] === 'employees' && k[1] === record.site_id)
            || (k[0] === 'regional-employees' && k[1] === record.region_code);
          if (record.kind === 'purchase_order') return (k[0] === 'orders' && k[1] === record.site_id)
            || (k[0] === 'regional-orders' && k[1] === record.region_code)
            || (k[0] === 'purchase_orders' && k[1] === country && (k[2] === '' || String(k[2]).split(',').includes(record.site_id)));
          if (record.kind === 'transfer') return (k[0] === 'transfers' && k[1] === record.site_id)
            || (k[0] === 'regional-transfers' && k[1] === record.region_code);
          return record.kind === 'warehouse_job' && k[0] === 'jobs' && k[1] === record.site_id;
        } });
      }
    } });
  return { list, request, decide };
}
export function useLifecycleTargets(actor: string, country: string, kind: LifecycleKind, search: string, page: number, enabled: boolean) {
  return useQuery({ queryKey: ['lifecycle-targets', actor, country, kind, search, page], queryFn: () => recordLifecycleService.targets(kind, country, search, page), enabled: enabled && Boolean(actor && country), staleTime: 30_000 });
}
export function useLifecycleEvents(actor: string, requestId: string, page: number, enabled: boolean) {
  return useQuery({ queryKey: ['lifecycle-events', actor, requestId, page], queryFn: () => recordLifecycleService.events(requestId, page), enabled: enabled && Boolean(actor && requestId), staleTime: 60_000 });
}

export function useLifecycleHolds(actor: string, country: string, kind: LifecycleKind, targetId: string, page: number) {
  const cache = useQueryClient();
  const key = ['lifecycle-holds', actor, country, kind, targetId];
  const list = useQuery({ queryKey: [...key, page], queryFn: () => recordLifecycleService.holds(kind, targetId, country, page), staleTime: 15_000 });
  const decide = useMutation({ mutationFn: (input: { reason: string; release: boolean }) => recordLifecycleService.setHold(kind, targetId, input.reason, input.release),
    onSuccess: () => cache.invalidateQueries({ queryKey: key }) });
  return { list, decide };
}
