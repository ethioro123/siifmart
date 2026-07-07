import React from 'react';
import { Product, TransferRecord, User } from '../../../types';

interface UsePOSTransferActionsProps {
    receivedItems: Array<{ product: Product; qty: number; timestamp: string }>;
    setReceivedItems: React.Dispatch<React.SetStateAction<Array<{ product: Product; qty: number; timestamp: string }>>>;
    selectedTransferForReceiving: string | null;
    setSelectedTransferForReceiving: React.Dispatch<React.SetStateAction<string | null>>;
    transferReceivingItems: any[];
    setTransferReceivingItems: React.Dispatch<React.SetStateAction<any[]>>;
    isConfirmingReceive: boolean;
    setIsConfirmingReceive: React.Dispatch<React.SetStateAction<boolean>>;
    isReceivingModalOpen: boolean;
    setIsReceivingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    user: User | null;
    updateProduct: any;
    transfers: TransferRecord[];
    products: Product[];
    receiveTransfer: any;
    addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
    refreshData: any;
}

export const usePOSTransferActions = ({
    receivedItems,
    setReceivedItems,
    selectedTransferForReceiving,
    setSelectedTransferForReceiving,
    transferReceivingItems,
    setTransferReceivingItems,
    isConfirmingReceive,
    setIsConfirmingReceive,
    isReceivingModalOpen,
    setIsReceivingModalOpen,
    user,
    updateProduct,
    transfers,
    products,
    receiveTransfer,
    addNotification,
    refreshData
}: UsePOSTransferActionsProps) => {

    const handleConfirmReceiving = React.useCallback(async () => {
        if (receivedItems.length === 0) {
            addNotification('alert', 'No items to confirm');
            return;
        }
        try {
            for (const item of receivedItems) {
                await updateProduct({
                    ...item.product,
                    posReceivedAt: new Date().toISOString(),
                    pos_received_at: new Date().toISOString(),
                    posReceivedBy: user?.name || 'POS User',
                    pos_received_by: user?.name || 'POS User'
                }, user?.name || 'POS User');
            }
            addNotification('success', `Confirmed ${receivedItems.length} item(s) as received.`);
        } catch (e) {
            addNotification('alert', 'Failed to confirm receiving.');
        }
    }, [receivedItems, user, updateProduct, addNotification]);

    const handleSelectTransferForReceiving = React.useCallback((transferId: string) => {
        const transfer = transfers.find((t: TransferRecord) => t.id === transferId);
        if (!transfer) return;
        setSelectedTransferForReceiving(transferId);
        const items = transfer.items.map((item: any) => {
            const product = products.find(p => p.sku === item.sku || p.id === item.productId);
            return {
                productId: item.productId,
                sku: item.sku,
                name: product?.name || item.name || 'Unknown Product',
                expectedQty: item.quantity,
                receivedQty: item.quantity,
                condition: 'Good' as const,
                notes: ''
            };
        });
        setTransferReceivingItems(items);
    }, [transfers, products, setSelectedTransferForReceiving, setTransferReceivingItems]);

    const handleUpdateTransferItem = React.useCallback((index: number, field: string, value: any) => {
        setTransferReceivingItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    }, [setTransferReceivingItems]);

    const handleConfirmTransferReceiving = React.useCallback(async () => {
        if (!selectedTransferForReceiving || transferReceivingItems.length === 0) {
            addNotification('alert', 'No transfer selected');
            return;
        }
        setIsConfirmingReceive(true);
        try {
            const transfer = transfers.find((t: TransferRecord) => t.id === selectedTransferForReceiving);
            if (!transfer) throw new Error('Transfer not found');
            const discrepancies = transferReceivingItems.filter(item => item.receivedQty !== item.expectedQty || item.condition !== 'Good');
            for (const item of transferReceivingItems) {
                const product = products.find(p => p.sku === item.sku || p.id === item.productId);
                if (product) {
                    await updateProduct({
                        ...product,
                        posReceivedAt: new Date().toISOString(),
                        pos_received_at: new Date().toISOString(),
                        posReceivedBy: user?.name || 'POS User',
                        pos_received_by: user?.name || 'POS User',
                        needsReview: item.condition === 'Damaged',
                        receivingNotes: item.notes || undefined
                    }, user?.name || 'POS User');
                }
            }
            const receivedQuantities: Record<string, number> = {};
            for (const item of transferReceivingItems) {
                if (item.condition !== 'Damaged' && item.receivedQty > 0) receivedQuantities[item.sku] = item.receivedQty;
                else if (item.condition === 'Damaged') receivedQuantities[item.sku] = 0;
            }
            await receiveTransfer(transfer.id, user?.name || 'POS User', receivedQuantities);
            if (discrepancies.length > 0) {
                addNotification('alert', `Received ${transferReceivingItems.length} items with discrepancies: ${discrepancies.length} found.`);
            } else {
                addNotification('success', `Successfully received ${transferReceivingItems.length} item(s) from transfer.`);
            }
            setSelectedTransferForReceiving(null);
            setTransferReceivingItems([]);
            setIsReceivingModalOpen(false);
            await refreshData();
        } catch (e) {
            addNotification('alert', 'Failed to confirm receiving.');
        } finally {
            setIsConfirmingReceive(false);
        }
    }, [selectedTransferForReceiving, transferReceivingItems, transfers, products, receiveTransfer, user, updateProduct, addNotification, refreshData, setSelectedTransferForReceiving, setTransferReceivingItems, setIsReceivingModalOpen, setIsConfirmingReceive]);

    return {
        handleConfirmReceiving,
        handleSelectTransferForReceiving,
        handleUpdateTransferItem,
        handleConfirmTransferReceiving
    };
};
