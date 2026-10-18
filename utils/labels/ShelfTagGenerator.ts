import { generateBarcodeSVG } from '../barcodeGenerator';
import { escapeHtml } from './escapeHtml';
import type { Product } from '../../types';

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

export const isProductHalal = (product: Product | ShelfTagItem): boolean => {
    const p = product as any;
    if (p.isHalal === true) return true;
    if (p.halalVerified === true) return true;
    if (typeof p.dietaryCert === 'string' && p.dietaryCert.toLowerCase().includes('halal')) return true;
    if (typeof p.halalCompliance === 'string' && p.halalCompliance.toLowerCase().includes('halal')) return true;
    if (p.storage && p.storage.halalVerified === true) return true;
    return false;
};

export const generateShelfTagsHTML = (
    items: ShelfTagItem[],
    options: {
        currency: string;
        storeName?: string;
    }
): string => {
    const currency = options.currency || 'ETB';
    const storeName = options.storeName || 'SIIFMART RETAIL';

    const tagsHTML = items.map(item => {
        const effectivePrice = item.isOnSale && item.salePrice && item.salePrice > 0
            ? item.salePrice
            : item.regularPrice;
        const hasDiscount = item.isOnSale && item.salePrice && item.salePrice > 0 && item.salePrice < item.regularPrice;
        const isHalal = isProductHalal(item);
        const barcodeVal = item.sku.trim();
        const barcodeSvg = barcodeVal ? generateBarcodeSVG(barcodeVal, {
            format: 'CODE128',
            width: 1.1,
            height: 22,
            displayValue: false,
            margin: 0
        }) : '';

        return `
            <div class="shelf-tag">
                <div class="tag-header">
                    <span class="tag-category">${escapeHtml((item.category || storeName).toUpperCase().slice(0, 16))}</span>
                    ${isHalal ? '<span class="tag-badge tag-halal">HALAL</span>' : '<span class="tag-badge tag-std">VERIFIED</span>'}
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
                            <span class="tag-old-price">${escapeHtml(currency)} ${item.regularPrice.toFixed(2)}</span>
                        ` : ''}
                        <span class="tag-price ${hasDiscount ? 'sale' : ''}">
                            <span class="currency">${escapeHtml(currency)}</span> ${effectivePrice.toFixed(2)}
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

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Shelf Tags - ${escapeHtml(storeName)}</title>
            <style>
                @page {
                    size: auto;
                    margin: 8mm;
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
                    grid-template-columns: repeat(3, 1fr);
                    gap: 6mm;
                }
                .shelf-tag {
                    border: 2px solid #000000;
                    border-radius: 6px;
                    padding: 8px 10px;
                    height: 48mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    background: #ffffff;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .tag-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1.5px solid #000000;
                    padding-bottom: 3px;
                }
                .tag-category {
                    font-size: 8px;
                    font-weight: 900;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #444444;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .tag-badge {
                    font-size: 7.5px;
                    font-weight: 900;
                    padding: 1px 4px;
                    border: 1px solid #000000;
                    border-radius: 3px;
                    text-transform: uppercase;
                }
                .tag-halal {
                    background: #000000;
                    color: #ffffff;
                }
                .tag-std {
                    background: #ffffff;
                    color: #000000;
                }
                .tag-title {
                    font-size: 11px;
                    font-weight: 800;
                    line-height: 1.2;
                    margin: 4px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-transform: uppercase;
                }
                .tag-price-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    border-top: 1.5px dashed #000000;
                    border-bottom: 1.5px dashed #000000;
                    padding: 4px 0;
                    margin: 3px 0;
                }
                .tag-pos {
                    display: flex;
                    flex-direction: column;
                }
                .tag-pos-lbl {
                    font-size: 7px;
                    font-weight: 800;
                    color: #666666;
                }
                .tag-pos-val {
                    font-size: 10px;
                    font-family: monospace;
                    font-weight: 900;
                }
                .tag-price-block {
                    text-align: right;
                }
                .tag-old-price {
                    display: block;
                    font-size: 9px;
                    text-decoration: line-through;
                    color: #666666;
                    font-family: monospace;
                }
                .tag-price {
                    font-size: 20px;
                    font-weight: 900;
                    font-family: monospace;
                    line-height: 1;
                    letter-spacing: -0.02em;
                }
                .tag-price .currency {
                    font-size: 11px;
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
                    font-size: 8px;
                    font-weight: 700;
                    color: #333333;
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
                <button onclick="window.print()">PRINT SHELF TAGS (${items.length})</button>
            </div>
            <div class="shelf-grid">
                ${tagsHTML}
            </div>
        </body>
        </html>
    `;
};
