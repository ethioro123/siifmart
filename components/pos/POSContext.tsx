import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber, formatDateTime } from '../../utils/formatting';
import { Product, CartItem, PaymentMethod, SaleRecord, ReturnCondition, ReturnReason, ReturnItem, ShiftRecord, HeldOrder, Customer, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION, TransferRecord } from '../../types';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { useFulfillmentData } from '../fulfillment/FulfillmentDataProvider';
import { useLanguage } from '../../contexts/LanguageContext';
import { native } from '../../utils/native';
import { customersService, productsService } from '../../services/supabase.service';
import { calculateStoreBonus } from '../StoreBonusDisplay';
import { needsQuantityPrompt, getSellUnit, normalizeQuantity } from '../../utils/units';

import { usePOSCartActions } from './hooks/usePOSCartActions';
import { usePOSCheckoutActions } from './hooks/usePOSCheckoutActions';
import { usePOSShiftActions } from './hooks/usePOSShiftActions';
import { usePOSReturnActions } from './hooks/usePOSReturnActions';
import { usePOSTransferActions } from './hooks/usePOSTransferActions';
import { usePOSHoldRecallActions } from './hooks/usePOSHoldRecallActions';
import { usePOSProductFilters } from './hooks/usePOSProductFilters';
import { usePOSScanActions } from './hooks/usePOSScanActions';
import { POSContextType } from './types';
import { getParentCategory } from './utils/posUtils';
import { getEffectiveRetailPrice, getPriceUpdateTimestamp, getStaleCartPriceChanges } from './utils/priceUpdates';
import { usePOSPriceHistory } from './hooks/usePOSPriceHistory';

import { logger } from '../../utils/logger';

const POSContext = createContext<POSContextType | undefined>(undefined);

