import React from 'react';
import { SaleRecord, ReturnItem, ReturnCondition, ReturnReason, User } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';

interface UsePOSReturnActionsProps {
    returnSearchId: string;
    setReturnSearchId: React.Dispatch<React.SetStateAction<string>>;
    foundSaleForReturn: SaleRecord | null;
    setFoundSaleForReturn: React.Dispatch<React.SetStateAction<SaleRecord | null>>;
    returnConfig: Record<string, { qty: number, condition: ReturnCondition, reason: ReturnReason }>;
    setReturnConfig: React.Dispatch<React.SetStateAction<Record<string, { qty: number, condition: ReturnCondition, reason: ReturnReason }>>>;
    setIsReturnModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    sales: SaleRecord[];
    user: User | null;
    processReturn: any;
    addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
}

export const usePOSReturnActions = ({
    returnSearchId,
    setReturnSearchId,
    foundSaleForReturn,
    setFoundSaleForReturn,
    returnConfig,
    setReturnConfig,
    setIsReturnModalOpen,
    setIsProcessing,
    sales,
    user,
    processReturn,
    addNotification
}: UsePOSReturnActionsProps) => {

    const handleSearchForReturn = React.useCallback(() => {
        const sale = sales.find(s => s.id === returnSearchId || s.receiptNumber === returnSearchId || s.id === `TX-${returnSearchId}`);
        if (sale) {
            setFoundSaleForReturn(sale);
            const initialConfig: Record<string, any> = {};
            sale.items.forEach(item => {
                initialConfig[item.id] = { qty: 0, condition: 'Resalable', reason: 'Customer Changed Mind' };
            });
            setReturnConfig(initialConfig);
        } else {
            setFoundSaleForReturn(null);
            addNotification('alert', 'Transaction not found.');
        }
    }, [sales, returnSearchId, setFoundSaleForReturn, setReturnConfig, addNotification]);

    const updateReturnConfig = React.useCallback((itemId: string, field: string, value: any) => {
        setReturnConfig(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    }, [setReturnConfig]);

    const handleProcessReturn = React.useCallback(async () => {
        if (!foundSaleForReturn) return;
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const returnItems: ReturnItem[] = [];
        let refundTotal = 0;
        foundSaleForReturn.items.forEach(item => {
            const config = returnConfig[item.id];
            if (config && config.qty > 0) {
                const refundAmount = item.price * config.qty;
                refundTotal += refundAmount;
                returnItems.push({
                    productId: item.id,
                    quantity: config.qty,
                    reason: config.reason,
                    condition: config.condition,
                    refundAmount
                });
            }
        });
        if (returnItems.length > 0) {
            await processReturn(foundSaleForReturn.id, returnItems, refundTotal, user?.name || 'System');
            addNotification('success', `Refund Processed: ${CURRENCY_SYMBOL} ${refundTotal.toLocaleString()}`);
        }
        setIsProcessing(false);
        setIsReturnModalOpen(false);
        setFoundSaleForReturn(null);
        setReturnSearchId('');
        setReturnConfig({});
    }, [foundSaleForReturn, returnConfig, processReturn, user, setIsProcessing, setIsReturnModalOpen, setFoundSaleForReturn, setReturnSearchId, setReturnConfig, addNotification]);

    return {
        handleSearchForReturn,
        updateReturnConfig,
        handleProcessReturn
    };
};
