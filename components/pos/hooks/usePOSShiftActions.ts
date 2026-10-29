import { useLanguage } from '../../../contexts/LanguageContext';
import { useCounterSummary } from '../../../hooks/useCounterControl';
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

    const { t } = useLanguage();
    const serverSummary = useCounterSummary(activeShift?.id, activeSite?.id, activeSite?.country, user?.id);
    const getShiftSummary = React.useCallback(() => serverSummary.data || { cash: 0, card: 0, mobile: 0, drops: 0, total: 0, expected: 0, blind: true }, [serverSummary.data]);

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
            setIsProcessing(false);
            setIsShiftModalOpen(false);
            addNotification('success', t('pos.counterSaved'));
            logout();
            navigate('/');
        } catch (e) {
            addNotification('alert', t('pos.counterFailed'));
            setIsProcessing(false);
        }
    }, [activeShift, cashDenominations, discrepancyReason, shiftNotes, closeShift, logout, navigate, addNotification, getShiftSummary, setIsProcessing, setIsShiftModalOpen]);

    return {
        handleCloseShift,
        getShiftSummary,
        handleSubmitShift
    };
};
