import { useMutation } from '@tanstack/react-query';
import { tasksService } from '../services/tasks.service';
import type { EmployeeTask } from '../types';
/** Never announce an incident until the task service returns a persisted record. */
export function useDriverIncident() {
    return useMutation({ mutationFn: async (task: Omit<EmployeeTask,'id'>) => {
        if (!task.description?.trim() || !task.assignedTo) throw new Error('A description and facility manager are required.');
        const saved=await tasksService.create(task);
        if (!saved?.id) throw new Error('Incident save was not confirmed. Please retry.');
        return saved;
    } });
}
