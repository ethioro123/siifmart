import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeChangesService } from '../services/employee-changes.service';
import { salaryRequestsService } from '../services/salary-requests.service';
interface Decision { id: string; approve: boolean; reason: string }
export function useEmployeeProfileDecision() {
    const client = useQueryClient();
    return useMutation({ mutationFn: (v: Decision) => v.approve ? employeeChangesService.approve(v.id, '', '', v.reason) : employeeChangesService.reject(v.id, '', v.reason), onSuccess: value => {
        if (value.status === 'approved') void client.invalidateQueries({ queryKey: ['employees', value.siteId] });
    } });
}
export function useSalaryDecision() {
    const client = useQueryClient();
    return useMutation({ mutationFn: (v: Decision) => v.approve ? salaryRequestsService.approve(v.id, { name: '', role: '' }) : salaryRequestsService.reject(v.id, { name: '', role: '' }, v.reason), onSuccess: value => {
        if (value.status === 'approved') void client.invalidateQueries({ queryKey: ['employees', value.siteId] });
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(value.status === 'approved' ? 'salary:request-approved' : 'salary:request-rejected'));
    } });
}
export function useSalaryProposal() {
    return useMutation({ mutationFn: (v: Parameters<typeof salaryRequestsService.create>[0]) => salaryRequestsService.create(v) });
}
