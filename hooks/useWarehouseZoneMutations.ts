import { useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseZonesService } from '../services/zones.service';
import type { WarehouseZone } from '../types';

export function useWarehouseZoneMutations(siteId?: string) {
    const client = useQueryClient();
    const invalidate = () => client.invalidateQueries({ queryKey: ['zones', siteId] });
    const create = useMutation({
        mutationFn: (zone: Omit<WarehouseZone, 'id'>) => warehouseZonesService.create(zone),
        onSuccess: invalidate
    });
    const update = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<WarehouseZone> }) => warehouseZonesService.update(id, updates),
        onSuccess: invalidate
    });
    return { createZone: create.mutateAsync, updateZone: update.mutateAsync };
}
