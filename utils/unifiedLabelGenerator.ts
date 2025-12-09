import { generateBarcodeSVG } from './barcodeGenerator';
import { generateQRCode } from './qrCodeGenerator';
import { formatOrderRef } from './jobIdFormatter';

export type LabelSize = 'Tiny' | 'Small' | 'Medium' | 'Large';
export type LabelFormat = 'QR' | 'Barcode' | 'Both';

// Standard Retail/Warehouse Sizes
// Tiny: 1.25" x 1" (Standard SKU/Price Tag)
// Small: 2.25" x 1.25" (Standard Multipurpose - Dymo 30334)
// Medium: 3" x 2" (Standard Name/Shelf Tag)
// Large: 4" x 3" (Standard Carton/Inventory Tag)

const SIZE_CSS = {
    'Tiny': { width: '1.25in', height: '1in', page: '1.25in 1in' },
    'Small': { width: '2.25in', height: '1.25in', page: '2.25in 1.25in' },
    'Medium': { width: '3in', height: '2in', page: '3in 2in' },
    'Large': { width: '4in', height: '3in', page: '4in 3in' }
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
}

export const generatePackLabelHTML = async (
    data: PackLabelData,
    options: {
        size: LabelSize | string;
        format: LabelFormat | string;
    }
): Promise<string> => {
    const { size, format } = options;

    // Normalize size
    const normalizedSize = (s: string): LabelSize => {
        const lower = s.toLowerCase();
        if (lower === 'tiny') return 'Tiny';
        if (lower === 'small') return 'Small';
        if (lower === 'medium') return 'Medium';
        if (lower === 'large' || lower === 'xl') return 'Large';
        return 'Large'; // Default to Large for pack labels
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
    const barcode = generateBarcodeSVG(formattedOrderRef, {
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

    // Build label HTML based on size
    let contentHTML = '';

    if (validSize === 'Tiny' || validSize === 'Small') {
        // Compact layout - just barcode and order ref
        contentHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 4px;">
                <div class="barcode-container" style="width: 100%;">${barcode || 'ERROR'}</div>
                ${data.itemCount ? `<div style="font-size: 8px; margin-top: 2px;">${data.itemCount} items</div>` : ''}
            </div>
        `;
    } else if (validSize === 'Medium') {
        // Medium layout - barcode + basic info
        const showQR = validFormat === 'QR' || validFormat === 'Both';
        const showBarcode = validFormat === 'Barcode' || validFormat === 'Both';

        contentHTML = `
            <div style="display: flex; flex-direction: column; height: 100%; padding: 6px; font-size: 9px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                    ${showQR ? `<div class="qr-container" style="width: 1in; flex-shrink: 0;">${qr}</div>` : ''}
                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <div style="font-weight: bold; font-size: 11px;">#${formattedOrderRef}</div>
                        ${data.customerName ? `<div style="margin-top: 2px;">${data.customerName}</div>` : ''}
                        ${data.city ? `<div style="color: #666;">${data.city}</div>` : ''}
                        <div style="margin-top: 4px; font-weight: bold;">${data.itemCount} items</div>
                    </div>
                </div>
                ${showBarcode ? `<div class="barcode-container" style="width: 100%; margin-top: auto;">${barcode}</div>` : ''}
            </div>
        `;
    } else {
        // Large layout - full detailed label
        const showQR = validFormat === 'QR' || validFormat === 'Both';
        const showBarcode = validFormat === 'Barcode' || validFormat === 'Both';

        contentHTML = `
            <div style="display: flex; flex-direction: column; height: 100%; padding: 8px; font-family: Arial, sans-serif;">
                <!-- Header with Order # and Date -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 6px;">
                    <div style="font-weight: bold; font-size: 14px;">#${formattedOrderRef}</div>
                    <div style="font-size: 10px; color: #666;">${data.packDate || new Date().toLocaleDateString()}</div>
                </div>

                <!-- Main Content Area -->
                <div style="display: flex; gap: 8px; flex: 1;">
                    <!-- Left: QR Code -->
                    ${showQR ? `
                    <div style="width: 1.2in; flex-shrink: 0; display: flex; flex-direction: column; align-items: center;">
                        <div class="qr-container" style="width: 100%;">${qr}</div>
                        ${data.packageNumber ? `<div style="font-size: 10px; font-weight: bold; margin-top: 4px;">PKG ${data.packageNumber}/${data.totalPackages || 1}</div>` : ''}
                    </div>
                    ` : ''}

                    <!-- Right: Details -->
                    <div style="flex: 1; display: flex; flex-direction: column; font-size: 10px;">
                        <!-- Customer Info -->
                        ${data.customerName ? `<div style="font-weight: bold; font-size: 12px;">${data.customerName}</div>` : ''}
                        ${data.shippingAddress ? `<div style="margin-top: 2px; color: #333;">${data.shippingAddress}</div>` : ''}
                        ${data.city ? `<div style="color: #333;">${data.city}</div>` : ''}
                        ${data.destSiteName ? `<div style="margin-top: 4px; font-style: italic; color: #666;">→ ${data.destSiteName}</div>` : ''}

                        <!-- Stats -->
                        <div style="margin-top: auto; display: flex; gap: 12px; font-weight: bold;">
                            <div>📦 ${data.itemCount} items</div>
                            ${data.weight ? `<div>⚖️ ${data.weight}</div>` : ''}
                        </div>

                        <!-- Special Handling -->
                        ${handlingIcons.length > 0 ? `
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; font-size: 9px; font-weight: bold; color: #c00;">
                            ${handlingIcons.map(icon => `<span style="background: #fee; padding: 2px 4px; border-radius: 3px;">${icon}</span>`).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Barcode Footer -->
                ${showBarcode ? `
                <div style="margin-top: auto; border-top: 1px solid #ccc; padding-top: 4px;">
                    <div class="barcode-container" style="width: 100%; display: flex; justify-content: center;">${barcode}</div>
                </div>
                ` : ''}

                <!-- Packer Info Footer -->
                ${data.packerName ? `
                <div style="font-size: 8px; color: #999; text-align: right; margin-top: 2px;">
                    Packed by: ${data.packerName}
                </div>
                ` : ''}
            </div>
        `;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pack Label - ${data.orderRef}</title>
            <style>
                @page {
                    size: ${css.page};
                    margin: 0;
                }
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                    font-family: Arial, sans-serif;
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
                }
                @media print {
                    .no-print { display: none; }
                    .label { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="font-size: 16px; padding: 10px 20px; font-weight: bold; cursor: pointer;">🖨️ Print Label</button>
            </div>
            <div class="label">
                ${contentHTML}
            </div>
        </body>
        </html>
    `;
};


export const generateUnifiedBatchLabelsHTML = async (
    items: Array<{ value: string; label: string; quantity?: number }>,
    options: {
        size: LabelSize | string;
        format: LabelFormat | string;
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

    console.log('📋 Label generation:', { originalSize: size, validSize, originalFormat: format, validFormat, itemCount: items.length });

    // Expand items with quantity into individual labels
    const expandedItems: Array<{ value: string; label: string; index: number; total: number }> = [];
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
                total: totalLabels
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
        // TINY / SMALL: ONE CODE ONLY, MAXIMIZE VISIBILITY
        // ============================================================
        if (validSize === 'Tiny' || validSize === 'Small') {
            // For "Both" on small labels, prefer QR (more info in less space)
            const useQR = validFormat === 'QR' || validFormat === 'Both';

            if (useQR) {
                // QR CODE - Maximized
                const qr = await generateQRCode({
                    data: qrData,
                    size: 100 // SVG size defaults
                });
                const qrSize = validSize === 'Tiny' ? '0.85in' : '1.1in'; // Bigger QR for scannability

                contentHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 4px;">
                        <div class="qr-container" style="width: ${qrSize}; height: ${qrSize};">${qr}</div>
                        <div style="font-family: monospace; font-size: ${validSize === 'Tiny' ? '6px' : '7px'}; margin-top: 2px; white-space: nowrap; text-align: center;">${item.value}</div>
                    </div>
                `;
            } else {
                // BARCODE - Maximized
                const height = validSize === 'Tiny' ? 25 : 30;
                const fontSize = validSize === 'Tiny' ? 8 : 10;
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
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 4px;">
                        <div class="barcode-container" style="width: 100%; display: flex; justify-content: center;">${barcode || 'ERROR'}</div>
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

            if (validFormat === 'Both') {
                // BOTH: QR on left, Barcode on right, codes fill the space
                contentHTML = `
                    <div style="display: flex; height: 100%; padding: ${padding}; gap: 8px;">
                        <div class="qr-container" style="width: ${qrSize}; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                            ${qr}
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden;">
                            <div class="barcode-container" style="margin-bottom: 5px;">${barcode || 'ERROR'}</div>
                            ${validSize === 'Large' ? `
                                <div style="font-weight: bold; font-size: ${fontSize}; text-align: center; margin-top: 5px; white-space: nowrap; overflow: hidden; max-width: 100%;">${item.label}</div>
                                <div style="font-family: monospace; font-size: ${skuFontSize}; color: #444;">${item.value}</div>
                            ` : `
                                <div style="font-family: monospace; font-size: ${skuFontSize}; margin-top: 3px;">${item.value}</div>
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
                        ${validSize === 'Large' ? `<div style="font-size: ${fontSize}; margin-top: 3px; color: #444;">${item.label}</div>` : ''}
                    </div>
                `;
            } else {
                // BARCODE ONLY: Centered and maximized
                contentHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: ${padding};">
                        <div class="barcode-container" style="width: 95%; display: flex; justify-content: center;">${barcode || 'ERROR'}</div>
                        ${validSize === 'Large' ? `<div style="font-size: ${fontSize}; margin-top: 8px; text-align: center;">${item.label}</div>` : ''}
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
                    font-family: Arial, sans-serif;
                }
                .label {
                    border: 1px dotted #ccc;
                    box-sizing: border-box;
                    page-break-after: always;
                    overflow: hidden;
                    margin: 0 auto;
                    background: white;
                }
                /* SVG containment - critical for proper sizing */
                svg {
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                    display: block;
                }
                /* QR code container */
                .qr-container svg {
                    width: 100%;
                    height: 100%;
                }
                /* Barcode container - ensure bars are sharp */
                .barcode-container svg {
                    width: auto;
                    height: auto;
                    max-width: 100%;
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
