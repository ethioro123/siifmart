import React, { createContext, useContext, useState } from 'react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { useFulfillmentData } from '../fulfillment/FulfillmentDataProvider';
import { useGamification } from '../../contexts/GamificationContext';
import { useDateFilter, DateRangeOption } from '../../hooks/useDateFilter';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatJobId } from '../../utils/jobIdFormatter';

// Hooks
import { usePOSReceiving } from './hooks/usePOSReceiving';

// Define the shape of the Context
interface POSCommandContextType {
    // Navigation & Date
    dateRange: DateRangeOption;
    setDateRange: (range: DateRangeOption) => void;
    isWithinRange: (date: string) => boolean;
    filteredSales: any[];

    // App State Lookups
    activeShift: any;
    cashInDrawer: number;
    personalSales: number;
    txCount: number;
    returnCount: number;
    totalRevenue: number;
    getShiftSummary: () => any;
    myPoints: any;
    siteWorkerPoints: any[];
    hourlyData: any[];
    paymentChartData: any[];

    // Screen/Security State
    isLocked: boolean;
    setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
    pin: string;
    setPin: React.Dispatch<React.SetStateAction<string>>;

    // Receiving State
    isReceivingModalOpen: boolean;
    setIsReceivingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    receivingSummary: any;
    setReceivingSummary: React.Dispatch<React.SetStateAction<any>>;
    selectedTransferForReceiving: string | null;
    setSelectedTransferForReceiving: React.Dispatch<React.SetStateAction<string | null>>;
    isConfirmingReceive: boolean;
    orderRefScanInput: string;
    setOrderRefScanInput: React.Dispatch<React.SetStateAction<string>>;
    transferScanBarcode: string;
    setTransferScanBarcode: React.Dispatch<React.SetStateAction<string>>;
    transferReceivingItems: any[];
    setTransferReceivingItems: React.Dispatch<React.SetStateAction<any[]>>;

    // Stock Search State
    isStockListOpen: boolean;
    setIsStockListOpen: React.Dispatch<React.SetStateAction<boolean>>;
    stockSearch: string;
    setStockSearch: React.Dispatch<React.SetStateAction<string>>;

    // Shift Closing State
    isClosingShift: boolean;
    setIsClosingShift: React.Dispatch<React.SetStateAction<boolean>>;
    closingStep: number;
    setClosingStep: React.Dispatch<React.SetStateAction<number>>;
    cashDenominations: Record<string, number>;
    setCashDenominations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    discrepancyReason: string;
    setDiscrepancyReason: React.Dispatch<React.SetStateAction<string>>;
    isSubmittingShift: boolean;

    // Transactions Display State
    txPage: number;
    setTxPage: React.Dispatch<React.SetStateAction<number>>;
    TX_PER_PAGE: number;

    // Handlers
    handleScanOrderRef: (ref: string) => void;
    handleSelectTransferForReceiving: (transferId: string) => void;
    handleUpdateTransferItem: (index: number, field: string, value: any) => void;
    handleScanTransferItem: (barcode: string) => void;
    handleConfirmTransferReceiving: () => Promise<void>;
    repairShipmentInventory: (jobId: string) => Promise<void>;
    handleCloseReceivingModal: () => void;
    handleLockScreen: () => void;
    handleReprint: () => void;
    handleEndShift: () => void;
    handleSubmitShift: () => Promise<void>;
    handleUpdateDenomination: (den: number, quantity: number) => void;
}

const POSCommandContext = createContext<POSCommandContextType | undefined>(undefined);

