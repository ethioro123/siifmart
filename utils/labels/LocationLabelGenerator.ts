import { generateBarcodeSVG } from '../barcodeGenerator';
import { generateQRCode } from '../qrCodeGenerator';
import { LabelSize, LabelFormat, SIZE_CSS } from './types';

export interface LocationLabelItem {
    humanLabel: string;   // e.g. "A-01-05"
    barcode: string;      // 15-digit encoded barcode
    zone: string;         // e.g. "A"
    aisle: string;        // e.g. "01"
    bay: string;          // e.g. "05"
    siteName?: string;
    siteCode?: string;
}

export const generateLocationLabelHTML = async (
    items: LocationLabelItem[],
    options: {
        size: LabelSize | string;
        format: LabelFormat | string;
    }
): Promise<string> => {
    const { size, format } = options;

    const normalizedSize = (s: string): LabelSize => {
        const lower = s.toLowerCase();
        if (lower === 'small') return 'Small';
        if (lower === 'medium') return 'Medium';
        if (lower === 'large' || lower === 'xl') return 'Large';
        return 'Medium';
    };

    const normalizedFormat = (f: string): LabelFormat => {
        const lower = f.toLowerCase();
        if (lower === 'barcode') return 'Barcode';
        if (lower === 'qr') return 'QR';
        if (lower === 'both') return 'Both';
        return 'Barcode';
    };

    const validSize = normalizedSize(size);
    const validFormat = normalizedFormat(format);
    const css = SIZE_CSS[validSize];

    const isSmall = validSize === 'Small';
    const isMedium = validSize === 'Medium';
    const isLarge = validSize === 'Large';
    const isXL = validSize === 'XL';

    const labelItemsHTML = await Promise.all(items.map(async (item, idx) => {
        const pageInfo = items.length > 1
            ? `<div style="position:absolute;bottom:4px;right:6px;font-size:7px;color:#999;font-family:monospace;font-weight:700;letter-spacing:1px;">L-${idx + 1}/${items.length}</div>`
            : '';

        // Generate codes
        const showBarcode = validFormat === 'Barcode' || validFormat === 'Both';
        const showQR = validFormat === 'QR' || validFormat === 'Both';

        const barcodeObj = showBarcode ? generateBarcodeSVG(item.barcode, {
            format: 'CODE128',
            width: isSmall ? 1.3 : isMedium ? 1.6 : 2.0,
            height: isSmall ? 24 : isMedium ? 32 : 45,
            displayValue: false,
            margin: 0
        }) : '';

        const qrData = JSON.stringify({ loc: item.humanLabel, code: item.barcode, zone: item.zone });
        const qrObj = showQR ? await generateQRCode({
            data: qrData,
            size: isSmall ? 85 : isMedium ? 110 : 145
        }) : '';

        const parts = item.humanLabel.split('-');
        const partZone = parts[0] || item.zone || 'A';
        const partAisle = parts[1] || item.aisle || '01';
        const partBay = parts[2] || item.bay || '01';

        let contentHTML = '';

        if (isSmall) {
            // SMALL (2x1): Sharp, geometric
            contentHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:4px;background:#fff;color:#000;font-family:'Inter',sans-serif;border:1px solid #000;">
                    <div style="font-size:31px;font-weight:900;letter-spacing:2px;line-height:0.9;margin-bottom:6px;">${item.humanLabel}</div>
                    <div style="display:flex;align-items:center;gap:13px;width:100%;justify-content:center;">
                        ${showQR ? `<div class="qr-container" style="width:0.8in;">${qrObj}</div>` : ''}
                        ${showBarcode ? `
                            <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
                                <div class="barcode-container" style="width:100%;display:flex;justify-content:center;">${barcodeObj}</div>
                                <div style="font-family:'SF Mono', 'Fira Code', monospace;font-size:9px;font-weight:900;letter-spacing:1px;margin-top:4px;color:#000;">${item.barcode}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else if (isMedium) {
            // MEDIUM (3x2): Premium Futuristic Typography
            contentHTML = `
                <div style="display:flex;flex-direction:column;height:100%;padding:13px;background:#fff;color:#000;font-family:'Inter',sans-serif;border:4px solid #000;position:relative;">
                    <!-- Top Bar -->
                    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px;border-bottom:3px solid #000;padding-bottom:8px;">
                        <div style="display:flex;flex-direction:column;">
                            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#666;">&nbsp;</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:13px;font-weight:900;letter-spacing:1px;background:#000;color:#fff;padding:3px 10px;display:inline-block;">ZONE: ${item.zone}</div>
                        </div>
                    </div>

                    <!-- Hero Location -->
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:8px 0;">
                        <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;">
                            <div style="display:flex;flex-direction:column;align-items:center;">
                                <div style="font-size:55px;font-weight:900;letter-spacing:4px;line-height:0.8;">${partZone}</div>
                                <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-top:5px;color:#999;">ZONE</div>
                            </div>
                            <div style="font-size:42px;font-weight:900;color:#eee;line-height:0.8;padding-top:3px;">-</div>
                            <div style="display:flex;flex-direction:column;align-items:center;">
                                <div style="font-size:55px;font-weight:900;letter-spacing:4px;line-height:0.8;">${partAisle}</div>
                                <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-top:5px;color:#999;">AISLE</div>
                            </div>
                            <div style="font-size:42px;font-weight:900;color:#eee;line-height:0.8;padding-top:3px;">-</div>
                            <div style="display:flex;flex-direction:column;align-items:center;">
                                <div style="font-size:55px;font-weight:900;letter-spacing:4px;line-height:0.8;">${partBay}</div>
                                <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-top:5px;color:#999;">BAY</div>
                            </div>
                        </div>
                    </div>

                    <!-- Code Section -->
                    <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:10px;">
                        ${showQR ? `<div class="qr-container" style="width:1.1in;border:1px solid #000;padding:5px;">${qrObj}</div>` : ''}
                        ${showBarcode ? `
                            <div style="flex:1;max-width:2.86in;display:flex;flex-direction:column;align-items:center;">
                                <div class="barcode-container" style="display:flex;justify-content:center;width:100%;">${barcodeObj}</div>
                                <div style="font-family:'SF Mono', 'Fira Code', monospace;font-size:12px;font-weight:900;letter-spacing:2px;color:#000;margin-top:6px;">${item.barcode}</div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Footer -->
                    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid #000;">
                        <div style="font-size:10px;font-family:monospace;font-weight:700;letter-spacing:2px;">&nbsp;</div>
                        ${item.siteName ? `<div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;text-align:right;">${item.siteName}</div>` : ''}
                    </div>
                </div>
            `;
        } else {
            // LARGE (4x3): High-End Technical Blueprint
            contentHTML = `
                <div style="display:flex;flex-direction:column;height:100%;padding:20px;background:#fff;color:#000;font-family:'Inter',sans-serif;border:5px solid #000;position:relative;overflow:hidden;">
                    <!-- Technical Grid Accents -->
                    <div style="position:absolute;top:0;left:0;width:40px;height:40px;border-right:1px solid #eee;border-bottom:1px solid #eee;"></div>
                    <div style="position:absolute;top:0;right:0;width:40px;height:40px;border-left:1px solid #eee;border-bottom:1px solid #eee;"></div>

                    <!-- Header -->
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
                        <div style="display:flex;flex-direction:column;gap:6px;">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <div style="width:16px;height:16px;background:#000;"></div>
                            </div>
                            <div style="height:3px;width:200px;background:#000;"></div>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:flex-end;">
                            <div style="font-size:18px;font-weight:900;background:#000;color:#fff;padding:5px 16px;letter-spacing:2px;">ZONE ${item.zone}</div>
                            <div style="font-size:10px;font-weight:700;margin-top:5px;letter-spacing:1px;color:#666;">REF: AX-9000</div>
                        </div>
                    </div>

                    <!-- Hero Section -->
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #eee;margin:13px 0;padding:26px 0;position:relative;">
                        <div style="display:flex;align-items:flex-start;gap:26px;margin-bottom:6px;">
                            <div style="display:flex;flex-direction:column;align-items:center;">
                                <div style="font-size:72px;font-weight:900;letter-spacing:8px;line-height:0.8;">${partZone}</div>
                                <div style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-top:8px;color:#aaa;">ZONE</div>
                            </div>
                            <div style="font-size:55px;font-weight:900;color:#eee;line-height:0.8;padding-top:5px;">-</div>
                            <div style="display:flex;flex-direction:column;align-items:center;">
                                <div style="font-size:72px;font-weight:900;letter-spacing:8px;line-height:0.8;">${partAisle}</div>
                                <div style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-top:8px;color:#aaa;">AISLE</div>
                            </div>
                            <div style="font-size:55px;font-weight:900;color:#eee;line-height:0.8;padding-top:5px;">-</div>
                            <div style="display:flex;flex-direction:column;align-items:center;">
                                <div style="font-size:72px;font-weight:900;letter-spacing:8px;line-height:0.8;">${partBay}</div>
                                <div style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-top:8px;color:#aaa;">BAY</div>
                            </div>
                        </div>
                    </div>

                    <!-- Codes Area -->
                    <div style="display:flex;align-items:center;gap:26px;margin-bottom:13px;">
                        ${showQR ? `<div class="qr-container" style="width:1.60in;border:1px solid #000;padding:10px;background:#fff;">${qrObj}</div>` : ''}
                        ${showBarcode ? `<div class="barcode-container" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                            <div style="display:flex;justify-content:center;width:100%;">${barcodeObj}</div>
                        </div>` : ''}
                    </div>

                    <!-- Footer -->
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:16px;border-top:3px solid #000;">
                        <div style="display:flex;flex-direction:column;">
                            <div style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:2px;">${item.siteName || 'SIFMART WMS'}</div>
                            <div style="font-size:9px;color:#999;font-weight:700;letter-spacing:1px;margin-top:3px;">AUTHENTICATED UNIT LABEL</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:10px;font-family:monospace;font-weight:700;color:#666;">ID: ${item.siteCode || 'N/A'}</div>
                            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-top:3px;">VERIFIED</div>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="label" style="width:${css.width};height:${css.height};position:relative;overflow:hidden;background:#fff;">
                ${contentHTML}
                ${pageInfo}
            </div>
        `;
    }));

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Location Labels — ${validSize}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Outfit:wght@800;900&display=swap" rel="stylesheet">
            <style>
                @page {
                    size: ${css.page};
                    margin: 0;
                }
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 0;
                    background: #f5f5f5;
                    font-family: 'Inter', -apple-system, sans-serif;
                    -webkit-font-smoothing: antialiased;
                }
                .label {
                    box-sizing: border-box;
                    page-break-after: always;
                    overflow: hidden;
                    margin: 0 auto;
                }
                svg {
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                    display: block;
                }
                .qr-container svg { width: 100%; height: 100%; }
                .barcode-container svg { width: auto; height: auto; max-width: 100%; }
                .no-print {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    background: #fff;
                    padding: 15px 30px;
                    border: 3px solid #000;
                    z-index: 9999;
                    box-shadow: 10px 10px 0 rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                @media print {
                    .no-print { display: none; }
                    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    * { color: #000 !important; }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="font-size:14px;padding:12px 30px;font-weight:900;cursor:pointer;background:#000;color:#fff;border:none;letter-spacing:2px;text-transform:uppercase;font-family:Inter,sans-serif;">Run Print Protocol</button>
                <div style="display:flex;flex-direction:column;">
                    <span style="font-size:10px;color:#000;font-weight:900;letter-spacing:1px;text-transform:uppercase;">Status: Ready</span>
                    <span style="font-size:9px;color:#888;font-family:monospace;">${items.length} label container(s) detected</span>
                </div>
            </div>
            ${labelItemsHTML.join('\n')}
        </body>
        </html>
    `;
};
