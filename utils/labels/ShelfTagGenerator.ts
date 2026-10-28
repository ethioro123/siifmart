import { generateBarcodeSVG } from '../barcodeGenerator';
import { escapeHtml } from './escapeHtml';
import type { Product } from '../../types';

export type ShelfTagMediaSize = 'compact-30x20' | 'standard-50x30' | 'large-70x40';

export interface ShelfTagItem {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    barcodeType?: string;
    category?: string;
    shelfPosition?: string;
    regularPrice: number;
    salePrice?: number;
    isOnSale?: boolean;
    isHalal?: boolean;
}

/**
 * Validates Halal certification strictly from explicit evidence.
 * Loose substring matching (like .includes('halal') which matches 'non-halal') is prohibited.
 */
export const isProductHalal = (product: Product | ShelfTagItem): boolean => {
    const p = product as any;
    if (p.isHalal === true) return true;
    if (p.halalVerified === true) return true;
    if (p.storage && p.storage.halalVerified === true) return true;
    const cert = p.dietaryCert || (p.customAttributes && (p.customAttributes.dietaryCert || p.customAttributes.dietary_cert));
    if (typeof cert === 'string' && /^(100%\s*)?(certified[\s_-]*)?halal([\s_-]*certified)?$/i.test(cert.trim())) {
        return true;
    }
    const comp = p.halalCompliance || (p.customAttributes && (p.customAttributes.halalCompliance || p.customAttributes.halal_compliance));
    if (typeof comp === 'string' && /^(100%\s*)?(certified[\s_-]*)?halal([\s_-]*certified)?|compliant$/i.test(comp.trim())) {
        return true;
    }
    return false;
};

