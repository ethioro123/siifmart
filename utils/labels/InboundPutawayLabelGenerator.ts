import { generateBarcodeSVG } from '../barcodeGenerator';
import { generateQRCode } from '../qrCodeGenerator';
import { LabelSize, LabelFormat, SIZE_CSS } from './types';

export interface InboundPutawayLabelItem {
    sku: string;
    productName: string;
    barcode?: string;
    poNumber?: string;
    quantity: number;
    packQuantity?: number;
    unit?: string;
    batchNumber?: string;
    expiryDate?: string;
    targetLocation?: string;
    targetZone?: string;
    receivedBy?: string;
    receiverCode?: string;
    siteName?: string;
    receivedDate?: string;
    condition?: string;
    cartonIndex?: number;
    totalCartons?: number;
}

export interface InboundPutawayLabelOptions {
    size: LabelSize | string;
    format: LabelFormat | string;
    showQrPayload?: boolean;
}

const normalizeSize = (s: string): LabelSize => {
    const lower = s.toLowerCase();
    if (lower === 'small' || lower === 'tiny') return 'Small';
    if (lower === 'medium') return 'Medium';
    if (lower === 'large') return 'Large';
    if (lower === 'xl' || lower === 'extra large') return 'XL';
    return 'Medium';
};

const normalizeFormat = (f: string): LabelFormat => {
    const lower = f.toLowerCase();
    if (lower === 'qr') return 'QR';
    if (lower === 'barcode') return 'Barcode';
    return 'Both';
};

