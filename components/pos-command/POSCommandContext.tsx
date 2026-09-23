import React, { createContext, useContext, useState, useMemo } from 'react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { useFulfillmentData } from '../fulfillment/FulfillmentDataProvider';
import { useGamification } from '../../contexts/GamificationContext';
import { useDateFilter, DateRangeOption } from '../../hooks/useDateFilter';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatJobId } from '../../utils/jobIdFormatter';
import { printHtmlContent } from '../../utils/printHelper';
import { CURRENCY_SYMBOL } from '../../constants';

// Hooks
import { usePOSReceiving } from './hooks/usePOSReceiving';
import { logger } from '../../utils/logger';

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

    // Stock Search & Updates Notification State
    isStockListOpen: boolean;
    setIsStockListOpen: React.Dispatch<React.SetStateAction<boolean>>;
    stockSearch: string;
    setStockSearch: React.Dispatch<React.SetStateAction<string>>;
    lastSeenUpdates: number;
    markUpdatesAsRead: () => void;

    // Print Hub State
    isPrintHubOpen: boolean;
    setIsPrintHubOpen: React.Dispatch<React.SetStateAction<boolean>>;

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
        allProducts, adjustStock, addProduct, refreshData, closeShift, logSystemEvent
    } = useData();
    const { jobs, transfers, refreshJobs } = useFulfillmentData();
    const { workerPoints } = useGamification();

    const isCentralHQ = ['super_admin', 'ceo', 'admin'].includes(user?.role?.toLowerCase() || '');

    // --- DATE FILTER & SITE SCOPING ---
    const { dateRange, setDateRange, isWithinRange } = useDateFilter('This Quarter');
    const filteredSales = useMemo(() => {
        const siteId = activeSite?.id || user?.siteId;
        return sales.filter(s => {
            const matchesDate = isWithinRange(s.date);
            const matchesSite = isCentralHQ || !siteId || s.siteId === siteId || (s as any).site_id === siteId;
            return matchesDate && matchesSite;
        });
    }, [sales, isWithinRange, activeSite?.id, user?.siteId, isCentralHQ]);

    // --- LOCAL STATE ---
    const [isLocked, setIsLocked] = useState(false);
    const [pin, setPin] = useState('');
    const [isStockListOpen, setIsStockListOpen] = useState(false);
    const [stockSearch, setStockSearch] = useState('');
    const [isPrintHubOpen, setIsPrintHubOpen] = useState(false);

    // Notification Read State
    const [lastSeenUpdates, setLastSeenUpdates] = useState<number>(() => {
        const stored = localStorage.getItem('siifmart_pos_updates_last_seen');
        return stored ? parseInt(stored, 10) : 0;
    });

    const markUpdatesAsRead = () => {
        const now = Date.now();
        setLastSeenUpdates(now);
        localStorage.setItem('siifmart_pos_updates_last_seen', String(now));
    };

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
    // Prioritize current cashier's active shift. If user is central manager/admin without an active shift, view site's shift.
    const activeShift = shifts.find(s => s.cashierId === user?.id && s.status === 'Open')
        || (isCentralHQ ? shifts.find(s => s.siteId === activeSite?.id && s.status === 'Open') : undefined);

    const getShiftSummary = () => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const startTime = activeShift ? new Date(activeShift.startTime).getTime() : todayStart.getTime();

        const currentShiftSales = sales.filter(s => {
            const saleTime = new Date(s.date).getTime();
            if (saleTime < startTime) return false;

            // Site Scoping: Never aggregate sales from other branches
            const siteId = activeShift?.siteId || activeSite?.id;
            if (siteId && s.siteId !== siteId && (s as any).site_id !== siteId) return false;

            // Cashier Scoping: If not central HQ reviewing site, limit to cashier's sales
            if (activeShift?.cashierId && !isCentralHQ) {
                const matchesCashier = s.cashierName === activeShift.cashierName || (s as any).cashierId === activeShift.cashierId;
                if (!matchesCashier) return false;
            }

            return (s.status as string) !== 'Cancelled';
        });

        const normalizeMethod = (m?: string) => (m || '').trim().toLowerCase();

        const cash = currentShiftSales
            .filter(s => {
                const m = normalizeMethod(s.method);
                return (m === 'cash' || m.includes('cash')) && s.status !== 'Refunded';
            })
            .reduce((sum, s) => sum + (Number(s.total) || 0), 0);

        const card = currentShiftSales
            .filter(s => {
                const m = normalizeMethod(s.method);
                return (m === 'card' || m.includes('card') || m.includes('visa') || m.includes('master')) && s.status !== 'Refunded';
            })
            .reduce((sum, s) => sum + (Number(s.total) || 0), 0);

        const mobile = currentShiftSales
            .filter(s => {
                const m = normalizeMethod(s.method);
                return (m.includes('mobile') || m.includes('telebirr') || m.includes('cbe') || m.includes('wallet')) && s.status !== 'Refunded';
            })
            .reduce((sum, s) => sum + (Number(s.total) || 0), 0);

        return {
            cash,
            card,
            mobile,
            total: cash + card + mobile,
            expected: Math.max(0, (activeShift?.openingFloat || 0) + cash)
        };
    };

    const shiftSummary = getShiftSummary();
    const cashInDrawer = shiftSummary.expected;
    const personalSales = shiftSummary.total;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const shiftStartTime = activeShift ? new Date(activeShift.startTime).getTime() : todayStart.getTime();

    const txCount = sales.filter(s => {
        const saleTime = new Date(s.date).getTime();
        const matchesTime = saleTime >= shiftStartTime;
        const siteId = activeShift?.siteId || activeSite?.id;
        const matchesSite = !siteId || s.siteId === siteId || (s as any).site_id === siteId;
        const matchesCashier = isCentralHQ || !user?.name || s.cashierName === user?.name || (s as any).cashierId === user?.id;
        return matchesTime && matchesSite && matchesCashier && (s.status as string) !== 'Cancelled';
    }).length;

    const returnCount = sales.filter(s => {
        const saleTime = new Date(s.date).getTime();
        const matchesTime = saleTime >= shiftStartTime;
        const siteId = activeShift?.siteId || activeSite?.id;
        const matchesSite = !siteId || s.siteId === siteId || (s as any).site_id === siteId;
        return matchesTime && matchesSite && (s.status === 'Refunded' || s.status === 'Partially Refunded');
    }).length;

    const totalRevenue = personalSales;

    // Gamification & Charts
    const myPoints = workerPoints.find(wp => wp.employeeId === user?.id || wp.employeeName === user?.name);
    const siteWorkerPoints = workerPoints.filter(wp => wp.siteId === activeSite?.id);

    const methodBuckets = filteredSales.reduce((acc: { cash: number; card: number; mobile: number }, curr) => {
        const m = (curr.method || '').toLowerCase();
        if (m === 'cash' || m.includes('cash')) {
            acc.cash += 1;
        } else if (m === 'card' || m.includes('card') || m.includes('visa') || m.includes('master')) {
            acc.card += 1;
        } else if (m.includes('mobile') || m.includes('telebirr') || m.includes('cbe') || m.includes('wallet')) {
            acc.mobile += 1;
        } else {
            acc.cash += 1;
        }
        return acc;
    }, { cash: 0, card: 0, mobile: 0 });

    const totalFilteredSales = filteredSales.length;
    const paymentChartData = [
        { name: t('pos.cashSales'), value: totalFilteredSales > 0 ? Math.round((methodBuckets.cash / totalFilteredSales) * 100) : 0 },
        { name: t('pos.cardSales'), value: totalFilteredSales > 0 ? Math.round((methodBuckets.card / totalFilteredSales) * 100) : 0 },
        { name: t('pos.mobileSales'), value: totalFilteredSales > 0 ? Math.round((methodBuckets.mobile / totalFilteredSales) * 100) : 0 },
    ].filter(entry => entry.value > 0);

    // Convenience store hours: 07:00 to 23:00 (covers morning opening through late night closing)
    const hourlyCounts: Record<string, { count: number; amount: number }> = {};
    for (let h = 7; h <= 23; h++) {
        hourlyCounts[`${h.toString().padStart(2, '0')}:00`] = { count: 0, amount: 0 };
    }

    filteredSales.forEach(s => {
        if ((s.status as string) === 'Cancelled') return;
        const d = new Date(s.date);
        const h = d.getHours();
        const slot = `${h.toString().padStart(2, '0')}:00`;
        if (hourlyCounts[slot]) {
            hourlyCounts[slot].count += 1;
            hourlyCounts[slot].amount += Number(s.total) || 0;
        }
    });

    const hourlyData = Object.entries(hourlyCounts).map(([hour, val]) => ({
        hour,
        name: hour,
        count: val.count,
        amount: val.amount,
        label: t('posCommand.salesAmount')
    }));

    // --- OTHER HANDLERS ---
    const handleLockScreen = () => setIsLocked(true);
    const handleReprint = () => {
        const siteId = activeShift?.siteId || activeSite?.id || user?.siteId;
        const siteSales = sales.filter(s => !siteId || s.siteId === siteId || (s as any).site_id === siteId);
        const lastSale = siteSales[0];
        if (!lastSale) {
            addNotification('alert', t('posCommand.noSalesFound') || 'No recent sales found to reprint.');
            return;
        }

        const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${lastSale.receiptNumber || lastSale.id}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; width: 80mm; margin: 0; padding: 20px; color: #000; background: #fff; font-size: 11px; }
          .text-center { text-align: center; } .text-right { text-align: right; }
          .flex { display: flex; } .justify-between { justify-content: space-between; }
          .font-bold { font-weight: 700; } .font-black { font-weight: 900; }
          .border-b { border-bottom: 1px dashed #999; } .my-2 { margin: 8px 0; } .py-1 { padding: 4px 0; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h2 style="margin: 0; font-size: 16px;">${activeSite?.name || 'SIIFMART'}</h2>
          <p style="margin: 2px 0; font-size: 10px; color: #555;">REPRINT RECEIPT</p>
          <p style="margin: 2px 0; font-size: 10px;">${lastSale.receiptNumber || `REC-${lastSale.id.slice(0, 8).toUpperCase()}`}</p>
          <p style="margin: 2px 0; font-size: 9px; color: #666;">${new Date(lastSale.date).toLocaleString()}</p>
        </div>
        <div class="border-b my-2"></div>
        <div>
          ${(lastSale.items || []).map((item: any) => `
            <div class="flex justify-between py-1">
              <span>${item.quantity}x ${item.name}</span>
              <span class="font-bold">${CURRENCY_SYMBOL} ${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
        <div class="border-b my-2"></div>
        <div class="flex justify-between py-1">
          <span>Subtotal:</span>
          <span>${CURRENCY_SYMBOL} ${(lastSale.subtotal || lastSale.total).toLocaleString()}</span>
        </div>
        <div class="flex justify-between py-1">
          <span>Tax:</span>
          <span>${CURRENCY_SYMBOL} ${(lastSale.tax || 0).toLocaleString()}</span>
        </div>
        <div class="flex justify-between py-1 font-black" style="font-size: 13px;">
          <span>TOTAL:</span>
          <span>${CURRENCY_SYMBOL} ${lastSale.total.toLocaleString()}</span>
        </div>
        <div class="flex justify-between py-1">
          <span>Payment (${lastSale.method}):</span>
          <span>${CURRENCY_SYMBOL} ${(lastSale.amountTendered || lastSale.total).toLocaleString()}</span>
        </div>
        ${lastSale.change ? `
          <div class="flex justify-between py-1">
            <span>Change:</span>
            <span>${CURRENCY_SYMBOL} ${lastSale.change.toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="border-b my-2"></div>
        <div class="text-center" style="font-size: 9px; color: #777; margin-top: 10px;">
          <p>Cashier: ${lastSale.cashierName || user?.name || 'Staff'}</p>
          <p>Thank you for shopping with SIIFMART!</p>
        </div>
      </body>
      </html>
        `;

        printHtmlContent(receiptHTML);
        addNotification('success', `Reprinted receipt #${lastSale.receiptNumber || lastSale.id.slice(0, 8)}`);
    };

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
            if (Math.abs(record.variance) > 0.01) {
                logSystemEvent(
                    'BLIND_SHIFT_CLOSE_VARIANCE',
                    `Shift closed with blind variance: ${record.variance > 0 ? '+' : ''}${record.variance} ETB. Expected: ${record.expectedCash}, Counted: ${record.actualCash}. Notes: ${discrepancyReason || 'None'}`,
                    user?.name || 'Cashier',
                    'POS'
                );
            }
            addNotification('success', t('posCommand.shiftClosedSuccess'));
            setIsClosingShift(false);
            logout();
            navigate('/');
        } catch (error) {
            logger.error('POSCommandContext', 'Shift closure error:', error);
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
        lastSeenUpdates, markUpdatesAsRead,
        isPrintHubOpen, setIsPrintHubOpen,
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
