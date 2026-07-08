import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
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
import { POSContextType } from './types';
import { getParentCategory } from './utils/posUtils';

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
        searchTerm, setSearchTerm,
        selectedCategory, setSelectedCategory,
        selectedDepartment, setSelectedDepartment,
        sortBy, setSortBy,
        minPriceFilter, setMinPriceFilter,
        maxPriceFilter, setMaxPriceFilter,
        selectedBrands, setSelectedBrands,
        selectedVelocities, setSelectedVelocities,
        stockStatusFilter, setStockStatusFilter,
        onSaleOnly, setOnSaleOnly,
        competitorMatchedOnly, setCompetitorMatchedOnly,
        serverSearchResults, isSearchingServer,
        resetAllFilters,
        categories,
        filteredProducts
    } = usePOSProductFilters({
        products, activeSite, transfers
    });
    const [serverCustomerResults, setServerCustomerResults] = useState<Customer[]>([]);
    const [isSearchingCustomerServer, setIsSearchingCustomerServer] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Cash');
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSale, setLastSale] = useState<SaleRecord | null>(null);
    const [showPointsPopup, setShowPointsPopup] = useState(false);
    const [earnedPointsData, setEarnedPointsData] = useState<any>(null);
    const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
    const [cartDiscount, setCartDiscount] = useState(0);
    const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);
    const [appliedDiscountCodeDetails, setAppliedDiscountCodeDetails] = useState<any | null>(null);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountCodeInput, setDiscountCodeInput] = useState('');
    const [discountCodeError, setDiscountCodeError] = useState('');
    const [isValidatingCode, setIsValidatingCode] = useState(false);
    const [isMiscItemModalOpen, setIsMiscItemModalOpen] = useState(false);
    const [miscItem, setMiscItem] = useState({ name: 'Misc Item', price: '' });
    const [isRoundingEnabled, setIsRoundingEnabled] = useState(true);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnSearchId, setReturnSearchId] = useState('');
    const [foundSaleForReturn, setFoundSaleForReturn] = useState<SaleRecord | null>(null);
    const [returnConfig, setReturnConfig] = useState<Record<string, { qty: number, condition: ReturnCondition, reason: ReturnReason }>>({});
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [closingStep, setClosingStep] = useState(1);
    const [cashDenominations, setCashDenominations] = useState<Record<string, number>>({ '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0 });
    const [discrepancyReason, setDiscrepancyReason] = useState('');
    const [countedCash, setCountedCash] = useState('');
    const [shiftNotes, setShiftNotes] = useState('');
    const activeShift = shifts.find((s: ShiftRecord) => s.cashierId === user?.id && s.status === 'Open');
    const [shiftStartTime, setShiftStartTime] = useState(activeShift?.startTime || new Date().toISOString());

    const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [receivedItems, setReceivedItems] = useState<Array<{ product: Product; qty: number; timestamp: string }>>([]);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [receivingMode, setReceivingMode] = useState<'TRANSFERS' | 'MANUAL'>('TRANSFERS');
    const [selectedTransferForReceiving, setSelectedTransferForReceiving] = useState<string | null>(null);
    const [transferReceivingItems, setTransferReceivingItems] = useState<any[]>([]);
    const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);
    const [isHoldOrderModalOpen, setIsHoldOrderModalOpen] = useState(false);
    const [holdOrderNote, setHoldOrderNote] = useState('');
    const [isOverwriteCartModalOpen, setIsOverwriteCartModalOpen] = useState(false);
    const [pendingRecallOrderId, setPendingRecallOrderId] = useState<string | null>(null);
    const [isEmailReceiptModalOpen, setIsEmailReceiptModalOpen] = useState(false);
    const [emailReceiptAddress, setEmailReceiptAddress] = useState('');
    const [showCart, setShowCart] = useState(false);
    const isNativeApp = native.isNative();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
    const [receiptPreviewHTML, setReceiptPreviewHTML] = useState('');
    const [isUnknownBarcodeModalOpen, setIsUnknownBarcodeModalOpen] = useState(false);
    const [unknownBarcode, setUnknownBarcode] = useState('');
    const [capturedBarcodeForModal, setCapturedBarcodeForModal] = useState('');
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [weightPromptProduct, setWeightPromptProduct] = useState<Product | null>(null);

    // --- Effects ---
    useEffect(() => {
        if (activeShift) {
            setShiftStartTime(activeShift.startTime);
        } else if (user) {
            startShift(user.id, 2000);
        }
    }, [activeShift, user, startShift]);

    useEffect(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
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
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const siteTaxRules = getTaxForSite(activeSite?.id);
    const taxResults = (() => {
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

    const priceUpdatedProducts = useMemo(() => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return products.filter((p: Product) => {
            if (!p.priceUpdatedAt && !p.price_updated_at) return false;
            const date = new Date(p.priceUpdatedAt || p.price_updated_at || '');
            return date > twentyFourHoursAgo;
        });
    }, [products]);

    const [isPriceUpdatesModalOpen, setIsPriceUpdatesModalOpen] = useState(false);

    const activeSiteType = activeSite?.type || 'Administrative';
    const isMultiSiteRole = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'auditor';
    const needsStoreSelection = isMultiSiteRole && (activeSiteType === 'Administrative' || activeSiteType === 'Headquarters' || activeSiteType === 'HQ' || activeSiteType === 'Administration');

    // --- Hook Initializations ---
    const {
        addToCart, confirmWeightEntry, addMiscItem, updateQuantity,
        setCartItemQuantity, removeFromCart, clearCart
    } = usePOSCartActions({
        cart, setCart, weightPromptProduct, setWeightPromptProduct,
        miscItem, setMiscItem, setIsMiscItemModalOpen, activeSite, addNotification,
        setCartDiscount, setAppliedDiscountCode, setAppliedDiscountCodeDetails,
        setDiscountCodeInput, setDiscountCodeError, setIsRoundingEnabled
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
        processSale, clearCart, addNotification, sales,
        cartDiscount, setCartDiscount, setAppliedDiscountCode, setAppliedDiscountCodeDetails,
        setIsDiscountModalOpen, discountCodeInput, setDiscountCodeInput, setDiscountCodeError,
        setIsValidatingCode, validateDiscountCode, useDiscountCode
    });

    const {
        handleCloseShift, getShiftSummary, handleSubmitShift
    } = usePOSShiftActions({
        closingStep, setClosingStep, cashDenominations, setCashDenominations,
        discrepancyReason, setDiscrepancyReason, countedCash, setCountedCash,
        shiftNotes, setShiftNotes, setIsShiftModalOpen, setIsProcessing,
        activeShift, sales, closeShift, logout, navigate, addNotification
    });

    const {
        handleSearchForReturn, updateReturnConfig, handleProcessReturn
    } = usePOSReturnActions({
        returnSearchId, setReturnSearchId, foundSaleForReturn, setFoundSaleForReturn,
        returnConfig, setReturnConfig, setIsReturnModalOpen, setIsProcessing,
        sales, user, processReturn, addNotification
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

    // Global scan listener setup
    const handleScanProduct = React.useCallback(async (barcode: string): Promise<boolean> => {
        if (!barcode) return false;
        const product = products.find((p: Product) => {
            const matchSku = p.sku.toLowerCase() === barcode.toLowerCase();
            const matchBarcode = p.barcode?.toLowerCase() === barcode.toLowerCase();
            const matchBarcodes = p.barcodes?.some((b: string) => b.toLowerCase() === barcode.toLowerCase());
            const matchId = p.id === barcode;
            return matchSku || matchBarcode || matchBarcodes || matchId;
        });

        if (!product) {
            try {
                const serverResults = await productsService.getByBarcode(barcode, activeSite?.id);
                if (serverResults.length > 0) {
                    const sp = serverResults[0];
                    addToCart(sp);
                    addNotification('success', `Added ${sp.name} (Found via server)`);
                    return true;
                }
            } catch (err) { logger.error('POSContext', 'caught error', err as Error); }

            if (barcode.trim().length > 0) {
                setUnknownBarcode(barcode);
                setSearchTerm('');
                addNotification('alert', `Unknown Barcode: ${barcode}. Click 'Link Item' to map it.`);
            }
            return false;
        }

        if (unknownBarcode) setUnknownBarcode('');
        addToCart(product);
        addNotification('success', `Added ${product.name}`);
        return true;
    }, [products, activeSite, addNotification, unknownBarcode, setCart, addToCart]);

    // Effect for Keyboard shortcuts and scanners
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();
        let scanTimeout: NodeJS.Timeout;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const char = e.key;
            const now = Date.now();

            if (document.activeElement === searchInputRef.current) return;

            // Global Input Guard: Never intercept typing if the user is actively focused on a form field.
            // This prevents rapid manual typing (like decimals "1.5") from triggering the barcode scanner
            // in ANY modal (Misc Item, Shift Close, Receiving, etc).
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            if (isUnknownBarcodeModalOpen) return;
            if (weightPromptProduct) return; // Prevent scanner from intercepting typing in WeightEntryModal
            if (char === 'Shift' || char === 'Control' || char === 'Alt' || char === 'Meta' || char === 'Tab' || char === 'CapsLock') return;

            if (now - lastKeyTime > 100) { buffer = ''; }
            lastKeyTime = now;
            clearTimeout(scanTimeout);

            if (char === 'Enter') {
                if (document.activeElement === searchInputRef.current) { buffer = ''; return; }
                if (buffer.length > 0) {
                    handleScanProduct(buffer);
                    if (document.activeElement !== searchInputRef.current) setSearchTerm('');
                    buffer = '';
                    if (e.target instanceof HTMLInputElement) {
                        e.preventDefault(); e.stopPropagation();
                    }
                }
            } else if (char.length === 1) {
                const isValidBarcodeChar = /^[a-zA-Z0-9\-_\/\.\+\*\$\%\@\!\#\^\&\(\)\[\]\{\}\|\:\;\'\"\,\<\>\?\=\~\`\\ ]$/.test(char);
                if (isValidBarcodeChar) {
                    buffer += char;
                    scanTimeout = setTimeout(() => {
                        if (buffer.length > 0) {
                            handleScanProduct(buffer);
                            if (document.activeElement !== searchInputRef.current) setSearchTerm('');
                            buffer = '';
                        }
                    }, 300);
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown, true);
            clearTimeout(scanTimeout);
        };
    }, [handleScanProduct, isUnknownBarcodeModalOpen, weightPromptProduct]);

    // --- Functions ---

    const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const inputValue = searchInputRef.current?.value?.trim() || searchTerm.trim();
            if (!inputValue) return;
            if (inputValue.length < 3) { addNotification('alert', `Input too short.`); setSearchTerm(''); if (searchInputRef.current) searchInputRef.current.value = ''; return; }
            await handleScanProduct(inputValue);
            setSearchTerm(''); if (searchInputRef.current) searchInputRef.current.value = '';
            setTimeout(() => { if (searchInputRef.current) searchInputRef.current.focus(); }, 100);
        }
    };

    const handleSelectCustomer = (customer: Customer) => { setSelectedCustomer(customer); setIsCustomerModalOpen(false); addNotification('success', `Customer set to: ${customer.name}`); };
    const getCustomerHistory = (customerId: string) => sales.filter((sale: SaleRecord) => sale.customerId === customerId);
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
        miscItem, setMiscItem, isRoundingEnabled, setIsRoundingEnabled, roundingAdjustment, isReturnModalOpen, setIsReturnModalOpen,
        returnSearchId, setReturnSearchId, foundSaleForReturn, setFoundSaleForReturn, returnConfig,
        setReturnConfig,
        priceUpdatedProducts,
        isPriceUpdatesModalOpen,
        setIsPriceUpdatesModalOpen,
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
        addToCart, handleScanProduct, addMiscItem, updateQuantity, setCartItemQuantity, removeFromCart, clearCart,
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
        isReturnModalOpen, returnSearchId, foundSaleForReturn, returnConfig, priceUpdatedProducts,
        isPriceUpdatesModalOpen, isShiftModalOpen, closingStep, cashDenominations,
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
        filteredCustomers, needsStoreSelection, weightPromptProduct, isNativeApp,
        // Callbacks (stable via useCallback)
        addToCart, handleScanProduct, confirmWeightEntry
    ]);

    return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};
