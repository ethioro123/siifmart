import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollRunsService } from '../services/payroll-runs.service';
import type { PayrollRun } from '../types';
type Command = { action: 'create'; run: Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt'> } | { action: 'hr' | 'finance' | 'reject' | 'prepare' | 'settle'; id: string; notes?: string; reference?: string };
export function usePayrollCommands() {
    const client = useQueryClient();
    return useMutation({ mutationFn: (v: Command) => {
        switch (v.action) {
            case 'create': return payrollRunsService.create(v.run);
            case 'hr': return payrollRunsService.signAsHR(v.id, '', '', v.notes);
            case 'finance': return payrollRunsService.signAsFinance(v.id, '', '', v.notes);
            case 'reject': return payrollRunsService.reject(v.id, '', '', v.notes || '');
            case 'prepare': return payrollRunsService.prepare(v.id);
            case 'settle': return payrollRunsService.disburse(v.id, '', v.reference, v.notes);
        }
    }, onSuccess: run => {
        void client.invalidateQueries({ queryKey: ['payroll', run.countryCode, run.siteId] });
        void client.invalidateQueries({ queryKey: ['expenses', run.siteId] });
    } });
}
