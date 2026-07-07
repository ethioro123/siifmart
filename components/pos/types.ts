import React from 'react';
import { Product, CartItem, PaymentMethod, SaleRecord, ReturnCondition, ReturnReason, Customer, ShiftRecord } from '../../types';

export interface POSContextType {
    // State
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    selectedCategory: string;
    setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
    selectedDepartment: string;
    setSelectedDepartment: React.Dispatch<React.SetStateAction<string>>;
    sortBy: string;
    setSortBy: React.Dispatch<React.SetStateAction<string>>;
    minPriceFilter: string;
    setMinPriceFilter: React.Dispatch<React.SetStateAction<string>>;
    maxPriceFilter: string;
    setMaxPriceFilter: React.Dispatch<React.SetStateAction<string>>;
    selectedBrands: string[];
    setSelectedBrands: React.Dispatch<React.SetStateAction<string[]>>;
    selectedVelocities: string[];
    setSelectedVelocities: React.Dispatch<React.SetStateAction<string[]>>;
    stockStatusFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
    setStockStatusFilter: React.Dispatch<React.SetStateAction<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>>;
    onSaleOnly: boolean;
    setOnSaleOnly: React.Dispatch<React.SetStateAction<boolean>>;
    competitorMatchedOnly: boolean;
    setCompetitorMatchedOnly: React.Dispatch<React.SetStateAction<boolean>>;
    resetAllFilters: () => void;

    serverSearchResults: Product[];
    isSearchingServer: boolean;
    serverCustomerResults: Customer[];
    isSearchingCustomerServer: boolean;

    isPaymentModalOpen: boolean;
    setIsPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isReceiptModalOpen: boolean;
    setIsReceiptModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedPaymentMethod: PaymentMethod;
    setSelectedPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
    amountTendered: string;
    setAmountTendered: React.Dispatch<React.SetStateAction<string>>;
    isProcessing: boolean;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    lastSale: SaleRecord | null;
    setLastSale: React.Dispatch<React.SetStateAction<SaleRecord | null>>;

    showPointsPopup: boolean;
    setShowPointsPopup: React.Dispatch<React.SetStateAction<boolean>>;
    earnedPointsData: any;
    setEarnedPointsData: React.Dispatch<React.SetStateAction<any>>;

    isRecallModalOpen: boolean;
    setIsRecallModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    cartDiscount: number;
    setCartDiscount: React.Dispatch<React.SetStateAction<number>>;
    appliedDiscountCode: string | null;
    setAppliedDiscountCode: React.Dispatch<React.SetStateAction<string | null>>;
    appliedDiscountCodeDetails: any;
    setAppliedDiscountCodeDetails: React.Dispatch<React.SetStateAction<any>>;
    isDiscountModalOpen: boolean;
    setIsDiscountModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    discountCodeInput: string;
    setDiscountCodeInput: React.Dispatch<React.SetStateAction<string>>;
    discountCodeError: string;
    setDiscountCodeError: React.Dispatch<React.SetStateAction<string>>;
    isValidatingCode: boolean;
    setIsValidatingCode: React.Dispatch<React.SetStateAction<boolean>>;
    isMiscItemModalOpen: boolean;
    setIsMiscItemModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    miscItem: { name: string; price: string };
    setMiscItem: React.Dispatch<React.SetStateAction<{ name: string; price: string }>>;
    isRoundingEnabled: boolean;
    setIsRoundingEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    roundingAdjustment: number;

    isReturnModalOpen: boolean;
    setIsReturnModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    returnSearchId: string;
    setReturnSearchId: React.Dispatch<React.SetStateAction<string>>;
    foundSaleForReturn: SaleRecord | null;
    setFoundSaleForReturn: React.Dispatch<React.SetStateAction<SaleRecord | null>>;
    returnConfig: Record<string, { qty: number, condition: ReturnCondition, reason: ReturnReason }>;
    setReturnConfig: React.Dispatch<React.SetStateAction<Record<string, { qty: number, condition: ReturnCondition, reason: ReturnReason }>>>;
    priceUpdatedProducts: Product[];

    isPriceUpdatesModalOpen: boolean;
    setIsPriceUpdatesModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

    isShiftModalOpen: boolean;
    setIsShiftModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
    activeShift: ShiftRecord | undefined;
    shiftStartTime: string;

