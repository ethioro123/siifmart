
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Minus, Trash2, CreditCard, Printer, User, RotateCcw, Lock, Box, Check, Mail,
  ArrowLeft, Smartphone, Banknote, CheckCircle, RefreshCcw, Share2, AlertTriangle,
  ArrowRight, LogOut, FileText, PauseCircle, PlayCircle, Tag, ShoppingBag, Scan, Package, Camera,
  MapPin, Store, Truck, Loader2, Trophy, Gift, Settings, Layers, Percent, DollarSign, Archive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOL } from '../constants';
import { formatCompactNumber, formatDateTime } from '../utils/formatting';
import { Product, CartItem, PaymentMethod, SaleRecord, ReturnCondition, ReturnReason, ReturnItem, ShiftRecord, HeldOrder, Customer, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION } from '../types';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext'; // Use Live Data
import Modal from '../components/Modal';
import { Protected, ProtectedButton } from '../components/Protected';
import { useLanguage } from '../contexts/LanguageContext';
import { QRScanner } from '../components/QRScanner';
import { native } from '../utils/native';
import { StoreBonusWidget, calculateStoreBonus } from '../components/StoreBonusDisplay';
import Button from '../components/shared/Button';
import { PointsEarnedPopup } from '../components/WorkerPointsDisplay';
import { customersService, productsService } from '../services/supabase.service';

