import { generateBarcodeSVG } from './barcodeGenerator';
import { generateQRCode } from './qrCodeGenerator';
import { formatOrderRef } from './jobIdFormatter';

export type LabelSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'XL';
export type LabelFormat = 'QR' | 'Barcode' | 'Both';

// Standard Retail/Warehouse Sizes (Metric)
// Tiny: 32mm x 25mm (Standard SKU/Price Tag)
// Small: 57mm x 32mm (Standard Multipurpose)
// Medium: 76mm x 51mm (Standard Name/Shelf Tag)
// Large: 100mm x 75mm (Standard Carton/Inventory Tag)
// XL: 100mm x 150mm (Shipping Label)

const SIZE_CSS = {
    'Tiny': { width: '32mm', height: '25mm', page: '32mm 25mm' },
    'Small': { width: '57mm', height: '32mm', page: '57mm 32mm' },
    'Medium': { width: '76mm', height: '51mm', page: '76mm 51mm' },
    'Large': { width: '100mm', height: '75mm', page: '100mm 75mm' },
    'XL': { width: '100mm', height: '150mm', page: '100mm 150mm' }
};

// ============================================================
// PACK LABEL - Rich shipping/packing label with all details
// ============================================================

export interface PackLabelData {
    orderRef: string;
    customerName?: string;
    shippingAddress?: string;
    city?: string;
    packDate?: string;
    packerName?: string;
    itemCount: number;
    packageNumber?: number;
    totalPackages?: number;
    weight?: string;
    specialHandling?: {
        fragile?: boolean;
        coldChain?: boolean;
        perishable?: boolean;
        hazmat?: boolean;
    };
    destSiteName?: string;
    fromName?: string;
    fromAddress?: string;
    originalOrderRef?: string;
    trackingNumber?: string;
    lineItems?: Array<{
        name: string;
        sku: string;
        quantity: number;
    }>;
}

