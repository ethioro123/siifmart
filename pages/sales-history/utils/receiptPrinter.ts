import { formatDateTime } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import { SaleRecord, Site } from '../../../types';
import { printHtmlContent } from '../../../utils/printHelper';

export const triggerReceiptPrint = (selectedSale: SaleRecord, settings: any, sites: Site[]) => {
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

      const saleSite = sites.find(s => s.id === selectedSale.siteId);
      const displayStoreName = storeName || saleSite?.name || 'SIIFMART';
      const is80mm = posReceiptWidth === '80mm';
      const paperWidth = is80mm ? '80mm' : '58mm';

      const htmlContent = `
             <!DOCTYPE html>
             <html>
             <head>
               <title>Receipt - ${selectedSale.receiptNumber || 'TX'}</title>
               <style>
                 @page { size: ${paperWidth} auto; margin: 0; }
                 body { 
                   font-family: ${posReceiptFont === 'monospace' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'system-ui, -apple-system, sans-serif'}; 
                   width: ${paperWidth}; 
                   margin: 0; 
                   padding: 24px;
                   color: #000;
                   background: #fff;
                   -webkit-print-color-adjust: exact;
                   font-size: 10px;
                 }
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
                 .font-bold { font-weight: 700; }
                 .font-black { font-weight: 900; }
                 .uppercase { text-transform: uppercase; }
                 .tracking-tighter { letter-spacing: -0.05em; }
                 .tracking-widest { letter-spacing: 0.1em; }
                 .italic { font-style: italic; }
                 .leading-none { line-height: 1; }
                 .leading-tight { line-height: 1.25; }
                 .text-[9px] { font-size: 9px; }
                 .text-[10px] { font-size: 10px; }
                 .text-xs { font-size: 12px; }
                 .text-base { font-size: 16px; }
                 .text-xl { font-size: 20px; }
                 .opacity-60 { opacity: 0.6; }
                 .opacity-70 { opacity: 0.7; }
                 .opacity-80 { opacity: 0.8; }
                 .border-b-2-dashed { border-bottom: 2px dashed rgba(0,0,0,0.1); }
                 .border-y { border-top: 1px solid rgba(0,0,0,0.1); border-bottom: 1px solid rgba(0,0,0,0.1); }
                 .border-t-black { border-top: 1px solid #000; }
                 .border-t-dashed { border-top: 1px dashed rgba(0,0,0,0.1); }
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
                    <div class="flex justify-between">
                       <span class="opacity-60">DATE:</span>
                       <span>${formatDateTime(selectedSale.date, { showTime: true })}</span>
                    </div>
                    <div class="flex justify-between">
                       <span class="opacity-60">RECEIPT #:</span>
                       <span class="font-bold">${selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).toUpperCase()}`}</span>
                    </div>
                    <div class="flex justify-between">
                       <span class="opacity-60">CASHIER:</span>
                       <span>${selectedSale.cashierName || 'ADMINISTRATOR'}</span>
                    </div>
                    ${selectedSale.customerName ? `
                    <div class="flex justify-between">
                       <span class="opacity-60">CUSTOMER:</span>
                       <span>${selectedSale.customerName}</span>
                    </div>` : ''}
                 </div>
                 <div class="border-y py-3 mb-4 space-y-2">
                    ${selectedSale.items.map(item => `
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
                    <div class="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>${selectedSale.subtotal.toLocaleString()}</span></div>
                    ${selectedSale.taxBreakdown ? selectedSale.taxBreakdown.map(rule => `
                      <div class="flex justify-between text-[10px] opacity-60">
                        <span>${rule.name} (${rule.rate}%)</span>
                        <span>${rule.amount.toLocaleString()}</span>
                      </div>
                    `).join('') : `
                      <div class="flex justify-between text-[10px] opacity-60">
                        <span>Tax</span>
                        <span>${selectedSale.tax.toLocaleString()}</span>
                      </div>
                    `}
                    ${(selectedSale.subtotal + selectedSale.tax - selectedSale.total) > 0.01 ? `
                      <div class="flex justify-between text-[10px] opacity-60">
                        <span>Discount</span>
                        <span>-${(selectedSale.subtotal + selectedSale.tax - selectedSale.total).toLocaleString()}</span>
                      </div>
                    ` : ''}
                    <div class="flex justify-between font-black text-base border-t-black pt-2 mt-2">
                       <span>TOTAL</span>
                       <span>${CURRENCY_SYMBOL} ${selectedSale.total.toLocaleString()}</span>
                    </div>
                 </div>
                 <div class="text-[10px] font-bold border-t-dashed pt-4 mb-4">
                    <div class="flex justify-between">
                       <span>PAID (${selectedSale.method.toUpperCase()})</span>
                       <span>${CURRENCY_SYMBOL} ${selectedSale.total.toLocaleString()}</span>
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
             </body>
             </html>
      `;
      printHtmlContent(htmlContent);
};
