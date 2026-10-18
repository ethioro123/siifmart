import { generateBarcodeSVG } from '../barcodeGenerator';
import { generateQRCode } from '../qrCodeGenerator';
import { LabelSize, LabelFormat, SIZE_CSS, normalizeLabelSize } from './types';
import { escapeHtml } from './escapeHtml';
import { getProductLabelStyles } from './productLabelStyles';

export interface ProductLabelItem {
    value: string;           // Canonical barcode/scan value
    label: string;           // Product display name
    sku?: string;            // Explicit human-readable SKU
    barcode?: string;        // Explicit manufacturer barcode
    barcodeType?: string;    // 'CODE128' | 'EAN-13' | 'UPC-A' | 'CODE39' etc.
    quantity?: number;
    price?: string | number;
    currency?: string;       // Currency symbol or code, e.g. 'KSh', 'KES', 'ETB'
    category?: string;
    date?: string;
    isHalal?: boolean;
}

export interface ProductLabelOptions {
    size: LabelSize | string;
    format: LabelFormat | string;
    currency?: string;       // Default currency for batch (e.g. active site currency)
    showPrice?: boolean;
    showCategory?: boolean;
    showDate?: boolean;
    showName?: boolean;
    showHalal?: boolean;
}

const MAX_BATCH_SIZE = 500;

// Format barcode symbology safely
const resolveBarcodeFormat = (barcodeType?: string, value?: string): string => {
    if (!barcodeType) return 'CODE128';
    const upper = barcodeType.toUpperCase().trim();
    const clean = (value || '').trim();
    if ((upper === 'EAN-13' || upper === 'EAN13') && /^\d{12,13}$/.test(clean)) return 'EAN13';
    if ((upper === 'UPC-A' || upper === 'UPC') && /^\d{11,12}$/.test(clean)) return 'UPC';
    if (upper === 'CODE39') return 'CODE39';
    return 'CODE128';
};