export const usePOS = () => {
    const context = useContext(POSContext);
    if (!context) {
        throw new Error('usePOS must be used within a POSProvider');
    }
    return context;
};

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, logout } = useStore();
    const {
        products, activeSite, shifts, startShift, addNotification,
        processSale, processReturn, holdOrder, releaseHold, heldOrders,
        customers, sales, closeShift, updateProduct, sites, refreshData, settings,
        getStorePoints, posSyncStatus, posPendingSyncCount, triggerSync,
        validateDiscountCode, useDiscountCode, getTaxForSite,
    } = useData();
    const { transfers, receiveTransfer } = useFulfillmentData();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // --- State Setup (Migrated from POSTerminal.tsx) ---
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // --- Product Search & Filtering hook ---
    const {
        searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, selectedDepartment, setSelectedDepartment,
        sortBy, setSortBy, minPriceFilter, setMinPriceFilter, maxPriceFilter, setMaxPriceFilter,
        selectedBrands, setSelectedBrands, selectedVelocities, setSelectedVelocities,
        stockStatusFilter, setStockStatusFilter, onSaleOnly, setOnSaleOnly, competitorMatchedOnly, setCompetitorMatchedOnly,
        serverSearchResults, isSearchingServer, resetAllFilters, categories, filteredProducts
    } = usePOSProductFilters({ products, activeSite, transfers });
    const [serverCustomerResults, setServerCustomerResults] = useState<Customer[]>([]);
    const [isSearchingCustomerServer, setIsSearchingCustomerServer] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Cash');
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSale, setLastSale] = useState<SaleRecord | null>(null);
    const [showPointsPopup, setShowPointsPopup] = useState(false), [earnedPointsData, setEarnedPointsData] = useState<any>(null);
    const [isRecallModalOpen, setIsRecallModalOpen] = useState(false), [cartDiscount, setCartDiscount] = useState(0);
    const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null), [appliedDiscountCodeDetails, setAppliedDiscountCodeDetails] = useState<any | null>(null);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountCodeInput, setDiscountCodeInput] = useState(''), [discountCodeError, setDiscountCodeError] = useState(''), [isValidatingCode, setIsValidatingCode] = useState(false);
    const [isMiscItemModalOpen, setIsMiscItemModalOpen] = useState(false), [miscItem, setMiscItem] = useState({ name: 'Misc Item', price: '' });
    const [isRoundingEnabled, setIsRoundingEnabled] = useState(true), [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnSearchId, setReturnSearchId] = useState(''), [foundSaleForReturn, setFoundSaleForReturn] = useState<SaleRecord | null>(null);
    const [returnConfig, setReturnConfig] = useState<Record<string, { qty: number, condition: ReturnCondition, reason: ReturnReason }>>({});
    const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false), [closingStep, setClosingStep] = useState(1);
    const isKenyaPOS = activeSite ? (activeSite.country === 'KE' || activeSite.currency === 'KES' || activeSite.currency === 'KSh') : (settings?.country === 'KE');
    const [cashDenominations, setCashDenominations] = useState<Record<string, number>>(() => (isKenyaPOS ? ({ '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0 } as Record<string, number>) : ({ '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0 } as Record<string, number>)));
    const [discrepancyReason, setDiscrepancyReason] = useState(''), [countedCash, setCountedCash] = useState(''), [shiftNotes, setShiftNotes] = useState('');
    const isCentralHQ = ['super_admin', 'regional_manager', 'operations_manager', 'inventory_manager', 'store_manager'].includes(user?.role || '');
    const activeShift = shifts.find((s: ShiftRecord) =>
        (s.cashierId === user?.id || (user?.code && s.cashierId === user?.code) || ((user as any)?.employeeId && s.cashierId === (user as any)?.employeeId)) && s.status === 'Open'
    ) || (isCentralHQ ? shifts.find(s => s.siteId === activeSite?.id && s.status === 'Open') : undefined);
    const [shiftStartTime, setShiftStartTime] = useState(activeShift?.startTime || new Date().toISOString());
    const [hasDismissedStartShiftModal, setHasDismissedStartShiftModal] = useState(false);

    const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false), [scannedBarcode, setScannedBarcode] = useState('');
    const [receivedItems, setReceivedItems] = useState<Array<{ product: Product; qty: number; timestamp: string }>>([]), [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [receivingMode, setReceivingMode] = useState<'TRANSFERS' | 'MANUAL'>('TRANSFERS');
    const [selectedTransferForReceiving, setSelectedTransferForReceiving] = useState<string | null>(null), [transferReceivingItems, setTransferReceivingItems] = useState<any[]>([]);
    const [isConfirmingReceive, setIsConfirmingReceive] = useState(false), [isHoldOrderModalOpen, setIsHoldOrderModalOpen] = useState(false), [holdOrderNote, setHoldOrderNote] = useState('');
    const [isOverwriteCartModalOpen, setIsOverwriteCartModalOpen] = useState(false), [pendingRecallOrderId, setPendingRecallOrderId] = useState<string | null>(null);
    const [isEmailReceiptModalOpen, setIsEmailReceiptModalOpen] = useState(false), [emailReceiptAddress, setEmailReceiptAddress] = useState('');
    const [showCart, setShowCart] = useState(false);
    const isNativeApp = native.isNative();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null), [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false), [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false), [receiptPreviewHTML, setReceiptPreviewHTML] = useState('');
    const [isUnknownBarcodeModalOpen, setIsUnknownBarcodeModalOpen] = useState(false), [unknownBarcode, setUnknownBarcode] = useState(''), [capturedBarcodeForModal, setCapturedBarcodeForModal] = useState('');
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [weightPromptProduct, setWeightPromptProduct] = useState<Product | null>(null);

    const handleStartShift = useCallback(async (openingFloat: number, counterNumber?: string) => {
        if (!user) return;
        setIsStartShiftModalOpen(false);
        await startShift(user.id, openingFloat, counterNumber);
    }, [user, startShift]);

    const dismissStartShiftModal = useCallback(() => {
        setHasDismissedStartShiftModal(true);
        setIsStartShiftModalOpen(false);
    }, []);

    // --- Effects ---
    useEffect(() => {
        if (activeShift) {
            setShiftStartTime(activeShift.startTime);
            setIsStartShiftModalOpen(false);
            setHasDismissedStartShiftModal(false);
        } else if (user && !hasDismissedStartShiftModal) {
            setIsStartShiftModalOpen(true);
        }
    }, [activeShift, user, hasDismissedStartShiftModal]);

    useEffect(() => {
        // Only autofocus search input on desktop/USB-scanner environments; avoid popping virtual keyboard on mobile
        if (!native.isCleanMobileMode() && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (!customerSearchTerm.trim()) {
            setServerCustomerResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchingCustomerServer(true);
            try {
                const results = await customersService.search(customerSearchTerm);
                setServerCustomerResults(results);
            } catch (err) {
                logger.error('POSContext', 'Customer search failed', err as Error);
            } finally {
                setIsSearchingCustomerServer(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [customerSearchTerm]);
    // --- Computed Values ---
    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm.trim()) return customers;
        const term = customerSearchTerm.toLowerCase();
        const localMatches = customers.filter((c: Customer) => c.name.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term));
        if (serverCustomerResults.length > 0) {
            const combined = [...localMatches];
            serverCustomerResults.forEach(sc => {
                if (!combined.find(c => c.id === sc.id)) combined.push(sc);
            });
            return combined;
        }
        return localMatches;
    }, [customers, customerSearchTerm, serverCustomerResults]);

    const currentStorePoints = useMemo(() => {
        if (!activeSite?.id) return undefined;
        return getStorePoints(activeSite.id);
    }, [activeSite?.id, getStorePoints]);

    const storeBonus = useMemo(() => {
        if (!currentStorePoints) return null;
        return calculateStoreBonus(currentStorePoints.monthlyPoints, settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS);
    }, [currentStorePoints, settings.posBonusTiers]);

    const userBonusShare = useMemo(() => {
        if (!storeBonus || !user?.role) return null;
        const roleDistribution = settings.posRoleDistribution || DEFAULT_POS_ROLE_DISTRIBUTION;
        const roleConfig = roleDistribution.find((r: any) => r.role.toLowerCase() === user.role.toLowerCase());
        if (!roleConfig) return null;
        return {
            percentage: roleConfig.percentage,
            amount: (storeBonus.bonus * roleConfig.percentage) / 100
        };
    }, [storeBonus, user?.role, settings.posRoleDistribution]);

    // Math
    const activeCountry = (activeSite?.country || settings.country || 'ET') as string;
    const isSalesTaxEnabled = Boolean(
        settings.countryConfigs?.[activeCountry]?.taxOnSelling ?? settings.taxOnSelling
    );
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const siteTaxRules = isSalesTaxEnabled ? getTaxForSite(activeSite?.id) : [];
    const taxResults = (() => {
        if (!isSalesTaxEnabled) {
            return { total: 0, breakdown: [] };
        }
        let runningTotalTax = 0;
        let currentBase = subtotal;
        const breakdown: any[] = [];
        siteTaxRules.forEach((rule: any) => {
            const ruleTax = currentBase * (rule.rate / 100);
            runningTotalTax += ruleTax;
            breakdown.push({ name: rule.name, rate: rule.rate, amount: ruleTax, compound: rule.compound });
            if (rule.compound) currentBase += ruleTax;
        });
        return { total: runningTotalTax, breakdown };
    })();
    const tax = taxResults.total;
    const taxBreakdown = taxResults.breakdown;
    const rawTotal = Math.max(0, subtotal + tax - cartDiscount);
    const roundingAdjustment = isRoundingEnabled ? (Math.ceil(rawTotal / 5) * 5) - rawTotal : 0;
    const total = rawTotal + roundingAdjustment;
    const changeDue = amountTendered ? Math.max(0, parseFloat(amountTendered) - total) : 0;
    const isPaymentValid = selectedPaymentMethod === 'Cash' ? parseFloat(amountTendered || '0') >= total : true;

    const [isPriceUpdatesModalOpen, setIsPriceUpdatesModalOpen] = useState(false);
    const latestProductPriceUpdateKey = useMemo(() => {
        if (!activeSite?.id) return '';
        const siteProducts = products.filter(product => (product.siteId || product.site_id) === activeSite.id);
        const latestTimestamp = siteProducts.reduce((latest, product) => Math.max(latest, getPriceUpdateTimestamp(product) || 0), 0);
        if (latestTimestamp === 0) return '';
        const latestProducts = siteProducts
            .filter(product => getPriceUpdateTimestamp(product) === latestTimestamp)
            .map(product => `${product.id}:${getEffectiveRetailPrice(product)}`)
            .sort();
        return `${latestTimestamp}:${latestProducts.join('|')}`;
    }, [products, activeSite?.id]);
    const {
        entries: productPriceHistory,
        unreviewedCount: unreviewedPriceUpdateCount,
        isLoading: isPriceHistoryLoading,
        isLoadingMore: isLoadingMorePriceHistory,
        hasMore: hasMorePriceHistory,
        error: priceHistoryError,
        retry: retryPriceHistory,
        loadMore: loadMorePriceHistory,
        markReviewed: markPriceHistoryReviewed
    } = usePOSPriceHistory(activeSite?.id, user?.id, latestProductPriceUpdateKey);

    const staleCartPriceChanges = useMemo(() => getStaleCartPriceChanges(cart, products), [cart, products]);

    const activeSiteType = activeSite?.type || 'Administrative';
    const isMultiSiteRole = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'auditor' || user?.role === 'regional_manager' || user?.role === 'operations_manager';
    const needsStoreSelection = isMultiSiteRole && (activeSiteType === 'Administrative' || activeSiteType === 'Headquarters' || activeSiteType === 'HQ' || activeSiteType === 'Administration');

    // --- Hook Initializations ---
    const {
        addToCart, confirmWeightEntry, addMiscItem, updateQuantity,
        setCartItemQuantity, updateCartItemPrice, removeFromCart, clearCart
    } = usePOSCartActions({
        cart, setCart, weightPromptProduct, setWeightPromptProduct,
        miscItem, setMiscItem, setIsMiscItemModalOpen, activeSite, addNotification,
        setCartDiscount, setAppliedDiscountCode, setAppliedDiscountCodeDetails,
        setDiscountCodeInput, setDiscountCodeError, setIsRoundingEnabled, user
    });

    const {
        handleInitiatePayment, handleProcessPayment, handlePrintReceipt,
        handleConfirmPrint, handleEmailReceipt, handleConfirmEmailReceipt,
        handleOpenDrawer, handleReprintLast, applyDiscountFromCode,
        handleValidateDiscountCode, handleRemoveDiscount
    } = usePOSCheckoutActions({
        cart, selectedPaymentMethod, setSelectedPaymentMethod, amountTendered, setAmountTendered,
        isPaymentModalOpen, setIsPaymentModalOpen, isReceiptModalOpen, setIsReceiptModalOpen,
        isProcessing, setIsProcessing, lastSale, setLastSale, earnedPointsData, setEarnedPointsData,
        showPointsPopup, setShowPointsPopup, selectedCustomer, setSelectedCustomer,
        isEmailReceiptModalOpen, setIsEmailReceiptModalOpen, emailReceiptAddress, setEmailReceiptAddress,
        isReceiptPreviewOpen, setIsReceiptPreviewOpen, receiptPreviewHTML, setReceiptPreviewHTML,
        activeSite, user, settings, subtotal, tax, taxBreakdown, total, changeDue, isPaymentValid,
        processSale, clearCart, setShowCart, addNotification, sales, activeShift,
        cartDiscount, setCartDiscount, appliedDiscountCode, setAppliedDiscountCode, setAppliedDiscountCodeDetails,
        setIsDiscountModalOpen, discountCodeInput, setDiscountCodeInput, setDiscountCodeError,
        setIsValidatingCode, validateDiscountCode, useDiscountCode,
        hasStaleCartPriceChanges: staleCartPriceChanges.length > 0
    });

    const {
        handleCloseShift, getShiftSummary, handleSubmitShift
    } = usePOSShiftActions({
        closingStep, setClosingStep, cashDenominations, setCashDenominations,
        discrepancyReason, setDiscrepancyReason, countedCash, setCountedCash,
        shiftNotes, setShiftNotes, setIsShiftModalOpen, setIsProcessing,
        activeShift, sales, closeShift, logout, navigate, addNotification,
        activeSite, user
    });

    const {
        handleSearchForReturn, updateReturnConfig, handleProcessReturn
    } = usePOSReturnActions({
        returnSearchId, setReturnSearchId, foundSaleForReturn, setFoundSaleForReturn,
        returnConfig, setReturnConfig, setIsReturnModalOpen, setIsProcessing,
        sales, user, processReturn, addNotification, activeSite
    });

    const {
        handleConfirmReceiving, handleSelectTransferForReceiving,
        handleUpdateTransferItem, handleConfirmTransferReceiving
    } = usePOSTransferActions({
        receivedItems, setReceivedItems, selectedTransferForReceiving, setSelectedTransferForReceiving,
        transferReceivingItems, setTransferReceivingItems, isConfirmingReceive, setIsConfirmingReceive,
        isReceivingModalOpen, setIsReceivingModalOpen, user, updateProduct, transfers, products,
        receiveTransfer, addNotification, refreshData
    });

    const {
        handleHoldOrder, handleConfirmHoldOrder, handleRecallOrder, handleConfirmOverwriteCart
    } = usePOSHoldRecallActions({
        cart, setCart, holdOrderNote, setHoldOrderNote, isHoldOrderModalOpen, setIsHoldOrderModalOpen,
        isRecallModalOpen, setIsRecallModalOpen, isOverwriteCartModalOpen, setIsOverwriteCartModalOpen,
        pendingRecallOrderId, setPendingRecallOrderId, activeSite, holdOrder, heldOrders, releaseHold,
        clearCart, addNotification
    });

    // Barcode Scanner & Search Actions (Cross-Border SKU validation enforced)
    const { handleScanProduct, handleSearchKeyDown } = usePOSScanActions({
        products,
        activeSite,
        unknownBarcode,
        setUnknownBarcode,
        setSearchTerm,
        addToCart,
        addNotification,
        isUnknownBarcodeModalOpen,
        weightPromptProduct,
        searchInputRef
    });

    const handleSelectCustomer = (customer: Customer) => { setSelectedCustomer(customer); setIsCustomerModalOpen(false); addNotification('success', `Customer set to: ${customer.name}`); };
    const getCustomerHistory = (customerId: string) => sales.filter((sale: SaleRecord) => 
        sale.customerId === customerId && (!activeSite?.id || sale.siteId === activeSite.id || (sale as any).site_id === activeSite.id)
    );
    const getCustomerStats = (customerId: string) => { const customerSales = getCustomerHistory(customerId); return { totalSpent: customerSales.reduce((sum: number, sale: SaleRecord) => sum + sale.total, 0), totalVisits: customerSales.length }; };

    const value = useMemo(() => ({
        cart, setCart, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory,
        selectedDepartment, setSelectedDepartment, sortBy, setSortBy,
        minPriceFilter, setMinPriceFilter, maxPriceFilter, setMaxPriceFilter,
        selectedBrands, setSelectedBrands, selectedVelocities, setSelectedVelocities,
        stockStatusFilter, setStockStatusFilter, onSaleOnly, setOnSaleOnly,
        competitorMatchedOnly, setCompetitorMatchedOnly, resetAllFilters,
        serverSearchResults, isSearchingServer, serverCustomerResults, isSearchingCustomerServer,
        isPaymentModalOpen, setIsPaymentModalOpen, isReceiptModalOpen, setIsReceiptModalOpen,
        selectedPaymentMethod, setSelectedPaymentMethod, amountTendered, setAmountTendered,
        isProcessing, setIsProcessing, lastSale, setLastSale, showPointsPopup, setShowPointsPopup,
        earnedPointsData, setEarnedPointsData, isRecallModalOpen, setIsRecallModalOpen,
        cartDiscount, setCartDiscount, appliedDiscountCode, setAppliedDiscountCode,
        appliedDiscountCodeDetails, setAppliedDiscountCodeDetails, isDiscountModalOpen, setIsDiscountModalOpen,
        discountCodeInput, setDiscountCodeInput, discountCodeError, setDiscountCodeError,
        isValidatingCode, setIsValidatingCode, isMiscItemModalOpen, setIsMiscItemModalOpen,
        miscItem, setMiscItem, isRoundingEnabled, setIsRoundingEnabled, roundingAdjustment,
        isReturnModalOpen, setIsReturnModalOpen,
        returnSearchId, setReturnSearchId, foundSaleForReturn, setFoundSaleForReturn, returnConfig,
        setReturnConfig, productPriceHistory, unreviewedPriceUpdateCount,
        isPriceHistoryLoading, isLoadingMorePriceHistory, hasMorePriceHistory, priceHistoryError,
        retryPriceHistory, loadMorePriceHistory, markPriceHistoryReviewed,
        staleCartPriceChanges, isPriceUpdatesModalOpen, setIsPriceUpdatesModalOpen,
        isStartShiftModalOpen, setIsStartShiftModalOpen, handleStartShift, dismissStartShiftModal,
        isShiftModalOpen, setIsShiftModalOpen, closingStep, setClosingStep, cashDenominations, setCashDenominations,
        discrepancyReason, setDiscrepancyReason, countedCash, setCountedCash, shiftNotes, setShiftNotes,
        activeShift, shiftStartTime, isReceivingModalOpen, setIsReceivingModalOpen, scannedBarcode, setScannedBarcode,
        receivedItems, setReceivedItems, isQRScannerOpen, setIsQRScannerOpen, receivingMode, setReceivingMode,
        selectedTransferForReceiving, setSelectedTransferForReceiving, transferReceivingItems, setTransferReceivingItems,
        isConfirmingReceive, setIsConfirmingReceive, isHoldOrderModalOpen, setIsHoldOrderModalOpen,
        holdOrderNote, setHoldOrderNote, isOverwriteCartModalOpen, setIsOverwriteCartModalOpen,
        pendingRecallOrderId, setPendingRecallOrderId, isEmailReceiptModalOpen, setIsEmailReceiptModalOpen,
        emailReceiptAddress, setEmailReceiptAddress, showCart, setShowCart, isNativeApp,
        selectedCustomer, setSelectedCustomer, isCustomerModalOpen, setIsCustomerModalOpen,
        customerSearchTerm, setCustomerSearchTerm, isReceiptPreviewOpen, setIsReceiptPreviewOpen,
        receiptPreviewHTML, setReceiptPreviewHTML, isUnknownBarcodeModalOpen, setIsUnknownBarcodeModalOpen,
        unknownBarcode, setUnknownBarcode, capturedBarcodeForModal, setCapturedBarcodeForModal, searchInputRef,
        filteredProducts, categories, currentStorePoints, storeBonus, userBonusShare, subtotal, tax, taxBreakdown,
        rawTotal, total, changeDue, isPaymentValid, filteredCustomers, needsStoreSelection,
        addToCart, handleScanProduct, addMiscItem, updateQuantity, setCartItemQuantity, updateCartItemPrice, removeFromCart, clearCart,
        weightPromptProduct, setWeightPromptProduct, confirmWeightEntry,
        handleHoldOrder, handleConfirmHoldOrder, handleRecallOrder, handleConfirmOverwriteCart,
        applyDiscountFromCode, handleValidateDiscountCode, handleRemoveDiscount, handleInitiatePayment,
        handleProcessPayment, handlePrintReceipt, handleConfirmPrint, handleEmailReceipt, handleConfirmEmailReceipt,
        handleOpenDrawer, handleReprintLast, handleConfirmReceiving, handleSelectTransferForReceiving,
        handleUpdateTransferItem, handleConfirmTransferReceiving, handleCloseShift, getShiftSummary,
        handleSubmitShift, handleSearchForReturn, updateReturnConfig, handleProcessReturn, handleSearchKeyDown,
        handleSelectCustomer, getCustomerHistory, getCustomerStats
    }), [
        // Reactive state values
        cart, searchTerm, selectedCategory, selectedDepartment, sortBy, serverSearchResults, isSearchingServer,
        minPriceFilter, maxPriceFilter, selectedBrands, selectedVelocities, stockStatusFilter, onSaleOnly, competitorMatchedOnly,
        serverCustomerResults, isSearchingCustomerServer, isPaymentModalOpen, isReceiptModalOpen,
        selectedPaymentMethod, amountTendered, isProcessing, lastSale, showPointsPopup,
        earnedPointsData, isRecallModalOpen, cartDiscount, appliedDiscountCode,
        appliedDiscountCodeDetails, isDiscountModalOpen, discountCodeInput, discountCodeError,
        isValidatingCode, isMiscItemModalOpen, miscItem, isRoundingEnabled, roundingAdjustment,
        isReturnModalOpen, returnSearchId, foundSaleForReturn, returnConfig,
        productPriceHistory, unreviewedPriceUpdateCount, isPriceHistoryLoading, isLoadingMorePriceHistory,
        hasMorePriceHistory, priceHistoryError, staleCartPriceChanges, isPriceUpdatesModalOpen,
        isStartShiftModalOpen, isShiftModalOpen, closingStep, cashDenominations,
        discrepancyReason, countedCash, shiftNotes, activeShift, shiftStartTime,
        isReceivingModalOpen, scannedBarcode, receivedItems, isQRScannerOpen, receivingMode,
        selectedTransferForReceiving, transferReceivingItems, isConfirmingReceive,
        isHoldOrderModalOpen, holdOrderNote, isOverwriteCartModalOpen, pendingRecallOrderId,
        isEmailReceiptModalOpen, emailReceiptAddress, showCart, selectedCustomer,
        isCustomerModalOpen, customerSearchTerm, isReceiptPreviewOpen, receiptPreviewHTML,
        isUnknownBarcodeModalOpen, unknownBarcode, capturedBarcodeForModal,
        // Computed values
        filteredProducts, categories, currentStorePoints, storeBonus, userBonusShare,
        subtotal, tax, taxBreakdown, rawTotal, total, changeDue, isPaymentValid,
        filteredCustomers, needsStoreSelection, weightPromptProduct, isNativeApp, updateCartItemPrice,
        retryPriceHistory, loadMorePriceHistory, markPriceHistoryReviewed,
        // Callbacks (stable via useCallback)
        addToCart, handleScanProduct, confirmWeightEntry, handleStartShift, dismissStartShiftModal
    ]);

    return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};
