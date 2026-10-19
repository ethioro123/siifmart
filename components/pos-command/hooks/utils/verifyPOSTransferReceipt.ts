import { transferReceiptVerificationService } from '../../../../services/transfer-receipt-verification.service';

export async function verifyPOSTransferReceipt(jobId: string, receivedItems: any[]): Promise<void> {
    const verification = await transferReceiptVerificationService.get(jobId);
    if (verification.items.length !== receivedItems.length) {
        throw new Error('Transfer lines changed while receiving. Refresh the transfer before continuing.');
    }

    if (verification.canCount) {
        const countItems = receivedItems.map((item, index) => ({
            ...item,
            productId: verification.items[index].productId
        }));
        await transferReceiptVerificationService.recordCount(jobId, countItems);
        return;
    }

    if (verification.status !== 'verified') {
        throw new Error('Transfer receipt verification is not ready. Refresh the transfer and try again.');
    }

    const savedCountMatches = verification.items.every((savedItem, index) => {
        const submittedItem = receivedItems[index];
        return savedItem.sku?.trim().toUpperCase() === submittedItem.sku?.trim().toUpperCase() &&
            Number(savedItem.receivedQty || 0) === Number(submittedItem.receivedQty || 0) &&
            (savedItem.condition || 'Good') === (submittedItem.condition || 'Good');
    });
    if (!savedCountMatches) {
        throw new Error('A receipt count is already recorded for this transfer. Reload it to continue with the saved count.');
    }
}
