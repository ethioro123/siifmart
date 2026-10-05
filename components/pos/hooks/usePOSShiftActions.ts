import React from 'react';
import { ShiftRecord, SaleRecord, Site, User } from '../../../types';

interface UsePOSShiftActionsProps {
    closingStep: number;
    setClosingStep: React.Dispatch<React.SetStateAction<number>>;
    cashDenominations: Record<string, number>;
    setCashDenominations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    discrepancyReason: string;
    setDiscrepancyReason: React.Dispatch<React.SetStateAction<string>>;
    countedCash: string;
    setCountedCash: React.Dispatch<React.SetStateAction<string>>;
    shiftNotes: string;
    setShiftNotes: React.Dispatch<React.SetStateAction<string>>;
    setIsShiftModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    activeShift: ShiftRecord | undefined;
    sales: SaleRecord[];
    closeShift: any;
    logout: any;
    navigate: any;
    addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
    activeSite?: Site | undefined;
    user?: User | null;
}

export const usePOSShiftActions = ({
    closingStep,
    setClosingStep,
    cashDenominations,
    setCashDenominations,
    discrepancyReason,
    setDiscrepancyReason,
    countedCash,
    setCountedCash,
    shiftNotes,
    setShiftNotes,
    setIsShiftModalOpen,
    setIsProcessing,
    activeShift,
    sales,
    closeShift,
    logout,
    navigate,
    addNotification,
    activeSite,
    user
}: UsePOSShiftActionsProps) => {

    const handleCloseShift = React.useCallback(() => {
        setCountedCash('');
        setShiftNotes('');
        setClosingStep(1);
        const isKenya = activeSite?.country === 'KE' || activeSite?.currency === 'KES' || activeSite?.currency === 'KSh';
        if (isKenya) {
            setCashDenominations({ '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0 });
        } else {
            setCashDenominations({ '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0 });
        }
        setDiscrepancyReason('');
        setIsShiftModalOpen(true);
    }, [activeSite, setCountedCash, setShiftNotes, setClosingStep, setCashDenominations, setDiscrepancyReason, setIsShiftModalOpen]);

    const getShiftSummary = React.useCallback(() => {
        if (!activeShift) return { cash: 0, card: 0, mobile: 0, drops: 0, total: 0, expected: 0 };
        const startTime = new Date(activeShift.startTime).getTime();
        const siteId = activeShift?.siteId || activeSite?.id;
        const isCentralHQ = ['super_admin', 'regional_manager', 'operations_manager', 'inventory_manager', 'store_manager'].includes(user?.role || '');

        const currentShiftSales = sales.filter(s => {
            const saleTime = new Date(s.date).getTime();
            if (saleTime < startTime) return false;
            // Site Scoping: Never aggregate sales from other branches
            if (siteId && s.siteId !== siteId && (s as any).site_id !== siteId) return false;
            // Cashier Scoping: match cashier if set
            if (activeShift?.cashierId) {
                const matchCashier = (s as any).cashierId === activeShift.cashierId || (s as any).cashier_id === activeShift.cashierId;
                if (!matchCashier && !isCentralHQ) return false;
            }
            return true;
        });

        const cash = currentShiftSales.filter(s => s.method === 'Cash').reduce((sum, s) => sum + s.total, 0);
        const card = currentShiftSales.filter(s => s.method === 'Card').reduce((sum, s) => sum + s.total, 0);
        const mobile = currentShiftSales.filter(s => s.method === 'Mobile Money' || (s.method as any) === 'Telebirr' || (s.method as any) === 'CBE Birr').reduce((sum, s) => sum + s.total, 0);
        const drops = Number(activeShift.cashDrops || (activeShift as any).cash_drops || 0);
        const expected = Math.max(0, (activeShift.openingFloat || 0) + cash - drops);
        return { cash, card, mobile, drops, total: cash + card + mobile, expected };
    }, [activeShift, sales, activeSite, user]);

    const handleSubmitShift = React.useCallback(async () => {
        if (!activeShift) return;
        setIsProcessing(true);
        try {
            const summary = getShiftSummary();
            const actualCash = Object.entries(cashDenominations).reduce((sum, [value, count]) => sum + (parseInt(value) * count), 0);
            const record: any = {
                ...activeShift,
                endTime: new Date().toISOString(),
                cashSales: summary.cash,
                cardSales: summary.card,
                mobileSales: summary.mobile,
                cashDrops: summary.drops,
                cash_drops: summary.drops,
                expectedCash: summary.expected,
                actualCash,
                variance: actualCash - summary.expected,
                denominations: cashDenominations,
                discrepancyReason: discrepancyReason || shiftNotes,
                status: 'Closed'
            };
            await closeShift(record);
            if (Math.abs(record.variance) > 0.01) {
                try {
                    const { systemLogsService } = await import('../../../services/supabase.service');
                    await systemLogsService.create({
                        module: 'POS_CASH_DRAWER',
                        action: 'SHIFT_VARIANCE_LOGGED',
                        user_name: activeShift.cashierName || 'Cashier',
                        details: `Shift closed with variance: ${record.variance > 0 ? '+' : ''}${record.variance}. Counted: ${record.actualCash}, Expected: ${record.expectedCash}. Reason: ${record.discrepancyReason || 'N/A'}`
                    });
                } catch {
                    // Non-blocking audit log
                }
            }
            setIsProcessing(false);
            setIsShiftModalOpen(false);
            addNotification('success', "Shift Closed & Reconciled Successfully.");
            logout();
            navigate('/');
        } catch (e) {
            addNotification('alert', 'Failed to close shift.');
            setIsProcessing(false);
        }
    }, [activeShift, cashDenominations, discrepancyReason, shiftNotes, closeShift, logout, navigate, addNotification, getShiftSummary, setIsProcessing, setIsShiftModalOpen]);

    return {
        handleCloseShift,
        getShiftSummary,
        handleSubmitShift
    };
};
