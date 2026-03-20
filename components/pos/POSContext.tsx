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

interface POSContextType {
    // State
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    selectedCategory: string;
    setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;

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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [serverSearchResults, setServerSearchResults] = useState<Product[]>([]);
    const [isSearchingServer, setIsSearchingServer] = useState(false);
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
    const activeShift = shifts.find(s => s.cashierId === user?.id && s.status === 'Open');
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
                console.error("Customer search failed", err);
            } finally {
                setIsSearchingCustomerServer(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [customerSearchTerm]);

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 3) {
            setServerSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchingServer(true);
            try {
                const results = await productsService.search(searchTerm, activeSite?.id);
                setServerSearchResults(results);
            } catch (err) {
                console.error("Product search failed", err);
            } finally {
                setIsSearchingServer(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, activeSite]);

    // Global scan listener setup
    const handleScanProduct = React.useCallback(async (barcode: string): Promise<boolean> => {
        if (!barcode) return false;
        const product = products.find(p => {
            const matchSku = p.sku.toLowerCase() === barcode.toLowerCase();
            const matchBarcode = p.barcode?.toLowerCase() === barcode.toLowerCase();
            const matchBarcodes = p.barcodes?.some(b => b.toLowerCase() === barcode.toLowerCase());
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
            } catch (err) { console.error(err); }

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
    }, [products, activeSite, addNotification, unknownBarcode, setCart]); // Note: addToCart defined below, but we can access setCart directly if needed

    const addToCart = React.useCallback((product: Product) => {
        // Check if this product needs a weight/quantity prompt (KG, G, L, ML)
        if (needsQuantityPrompt(product.unit)) {
            setWeightPromptProduct(product);
            return;
        }
        const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    addNotification('alert', `Cannot add more. Only ${product.stock} units in stock.`);
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, price: effectivePrice, quantity: 1 }];
        });
    }, [addNotification]);

    const confirmWeightEntry = React.useCallback((qty: number) => {
        if (!weightPromptProduct || qty <= 0) {
            setWeightPromptProduct(null);
            return;
        }
        const product = weightPromptProduct;
        const unit = getSellUnit(product.unit);
        const normalizedQty = normalizeQuantity(qty, product.unit);
        const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                const newQty = existing.quantity + normalizedQty;
                if (newQty > product.stock) {
                    addNotification('alert', `Cannot add more. Only ${product.stock} ${unit.shortLabel} in stock.`);
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, quantity: normalizeQuantity(newQty, product.unit) } : item);
            }
            return [...prev, { ...product, price: effectivePrice, quantity: normalizedQty }];
        });
        setWeightPromptProduct(null);
    }, [weightPromptProduct, addNotification]);

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
    }, [handleScanProduct, isUnknownBarcodeModalOpen]);

    // --- Computed Values ---
    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm.trim()) return customers;
        const term = customerSearchTerm.toLowerCase();
        const localMatches = customers.filter(c => c.name.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term));
        if (serverCustomerResults.length > 0) {
            const combined = [...localMatches];
            serverCustomerResults.forEach(sc => {
                if (!combined.find(c => c.id === sc.id)) combined.push(sc);
            });
            return combined;
        }
        return localMatches;
    }, [customers, customerSearchTerm, serverCustomerResults]);

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

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
        const roleConfig = roleDistribution.find(r => r.role.toLowerCase() === user.role.toLowerCase());
        if (!roleConfig) return null;
        return {
            percentage: roleConfig.percentage,
            amount: (storeBonus.bonus * roleConfig.percentage) / 100
        };
    }, [storeBonus, user?.role, settings.posRoleDistribution]);

    const filteredProducts = useMemo(() => {
        let baseList = products;
        if (serverSearchResults.length > 0) {
            const combined = [...products];
            serverSearchResults.forEach(sp => {
                if (!combined.find(p => p.id === sp.id)) combined.push(sp);
            });
            baseList = combined;
        }
        return baseList.filter(p => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = p.name.toLowerCase().includes(searchLower) || p.sku.toLowerCase().includes(searchLower) || p.barcode?.toLowerCase().includes(searchLower) || p.barcodes?.some(b => b.toLowerCase().includes(searchLower));
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            const hasStock = p.stock > 0;
            let hasBeenReceived = false;
            if (activeSite?.type === 'Warehouse' || activeSite?.type === 'Distribution Center') {
                hasBeenReceived = !!p.location && p.location.trim() !== '' && p.location !== 'Receiving Dock' && /^[A-Z]-\d{2}-\d{2}$/.test(p.location.trim());
            } else if (activeSite?.type === 'Store' || activeSite?.type === 'Dark Store') {
                hasBeenReceived = (p.siteId === activeSite?.id || p.site_id === activeSite?.id);
            } else {
                hasBeenReceived = !!p.location && p.location.trim() !== '';
            }
            return matchesSearch && matchesCategory && hasStock && hasBeenReceived;
        });
    }, [searchTerm, selectedCategory, products, activeSite, transfers, serverSearchResults]);

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
        return products.filter(p => {
            if (!p.priceUpdatedAt && !p.price_updated_at) return false;
            const date = new Date(p.priceUpdatedAt || p.price_updated_at || '');
            return date > twentyFourHoursAgo;
        });
    }, [products]);

    const [isPriceUpdatesModalOpen, setIsPriceUpdatesModalOpen] = useState(false);

    const activeSiteType = activeSite?.type || 'Administrative';
    const isMultiSiteRole = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'auditor';
    const needsStoreSelection = isMultiSiteRole && (activeSiteType === 'Administrative' || activeSiteType === 'Headquarters' || activeSiteType === 'HQ' || activeSiteType === 'Administration');


    // --- Functions ---
    const addMiscItem = () => {
        if (!miscItem.price) return;
        const price = parseFloat(miscItem.price);
        const newItem: CartItem = {
            id: `MISC-${Date.now()}`, siteId: activeSite?.id || 'SITE-001', name: miscItem.name || 'Miscellaneous',
            price, quantity: 1, category: 'General', stock: 9999, sku: 'MISC', image: 'https://ui-avatars.com/api/?name=Misc+Item&background=random&color=fff', status: 'active'
        };
        setCart(prev => [...prev, newItem]);
        setIsMiscItemModalOpen(false);
        setMiscItem({ name: 'Misc Item', price: '' });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const unit = getSellUnit(item.unit);
                const step = unit.allowDecimal ? 0.1 : 1;
                const actualDelta = delta > 0 ? step : -step;
                const newQty = normalizeQuantity(item.quantity + actualDelta, item.unit);
                if (actualDelta > 0 && newQty > item.stock) {
                    addNotification('alert', `Stock limit reached! Only ${item.stock} ${unit.shortLabel || 'units'} available.`);
                    return item;
                }
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const setCartItemQuantity = (id: string, qty: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const unit = getSellUnit(item.unit);
                const normalized = normalizeQuantity(qty, item.unit);
                if (normalized > item.stock) {
                    addNotification('alert', `Stock limit reached! Only ${item.stock} ${unit.shortLabel || 'units'} available.`);
                    return item;
                }
                return normalized > 0 ? { ...item, quantity: normalized } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

    const clearCart = () => {
        setCart([]); setCartDiscount(0); setAppliedDiscountCode(null); setAppliedDiscountCodeDetails(null); setDiscountCodeInput(''); setDiscountCodeError(''); setIsRoundingEnabled(true);
    };

    const handleHoldOrder = () => {
        if (cart.length === 0) return;
        setHoldOrderNote(''); setIsHoldOrderModalOpen(true);
    };

    const handleConfirmHoldOrder = () => {
        const order: HeldOrder = {
            id: `HOLD-${Date.now()}`, siteId: activeSite?.id || 'SITE-001', time: formatDateTime(new Date(), { showTime: true }), items: [...cart], note: holdOrderNote || 'No Note'
        };
        holdOrder(order); clearCart(); addNotification('success', "Order Placed on Hold."); setIsHoldOrderModalOpen(false);
    };

    const handleRecallOrder = (orderId: string) => {
        const order = heldOrders.find(o => o.id === orderId);
        if (order) {
            if (cart.length > 0) { setPendingRecallOrderId(orderId); setIsOverwriteCartModalOpen(true); return; }
            setCart(order.items); releaseHold(orderId); setIsRecallModalOpen(false);
        }
    };

    const handleConfirmOverwriteCart = () => {
        if (!pendingRecallOrderId) return;
        const order = heldOrders.find(o => o.id === pendingRecallOrderId);
        if (order) { setCart(order.items); releaseHold(pendingRecallOrderId); setIsRecallModalOpen(false); }
        setIsOverwriteCartModalOpen(false); setPendingRecallOrderId(null);
    };

    const applyDiscountFromCode = (discountCode: any) => {
        let discountAmount = discountCode.type === 'FIXED' ? discountCode.value : subtotal * (discountCode.value / 100);
        if (discountCode.maxDiscountAmount !== undefined && discountAmount > discountCode.maxDiscountAmount) discountAmount = discountCode.maxDiscountAmount;
        setCartDiscount(discountAmount); setAppliedDiscountCode(discountCode.id); setAppliedDiscountCodeDetails({ code: discountCode.code, name: discountCode.name, type: discountCode.type, value: discountCode.value });
        setIsDiscountModalOpen(false); setDiscountCodeInput(''); setDiscountCodeError(''); addNotification('success', `Discount code "${discountCode.code}" applied!`);
    };

    const handleValidateDiscountCode = () => {
        if (!discountCodeInput.trim()) { setDiscountCodeError('Please enter a discount code'); return; }
        setIsValidatingCode(true); setDiscountCodeError('');
        setTimeout(() => {
            const result = validateDiscountCode(discountCodeInput, activeSite?.id, subtotal);
            if (result.valid && result.discountCode) { applyDiscountFromCode(result.discountCode); useDiscountCode(result.discountCode.id); }
            else { setDiscountCodeError(result.error || 'Invalid discount code'); }
            setIsValidatingCode(false);
        }, 300);
    };

    const handleRemoveDiscount = () => {
        setCartDiscount(0); setAppliedDiscountCode(null); setAppliedDiscountCodeDetails(null); setDiscountCodeInput(''); setDiscountCodeError(''); setIsDiscountModalOpen(false); addNotification('info', 'Discount removed');
    };

    const handleInitiatePayment = () => {
        if (cart.length === 0) { addNotification('info', "Cart is empty. Add items to proceed to payment."); return; }
        setAmountTendered(''); setSelectedPaymentMethod('Cash'); setIsPaymentModalOpen(true);
    };

    const handleProcessPayment = async () => {
        if (!isPaymentValid) return;
        setIsProcessing(true);
        try {
            const tendered = selectedPaymentMethod === 'Cash' ? parseFloat(amountTendered) : total;
            const change = selectedPaymentMethod === 'Cash' ? changeDue : 0;
            // Sequential strictly numeric receipt number: {SITE_ID}{6_DIGIT_SEQUENCE}
            // Persisted per-site in localStorage so it survives reloads and works offline
            let siteIdNum = activeSite?.siteNumber;
            if (siteIdNum === undefined && activeSite?.code) {
                const match = activeSite.code.match(/\d+/);
                if (match) siteIdNum = parseInt(match[0], 10);
            }
            
            const siteCode = siteIdNum || '0';
            const counterKey = `pos_receipt_counter_${activeSite?.id || 'default'}`;
            const prevCount = parseInt(localStorage.getItem(counterKey) || '0', 10);
            const nextCount = prevCount + 1;
            localStorage.setItem(counterKey, String(nextCount));
            
            // Format: SiteNumber + 6-digit zero-padded sequence (e.g., Site 5 + Seq 1 = 5000001)
            const receiptNumber = `${siteCode}${nextCount.toString().padStart(6, '0')}`;
            const { saleId, pointsResult } = await processSale(cart, selectedPaymentMethod, user?.name || 'Cashier', tendered, change, selectedCustomer?.id, undefined, 'In-Store', taxBreakdown, receiptNumber, total);

            const saleObj: SaleRecord = {
                id: saleId, siteId: activeSite?.id || 'SITE-001', date: formatDateTime(new Date(), { showTime: true }), subtotal, tax, taxBreakdown, total, method: selectedPaymentMethod,
                status: 'Completed', items: [...cart], amountTendered: tendered, change, cashierName: user?.name, customerId: selectedCustomer?.id || undefined, receiptNumber
            };
            setLastSale(saleObj);
            if (pointsResult) { setEarnedPointsData(pointsResult); setShowPointsPopup(true); }
            setIsProcessing(false); setIsPaymentModalOpen(false); setIsReceiptModalOpen(true); clearCart(); setSelectedCustomer(null);
        } catch (e) {
            addNotification('alert', "Error processing sale"); setIsProcessing(false);
        }
    };

    const handlePrintReceipt = () => {
        const { storeName = 'SIIFMART', posReceiptLogo, posReceiptShowLogo = true, posReceiptHeader = 'SIIFMART RETAIL', posReceiptFooter = 'Thank you for shopping with us!', posReceiptAddress, posReceiptPhone, posReceiptEmail, posReceiptTaxId, posReceiptPolicy, posReceiptSocialHandle, posReceiptEnableQR = true, posReceiptQRLink = 'https://siifmart.com/feedback', posReceiptWidth = '80mm', posReceiptFont = 'sans-serif' } = settings;
        const displayStoreName = storeName || activeSite?.name || 'SIIFMART';
        const paperWidth = posReceiptWidth === '80mm' ? '80mm' : '58mm';
        const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${lastSale?.receiptNumber || 'TX'}</title>
        <style>
          @page { size: ${paperWidth} auto; margin: 0; }
          body { font-family: ${posReceiptFont === 'monospace' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'system-ui, -apple-system, sans-serif'}; width: ${paperWidth}; margin: 0; padding: 24px; color: #000; background: #fff; -webkit-print-color-adjust: exact; font-size: 10px; }
          .text-center { text-align: center; } .text-right { text-align: right; } .flex { display: flex; } .justify-between { justify-content: space-between; } .justify-center { justify-content: center; } .gap-2 { gap: 8px; } .mb-1 { margin-bottom: 4px; } .mb-4 { margin-bottom: 16px; } .pb-4 { padding-bottom: 16px; } .py-3 { padding-top: 12px; padding-bottom: 12px; } .pt-2 { padding-top: 8px; } .mt-2 { margin-top: 8px; } .space-y-05 > * + * { margin-top: 2px; } .space-y-1 > * + * { margin-top: 4px; } .space-y-2 > * + * { margin-top: 8px; }
          .font-bold { font-weight: 700; } .font-black { font-weight: 900; } .uppercase { text-transform: uppercase; } .tracking-tighter { letter-spacing: -0.05em; } .tracking-widest { letter-spacing: 0.1em; } .text-xs { font-size: 12px; } .text-base { font-size: 16px; } .text-xl { font-size: 20px; } .border-b-2-dashed { border-bottom: 2px dashed rgba(0,0,0,0.1); } .border-y { border-top: 1px solid rgba(0,0,0,0.1); border-bottom: 1px solid rgba(0,0,0,0.1); } .border-t-black { border-top: 1px solid #000; } .border-t-dashed { border-top: 1px dashed rgba(0,0,0,0.1); } .logo { max-height: 48px; object-fit: contain; margin: 0 auto; filter: grayscale(1); display: block; } .opacity-60 { opacity: 0.6; }
        </style>
      </head>
      <body>
          ${posReceiptShowLogo && posReceiptLogo ? `<div class="flex justify-center mb-4"><img src="${posReceiptLogo}" class="logo" /></div>` : ''}
          <div class="text-center border-b-2-dashed pb-4 mb-4">
            <h2 class="text-xl font-black uppercase tracking-tighter leading-none mb-1">${displayStoreName}</h2>
            <p class="text-[10px] font-bold uppercase tracking-widest opacity-80">${posReceiptHeader}</p>
          </div>
          <div class="text-[10px] text-center space-y-05 mb-4 border-b-2-dashed pb-4">
            ${posReceiptAddress ? `<p>${posReceiptAddress}</p>` : ''}
            <div class="flex justify-center gap-2">
              ${posReceiptPhone ? `<p>Tel: ${posReceiptPhone}</p>` : ''}
              ${posReceiptEmail ? `<p>Email: ${posReceiptEmail}</p>` : ''}
            </div>
            ${posReceiptTaxId ? `<p class="font-bold">TIN: ${posReceiptTaxId}</p>` : ''}
          </div>
          <div class="text-[10px] space-y-1 mb-4">
            <div class="flex justify-between"><span class="opacity-60">DATE:</span> <span>${formatDateTime(new Date(), { showTime: true })}</span></div>
            <div class="flex justify-between"><span class="opacity-60">RECEIPT:</span> <span class="font-bold">${lastSale?.receiptNumber || 'TEMPORARY'}</span></div>
            <div class="flex justify-between"><span class="opacity-60">CASHIER:</span> <span>${user?.name || 'ADMINISTRATOR'}</span></div>
            ${selectedCustomer ? `<div class="flex justify-between"><span class="opacity-60">CUSTOMER:</span> <span>${selectedCustomer.name}</span></div>` : ''}
          </div>
          <div class="border-y py-3 mb-4 space-y-2">
            ${(lastSale?.items || []).map(item => `<div class="flex justify-between text-[10px]"><div><div class="font-bold">${item.name}</div><div class="text-[9px] opacity-60">${item.quantity} x ${CURRENCY_SYMBOL}${item.price.toFixed(2)}</div></div><div class="font-bold">${(item.price * item.quantity).toLocaleString()}</div></div>`).join('')}
          </div>
          <div class="space-y-1 text-right mb-4">
            <div class="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>${CURRENCY_SYMBOL}${(lastSale?.subtotal || 0).toLocaleString()}</span></div>
            ${(lastSale?.taxBreakdown || []).length > 0 ? (lastSale?.taxBreakdown || []).map(rule => `<div class="flex justify-between text-[10px] opacity-60"><span>${rule.name} (${rule.rate}%)</span><span>${CURRENCY_SYMBOL}${rule.amount.toLocaleString()}</span></div>`).join('') : `<div class="flex justify-between text-[10px] opacity-60"><span>Standard Tax (0%)</span><span>${CURRENCY_SYMBOL}0</span></div>`}
            <div class="flex justify-between font-black text-base border-t-black pt-2 mt-2"><span>TOTAL</span> <span>${CURRENCY_SYMBOL}${(lastSale?.total || 0).toLocaleString()}</span></div>
          </div>
          <div class="text-[10px] font-bold border-t-dashed pt-4 mb-4">
            <div class="flex justify-between">
              <span>PAID (${(lastSale?.method || 'CASH').toUpperCase()})</span>
              <span>${CURRENCY_SYMBOL}${(lastSale?.amountTendered || lastSale?.total || 0).toLocaleString()}</span>
            </div>
          </div>
          <div class="text-center space-y-1 pt-4 border-t-dashed">
            <p class="text-xs font-bold leading-tight mb-2">${posReceiptFooter}</p>
            ${posReceiptSocialHandle ? `<p class="text-[10px] opacity-70 font-medium">${posReceiptSocialHandle}</p>` : ''}
            ${posReceiptPolicy ? `<p class="text-[9px] italic opacity-60 leading-tight">${posReceiptPolicy}</p>` : ''}
            ${posReceiptEnableQR ? `<div class="flex justify-center mt-4"><img src="https://chart.googleapis.com/chart?cht=qr&chs=100x100&chl=${encodeURIComponent(posReceiptQRLink)}" style="width: 64px; height: 64px;" /></div>` : ''}
          </div>
      </body>
      </html>
    `;
        setReceiptPreviewHTML(receiptHTML); setIsReceiptPreviewOpen(true);
    };

    const handleConfirmPrint = () => {
        const printWindow = window.open('', 'ReceiptPrinterWindow', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.write(receiptPreviewHTML); printWindow.document.close();
            printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
            setTimeout(() => { if (!printWindow.closed) { printWindow.focus(); printWindow.print(); } }, 500);
        }
        setIsReceiptPreviewOpen(false); addNotification('success', 'Receipt sent to printer');
    };

    const handleEmailReceipt = () => { setEmailReceiptAddress(''); setIsEmailReceiptModalOpen(true); };
    const handleConfirmEmailReceipt = () => {
        if (emailReceiptAddress) {
            setIsProcessing(true);
            setTimeout(() => { setIsProcessing(false); addNotification('success', `Digital Receipt for ${lastSale?.receiptNumber || lastSale?.id} sent to ${emailReceiptAddress} `); setIsEmailReceiptModalOpen(false); }, 1000);
        }
    };

    const handleOpenDrawer = () => { addNotification('info', "SYSTEM: Trigger sent to Cash Drawer (COM3) [KICK_DRAWER]"); };
    const handleReprintLast = () => {
        if (lastSale) setIsReceiptModalOpen(true);
        else if (sales.length > 0) { setLastSale(sales[0]); setIsReceiptModalOpen(true); }
        else addNotification('info', "No recent transactions found in this session to reprint.");
    };

    const handleConfirmReceiving = async () => {
        if (receivedItems.length === 0) { addNotification('alert', 'No items to confirm'); return; }
        try {
            for (const item of receivedItems) {
                await updateProduct({ ...item.product, posReceivedAt: new Date().toISOString(), pos_received_at: new Date().toISOString(), posReceivedBy: user?.name || 'POS User', pos_received_by: user?.name || 'POS User' }, user?.name || 'POS User');
            }
            addNotification('success', `Confirmed ${receivedItems.length} item(s) as received.`);
        } catch (e) { addNotification('alert', 'Failed to confirm receiving.'); }
    };

    const handleSelectTransferForReceiving = (transferId: string) => {
        const transfer = transfers.find((t: TransferRecord) => t.id === transferId);
        if (!transfer) return;
        setSelectedTransferForReceiving(transferId);
        const items = transfer.items.map((item: any) => {
            const product = products.find(p => p.sku === item.sku || p.id === item.productId);
            return { productId: item.productId, sku: item.sku, name: product?.name || item.name || 'Unknown Product', expectedQty: item.quantity, receivedQty: item.quantity, condition: 'Good' as const, notes: '' };
        });
        setTransferReceivingItems(items);
    };

    const handleUpdateTransferItem = (index: number, field: string, value: any) => {
        setTransferReceivingItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const handleConfirmTransferReceiving = async () => {
        if (!selectedTransferForReceiving || transferReceivingItems.length === 0) { addNotification('alert', 'No transfer selected'); return; }
        setIsConfirmingReceive(true);
        try {
            const transfer = transfers.find((t: TransferRecord) => t.id === selectedTransferForReceiving);
            if (!transfer) throw new Error('Transfer not found');
            const discrepancies = transferReceivingItems.filter(item => item.receivedQty !== item.expectedQty || item.condition !== 'Good');
            for (const item of transferReceivingItems) {
                const product = products.find(p => p.sku === item.sku || p.id === item.productId);
                if (product) {
                    await updateProduct({ ...product, posReceivedAt: new Date().toISOString(), pos_received_at: new Date().toISOString(), posReceivedBy: user?.name || 'POS User', pos_received_by: user?.name || 'POS User', needsReview: item.condition === 'Damaged', receivingNotes: item.notes || undefined }, user?.name || 'POS User');
                }
            }
            const receivedQuantities: Record<string, number> = {};
            for (const item of transferReceivingItems) {
                if (item.condition !== 'Damaged' && item.receivedQty > 0) receivedQuantities[item.sku] = item.receivedQty;
                else if (item.condition === 'Damaged') receivedQuantities[item.sku] = 0;
            }
            await receiveTransfer(transfer.id, user?.name || 'POS User', receivedQuantities);
            if (discrepancies.length > 0) {
                addNotification('alert', `Received ${transferReceivingItems.length} items with discrepancies: ${discrepancies.length} found.`);
            } else {
                addNotification('success', `Successfully received ${transferReceivingItems.length} item(s) from transfer.`);
            }
            setSelectedTransferForReceiving(null); setTransferReceivingItems([]); setIsReceivingModalOpen(false); await refreshData();
        } catch (e) { addNotification('alert', 'Failed to confirm receiving.'); } finally { setIsConfirmingReceive(false); }
    };

    const handleCloseShift = () => { setCountedCash(''); setShiftNotes(''); setClosingStep(1); setCashDenominations({ '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0 }); setDiscrepancyReason(''); setIsShiftModalOpen(true); };

    const getShiftSummary = () => {
        if (!activeShift) return { cash: 0, card: 0, mobile: 0, total: 0, expected: 0 };
        const startTime = new Date(activeShift.startTime).getTime();
        const currentShiftSales = sales.filter(s => new Date(s.date).getTime() >= startTime);
        const cash = currentShiftSales.filter(s => s.method === 'Cash').reduce((sum, s) => sum + s.total, 0);
        const card = currentShiftSales.filter(s => s.method === 'Card').reduce((sum, s) => sum + s.total, 0);
        const mobile = currentShiftSales.filter(s => s.method === 'Mobile Money').reduce((sum, s) => sum + s.total, 0);
        return { cash, card, mobile, total: cash + card + mobile, expected: (activeShift.openingFloat || 0) + cash };
    };

    const handleSubmitShift = async () => {
        if (!activeShift) return;
        setIsProcessing(true);
        try {
            const summary = getShiftSummary();
            const actualCash = Object.entries(cashDenominations).reduce((sum, [value, count]) => sum + (parseInt(value) * count), 0);
            const record: any = { ...activeShift, endTime: new Date().toISOString(), cashSales: summary.cash, cardSales: summary.card, mobileSales: summary.mobile, expectedCash: summary.expected, actualCash, variance: actualCash - summary.expected, denominations: cashDenominations, discrepancyReason: discrepancyReason || shiftNotes, status: 'Closed' };
            await closeShift(record);
            setIsProcessing(false); setIsShiftModalOpen(false); addNotification('success', "Shift Closed Successfully."); logout(); navigate('/');
        } catch (e) { addNotification('alert', 'Failed to close shift.'); setIsProcessing(false); }
    };

    const handleSearchForReturn = () => {
        const sale = sales.find(s => s.id === returnSearchId || s.receiptNumber === returnSearchId || s.id === `TX-${returnSearchId}`);
        if (sale) { setFoundSaleForReturn(sale); const initialConfig: Record<string, any> = {}; sale.items.forEach(item => { initialConfig[item.id] = { qty: 0, condition: 'Resalable', reason: 'Customer Changed Mind' }; }); setReturnConfig(initialConfig); }
        else { setFoundSaleForReturn(null); addNotification('alert', 'Transaction not found.'); }
    };

    const updateReturnConfig = (itemId: string, field: string, value: any) => { setReturnConfig(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } })); };

    const handleProcessReturn = async () => {
        if (!foundSaleForReturn) return;
        setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 1500));
        const returnItems: ReturnItem[] = []; let refundTotal = 0;
        foundSaleForReturn.items.forEach(item => {
            const config = returnConfig[item.id];
            if (config && config.qty > 0) { const refundAmount = item.price * config.qty; refundTotal += refundAmount; returnItems.push({ productId: item.id, quantity: config.qty, reason: config.reason, condition: config.condition, refundAmount }); }
        });
        if (returnItems.length > 0) {
            await processReturn(foundSaleForReturn.id, returnItems, refundTotal, user?.name || 'System');
            addNotification('success', `Refund Processed: ${CURRENCY_SYMBOL} ${refundTotal.toLocaleString()}`);
        }
        setIsProcessing(false); setIsReturnModalOpen(false); setFoundSaleForReturn(null); setReturnSearchId(''); setReturnConfig({});
    };

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
    const getCustomerHistory = (customerId: string) => sales.filter(sale => sale.customerId === customerId);
    const getCustomerStats = (customerId: string) => { const customerSales = getCustomerHistory(customerId); return { totalSpent: customerSales.reduce((sum, sale) => sum + sale.total, 0), totalVisits: customerSales.length }; };

    const value = {
        cart, setCart, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory,
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
    };

    return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};