export const generateInboundPutawayLabelHTML = async (
    items: InboundPutawayLabelItem[],
    options: InboundPutawayLabelOptions
): Promise<string> => {
    const validSize = normalizeSize(options.size || 'Medium');
    const validFormat = normalizeFormat(options.format || 'Both');
    const css = SIZE_CSS[validSize] || SIZE_CSS.Medium;

    const cardsHtmlArray: string[] = [];

    for (const item of items) {
        const barcodeVal = item.barcode?.trim() || item.sku.trim();
        const barcodeSvg = generateBarcodeSVG(barcodeVal, {
            width: 1.4,
            height: validSize === 'Small' ? 32 : 46,
            displayValue: false,
            margin: 2
        });

        // Machine-readable LPN payload for mobile WMS scan
        const payloadData = {
            type: 'INBOUND_LPN',
            sku: item.sku,
            po: item.poNumber,
            batch: item.batchNumber,
            exp: item.expiryDate,
            loc: item.targetLocation,
            qty: item.quantity
        };
        const qrSvg = (validFormat === 'QR' || validFormat === 'Both')
            ? await generateQRCode({ data: JSON.stringify(payloadData), size: 140 }).catch(() => '')
            : '';

        const cartonText = item.totalCartons && item.totalCartons > 1
            ? `CARTON ${item.cartonIndex || 1} OF ${item.totalCartons}`
            : (item.packQuantity && item.packQuantity > 1 ? `CASE OF ${item.packQuantity} UNITS` : `QTY: ${item.quantity} ${item.unit || 'UNITS'}`);

        cardsHtmlArray.push(`
            <div class="lpn-card">
                <!-- Header -->
                <div class="lpn-header">
                    <div class="lpn-title">
                        <span class="brand">SIIFMART WMS</span>
                        <span class="sub">INBOUND LPN</span>
                    </div>
                    <div class="lpn-meta">
                        ${item.poNumber ? `<span class="meta-tag">PO: ${escapeHtml(item.poNumber)}</span>` : ''}
                        <span class="meta-tag date">${escapeHtml(item.receivedDate || new Date().toISOString().slice(0, 10))}</span>
                    </div>
                </div>

                <!-- Product Title & SKU -->
                <div class="lpn-product">
                    <div class="product-name">${escapeHtml(item.productName)}</div>
                    <div class="sku-row">
                        <span class="sku-pill">SKU: ${escapeHtml(item.sku)}</span>
                        <span class="pack-pill">${escapeHtml(cartonText)}</span>
                    </div>
                </div>

                <!-- Barcode & QR Block -->
                <div class="lpn-symbology ${validFormat.toLowerCase()}">
                    ${(validFormat === 'Barcode' || validFormat === 'Both') ? `
                        <div class="barcode-wrap">
                            ${barcodeSvg}
                            <div class="barcode-digits font-mono">${escapeHtml(barcodeVal)}</div>
                        </div>
                    ` : ''}
                    ${(validFormat === 'QR' || validFormat === 'Both') && qrSvg ? `
                        <div class="qr-wrap">
                            ${qrSvg}
                        </div>
                    ` : ''}
                </div>

                <!-- Quality & FEFO Track -->
                <div class="lpn-fefo-grid">
                    <div class="fefo-cell">
                        <span class="lbl">BATCH / LOT</span>
                        <span class="val font-mono">${escapeHtml(item.batchNumber || 'STANDARD-INBOUND')}</span>
                    </div>
                    <div class="fefo-cell exp">
                        <span class="lbl">EXPIRY (FEFO)</span>
                        <span class="val font-mono">${escapeHtml(item.expiryDate || 'N/A')}</span>
                    </div>
                </div>

                <!-- PUTAWAY TARGET BAY (High Prominence) -->
                <div class="lpn-target-bay">
                    <div class="bay-header">
                        <span>🎯 TARGET PUTAWAY LOCATION</span>
                        <span class="zone-pill">${escapeHtml(item.targetZone || 'GENERAL STORAGE')}</span>
                    </div>
                    <div class="bay-code font-mono">${escapeHtml(item.targetLocation || 'STAGE AT RECEIVING DOCK')}</div>
                </div>

                <!-- Chain of Custody Stamp -->
                <div class="lpn-footer">
                    <span>RCVD BY: ${escapeHtml(item.receivedBy || 'Staff')} ${item.receiverCode ? `(${escapeHtml(item.receiverCode)})` : ''}</span>
                    <span class="status-stamp">${escapeHtml(item.condition || 'QC-PASSED')}</span>
                </div>
            </div>
        `);
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Inbound Putaway Labels</title>
    <style>
        @page {
            size: ${css.page};
            margin: 0;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .font-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .labels-container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .lpn-card {
            width: ${css.width};
            min-height: ${css.height};
            padding: 2.2mm 2.8mm;
            border: 1.5pt solid #000;
            page-break-after: always;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            background: #fff;
        }
        .lpn-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.2pt solid #000;
            padding-bottom: 1.2mm;
            margin-bottom: 1.2mm;
        }
        .lpn-title .brand {
            font-size: 8pt;
            font-weight: 900;
            letter-spacing: 0.05em;
        }
        .lpn-title .sub {
            font-size: 7pt;
            font-weight: 800;
            background: #000;
            color: #fff;
            padding: 0.5pt 3pt;
            margin-left: 2pt;
            border-radius: 2pt;
        }
        .lpn-meta {
            display: flex;
            gap: 2pt;
        }
        .meta-tag {
            font-size: 6.5pt;
            font-weight: 800;
            font-family: monospace;
            border: 0.8pt solid #000;
            padding: 0.5pt 2.5pt;
            border-radius: 2pt;
        }
        .lpn-product {
            margin-bottom: 1.5mm;
        }
        .product-name {
            font-size: 10pt;
            font-weight: 900;
            line-height: 1.15;
            text-transform: uppercase;
            max-height: 9mm;
            overflow: hidden;
        }
        .sku-row {
            display: flex;
            gap: 3pt;
            margin-top: 1mm;
        }
        .sku-pill {
            font-size: 7.5pt;
            font-weight: 800;
            font-family: monospace;
            background: #eee;
            padding: 0.8pt 3pt;
            border-radius: 2pt;
        }
        .pack-pill {
            font-size: 7.5pt;
            font-weight: 900;
            border: 0.8pt solid #000;
            padding: 0.8pt 3pt;
            border-radius: 2pt;
        }
        .lpn-symbology {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2mm;
            padding: 1mm 0;
            margin-bottom: 1.5mm;
            border-top: 0.8pt dashed #888;
            border-bottom: 0.8pt dashed #888;
        }
        .barcode-wrap {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: hidden;
        }
        .barcode-wrap svg {
            width: 100%;
            max-height: 12mm;
        }
        .barcode-digits {
            font-size: 6.5pt;
            font-weight: 700;
            letter-spacing: 0.1em;
            margin-top: 0.5mm;
        }
        .qr-wrap img {
            width: 14mm;
            height: 14mm;
            border: 0.5pt solid #ccc;
        }
        .lpn-fefo-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5mm;
            margin-bottom: 1.5mm;
        }
        .fefo-cell {
            border: 0.8pt solid #000;
            padding: 1mm 1.5mm;
            border-radius: 2pt;
            display: flex;
            flex-direction: column;
        }
        .fefo-cell.exp {
            background: #f4f4f4;
        }
        .fefo-cell .lbl {
            font-size: 5.5pt;
            font-weight: 800;
            letter-spacing: 0.05em;
            color: #444;
        }
        .fefo-cell .val {
            font-size: 7.5pt;
            font-weight: 900;
        }
        .lpn-target-bay {
            background: #000;
            color: #fff;
            padding: 1.2mm 2mm;
            border-radius: 3pt;
            margin-bottom: 1.2mm;
        }
        .bay-header {
            display: flex;
            justify-content: space-between;
            font-size: 5.5pt;
            font-weight: 900;
            letter-spacing: 0.05em;
            color: #ccc;
            margin-bottom: 0.5mm;
        }
        .zone-pill {
            background: #fff;
            color: #000;
            padding: 0.2pt 2pt;
            border-radius: 1.5pt;
        }
        .bay-code {
            font-size: 13pt;
            font-weight: 900;
            letter-spacing: 0.05em;
            text-align: center;
        }
        .lpn-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 6pt;
            font-weight: 800;
            padding-top: 1mm;
            border-top: 0.8pt solid #000;
        }
        .status-stamp {
            background: #000;
            color: #fff;
            padding: 0.5pt 3pt;
            border-radius: 1.5pt;
            font-size: 5.5pt;
        }
    </style>
</head>
<body>
    <div class="labels-container">
        ${cardsHtmlArray.join('\n')}
    </div>
</body>
</html>
    `;
};

const escapeHtml = (str?: string): string => {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};