export const generateUnifiedBatchLabelsHTML = async (
    items: ProductLabelItem[],
    options: ProductLabelOptions
): Promise<string> => {
    const { size, format, showPrice, showCategory, showName = true } = options;
    const batchCurrency = options.currency || 'ETB';

    const validSize = normalizeLabelSize(size as string);
    const normalizedFormat = (f: string): LabelFormat => {
        const lower = (f || '').toLowerCase();
        if (lower === 'qr') return 'QR';
        if (lower === 'both') return 'Both';
        return 'Barcode';
    };
    const validFormat = normalizedFormat(format as string);
    const css = SIZE_CSS[validSize] || SIZE_CSS.Medium;

    // Expand items with quantity into individual labels
    const expandedItems: Array<ProductLabelItem & { index: number; total: number }> = [];
    let globalIndex = 0;

    const totalLabels = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const safeTotal = Math.min(totalLabels, MAX_BATCH_SIZE);

    for (const item of items) {
        if (expandedItems.length >= MAX_BATCH_SIZE) break;
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
            if (expandedItems.length >= MAX_BATCH_SIZE) break;
            globalIndex++;
            expandedItems.push({
                ...item,
                index: globalIndex,
                total: safeTotal
            });
        }
    }

    // Generate label items HTML
    const labelItemsHTML = await Promise.all(expandedItems.map(async (item) => {
        const pageInfo = expandedItems.length > 1
            ? `<div style="position: absolute; bottom: 1px; right: 3px; font-size: 6px; color: #888;">${item.index}/${item.total}</div>`
            : '';

        const itemCurrency = item.currency || batchCurrency;
        const itemCode = (item.value || item.sku || '').trim();
        const itemSkuDisplay = (item.sku || item.value || '').trim();
        const itemPriceFormatted = item.price !== undefined && item.price !== null && item.price !== ''
            ? `${itemCurrency} ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}`
            : '';

        // Rich QR data for scanning and audit
        const qrData = JSON.stringify({
            sku: itemSkuDisplay,
            code: itemCode,
            name: item.label,
            price: item.price ? String(item.price) : '',
            currency: itemCurrency,
            category: item.category || '',
            printedAt: new Date().toISOString()
        });

        if (!itemCode) {
            return `<div class="label" style="width:${css.width};height:${css.height};display:flex;align-items:center;justify-content:center;color:red;font-size:10px;">AWAITING SKU</div>`;
        }

        const barcodeFormat = resolveBarcodeFormat(item.barcodeType, itemCode);
        const nameEscaped = escapeHtml(item.label);
        const skuEscaped = escapeHtml(itemSkuDisplay);
        const catEscaped = escapeHtml(item.category);
        const catUpperEscaped = escapeHtml((item.category || '').toUpperCase());

        let contentHTML = '';

        // ── TINY / SMALL ──
        if (validSize === 'Tiny' || validSize === 'Small') {
            const useQR = validFormat === 'QR';
            const chips: string[] = [];
            if (showPrice && itemPriceFormatted) chips.push(`<span class="chip">${escapeHtml(itemPriceFormatted)}</span>`);
            if (showCategory && item.category) chips.push(`<span class="chip">${escapeHtml(item.category.slice(0, 10).toUpperCase())}</span>`);
            const chipsHTML = chips.length ? `<div class="chip-row">${chips.join('')}</div>` : '';
            const nameBar = showName && nameEscaped ? `<div class="name-bar name-bar-tiny">${nameEscaped}</div>` : '';

            if (useQR) {
                const qr = await generateQRCode({ data: qrData, size: 90 });
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="code-zone">
                            <div class="qr-container" style="width:20mm;height:20mm;display:flex;justify-content:center;">${qr}</div>
                            <div class="sku-mono">${skuEscaped}</div>
                        </div>
                        ${chipsHTML}
                    </div>
                `;
            } else {
                const barcode = generateBarcodeSVG(itemCode, {
                    format: barcodeFormat,
                    width: 1.15,
                    height: 24,
                    displayValue: false,
                    margin: 1
                });
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="code-zone">
                            <div class="barcode-container" style="width:100%;display:flex;justify-content:center;">${barcode || 'ERR'}</div>
                            <div class="sku-mono">${skuEscaped}</div>
                        </div>
                        ${chipsHTML}
                    </div>
                `;
            }
        }
        // ── MEDIUM ──
        else if (validSize === 'Medium') {
            const showQR = validFormat === 'QR' || validFormat === 'Both';
            const showBarcode = validFormat === 'Barcode' || validFormat === 'Both';
            const qr = showQR ? await generateQRCode({ data: qrData, size: 110 }) : '';
            const barcode = showBarcode ? generateBarcodeSVG(itemCode, {
                format: barcodeFormat,
                width: 1.35,
                height: 38,
                displayValue: false,
                margin: 2
            }) : '';

            const nameBar = showName && nameEscaped ? `<div class="name-bar">${nameEscaped}</div>` : '';
            const infoItems: string[] = [];
            if (showPrice && itemPriceFormatted) infoItems.push(`<div class="info-cell"><span class="info-key">PRICE</span><span class="info-val">${escapeHtml(itemPriceFormatted)}</span></div>`);
            if (showCategory && item.category) infoItems.push(`<div class="info-cell"><span class="info-key">CAT</span><span class="info-val">${catUpperEscaped}</span></div>`);
            const infoStrip = infoItems.length ? `<div class="info-strip">${infoItems.join('')}</div>` : '';

            if (showQR && showBarcode) {
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="dual-zone">
                            <div class="qr-container" style="width:28mm;height:28mm;flex-shrink:0;">${qr}</div>
                            <div class="right-col">
                                <div class="barcode-container" style="display:flex;justify-content:center;width:100%;">${barcode || 'ERR'}</div>
                                <div class="sku-mono">${skuEscaped}</div>
                            </div>
                        </div>
                        ${infoStrip}
                    </div>
                `;
            } else if (showQR) {
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="code-zone">
                            <div class="qr-container" style="width:34mm;height:34mm;">${qr}</div>
                            <div class="sku-mono">${skuEscaped}</div>
                        </div>
                        ${infoStrip}
                    </div>
                `;
            } else {
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="code-zone">
                            <div class="barcode-container" style="width:96%;display:flex;justify-content:center;">${barcode || 'ERR'}</div>
                            <div class="sku-mono">${skuEscaped}</div>
                        </div>
                        ${infoStrip}
                    </div>
                `;
            }
        }
        // ── LARGE / XL ──
        else {
            const isXL = validSize === 'XL';
            const showQR = validFormat === 'QR' || validFormat === 'Both';
            const showBarcode = validFormat === 'Barcode' || validFormat === 'Both';
            const qr = showQR ? await generateQRCode({ data: qrData, size: isXL ? 150 : 120 }) : '';
            const bh = isXL ? 58 : 46;
            const bw = isXL ? 1.8 : 1.5;

            const barcode = showBarcode ? generateBarcodeSVG(itemCode, {
                format: barcodeFormat,
                width: bw,
                height: bh,
                displayValue: false,
                margin: 4
            }) : '';

            const nameBar = showName && nameEscaped
                ? `<div class="name-bar name-bar-lg">${nameEscaped}</div>`
                : `<div class="name-bar name-bar-lg">${skuEscaped}</div>`;

            const cells: string[] = [];
            cells.push(`<div class="info-cell"><span class="info-key">SKU</span><span class="info-val">${skuEscaped}</span></div>`);
            if (showPrice && itemPriceFormatted) cells.push(`<div class="info-cell"><span class="info-key">PRICE</span><span class="info-val">${escapeHtml(itemPriceFormatted)}</span></div>`);
            if (showCategory && item.category) cells.push(`<div class="info-cell"><span class="info-key">CATEGORY</span><span class="info-val">${catUpperEscaped}</span></div>`);
            const infoGrid = `<div class="info-grid">${cells.join('')}</div>`;

            if (showQR && showBarcode) {
                contentHTML = `
                    <div class="lbl-inner lbl-inner-lg">
                        ${nameBar}
                        <div class="hero-zone">
                            <div class="qr-container" style="width:38mm;height:38mm;flex-shrink:0;">${qr}</div>
                            <div class="barcode-col">
                                <div class="barcode-container" style="display:flex;justify-content:center;width:100%;">${barcode || 'ERR'}</div>
                                <div class="sku-mono">${skuEscaped}</div>
                            </div>
                        </div>
                        ${infoGrid}
                    </div>
                `;
            } else if (showQR) {
                contentHTML = `
                    <div class="lbl-inner lbl-inner-lg">
                        ${nameBar}
                        <div class="code-zone"><div class="qr-container" style="width:48mm;height:48mm;">${qr}</div><div class="sku-mono">${skuEscaped}</div></div>
                        ${infoGrid}
                    </div>
                `;
            } else {
                contentHTML = `
                    <div class="lbl-inner lbl-inner-lg">
                        ${nameBar}
                        <div class="code-zone"><div class="barcode-container" style="width:96%;display:flex;justify-content:center;">${barcode || 'ERR'}</div><div class="sku-mono">${skuEscaped}</div></div>
                        ${infoGrid}
                    </div>
                `;
            }
        }

        return `<div class="label">${contentHTML}${pageInfo}</div>`;
    }));

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Unified Product Labels - SIIFMART</title>
            <style>
                ${getProductLabelStyles(css)}
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="font-size:12px;padding:10px 30px;font-weight:900;cursor:pointer;background:#000;color:#fff;border:2px solid #fff;letter-spacing:0.2em;text-transform:uppercase;font-family:Inter,sans-serif;">▶ PRINT LABELS</button>
            </div>
            ${labelItemsHTML.join('\n')}
        </body>
        </html>
    `;
};
