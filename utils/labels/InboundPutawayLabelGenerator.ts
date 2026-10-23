import { inboundLabelStyles } from './inboundLabelStyles';
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
    if (lower === 'small' || lower === 'tiny') return 'Medium';
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
        const barcodeVal = item.sku.trim();
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
            : (item.packQuantity && item.packQuantity > 1 ? `CASE OF ${item.packQuantity} UNITS` : '');

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
                        <span class="pack-pill">${escapeHtml(`QTY: ${item.quantity} ${item.unit || 'UNITS'}${cartonText ? ` · ${cartonText}` : ''}`)}</span>
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
                        <span>TARGET PUTAWAY LOCATION</span>
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
        ${inboundLabelStyles(validSize)}
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
