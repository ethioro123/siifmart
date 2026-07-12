import React from 'react';
import { CartItem, PaymentMethod, SaleRecord, Customer, Site, SystemConfig, User } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import { printHtmlContent } from '../../../utils/printHelper';

interface UsePOSCheckoutActionsProps {
    cart: CartItem[];
    selectedPaymentMethod: PaymentMethod;
    setSelectedPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
    amountTendered: string;
    setAmountTendered: React.Dispatch<React.SetStateAction<string>>;
    isPaymentModalOpen: boolean;
    setIsPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isReceiptModalOpen: boolean;
    setIsReceiptModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isProcessing: boolean;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    lastSale: SaleRecord | null;
    setLastSale: React.Dispatch<React.SetStateAction<SaleRecord | null>>;
    earnedPointsData: any;
    setEarnedPointsData: React.Dispatch<React.SetStateAction<any>>;
    showPointsPopup: boolean;
    setShowPointsPopup: React.Dispatch<React.SetStateAction<boolean>>;
    selectedCustomer: Customer | null;
    setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
    isEmailReceiptModalOpen: boolean;
    setIsEmailReceiptModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    emailReceiptAddress: string;
    setEmailReceiptAddress: React.Dispatch<React.SetStateAction<string>>;
    isReceiptPreviewOpen: boolean;
    setIsReceiptPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
    receiptPreviewHTML: string;
    setReceiptPreviewHTML: React.Dispatch<React.SetStateAction<string>>;
    activeSite: Site | undefined;
    user: User | null;
    settings: SystemConfig;
    subtotal: number;
    tax: number;
    taxBreakdown: any[];
    total: number;
    changeDue: number;
    isPaymentValid: boolean;
    processSale: any;
    clearCart: () => void;
    addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
    sales: SaleRecord[];
    
    // Discount code props
    cartDiscount: number;
    setCartDiscount: React.Dispatch<React.SetStateAction<number>>;
    setAppliedDiscountCode: React.Dispatch<React.SetStateAction<string | null>>;
    setAppliedDiscountCodeDetails: React.Dispatch<React.SetStateAction<any>>;
    setIsDiscountModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    discountCodeInput: string;
    setDiscountCodeInput: React.Dispatch<React.SetStateAction<string>>;
    setDiscountCodeError: React.Dispatch<React.SetStateAction<string>>;
    setIsValidatingCode: React.Dispatch<React.SetStateAction<boolean>>;
    validateDiscountCode: any;
    useDiscountCode: any;
}

