import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferIntakeService } from '../services/transfer-intake.service';
export function useTransferIntake() {
    const client = useQueryClient();
    return useMutation({ mutationFn: transferIntakeService.accept, onSuccess: value => {
        void client.invalidateQueries({ queryKey: ['jobs', value.siteId] });
        void client.invalidateQueries({ queryKey: ['transfer-variance', value.countryCode, value.siteId] });
    } });
}