export const POSCommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { user, logout } = useStore();
    const {
        sales, addNotification, activeSite, shifts,
        allProducts, adjustStock, addProduct, refreshData, closeShift
    } = useData();
    const { jobs, transfers, refreshJobs } = useFulfillmentData();
    const { workerPoints } = useGamification();

    // --- DATE FILTER ---
    const { dateRange, setDateRange, isWithinRange } = useDateFilter('This Quarter');
    const filteredSales = sales.filter(s => isWithinRange(s.date));

    // --- LOCAL STATE ---
    const [isLocked, setIsLocked] = useState(false);
    const [pin, setPin] = useState('');
    const [isStockListOpen, setIsStockListOpen] = useState(false);
    const [stockSearch, setStockSearch] = useState('');

    // Shift Closing
    const [isClosingShift, setIsClosingShift] = useState(false);
    const [closingStep, setClosingStep] = useState(1);
    const [cashDenominations, setCashDenominations] = useState<Record<string, number>>({
        '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0
    });
    const [discrepancyReason, setDiscrepancyReason] = useState('');
    const [isSubmittingShift, setIsSubmittingShift] = useState(false);

    // Pagination
    const [txPage, setTxPage] = useState(1);
    const TX_PER_PAGE = 5;

    // --- DELEGATED RECEIVING STATE & HANDLERS ---
    const receivingState = usePOSReceiving({
        user,
        activeSite,
        allProducts,
        transfers,
        jobs,
        addProduct,
        adjustStock,
        refreshData,
        refreshJobs,
        addNotification,
        formatJobId,
        t
    });

    // --- COMPUTED DATA ---
    const activeShift = shifts.find(s => s.cashierId === user?.id && s.status === 'Open');

    const getShiftSummary = () => {
        if (!activeShift) return { cash: 0, card: 0, mobile: 0, total: 0, expected: 0 };
        const startTime = new Date(activeShift.startTime).getTime();
        const currentShiftSales = sales.filter(s => new Date(s.date).getTime() >= startTime);

        const cash = currentShiftSales.filter(s => s.method === 'Cash').reduce((sum, s) => sum + s.total, 0);
        const card = currentShiftSales.filter(s => s.method === 'Card').reduce((sum, s) => sum + s.total, 0);
        const mobile = currentShiftSales.filter(s => s.method === 'Mobile Money').reduce((sum, s) => sum + s.total, 0);

        return {
            cash,
            card,
            mobile,
            total: cash + card + mobile,
            expected: (activeShift.openingFloat || 0) + cash
        };
    };

    const shiftSummary = getShiftSummary();
    const cashInDrawer = shiftSummary.expected;
    const personalSales = shiftSummary.total;
    const txCount = sales.filter(s =>
        new Date(s.date).getTime() >= (activeShift ? new Date(activeShift.startTime).getTime() : 0) &&
        s.cashierName === user?.name
    ).length;
    const returnCount = sales.filter(s =>
        new Date(s.date).getTime() >= (activeShift ? new Date(activeShift.startTime).getTime() : 0) &&
        s.status === 'Refunded'
    ).length;
    const totalRevenue = personalSales;

    // Gamification & Charts
    const myPoints = workerPoints.find(wp => wp.employeeId === user?.id || wp.employeeName === user?.name);
    const siteWorkerPoints = workerPoints.filter(wp => wp.siteId === activeSite?.id);

    const methodStats = filteredSales.reduce((acc: any, curr) => {
        acc[curr.method] = (acc[curr.method] || 0) + 1;
        return acc;
    }, {});

    const totalFilteredSales = filteredSales.length;
    const paymentChartData = Object.keys(methodStats).map(key => {
        let translatedName = key;
        if (key === 'Cash') translatedName = t('pos.cashSales');
        else if (key === 'Card') translatedName = t('pos.cardSales');
        else if (key === 'Mobile Money') translatedName = t('pos.mobileSales');

        return {
            name: translatedName,
            value: totalFilteredSales > 0 ? Math.round((methodStats[key] / totalFilteredSales) * 100) : 0
        };
    });

    const hourlyData = [
        { name: '09:00', amount: totalRevenue * 0.1, label: t('posCommand.salesAmount') },
        { name: '10:00', amount: totalRevenue * 0.15, label: t('posCommand.salesAmount') },
        { name: '11:00', amount: totalRevenue * 0.2, label: t('posCommand.salesAmount') },
        { name: '12:00', amount: totalRevenue * 0.25, label: t('posCommand.salesAmount') },
        { name: '13:00', amount: totalRevenue * 0.1, label: t('posCommand.salesAmount') },
        { name: '14:00', amount: totalRevenue * 0.2, label: t('posCommand.salesAmount') },
    ];

    // --- OTHER HANDLERS ---
    const handleLockScreen = () => setIsLocked(true);
    const handleReprint = () => addNotification('info', t('posCommand.printingReceipt'));

    const handleEndShift = () => {
        if (!activeShift) {
            addNotification('alert', t('posCommand.noShiftFound'));
            return;
        }
        setClosingStep(1);
        setIsClosingShift(true);
    };

    const handleSubmitShift = async () => {
        if (!activeShift) return;
        setIsSubmittingShift(true);

        try {
            const summary = getShiftSummary();
            const actualCash = Object.entries(cashDenominations).reduce(
                (sum, [value, count]) => sum + (parseInt(value) * count),
                0
            );

            const record: any = {
                ...activeShift,
                endTime: new Date().toISOString(),
                cashSales: summary.cash,
                cardSales: summary.card,
                mobileSales: summary.mobile,
                expectedCash: summary.expected,
                actualCash: actualCash,
                variance: actualCash - summary.expected,
                denominations: cashDenominations,
                discrepancyReason: discrepancyReason,
                status: 'Closed'
            };

            await closeShift(record);
            addNotification('success', t('posCommand.shiftClosedSuccess'));
            setIsClosingShift(false);
            logout();
            navigate('/');
        } catch (error) {
            console.error('Shift closure error:', error);
            addNotification('alert', t('posCommand.shiftClosedError'));
        } finally {
            setIsSubmittingShift(false);
        }
    };

    const handleUpdateDenomination = (den: number, quantity: number) => {
        setCashDenominations(prev => ({
            ...prev,
            [den]: quantity
        }));
    };

    const value: POSCommandContextType = {
        dateRange, setDateRange, isWithinRange, filteredSales,
        activeShift, cashInDrawer, personalSales, txCount, returnCount, totalRevenue,
        getShiftSummary, myPoints, siteWorkerPoints, hourlyData, paymentChartData,
        isLocked, setIsLocked, pin, setPin,
        
        // From usePOSReceiving hook:
        isReceivingModalOpen: receivingState.isReceivingModalOpen,
        setIsReceivingModalOpen: receivingState.setIsReceivingModalOpen,
        receivingSummary: receivingState.receivingSummary,
        setReceivingSummary: receivingState.setReceivingSummary,
        selectedTransferForReceiving: receivingState.selectedTransferForReceiving,
        setSelectedTransferForReceiving: receivingState.setSelectedTransferForReceiving,
        isConfirmingReceive: receivingState.isConfirmingReceive,
        orderRefScanInput: receivingState.orderRefScanInput,
        setOrderRefScanInput: receivingState.setOrderRefScanInput,
        transferScanBarcode: receivingState.transferScanBarcode,
        setTransferScanBarcode: receivingState.setTransferScanBarcode,
        transferReceivingItems: receivingState.transferReceivingItems,
        setTransferReceivingItems: receivingState.setTransferReceivingItems,
        handleSelectTransferForReceiving: receivingState.handleSelectTransferForReceiving,
        handleScanOrderRef: receivingState.handleScanOrderRef,
        handleUpdateTransferItem: receivingState.handleUpdateTransferItem,
        handleScanTransferItem: receivingState.handleScanTransferItem,
        handleConfirmTransferReceiving: receivingState.handleConfirmTransferReceiving,
        repairShipmentInventory: receivingState.repairShipmentInventory,
        handleCloseReceivingModal: receivingState.handleCloseReceivingModal,

        isStockListOpen, setIsStockListOpen, stockSearch, setStockSearch,
        isClosingShift, setIsClosingShift, closingStep, setClosingStep,
        cashDenominations, setCashDenominations, discrepancyReason, setDiscrepancyReason, isSubmittingShift,
        txPage, setTxPage, TX_PER_PAGE,
        handleLockScreen, handleReprint, handleEndShift, handleSubmitShift, handleUpdateDenomination
    };

    return <POSCommandContext.Provider value={value}>{children}</POSCommandContext.Provider>;
};

export const usePOSCommand = () => {
    const context = useContext(POSCommandContext);
    if (context === undefined) {
        throw new Error('usePOSCommand must be used within a POSCommandProvider');
    }
    return context;
};
