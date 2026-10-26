import { useMutation } from '@tanstack/react-query';
import { pickingExecutionService, type PickLineInput } from '../services/picking-execution.service';
import { discrepancyService } from '../services/discrepancy.service';
export class PickRecountRequiredError extends Error {
    constructor() { super('Recount and report this physical difference for independent supervisor reconciliation.'); }
}
export function usePickExecution() {
    return useMutation({ mutationFn: async ({ expectedQuantity, ...input }: PickLineInput & { expectedQuantity?: number }) => {
        if (expectedQuantity !== undefined && input.quantity < expectedQuantity) {
            const history = await discrepancyService.getFloorHistory(input.jobId);
            const approved = history.some(d => d.item_index === input.itemIndex && d.expected_qty === expectedQuantity && d.resolution === 'short_pick' && !!d.resolved_at && d.resolved_qty === input.quantity);
            if (!approved || history.some(d => !d.resolved_at)) throw new PickRecountRequiredError();
        }
        return pickingExecutionService.recordLine(input);
    } });
}
