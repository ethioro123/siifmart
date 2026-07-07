import React from 'react';
import { ShiftRecord, SaleRecord } from '../../../types';

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
    addNotification
}: UsePOSShiftActionsProps) => {

    const handleCloseShift = React.useCallback(() => {
        setCountedCash('');
        setShiftNotes('');
        setClosingStep(1);
        setCashDenominations({ '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0 });
        setDiscrepancyReason('');
        setIsShiftModalOpen(true);
    }, [setCountedCash, setShiftNotes, setClosingStep, setCashDenominations, setDiscrepancyReason, setIsShiftModalOpen]);

    const getShiftSummary = React.useCallback(() => {
        if (!activeShift) return { cash: 0, card: 0, mobile: 0, total: 0, expected: 0 };
        const startTime = new Date(activeShift.startTime).getTime();
        const currentShiftSales = sales.filter(s => new Date(s.date).getTime() >= startTime);
        const cash = currentShiftSales.filter(s => s.method === 'Cash').reduce((sum, s) => sum + s.total, 0);
        const card = currentShiftSales.filter(s => s.method === 'Card').reduce((sum, s) => sum + s.total, 0);
        const mobile = currentShiftSales.filter(s => s.method === 'Mobile Money').reduce((sum, s) => sum + s.total, 0);
        return { cash, card, mobile, total: cash + card + mobile, expected: (activeShift.openingFloat || 0) + cash };
    }, [activeShift, sales]);

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
                expectedCash: summary.expected,
                actualCash,
                variance: actualCash - summary.expected,
                denominations: cashDenominations,
                discrepancyReason: discrepancyReason || shiftNotes,
                status: 'Closed'
            };
            await closeShift(record);
            setIsProcessing(false);
            setIsShiftModalOpen(false);
            addNotification('success', "Shift Closed Successfully.");
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
