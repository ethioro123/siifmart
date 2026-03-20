import { generateBarcodeSVG } from '../barcodeGenerator';
import { generateQRCode } from '../qrCodeGenerator';
import { formatOrderRef } from '../jobIdFormatter';
import { LabelSize, LabelFormat, SIZE_CSS } from './types';

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
        unit?: string;
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
        if (lower === 'small') return 'Small';
        if (lower === 'medium') return 'Medium';
        if (lower === 'large') return 'Large';
        if (lower === 'xl' || lower === 'extra large') return 'XL';
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
        height: 52,
        displayValue: false,
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

    if (validSize === 'Small') {
        const formattedOrderRef = data.orderRef?.slice(-6).toUpperCase() || 'N/A';
        const displayDate = data.packDate ? new Date(data.packDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

        // ULTRA-MINIMAL: No inner grid, just high-density data
        contentHTML = `
            <div style="display: flex; flex-direction: column; height: 100%; border: 1.5px solid #000; font-family: 'SF Mono', 'Fira Code', 'Inter', monospace; color: #000; background: #fff; box-sizing: border-box; padding: 10px; overflow: hidden; line-height: 1.0;">
                <!-- TRK NUMBER & DATE -->
                <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 9px; text-transform: uppercase; margin-bottom: 6px;">
                    <span>TRK: ${data.trackingNumber || formattedOrderRef}</span>
                    <span>${displayDate}</span>
                </div>
                
                <!-- DESTINATION -->
                <div style="margin-bottom: 8px;">
                    <div style="font-weight: 900; font-size: 18px; text-transform: uppercase; line-height: 0.9; margin-bottom: 3px;">${data.customerName || data.destSiteName || 'RECIPIENT'}</div>
                    ${data.shippingAddress ? `<div style="font-size: 10px; font-weight: 700; text-transform: uppercase; max-height: 20px; overflow: hidden;">${data.shippingAddress}</div>` : ''}
                </div>

                <!-- TINY MANIFEST (NO BORDERS) -->
                <div style="flex: 1; min-height: 0; padding-top: 3px; margin-bottom: 6px; overflow: hidden;">
                    <div style="font-size: 9px; font-weight: 700;">
                        ${(data.lineItems || []).slice(0, 4).map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px; text-transform: uppercase; border-bottom: 1px dotted #ccc;">
                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${item.name || 'ITEM'}</span>
                                <span style="margin-left: 6px; font-weight: 900;">[${item.quantity}${item.unit ? ` ${item.unit}` : ''}]</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- BARCODE AT BOTTOM -->
                <div style="margin-top: auto; padding-top: 3px;">
                    <div class="barcode-container" style="height: 36px; width: 100%; display:flex; justify-content:center;">${barcode || 'ERROR'}</div>
                    <div style="text-align: center; font-family:'SF Mono', 'Fira Code', monospace; font-size: 10px; font-weight: 900; letter-spacing: 1px; margin-top: 4px; color: #000;">${data.trackingNumber || formattedOrderRef}</div>
                </div>
            </div>
        `;
    } else if (validSize === 'Medium' || validSize === 'Large') {
        const isM = validSize === 'Medium';
        const pSize = isM ? '10px' : '16px';
        const shipToName = isM ? '21px' : '28px';
        const shipToAdd = isM ? '10px' : '13px';
        const displayDate = data.packDate ? new Date(data.packDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

        // ONLY SHOW QR ON LARGE/XL, REMOVE FROM MEDIUM TO SAVE SPACE
        const showQR = !isM && (validFormat === 'QR' || validFormat === 'Both');

        contentHTML = `
            <div style="display: flex; flex-direction: column; height: 100%; border: 2px solid #000; font-family: 'SF Mono', 'Fira Code', 'Inter', monospace; color: #000; background: #fff; box-sizing: border-box; padding: ${pSize}; overflow: hidden; line-height: 1.05;">
                <!-- HEADER BAR -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; flex-shrink: 0;">
                    <div>
                        <div style="font-weight: 900; font-size: 14px; letter-spacing: 0.1em;">SIIFMART LOGISTICS</div>
                        <div style="font-size: 9px; font-weight: 900; color: #333;">ROUTING // ${displayDate}</div>
                    </div>
                    ${showQR ? `<div class="qr-container" style="width: 0.65in; height: 0.65in; border: 2px solid #000; padding: 3px;">${qr}</div>` : ''}
                </div>

                <!-- DESTINATION SECTION -->
                <div style="margin-bottom: 10px; flex-shrink: 0;">
                    <div style="font-weight: 900; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px; color: #000;">TO:</div>
                    <div style="font-weight: 900; font-size: ${shipToName}; text-transform: uppercase; line-height: 0.9; margin-bottom: 6px;">${data.customerName || data.destSiteName || 'RECIPIENT'}</div>
                    ${data.shippingAddress ? `<div style="font-size: ${shipToAdd}; font-weight: 700; text-transform: uppercase; max-height: 28px; overflow: hidden;">${data.shippingAddress}</div>` : ''}
                </div>

                <!-- PRODUCT MANIFEST (NO GRID, JUST DASHED SEPARATORS) -->
                <div style="flex: 1; min-height: 0; padding: 5px 0; margin-bottom: 10px; overflow: hidden;">
                    <div style="font-weight: 900; font-size: 9px; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.1em; opacity: 0.7;">MANIFEST</div>
                    <div style="font-size: 10px; font-weight: 700;">
                        ${(data.lineItems || []).slice(0, isM ? 8 : 10).map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px; text-transform: uppercase; border-bottom: 1px dotted #ddd;">
                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${item.name || 'ITEM'}</span>
                                <span style="margin-left: 10px; font-weight: 900;">[${item.quantity}${item.unit ? ` ${item.unit}` : ''}]</span>
                            </div>
                        `).join('')}
                        ${(data.lineItems || []).length > (isM ? 8 : 10) ? `<div style="font-size: 8px; text-align: center; color: #999;">+ ${(data.lineItems || []).length - (isM ? 8 : 10)} MORE</div>` : ''}
                    </div>
                </div>

                <!-- BOTTOM INFO BAND -->
                <div style="flex-shrink: 0;">
                    <div class="barcode-container" style="height: 45px; margin-bottom: 5px; display:flex; justify-content:center;">${barcode}</div>
                    <div style="text-align: center; font-family:'SF Mono', 'Fira Code', monospace; font-size: 13px; font-weight: 900; letter-spacing: 2px; margin-bottom: 8px; color: #000;">${data.trackingNumber || formattedOrderRef}</div>
                    <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 10px; text-transform: uppercase;">
                        <span>TRK: ${data.trackingNumber || formattedOrderRef}</span>
                        <span>${data.packageNumber ? `PKG: ${data.packageNumber}/${data.totalPackages || 1}` : `${data.totalPackages || 1} PACKAGE${(data.totalPackages || 1) > 1 ? 'S' : ''}`}</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        // XL LABEL - PROFESSIONAL & BRUTALIST BUT MINIMALIST INNER GRID
        const pSize = '26px';
        const showQR = validFormat === 'QR' || validFormat === 'Both';

        contentHTML = `
            <div style="display: flex; flex-direction: column; height: 100%; border: 4px solid #000; font-family: 'SF Mono', 'Fira Code', 'Inter', monospace; color: #000; background: #fff; box-sizing: border-box; padding: ${pSize}; overflow: hidden; line-height: 1.1;">
                <!-- TOP HEADER -->
                <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; flex-shrink: 0;">
                    <div>
                        <div style="font-weight: 900; font-size: 28px; letter-spacing: 0.1em;">SIIFMART LOGISTICS</div>
                        <div style="font-size: 13px; font-weight: 900; margin-top: 3px;">DOMESTIC PRIORITY SERVICE // 2026 EDITION</div>
                    </div>
                    ${showQR ? `<div class="qr-container" style="width: 1.0in; height: 1.0in; border: 4px solid #000; padding: 5px;">${qr}</div>` : ''}
                </div>

                <!-- MAIN SHIP BLOCK -->
                <div style="display: flex; flex-direction: column; min-height: 0; border-bottom: 3px solid #000; padding-bottom: 20px;">
                    <!-- SENDER (TOP LEFT, SMALL) -->
                    <div style="margin-bottom: 15px;">
                        <div style="font-weight: 900; font-size: 10px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.1em; color: #666;">FROM:</div>
                        <div style="font-size: 11px; font-weight: 700; line-height: 1.2; text-transform: uppercase; color: #333;">
                            ${data.fromName || 'SiifMart Logistics Center'} // ${data.fromAddress?.replace(/<br>/g, ', ') || 'Bole Sub-City, Woreda 03, Addis Ababa'}
                        </div>
                    </div>

                    <!-- RECIPIENT (CENTER, BOLD) -->
                    <div>
                        <div style="font-weight: 900; font-size: 12px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.2em; color: #000;">SHIP TO:</div>
                        <div style="font-weight: 900; font-size: 32px; text-transform: uppercase; line-height: 1.0; margin-bottom: 8px;">
                            ${data.customerName || data.destSiteName || 'RECIPIENT'}
                        </div>
                        <div style="font-size: 20px; font-weight: 700; text-transform: uppercase; line-height: 1.1; margin-bottom: 4px;">
                            ${data.shippingAddress || ''}
                        </div>
                        <div style="font-weight: 900; font-size: 28px; text-transform: uppercase; letter-spacing: 1px;">
                            ${data.city || ''}
                        </div>
                    </div>
                </div>

                <!-- PRODUCT MANIFEST -->
                ${(data.lineItems && data.lineItems.length > 0) ? `
                <div style="margin-top: 16px; padding: 12px 0; border-top: 1.5px solid #000; flex: 1; min-height: 0; overflow: hidden;">
                    <div style="font-weight: 900; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.15em; opacity: 0.7;">MANIFEST — ${data.lineItems.length} ITEM${data.lineItems.length > 1 ? 'S' : ''}</div>
                    <div style="font-size: 13px; font-weight: 700;">
                        ${data.lineItems.slice(0, 12).map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 3px; text-transform: uppercase; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">
                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${item.name || 'ITEM'}</span>
                                <span style="margin-left: 12px; min-width: 30px; text-align: right; font-weight: 900;">${item.sku || ''}</span>
                                <span style="margin-left: 12px; font-weight: 900;">[${item.quantity}${item.unit ? ` ${item.unit}` : ''}]</span>
                            </div>
                        `).join('')}
                        ${data.lineItems.length > 12 ? `<div style="font-size: 10px; text-align: center; color: #666; margin-top: 4px;">+ ${data.lineItems.length - 12} MORE</div>` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- BARCODE & TRACKING -->
                <div style="margin-top: 26px; border-top: 3px solid #000; padding-top: 20px; text-align: center; flex-shrink: 0;">
                    <div class="barcode-container" style="height: 78px; margin-bottom: 13px; display:flex; justify-content:center;">${barcode}</div>
                    <div style="font-weight: 900; font-size: 21px; letter-spacing: 0.3em; text-transform: uppercase; font-family:'SF Mono', 'Fira Code', monospace; margin-top:10px; color: #000;">
                        * TRK :: ${data.trackingNumber || formattedOrderRef} *
                    </div>
                </div>

                <!-- FOOTER DATA -->
                <div style="margin-top: 20px; display: flex; justify-content: space-between; font-weight: 900; font-size: 13px; border-top: 1.5px solid #000; padding-top: 10px; flex-shrink: 0;">
                    <span>DATE: ${data.packDate ? new Date(data.packDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</span>
                    <span>${data.packageNumber ? `PACKAGE: ${data.packageNumber} OF ${data.totalPackages || 1}` : `${data.totalPackages || 1} PACKAGE${(data.totalPackages || 1) > 1 ? 'S' : ''}`}</span>
                    <span>ITEMS: [ ${data.itemCount} ]</span>
                </div>
            </div>
        `;
    }


    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>TRK-${data.orderRef}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Fira+Code:wght@700&display=swap" rel="stylesheet">
            <style>
                @page {
                    size: ${css.page};
                    margin: 0;
                }
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 0;
                    background: #fff; /* Ensure stark white background */
                }
                .label {
                    width: ${css.width};
                    height: ${css.height};
                    border: none; /* Borders handled in internal wrapper now */
                    box-sizing: border-box;
                    page-break-after: always;
                    overflow: hidden;
                    margin: 0 auto;
                    background: #fff;
                }
                svg {
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                    display: block;
                }
                .qr-container svg { width: 100%; height: auto; display: block; }
                .barcode-container svg { width: auto; height: auto; max-width: 100%; display: block; margin: 0 auto; }
                
                .no-print {
                    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
                    background: #000; padding: 12px; border: 4px solid #fff; border-radius: 0;
                    z-index: 9999;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                
                .no-print button {
                    font-family: 'Fira Code', 'Inter', monospace;
                    font-size: 14px; padding: 10px 20px; font-weight: 900; 
                    cursor: pointer; background: #000; color: #fff; 
                    border: 2px solid #fff; text-transform: uppercase; 
                    letter-spacing: 2px; transition: all 0.2s;
                }
                
                .no-print button:hover {
                    background: #fff; color: #000;
                }

                @media print {
                    .no-print { display: none !important; }
                    /* Force black and white rendering if printer supports it */
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #000 !important; }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()">[ EXECUTE PRINT ]</button>
            </div>
            <div class="label">
                ${contentHTML}
            </div>
        </body>
        </html>
    `;
};


