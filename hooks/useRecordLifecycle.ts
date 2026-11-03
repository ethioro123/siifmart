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
      await Promise.all([cache.invalidateQueries({ queryKey: key }), cache.invalidateQueries({ queryKey: ['lifecycle-events', actor, result.request_id] })]);
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
