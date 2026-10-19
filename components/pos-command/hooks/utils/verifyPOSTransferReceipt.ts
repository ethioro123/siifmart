import { transferReceiptVerificationService } from '../../../../services/transfer-receipt-verification.service';

export async function verifyPOSTransferReceipt(jobId: string, receivedItems: any[]): Promise<any[]> {
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
        return receivedItems;
    }

    if (verification.status !== 'verified') {
        throw new Error('Transfer receipt verification is not ready. Refresh the transfer and try again.');
    }

    const savedLinesMatch = verification.items.every((savedItem, index) => {
        const submittedItem = receivedItems[index];
        const savedSku = savedItem.sku?.trim().toUpperCase();
        const submittedSku = submittedItem.sku?.trim().toUpperCase();
        return savedSku && submittedSku
            ? savedSku === submittedSku
            : Boolean(savedItem.productId && submittedItem.productId && savedItem.productId === submittedItem.productId);
    });
    if (!savedLinesMatch) {
        throw new Error('Transfer lines differ from the saved receipt count. Refresh the transfer before continuing.');
    }

    // A prior attempt may have saved the count before a later stock step failed.
    // Resume from that accountable count rather than the form's reset quantities.
    return receivedItems.map((item, index) => ({
        ...item,
        receivedQty: Number(verification.items[index].receivedQty || 0),
        condition: verification.items[index].condition || 'Good'
    }));
}