export const generatePackLabelHTML = async (
    data: PackLabelData,
    options: {
        size: LabelSize | string;
        format: LabelFormat | string;
    }
): Promise<string> => {
    const { size, format } = options;

    // Normalize size - properly handle XL
    const normalizedSize = (s: string): LabelSize => {
        const lower = s.toLowerCase();
        if (lower === 'tiny') return 'Tiny';
        if (lower === 'small') return 'Small';
        if (lower === 'medium') return 'Medium';
        if (lower === 'large') return 'Large';
        if (lower === 'xl') return 'XL';
        return 'XL'; // Default to XL for pack labels
    };


    // Normalize format
    const normalizedFormat = (f: string): LabelFormat => {
        const lower = f.toLowerCase();
        if (lower === 'barcode') return 'Barcode';
        if (lower === 'qr') return 'QR';
        if (lower === 'both') return 'Both';
        return 'Both'; // Default to Both for pack labels
    };

    const validSize = normalizedSize(size);
    const validFormat = normalizedFormat(format);
    const css = SIZE_CSS[validSize];

    // Format the order reference for display (convert UUID to short ID)
    const formattedOrderRef = formatOrderRef(data.orderRef);

    // Create QR data with all order info (use formatted ref)
    const qrData = JSON.stringify({
        order: formattedOrderRef,
        customer: data.customerName,
        items: data.itemCount,
        date: data.packDate || new Date().toISOString().split('T')[0],
        pkg: data.packageNumber ? `${data.packageNumber}/${data.totalPackages || 1}` : '1/1'
    });

    // Generate codes with formatted order ref (not UUID)
    // Use Tracking Number if available, otherwise formatted order ref
    const barcodeValue = data.trackingNumber || formattedOrderRef;
    const barcode = generateBarcodeSVG(barcodeValue, {
        format: 'CODE128',
        width: 2,
        height: 40,
        displayValue: true,
        fontSize: 10,
        margin: 2
    });

    const qr = await generateQRCode({ data: qrData, size: 120 });

    // Special handling icons
    const getHandlingIcons = () => {
        const icons: string[] = [];
        if (data.specialHandling?.fragile) icons.push('🔺 FRAGILE');
        if (data.specialHandling?.coldChain) icons.push('❄️ COLD CHAIN');
        if (data.specialHandling?.perishable) icons.push('⏱️ PERISHABLE');
        if (data.specialHandling?.hazmat) icons.push('☢️ HAZMAT');
        return icons;
    };

    const handlingIcons = getHandlingIcons();

    // Build label HTML
    let contentHTML = '';

    if (validSize === 'Tiny' || validSize === 'Small') {
        // Compact layout remains mostly same but slightly sharper
        contentHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 4px;">
                <div style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">#${formattedOrderRef}</div>
                <div class="barcode-container" style="width: 100%;">${barcode || 'ERROR'}</div>
                <div style="font-size: 8px; margin-top: 2px; font-weight: bold;">${data.itemCount} items</div>
            </div>
        `;
    } else {
        // Professional Shipping Label (Medium/Large/XL) - Approved XL Design
        const showQR = validFormat === 'QR' || validFormat === 'Both';
        const showBarcode = validFormat === 'Barcode' || validFormat === 'Both';

        const isMedium = validSize === 'Medium'; // 3x2 (76x51mm)
        const isLarge = validSize === 'Large';   // 4x3 (100x75mm)
        const isXL = validSize === 'XL';         // 4x6 (100x150mm)

        // Adjust sizes based on label size - granular control
        const headerFontSize = isMedium ? '18px' : (isLarge ? '22px' : '28px');
        const fromLabelSize = isMedium ? '7px' : (isLarge ? '8px' : '9px');
        const fromTextSize = isMedium ? '8px' : (isLarge ? '9px' : '10px');
        const shipToLabelSize = isMedium ? '9px' : (isLarge ? '10px' : '12px');
        const shipToNameSize = isMedium ? '12px' : (isLarge ? '14px' : '18px');
        const shipToAddressSize = isMedium ? '9px' : (isLarge ? '9px' : '11px');
        const orderIdSize = isMedium ? '11px' : (isLarge ? '12px' : '14px');
        const tableFontSize = isMedium ? '8px' : (isLarge ? '9px' : '10px');
        const footerSize = isMedium ? '8px' : (isLarge ? '9px' : '10px');

        const qrSize = isMedium ? '0.6in' : (isLarge ? '0.8in' : '1in');
        const padding = isMedium ? '8px' : (isLarge ? '12px' : '16px');
        const spacingMicro = isMedium ? '2px' : '4px';
        const spacingSmall = isMedium ? '6px' : (isLarge ? '8px' : '12px');

        // Determine max items to show based on vertical space
        const maxItems = isMedium ? 1 : (isLarge ? 3 : 6);

        // Format pack date to ensure uppercase
        const rawPackDate = data.packDate || new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
        const formattedPackDate = rawPackDate.toUpperCase();


        // Dynamic From Address with Fallback
        const fromName = data.fromName || 'SiifMart Logistics Center';
        const fromAddressHTML = data.fromAddress
            ? data.fromAddress.split(',').map(line => `<div>${line.trim()}</div>`).join('')
            : `<div>Bole Sub-City, Woreda 03, House No. 1234</div><div>Addis Ababa, Ethiopia</div><div>Tel: +251-11-555-0100</div>`;

        contentHTML = `
            <div style="display: flex; flex-direction: column; height: 100%; padding: ${padding}; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; line-height: 1.25;">
                
                <!-- Row 1: SiifMart Header + QR Code -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${spacingSmall};">
                    <div style="font-weight: 900; font-size: ${headerFontSize}; letter-spacing: -0.5px;">SiifMart</div>
                    ${showQR ? `
                    <div style="width: ${qrSize}; flex-shrink: 0; text-align: center;">
                        <div class="qr-container" style="width: 100%; border: 1px solid #ccc; padding: 2px;">${qr}</div>
                        <div style="font-size: 7px; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; color: #666;">Tracking</div>
                    </div>
                    ` : ''}
                </div>

                <!-- Row 2: FROM Section -->
                <div style="margin-bottom: ${spacingSmall};">
                    <div style="font-weight: 900; font-size: ${fromLabelSize}; text-transform: uppercase; margin-bottom: 2px;">From:</div>
                    <div style="font-size: ${fromTextSize}; color: #333; line-height: 1.3;">
                        <div style="font-weight: 700;">${fromName}</div>
                        ${fromAddressHTML}
                    </div>
                </div>

                <!-- Row 3: SHIP TO Section -->
                <div style="margin-bottom: ${spacingSmall};">
                    <div style="font-weight: 900; font-size: ${shipToLabelSize}; text-transform: uppercase; margin-bottom: ${spacingMicro};">Ship To:</div>
                    <div style="font-weight: 900; font-size: ${shipToNameSize}; text-transform: uppercase; line-height: 1.2;">${data.customerName || data.destSiteName || 'RECIPIENT'}</div>
                    ${data.shippingAddress ? `<div style="font-size: ${shipToAddressSize}; margin-top: 2px;">${data.shippingAddress}</div>` : ''}
                    ${data.city ? `<div style="font-size: ${shipToAddressSize}; text-transform: uppercase;">${data.city}</div>` : ''}
                    ${data.customerName && data.destSiteName ? `<div style="font-size: ${shipToAddressSize}; margin-top: 2px;">ATTN: ${data.destSiteName.toUpperCase()}</div>` : ''}
                </div>

                <!-- Row 4: Barcode + Order ID -->
                <div style="text-align: center; margin-bottom: ${spacingSmall}; padding: ${isMedium ? '4px' : '8px'} 0; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc;">
                    ${showBarcode ? `<div class="barcode-container" style="display: flex; justify-content: center; margin-bottom: ${spacingMicro};">${barcode}</div>` : ''}
                    <div style="font-weight: 900; font-size: ${orderIdSize}; font-family: monospace; letter-spacing: 0.5px;">${data.originalOrderRef ? `Order: ${data.originalOrderRef}` : `ORDER #PA-${formattedOrderRef}`}</div>
                </div>

                <!-- Row 5: Item Manifest Table -->
                <div style="flex: 1; min-height: 0; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse; font-size: ${tableFontSize};">
                        <thead>
                            <tr style="border-bottom: 1.5px solid #000;">
                                <th style="padding: ${isMedium ? '2px' : '5px'} 0; text-align: left; font-weight: 900; text-transform: uppercase; font-size: ${tableFontSize};">Item</th>
                                <th style="padding: ${isMedium ? '2px' : '5px'} 0; text-align: left; font-weight: 900; text-transform: uppercase; font-size: ${tableFontSize};">SKU</th>
                                <th style="padding: ${isMedium ? '2px' : '5px'} 0; text-align: right; font-weight: 900; text-transform: uppercase; font-size: ${tableFontSize};">Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(data.lineItems || []).slice(0, maxItems).map((item) => `
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: ${isMedium ? '3px' : '6px'} 0;">${item.name || 'Unknown Item'}</td>
                                    <td style="padding: ${isMedium ? '3px' : '6px'} 0; font-family: monospace;">${item.sku || 'N/A'}</td>
                                    <td style="padding: ${isMedium ? '3px' : '6px'} 0; text-align: right; font-weight: 700;">${item.quantity || 0}</td>
                                </tr>
                            `).join('')}

                            ${(data.lineItems || []).length > maxItems ? `
                                <tr>
                                    <td colspan="3" style="padding: 4px 0; text-align: center; font-style: italic; color: #888; font-size: 9px;">
                                        + ${(data.lineItems || []).length - maxItems} more items
                                    </td>
                                </tr>
                            ` : ''}
                            ${(!data.lineItems || data.lineItems.length === 0) ? `
                                <tr>
                                    <td colspan="3" style="padding: 12px 0; text-align: center; color: #888; font-size: 10px;">
                                        ${data.itemCount} item${data.itemCount !== 1 ? 's' : ''} in this shipment
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>

                <!-- Row 6: Footer -->
                <div style="margin-top: auto; padding-top: ${isMedium ? '4px' : '10px'};">
                    <div style="font-size: ${footerSize}; font-weight: 600;">Thank you for choosing SiifMart.</div>
                    <div style="font-size: ${footerSize}; margin-top: 2px;"><strong>PACK DATE:</strong> ${formattedPackDate}</div>
                </div>
            </div>

        `;
    }


    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pack Label - ${data.orderRef}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
                @page {
                    size: ${css.page};
                    margin: 0;
                }
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                    font-family: 'Inter', Arial, sans-serif;
                }
                .label {
                    width: ${css.width};
                    height: ${css.height};
                    border: 1px dotted #ccc;
                    box-sizing: border-box;
                    page-break-after: always;
                    overflow: hidden;
                    margin: 0 auto;
                    background: white;
                }
                svg {
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                    display: block;
                }
                .qr-container svg { width: 100%; height: auto; }
                .barcode-container svg { width: auto; height: auto; max-width: 100%; }
                .no-print {
                    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
                    background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px;
                    z-index: 9999;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                @media print {
                    .no-print { display: none; }
                    .label { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="font-size: 16px; padding: 12px 24px; font-weight: 900; cursor: pointer; background: #000; color: #fff; border: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">🖨️ Print Label</button>
            </div>
            <div class="label">
                ${contentHTML}
            </div>
        </body>
        </html>
    `;
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
    }
): Promise<string> => {
    const { size, format } = options;

    // Normalize size - handle both 'SMALL' and 'Small' inputs
    const normalizedSize = (s: string): LabelSize => {
        const lower = s.toLowerCase();
        if (lower === 'tiny') return 'Tiny';
        if (lower === 'small') return 'Small';
        if (lower === 'medium') return 'Medium';
        if (lower === 'large' || lower === 'xl') return 'Large';
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

    const { showPrice, showCategory, showDate } = options;


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
        const qrData = JSON.stringify({ sku: item.value, name: item.label, date: new Date().toISOString().split('T')[0] });

        // Defensive check for value
        if (!item.value) {
            return `<div class="label" style="width: ${css.width}; height: ${css.height}; display:flex; align-items:center; justify-content:center; color:red;">INVALID ITEM</div>`;
        }

        // ============================================================
        if (validSize === 'Tiny' || validSize === 'Small') {
            // For "Both" on small labels, prefer QR (more info in less space)
            const useQR = validFormat === 'QR' || validFormat === 'Both';

            // Tiny meta - very compact, just price
            const tinyMeta = validSize === 'Tiny' && showPrice && item.price ? `
                <div class="price-tiny" style="font-size: 14px; margin-top: 0px;">ETB ${item.price}</div>
            ` : '';

            // Compact meta for Small labels - Price PROMINENT, item name + brand below
            const compactMeta = validSize === 'Small' && ((showPrice && item.price) || (showCategory && (item.label || item.category)) || (showDate && item.date)) ? `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0px; margin-top: 1px; width: 100%;">
                    ${showPrice && item.price ? `<div class="price-tiny">ETB ${item.price}</div>` : ''}
                    ${showCategory ? `<div style="font-size: 5px; color: #000; text-align: center; line-height: 1; font-weight: bold;">${item.label ? item.label.slice(0, 15) : ''}</div>` : ''}
                    ${showDate && item.date ? `<div style="font-size: 4px; color: #000; font-weight: bold;">${item.date}</div>` : ''}
                </div>
            ` : '';

            // Use appropriate meta based on size
            const meta = validSize === 'Tiny' ? tinyMeta : compactMeta;

            if (useQR) {
                // QR CODE - Maximized
                const qr = await generateQRCode({
                    data: qrData,
                    size: 100 // SVG size defaults
                });
                const qrSize = validSize === 'Tiny' ? '0.7in' : '0.95in'; // Smaller QR on tiny to fit price

                contentHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 2px;">
                        <div class="qr-container" style="width: ${qrSize}; height: ${qrSize};">${qr}</div>
                        <div style="font-family: monospace; font-size: ${validSize === 'Tiny' ? '5px' : '6px'}; margin-top: 0px; white-space: nowrap; text-align: center;">${item.value}</div>
                        ${meta}
                    </div>
                `;
            } else {
                // BARCODE - Maximized
                const height = validSize === 'Tiny' ? 20 : 28;
                const fontSize = validSize === 'Tiny' ? 7 : 9;
                const width = validSize === 'Tiny' ? 1 : 1.5;

                const barcode = generateBarcodeSVG(item.value, {
                    format: 'CODE128',
                    width,
                    height,
                    displayValue: true,
                    fontSize,
                    margin: 0
                });

                contentHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 2px;">
                        <div class="barcode-container" style="width: 100%; display: flex; justify-content: center;">${barcode || 'ERROR'}</div>
                        ${meta}
                    </div>
                `;
            }
        }

        // ============================================================
        // MEDIUM / LARGE: BOTH CODES SIDE-BY-SIDE, CODES PRIORITIZED
        // ============================================================
        else {
            const showQR = validFormat === 'QR' || validFormat === 'Both';
            const showBarcode = validFormat === 'Barcode' || validFormat === 'Both';

            const qr = showQR ? await generateQRCode({ data: qrData, size: 100 }) : '';

            // Barcode params for Medium/Large
            const barHeight = 40;
            const barFontSize = 10;
            const barWidth = 1.5;

            const barcode = showBarcode ? generateBarcodeSVG(item.value, {
                format: 'CODE128',
                width: barWidth,
                height: barHeight,
                displayValue: true,
                fontSize: barFontSize,
                margin: 0
            }) : '';

            // Size configurations for maximum visibility
            const qrSize = validSize === 'Medium' ? '1.2in' : '1.8in';
            const barcodeScale = validSize === 'Medium' ? 1 : 1.2;
            const padding = validSize === 'Medium' ? '6px' : '10px';
            const fontSize = validSize === 'Medium' ? '9px' : '11px';
            const skuFontSize = validSize === 'Medium' ? '8px' : '10px';

            // Metadata section - Price is HUGE and ISOLATED, item name + brand below
            const priceClass = validSize === 'Large' || validSize === 'XL' ? 'price-huge' : 'price-medium';
            const metaHTML = (showPrice && item.price) || (showCategory && (item.label || item.category)) || (showDate && item.date) ? `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; margin-top: 4px; width: 100%;">
                    ${showPrice && item.price ? `
                        <div class="${priceClass}">
                            ETB ${item.price}
                        </div>
                    ` : ''}
                    ${showCategory ? `
                        <div style="font-size: 8px; color: #333; text-align: center; line-height: 1.4; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                            ${item.label || ''}
                        </div>
                    ` : ''}
                    ${showDate && item.date ? `<div style="font-size: 7px; color: #555; font-weight: 500; letter-spacing: 0.05em;">EXP: ${item.date}</div>` : ''}
                </div>
            ` : '';

            if (validFormat === 'Both') {
                // BOTH: QR on left, Barcode on right, codes fill the space
                contentHTML = `
                    <div style="display: flex; height: 100%; padding: ${padding}; gap: 8px;">
                        <div class="qr-container" style="width: ${qrSize}; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                            ${qr}
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden;">
                            <div class="barcode-container" style="margin-bottom: 5px;">${barcode || 'ERROR'}</div>
                            ${validSize === 'Large' || validSize === 'XL' ? `
                                <div style="font-weight: bold; font-size: ${fontSize}; text-align: center; margin-top: 5px; white-space: nowrap; overflow: hidden; max-width: 100%;">${item.label}</div>
                                <div style="font-family: monospace; font-size: ${skuFontSize}; color: #444;">${item.value}</div>
                                ${metaHTML}
                            ` : `
                                <div style="font-family: monospace; font-size: ${skuFontSize}; margin-top: 3px;">${item.value}</div>
                                ${metaHTML}
                            `}
                        </div>
                    </div>
                `;
            } else if (validFormat === 'QR') {
                // QR ONLY: Centered and maximized
                contentHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: ${padding};">
                        <div class="qr-container" style="width: ${validSize === 'Medium' ? '1.6in' : '2.2in'};">${qr}</div>
                        <div style="font-family: monospace; font-size: ${skuFontSize}; margin-top: 8px;">${item.value}</div>
                        ${validSize === 'Large' || validSize === 'XL' ? `<div style="font-size: ${fontSize}; margin-top: 3px; color: #444;">${item.label}</div>` : ''}
                        ${metaHTML}
                    </div>
                `;
            } else {
                // BARCODE ONLY: Centered and maximized
                contentHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: ${padding};">
                        <div class="barcode-container" style="width: 95%; display: flex; justify-content: center;">${barcode || 'ERROR'}</div>
                        ${validSize === 'Large' || validSize === 'XL' ? `<div style="font-size: ${fontSize}; margin-top: 8px; text-align: center;">${item.label}</div>` : ''}
                        ${metaHTML}
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
            <style>
                @page {
                    size: ${css.page};
                    margin: 0;
                }
                * {
                    box-sizing: border-box;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    letter-spacing: 0.02em;
                }
                .label {
                    border: 1px dotted #ccc;
                    box-sizing: border-box;
                    page-break-after: always;
                    overflow: hidden;
                    margin: 0 auto;
                    background: white;
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
                .price-huge {
                    font-size: 18px; /* Elegant Size */
                    font-weight: 700;
                    text-align: center;
                    width: 100%;
                    line-height: 1.2;
                    margin-top: 4px;
                    letter-spacing: 0.05em;
                }
                .price-medium {
                    font-size: 14px;
                    font-weight: 700;
                    text-align: center;
                     width: 100%;
                     line-height: 1.2;
                     margin-top: 3px;
                     letter-spacing: 0.05em;
                }
                 .price-tiny {
                    font-size: 10px;
                    font-weight: 700;
                    text-align: center;
                    width: 100%;
                    line-height: 1.2;
                    letter-spacing: 0.05em;
                }
                .no-print {
                    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
                    background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px;
                    z-index: 9999;
                }
                @media print {
                    .no-print { display: none; }
                    .label { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="font-size: 16px; padding: 10px 20px; font-weight: bold; cursor: pointer;">🖨️ Print Labels</button>
            </div>
            ${labelItemsHTML.join('\n')}
        </body>
        </html>
    `;
};
