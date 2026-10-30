import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeAccessService, type PreparedEmployeeAccess } from '../services/employee-access.service';

/** Transient credentials stay in this mounted handover session, outside query/mutation caches. */
export function useEmployeeAccessHandover(employeeId: string, countryCode: string) {
    const [access, setAccess] = useState<PreparedEmployeeAccess | null>(null);
    const busy = useRef(false);
    const cache = useQueryClient();
    const prepare = useMutation({
        gcTime: 0, retry: false,
        mutationFn: async () => {
            if (busy.current) throw new Error('Access request is already in progress');
            busy.current = true;
            try { setAccess(await employeeAccessService.prepare(employeeId, countryCode)); }
            finally { busy.current = false; }
        }
    });
    const complete = useMutation({
        gcTime: 0, retry: false,
        mutationFn: async () => {
            if (!access || access.employeeId !== employeeId) throw new Error('Verify login access first');
            return employeeAccessService.complete(employeeId, countryCode);
        },
        onSuccess: () => {
            setAccess(null);
            void cache.invalidateQueries({ queryKey: ['employees'] }).catch(() => undefined);
            window.dispatchEvent(new CustomEvent('employee:updated'));
        }
    });
    return { access, prepare, complete };
}
