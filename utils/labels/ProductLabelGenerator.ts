import { generateBarcodeSVG } from '../barcodeGenerator';
import { generateQRCode } from '../qrCodeGenerator';
import { LabelSize, LabelFormat, SIZE_CSS } from './types';

// Format date as DD-Month-YYYY (e.g., 11-April-2030)
const formatExpiryDate = (dateStr: string): string => {
    try {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        // Handle YYYY-MM-DD format
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            const day = parseInt(parts[2], 10);
            const monthIdx = parseInt(parts[1], 10) - 1;
            return `${day}-${months[monthIdx] || 'Unknown'}-${parts[0]}`;
        }
        // Fallback: try Date parsing
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
        }
        return dateStr; // Return as-is if unparseable
    } catch {
        return dateStr;
    }
};

export const generateUnifiedBatchLabelsHTML = async (
    items: Array<{
        value: string;
        label: string;
        quantity?: number;
        price?: string;
        category?: string;
        date?: string;
    }>,
    options: {
        size: LabelSize | string;
        format: LabelFormat | string;
        showPrice?: boolean;
        showCategory?: boolean;
        showDate?: boolean;
        showName?: boolean;
    }
): Promise<string> => {
    const { size, format } = options;

    // Normalize size - handle both 'SMALL' and 'Small' inputs
    const normalizedSize = (s: string): LabelSize => {
        const lower = s.toLowerCase();
        if (lower === 'small') return 'Small';
        if (lower === 'medium') return 'Medium';
        if (lower === 'large') return 'Large';
        if (lower === 'xl' || lower === 'extra large') return 'XL';
        return 'Medium'; // Default fallback
    };

    // Normalize format - handle both 'BARCODE' and 'Barcode' inputs
    const normalizedFormat = (f: string): LabelFormat => {
        const lower = f.toLowerCase();
        if (lower === 'barcode') return 'Barcode';
        if (lower === 'qr') return 'QR';
        if (lower === 'both') return 'Both';
        return 'Barcode'; // Default fallback
    };

    const validSize = normalizedSize(size);
    const validFormat = normalizedFormat(format);
    const css = SIZE_CSS[validSize];

    const { showPrice, showCategory, showName = true } = options;


    // Expand items with quantity into individual labels
    const expandedItems: Array<{
        value: string;
        label: string;
        index: number;
        total: number;
        price?: string;
        category?: string;
        date?: string;
    }> = [];
    let globalIndex = 0;

    // Calculate total labels first
    const totalLabels = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    items.forEach(item => {
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
            globalIndex++;
            expandedItems.push({
                value: item.value,
                label: item.label,
                index: globalIndex,
                total: totalLabels,
                price: item.price,
                category: item.category,
                date: item.date
            });
        }
    });

    // Generate label items with page numbering
    const labelItemsHTML = await Promise.all(expandedItems.map(async (item) => {
        const pageInfo = expandedItems.length > 1 ? `<div style="position: absolute; bottom: 1px; right: 3px; font-size: 6px; color: #888;">${item.index}/${item.total}</div>` : '';
        let contentHTML = '';

        // Create rich QR data for maximum information
        const qrData = JSON.stringify({
            sku: item.value,
            name: item.label,
            date: item.date || ''
        });

        // Defensive check for value
        if (!item.value) {
            return `<div class="label" style="width: ${css.width}; height: ${css.height}; display:flex; align-items:center; justify-content:center; color:red;">INVALID ITEM</div>`;
        }

        // ============================================================
        // TINY / SMALL — Compact futuristic micro-labels
        // ============================================================
        if (validSize === 'Small') {
            const useQR = validFormat === 'QR' || validFormat === 'Both';

            // Build compact metadata chips
            const chips: string[] = [];
            if (showPrice && item.price) chips.push(`<span class="chip">ETB ${item.price}</span>`);
            if (showCategory && item.category) chips.push(`<span class="chip">${item.category.slice(0, 12).toUpperCase()}</span>`);
            const chipsHTML = chips.length ? `<div class="chip-row">${chips.join('')}</div>` : '';

            // Name header bar
            const nameBar = showName && item.label ? `<div class="name-bar">${item.label.toUpperCase()}</div>` : '';

            if (useQR) {
                const qr = await generateQRCode({ data: qrData, size: 130 });
                const qrDim = '29mm';
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="code-zone">
                            <div class="qr-container" style="width:${qrDim};height:${qrDim};">${qr}</div>
                            <div class="sku-mono" style="margin-top:4px;color:#000;font-weight:900;">${item.value}</div>
                        </div>
                        ${chipsHTML}
                    </div>
                `;
            } else {
                const bh = 32;
                const bw = 1.7;
                // Force native text off so we can control the SKU line completely
                const barcode = generateBarcodeSVG(item.value, { format: 'CODE128', width: bw, height: bh, displayValue: false, margin: 0 });
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="code-zone">
                            <div class="barcode-container" style="width:100%;display:flex;justify-content:center;">${barcode || 'ERR'}</div>
                            <div class="sku-mono" style="margin-top:4px;color:#000;font-weight:900;">${item.value}</div>
                        </div>
                        ${chipsHTML}
                    </div>
                `;
            }
        }

        // ============================================================
        // MEDIUM — Structured 2-zone layout
        // ============================================================
        else if (validSize === 'Medium') {
            const showQR = validFormat === 'QR' || validFormat === 'Both';
            const showBarcode = validFormat === 'Barcode' || validFormat === 'Both';
            const qr = showQR ? await generateQRCode({ data: qrData, size: 130 }) : '';

            // Turn off native displayValue to guarantee clean rendering
            const barcode = showBarcode ? generateBarcodeSVG(item.value, { format: 'CODE128', width: 1.8, height: 42, displayValue: false, margin: 0 }) : '';

            // Name header
            const nameBar = showName && item.label ? `<div class="name-bar">${item.label.toUpperCase()}</div>` : '';

            // Info chips
            const infoItems: string[] = [];
            if (showPrice && item.price) infoItems.push(`<div class="info-cell"><span class="info-key">PRICE</span><span class="info-val">ETB ${item.price}</span></div>`);
            if (showCategory && item.category) infoItems.push(`<div class="info-cell"><span class="info-key">CAT</span><span class="info-val">${item.category.toUpperCase()}</span></div>`);
            const infoStrip = infoItems.length ? `<div class="info-strip">${infoItems.join('')}</div>` : '';

            if (showQR && showBarcode) {
                // BOTH: Side-by-side zones
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="dual-zone">
                            <div class="qr-container" style="width:1.43in;height:1.43in;flex-shrink:0;">${qr}</div>
                            <div class="right-col">
                                <div class="barcode-container" style="display:flex;justify-content:center;">${barcode || 'ERR'}</div>
                                <div class="sku-mono" style="font-size:10px;margin-top:6px;color:#000;font-weight:900;">${item.value}</div>
                            </div>
                        </div>
                        ${infoStrip}
                    </div>
                `;
            } else if (showQR) {
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="code-zone"><div class="qr-container" style="width:1.82in;height:1.82in;">${qr}</div><div class="sku-mono" style="margin-top:8px;color:#000;font-weight:900;font-size:11px;">${item.value}</div></div>
                        ${infoStrip}
                    </div>
                `;
            } else {
                contentHTML = `
                    <div class="lbl-inner">
                        ${nameBar}
                        <div class="code-zone">
                            <div class="barcode-container" style="width:90%;display:flex;justify-content:center;">${barcode || 'ERR'}</div>
                            <div class="sku-mono" style="font-size:11px;margin-top:6px;color:#000;font-weight:900;">${item.value}</div>
                        </div>
                        ${infoStrip}
                    </div>
                `;
            }
        }

        // ============================================================
        // LARGE / XL — Premium sectioned layout
        // ============================================================
        else {
            const isXL = validSize === 'XL';
            const showQR = validFormat === 'QR' || validFormat === 'Both';
            const showBarcode = validFormat === 'Barcode' || validFormat === 'Both';
            const qr = showQR ? await generateQRCode({ data: qrData, size: 130 }) : '';
            const bh = isXL ? 65 : 52;
            const bw = isXL ? 2.6 : 2.0;

            // Notice we set displayValue to false and control font size here but actually render it manually
            const barcode = showBarcode ? generateBarcodeSVG(item.value, { format: 'CODE128', width: bw, height: bh, displayValue: false, margin: 0 }) : '';

            // Header band
            const nameBar = showName && item.label
                ? `<div class="name-bar name-bar-lg">${item.label.toUpperCase()}</div>`
                : `<div class="name-bar name-bar-lg">${item.value}</div>`;

            // Bottom info grid
            const cells: string[] = [];
            cells.push(`<div class="info-cell"><span class="info-key">SKU</span><span class="info-val">${item.value}</span></div>`);
            if (showPrice && item.price) cells.push(`<div class="info-cell"><span class="info-key">PRICE</span><span class="info-val">ETB ${item.price}</span></div>`);
            if (showCategory && item.category) cells.push(`<div class="info-cell"><span class="info-key">CATEGORY</span><span class="info-val">${item.category.toUpperCase()}</span></div>`);
            const infoGrid = `<div class="info-grid">${cells.join('')}</div>`;

            if (showQR && showBarcode) {
                const qrDim = isXL ? '2.1in' : '1.7in';
                contentHTML = `
                    <div class="lbl-inner lbl-inner-lg">
                        ${nameBar}
                        <div class="hero-zone">
                            <div class="qr-container" style="width:${qrDim};height:${qrDim};flex-shrink:0;">${qr}</div>
                            <div class="divider-v"></div>
                            <div class="barcode-col">
                                <div class="barcode-container" style="display:flex;justify-content:center;width:100%;">${barcode || 'ERR'}</div>
                                <div class="sku-mono" style="font-size:12px;margin-top:8px;color:#000;font-weight:900;">${item.value}</div>
                            </div>
                        </div>
                        ${infoGrid}
                    </div>
                `;
            } else if (showQR) {
                const qrDim = isXL ? '2.86in' : '2.34in';
                contentHTML = `
                    <div class="lbl-inner lbl-inner-lg">
                        ${nameBar}
                        <div class="code-zone" style="flex:1;">
                            <div class="qr-container" style="width:${qrDim};height:${qrDim};">${qr}</div>
                            <div class="sku-mono" style="font-size:14px;margin-top:8px;color:#000;font-weight:900;letter-spacing:0.2em;">${item.value}</div>
                        </div>
                        ${infoGrid}
                    </div>
                `;
            } else {
                contentHTML = `
                    <div class="lbl-inner lbl-inner-lg">
                        ${nameBar}
                        <div class="code-zone" style="flex:1;">
                            <div class="barcode-container" style="width:90%;display:flex;justify-content:center;">${barcode || 'ERR'}</div>
                            <div class="sku-mono" style="font-size:14px;margin-top:12px;color:#000;font-weight:900;letter-spacing:0.2em;">${item.value}</div>
                        </div>
                        ${infoGrid}
                    </div>
                `;
            }
        }

        return `
            <div class="label" style="width: ${css.width}; height: ${css.height}; position: relative;">
                ${contentHTML}
                ${pageInfo}
            </div>
        `;
    }));

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Labels - ${validSize} - ${validFormat}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                @page { size: ${css.page}; margin: 0; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    margin: 0; padding: 0; background: #fff;
                    font-family: 'Inter', -apple-system, sans-serif;
                    -webkit-font-smoothing: antialiased;
                    color: #000;
                }
                .label {
                    box-sizing: border-box;
                    page-break-after: always;
                    overflow: hidden;
                    margin: 0 auto;
                    background: #fff;
                    border: 2px solid #000;
                    border-radius: 6px;
                }
                svg { max-width: 100%; max-height: 100%; width: auto; height: auto; display: block; }
                .qr-container svg { width: 100%; height: 100%; }
                .barcode-container svg { width: auto; height: auto; max-width: 100%; }

                /* ── LAYOUT PRIMITIVES ── */
                .lbl-inner {
                    display: flex; flex-direction: column;
                    height: 100%; width: 100%; overflow: hidden;
                    background: #fff;
                }
                .lbl-inner-lg { justify-content: space-between; }

                /* ── NAME HEADER BAR ── */
                .name-bar {
                    background: #f8fafc; color: #0f172a;
                    font-size: 10px; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.1em;
                    padding: 6px 8px; line-height: 1.2;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    flex-shrink: 0;
                    border-bottom: 2px dashed #e2e8f0;
                }
                .name-bar-tiny { font-size: 8px; padding: 4px 6px; }
                .name-bar-lg {
                    font-size: 16px; padding: 12px 16px;
                    letter-spacing: 0.15em; font-weight: 900;
                    background: #f1f5f9; color: #000;
                    border-bottom: 3px solid #cbd5e1;
                }

                /* ── CODE ZONES ── */
                .code-zone {
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; flex: 1; padding: 4px;
                }
                .dual-zone {
                    display: flex; align-items: center; justify-content: center;
                    gap: 8px; flex: 1; padding: 5px;
                }
                .right-col {
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; flex: 1; overflow: hidden;
                }
                .hero-zone {
                    display: flex; align-items: center; justify-content: center;
                    gap: 13px; flex: 1; padding: 10px 16px;
                }
                .barcode-col {
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; flex: 1;
                }
                /* ── SKU MONO ── */
                .sku-mono {
                    font-family: 'SF Mono', 'Fira Code', monospace;
                    font-size: 9px; font-weight: 900;
                    letter-spacing: 0.1em; color: #000;
                    text-align: center; margin-top: 3px;
                }

                .divider-v {
                    width: 2px; height: 60%; background: #e2e8f0; flex-shrink: 0;
                }

                /* ── CHIP ROW (Tiny/Small meta) ── */
                .chip-row {
                    display: flex; justify-content: center; align-items: center;
                    gap: 6px; padding: 4px 6px; flex-shrink: 0;
                    border-top: 2px dashed #e2e8f0;
                    background: #f8fafc;
                }
                .chip {
                    font-size: 8px; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.1em;
                    color: #334155; padding: 2px 6px;
                    border: 1px solid #cbd5e1;
                    border-radius: 4px; background: #fff;
                }
                .chip-exp { background: #0f172a; color: #fff; border-color: #0f172a; }

                /* ── INFO STRIP (Medium) ── */
                .info-strip {
                    display: flex; justify-content: space-evenly;
                    border-top: 2px dashed #cbd5e1; flex-shrink: 0;
                    background: #f8fafc;
                }
                .info-strip .info-cell {
                    flex: 1; text-align: center;
                    padding: 6px 4px; border-right: 2px dashed #e2e8f0;
                }
                .info-strip .info-cell:last-child { border-right: none; }

                /* ── INFO GRID (Large/XL) ── */
                .info-grid {
                    display: flex; flex-wrap: wrap;
                    border-top: 3px solid #cbd5e1; flex-shrink: 0;
                    background: #f1f5f9;
                }
                .info-grid .info-cell {
                    flex: 1 1 50%; text-align: center;
                    padding: 8px 10px;
                    border-right: 2px dashed #cbd5e1;
                    border-bottom: 2px dashed #cbd5e1;
                    background: #fff;
                }
                .info-grid .info-cell:nth-child(2n) { border-right: none; }
                .info-grid .info-cell:nth-last-child(-n+2) { border-bottom: none; }

                .info-key {
                    display: block; font-size: 9px; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.15em;
                    color: #64748b; line-height: 1; margin-bottom: 2px;
                }
                .info-val {
                    display: block; font-size: 13px; font-weight: 900;
                    color: #0f172a; line-height: 1.3;
                    letter-spacing: -0.01em;
                }

                /* ── PRINT CONTROLS ── */
                .no-print {
                    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
                    background: #000; padding: 12px 28px; border-radius: 0;
                    z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                @media print {
                    .no-print { display: none; }
                    .label { border: 1px solid #000; }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="font-size: 12px; padding: 10px 30px; font-weight: 900; cursor: pointer; background: #000; color: #fff; border: 2px solid #fff; letter-spacing: 0.2em; text-transform: uppercase; font-family: Inter, sans-serif;">▶ PRINT</button>
            </div>
            ${labelItemsHTML.join('\n')}
        </body>
        </html>
    `;
};


// ============================================================
// LOCATION LABEL - Futuristic warehouse location label
// ============================================================

