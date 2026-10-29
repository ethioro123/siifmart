import React from 'react';
import { CartItem, PaymentMethod, SaleRecord, Customer, Site, SystemConfig, User, DiscountCode } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import { printHtmlContent } from '../../../utils/printHelper';
import { getEffectiveCountry } from '../../../utils/localization';

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
    setShowCart?: React.Dispatch<React.SetStateAction<boolean>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
    sales: SaleRecord[];
    activeShift?: any;
    hasStaleCartPriceChanges: boolean;
    
    // Discount code props
    cartDiscount: number;
    setCartDiscount: React.Dispatch<React.SetStateAction<number>>;
    appliedDiscountCode: string | null;
    setAppliedDiscountCode: React.Dispatch<React.SetStateAction<string | null>>;
    setAppliedDiscountCodeDetails: React.Dispatch<React.SetStateAction<any>>;
    setIsDiscountModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    discountCodeInput: string;
    setDiscountCodeInput: React.Dispatch<React.SetStateAction<string>>;
    setDiscountCodeError: React.Dispatch<React.SetStateAction<string>>;
    setIsValidatingCode: React.Dispatch<React.SetStateAction<boolean>>;
    validateDiscountCode: (code: string, siteId?: string, subtotal?: number, targetCountry?: string) => { valid: boolean; discountCode?: DiscountCode; error?: string };
    useDiscountCode: (id: string) => void;
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
    setShowCart,
    addNotification,
    sales,
    activeShift,
    hasStaleCartPriceChanges,
    cartDiscount,
    setCartDiscount,
    appliedDiscountCode,
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

    const [isReprint, setIsReprint] = React.useState(false);

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
            const siteCountry = activeSite?.country || getEffectiveCountry(activeSite);
            const result = validateDiscountCode(discountCodeInput, activeSite?.id, subtotal, siteCountry);
            if (result.valid && result.discountCode) {
                applyDiscountFromCode(result.discountCode);
                useDiscountCode(result.discountCode.id);
            } else {
                setDiscountCodeError(result.error || 'Invalid discount code');
            }
            setIsValidatingCode(false);
        }, 300);
    }, [discountCodeInput, activeSite?.id, activeSite?.country, activeSite?.currency, subtotal, validateDiscountCode, applyDiscountFromCode, setDiscountCodeError, setIsValidatingCode, useDiscountCode]);

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
        if (hasStaleCartPriceChanges) {
            addNotification('alert', 'A product price changed while in the cart. Update the cart line before charging.');
            return;
        }
        setAmountTendered(Math.ceil(total).toString());
        setSelectedPaymentMethod('Cash');
        setIsPaymentModalOpen(true);
    }, [cart, total, hasStaleCartPriceChanges, addNotification, setAmountTendered, setSelectedPaymentMethod, setIsPaymentModalOpen]);

    const handleProcessPayment = React.useCallback(async (mobileDetails?: { channel?: string; ref?: string; phone?: string }) => {
        if (hasStaleCartPriceChanges) {
            addNotification('alert', 'A product price changed while in the cart. Update the cart line before charging.');
            setIsPaymentModalOpen(false);
            return;
        }
        if (!activeShift) {
            addNotification('alert', 'Zero-Trust Security: Cannot process sales without an active, verified shift. Please start your shift first.');
            setIsPaymentModalOpen(false);
            return;
        }
        if (!isPaymentValid) return;
        setIsProcessing(true);
        try {
            const tendered = selectedPaymentMethod === 'Cash' ? parseFloat(amountTendered) : total;
            const change = selectedPaymentMethod === 'Cash' ? changeDue : 0;
            
            const { saleId, receiptNumber, offlineReceiptNumber, pointsResult } = await processSale(
                cart, selectedPaymentMethod, user?.name || 'Cashier', tendered, change,
                selectedCustomer?.id, undefined, 'In-Store', taxBreakdown, undefined,
                total, appliedDiscountCode, mobileDetails
            );

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
                receiptNumber,
                offlineReceiptNumber,
                mobilePaymentChannel: mobileDetails?.channel,
                mobileTransactionRef: mobileDetails?.ref,
                customerPhone: mobileDetails?.phone
            };
            setLastSale(saleObj);
            setIsReprint(false);
            if (pointsResult) {
                setEarnedPointsData(pointsResult);
                setShowPointsPopup(true);
            }

            // Electron Desktop: Auto-kick cash drawer on cash payments
            if (selectedPaymentMethod === 'Cash' && typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                window.electronAPI.openCashDrawer().catch(() => {});
            }

            setIsProcessing(false);
            setIsPaymentModalOpen(false);
            setIsReceiptModalOpen(true);
            clearCart();
            setSelectedCustomer(null);
            setShowCart?.(false);
        } catch (e) {
            addNotification('alert', "Error processing sale");
            setIsProcessing(false);
        }
    }, [
        isPaymentValid, selectedPaymentMethod, amountTendered, total, changeDue, activeSite, cart, user,
        taxBreakdown, processSale, clearCart, setShowCart, setSelectedCustomer, setLastSale, setEarnedPointsData,
        setShowPointsPopup, setIsPaymentModalOpen, setIsReceiptModalOpen, addNotification, setIsProcessing, activeShift,
        hasStaleCartPriceChanges
    ]);

    const handlePrintReceipt = React.useCallback((options?: { isReprint?: boolean }) => {
        const reprintActive = options?.isReprint !== undefined ? options.isReprint : isReprint;
        const {
            storeName = 'SIIFMART', logoUrl, posReceiptLogo, posReceiptShowLogo = true,
            posReceiptHeader = 'SIIFMART RETAIL', posReceiptFooter = 'Thank you for shopping with us!',
            posReceiptAddress, posReceiptPhone, posReceiptEmail, posReceiptTaxId, posReceiptPolicy,
            posReceiptSocialHandle, posReceiptEnableQR = true, posReceiptQRLink = 'https://siifmart.com/feedback',
            posReceiptWidth = '80mm', posReceiptFont = 'sans-serif', slogan
        } = settings;
        const displayStoreName = storeName || activeSite?.name || 'SIIFMART';
        const displayLogo = posReceiptLogo || logoUrl;
        const displayHeader = posReceiptHeader || 'SIIFMART RETAIL';
        const displaySlogan = slogan && slogan !== displayHeader ? slogan : '';
        const paperWidth = posReceiptWidth === '80mm' ? '80mm' : '58mm';
        const isKenya = activeSite?.country === 'KE' || settings?.country === 'KE' || settings?.currency === 'KES' || settings?.currency === 'KSh';
        const receiptCurrency = (activeSite as any)?.currency || (isKenya ? 'KES' : 'ETB');

        const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${lastSale?.receiptNumber || 'TX'}</title>
        <style>
          @page { size: ${paperWidth} auto; margin: 0; }
          body { font-family: ${posReceiptFont === 'monospace' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'system-ui, -apple-system, sans-serif'}; width: ${paperWidth}; margin: 0; padding: 24px; color: #000; background: #fff; -webkit-print-color-adjust: exact; font-size: 10px; }
          .text-center { text-align: center; } .text-right { text-align: right; } .flex { display: flex; } .justify-between { justify-content: space-between; } .justify-center { justify-center; } .gap-2 { gap: 8px; } .mb-1 { margin-bottom: 4px; } .mb-4 { margin-bottom: 16px; } .pb-4 { padding-bottom: 16px; } .py-3 { padding-top: 12px; padding-bottom: 12px; } .pt-2 { padding-top: 8px; } .mt-2 { margin-top: 8px; } .space-y-05 > * + * { margin-top: 2px; } .space-y-1 > * + * { margin-top: 4px; } .space-y-2 > * + * { margin-top: 8px; }
          .font-bold { font-weight: 700; } .font-black { font-weight: 900; } .uppercase { text-transform: uppercase; } .tracking-tighter { letter-spacing: -0.05em; } .tracking-widest { letter-spacing: 0.1em; } .text-xs { font-size: 12px; } .text-base { font-size: 16px; } .text-xl { font-size: 20px; } .border-b-2-dashed { border-bottom: 2px dashed rgba(0,0,0,0.1); } .border-y { border-top: 1px solid rgba(0,0,0,0.1); border-bottom: 1px solid rgba(0,0,0,0.1); } .border-t-black { border-top: 1px solid #000; } .border-t-dashed { border-top: 1px dashed rgba(0,0,0,0.1); } .logo { max-height: 48px; object-fit: contain; margin: 0 auto; filter: grayscale(1); display: block; } .opacity-60 { opacity: 0.6; }
        </style>
      </head>
      <body>
          ${posReceiptShowLogo && displayLogo ? `<div class="flex justify-center mb-4"><img src="${displayLogo}" class="logo" /></div>` : ''}
          <div class="text-center border-b-2-dashed pb-4 mb-4">
            <h2 class="text-xl font-black uppercase tracking-tighter leading-none mb-1">${displayStoreName}</h2>
            <p class="text-[10px] font-bold uppercase tracking-widest opacity-80">${displayHeader}</p>
            ${displaySlogan ? `<p class="text-[9px] italic opacity-70 mt-0.5">${displaySlogan}</p>` : ''}
            ${reprintActive ? `<div class="text-center font-black text-[10px] tracking-widest my-2 border-y border-dashed py-1">*** REPRINT / DUPLICATE ***</div>` : ''}
          </div>
          <div class="text-[10px] text-center space-y-05 mb-4 border-b-2-dashed pb-4">
            ${posReceiptAddress ? `<p>${posReceiptAddress}</p>` : ''}
            <div class="flex justify-center gap-2">
              ${posReceiptPhone ? `<p>Tel: ${posReceiptPhone}</p>` : ''}
              ${posReceiptEmail ? `<p>Email: ${posReceiptEmail}</p>` : ''}
            </div>
            ${posReceiptTaxId ? `<p class="font-bold">${isKenya ? 'KRA PIN' : 'TIN'}: ${posReceiptTaxId}</p>` : ''}
            ${isKenya ? '<p class="text-[8px] opacity-70">eTIMS Compliant - Valid Tax Invoice</p>' : ''}
          </div>
          <div class="text-[10px] space-y-1 mb-4">
            <div class="flex justify-between"><span class="opacity-60">DATE:</span> <span>${formatDateTime(new Date(), { showTime: true })}</span></div>
            <div class="flex justify-between"><span class="opacity-60">RECEIPT:</span> <span class="font-bold">${lastSale?.receiptNumber || 'TEMPORARY'}</span></div>
            <div class="flex justify-between"><span class="opacity-60">CASHIER:</span> <span>${user?.name || 'ADMINISTRATOR'}</span></div>
            ${selectedCustomer ? `<div class="flex justify-between"><span class="opacity-60">CUSTOMER:</span> <span>${selectedCustomer.name}</span></div>` : ''}
          </div>
          <div class="border-y py-3 mb-4 space-y-2">
            ${(lastSale?.items || []).map(item => `<div class="flex justify-between text-[10px]"><div><div class="font-bold">${item.name}</div><div class="text-[9px] opacity-60">${item.quantity} x ${receiptCurrency} ${Math.round(item.price).toLocaleString()}</div></div><div class="font-bold">${receiptCurrency} ${Math.round(item.price * item.quantity).toLocaleString()}</div></div>`).join('')}
          </div>
          <div class="space-y-1 text-right mb-4">
            <div class="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>${receiptCurrency} ${Math.round(lastSale?.subtotal || 0).toLocaleString()}</span></div>
            ${(lastSale?.taxBreakdown || []).length > 0 ? (lastSale?.taxBreakdown || []).map(rule => `<div class="flex justify-between text-[10px] opacity-60"><span>${rule.name} (${rule.rate}%)</span><span>${receiptCurrency} ${Math.round(rule.amount).toLocaleString()}</span></div>`).join('') : (lastSale?.tax && lastSale.tax > 0) ? `<div class="flex justify-between text-[10px] opacity-60"><span>Tax</span><span>${receiptCurrency} ${Math.round(lastSale.tax).toLocaleString()}</span></div>` : ''}
            <div class="flex justify-between font-black text-base border-t-black pt-2 mt-2"><span>TOTAL</span> <span>${receiptCurrency} ${Math.round(lastSale?.total || 0).toLocaleString()}</span></div>
          </div>
          <div class="text-[10px] font-bold border-t-dashed pt-4 mb-4">
            <div class="flex justify-between">
              <span>PAID (${lastSale?.mobilePaymentChannel ? lastSale.mobilePaymentChannel.replace(/_/g, ' ') : (lastSale?.method || 'CASH').toUpperCase()})</span>
              <span>${receiptCurrency} ${Math.round(lastSale?.amountTendered || lastSale?.total || 0).toLocaleString()}</span>
            </div>
            ${lastSale?.mobileTransactionRef ? `
              <div class="flex justify-between text-[9px] opacity-75 font-mono mt-0.5">
                <span>TX REF:</span>
                <span class="font-bold">${lastSale.mobileTransactionRef}</span>
              </div>
            ` : ''}
            ${lastSale?.customerPhone ? `
              <div class="flex justify-between text-[9px] opacity-60 font-mono">
                <span>PHONE:</span>
                <span>${lastSale.customerPhone}</span>
              </div>
            ` : ''}
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
    }, [settings, activeSite, lastSale, user, selectedCustomer, isReprint, setReceiptPreviewHTML, setIsReceiptPreviewOpen]);

    const handleConfirmPrint = React.useCallback(() => {
        printHtmlContent(receiptPreviewHTML);
        setIsReceiptPreviewOpen(false);
        addNotification('info', 'Receipt print dialog opened. Confirm output on thermal printer.');
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
        if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
            window.electronAPI.openCashDrawer().then(res => {
                if (res.success) {
                    addNotification('success', "Cash Drawer Opened");
                } else {
                    addNotification('alert', `Drawer pulse sent (${res.error || 'Check printer/drawer cable'})`);
                }
            });
        } else {
            addNotification('info', "SYSTEM: Trigger sent to Cash Drawer (COM3) [KICK_DRAWER]");
        }
    }, [addNotification]);

    const handleReprintLast = React.useCallback(() => {
        setIsReprint(true);
        if (lastSale) {
            setIsReceiptModalOpen(true);
        } else if (sales.length > 0) {
            // Zero-Trust Rule: Cashiers can ONLY reprint their own active shift transactions
            const currentCashierId = user?.id;
            const currentCashierName = user?.name;
            const shiftStartTime = activeShift?.startTime ? new Date(activeShift.startTime).getTime() : 0;

            const myShiftSales = sales.filter(s => {
                const matchesSite = !activeSite?.id || s.siteId === activeSite.id || (s as any).site_id === activeSite.id;
                const sAny = s as any;
                const matchesCashier = (currentCashierId && (sAny.cashierId === currentCashierId || sAny.cashier_id === currentCashierId)) ||
                                       (currentCashierName && (sAny.cashierName === currentCashierName || sAny.cashier === currentCashierName));
                const matchesShift = shiftStartTime > 0 ? new Date(s.date).getTime() >= shiftStartTime : true;
                return matchesSite && matchesCashier && matchesShift;
            });

            const sorted = [...myShiftSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (sorted[0]) {
                setLastSale(sorted[0]);
                setIsReceiptModalOpen(true);
            } else {
                addNotification('info', "No transactions found in your active shift to reprint.");
            }
        } else {
            addNotification('info', "No transactions found in your active shift to reprint.");
        }
    }, [lastSale, sales, activeSite, user, activeShift, setLastSale, setIsReceiptModalOpen, addNotification]);

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