export const generateShelfTagsHTML = (
    items: ShelfTagItem[],
    options: {
        currency: string;
        storeName?: string;
        mediaSize?: ShelfTagMediaSize;
    }
): string => {
    const currency = options.currency || 'ETB';
    const storeName = options.storeName || 'SIIFMART RETAIL';
    const mediaSize = options.mediaSize || 'standard-50x30';

    const tagsHTML = items.map(item => {
        // Enforce Merchandising Whole-Number Rule
        const regularWhole = Math.round(Number(item.regularPrice) || 0);
        const saleWhole = item.salePrice && item.salePrice > 0 ? Math.round(Number(item.salePrice)) : null;
        const effectivePrice = item.isOnSale && saleWhole && saleWhole > 0 ? saleWhole : regularWhole;
        const hasDiscount = Boolean(item.isOnSale && saleWhole && saleWhole > 0 && saleWhole < regularWhole);
        const isHalal = isProductHalal(item);

        const barcodeVal = item.sku.trim();
        const barcodeSvg = barcodeVal ? generateBarcodeSVG(barcodeVal, {
            format: 'CODE128',
            width: mediaSize === 'compact-30x20' ? 0.9 : 1.1,
            height: mediaSize === 'compact-30x20' ? 14 : 20,
            displayValue: false,
            margin: 0
        }) : '';

        // Only display claims backed by explicit evidence; omit badge when evidence is absent
        const claimBadge = isHalal
            ? '<span class="tag-badge tag-halal">HALAL CERTIFIED</span>'
            : '';

        return `
            <div class="shelf-tag size-${mediaSize}">
                <div class="tag-header">
                    <span class="tag-category">${escapeHtml((item.category || storeName).toUpperCase().slice(0, 16))}</span>
                    ${claimBadge}
                </div>

                <div class="tag-title">
                    ${escapeHtml(item.name)}
                </div>

                <div class="tag-price-row">
                    <div class="tag-pos">
                        <span class="tag-pos-lbl">LOC</span>
                        <span class="tag-pos-val">${escapeHtml(item.shelfPosition || 'STD')}</span>
                    </div>
                    <div class="tag-price-block">
                        ${hasDiscount ? `
                            <span class="tag-old-price">${escapeHtml(currency)} ${regularWhole}</span>
                        ` : ''}
                        <span class="tag-price ${hasDiscount ? 'sale' : ''}">
                            <span class="currency">${escapeHtml(currency)}</span> ${effectivePrice}
                        </span>
                    </div>
                </div>

                <div class="tag-footer">
                    <div class="tag-barcode">${barcodeSvg}</div>
                    <div class="tag-sku font-mono">SKU: ${escapeHtml(item.sku)}</div>
                </div>
            </div>
        `;
    }).join('\n');

    const getDimensions = () => {
        switch (mediaSize) {
            case 'compact-30x20':
                return { width: '30mm', height: '20mm', columns: 'repeat(4, 1fr)', gap: '3mm' };
            case 'large-70x40':
                return { width: '70mm', height: '40mm', columns: 'repeat(2, 1fr)', gap: '6mm' };
            case 'standard-50x30':
            default:
                return { width: '50mm', height: '30mm', columns: 'repeat(3, 1fr)', gap: '4mm' };
        }
    };

    const dims = getDimensions();

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Shelf Tags - ${escapeHtml(storeName)}</title>
    <style>
        @page {
            size: auto;
            margin: 6mm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #ffffff;
            color: #000000;
            padding: 10px;
        }
        .shelf-grid {
            display: grid;
            grid-template-columns: ${dims.columns};
            gap: ${dims.gap};
        }
        .shelf-tag {
            border: 2px solid #000000;
            border-radius: 4px;
            padding: 6px 8px;
            min-height: ${dims.height};
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .shelf-tag.size-compact-30x20 {
            padding: 3px 4px;
            border-width: 1.5px;
        }
        .tag-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #000000;
            padding-bottom: 2px;
        }
        .tag-category {
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #333333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .shelf-tag.size-compact-30x20 .tag-category {
            font-size: 6.5px;
        }
        .tag-badge {
            font-size: 7px;
            font-weight: 900;
            padding: 1px 3px;
            border: 1px solid #000000;
            border-radius: 2px;
            text-transform: uppercase;
        }
        .tag-halal {
            background: #000000;
            color: #ffffff;
        }
        .tag-title {
            font-size: 10px;
            font-weight: 800;
            line-height: 1.15;
            margin: 2px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-transform: uppercase;
        }
        .shelf-tag.size-compact-30x20 .tag-title {
            font-size: 8px;
            -webkit-line-clamp: 1;
        }
        .tag-price-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1.5px dashed #000000;
            border-bottom: 1.5px dashed #000000;
            padding: 3px 0;
            margin: 2px 0;
        }
        .shelf-tag.size-compact-30x20 .tag-price-row {
            padding: 1px 0;
            margin: 1px 0;
        }
        .tag-pos {
            display: flex;
            flex-direction: column;
        }
        .tag-pos-lbl {
            font-size: 6.5px;
            font-weight: 800;
            color: #555555;
        }
        .tag-pos-val {
            font-size: 9px;
            font-family: monospace;
            font-weight: 900;
        }
        .tag-price-block {
            text-align: right;
        }
        .tag-old-price {
            display: block;
            font-size: 8px;
            text-decoration: line-through;
            color: #555555;
            font-family: monospace;
            font-weight: 700;
        }
        .tag-price {
            font-size: 18px;
            font-weight: 900;
            font-family: monospace;
            line-height: 1;
            letter-spacing: -0.02em;
        }
        .shelf-tag.size-compact-30x20 .tag-price {
            font-size: 13px;
        }
        .tag-price .currency {
            font-size: 10px;
            font-weight: 700;
        }
        .tag-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 2px;
        }
        .tag-barcode {
            height: 16px;
            display: flex;
            align-items: center;
        }
        .tag-sku {
            font-size: 7.5px;
            font-weight: 700;
            color: #222222;
        }
        .no-print {
            margin-bottom: 15px;
            text-align: center;
        }
        .no-print button {
            background: #000000;
            color: #ffffff;
            padding: 8px 24px;
            font-weight: 800;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            border: none;
        }
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                padding: 0 !important;
            }
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button onclick="window.print()">PRINT SHELF TAGS (${items.length} TAGS · ${mediaSize})</button>
    </div>
    <div class="shelf-grid">
        ${tagsHTML}
    </div>
</body>
</html>`;
};
