import { useMutation } from '@tanstack/react-query';
import { pickingExecutionService, type PickLineInput } from '../services/picking-execution.service';
export function usePickExecution() {
    return useMutation({ mutationFn: (input: PickLineInput) => pickingExecutionService.recordLine(input) });
}