export const usePOSCheckoutActions = ({
    cart,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    amountTendered,
    setAmountTendered,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    isProcessing,
    setIsProcessing,
    lastSale,
    setLastSale,
    earnedPointsData,
    setEarnedPointsData,
    showPointsPopup,
    setShowPointsPopup,
    selectedCustomer,
    setSelectedCustomer,
    isEmailReceiptModalOpen,
    setIsEmailReceiptModalOpen,
    emailReceiptAddress,
    setEmailReceiptAddress,
    isReceiptPreviewOpen,
    setIsReceiptPreviewOpen,
    receiptPreviewHTML,
    setReceiptPreviewHTML,
    activeSite,
    user,
    settings,
    subtotal,
    tax,
    taxBreakdown,
    total,
    changeDue,
    isPaymentValid,
    processSale,
    clearCart,
    addNotification,
    sales,
    cartDiscount,
    setCartDiscount,
    setAppliedDiscountCode,
    setAppliedDiscountCodeDetails,
    setIsDiscountModalOpen,
    discountCodeInput,
    setDiscountCodeInput,
    setDiscountCodeError,
    setIsValidatingCode,
    validateDiscountCode,
    useDiscountCode
}: UsePOSCheckoutActionsProps) => {

    const applyDiscountFromCode = React.useCallback((discountCode: any) => {
        let discountAmount = discountCode.type === 'FIXED' ? discountCode.value : subtotal * (discountCode.value / 100);
        if (discountCode.maxDiscountAmount !== undefined && discountAmount > discountCode.maxDiscountAmount) discountAmount = discountCode.maxDiscountAmount;
        setCartDiscount(discountAmount);
        setAppliedDiscountCode(discountCode.id);
        setAppliedDiscountCodeDetails({ code: discountCode.code, name: discountCode.name, type: discountCode.type, value: discountCode.value });
        setIsDiscountModalOpen(false);
        setDiscountCodeInput('');
        setDiscountCodeError('');
        addNotification('success', `Discount code "${discountCode.code}" applied!`);
    }, [subtotal, setCartDiscount, setAppliedDiscountCode, setAppliedDiscountCodeDetails, setIsDiscountModalOpen, setDiscountCodeInput, setDiscountCodeError, addNotification]);

    const handleValidateDiscountCode = React.useCallback(() => {
        if (!discountCodeInput.trim()) { setDiscountCodeError('Please enter a discount code'); return; }
        setIsValidatingCode(true);
        setDiscountCodeError('');
        setTimeout(() => {
            const result = validateDiscountCode(discountCodeInput, activeSite?.id, subtotal);
            if (result.valid && result.discountCode) {
                applyDiscountFromCode(result.discountCode);
                useDiscountCode(result.discountCode.id);
            } else {
                setDiscountCodeError(result.error || 'Invalid discount code');
            }
            setIsValidatingCode(false);
        }, 300);
    }, [discountCodeInput, activeSite?.id, subtotal, validateDiscountCode, applyDiscountFromCode, setDiscountCodeError, setIsValidatingCode, useDiscountCode]);

    const handleRemoveDiscount = React.useCallback(() => {
        setCartDiscount(0);
        setAppliedDiscountCode(null);
        setAppliedDiscountCodeDetails(null);
        setDiscountCodeInput('');
        setDiscountCodeError('');
        setIsDiscountModalOpen(false);
        addNotification('info', 'Discount removed');
    }, [setCartDiscount, setAppliedDiscountCode, setAppliedDiscountCodeDetails, setDiscountCodeInput, setDiscountCodeError, setIsDiscountModalOpen, addNotification]);

    const handleInitiatePayment = React.useCallback(() => {
        if (cart.length === 0) {
            addNotification('info', "Cart is empty. Add items to proceed to payment.");
            return;
        }
        setAmountTendered('');
        setSelectedPaymentMethod('Cash');
        setIsPaymentModalOpen(true);
    }, [cart, addNotification, setAmountTendered, setSelectedPaymentMethod, setIsPaymentModalOpen]);

    const handleProcessPayment = React.useCallback(async () => {
        if (!isPaymentValid) return;
        setIsProcessing(true);
        try {
            const tendered = selectedPaymentMethod === 'Cash' ? parseFloat(amountTendered) : total;
            const change = selectedPaymentMethod === 'Cash' ? changeDue : 0;
            
            let siteIdNum = activeSite?.siteNumber;
            if (siteIdNum === undefined && activeSite?.code) {
                const match = activeSite.code.match(/\d+/);
                if (match) siteIdNum = parseInt(match[0], 10);
            }
            
            let terminalId = localStorage.getItem('pos_terminal_id');
            if (!terminalId) {
                terminalId = String(Math.floor(Math.random() * 90) + 10); // 10 to 99
                localStorage.setItem('pos_terminal_id', terminalId);
            }
            
            const siteCode = siteIdNum || '0';
            const counterKey = `pos_receipt_counter_${activeSite?.id || 'default'}`;
            const prevCount = parseInt(localStorage.getItem(counterKey) || '0', 10);
            const nextCount = prevCount + 1;
            localStorage.setItem(counterKey, String(nextCount));
            
            const receiptNumber = `${siteCode}${terminalId}${nextCount.toString().padStart(5, '0')}`;
            const { saleId, pointsResult } = await processSale(cart, selectedPaymentMethod, user?.name || 'Cashier', tendered, change, selectedCustomer?.id, undefined, 'In-Store', taxBreakdown, receiptNumber, total);

            const saleObj: SaleRecord = {
                id: saleId,
                siteId: activeSite?.id || 'SITE-001',
                date: formatDateTime(new Date(), { showTime: true }),
                subtotal,
                tax,
                taxBreakdown,
                total,
                method: selectedPaymentMethod,
                status: 'Completed',
                items: [...cart],
                amountTendered: tendered,
                change,
                cashierName: user?.name,
                customerId: selectedCustomer?.id || undefined,
                receiptNumber
            };
            setLastSale(saleObj);
            if (pointsResult) {
                setEarnedPointsData(pointsResult);
                setShowPointsPopup(true);
            }
            setIsProcessing(false);
            setIsPaymentModalOpen(false);
            setIsReceiptModalOpen(true);
            clearCart();
            setSelectedCustomer(null);
        } catch (e) {
            addNotification('alert', "Error processing sale");
            setIsProcessing(false);
        }
    }, [
        isPaymentValid, selectedPaymentMethod, amountTendered, total, changeDue, activeSite, cart, user,
        taxBreakdown, processSale, clearCart, setSelectedCustomer, setLastSale, setEarnedPointsData,
        setShowPointsPopup, setIsPaymentModalOpen, setIsReceiptModalOpen, addNotification, setIsProcessing
    ]);

    const handlePrintReceipt = React.useCallback(() => {
        const {
            storeName = 'SIIFMART', posReceiptLogo, posReceiptShowLogo = true,
            posReceiptHeader = 'SIIFMART RETAIL', posReceiptFooter = 'Thank you for shopping with us!',
            posReceiptAddress, posReceiptPhone, posReceiptEmail, posReceiptTaxId, posReceiptPolicy,
            posReceiptSocialHandle, posReceiptEnableQR = true, posReceiptQRLink = 'https://siifmart.com/feedback',
            posReceiptWidth = '80mm', posReceiptFont = 'sans-serif'
        } = settings;
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
        setReceiptPreviewHTML(receiptHTML);
        setIsReceiptPreviewOpen(true);
    }, [settings, activeSite, lastSale, user, selectedCustomer, setReceiptPreviewHTML, setIsReceiptPreviewOpen]);

    const handleConfirmPrint = React.useCallback(() => {
        printHtmlContent(receiptPreviewHTML);
        setIsReceiptPreviewOpen(false);
        addNotification('success', 'Receipt sent to printer');
    }, [receiptPreviewHTML, setIsReceiptPreviewOpen, addNotification]);

    const handleEmailReceipt = React.useCallback(() => {
        setEmailReceiptAddress('');
        setIsEmailReceiptModalOpen(true);
    }, [setEmailReceiptAddress, setIsEmailReceiptModalOpen]);

    const handleConfirmEmailReceipt = React.useCallback(() => {
        if (emailReceiptAddress) {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                addNotification('success', `Digital Receipt for ${lastSale?.receiptNumber || lastSale?.id} sent to ${emailReceiptAddress}`);
                setIsEmailReceiptModalOpen(false);
            }, 1000);
        }
    }, [emailReceiptAddress, lastSale, setIsProcessing, addNotification, setIsEmailReceiptModalOpen]);

    const handleOpenDrawer = React.useCallback(() => {
        addNotification('info', "SYSTEM: Trigger sent to Cash Drawer (COM3) [KICK_DRAWER]");
    }, [addNotification]);

    const handleReprintLast = React.useCallback(() => {
        if (lastSale) {
            setIsReceiptModalOpen(true);
        } else if (sales.length > 0) {
            setLastSale(sales[0]);
            setIsReceiptModalOpen(true);
        } else {
            addNotification('info', "No recent transactions found in this session to reprint.");
        }
    }, [lastSale, sales, setLastSale, setIsReceiptModalOpen, addNotification]);

    return {
        handleInitiatePayment,
        handleProcessPayment,
        handlePrintReceipt,
        handleConfirmPrint,
        handleEmailReceipt,
        handleConfirmEmailReceipt,
        handleOpenDrawer,
        handleReprintLast,
        applyDiscountFromCode,
        handleValidateDiscountCode,
        handleRemoveDiscount
    };
};
