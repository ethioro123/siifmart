import { putawayPlacementService } from '../../../../services/putaway-placement.service';

/** Stock, movement audit, and job-line placement are committed together by the server. */
export function usePutawayStock() {
    const putawayStock = async (params: {
        jobId?: string;
        itemIndex?: number;
        sku: string,
        location: string,
        quantity: number,
        siteId: string,
        type: 'IN' | 'TRANSFER',
        expiryDate?: string,
        batchNumber?: string,
        sourceProductId?: string,
        timestamp?: string,
        size?: string,
        brand?: string,
        unit?: string,
        image?: string,
        packQuantity?: number,
        packageType?: string,
        caseSize?: number,
        category?: string,
        retailPrice?: number,
        customAttributes?: unknown,
        description?: string,
        minStock?: number,
        maxStock?: number
    }) => {
        if (!params.jobId || params.itemIndex === undefined) throw new Error('Open the assigned Putaway job before placing stock.');
        await putawayPlacementService.place(params.jobId, params.itemIndex, params.quantity, params.location);
    };
    return { putawayStock };
}
