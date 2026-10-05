import React from 'react';
import { SaleRecord, ReturnItem, ReturnCondition, ReturnReason, User, Site } from '../../../types';
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
    activeSite?: Site | undefined;
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
    addNotification,
    activeSite
}: UsePOSReturnActionsProps) => {

    const handleSearchForReturn = React.useCallback(() => {
        const query = returnSearchId.trim().toLowerCase();
        if (!query) {
            setFoundSaleForReturn(null);
            return;
        }
        const sale = sales.find(s => {
            const sId = (s.id || '').toLowerCase();
            const rNum = (s.receiptNumber || '').toLowerCase();
            return sId === query || rNum === query || `tx-${sId}` === query || sId.replace(/[^a-z0-9]/g, '') === query.replace(/[^a-z0-9]/g, '');
        });
        if (sale) {
            // Zero-Trust & National Sovereignty: Verify store boundary
            const saleSiteId = sale.siteId || (sale as any).site_id;
            if (activeSite?.id && saleSiteId && saleSiteId !== activeSite.id) {
                setFoundSaleForReturn(null);
                addNotification('alert', 'Zero-Trust Notice: This receipt belongs to a different store. Cross-store returns require Central HQ Manager transfer.');
                return;
            }

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
    }, [sales, returnSearchId, activeSite, setFoundSaleForReturn, setReturnConfig, addNotification]);

    const updateReturnConfig = React.useCallback((itemId: string, field: string, value: any) => {
        setReturnConfig(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    }, [setReturnConfig]);

    const handleProcessReturn = React.useCallback(async (refundMethod: string = 'STORE_CREDIT', customerPhone: string = '', hqOtp?: string) => {
        if (!foundSaleForReturn) return;
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        const returnItems: ReturnItem[] = [];
        let refundTotal = 0;
        foundSaleForReturn.items.forEach(item => {
            const config = returnConfig[item.id];
            if (config && config.qty > 0) {
                // Safeguard: Ensure return quantity never exceeds purchased quantity
                const safeQty = Math.min(config.qty, item.quantity);
                const refundAmount = item.price * safeQty;
                refundTotal += refundAmount;
                returnItems.push({
                    productId: item.id,
                    quantity: safeQty,
                    reason: config.reason,
                    condition: config.condition,
                    refundAmount
                });
            }
        });
        if (returnItems.length > 0) {
            await processReturn(foundSaleForReturn.id, returnItems, refundTotal, user?.name || 'System');
            try {
                const { systemLogsService } = await import('../../../services/supabase.service');
                await systemLogsService.create({
                    module: 'POS_RETURNS_AUDIT',
                    action: 'ZERO_TRUST_REFUND_EXECUTED',
                    user_name: user?.name || 'Cashier',
                    details: `Zero-Trust Refund of ${CURRENCY_SYMBOL} ${refundTotal.toLocaleString()} processed via ${refundMethod}. Receipt: ${foundSaleForReturn.receiptNumber || foundSaleForReturn.id}. Customer Phone: ${customerPhone || 'N/A'}. HQ Authorization: ${hqOtp ? 'VERIFIED_OTP' : 'NOT_REQUIRED'}. (${returnItems.length} item types returned)`
                });
            } catch (logErr) {
                // Non-blocking audit log
            }
            const tenderLabel = refundMethod === 'STORE_CREDIT' ? 'Store Credit' : refundMethod === 'TELEBIRR' ? 'Telebirr' : refundMethod === 'CBE_BIRR' ? 'CBE Birr' : (refundMethod as string) === 'M_PESA' ? 'M-Pesa' : 'Cash (HQ Approved)';
            addNotification('success', `Refund Issued via ${tenderLabel}: ${CURRENCY_SYMBOL} ${refundTotal.toLocaleString()}`);
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
