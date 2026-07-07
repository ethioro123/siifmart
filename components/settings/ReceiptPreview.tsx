import React from 'react';
import { SystemConfig } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatDateTime } from '../../utils/formatting';

interface ReceiptPreviewProps {
  settings: Partial<SystemConfig>;
}

export function ReceiptPreview({ settings }: ReceiptPreviewProps) {
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

  const displayStoreName = storeName || 'SIIFMART';
  const is80mm = posReceiptWidth === '80mm';
  const paperWidth = is80mm ? '80mm' : '58mm';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
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
          <div class="flex justify-between"><span class="opacity-60">RECEIPT:</span> <span class="font-bold">TX-8829-1029</span></div>
          <div class="flex justify-between"><span class="opacity-60">CASHIER:</span> <span>ADMINISTRATOR</span></div>
        </div>

        <div class="border-y py-3 mb-4 space-y-2">
          <div class="flex justify-between text-[10px]">
              <div>
                  <div class="font-bold">MacBook Pro 14"</div>
                  <div class="text-[9px] opacity-60">1 x ${CURRENCY_SYMBOL}2,499.00</div>
              </div>
              <div class="font-bold">${CURRENCY_SYMBOL}2,499.00</div>
          </div>
          <div class="flex justify-between text-[10px]">
              <div>
                  <div class="font-bold">Magic Mouse</div>
                  <div class="text-[9px] opacity-60">2 x ${CURRENCY_SYMBOL}79.00</div>
              </div>
              <div class="font-bold">${CURRENCY_SYMBOL}158.00</div>
          </div>
        </div>

        <div class="space-y-1 text-right mb-4">
          <div class="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>${CURRENCY_SYMBOL}2,657.00</span></div>
          <div class="flex justify-between text-[10px] opacity-60"><span>Tax (${settings.taxRate || 0}%)</span><span>${CURRENCY_SYMBOL}${(2657 * (settings.taxRate || 0) / 100).toFixed(2)}</span></div>
          <div class="flex justify-between font-black text-base border-t-black pt-2 mt-2"><span>TOTAL</span> <span>${CURRENCY_SYMBOL}3,055.55</span></div>
        </div>

        <div class="text-[10px] font-bold border-t-dashed pt-4 mb-4">
          <div class="flex justify-between">
            <span>PAID (CARD)</span>
            <span>${CURRENCY_SYMBOL}3,055.55</span>
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

  return (
    <div className={`bg-white shadow-2xl rounded-lg overflow-hidden border border-black/10 flex flex-col ${is80mm ? 'w-[320px]' : 'w-[240px]'} h-[500px]`}>
      <iframe
        srcDoc={html}
        title="Receipt Preview"
        className="w-full h-full border-none"
      />
    </div>
  );
}
