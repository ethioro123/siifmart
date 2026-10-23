import { useMutation } from '@tanstack/react-query';
import { wmsJobsService } from '../services/wms-jobs.service';

/** The server authorizes the transfer and creates or reuses its one PICK job atomically. */
export function useApproveTransferPicking() {
    return useMutation({ mutationFn: (transferId: string) => wmsJobsService.approveTransferForPicking(transferId) });
}
