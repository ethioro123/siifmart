/**
 * Thermal & Standard CSS Styles for Product Label Printing
 */
export const getProductLabelStyles = (css: { width: string; height: string; page: string }): string => {
    return `
        @page {
            size: ${css.page};
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 0;
        }

        .label {
            width: ${css.width};
            height: ${css.height};
            page-break-after: always;
            page-break-inside: avoid;
            position: relative;
            background: #ffffff;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .lbl-inner {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            overflow: hidden;
            background: #ffffff;
        }

        .lbl-inner-lg {
            justify-content: space-between;
        }

        /* ── NAME HEADER BAR ── */
        .name-bar {
            background: #f8fafc;
            color: #0f172a;
            font-size: 9.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 4px 6px;
            line-height: 1.15;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-shrink: 0;
            border-bottom: 1.5px dashed #cbd5e1;
            text-align: center;
        }

        .name-bar-tiny {
            font-size: 7.5px;
            padding: 2px 4px;
        }

        .name-bar-lg {
            font-size: 13px;
            padding: 8px 12px;
            letter-spacing: 0.08em;
            font-weight: 900;
            background: #f1f5f9;
            color: #000;
            border-bottom: 2px solid #cbd5e1;
        }

        /* ── CODE ZONES ── */
        .code-zone {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            padding: 2px 4px;
            overflow: hidden;
        }

        .dual-zone {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            flex: 1;
            padding: 4px;
            overflow: hidden;
        }

        .right-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            overflow: hidden;
        }

        .hero-zone {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex: 1;
            padding: 8px 12px;
        }

        .barcode-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
        }

        /* ── SKU MONO ── */
        .sku-mono {
            font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
            font-size: 8.5px;
            font-weight: 900;
            letter-spacing: 0.08em;
            color: #000000;
            text-align: center;
            margin-top: 2px;
            white-space: nowrap;
        }

        /* ── METADATA CHIPS (Small) ── */
        .chip-row {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
            padding: 3px 4px;
            flex-shrink: 0;
            border-top: 1.5px dashed #cbd5e1;
            background: #f8fafc;
        }

        .chip {
            font-size: 7.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #334155;
            padding: 1.5px 4px;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            background: #ffffff;
            white-space: nowrap;
        }

        /* ── INFO STRIP (Medium) ── */
        .info-strip {
            display: flex;
            justify-content: space-evenly;
            border-top: 1.5px dashed #cbd5e1;
            flex-shrink: 0;
            background: #f8fafc;
        }

        .info-strip .info-cell {
            flex: 1;
            text-align: center;
            padding: 4px 2px;
            border-right: 1.5px dashed #e2e8f0;
        }

        .info-strip .info-cell:last-child {
            border-right: none;
        }

        /* ── INFO GRID (Large/XL) ── */
        .info-grid {
            display: flex;
            flex-wrap: wrap;
            border-top: 2px solid #cbd5e1;
            flex-shrink: 0;
            background: #f1f5f9;
        }

        .info-grid .info-cell {
            flex: 1 1 50%;
            text-align: center;
            padding: 6px 8px;
            border-right: 1.5px dashed #cbd5e1;
            border-bottom: 1.5px dashed #cbd5e1;
            background: #ffffff;
        }

        .info-grid .info-cell:nth-child(2n) {
            border-right: none;
        }

        .info-grid .info-cell:nth-last-child(-n+2) {
            border-bottom: none;
        }

        .info-key {
            display: block;
            font-size: 7.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #64748b;
            line-height: 1;
            margin-bottom: 1px;
        }

        .info-val {
            display: block;
            font-size: 11px;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.2;
        }

        /* ── PRINT SCREEN CONTROLS ── */
        .no-print {
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: #000000;
            padding: 10px 24px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        @media print {
            .no-print {
                display: none !important;
            }
            .label {
                border: none !important;
            }
        }
    `;
};
