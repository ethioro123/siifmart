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
        bubbleWrap?: boolean;
        stickers?: boolean;
        thisSideUp?: boolean;
        securitySeal?: boolean;
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
        quantity: number | string;
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
        if (lower === 'xl' || lower === 'extra large' || lower === 'thermal cool box') return 'XL';
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
    
    // Barcode dimensions tuned per label size
    const barcodeHeight = validSize === 'Small' ? 28 : validSize === 'Medium' ? 36 : validSize === 'Large' ? 48 : 58;
    const barcodeWidth = validSize === 'Small' ? 1.4 : validSize === 'Medium' ? 1.7 : 2;

    const barcode = generateBarcodeSVG(barcodeValue, {
        format: 'CODE128',
        width: barcodeWidth,
        height: barcodeHeight,
        displayValue: false,
        margin: 1
    });

    const qrSize = validSize === 'Small' ? 50 : validSize === 'Medium' ? 65 : validSize === 'Large' ? 85 : 110;
    const qr = await generateQRCode({ data: qrData, size: qrSize });

    // Modern Industrial Special Handling Badges (Vector SVGs with high-contrast typography)
    const getHandlingBadges = () => {
        const badges: Array<{ icon: string; title: string }> = [];

        if (data.specialHandling?.fragile) {
            badges.push({
                icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8M12 11v11M19 3l-7 8-7-8h14zM12 3v4"/></svg>`,
                title: 'FRAGILE'
            });
        }
        if (data.specialHandling?.thisSideUp) {
            badges.push({
                icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/><line x1="12" y1="9" x2="12" y2="21"/><line x1="6" y1="4" x2="18" y2="4"/></svg>`,
                title: 'THIS SIDE UP'
            });
        }
        if (data.specialHandling?.bubbleWrap) {
            badges.push({
                icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
                title: 'BUBBLE WRAPPED'
            });
        }
        if (data.specialHandling?.securitySeal || data.specialHandling?.stickers) {
            badges.push({
                icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
                title: 'SECURITY SEALED'
            });
        }
        if (data.specialHandling?.coldChain) {
            badges.push({
                icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/></svg>`,
                title: 'COLD CHAIN'
            });
        }
        if (data.specialHandling?.perishable && !data.specialHandling?.coldChain) {
            badges.push({
                icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
                title: 'PERISHABLE'
            });
        }
        if (data.specialHandling?.hazmat) {
            badges.push({
                icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 0-8.66 15l2.6-1.5A7 7 0 0 1 12 5z"/><path d="M20.66 17A10 10 0 0 0 12 2v3a7 7 0 0 1 6.06 10.5z"/><path d="M3.34 17a10 10 0 0 0 17.32 0l-2.6-1.5a7 7 0 0 1-12.12 0z"/></svg>`,
                title: 'HAZMAT'
            });
        }
        return badges;
    };

    const handlingBadges = getHandlingBadges();
    const handlingHTML = handlingBadges.length > 0 ? `
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin: 3px 0 5px 0;">
            ${handlingBadges.map(b => `
                <div style="display: inline-flex; align-items: center; gap: 4px; border: 1.5px solid #000; background: #000; color: #fff; padding: 2px 5px; border-radius: 2px; font-family: 'SF Mono', 'Fira Code', 'Inter', monospace; line-height: 1;">
                    <span style="display: inline-flex; align-items: center; justify-content: center; width: 12px; height: 12px; color: #fff;">${b.icon}</span>
                    <span style="font-size: 8px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;">${b.title}</span>
                </div>
            `).join('')}
        </div>
    ` : '';

    // Build label HTML
    let contentHTML = '';

    if (validSize === 'Small') {
        const formattedOrderRef = data.orderRef?.slice(-6).toUpperCase() || 'N/A';
        const displayDate = data.packDate ? new Date(data.packDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

        // SMALL LABEL (74mm x 41mm): Compact, high-density, perfectly fit
        contentHTML = `
            <div style="display: flex; flex-direction: column; min-height: 100%; border: 1.5px solid #000; font-family: 'SF Mono', 'Fira Code', 'Inter', monospace; color: #000; background: #fff; box-sizing: border-box; padding: 6px; line-height: 1.1;">
                <!-- TOP BANNER -->
                <div style="display: flex; justify-content: space-between; align-items: center; background: #000; color: #fff; padding: 2px 4px; margin-bottom: 4px;">
                    <span style="font-weight: 900; font-size: 8px; letter-spacing: 0.1em;">SIIFMART EXPRESS</span>
                    <span style="font-weight: 900; font-size: 8.5px; font-mono;">TRK: ${data.trackingNumber || formattedOrderRef}</span>
                </div>
                
                <!-- DESTINATION -->
                <div style="margin-bottom: 3px;">
                    <div style="font-weight: 900; font-size: 12px; text-transform: uppercase; line-height: 1.0; margin-bottom: 2px; word-break: break-word;">${data.customerName || data.destSiteName || 'RECIPIENT'}</div>
                    ${data.shippingAddress ? `<div style="font-size: 8px; font-weight: 700; text-transform: uppercase; word-break: break-word; line-height: 1.1; color: #333;">${data.shippingAddress}</div>` : ''}
                </div>

                <!-- SPECIAL HANDLING BADGES -->
                ${handlingHTML}

                <!-- COMPLETE MANIFEST -->
                <div style="padding: 3px 0; margin-bottom: 4px; border-top: 1px dashed #000; border-bottom: 1px dashed #000;">
                    <div style="font-size: 7.5px; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.05em; color: #555;">ITEMS (${(data.lineItems || []).length}):</div>
                    <div style="font-size: 8px; font-weight: 700;">
                        ${(data.lineItems || []).map(item => `
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5px; text-transform: uppercase;">
                                <span style="word-break: break-word; flex: 1; padding-right: 4px;">${item.name || 'ITEM'}</span>
                                <span style="font-weight: 900; white-space: nowrap; font-mono;">[${item.quantity}${item.unit ? ` ${item.unit}` : ''}]</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- BARCODE & FOOTER -->
                <div style="margin-top: auto; padding-top: 2px; text-align: center;">
                    <div class="barcode-container" style="height: 28px; width: 100%; display:flex; justify-content:center;">${barcode || 'ERROR'}</div>
                    <div style="display: flex; justify-content: space-between; font-size: 7.5px; font-weight: 900; text-transform: uppercase; margin-top: 2px;">
                        <span>* ${data.trackingNumber || formattedOrderRef} *</span>
                        <span>${displayDate}</span>
                    </div>
                </div>
            </div>
        `;
    } else if (validSize === 'Medium') {
        const displayDate = data.packDate ? new Date(data.packDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

        // MEDIUM LABEL (98mm x 66mm): Clean 4x3 parcel format
        contentHTML = `
            <div style="display: flex; flex-direction: column; min-height: 100%; border: 2px solid #000; font-family: 'SF Mono', 'Fira Code', 'Inter', monospace; color: #000; background: #fff; box-sizing: border-box; padding: 10px; line-height: 1.15;">
                <!-- HEADER BAR -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 6px; flex-shrink: 0;">
                    <div>
                        <div style="font-weight: 900; font-size: 13px; letter-spacing: 0.1em;">SIIFMART LOGISTICS</div>
                        <div style="font-size: 8.5px; font-weight: 900; color: #444;">STANDARD PARCEL // ${displayDate}</div>
                    </div>
                    <div class="qr-container" style="width: 38px; height: 38px; border: 1.5px solid #000; padding: 2px;">${qr}</div>
                </div>

                <!-- DESTINATION SECTION -->
                <div style="margin-bottom: 6px; flex-shrink: 0;">
                    <div style="font-weight: 900; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 2px;">SHIP TO:</div>
                    <div style="font-weight: 900; font-size: 18px; text-transform: uppercase; line-height: 1.0; margin-bottom: 3px; word-break: break-word;">${data.customerName || data.destSiteName || 'RECIPIENT'}</div>
                    ${data.shippingAddress ? `<div style="font-size: 10px; font-weight: 700; text-transform: uppercase; word-break: break-word; line-height: 1.15; color: #222;">${data.shippingAddress}</div>` : ''}
                </div>

                <!-- SPECIAL HANDLING BADGES -->
                ${handlingHTML}

                <!-- COMPLETE PRODUCT MANIFEST -->
                <div style="padding: 4px 0; margin-bottom: 6px; border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000;">
                    <div style="font-weight: 900; font-size: 8.5px; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.1em; color: #444;">MANIFEST — ${(data.lineItems || []).length} ITEM${(data.lineItems || []).length !== 1 ? 'S' : ''}</div>
                    <div style="font-size: 9px; font-weight: 700;">
                        ${(data.lineItems || []).map(item => `
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; text-transform: uppercase; border-bottom: 1px dotted #e5e5e5; padding-bottom: 1px;">
                                <span style="word-break: break-word; flex: 1; padding-right: 6px;">${item.name || 'ITEM'}</span>
                                <span style="font-weight: 900; font-mono; white-space: nowrap;">[${item.quantity}${item.unit ? ` ${item.unit}` : ''}]</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- BOTTOM INFO BAND -->
                <div style="flex-shrink: 0; margin-top: auto; border-top: 2px solid #000; padding-top: 6px;">
                    <div class="barcode-container" style="height: 36px; margin-bottom: 3px; display:flex; justify-content:center;">${barcode}</div>
                    <div style="text-align: center; font-family:'SF Mono', 'Fira Code', monospace; font-size: 12px; font-weight: 900; letter-spacing: 1.5px; margin-bottom: 4px; color: #000;">${data.trackingNumber || formattedOrderRef}</div>
                    <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 9px; text-transform: uppercase;">
                        <span>TRK: ${data.trackingNumber || formattedOrderRef}</span>
                        <span>${data.packageNumber ? `PKG: ${data.packageNumber}/${data.totalPackages || 1}` : `${data.totalPackages || 1} PACKAGE${(data.totalPackages || 1) > 1 ? 'S' : ''}`}</span>
                    </div>
                </div>
            </div>
        `;
    } else if (validSize === 'Large') {
        const displayDate = data.packDate ? new Date(data.packDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

        // LARGE LABEL (130mm x 97mm): Courier freight format
        contentHTML = `
            <div style="display: flex; flex-direction: column; min-height: 100%; border: 3px solid #000; font-family: 'SF Mono', 'Fira Code', 'Inter', monospace; color: #000; background: #fff; box-sizing: border-box; padding: 14px; line-height: 1.15;">
                <!-- HEADER BAR -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #000; padding-bottom: 6px; margin-bottom: 8px; flex-shrink: 0;">
                    <div>
                        <div style="font-weight: 900; font-size: 18px; letter-spacing: 0.1em;">SIIFMART LOGISTICS</div>
                        <div style="font-size: 10px; font-weight: 900; color: #333;">PRIORITY FREIGHT // ${displayDate}</div>
                    </div>
                    <div class="qr-container" style="width: 50px; height: 50px; border: 2px solid #000; padding: 2px;">${qr}</div>
                </div>

                <!-- SENDER & RECIPIENT -->
                <div style="display: flex; flex-direction: column; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px;">
                    <div style="margin-bottom: 6px;">
                        <span style="font-weight: 900; font-size: 9px; text-transform: uppercase; color: #666;">FROM: </span>
                        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #333;">${data.fromName || 'SiifMart Logistics Center'}</span>
                    </div>
                    <div>
                        <div style="font-weight: 900; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.1em; color: #000; margin-bottom: 2px;">SHIP TO:</div>
                        <div style="font-weight: 900; font-size: 22px; text-transform: uppercase; line-height: 1.0; margin-bottom: 4px; word-break: break-word;">${data.customerName || data.destSiteName || 'RECIPIENT'}</div>
                        ${data.shippingAddress ? `<div style="font-size: 12px; font-weight: 700; text-transform: uppercase; word-break: break-word; line-height: 1.2;">${data.shippingAddress}</div>` : ''}
                    </div>
                </div>

                <!-- SPECIAL HANDLING BADGES -->
                ${handlingHTML}

                <!-- COMPLETE PRODUCT MANIFEST -->
                <div style="padding: 6px 0; margin-bottom: 8px; border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000;">
                    <div style="font-weight: 900; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.1em; color: #333;">MANIFEST — ${(data.lineItems || []).length} ITEM${(data.lineItems || []).length !== 1 ? 'S' : ''}</div>
                    <div style="font-size: 10.5px; font-weight: 700;">
                        ${(data.lineItems || []).map(item => `
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; text-transform: uppercase; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">
                                <span style="word-break: break-word; flex: 1; padding-right: 8px;">${item.name || 'ITEM'}</span>
                                <span style="font-weight: 900; font-mono; white-space: nowrap;">[${item.quantity}${item.unit ? ` ${item.unit}` : ''}]</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- BOTTOM INFO BAND -->
                <div style="flex-shrink: 0; margin-top: auto; border-top: 2px solid #000; padding-top: 8px;">
                    <div class="barcode-container" style="height: 46px; margin-bottom: 4px; display:flex; justify-content:center;">${barcode}</div>
                    <div style="text-align: center; font-family:'SF Mono', 'Fira Code', monospace; font-size: 14px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px; color: #000;">* ${data.trackingNumber || formattedOrderRef} *</div>
                    <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 10px; text-transform: uppercase;">
                        <span>TRK: ${data.trackingNumber || formattedOrderRef}</span>
                        <span>${data.packageNumber ? `PKG: ${data.packageNumber}/${data.totalPackages || 1}` : `${data.totalPackages || 1} PACKAGE${(data.totalPackages || 1) > 1 ? 'S' : ''}`}</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        // XL LABEL (130mm x 195mm): Full Master 4x6 / 5x8 Logistics Standard
        const pSize = '24px';
        const showQR = validFormat === 'QR' || validFormat === 'Both';

        contentHTML = `
            <div style="display: flex; flex-direction: column; min-height: 100%; border: 4px solid #000; font-family: 'SF Mono', 'Fira Code', 'Inter', monospace; color: #000; background: #fff; box-sizing: border-box; padding: ${pSize}; line-height: 1.15;">
                <!-- TOP HEADER -->
                <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 12px; flex-shrink: 0;">
                    <div>
                        <div style="font-weight: 900; font-size: 28px; letter-spacing: 0.1em;">SIIFMART LOGISTICS</div>
                        <div style="font-size: 13px; font-weight: 900; margin-top: 3px;">DOMESTIC PRIORITY SERVICE // 2026 EDITION</div>
                    </div>
                    ${showQR ? `<div class="qr-container" style="width: 1.0in; height: 1.0in; border: 4px solid #000; padding: 5px;">${qr}</div>` : ''}
                </div>

                <!-- SPECIAL HANDLING BADGES -->
                ${handlingHTML}

                <!-- MAIN SHIP BLOCK -->
                <div style="display: flex; flex-direction: column; border-bottom: 3px solid #000; padding-bottom: 12px;">
                    <!-- SENDER (TOP LEFT, SMALL) -->
                    <div style="margin-bottom: 8px;">
                        <div style="font-weight: 900; font-size: 10px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.1em; color: #666;">FROM:</div>
                        <div style="font-size: 11px; font-weight: 700; line-height: 1.2; text-transform: uppercase; color: #333; word-break: break-word;">
                            ${data.fromName || 'SiifMart Logistics Center'} // ${data.fromAddress?.replace(/<br>/g, ', ') || 'Bole Sub-City, Woreda 03, Addis Ababa'}
                        </div>
                    </div>

                    <!-- RECIPIENT (CENTER, BOLD) -->
                    <div>
                        <div style="font-weight: 900; font-size: 12px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.2em; color: #000;">SHIP TO:</div>
                        <div style="font-weight: 900; font-size: 30px; text-transform: uppercase; line-height: 1.0; margin-bottom: 6px; word-break: break-word;">
                            ${data.customerName || data.destSiteName || 'RECIPIENT'}
                        </div>
                        <div style="font-size: 18px; font-weight: 700; text-transform: uppercase; line-height: 1.2; margin-bottom: 4px; word-break: break-word;">
                            ${data.shippingAddress || ''}
                        </div>
                        <div style="font-weight: 900; font-size: 26px; text-transform: uppercase; letter-spacing: 1px;">
                            ${data.city || ''}
                        </div>
                    </div>
                </div>

                <!-- COMPLETE PRODUCT MANIFEST -->
                ${(data.lineItems && data.lineItems.length > 0) ? `
                <div style="margin-top: 12px; padding: 10px 0; border-bottom: 3px solid #000;">
                    <div style="font-weight: 900; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.15em; color: #222;">MANIFEST — ${data.lineItems.length} ITEM${data.lineItems.length > 1 ? 'S' : ''}</div>
                    <div style="font-size: 13px; font-weight: 700;">
                        ${data.lineItems.map(item => `
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; text-transform: uppercase; border-bottom: 1px dotted #ccc; padding-bottom: 3px;">
                                <span style="word-break: break-word; flex: 1; padding-right: 12px;">${item.name || 'ITEM'}</span>
                                <span style="margin-left: 12px; min-width: 50px; text-align: right; font-weight: 900; font-mono;">${item.sku || ''}</span>
                                <span style="margin-left: 12px; font-weight: 900; font-mono; white-space: nowrap;">[${item.quantity}${item.unit ? ` ${item.unit}` : ''}]</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- BARCODE & TRACKING -->
                <div style="margin-top: 16px; text-align: center;">
                    <div class="barcode-container" style="height: 68px; margin-bottom: 8px; display:flex; justify-content:center;">${barcode}</div>
                    <div style="font-weight: 900; font-size: 18px; letter-spacing: 0.25em; text-transform: uppercase; font-family:'SF Mono', 'Fira Code', monospace; margin-top:6px; color: #000;">
                        * TRK :: ${data.trackingNumber || formattedOrderRef} *
                    </div>
                </div>

                <!-- FOOTER DATA -->
                <div style="margin-top: auto; display: flex; justify-content: space-between; font-weight: 900; font-size: 11px; border-top: 2px solid #000; padding-top: 8px;">
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
                    background: #fff;
                }
                .label {
                    width: ${css.width};
                    min-height: ${css.height};
                    height: auto;
                    border: none;
                    box-sizing: border-box;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    overflow: visible;
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