export default function POS() {
  const { user, logout } = useStore();
  const {
    products, activeSite, shifts, startShift, addNotification,
    processSale, processReturn, holdOrder, releaseHold, heldOrders,
    updateCustomer, customers, promotions, sales, transfers, closeShift,
    updateProduct, sites, refreshData, settings, getStorePoints, storePoints,
    discountCodes, validateDiscountCode, useDiscountCode, getTaxForSite
  } = useData();


  const { t } = useLanguage();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- Server-Side Search State ---
  const [serverSearchResults, setServerSearchResults] = useState<Product[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [serverCustomerResults, setServerCustomerResults] = useState<Customer[]>([]);
  const [isSearchingCustomerServer, setIsSearchingCustomerServer] = useState(false);

  // --- Logic State ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);

  // Gamification state
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [earnedPointsData, setEarnedPointsData] = useState<any>(null);

  // --- Advanced POS Features ---
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [cartDiscount, setCartDiscount] = useState(0); // Fixed amount
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);
  const [appliedDiscountCodeDetails, setAppliedDiscountCodeDetails] = useState<{ code: string; name: string; type: 'PERCENTAGE' | 'FIXED'; value: number } | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountCodeError, setDiscountCodeError] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isMiscItemModalOpen, setIsMiscItemModalOpen] = useState(false);
  const [miscItem, setMiscItem] = useState({ name: 'Misc Item', price: '' });
  const [roundingAdjustment, setRoundingAdjustment] = useState(0); // Rounding adjustment to nearest 5

  // --- Returns Logic State ---
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSearchId, setReturnSearchId] = useState('');
  const [foundSaleForReturn, setFoundSaleForReturn] = useState<SaleRecord | null>(null);
  const [returnConfig, setReturnConfig] = useState<Record<string, { qty: number, condition: ReturnCondition, reason: ReturnReason }>>({});

  // --- Shift Logic State ---
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [closingStep, setClosingStep] = useState(1);
  const [cashDenominations, setCashDenominations] = useState<Record<string, number>>({
    '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0
  });
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [countedCash, setCountedCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  // Find active shift
  const activeShift = shifts.find(s => s.cashierId === user?.id && s.status === 'Open');

  const [shiftStartTime, setShiftStartTime] = useState(activeShift?.startTime || new Date().toISOString());

  // Sync shift start time or auto-start
  useEffect(() => {
    if (activeShift) {
      setShiftStartTime(activeShift.startTime);
    } else if (user) {
      // Auto-start shift if none exists (ensure session continuity)
      startShift(user.id, 2000);
    }
  }, [activeShift, user]);


  // --- POS Receiving State (Enhanced for robust warehouse alignment) ---
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [receivedItems, setReceivedItems] = useState<Array<{ product: Product; qty: number; timestamp: string }>>([]);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [receivingMode, setReceivingMode] = useState<'TRANSFERS' | 'MANUAL'>('TRANSFERS');
  const [selectedTransferForReceiving, setSelectedTransferForReceiving] = useState<string | null>(null);
  const [transferReceivingItems, setTransferReceivingItems] = useState<Array<{
    productId: string;
    sku: string;
    name: string;
    expectedQty: number;
    receivedQty: number;
    condition: 'Good' | 'Damaged' | 'Short';
    notes: string;
  }>>([]);
  const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);

  // --- Prompt/Confirm Replacement State ---
  const [isHoldOrderModalOpen, setIsHoldOrderModalOpen] = useState(false);
  const [holdOrderNote, setHoldOrderNote] = useState('');

  const [isOverwriteCartModalOpen, setIsOverwriteCartModalOpen] = useState(false);
  const [pendingRecallOrderId, setPendingRecallOrderId] = useState<string | null>(null);

  const [isEmailReceiptModalOpen, setIsEmailReceiptModalOpen] = useState(false);
  const [emailReceiptAddress, setEmailReceiptAddress] = useState('');

  // --- Mobile/PDA View State ---
  const [showCart, setShowCart] = useState(false); // For mobile: toggle between products and cart
  const isNativeApp = native.isNative();

  // --- Customer State ---
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // --- Receipt Preview State ---
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [receiptPreviewHTML, setReceiptPreviewHTML] = useState('');

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused (except F-keys)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Allow F-keys even in inputs
        if (!e.key.startsWith('F')) return;
      }

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          addNotification('info', 'F1: Help | F2: Customer | F3: Search | F4: Discount | F9: Hold | F10: Drawer | F12: Pay');
          break;
        case 'F2':
          e.preventDefault();
          setIsCustomerModalOpen(true);
          break;
        case 'F3':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('input[placeholder*="Search products"]')?.focus();
          break;
        case 'F4':
          e.preventDefault();
          setIsDiscountModalOpen(true);
          break;
        case 'F9':
          e.preventDefault();
          handleHoldOrder();
          break;
        case 'F10':
          e.preventDefault();
          handleOpenDrawer();
          break;
        case 'F12':
          e.preventDefault();
          handleInitiatePayment();
          break;
        case 'Escape':
          e.preventDefault();
          setIsCustomerModalOpen(false);
          setIsPaymentModalOpen(false);
          setIsReceivingModalOpen(false);
          setIsDiscountModalOpen(false);
          setIsHoldOrderModalOpen(false);
          setIsRecallModalOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedPaymentMethod, amountTendered]); // Dependencies for handlers

  // Server-side Customer Search Effect
  useEffect(() => {
    if (!customerSearchTerm || customerSearchTerm.length < 3) {
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

  // --- Customer Handlers ---
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return customers;
    const term = customerSearchTerm.toLowerCase();

    const localMatches = customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );

    // Merge with server results
    if (serverCustomerResults.length > 0) {
      const combined = [...localMatches];
      serverCustomerResults.forEach(sc => {
        if (!combined.find(c => c.id === sc.id)) combined.push(sc);
      });
      return combined;
    }

    return localMatches;
  }, [customers, customerSearchTerm, serverCustomerResults]);

  // Get customer purchase history
  const getCustomerHistory = (customerId: string) => {
    return sales.filter(sale => sale.customerId === customerId);
  };

  const getCustomerStats = (customerId: string) => {
    const customerSales = getCustomerHistory(customerId);
    const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalVisits = customerSales.length;
    return { totalSpent, totalVisits };
  };

  // Unified Search & SKU Handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      // First check for exact SKU/Barcode match
      const exactMatch = products.find(p =>
        p.sku.toLowerCase() === searchTerm.toLowerCase() ||
        p.barcode?.toLowerCase() === searchTerm.toLowerCase()
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
        addNotification('success', `Added ${exactMatch.name}`);
        return;
      }

      // If no exact match but only one filtered result, add that
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchTerm('');
        addNotification('success', `Added ${filteredProducts[0].name}`);
      }
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(false);
    addNotification('success', `Customer set to: ${customer.name}`);
  };

  const navigate = useNavigate();

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Get current store bonus info
  const currentStorePoints = useMemo(() => {
    if (!activeSite?.id) return undefined;
    return getStorePoints(activeSite.id);
  }, [activeSite?.id, storePoints, getStorePoints]);

  const storeBonus = useMemo(() => {
    if (!currentStorePoints) return null;
    const tiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
    return calculateStoreBonus(currentStorePoints.monthlyPoints, tiers);
  }, [currentStorePoints, settings.posBonusTiers]);

  // Calculate user's personal bonus share
  const userBonusShare = useMemo(() => {
    if (!storeBonus || !user?.role) return null;
    const roleDistribution = settings.posRoleDistribution || DEFAULT_POS_ROLE_DISTRIBUTION;
    const roleConfig = roleDistribution.find(r =>
      r.role.toLowerCase() === user.role.toLowerCase()
    );
    if (!roleConfig) return null;
    return {
      percentage: roleConfig.percentage,
      amount: (storeBonus.bonus * roleConfig.percentage) / 100
    };
  }, [storeBonus, user?.role, settings.posRoleDistribution]);

  // Server-side Product Search Effect
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

  const filteredProducts = useMemo(() => {
    // Merge server results into local list for filtering
    let baseList = products;
    if (serverSearchResults.length > 0) {
      const combined = [...products];
      serverSearchResults.forEach(sp => {
        if (!combined.find(p => p.id === sp.id)) combined.push(sp);
      });
      baseList = combined;
    }

    return baseList.filter(p => {
      // Search by name, SKU, or barcode
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()); // Search by barcode
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const hasStock = p.stock > 0; // Only show products with available stock

      // Check if product has been received based on site type
      let hasBeenReceived = false;

      if (activeSite?.type === 'Warehouse' || activeSite?.type === 'Distribution Center') {
        // For warehouses: Product must have a location assigned (PUTAWAY completed)
        // Location format: A-01-05 (not just "Receiving Dock")
        hasBeenReceived = !!p.location &&
          p.location.trim() !== '' &&
          p.location !== 'Receiving Dock' &&
          /^[A-Z]-\d{2}-\d{2}$/.test(p.location.trim());
      } else if (activeSite?.type === 'Store' || activeSite?.type === 'Dark Store') {
        // For stores: Product must be at this store
        // RELAXED RULE: If it has stock assigned to this site, show it.
        // This supports seeded data and opening stock without requiring full transfer workflow.

        hasBeenReceived = (p.siteId === activeSite?.id || p.site_id === activeSite?.id);
      } else {
        // Fallback: require location for any other site type
        hasBeenReceived = !!p.location && p.location.trim() !== '';
      }

      return matchesSearch && matchesCategory && hasStock && hasBeenReceived;
    });
  }, [searchTerm, selectedCategory, products, activeSite, transfers, serverSearchResults]);

  // --- Cart Functions ---

  const addToCart = (product: Product) => {
    const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // STOCK CHECK: Prevent adding more than available
        if (existing.quantity >= product.stock) {
          addNotification('alert', `Cannot add more.Only ${product.stock} units in stock.`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, price: effectivePrice, quantity: 1 }];
    });
  };

  const addMiscItem = () => {
    if (!miscItem.price) return;
    const price = parseFloat(miscItem.price);
    const newItem: CartItem = {
      id: `MISC-${Date.now()}`,
      siteId: activeSite?.id || 'SITE-001',
      name: miscItem.name || 'Miscellaneous',
      price: price,
      quantity: 1,
      category: 'General',
      stock: 9999,
      sku: 'MISC',
      image: 'https://ui-avatars.com/api/?name=Misc+Item&background=random&color=fff',
      status: 'active'
    };
    setCart(prev => [...prev, newItem]);
    setIsMiscItemModalOpen(false);
    setMiscItem({ name: 'Misc Item', price: '' });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;

        // STOCK CHECK: Prevent incrementing beyond stock
        if (delta > 0 && newQty > item.stock) {
          addNotification('alert', `Stock limit reached! Only ${item.stock} available.`);
          return item;
        }

        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
    setAppliedDiscountCode(null);
    setAppliedDiscountCodeDetails(null);
    setDiscountCodeInput('');
    setDiscountCodeError('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Site-specific Tax Calculation (Supporting Compound Rules)
  const siteTaxRules = getTaxForSite(activeSite?.id);

  const taxResults = (() => {
    let runningTotalTax = 0;
    let currentBase = subtotal;
    const breakdown: { name: string; rate: number; amount: number; compound: boolean }[] = [];

    siteTaxRules.forEach((rule: any) => {
      const ruleTax = currentBase * (rule.rate / 100);
      runningTotalTax += ruleTax;
      breakdown.push({
        name: rule.name,
        rate: rule.rate,
        amount: ruleTax,
        compound: rule.compound
      });
      if (rule.compound) {
        currentBase += ruleTax;
      }
    });
    return { total: runningTotalTax, breakdown };
  })();

  const tax = taxResults.total;
  const taxBreakdown = taxResults.breakdown;

  // Ensure total doesn't go below zero due to discount
  const rawTotal = Math.max(0, subtotal + tax - cartDiscount);
  const total = rawTotal + roundingAdjustment; // Apply rounding adjustment

  const changeDue = amountTendered ? Math.max(0, parseFloat(amountTendered) - total) : 0;
  const isPaymentValid = selectedPaymentMethod === 'Cash'
    ? parseFloat(amountTendered || '0') >= total
    : true;

  // --- Feature Handlers (Hold/Recall/Discount) ---

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHoldOrderNote('');
    setIsHoldOrderModalOpen(true);
  };

  const handleConfirmHoldOrder = () => {
    const order: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      siteId: activeSite?.id || 'SITE-001',
      time: formatDateTime(new Date(), { showTime: true }),
      items: [...cart],
      note: holdOrderNote || 'No Note'
    };
    holdOrder(order); // Persist to Context
    clearCart();
    addNotification('success', "Order Placed on Hold.");
    setIsHoldOrderModalOpen(false);
  };

  const handleRecallOrder = (orderId: string) => {
    const order = heldOrders.find(o => o.id === orderId);
    if (order) {
      if (cart.length > 0) {
        setPendingRecallOrderId(orderId);
        setIsOverwriteCartModalOpen(true);
        return;
      }
      setCart(order.items);
      releaseHold(orderId); // Remove from Context
      setIsRecallModalOpen(false);
    }
  };

  const handleConfirmOverwriteCart = () => {
    if (!pendingRecallOrderId) return;
    const order = heldOrders.find(o => o.id === pendingRecallOrderId);
    if (order) {
      setCart(order.items);
      releaseHold(pendingRecallOrderId);
      setIsRecallModalOpen(false);
    }
    setIsOverwriteCartModalOpen(false);
    setPendingRecallOrderId(null);
  };

  // Apply discount from a valid code
  const applyDiscountFromCode = (discountCode: { id: string; code: string; name: string; type: 'PERCENTAGE' | 'FIXED'; value: number; maxDiscountAmount?: number }) => {
    let discountAmount = 0;
    if (discountCode.type === 'FIXED') {
      discountAmount = discountCode.value;
    } else {
      discountAmount = subtotal * (discountCode.value / 100);
      // Apply max discount cap if exists
      if (discountCode.maxDiscountAmount !== undefined && discountAmount > discountCode.maxDiscountAmount) {
        discountAmount = discountCode.maxDiscountAmount;
      }
    }

    setCartDiscount(discountAmount);
    setAppliedDiscountCode(discountCode.id);
    setAppliedDiscountCodeDetails({
      code: discountCode.code,
      name: discountCode.name,
      type: discountCode.type,
      value: discountCode.value
    });
    setIsDiscountModalOpen(false);
    setDiscountCodeInput('');
    setDiscountCodeError('');
    addNotification('success', `Discount code "${discountCode.code}" applied!`);
  };

  // Validate and apply discount code
  const handleValidateDiscountCode = () => {
    if (!discountCodeInput.trim()) {
      setDiscountCodeError('Please enter a discount code');
      return;
    }

    setIsValidatingCode(true);
    setDiscountCodeError('');

    // Simulate slight delay for UX
    setTimeout(() => {
      const result = validateDiscountCode(discountCodeInput, activeSite?.id, subtotal);

      if (result.valid && result.discountCode) {
        applyDiscountFromCode(result.discountCode);
        useDiscountCode(result.discountCode.id); // Increment usage count
      } else {
        setDiscountCodeError(result.error || 'Invalid discount code');
      }

      setIsValidatingCode(false);
    }, 300);
  };

  // Remove applied discount
  const handleRemoveDiscount = () => {
    setCartDiscount(0);
    setAppliedDiscountCode(null);
    setAppliedDiscountCodeDetails(null);
    setDiscountCodeInput('');
    setDiscountCodeError('');
    setIsDiscountModalOpen(false);
    addNotification('info', 'Discount removed');
  };

  // --- Payment Handlers ---

  const handleInitiatePayment = () => {
    if (cart.length === 0) {
      addNotification('info', "Cart is empty. Add items to proceed to payment.");
      return;
    }
    setAmountTendered('');
    setSelectedPaymentMethod('Cash');
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!isPaymentValid) return;

    setIsProcessing(true);

    try {
      const tendered = selectedPaymentMethod === 'Cash' ? parseFloat(amountTendered) : total;
      const change = selectedPaymentMethod === 'Cash' ? changeDue : 0;

      // Process sale and get points result
      const { saleId, pointsResult } = await processSale(
        cart,
        selectedPaymentMethod,
        user?.name || 'Cashier',
        tendered,
        change,
        selectedCustomer?.id,
        undefined, // pointsRedeemed
        'In-Store',
        taxBreakdown // Pass the local tax breakdown
      );

      const saleObj: SaleRecord = {
        id: saleId,
        siteId: activeSite?.id || 'SITE-001',
        date: formatDateTime(new Date(), { showTime: true }),
        subtotal,
        tax,
        taxBreakdown,
        total, // Total includes discount deduction
        method: selectedPaymentMethod,
        status: 'Completed',
        items: [...cart],
        amountTendered: tendered,
        change: change,
        cashierName: user?.name,
        customerId: selectedCustomer?.id || undefined
      };

      setLastSale(saleObj);

      // Handle Gamification Display
      if (pointsResult) {
        setEarnedPointsData(pointsResult);
        setShowPointsPopup(true);
      }

      setIsProcessing(false);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      clearCart();
      setSelectedCustomer(null); // Clear customer after sale

    } catch (e) {
      addNotification('alert', "Error processing sale");
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    // Determine which settings to use - Match ReceiptPreview defaults
    const {
      storeName = 'SIIFMART',
      posReceiptLogo,
      posReceiptShowLogo = true,
      posReceiptHeader = 'SIIFMART RETAIL',
      posReceiptFooter = 'Thank you for shopping with us!',
      posReceiptAddress,
      posReceiptPhone,
      posReceiptEmail,
      posReceiptTaxId,
      posReceiptPolicy,
      posReceiptSocialHandle,
      posReceiptEnableQR = true,
      posReceiptQRLink = 'https://siifmart.com/feedback',
      posReceiptWidth = '80mm',
      posReceiptFont = 'sans-serif'
    } = settings;

    const displayStoreName = storeName || activeSite?.name || 'SIIFMART';
    const is80mm = posReceiptWidth === '80mm';
    const paperWidth = is80mm ? '80mm' : '58mm';

    // Generate receipt HTML - Unified with SalesHistory.tsx
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${lastSale?.receiptNumber || 'TX'}</title>
        <style>
          @page { size: ${paperWidth} auto; margin: 0; }
          body { 
            font-family: ${posReceiptFont === 'monospace' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'system-ui, -apple-system, sans-serif'}; 
            width: ${paperWidth}; 
            margin: 0; 
            padding: 24px; /* p-6 */
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            font-size: 10px;
          }
          
          /* Utilities matching Tailwind */
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .gap-2 { gap: 8px; }
          .mb-1 { margin-bottom: 4px; }
          .mb-4 { margin-bottom: 16px; }
          .pb-4 { padding-bottom: 16px; }
          .py-3 { padding-top: 12px; padding-bottom: 12px; }
          .pt-2 { padding-top: 8px; }
          .mt-2 { margin-top: 8px; }
          .space-y-05 > * + * { margin-top: 2px; }
          .space-y-1 > * + * { margin-top: 4px; }
          .space-y-2 > * + * { margin-top: 8px; }
          
          /* Typography */
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .tracking-tighter { letter-spacing: -0.05em; }
          .tracking-widest { letter-spacing: 0.1em; }
          .italic { font-style: italic; }
          .leading-none { line-height: 1; }
          .leading-tight { line-height: 1.25; }
          
          /* Font Sizes */
          .text-[9px] { font-size: 9px; }
          .text-[10px] { font-size: 10px; }
          .text-xs { font-size: 12px; }
          .text-base { font-size: 16px; }
          .text-xl { font-size: 20px; }
          
          /* Opacity */
          .opacity-60 { opacity: 0.6; }
          .opacity-70 { opacity: 0.7; }
          .opacity-80 { opacity: 0.8; }
          
          /* Borders */
          .border-b-2-dashed { border-bottom: 2px dashed rgba(0,0,0,0.1); }
          .border-y { border-top: 1px solid rgba(0,0,0,0.1); border-bottom: 1px solid rgba(0,0,0,0.1); }
          .border-t-black { border-top: 1px solid #000; }
          .border-t-dashed { border-top: 1px dashed rgba(0,0,0,0.1); }
          
          /* Images */
          .logo { max-height: 48px; object-fit: contain; margin: 0 auto; filter: grayscale(1); display: block; }
        </style>
      </head>
      <body>
        
          ${posReceiptShowLogo && posReceiptLogo ? `
            <div class="flex justify-center mb-4">
              <img src="${posReceiptLogo}" class="logo" />
            </div>
          ` : ''}
          
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
            ${cart.map(item => `
              <div class="flex justify-between text-[10px]">
                <div>
                  <div class="font-bold">${item.name}</div>
                  <div class="text-[9px] opacity-60">${item.quantity} x ${CURRENCY_SYMBOL}${item.price.toFixed(2)}</div>
                </div>
                <div class="font-bold">${(item.price * item.quantity).toLocaleString()}</div>
              </div>
            `).join('')}
          </div>

          <div class="space-y-1 text-right mb-4">
            <div class="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>${CURRENCY_SYMBOL}${subtotal.toLocaleString()}</span></div>
            ${cartDiscount > 0 ? `<div class="flex justify-between text-[10px] opacity-60"><span>DISCOUNT${appliedDiscountCodeDetails ? ` (${appliedDiscountCodeDetails.code})` : ''}</span> <span>-${CURRENCY_SYMBOL}${cartDiscount.toLocaleString()}</span></div>` : ''}
            
            ${taxBreakdown.map(rule => `
              <div class="flex justify-between text-[10px] opacity-60">
                <span>${rule.name} (${rule.rate}%)</span>
                <span>${CURRENCY_SYMBOL}${rule.amount.toLocaleString()}</span>
              </div>
            `).join('')}

            <div class="flex justify-between font-black text-base border-t-black pt-2 mt-2"><span>TOTAL</span> <span>${CURRENCY_SYMBOL}${total.toLocaleString()}</span></div>
          </div>

          <div class="text-[10px] font-bold border-t-dashed pt-4 mb-4">
            <div class="flex justify-between">
              <span>PAID (${selectedPaymentMethod.toUpperCase()})</span>
              <span>${CURRENCY_SYMBOL}${total.toLocaleString()}</span>
            </div>
          </div>

          <div class="text-center space-y-1 pt-4 border-t-dashed">
            <p class="text-xs font-bold leading-tight mb-2">${posReceiptFooter}</p>
            ${posReceiptSocialHandle ? `<p class="text-[10px] opacity-70 font-medium">${posReceiptSocialHandle}</p>` : ''}
            ${posReceiptPolicy ? `<p class="text-[9px] italic opacity-60 leading-tight">${posReceiptPolicy}</p>` : ''}

            ${posReceiptEnableQR ? `
              <div class="flex justify-center mt-4">
                 <img src="https://chart.googleapis.com/chart?cht=qr&chs=100x100&chl=${encodeURIComponent(posReceiptQRLink)}" style="width: 64px; height: 64px;" />
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    // Show preview first
    setReceiptPreviewHTML(receiptHTML);
    setIsReceiptPreviewOpen(true);
  };

  const handleConfirmPrint = () => {
    // Use a named window 'ReceiptPrinterWindow' so the browser remembers the printer selection for this specific window name
    const printWindow = window.open('', 'ReceiptPrinterWindow', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(receiptPreviewHTML);
      printWindow.document.close();

      // Robust printing: wait for images to load
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        // Optional: close after print? Better to leave open or manual close for debugging, 
        // but standard POS behavior is often fire-and-forget. 
        // Note: print() blocks execution in many browsers until dialog closes.
      };

      // Fallback if onload doesn't fire (e.g. cached images or fast load)
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.focus();
          printWindow.print();
        }
      }, 500);
    }
    setIsReceiptPreviewOpen(false);
    addNotification('success', 'Receipt sent to printer');
  };

  const handleEmailReceipt = () => {
    setEmailReceiptAddress('');
    setIsEmailReceiptModalOpen(true);
  };

  const handleConfirmEmailReceipt = () => {
    if (emailReceiptAddress) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        addNotification('success', `Digital Receipt for ${lastSale?.receiptNumber || lastSale?.id} sent to ${emailReceiptAddress} `);
        setIsEmailReceiptModalOpen(false);
      }, 1000);
    }
  };

  // --- Terminal Button Handlers ---

  const handleOpenDrawer = () => {
    addNotification('info', "SYSTEM: Trigger sent to Cash Drawer (COM3) [KICK_DRAWER]");
  };

  const handleReprintLast = () => {
    if (lastSale) {
      setIsReceiptModalOpen(true);
    } else if (sales.length > 0) {
      setLastSale(sales[0]);
      setIsReceiptModalOpen(true);
    } else {
      addNotification('info', "No recent transactions found in this session to reprint.");
    }
  };

  // --- POS Receiving Handlers ---
  const handleScanProduct = async (barcode: string) => {
    // Find product by SKU, barcode field, or ID
    const product = products.find(p =>
      p.sku.toLowerCase() === barcode.toLowerCase() ||
      p.barcode?.toLowerCase() === barcode.toLowerCase() || // Search by external barcode
      p.id === barcode ||
      p.name.toLowerCase().includes(barcode.toLowerCase())
    );

    if (!product) {
      addNotification('alert', `Product not found: ${barcode}`);
      return;
    }

    // Check if product is at this site
    const isAtThisSite = product.siteId === activeSite?.id || product.site_id === activeSite?.id;
    if (!isAtThisSite) {
      addNotification('alert', `Product ${product.name} is not at this location`);
      return;
    }

    // Check if product has already been POS-received
    const alreadyPosReceived = product.posReceivedAt || product.pos_received_at;
    if (alreadyPosReceived) {
      addNotification('info', `${product.name} has already been received and is available for sale.`);
      return;
    }

    // Check if product is from a completed/delivered transfer (location should be STORE-RECEIVED or Receiving Dock)
    const isFromTransfer = product.location === 'STORE-RECEIVED' ||
      product.location === 'Receiving Dock' ||
      product.location?.toLowerCase().includes('receiv');
    if (!isFromTransfer) {
      addNotification('alert', `${product.name} has not arrived at the store yet. Check transfer status.`);
      return;
    }

    // Check if already received in this session
    const alreadyReceived = receivedItems.some(item => item.product.id === product.id);
    if (alreadyReceived) {
      // Update quantity
      setReceivedItems(prev => prev.map(item =>
        item.product.id === product.id
          ? { ...item, qty: item.qty + 1, timestamp: new Date().toISOString() }
          : item
      ));
      addNotification('success', `Updated quantity for ${product.name}`);
    } else {
      // Add new item
      setReceivedItems(prev => [...prev, {
        product,
        qty: 1,
        timestamp: new Date().toISOString()
      }]);
      addNotification('success', `Added ${product.name} to received items`);
    }
  };

  const handleConfirmReceiving = async () => {
    if (receivedItems.length === 0) {
      addNotification('alert', 'No items to confirm');
      return;
    }

    try {
      // Update each product with posReceivedAt timestamp and who received it
      for (const item of receivedItems) {
        await updateProduct({
          ...item.product,
          posReceivedAt: new Date().toISOString(),
          pos_received_at: new Date().toISOString(),
          posReceivedBy: user?.name || 'POS User',
          pos_received_by: user?.name || 'POS User'
        }, user?.name || 'POS User');
      }

      addNotification('success', `Confirmed ${receivedItems.length} item(s) as received. They are now available for sale.`);
    } catch (error) {
      console.error('Error confirming receiving:', error);
      addNotification('alert', 'Failed to confirm receiving. Please try again.');
    }
  };

  // Enhanced Transfer-Based Receiving Handler (aligned with Warehouse Operations)
  const handleSelectTransferForReceiving = (transferId: string) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    setSelectedTransferForReceiving(transferId);

    // Initialize receiving items from transfer's line items
    const items = transfer.items.map(item => {
      const product = products.find(p => p.sku === item.sku || p.id === item.productId);
      return {
        productId: item.productId,
        sku: item.sku,
        name: product?.name || item.name || 'Unknown Product',
        expectedQty: item.quantity,
        receivedQty: item.quantity, // Default to expected
        condition: 'Good' as const,
        notes: ''
      };
    });

    setTransferReceivingItems(items);
  };

  const handleUpdateTransferItem = (index: number, field: string, value: any) => {
    setTransferReceivingItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleConfirmTransferReceiving = async () => {
    if (!selectedTransferForReceiving || transferReceivingItems.length === 0) {
      addNotification('alert', 'No transfer selected');
      return;
    }

    setIsConfirmingReceive(true);

    try {
      const transfer = transfers.find(t => t.id === selectedTransferForReceiving);
      if (!transfer) throw new Error('Transfer not found');

      // Check for discrepancies
      const discrepancies = transferReceivingItems.filter(
        item => item.receivedQty !== item.expectedQty || item.condition !== 'Good'
      );

      // Update each product with POS receiving timestamp
      for (const item of transferReceivingItems) {
        const product = products.find(p => p.sku === item.sku || p.id === item.productId);
        if (product) {
          await updateProduct({
            ...product,
            posReceivedAt: new Date().toISOString(),
            pos_received_at: new Date().toISOString(),
            posReceivedBy: user?.name || 'POS User',
            pos_received_by: user?.name || 'POS User',
            // If damaged, flag for review
            needsReview: item.condition === 'Damaged',
            receivingNotes: item.notes || undefined
          }, user?.name || 'POS User');
        }
      }

      // Update transfer status to 'Received' if not already
      if (transfer.transferStatus !== 'Received') {
        // Note: This would typically call wmsJobsService.update
        // For now, we'll use refreshData after the notification
      }

      // Show appropriate notification
      if (discrepancies.length > 0) {
        const damagedCount = discrepancies.filter(d => d.condition === 'Damaged').length;
        const shortCount = discrepancies.filter(d => d.receivedQty < d.expectedQty).length;

        let message = `Received ${transferReceivingItems.length} items with discrepancies:\n`;
        if (damagedCount > 0) message += `⚠️ ${damagedCount} damaged item(s)\n`;
        if (shortCount > 0) message += `📉 ${shortCount} short shipment(s)`;

        addNotification('alert', message);
      } else {
        addNotification('success', `✅ Successfully received ${transferReceivingItems.length} item(s) from transfer. Items are now available for sale!`);
      }

      // Reset state
      setSelectedTransferForReceiving(null);
      setTransferReceivingItems([]);
      setIsReceivingModalOpen(false);

      // Refresh data to update transfer status
      await refreshData();

    } catch (error) {
      console.error('Error confirming transfer receiving:', error);
      addNotification('alert', 'Failed to confirm receiving. Please try again.');
    } finally {
      setIsConfirmingReceive(false);
    }
  };

  const handleCloseShift = () => {
    setCountedCash('');
    setShiftNotes('');
    setClosingStep(1);
    setCashDenominations({ '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0 });
    setDiscrepancyReason('');
    setIsShiftModalOpen(true);
  };

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

  const handleSubmitShift = async () => {
    if (!activeShift) return;
    setIsProcessing(true);

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
        discrepancyReason: discrepancyReason || shiftNotes,
        status: 'Closed'
      };

      await closeShift(record);
      setIsProcessing(false);
      setIsShiftModalOpen(false);
      addNotification('success', "Shift Closed Successfully. Z-Report Saved.");
      logout();
      navigate('/');
    } catch (error) {
      console.error('Shift closure error:', error);
      addNotification('alert', 'Failed to close shift. Please try again.');
      setIsProcessing(false);
    }
  };

  // --- Returns Handlers ---

  const handleSearchForReturn = () => {
    const sale = sales.find(s => s.id === returnSearchId || s.receiptNumber === returnSearchId || s.id === `TX-${returnSearchId}`);
    if (sale) {
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
  };

  const updateReturnConfig = (itemId: string, field: string, value: any) => {
    setReturnConfig(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleProcessReturn = async () => {
    if (!foundSaleForReturn) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const returnItems: ReturnItem[] = [];
    let refundTotal = 0;

    foundSaleForReturn.items.forEach(item => {
      const config = returnConfig[item.id];
      if (config && config.qty > 0) {
        const refundAmount = item.price * config.qty;
        refundTotal += refundAmount;
        returnItems.push({
          productId: item.id,
          quantity: config.qty,
          reason: config.reason,
          condition: config.condition,
          refundAmount: refundAmount
        });
      }
    });

    if (returnItems.length > 0) {
      await processReturn(foundSaleForReturn.id, returnItems, refundTotal, user?.name || 'System');

      const restockItems = returnItems.filter(i => i.condition === 'Resalable');
      const writeOffItems = returnItems.filter(i => i.condition === 'Damaged');

      let msg = `Refund Processed: ${CURRENCY_SYMBOL} ${refundTotal.toLocaleString()} `;
      if (restockItems.length > 0) msg += `\n\n✅ Restocked ${restockItems.reduce((s, i) => s + i.quantity, 0)} items to inventory.`;
      if (writeOffItems.length > 0) msg += `\n⚠️ Written off ${writeOffItems.reduce((s, i) => s + i.quantity, 0)} items(Damaged).`;

      addNotification('success', msg);
    }

    setIsProcessing(false);
    setIsReturnModalOpen(false);
    setFoundSaleForReturn(null);
    setReturnSearchId('');
    setReturnConfig({});
  };

  const totalRefundAmount = foundSaleForReturn?.items.reduce((sum, item) => {
    const config = returnConfig[item.id];
    return sum + (config?.qty || 0) * item.price;
  }, 0) || 0;

  const openingFloat = 2000; // Mock
  const shiftCashSales = sales
    .filter(s => s.method === 'Cash' && s.status === 'Completed')
    .reduce((acc, s) => acc + s.total, 0);
  const expectedCash = openingFloat + shiftCashSales;
  const cashVariance = countedCash ? parseFloat(countedCash) - expectedCash : 0;

  // 🔒 STORE SELECTION REQUIRED FOR ADMIN USERS (CEO must select a store)
  const activeSiteType = activeSite?.type || 'Administrative';
  const isMultiSiteRole = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'auditor';
  const needsStoreSelection = isMultiSiteRole && (activeSiteType === 'Administrative' || activeSiteType === 'Headquarters' || activeSiteType === 'HQ' || activeSiteType === 'Administration');

  if (needsStoreSelection) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8 bg-cyber-gray border border-white/10 rounded-2xl max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <MapPin size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Select a Store</h2>
          <p className="text-gray-400 mb-6">
            To access POS, please select a specific store from the dropdown in the top bar.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {sites.filter(s => s.type === 'Store' || s.type === 'Dark Store').slice(0, 5).map(site => (
              <span key={site.id} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">
                {site.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 relative animate-in fade-in duration-700">
        {/* Left: Product Grid - Always visible, with bottom padding for mobile bar */}
        <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden pb-20 lg:pb-0 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="p-4 border-b border-white/5 space-y-4">
            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/')}
                icon={<ArrowLeft size={20} />}
                title={t('pos.exitDashboard')}
                aria-label="Exit to Dashboard"
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-400 hover:text-white transition-colors"
              />
              <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-cyber-primary/50 focus-within:bg-white/10 transition-all duration-300 group">
                <Search className="w-5 h-5 text-gray-500 group-focus-within:text-cyber-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search products or scan SKU..."
                  className="bg-transparent border-none ml-3 flex-1 text-white outline-none placeholder-gray-500 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                />
              </div>
              <Protected permission="ADD_PRODUCT">
                <Button
                  variant="secondary"
                  onClick={() => setIsMiscItemModalOpen(true)}
                  icon={<ShoppingBag size={16} />}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  {t('pos.miscItem')}
                </Button>
              </Protected>
              <div className="hidden md:block">
              </div>

              {/* Store Bonus Widget */}
              {settings.posBonusEnabled !== false && currentStorePoints && storeBonus && (
                <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl px-3 py-1.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${storeBonus.tier.tierColor === 'gray' ? 'from-gray-400 to-gray-500' :
                    storeBonus.tier.tierColor === 'amber' ? 'from-amber-500 to-amber-600' :
                      storeBonus.tier.tierColor === 'yellow' ? 'from-yellow-400 to-yellow-500' :
                        storeBonus.tier.tierColor === 'cyan' ? 'from-cyan-400 to-cyan-500' :
                          storeBonus.tier.tierColor === 'purple' ? 'from-purple-400 to-purple-600' :
                            'from-gray-400 to-gray-500'
                    } flex items-center justify-center`}>
                    <Trophy size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1">
                      Team Bonus
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r ${storeBonus.tier.tierColor === 'gray' ? 'from-gray-400 to-gray-500' :
                        storeBonus.tier.tierColor === 'amber' ? 'from-amber-500 to-amber-600' :
                          storeBonus.tier.tierColor === 'yellow' ? 'from-yellow-400 to-yellow-500' :
                            storeBonus.tier.tierColor === 'cyan' ? 'from-cyan-400 to-cyan-500' :
                              storeBonus.tier.tierColor === 'purple' ? 'from-purple-400 to-purple-600' :
                                'from-gray-400 to-gray-500'
                        } text-white`}>
                        {storeBonus.tier.tierName}
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-400">{currentStorePoints.monthlyPoints.toLocaleString()} pts</p>
                  </div>
                  {userBonusShare && (
                    <div className="text-right pl-2 border-l border-green-500/30">
                      <p className="text-xs text-green-400 font-bold">
                        {formatCompactNumber(userBonusShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                      </p>
                      <p className="text-[10px] text-gray-500">your share</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Unused Quick SKU section removed */}

            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide px-2 -mx-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-300 relative group overflow-hidden ${selectedCategory === cat
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300 bg-white/5 border border-white/5'
                    }`}
                >
                  {selectedCategory === cat && (
                    <>
                      <div className="absolute inset-0 bg-cyber-primary opacity-20" />
                      <div className="absolute inset-0 border border-cyber-primary/40 rounded-2xl" />
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyber-primary rounded-full blur-[2px]" />
                    </>
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Box size={64} className="text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t('pos.noProductsAvailable')}</h3>
                <p className="text-gray-400 max-w-md">
                  {t('pos.productsWillAppear')}
                  <br />
                  <button
                    onClick={() => navigate('/pos-dashboard')}
                    className="text-cyber-primary hover:underline mt-2 font-medium"
                  >
                    {t('pos.goToPOSCommand')}
                  </button>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addToCart(product);
                      if (isNativeApp) {
                        native.vibrate(50); // Haptic feedback on add
                      }
                    }}
                    disabled={product.stock === 0}
                    className={`text-left bg-white/5 border border-white/10 rounded-[2.5rem] p-4 hover:border-cyber-primary/50 hover:bg-white/[0.08] hover:shadow-[0_20px_40px_rgba(0,255,157,0.1)] transition-all duration-500 group relative overflow-hidden flex flex-col h-full active:scale-[0.98] ${product.stock === 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                  >
                    <div className="aspect-square rounded-[1.8rem] bg-black/40 mb-4 overflow-hidden relative shadow-inner">
                      {product.image && !product.image.includes('placeholder.com') ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full bg-gradient-to-br from-cyber-primary/20 via-black/20 to-cyber-accent/20 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-white/10"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyber-primary/20 via-black/20 to-cyber-accent/20 flex items-center justify-center">
                          <Package size={40} className="text-white/10 group-hover:text-cyber-primary/20 transition-colors" />
                        </div>
                      )}

                      {/* Floating Indicators */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-md border border-white/10 ${product.stock < 10 ? 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-black/50'}`}>
                        {product.stock} {t('pos.left')}
                      </div>

                      {product.isOnSale && (
                        <div className="absolute top-3 left-3 bg-cyber-primary/90 px-2 py-1 rounded-full text-[8px] font-black text-black uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(0,255,157,0.5)]">
                          {t('pos.sale')}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col px-1">
                      <p className="text-[10px] text-cyber-primary/60 font-black uppercase tracking-widest mb-1">{product.category}</p>
                      <h3 className="font-bold text-white text-xs md:text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-cyber-primary transition-colors">{product.name}</h3>
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5 mt-3">
                        <div className="flex items-baseline gap-1.5">
                          {product.isOnSale && product.salePrice ? (
                            <>
                              <p className="text-cyber-primary font-black text-xl tracking-tighter">{CURRENCY_SYMBOL} {product.salePrice}</p>
                              <p className="text-gray-500 text-[10px] line-through font-medium opacity-50">{CURRENCY_SYMBOL} {product.price}</p>
                            </>
                          ) : (
                            <p className="text-white group-hover:text-cyber-primary font-black text-xl tracking-tighter transition-colors">{CURRENCY_SYMBOL} {product.price}</p>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-cyber-primary/20 group-hover:border-cyber-primary/40 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <Plus size={16} className="text-cyber-primary" />
                        </div>
                      </div>
                      <p className="text-[8px] text-gray-600 font-mono mt-2 tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">REF: {product.sku}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>



        {/* Right: Cart Summary - Desktop: Side Panel, Mobile: Slide-up Bottom Sheet */}
        <div className={`
        fixed inset-0 z-50 bg-black/60 backdrop-blur-3xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        lg:static lg:w-[400px] lg:bg-black/40 lg:border lg:border-white/10 lg:rounded-[2.5rem] lg:h-full lg:z-auto lg:transform-none lg:shadow-2xl
        ${showCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
      `}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            {showCart && (
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors lg:hidden flex items-center gap-2"
                aria-label="Back to Products"
              >
                <ArrowLeft size={20} />
                <span className="font-bold text-white">Back to Products</span>
              </button>
            )}
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-2xl transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyber-primary/10 border border-cyber-primary/20 flex items-center justify-center text-cyber-primary group-hover:scale-110 group-hover:bg-cyber-primary/20 transition-all">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-0.5">Terminal Selection</p>
                <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-cyber-primary transition-colors">{selectedCustomer ? selectedCustomer.name : t('pos.walkInCustomer')}</p>
              </div>
            </button>
            <div className="flex gap-1">
              {/* Actions moved to Functions Grid below */}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                <CreditCard size={48} className="mb-4" />
                <p>{t('pos.cartEmpty')}</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="group relative bg-white/[0.03] hover:bg-white/[0.08] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-xs font-bold group-hover:text-cyber-primary transition-colors leading-tight truncate">{item.name}</h4>
                      <p className="text-cyber-primary font-black text-[10px]">
                        {CURRENCY_SYMBOL}{item.price} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                          title="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-white font-black text-[10px] w-5 text-center tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                          title="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-white font-black text-xs tracking-tighter w-16 text-right">
                        {CURRENCY_SYMBOL}{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-black/40 backdrop-blur-3xl border-t border-white/10 rounded-b-[2.5rem] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-cyber-primary/5 to-transparent pointer-events-none" />
            <div className="space-y-3 mb-4 relative z-10">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Subtotal</span>
                <span className="font-bold tabular-nums">{CURRENCY_SYMBOL} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('pos.discount')}</span>
                  {appliedDiscountCodeDetails && (
                    <div className="bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">
                      {appliedDiscountCodeDetails.code}
                    </div>
                  )}
                  <Protected permission="APPLY_DISCOUNT">
                    <button onClick={() => setIsDiscountModalOpen(true)} className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded-lg hover:bg-white/10 transition-all flex items-center gap-1.5 font-bold text-gray-300">
                      <Tag size={10} className="text-cyber-primary" /> {appliedDiscountCodeDetails ? 'CHANGE' : 'ADD CODE'}
                    </button>
                  </Protected>
                </div>
                <span className={cartDiscount > 0 ? "text-cyber-primary font-black tabular-nums" : "text-gray-600 tabular-nums"}>
                  {cartDiscount > 0 ? `- ${CURRENCY_SYMBOL} ${cartDiscount.toLocaleString()}` : `${CURRENCY_SYMBOL} 0`}
                </span>
              </div>

              {/* Tax Breakdown */}
              <div className="space-y-1">
                {taxBreakdown.map((rule, idx) => (
                  <div key={idx} className="flex justify-between items-center text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1">
                      {rule.name} ({rule.rate}%)
                      {rule.compound && <span className="text-purple-400 text-[8px]">+</span>}
                    </span>
                    <span className="font-bold tabular-nums text-sm">{CURRENCY_SYMBOL} {rule.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
                {taxBreakdown.length > 1 && (
                  <div className="flex justify-between items-center text-gray-500 pt-1 border-t border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Total Tax</span>
                    <span className="font-bold tabular-nums text-sm text-white">{CURRENCY_SYMBOL} {tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              {/* Cash Rounding */}
              <div className="flex justify-between items-center text-gray-400 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">Round to 5</span>
                  <button
                    title="Toggle cash rounding to nearest 5"
                    onClick={() => {
                      if (roundingAdjustment > 0) {
                        setRoundingAdjustment(0);
                      } else {
                        const rounded = Math.ceil(rawTotal / 5) * 5;
                        setRoundingAdjustment(rounded - rawTotal);
                      }
                    }}
                    className={`w-10 h-5 rounded-full transition-all relative ${roundingAdjustment > 0 ? 'bg-amber-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${roundingAdjustment > 0 ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
                <span className={roundingAdjustment > 0 ? "text-amber-400 font-bold tabular-nums" : "text-gray-600 tabular-nums"}>
                  {roundingAdjustment > 0 ? `+ ${CURRENCY_SYMBOL} ${roundingAdjustment.toFixed(2)}` : `${CURRENCY_SYMBOL} 0`}
                </span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-4">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-white/50">{t('common.total')}</span>
                <span className="text-3xl font-black text-cyber-primary tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(0,255,157,0.3)]">{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Command Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6 relative z-10">
              <button
                onClick={() => setIsRecallModalOpen(true)}
                disabled={heldOrders.length === 0}
                className="group relative flex flex-col items-center justify-center p-2.5 bg-yellow-400/5 hover:bg-yellow-400/10 rounded-2xl border border-yellow-400/10 transition-all active:scale-95 disabled:opacity-20"
              >
                <div className="relative mb-1 group-hover:scale-110 transition-transform">
                  <PlayCircle size={14} className="text-yellow-400" />
                  {heldOrders.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[6px] w-3 h-3 rounded-full flex items-center justify-center animate-pulse">
                      {heldOrders.length}
                    </span>
                  )}
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-yellow-400/60 group-hover:text-yellow-400">RECALL</span>
              </button>

              <button
                onClick={handleHoldOrder}
                className="group relative flex flex-col items-center justify-center p-2.5 bg-blue-400/5 hover:bg-blue-400/10 rounded-2xl border border-blue-400/10 transition-all active:scale-95"
              >
                <PauseCircle size={14} className="text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-400/60 group-hover:text-blue-400">HOLD</span>
              </button>

              <Protected permission="VOID_SALE">
                <button
                  onClick={clearCart}
                  className="group relative flex flex-col items-center justify-center p-2.5 bg-red-400/5 hover:bg-red-400/10 rounded-2xl border border-red-400/10 transition-all active:scale-95"
                >
                  <Trash2 size={14} className="text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-red-400/60 group-hover:text-red-400">CLEAR</span>
                </button>
              </Protected>

              <Protected permission="REFUND_SALE">
                <button
                  onClick={() => setIsReturnModalOpen(true)}
                  className="group relative flex flex-col items-center justify-center p-2.5 bg-white/[0.03] hover:bg-red-500/[0.05] rounded-2xl border border-white/5 hover:border-red-500/20 transition-all duration-300 active:scale-[0.97]"
                >
                  <RotateCcw size={14} className="text-red-400/60 group-hover:text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-red-400 transition-colors uppercase">RETURNS</span>
                </button>
              </Protected>

              <button
                onClick={handleOpenDrawer}
                className="group relative flex flex-col items-center justify-center p-2.5 bg-white/[0.03] hover:bg-cyan-500/[0.05] rounded-2xl border border-white/5 hover:border-cyan-500/20 transition-all duration-300 active:scale-[0.97]"
              >
                <Box size={14} className="text-cyan-400/60 group-hover:text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-cyan-400 transition-colors uppercase">DRAWER</span>
              </button>

              <button
                onClick={handleCloseShift}
                className="group relative flex flex-col items-center justify-center p-2.5 bg-white/[0.03] hover:bg-amber-500/[0.05] rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all duration-300 active:scale-[0.97]"
              >
                <Lock size={14} className="text-amber-400/60 group-hover:text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-amber-400 transition-colors uppercase">SHIFT</span>
              </button>

              <button
                onClick={handleReprintLast}
                className="group relative flex flex-col items-center justify-center p-2.5 bg-white/[0.03] hover:bg-purple-500/[0.05] rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all duration-300 active:scale-[0.97]"
              >
                <Printer size={14} className="text-purple-400/60 group-hover:text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-purple-400 transition-colors uppercase">REPRINT</span>
              </button>

              <div className="bg-white/[0.01] rounded-2xl border border-white/[0.02] flex items-center justify-center">
                <Settings size={12} className="text-white/5" />
              </div>
            </div>

            <button
              onClick={handleInitiatePayment}
              disabled={cart.length === 0}
              className="w-full py-5 bg-cyber-primary hover:bg-cyber-primary/90 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed rounded-[1.5rem] flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-cyber-primary/20 active:scale-[0.98] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <CreditCard size={20} className="relative z-10 text-black" />
              <span className="relative z-10 text-black font-black uppercase tracking-[0.3em] text-sm">{t('pos.initializePayment')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Checkout Bar - Visible when cart is closed */}
      {
        !showCart && cart.length > 0 && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-cyber-primary text-black p-4 rounded-2xl shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center justify-between font-bold active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="bg-black/20 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <span className="text-sm uppercase tracking-wider">{t('pos.viewOrder')}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <span>{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
                <ArrowRight size={20} />
              </div>
            </button>
          </div>
        )
      }


      {/* ... Modals unchanged from previous, keeping structure ... */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={t('pos.processPayment')}
        size="lg"
      >
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center p-8 bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-cyber-primary/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <p className="text-cyber-primary/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t('pos.totalAmountDue')}</p>
            <p className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{CURRENCY_SYMBOL} {total.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'Cash', icon: <Banknote size={24} />, label: 'CASH' },
              { id: 'Card', icon: <CreditCard size={24} />, label: 'CARD' },
              { id: 'Mobile Money', icon: <Smartphone size={24} />, label: 'MOBILE' }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id as PaymentMethod)}
                className={`p-6 rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] ${selectedPaymentMethod === method.id
                  ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary shadow-[0_0_20px_rgba(0,255,157,0.2)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/[0.08]'
                  }`}
              >
                <div className={`transition-transform duration-300 group-hover:scale-110 ${selectedPaymentMethod === method.id ? 'text-cyber-primary' : 'text-gray-500'}`}>
                  {method.icon}
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase">{method.label}</span>
              </button>
            ))}
          </div>

          {selectedPaymentMethod === 'Cash' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('pos.amountTendered')}</label>
                <input
                  type="number"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white text-xl outline-none focus:border-cyber-primary transition-colors font-mono"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {[100, 500, 1000, total].map((amt, i) => (
                  <button
                    key={i}
                    onClick={() => setAmountTendered(Math.ceil(amt).toString())}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-sm font-mono text-gray-300 whitespace-nowrap"
                  >
                    {amt === total ? 'Exact' : `${CURRENCY_SYMBOL} ${amt}`}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <span className="text-gray-400">Change Due:</span>
                <span className={`font-mono text-xl font-bold ${changeDue < 0 ? 'text-red-400' : 'text-cyber-primary'}`}>
                  {CURRENCY_SYMBOL} {changeDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {selectedPaymentMethod !== 'Cash' && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <RefreshCcw className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-400 text-sm font-bold">Waiting for Terminal...</p>
                <p className="text-gray-400 text-xs mt-1">Ask customer to tap card or scan QR code.</p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 relative z-10">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-[1.5rem] font-bold transition-all active:scale-95 border border-white/5"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={!isPaymentValid || isProcessing}
              className="flex-[2] py-4 px-6 bg-cyber-primary hover:bg-cyber-primary/90 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed text-black font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 shadow-xl shadow-cyber-primary/20 active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <Check size={20} className="relative z-10" />
              )}
              <span className="relative z-10">{t('pos.completeSale')}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* --- RECEIPT MODAL --- */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Payment Success"
        size="md"
      >
        <div className="flex flex-col items-center py-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyber-primary/10 via-transparent to-transparent pointer-events-none" />

          <div className="w-24 h-24 rounded-full bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary flex items-center justify-center mb-8 relative group">
            <div className="absolute inset-0 rounded-full bg-cyber-primary/20 animate-ping opacity-20" />
            <div className="absolute inset-0 rounded-full bg-cyber-primary/40 blur-xl opacity-20" />
            <CheckCircle size={40} className="relative z-10 animate-in zoom-in duration-500 delay-200" />
          </div>

          <h3 className="text-3xl font-black text-white tracking-tighter mb-2">{t('pos.paymentSuccess')}</h3>
          <p className="text-gray-500 text-sm font-medium mb-10 uppercase tracking-[0.2em]">{t('pos.transactionVerified')}</p>

          <div className="w-full space-y-4 mb-10 px-6">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('pos.totalPaid')}</span>
              <span className="text-xl font-black text-cyber-primary tabular-nums">{CURRENCY_SYMBOL} {(lastSale?.total || 0).toLocaleString()}</span>
            </div>
            {lastSale && lastSale.method === 'Cash' && (
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('pos.changeDue')}</span>
                <span className="text-xl font-black text-white tabular-nums">{CURRENCY_SYMBOL} {lastSale.change?.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="w-full grid grid-cols-2 gap-4 px-6">
            <button
              onClick={() => {
                handlePrintReceipt();
                setIsReceiptModalOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-[2.5rem] border border-white/10 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyber-primary/10 flex items-center justify-center text-cyber-primary group-hover:bg-cyber-primary/20 transition-all">
                <Printer size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{t('pos.printReceipt')}</span>
            </button>
            <button
              onClick={handleEmailReceipt}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-[2.5rem] border border-white/10 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all">
                <Mail size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{t('pos.digitalCopy')}</span>
            </button>
          </div>

          <button
            onClick={() => setIsReceiptModalOpen(false)}
            className="mt-10 p-4 w-full bg-cyber-primary text-black font-black uppercase tracking-[0.3em] text-xs rounded-[1.5rem] hover:bg-cyber-primary/90 transition-all active:scale-[0.98]"
          >
            {t('pos.newOrder')}
          </button>
        </div>
      </Modal>

      {/* --- RETURNS MODAL --- */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Returns Manager"
        size="lg"
      >
        {/* ... Return Logic ... */}
        <div className="space-y-6">
          {!foundSaleForReturn ? (
            <div className="bg-black/20 border border-white/5 rounded-xl p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                <RotateCcw size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Find Transaction</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">Scan the barcode on the customer's receipt or enter the Transaction ID manually.</p>

              <div className="flex max-w-md mx-auto gap-2 mt-4">
                <input
                  type="text"
                  placeholder="e.g. TX-9981"
                  className="flex-1 bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary"
                  value={returnSearchId}
                  onChange={(e) => setReturnSearchId(e.target.value)}
                />
                <Button
                  onClick={handleSearchForReturn}
                  className="bg-cyber-primary text-black px-6 rounded-lg font-bold hover:bg-cyber-accent"
                >
                  Lookup
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Tip: You can use 'TX-9981' to test.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              {/* ... Found Sale UI ... */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Transaction ID</p>
                  <p className="text-white font-mono font-bold">{foundSaleForReturn.receiptNumber || `SALE-${foundSaleForReturn.id.substring(0, 8).toUpperCase()}`}</p>
                  <p className="text-xs text-gray-500">{foundSaleForReturn.date}</p>
                </div>
                <button onClick={() => setFoundSaleForReturn(null)} className="text-xs text-cyber-primary hover:underline">
                  Change
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-white">Select Items to Return</p>
                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                  {foundSaleForReturn.items.map(item => {
                    const itemConfig = returnConfig[item.id] || { qty: 0, condition: 'Resalable', reason: 'Customer Changed Mind' };
                    return (
                      <div key={item.id} className="p-4 border-b border-white/5 last:border-0 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-white font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">Sold: {item.quantity} @ {formatCompactNumber(item.price, { currency: CURRENCY_SYMBOL })}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-black/30 rounded-lg p-1">
                            <button
                              onClick={() => updateReturnConfig(item.id, 'qty', Math.max(0, itemConfig.qty - 1))}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded"
                              aria-label="Decrease return quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center font-mono text-white">{itemConfig.qty}</span>
                            <button
                              onClick={() => updateReturnConfig(item.id, 'qty', Math.min(item.quantity, itemConfig.qty + 1))}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded"
                              aria-label="Increase return quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        {itemConfig.qty > 0 && (
                          <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                            <select
                              value={itemConfig.reason}
                              onChange={(e) => updateReturnConfig(item.id, 'reason', e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none"
                              aria-label="Return reason"
                            >
                              <option>Defective</option>
                              <option>Expired</option>
                              <option>Customer Changed Mind</option>
                              <option>Wrong Item</option>
                            </select>
                            <select
                              value={itemConfig.condition}
                              onChange={(e) => updateReturnConfig(item.id, 'condition', e.target.value)}
                              className={`bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none ${itemConfig.condition === 'Damaged' ? 'text-red-400' : 'text-green-400'}`}
                              aria-label="Condition"
                            >
                              <option value="Resalable">Return to Stock (Resalable)</option>
                              <option value="Damaged">Write-off (Damaged)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Total Refund</span>
                  <span className="text-2xl font-mono font-bold text-cyber-primary">
                    {CURRENCY_SYMBOL} {totalRefundAmount.toLocaleString()}
                  </span>
                </div>

                {totalRefundAmount > 0 && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                    <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
                    <p className="text-xs text-yellow-200/80">
                      Warning: This action will dispense cash from the drawer and update inventory records immediately.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setFoundSaleForReturn(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400">
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessReturn}
                    disabled={totalRefundAmount === 0 || isProcessing}
                    className="flex-1 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <RotateCcw size={18} />}
                    {isProcessing ? 'Processing...' : 'Confirm Refund'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* --- SHIFT CLOSE MODAL --- */}
      <Modal
        isOpen={isShiftModalOpen}
        onClose={() => !isProcessing && setIsShiftModalOpen(false)}
        title="Advanced Shift Reconciliation"
        size="lg"
      >
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between px-8 py-4 bg-black/20 rounded-2xl border border-white/5">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${closingStep === step
                  ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.4)] scale-110'
                  : closingStep > step ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'
                  }`}>
                  {closingStep > step ? <CheckCircle size={14} /> : step}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${closingStep === step ? 'text-white' : 'text-gray-600'
                  }`}>
                  {step === 1 ? 'Summary' : step === 2 ? 'Cash Tray' : 'Verify'}
                </span>
                {step < 3 && <div className="w-12 h-[1px] bg-white/5 mx-2" />}
              </div>
            ))}
          </div>

          {/* Step 1: Summary */}
          {closingStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Sales</p>
                  <p className="text-xl font-mono text-white">{CURRENCY_SYMBOL} {getShiftSummary().total.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Expected Cash</p>
                  <p className="text-xl font-mono text-cyber-primary">{CURRENCY_SYMBOL} {getShiftSummary().expected.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-1">Revenue Breakdown</p>
                <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                  {[
                    { label: 'Cash Sales', value: getShiftSummary().cash, icon: DollarSign, color: 'text-green-400' },
                    { label: 'Card sales', value: getShiftSummary().card, icon: CreditCard, color: 'text-blue-400' },
                    { label: 'Mobile Money', value: getShiftSummary().mobile, icon: Smartphone, color: 'text-purple-400' },
                    { label: 'Opening Float', value: activeShift?.openingFloat || 0, icon: Archive, color: 'text-yellow-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={item.color} />
                        <span className="text-sm text-gray-300 font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm font-mono text-white">{CURRENCY_SYMBOL} {item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setClosingStep(2)}
                className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Start Cash Count <ArrowLeft className="rotate-180" size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Cash Tray */}
          {closingStep === 2 && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="text-blue-400 mt-0.5" size={18} />
                <p className="text-xs text-blue-200/70 leading-relaxed">
                  Enter quantity of each bill. system balances this against records.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(cashDenominations).sort((a, b) => parseInt(b) - parseInt(a)).map((denom) => (
                  <div key={denom} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 focus-within:border-cyber-primary/50 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">{denom}</span>
                      <span className="text-xs font-mono text-cyber-primary">{CURRENCY_SYMBOL}{(parseInt(denom) * cashDenominations[denom]).toLocaleString()}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center text-white font-mono outline-none focus:border-cyber-primary transition-all"
                      value={cashDenominations[denom] || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCashDenominations(prev => ({ ...prev, [denom]: val }));
                      }}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Counted</span>
                <span className="text-2xl font-mono text-white">
                  {CURRENCY_SYMBOL} {Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0).toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setClosingStep(1)}
                  className="flex-1 py-4 bg-white/5 border border-white/5 rounded-xl text-white font-bold"
                >
                  Back
                </button>
                <button
                  onClick={() => setClosingStep(3)}
                  className="flex-[2] py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl shadow-lg"
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verify & Submit */}
          {closingStep === 3 && (
            <div className="space-y-6">
              {(() => {
                const summary = getShiftSummary();
                const actual = Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0);
                const variance = actual - summary.expected;
                const isVariance = Math.abs(variance) > 0.01;

                return (
                  <>
                    <div className={`p-6 rounded-2xl border ${!isVariance
                      ? 'bg-green-500/10 border-green-500/20'
                      : variance > 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
                      } text-center`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${!isVariance ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {!isVariance ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {!isVariance ? 'Shift Balanced' : variance > 0 ? 'Cash Surplus' : 'Cash Shortage'}
                      </h3>
                      <p className={`text-2xl font-mono font-bold ${!isVariance ? 'text-green-400' : 'text-red-400'}`}>
                        {variance > 0 ? '+' : ''}{CURRENCY_SYMBOL} {variance.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-1">Reason for Variance (Required if any)</label>
                        <textarea
                          placeholder="Document variance cause..."
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-cyber-primary min-h-[80px]"
                          value={discrepancyReason}
                          onChange={(e) => setDiscrepancyReason(e.target.value)}
                        />
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Expected</span>
                          <span className="text-white font-mono">{CURRENCY_SYMBOL} {summary.expected.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Actual</span>
                          <span className="text-white font-mono">{CURRENCY_SYMBOL} {actual.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setClosingStep(2)}
                        disabled={isProcessing}
                        className="flex-1 py-4 bg-white/5 border border-white/5 rounded-xl text-white font-bold"
                      >
                        Recount
                      </button>
                      <button
                        onClick={handleSubmitShift}
                        disabled={isProcessing || (isVariance && !discrepancyReason.trim())}
                        className="flex-[2] py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <LogOut size={18} />}
                        Finalize & Logout
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </Modal>

      {/* --- MODAL: HOLD / RECALL --- */}
      <Modal isOpen={isRecallModalOpen} onClose={() => setIsRecallModalOpen(false)} title="Recall Held Order">
        <div className="space-y-3">
          {heldOrders.map(order => (
            <div key={order.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group hover:border-cyber-primary/50 transition-colors cursor-pointer" onClick={() => handleRecallOrder(order.id)}>
              <div>
                <p className="text-white font-bold">{order.note}</p>
                <p className="text-xs text-gray-500">{order.time} • {order.items.length} items</p>
              </div>
              <ArrowRight size={16} className="text-gray-500 group-hover:text-cyber-primary" />
            </div>
          ))}
          {heldOrders.length === 0 && (
            <p className="text-center text-gray-500 py-8">No held orders found.</p>
          )}
        </div>
      </Modal>

      {/* --- MODAL: DISCOUNT (Code Required) --- */}
      <Modal isOpen={isDiscountModalOpen} onClose={() => { setIsDiscountModalOpen(false); setDiscountCodeError(''); }} title="Apply Discount Code" size="sm">
        <div className="space-y-5">
          {/* Current Applied Discount */}
          {appliedDiscountCodeDetails && (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-green-400">{appliedDiscountCodeDetails.code}</p>
                    <p className="text-xs text-green-300/70">{appliedDiscountCodeDetails.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">
                    {appliedDiscountCodeDetails.type === 'PERCENTAGE'
                      ? `-${appliedDiscountCodeDetails.value}%`
                      : `-${CURRENCY_SYMBOL} ${appliedDiscountCodeDetails.value}`
                    }
                  </p>
                  <p className="text-xs text-green-300/70">
                    Saving: {formatCompactNumber(cartDiscount, { currency: CURRENCY_SYMBOL })}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveDiscount}
                className="w-full mt-3 py-2 text-red-400 text-sm border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
              >
                Remove Discount
              </button>
            </div>
          )}

          {/* Discount Code Entry */}
          {!appliedDiscountCodeDetails && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyber-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                  <Tag className="w-8 h-8 text-cyber-primary" />
                </div>
                <p className="text-gray-400 text-sm">
                  Enter the discount code provided to the customer
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
                    Discount Code
                  </label>
                  <input
                    type="text"
                    value={discountCodeInput}
                    onChange={(e) => {
                      setDiscountCodeInput(e.target.value.toUpperCase());
                      setDiscountCodeError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleValidateDiscountCode();
                    }}
                    placeholder="Enter code (e.g., SAVE10)"
                    className={`w-full bg-black/30 border ${discountCodeError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white text-center text-lg font-mono tracking-wider uppercase focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 transition-all`}
                    autoFocus
                  />
                  {discountCodeError && (
                    <p className="mt-2 text-red-400 text-sm flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {discountCodeError}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleValidateDiscountCode}
                  disabled={!discountCodeInput.trim() || isValidatingCode}
                  className="w-full bg-gradient-to-r from-cyber-primary to-cyan-400 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyber-primary/30 transition-all"
                >
                  {isValidatingCode ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Apply Code
                    </>
                  )}
                </button>
              </div>

              {/* Info Section */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-white">Note:</strong> Discount codes must be obtained from management or marketing campaigns.
                  Ask the customer for their discount code or promotional number.
                </p>
              </div>

              {/* Cart Summary */}
              <div className="flex justify-between text-sm text-gray-400 pt-2 border-t border-white/5">
                <span>Cart Subtotal:</span>
                <span className="text-white font-semibold">{formatCompactNumber(subtotal, { currency: CURRENCY_SYMBOL })}</span>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* --- MODAL: MISC ITEM --- */}
      <Modal isOpen={isMiscItemModalOpen} onClose={() => setIsMiscItemModalOpen(false)} title="Add Miscellaneous Item" size="sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="misc-desc" className="text-xs text-gray-500 uppercase font-bold mb-1 block">Description</label>
            <input
              id="misc-desc"
              value={miscItem.name}
              onChange={e => setMiscItem({ ...miscItem, name: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Price</label>
            <input
              type="number"
              value={miscItem.price}
              onChange={e => setMiscItem({ ...miscItem, price: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <button
            onClick={addMiscItem}
            disabled={!miscItem.price}
            className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl disabled:opacity-50"
          >
            Add to Cart
          </button>
        </div>
      </Modal>





      {/* --- MODAL: CUSTOMER LOOKUP --- */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Select Customer" size="lg">
        <div className="space-y-4">
          <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus-within:border-cyber-primary/50 transition-colors">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="bg-transparent border-none ml-3 flex-1 text-white outline-none placeholder-gray-500"
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Customer List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsCustomerModalOpen(false);
                  addNotification('info', 'Customer set to Walk-in');
                }}
                className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between ${!selectedCustomer
                  ? 'bg-cyber-primary/20 border-cyber-primary text-white'
                  : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                  }`}
              >
                <div>
                  <p className="font-bold">Walk-in Customer</p>
                  <p className="text-xs opacity-70">Default guest account</p>
                </div>
                {!selectedCustomer && <CheckCircle size={16} className="text-cyber-primary" />}
              </button>

              {filteredCustomers.map(customer => {
                const stats = getCustomerStats(customer.id);
                return (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedCustomer?.id === customer.id
                      ? 'bg-cyber-primary/20 border-cyber-primary text-white'
                      : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold">{customer.name}</p>
                        <p className="text-xs opacity-70">{customer.phone} • {customer.email}</p>
                        <div className="flex gap-3 mt-1 text-[10px]">
                          <span className="text-cyber-primary">{stats.totalVisits} visits</span>
                          <span className="text-green-400">{formatCompactNumber(stats.totalSpent, { currency: CURRENCY_SYMBOL })} spent</span>
                        </div>
                      </div>
                      {selectedCustomer?.id === customer.id && <CheckCircle size={16} className="text-cyber-primary" />}
                    </div>
                  </button>
                );
              })}

              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No customers found</p>
                </div>
              )}
            </div>

            {/* Customer History Panel */}
            {selectedCustomer && (
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <User size={16} className="text-cyber-primary" />
                  Customer Details
                </h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Total Visits</p>
                      <p className="text-xl font-bold text-white">{getCustomerStats(selectedCustomer.id).totalVisits}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Total Spent</p>
                      <p className="text-xl font-bold text-cyber-primary">{formatCompactNumber(getCustomerStats(selectedCustomer.id).totalSpent, { currency: CURRENCY_SYMBOL })}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Recent Purchases</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {getCustomerHistory(selectedCustomer.id).slice(0, 5).map((sale, idx) => (
                        <div key={idx} className="bg-white/5 p-2 rounded text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-300">{formatDateTime(sale.date, { useRelative: true })}</span>
                            <span className="text-cyber-primary font-bold">{formatCompactNumber(sale.total, { currency: CURRENCY_SYMBOL })}</span>
                          </div>
                          <p className="text-gray-500 text-[10px] mt-1">{sale.items.length} items</p>
                        </div>
                      ))}
                      {getCustomerHistory(selectedCustomer.id).length === 0 && (
                        <p className="text-gray-500 text-xs italic">No purchase history</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>


      {/* Receiving functionality moved to POS Command Center */}



      {/* Receiving functionality moved to POS Command Center */}

      {/* Hold Order Modal */}

      {/* Receiving functionality moved to POS Command Center */}

      {/* Hold Order Modal */}
      <Modal isOpen={isHoldOrderModalOpen} onClose={() => setIsHoldOrderModalOpen(false)} title="Hold Order" size="sm">
        <div className="p-6">
          <p className="text-gray-300 mb-4">Enter a reference note for this order (e.g., Customer Name):</p>
          <input
            type="text"
            value={holdOrderNote}
            onChange={(e) => setHoldOrderNote(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-cyber-primary transition-colors"
            placeholder="Note..."
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsHoldOrderModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
            <button onClick={handleConfirmHoldOrder} className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg">Hold Order</button>
          </div>
        </div>
      </Modal >

      {/* Overwrite Cart Confirmation Modal */}
      < Modal isOpen={isOverwriteCartModalOpen} onClose={() => setIsOverwriteCartModalOpen(false)} title="Overwrite Cart?" size="sm" >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="p-3 bg-yellow-500/20 rounded-full">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cart Not Empty</h3>
              <p className="text-yellow-200 text-sm">Current cart items will be replaced by the held order.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsOverwriteCartModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
            <button onClick={handleConfirmOverwriteCart} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg">Overwrite</button>
          </div>
        </div>
      </Modal >

      {/* Email Receipt Modal */}
      < Modal isOpen={isEmailReceiptModalOpen} onClose={() => setIsEmailReceiptModalOpen(false)} title="Email Receipt" size="sm" >
        <div className="p-6">
          <p className="text-gray-300 mb-4">Enter customer email address:</p>
          <input
            type="email"
            value={emailReceiptAddress}
            onChange={(e) => setEmailReceiptAddress(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-cyber-primary transition-colors"
            placeholder="customer@example.com"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsEmailReceiptModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
            <button onClick={handleConfirmEmailReceipt} disabled={!emailReceiptAddress || isProcessing} className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg disabled:opacity-50 flex items-center gap-2">
              {isProcessing && <Loader2 size={16} className="animate-spin" />}
              Send Receipt
            </button>
          </div>
        </div>
      </Modal >

      {/* QR Scanner Modal */}
      {
        isQRScannerOpen && (
          <QRScanner
            onScan={async (data) => {
              await handleScanProduct(data);
            }}
            onClose={() => setIsQRScannerOpen(false)}
            title="Scan Product Barcode/QR"
            description="Position the barcode or QR code within the frame"
          />
        )
      }

      {/* --- MODAL: RECEIPT PREVIEW --- */}
      <Modal isOpen={isReceiptPreviewOpen} onClose={() => setIsReceiptPreviewOpen(false)} title="Receipt Preview" size="md">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-inner h-96 overflow-y-auto">
            <iframe
              srcDoc={receiptPreviewHTML}
              title="Receipt Preview"
              className="w-full h-full border-none bg-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setIsReceiptPreviewOpen(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPrint}
              className="px-6 py-2 bg-cyber-primary text-black font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors flex items-center gap-2"
            >
              <Printer size={18} />
              Print Receipt
            </button>
          </div>
        </div>
      </Modal>
      {/* Points Earned Popup */}
      {
        showPointsPopup && earnedPointsData && (
          <PointsEarnedPopup
            points={earnedPointsData.points}
            message="Transaction Complete!"
            bonuses={earnedPointsData.breakdown}
            onClose={() => setShowPointsPopup(false)}
          />
        )
      }
    </>
  );
}
