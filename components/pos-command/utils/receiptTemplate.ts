import { CURRENCY_SYMBOL } from '../../../constants';

export function generateReprintReceiptHtml(
    lastSale: any,
    siteName: string = 'SIIFMART',
    cashierName: string = 'Staff'
): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reprint Receipt</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; width: 80mm; margin: 0; padding: 20px; color: #000; background: #fff; font-size: 11px; }
          .text-center { text-align: center; } .text-right { text-align: right; }
          .flex { display: flex; } .justify-between { justify-content: space-between; }
          .font-bold { font-weight: 700; } .font-black { font-weight: 900; }
          .border-b { border-bottom: 1px dashed #999; } .my-2 { margin: 8px 0; } .py-1 { padding: 4px 0; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h2 style="margin: 0; font-size: 16px;">${siteName}</h2>
          <p style="margin: 2px 0; font-size: 10px; color: #555;">REPRINT RECEIPT</p>
          <p style="margin: 2px 0; font-size: 10px;">${lastSale.receiptNumber || `REC-${lastSale.id.slice(0, 8).toUpperCase()}`}</p>
          <p style="margin: 2px 0; font-size: 9px; color: #666;">${new Date(lastSale.date).toLocaleString()}</p>
        </div>
        <div class="border-b my-2"></div>
        <div>
          ${(lastSale.items || []).map((item: any) => `
            <div class="flex justify-between py-1">
              <span>${item.quantity}x ${item.name}</span>
              <span class="font-bold">${CURRENCY_SYMBOL} ${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
        <div class="border-b my-2"></div>
        <div class="flex justify-between py-1">
          <span>Subtotal:</span>
          <span>${CURRENCY_SYMBOL} ${(lastSale.subtotal || lastSale.total).toLocaleString()}</span>
        </div>
        <div class="flex justify-between py-1">
          <span>Tax:</span>
          <span>${CURRENCY_SYMBOL} ${(lastSale.tax || 0).toLocaleString()}</span>
        </div>
        <div class="flex justify-between py-1 font-black" style="font-size: 13px;">
          <span>TOTAL:</span>
          <span>${CURRENCY_SYMBOL} ${lastSale.total.toLocaleString()}</span>
        </div>
        <div class="flex justify-between py-1">
          <span>Payment (${lastSale.method}):</span>
          <span>${CURRENCY_SYMBOL} ${(lastSale.amountTendered || lastSale.total).toLocaleString()}</span>
        </div>
        ${lastSale.change ? `
          <div class="flex justify-between py-1">
            <span>Change:</span>
            <span>${CURRENCY_SYMBOL} ${lastSale.change.toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="border-b my-2"></div>
        <div class="text-center" style="font-size: 9px; color: #777; margin-top: 10px;">
          <p>Cashier: ${lastSale.cashierName || cashierName}</p>
          <p>Thank you for shopping with SIIFMART!</p>
        </div>
      </body>
      </html>
    `;
}
export function generateZReportReceiptHtml(
    shift: any,
    summary?: any,
    siteName: string = 'SIIFMART Branch',
    auditorName?: string
): string {
    const shiftRef = shift.shiftNumber || (shift.id ? `SHF-${shift.id.slice(0, 8).toUpperCase()}` : 'SHF-CURRENT');
    const startTimeStr = shift.startTime ? new Date(shift.startTime).toLocaleString() : 'N/A';
    const endTimeStr = shift.endTime ? new Date(shift.endTime).toLocaleString() : new Date().toLocaleString();

    const openingFloat = Number(shift.openingFloat || 0);
    const cashSales = Number(shift.cashSales ?? summary?.cash ?? 0);
    const cardSales = Number(shift.cardSales ?? summary?.card ?? 0);
    const mobileSales = Number(shift.mobileSales ?? summary?.mobile ?? 0);
    const totalSales = cashSales + cardSales + mobileSales;

    const expectedCash = Number(shift.expectedCash ?? (openingFloat + cashSales));
    const actualCash = Number(shift.actualCash ?? 0);
    const variance = Number(shift.variance ?? (actualCash - expectedCash));
    const isVariance = Math.abs(variance) > 0.01;

    const denominations = shift.denominations || {};

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Z-Report - ${shiftRef}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; width: 80mm; margin: 0; padding: 16px; color: #000; background: #fff; font-size: 11px; }
          .text-center { text-align: center; } .text-right { text-align: right; }
          .flex { display: flex; } .justify-between { justify-content: space-between; }
          .font-bold { font-weight: 700; } .font-black { font-weight: 900; }
          .border-b { border-bottom: 1px dashed #777; } .border-t { border-top: 1px dashed #777; }
          .my-2 { margin: 8px 0; } .py-1 { padding: 3px 0; }
          .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; margin: 6px 0 2px 0; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h2 style="margin: 0; font-size: 15px; font-weight: 900;">${siteName}</h2>
          <p style="margin: 2px 0; font-size: 11px; font-weight: 900; letter-spacing: 0.1em;">*** OFFICIAL Z-REPORT ***</p>
          <p style="margin: 1px 0; font-size: 9px; color: #555;">END-OF-DAY SHIFT RECONCILIATION</p>
          <p style="margin: 3px 0; font-size: 10px; font-family: monospace; font-weight: 700;">${shiftRef}</p>
        </div>

        <div class="border-b my-2"></div>

        <div>
          <div class="flex justify-between py-1"><span>Cashier:</span><span class="font-bold">${shift.cashierName || 'Staff'}</span></div>
          <div class="flex justify-between py-1"><span>Station:</span><span>${siteName}</span></div>
          <div class="flex justify-between py-1"><span>Opened:</span><span>${startTimeStr}</span></div>
          <div class="flex justify-between py-1"><span>Closed:</span><span>${endTimeStr}</span></div>
          <div class="flex justify-between py-1"><span>Status:</span><span class="font-bold">${shift.status || 'Closed'}</span></div>
        </div>

        <div class="border-b my-2"></div>
        <div class="section-title">Sales by Tender Breakdown</div>

        <div class="flex justify-between py-1"><span>Cash Sales:</span><span class="font-bold">${CURRENCY_SYMBOL} ${cashSales.toLocaleString()}</span></div>
        <div class="flex justify-between py-1"><span>${CURRENCY_SYMBOL === 'KES' || CURRENCY_SYMBOL === 'KSh' ? 'M-Pesa' : 'Telebirr'}:</span><span>${CURRENCY_SYMBOL} ${mobileSales.toLocaleString()}</span></div>
        <div class="flex justify-between py-1"><span>Bank / Card:</span><span>${CURRENCY_SYMBOL} ${cardSales.toLocaleString()}</span></div>
        <div class="border-t my-2"></div>
        <div class="flex justify-between py-1 font-black" style="font-size: 12px;">
          <span>GROSS REVENUE:</span>
          <span>${CURRENCY_SYMBOL} ${totalSales.toLocaleString()}</span>
        </div>

        <div class="border-b my-2"></div>
        <div class="section-title">Cash Drawer Reconciliation</div>

        <div class="flex justify-between py-1"><span>Opening Float:</span><span>${CURRENCY_SYMBOL} ${openingFloat.toLocaleString()}</span></div>
        <div class="flex justify-between py-1"><span>(+) Cash Collected:</span><span>${CURRENCY_SYMBOL} ${cashSales.toLocaleString()}</span></div>
        <div class="flex justify-between py-1 font-bold"><span>(=) Expected Cash:</span><span>${CURRENCY_SYMBOL} ${expectedCash.toLocaleString()}</span></div>
        <div class="flex justify-between py-1 font-bold"><span>(x) Counted Cash:</span><span>${CURRENCY_SYMBOL} ${actualCash.toLocaleString()}</span></div>

        <div class="border-t my-2"></div>
        <div class="flex justify-between py-1 font-black" style="font-size: 12px;">
          <span>CASH VARIANCE:</span>
          <span style="color: ${isVariance ? '#c00' : '#070'};">
            ${variance > 0 ? '+' : ''}${CURRENCY_SYMBOL} ${variance.toLocaleString()}
            (${!isVariance ? 'BALANCED' : variance > 0 ? 'SURPLUS' : 'SHORTAGE'})
          </span>
        </div>

        ${Object.keys(denominations).length > 0 ? `
          <div class="border-b my-2"></div>
          <div class="section-title">Physical Denomination Tray</div>
          ${Object.entries(denominations)
            .sort(([a], [b]) => Number(b) - Number(a))
            .filter(([, count]) => Number(count) > 0)
            .map(([denom, count]) => `
              <div class="flex justify-between py-1 font-mono" style="font-size: 10px;">
                <span>${denom} ETB note x ${count}</span>
                <span>${CURRENCY_SYMBOL} ${(Number(denom) * Number(count)).toLocaleString()}</span>
              </div>
            `).join('')}
        ` : ''}

        ${shift.discrepancyReason ? `
          <div class="border-b my-2"></div>
          <div class="section-title">Discrepancy Explanation</div>
          <p style="margin: 2px 0; font-size: 10px; font-style: italic;">"${shift.discrepancyReason}"</p>
        ` : ''}

        <div class="border-b my-2"></div>
        <div class="section-title">Dual-Control Audit Signatures</div>

        <div style="margin-top: 14px;">
          <div class="flex justify-between" style="font-size: 9px; margin-bottom: 2px;">
            <span>Cashier: _______________________</span>
            <span>Date: ____________</span>
          </div>
          <div class="flex justify-between" style="font-size: 9px; margin-top: 10px;">
            <span>Supervisor: ____________________</span>
            <span>Date: ____________</span>
          </div>
          ${auditorName || shift.reconciledBy ? `
            <p style="margin: 8px 0 0 0; font-size: 9px; color: #2C5E3B; font-weight: bold;">
              ✓ HQ Audit Signed-Off By: ${auditorName || shift.reconciledBy}
            </p>
          ` : ''}
        </div>

        <div class="border-b my-2"></div>
        <div class="text-center" style="font-size: 8px; color: #777; margin-top: 8px;">
          <p>Zero-Trust Central Oversight • Real-Time Database Sync</p>
          <p>SIIFMART Retail Systems • Ethiopia</p>
        </div>
      </body>
      </html>
    `;
}