    isReceivingModalOpen: boolean;
    setIsReceivingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    scannedBarcode: string;
    setScannedBarcode: React.Dispatch<React.SetStateAction<string>>;
    receivedItems: Array<{ product: Product; qty: number; timestamp: string }>;
    setReceivedItems: React.Dispatch<React.SetStateAction<Array<{ product: Product; qty: number; timestamp: string }>>>;
    isQRScannerOpen: boolean;
    setIsQRScannerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    receivingMode: 'TRANSFERS' | 'MANUAL';
    setReceivingMode: React.Dispatch<React.SetStateAction<'TRANSFERS' | 'MANUAL'>>;
    selectedTransferForReceiving: string | null;
    setSelectedTransferForReceiving: React.Dispatch<React.SetStateAction<string | null>>;
    transferReceivingItems: any[];
    setTransferReceivingItems: React.Dispatch<React.SetStateAction<any[]>>;
    isConfirmingReceive: boolean;
    setIsConfirmingReceive: React.Dispatch<React.SetStateAction<boolean>>;

    isHoldOrderModalOpen: boolean;
    setIsHoldOrderModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    holdOrderNote: string;
    setHoldOrderNote: React.Dispatch<React.SetStateAction<string>>;

    isOverwriteCartModalOpen: boolean;
    setIsOverwriteCartModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    pendingRecallOrderId: string | null;
    setPendingRecallOrderId: React.Dispatch<React.SetStateAction<string | null>>;

    isEmailReceiptModalOpen: boolean;
    setIsEmailReceiptModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    emailReceiptAddress: string;
    setEmailReceiptAddress: React.Dispatch<React.SetStateAction<string>>;

    showCart: boolean;
    setShowCart: React.Dispatch<React.SetStateAction<boolean>>;
    isNativeApp: boolean;

    selectedCustomer: Customer | null;
    setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
    isCustomerModalOpen: boolean;
    setIsCustomerModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    customerSearchTerm: string;
    setCustomerSearchTerm: React.Dispatch<React.SetStateAction<string>>;

    isReceiptPreviewOpen: boolean;
    setIsReceiptPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
    receiptPreviewHTML: string;
    setReceiptPreviewHTML: React.Dispatch<React.SetStateAction<string>>;

    isUnknownBarcodeModalOpen: boolean;
    setIsUnknownBarcodeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    unknownBarcode: string;
    setUnknownBarcode: React.Dispatch<React.SetStateAction<string>>;
    capturedBarcodeForModal: string;
    setCapturedBarcodeForModal: React.Dispatch<React.SetStateAction<string>>;

    searchInputRef: React.RefObject<HTMLInputElement | null>;

    // Computed Values
    filteredProducts: Product[];
    categories: string[];
    currentStorePoints: any;
    storeBonus: any;
    userBonusShare: any;
    subtotal: number;
    tax: number;
    taxBreakdown: any[];
    rawTotal: number;
    total: number;
    changeDue: number;
    isPaymentValid: boolean;
    filteredCustomers: Customer[];
    needsStoreSelection: boolean;

    // Functions
    addToCart: (product: Product) => void;
    handleScanProduct: (barcode: string) => Promise<boolean>;
    addMiscItem: () => void;
    updateQuantity: (id: string, delta: number) => void;
    setCartItemQuantity: (id: string, qty: number) => void;
    removeFromCart: (id: string) => void;
    weightPromptProduct: Product | null;
    setWeightPromptProduct: React.Dispatch<React.SetStateAction<Product | null>>;
    confirmWeightEntry: (qty: number) => void;
    clearCart: () => void;
    handleHoldOrder: () => void;
    handleConfirmHoldOrder: () => void;
    handleRecallOrder: (orderId: string) => void;
    handleConfirmOverwriteCart: () => void;
    applyDiscountFromCode: (discountCode: any) => void;
    handleValidateDiscountCode: () => void;
    handleRemoveDiscount: () => void;
    handleInitiatePayment: () => void;
    handleProcessPayment: () => Promise<void>;
    handlePrintReceipt: () => void;
    handleConfirmPrint: () => void;
    handleEmailReceipt: () => void;
    handleConfirmEmailReceipt: () => void;
    handleOpenDrawer: () => void;
    handleReprintLast: () => void;
    handleConfirmReceiving: () => Promise<void>;
    handleSelectTransferForReceiving: (transferId: string) => void;
    handleUpdateTransferItem: (index: number, field: string, value: any) => void;
    handleConfirmTransferReceiving: () => Promise<void>;
    handleCloseShift: () => void;
    getShiftSummary: () => any;
    handleSubmitShift: () => Promise<void>;
    handleSearchForReturn: () => void;
    updateReturnConfig: (itemId: string, field: string, value: any) => void;
    handleProcessReturn: () => Promise<void>;
    handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void>;
    handleSelectCustomer: (customer: Customer) => void;
    getCustomerHistory: (customerId: string) => SaleRecord[];
    getCustomerStats: (customerId: string) => { totalSpent: number, totalVisits: number };
}
