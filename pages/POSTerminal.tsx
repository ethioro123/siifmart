
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Minus, Trash2, CreditCard, Printer, User, RotateCcw, Lock, Box,
  ArrowLeft, Smartphone, Banknote, CheckCircle, RefreshCcw, Share2, AlertTriangle,
  ArrowRight, LogOut, FileText, PauseCircle, PlayCircle, Tag, ShoppingBag, Scan, Package, Camera,
  MapPin, Store, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOL } from '../constants';
import { Product, CartItem, PaymentMethod, SaleRecord, ReturnCondition, ReturnReason, ReturnItem, ShiftRecord, HeldOrder, Customer } from '../types';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext'; // Use Live Data
import Modal from '../components/Modal';
import { Protected, ProtectedButton } from '../components/Protected';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { QRScanner } from '../components/QRScanner';
import { native } from '../utils/native';

export default function POS() {
  const { user, logout } = useStore();
  const {
    products, activeSite, shifts, startShift, addNotification,
    processSale, processReturn, holdOrder, releaseHold, heldOrders,
    updateCustomer, customers, promotions, sales, transfers, closeShift,
    updateProduct, sites, refreshData
  } = useData();
  const { t } = useLanguage();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- Logic State ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);

  // --- Advanced POS Features ---
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [cartDiscount, setCartDiscount] = useState(0); // Fixed amount
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isMiscItemModalOpen, setIsMiscItemModalOpen] = useState(false);
  const [miscItem, setMiscItem] = useState({ name: 'Misc Item', price: '' });

  // --- Returns Logic State ---
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSearchId, setReturnSearchId] = useState('');
  const [foundSaleForReturn, setFoundSaleForReturn] = useState<SaleRecord | null>(null);
  const [returnConfig, setReturnConfig] = useState<Record<string, { qty: number, condition: ReturnCondition, reason: ReturnReason }>>({});

  // --- Shift Logic State ---
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
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

  // --- Quick SKU Entry State ---
  const [quickSKU, setQuickSKU] = useState('');

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

  // --- Customer Handlers ---
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return customers;
    const term = customerSearchTerm.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  }, [customers, customerSearchTerm]);

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

  // Quick SKU Entry Handler
  const handleQuickSKUEntry = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickSKU.trim()) {
      const product = filteredProducts.find(p =>
        p.sku.toLowerCase() === quickSKU.toLowerCase()
      );
      if (product) {
        addToCart(product);
        setQuickSKU('');
        addNotification('success', `Added ${product.name}`);
      } else {
        addNotification('error', `Product not found: ${quickSKU}`);
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const hasStock = p.stock > 0; // Only show products with available stock

      // Check if product has been received based on site type
      let hasBeenReceived = false;

      if (activeSite?.type === 'Warehouse' || activeSite?.type === 'Distribution Center') {
        // For warehouses: Product must have a location assigned (PUTAWAY completed)
        // Location format: A-01-05 (not just "Receiving Dock")
        hasBeenReceived = p.location &&
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
        hasBeenReceived = p.location && p.location.trim() !== '';
      }

      return matchesSearch && matchesCategory && hasStock && hasBeenReceived;
    });
  }, [searchTerm, selectedCategory, products, activeSite, transfers]);

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
      id: `MISC - ${Date.now()} `,
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
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15;
  // Ensure total doesn't go below zero due to discount
  const total = Math.max(0, subtotal + tax - cartDiscount);

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
      id: `HOLD - ${Date.now()} `,
      siteId: activeSite?.id || 'SITE-001',
      time: new Date().toLocaleTimeString(),
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

  const handleApplyDiscount = (type: 'FIXED' | 'PERCENT', value: number) => {
    let discountAmount = 0;
    if (type === 'FIXED') discountAmount = value;
    if (type === 'PERCENT') discountAmount = subtotal * (value / 100);

    setCartDiscount(discountAmount);
    setIsDiscountModalOpen(false);
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

      // Note: Discount is baked into total logic here for simplicity in mock
      // In real app, pass discount separately
      const txId = await processSale(cart, selectedPaymentMethod, user?.name || 'Cashier', tendered, change);

      const saleObj: SaleRecord = {
        id: txId,
        siteId: activeSite?.id || 'SITE-001',
        date: new Date().toLocaleString(),
        subtotal,
        tax,
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
    // Generate receipt HTML
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; width: 300px; margin: 20px auto; }
          h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 5px 0; }
          hr { border: 1px dashed #000; }
        </style>
      </head>
      <body>
        <h2>SIIFMART</h2>
        <p style="text-align: center; font-size: 10px;">${activeSite?.name || 'Store'}</p>
        <hr>
        <p>Date: ${new Date().toLocaleString()}</p>
        <p>Cashier: ${user?.name || 'N/A'}</p>
        <p>Customer: ${selectedCustomer?.name || 'Walk-in Customer'}</p>
        <hr>
        ${cart.map(item => `<p>${item.name}<br>  ${item.quantity} x ${CURRENCY_SYMBOL}${item.price.toFixed(2)} = ${CURRENCY_SYMBOL}${(item.price * item.quantity).toFixed(2)}</p>`).join('')}
        <hr>
        <p>Subtotal: ${CURRENCY_SYMBOL}${subtotal.toFixed(2)}</p>
        ${cartDiscount > 0 ? `<p>Discount: -${CURRENCY_SYMBOL}${cartDiscount.toFixed(2)}</p>` : ''}
        <p>Tax (15%): ${CURRENCY_SYMBOL}${tax.toFixed(2)}</p>
        <p><strong>TOTAL: ${CURRENCY_SYMBOL}${total.toFixed(2)}</strong></p>
        <hr>
        <p style="text-align: center; font-size: 10px;">Thank you for shopping!</p>
      </body>
      </html>
    `;

    // Show preview first
    setReceiptPreviewHTML(receiptHTML);
    setIsReceiptPreviewOpen(true);
  };

  const handleConfirmPrint = () => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(receiptPreviewHTML);
      printWindow.document.close();
      printWindow.print();
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
    // Find product by SKU or barcode
    const product = products.find(p =>
      p.sku.toLowerCase() === barcode.toLowerCase() ||
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

        addNotification('warning', message);
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
    setIsShiftModalOpen(true);
  };

  const handleSubmitShift = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const record: ShiftRecord = {
      id: activeShift?.id || `SHIFT-${Date.now()}`,
      siteId: activeSite?.id || 'SITE-001',
      cashierId: user?.id || 'unk',
      cashierName: user?.name || 'Unknown',
      startTime: shiftStartTime,
      endTime: new Date().toISOString(),
      openingFloat,
      cashSales: shiftCashSales,
      expectedCash,
      actualCash: parseFloat(countedCash),
      variance: cashVariance,
      notes: shiftNotes,
      status: 'Closed'
    };

    closeShift(record);

    setIsProcessing(false);
    setIsShiftModalOpen(false);
    addNotification('success', "Shift Closed Successfully. Z-Report Saved.");
    logout();
    navigate('/');
  };

  // --- Returns Handlers ---

  const handleSearchForReturn = () => {
    const sale = sales.find(s => s.id === returnSearchId || s.receiptNumber === returnSearchId || s.id === `TX - ${returnSearchId} `);
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
      processReturn(foundSaleForReturn.id, returnItems, refundTotal, user?.name || 'System');

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

  // 🔒 STORE SELECTION REQUIRED FOR ADMIN USERS (Super Admin must select a store)
  const activeSiteType = activeSite?.type || 'Administrative';
  const isMultiSiteRole = user?.role === 'super_admin' || user?.role === 'Admin' || user?.role === 'Auditor';
  const needsStoreSelection = isMultiSiteRole && (activeSiteType === 'Administrative' || activeSiteType === 'Headquarters');

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
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 relative">
      {/* Left: Product Grid - Always visible on desktop, conditionally on mobile */}
      <div className={`flex-1 flex flex-col bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden ${isNativeApp && showCart ? 'hidden' : 'flex'
        }`}>
        <div className="p-4 border-b border-white/5 space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-400 hover:text-white transition-colors"
              title={t('pos.exitDashboard')}
              aria-label="Exit to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus-within:border-cyber-primary/50 transition-colors">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('pos.searchPlaceholder')}
                className="bg-transparent border-none ml-3 flex-1 text-[var(--text-base)] outline-none placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <Protected permission="ADD_PRODUCT">
              <button
                onClick={() => setIsMiscItemModalOpen(true)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <ShoppingBag size={16} /> {t('pos.miscItem')}
              </button>
            </Protected>
            <LanguageSwitcher />
          </div>

          {/* Quick SKU Entry */}
          <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 focus-within:border-cyber-primary/50 transition-colors">
            <Package size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Quick SKU Entry (Press Enter)"
              className="bg-transparent border-none ml-3 flex-1 text-[var(--text-base)] outline-none placeholder-gray-500 text-sm"
              value={quickSKU}
              onChange={(e) => setQuickSKU(e.target.value)}
              onKeyDown={handleQuickSKUEntry}
            />
            {quickSKU && (
              <button
                onClick={() => setQuickSKU('')}
                className="text-gray-500 hover:text-white"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                  ? 'bg-cyber-primary text-black font-bold'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
              >
                {cat}
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
                  className={`text-left bg-black/20 border border-white/5 rounded-xl p-3 hover:border-cyber-primary/50 hover:shadow-[0_0_15px_rgba(0,255,157,0.15)] transition-all group relative overflow-hidden ${product.stock === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                >
                  <div className="aspect-square rounded-lg bg-white/5 mb-3 overflow-hidden relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&color=fff&size=150`;
                      }} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyber-primary/20 to-cyber-accent/20 flex items-center justify-center">
                        <span className="text-4xl font-bold text-cyber-primary/50">{product.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-mono text-white force-text-white ${product.stock < 10 ? 'bg-red-500 animate-pulse' : 'bg-black/70'}`}>
                      {product.stock} {t('pos.left')}
                    </div>
                    {product.isOnSale && (
                      <div className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded text-[10px] font-bold text-white force-text-white animate-pulse">
                        {t('pos.sale')}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-[var(--text-base)] text-sm truncate">{product.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <p className="text-gray-500 text-xs line-through">{CURRENCY_SYMBOL} {product.price}</p>
                        <p className="text-cyber-primary font-mono font-bold">{CURRENCY_SYMBOL} {product.salePrice}</p>
                      </>
                    ) : (
                      <p className="text-cyber-primary font-mono font-bold">{CURRENCY_SYMBOL} {product.price}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{product.sku}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Summary - Always visible on desktop, slide-up panel on mobile */}
      <div className={`${isNativeApp
        ? showCart
          ? 'fixed inset-0 z-50 bg-cyber-black flex flex-col'
          : 'hidden'
        : 'w-full lg:w-[400px] bg-cyber-gray border border-white/5 rounded-2xl flex flex-col h-full'
        }`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          {isNativeApp && showCart && (
            <button
              onClick={() => setShowCart(false)}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              aria-label="Back to Products"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="font-bold text-[var(--text-base)] flex items-center hover:bg-white/5 p-2 rounded-lg transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-cyber-primary/10 flex items-center justify-center mr-2 text-cyber-primary">
              <User size={16} />
            </div>
            <div>
              <p className="line-clamp-1">{selectedCustomer ? selectedCustomer.name : t('pos.walkInCustomer')}</p>
              {selectedCustomer && <p className="text-[10px] text-cyber-primary font-normal">Loyalty Member</p>}
            </div>
          </button>
          <div className="flex gap-2">
            {/* Recall Button (Shows Badge) */}
            <button
              onClick={() => setIsRecallModalOpen(true)}
              className="relative text-xs text-yellow-400 hover:text-white border border-yellow-400/20 px-2 py-1 rounded hover:bg-yellow-400/10 transition-colors"
              title="Recall Held Order"
              disabled={heldOrders.length === 0}
            >
              <PlayCircle size={14} />
              {heldOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">
                  {heldOrders.length}
                </span>
              )}
            </button>
            <button onClick={handleHoldOrder} className="text-xs text-blue-400 hover:text-white border border-blue-400/20 px-2 py-1 rounded hover:bg-blue-400/10 transition-colors" title="Hold Cart">
              <PauseCircle size={14} />
            </button>
            <Protected permission="VOID_SALE">
              <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 px-2 py-1 rounded hover:bg-red-400/10 transition-colors" title="Clear Cart">
                {t('pos.clearCart')}
              </button>
            </Protected>
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
              <div key={item.id} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="flex-1">
                  <h4 className="text-[var(--text-base)] text-sm font-medium line-clamp-1">{item.name}</h4>
                  <p className="text-cyber-primary text-xs font-mono">
                    {CURRENCY_SYMBOL} {item.price}
                    {item.isOnSale && <span className="ml-2 text-[10px] text-red-400 font-bold">(SALE)</span>}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-[var(--text-base)] font-mono w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400"
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-2 text-red-400 hover:text-red-300"
                    aria-label="Remove from cart"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-black/30 border-t border-white/5 rounded-b-2xl">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-400 text-sm">
              <span>{t('pos.subtotal')}</span>
              <span>{CURRENCY_SYMBOL} {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <span>{t('pos.discount')}</span>
                <Protected permission="APPLY_DISCOUNT">
                  <button onClick={() => setIsDiscountModalOpen(true)} className="text-[10px] bg-white/10 px-1 rounded hover:bg-white/20 flex items-center gap-1">
                    <Tag size={10} /> Edit
                  </button>
                </Protected>
              </div>
              <span className="text-red-400">- {CURRENCY_SYMBOL} {cartDiscount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-sm">
              <span>{t('pos.tax')} (15%)</span>
              <span>{CURRENCY_SYMBOL} {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[var(--text-base)] text-lg font-bold border-t border-white/10 pt-2 mt-2">
              <span>{t('common.total')}</span>
              <span className="text-cyber-primary">{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Functions Menu */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Receiving moved to POS Command Center only */}
            <Protected permission="REFUND_SALE">
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="flex items-center space-x-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-red-400 hover:text-red-300 transition-colors border border-white/5 active:scale-95 justify-center"
              >
                <RotateCcw size={16} />
                <span className="font-medium">{t('pos.returns')}</span>
              </button>
            </Protected>
            <button
              onClick={handleOpenDrawer}
              className="flex items-center space-x-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-colors border border-white/5 active:scale-95 justify-center"
            >
              <Box size={16} />
              <span className="font-medium">{t('pos.openDrawer')}</span>
            </button>
            <button
              onClick={handleCloseShift}
              className="flex items-center space-x-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-colors border border-white/5 active:scale-95 justify-center"
            >
              <Lock size={16} />
              <span className="font-medium">{t('pos.closeShift')}</span>
            </button>
            <button
              onClick={handleReprintLast}
              className="flex items-center space-x-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-colors border border-white/5 active:scale-95 justify-center"
            >
              <Printer size={16} />
              <span className="font-medium">{t('pos.reprintLast')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={handleInitiatePayment}
              className="flex items-center justify-center space-x-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold py-3 rounded-xl transition-colors"
            >
              <CreditCard size={18} />
              <span>{t('pos.payNow')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Cart Button - Only visible on mobile/native when cart is hidden */}
      {isNativeApp && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-cyber-primary hover:bg-cyber-accent text-black rounded-full shadow-lg shadow-cyber-primary/50 flex items-center justify-center transition-all active:scale-95"
          aria-label="View Cart"
        >
          <ShoppingBag size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      )}


      {/* ... Modals unchanged from previous, keeping structure ... */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={t('pos.processPayment')}
      >
        <div className="space-y-6">
          <div className="text-center p-6 bg-black/30 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">{t('pos.totalAmountDue')}</p>
            <p className="text-4xl font-bold text-cyber-primary font-mono">{CURRENCY_SYMBOL} {total.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedPaymentMethod('Cash')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedPaymentMethod === 'Cash'
                ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
            >
              <Banknote size={24} />
              <span className="text-sm font-bold">{t('pos.cash')}</span>
            </button>
            <button
              onClick={() => setSelectedPaymentMethod('Card')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedPaymentMethod === 'Card'
                ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
            >
              <CreditCard size={24} />
              <span className="text-sm font-bold">{t('pos.card')}</span>
            </button>
            <button
              onClick={() => setSelectedPaymentMethod('Mobile Money')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedPaymentMethod === 'Mobile Money'
                ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
            >
              <Smartphone size={24} />
              <span className="text-sm font-bold">{t('pos.mobile')}</span>
            </button>
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
                    {amt === total ? 'Exact' : `${CURRENCY_SYMBOL} ${amt} `}
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

          <button
            onClick={handleProcessPayment}
            disabled={!isPaymentValid || isProcessing}
            className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold rounded-xl text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,157,0.3)]"
          >
            {isProcessing ? <RefreshCcw className="animate-spin" /> : <CheckCircle />}
            {isProcessing ? 'Processing...' : 'Complete Transaction'}
          </button>
        </div>
      </Modal>

      {/* --- RECEIPT MODAL --- */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Transaction Complete"
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
            <CheckCircle size={32} />
          </div>

          <div className="bg-white text-black p-6 rounded-lg w-full max-w-sm shadow-xl font-mono text-sm mb-6 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-cyber-dark" style={{ maskImage: 'radial-gradient(circle, transparent 50%, black 50%)', maskSize: '10px 10px' }}></div>

            <div className="text-center mb-4 border-b-2 border-black/10 pb-4 border-dashed">
              <h2 className="text-xl font-bold uppercase tracking-widest">SIIFMART</h2>
              <p className="text-xs text-gray-600">Bole Road, Addis Ababa</p>
              <p className="text-xs text-gray-600">Tel: +251 911 000 000</p>
              <p className="text-xs text-gray-600 mt-2">VAT Reg: 123456789</p>
            </div>

            <div className="flex justify-between text-xs mb-4">
              <div>
                <p>Date: {lastSale?.date.split(' ')[0]}</p>
                <p>Time: {lastSale?.date.split(' ')[1]}</p>
              </div>
              <div className="text-right">
                <p>Rcpt #: {lastSale?.receiptNumber || lastSale?.id.split('-')[1]}</p>
                <p>Cashier: {user?.name.split(' ')[0]}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 border-b-2 border-black/10 pb-4 border-dashed min-h-[100px]">
              {lastSale?.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity} x {item.name.substring(0, 15)}</span>
                  <span>{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 mb-4 text-right">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{lastSale?.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (15%)</span>
                <span>{lastSale?.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2">
                <span>TOTAL</span>
                <span>{CURRENCY_SYMBOL} {lastSale?.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-xs space-y-1 border-t-2 border-black/10 pt-2 border-dashed">
              <div className="flex justify-between">
                <span>Paid via {lastSale?.method}</span>
                <span>{lastSale?.amountTendered ? lastSale.amountTendered.toLocaleString() : lastSale?.total.toLocaleString()}</span>
              </div>
              {lastSale?.change !== undefined && (
                <div className="flex justify-between">
                  <span>Change</span>
                  <span>{lastSale.change.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="text-center mt-6 text-xs text-gray-500">
              <p>*** THANK YOU FOR SHOPPING ***</p>
              <p className="mt-1">Powered by SIIFMART Systems</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button onClick={handlePrintReceipt} className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold flex items-center justify-center gap-2">
              <Printer size={18} />
              Print
            </button>
            <button onClick={handleEmailReceipt} className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold flex items-center justify-center gap-2">
              <Share2 size={18} />
              Email
            </button>
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="col-span-2 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              New Sale
            </button>
          </div>
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
                <button
                  onClick={handleSearchForReturn}
                  className="bg-cyber-primary text-black px-6 rounded-lg font-bold hover:bg-cyber-accent"
                >
                  Lookup
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Tip: You can use 'TX-9981' to test.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              {/* ... Found Sale UI ... */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Transaction ID</p>
                  <p className="text-white font-mono font-bold">{foundSaleForReturn.receiptNumber || foundSaleForReturn.id}</p>
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
                            <p className="text-xs text-gray-500">Sold: {item.quantity} @ {CURRENCY_SYMBOL}{item.price}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-black/30 rounded-lg p-1">
                            <button
                              onClick={() => updateReturnConfig(item.id, 'qty', Math.max(0, itemConfig.qty - 1))}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center font-mono text-white">{itemConfig.qty}</span>
                            <button
                              onClick={() => updateReturnConfig(item.id, 'qty', Math.min(item.quantity, itemConfig.qty + 1))}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded"
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
                    {isProcessing ? <RefreshCcw className="animate-spin" /> : <RotateCcw size={18} />}
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
        onClose={() => setIsShiftModalOpen(false)}
        title="End of Shift Reconciliation"
        size="lg"
      >
        {/* ... Shift logic from before ... */}
        <div className="space-y-6">
          <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase">Cashier</p>
              <p className="text-white font-bold">{user?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase">Date</p>
              <p className="text-white font-mono">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Money Counts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">System Totals</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Opening Float</span>
                <span className="text-white font-mono">{CURRENCY_SYMBOL} {openingFloat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Cash Sales</span>
                <span className="text-white font-mono">{CURRENCY_SYMBOL} {shiftCashSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                <span className="text-cyber-primary font-bold">Expected Cash</span>
                <span className="text-cyber-primary font-mono font-bold">{CURRENCY_SYMBOL} {expectedCash.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">Actual Count</h4>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Total Cash in Drawer</label>
                <input
                  type="number"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary font-mono text-lg"
                  placeholder="0.00"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                />
              </div>
              {countedCash && (
                <div className={`p-3 rounded-lg border text-center ${Math.abs(cashVariance) < 5 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <p className="text-xs uppercase font-bold">Variance</p>
                  <p className="font-mono text-lg font-bold">
                    {cashVariance > 0 ? '+' : ''}{CURRENCY_SYMBOL} {cashVariance.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Shift Notes / Anomalies</label>
            <textarea
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary h-20 text-sm"
              placeholder="Explain any variance or list issues faced..."
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              onClick={() => setIsShiftModalOpen(false)}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitShift}
              disabled={!countedCash || isProcessing}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCcw className="animate-spin" /> : <LogOut size={18} />}
              {isProcessing ? 'Closing...' : 'Close Shift & Logout'}
            </button>
          </div>
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

      {/* --- MODAL: DISCOUNT --- */}
      <Modal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Apply Discount" size="sm">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Apply to entire cart.</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleApplyDiscount('PERCENT', 5)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10">5%</button>
            <button onClick={() => handleApplyDiscount('PERCENT', 10)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10">10%</button>
            <button onClick={() => handleApplyDiscount('PERCENT', 20)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10">20%</button>
            <button onClick={() => handleApplyDiscount('PERCENT', 50)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10">50%</button>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Custom Fixed Amount</label>
            <div className="flex gap-2">
              <input type="number" id="fixedDiscount" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="0.00" />
              <button
                onClick={() => {
                  const val = parseFloat((document.getElementById('fixedDiscount') as HTMLInputElement).value);
                  if (!isNaN(val)) handleApplyDiscount('FIXED', val);
                }}
                className="bg-cyber-primary text-black px-4 rounded-lg font-bold"
              >Apply</button>
            </div>
          </div>

          {/* Active Promotions from Merchandising */}
          {promotions && promotions.filter(p => p.status === 'Active').length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Active Campaigns</p>
              <div className="grid grid-cols-2 gap-3">
                {promotions.filter(p => p.status === 'Active').map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const type = p.type === 'PERCENTAGE' ? 'PERCENT' : 'FIXED';
                      handleApplyDiscount(type, p.value);
                    }}
                    className="p-3 bg-cyber-primary/10 border border-cyber-primary/20 rounded-xl text-cyber-primary hover:bg-cyber-primary/20 flex flex-col items-center"
                    title={`Apply code: ${p.code}`}
                  >
                    <span className="font-bold text-sm">{p.code}</span>
                    <span className="text-xs">{p.type === 'PERCENTAGE' ? `${p.value}% Off` : `-${p.value} Off`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => { setCartDiscount(0); setIsDiscountModalOpen(false); }} className="w-full py-2 text-red-400 text-sm hover:underline">Remove Discount</button>
        </div>
      </Modal>

      {/* --- MODAL: MISC ITEM --- */}
      <Modal isOpen={isMiscItemModalOpen} onClose={() => setIsMiscItemModalOpen(false)} title="Add Miscellaneous Item" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Description</label>
            <input
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
                          <span className="text-green-400">{CURRENCY_SYMBOL}{stats.totalSpent.toLocaleString()} spent</span>
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
                      <p className="text-xl font-bold text-cyber-primary">{CURRENCY_SYMBOL}{getCustomerStats(selectedCustomer.id).totalSpent.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Recent Purchases</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {getCustomerHistory(selectedCustomer.id).slice(0, 5).map((sale, idx) => (
                        <div key={idx} className="bg-white/5 p-2 rounded text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-300">{new Date(sale.date).toLocaleDateString()}</span>
                            <span className="text-cyber-primary font-bold">{CURRENCY_SYMBOL}{sale.total.toFixed(2)}</span>
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
            <button onClick={handleConfirmEmailReceipt} disabled={!emailReceiptAddress} className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg disabled:opacity-50">Send Receipt</button>
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
              className="w-full h-full border-none"
              style={{ backgroundColor: 'white' }}
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
    </div >
  );
}
