import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { disciplinaryService, type NoticeInput } from '../services/disciplinary.service';
type Command = { action: 'issue'; input: NoticeInput } | { action: 'appeal' | 'Upheld' | 'Overturned'; id: string; notes: string };
export function useDisciplinaryCommand() {
 const queryClient = useQueryClient();
 const retry = useRef<{ key: string; id: string } | null>(null);
 return useMutation({ mutationFn: async (command: Command) => {
  if (command.action === 'issue') {
   const key = JSON.stringify(command.input);
   if (retry.current?.key !== key) retry.current = { key, id: crypto.randomUUID() };
   const saved = await disciplinaryService.issueDisciplinaryNotice(command.input, retry.current.id);
   retry.current = null; return saved;
  }
  return disciplinaryService.decide(command.id, command.action, command.notes);
 }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['disciplinary'] }) });
}
