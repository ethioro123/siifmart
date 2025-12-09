import JsBarcode from 'jsbarcode';
import { BARCODE_SIZES, BarcodeSize } from './barcodeConfig';

/**
 * Generate barcode as Canvas (WORKS IN PRINT!)
 * Canvas renders as raster image, which prints reliably
 * 
 * OPTIMIZED FOR SMALL LABELS:
 * - Thin bars (width: 1)
 * - Tall height (80)
 * - Compact margins
 * - Small font
 */
export const generateBarcodeCanvas = (
    value: string,
    options?: {
        width?: number;
        height?: number;
        displayValue?: boolean;
        fontSize?: number;
        textMargin?: number;
        margin?: number;
        format?: string;
    }
): HTMLCanvasElement => {
    const defaults = BARCODE_SIZES.medium;
    const {
        width = defaults.width,
        height = defaults.height,
        displayValue = defaults.displayValue,
        fontSize = defaults.fontSize,
        textMargin = 2,
        margin = defaults.margin,
        format = 'CODE128'
    } = options || {};

    const canvas = document.createElement('canvas');

    try {
        JsBarcode(canvas, value, {
            format: format as any,
            width,
            height,
            displayValue,
            fontSize,
            textMargin,
            margin,
            background: '#ffffff',
            lineColor: '#000000'
        });

        return canvas;
    } catch (error) {
        console.error('Error generating barcode:', error);
        return canvas;
    }
};

/**
 * Generate barcode as PNG Data URL (for embedding in HTML/printing)
 */
export const generateBarcodeImage = (
    value: string,
    options?: {
        width?: number;
        height?: number;
        displayValue?: boolean;
        fontSize?: number;
        textMargin?: number;
        margin?: number;
        format?: string;
    }
): string => {
    const canvas = generateBarcodeCanvas(value, options);
    return canvas.toDataURL('image/png');
};

/**
 * Generate printable barcode label HTML (FIXED - uses PNG images instead of SVG)
 * OPTIMIZED FOR TINY LABELS: 2" x 1" compact size
 */
/**
 * Generate printable barcode label HTML (SVG for sharp printing)
 * OPTIMIZED FOR TINY LABELS: 2" x 1" compact size
 */
export const generateBarcodeLabelHTML = (
    value: string,
    label: string,
    options?: {
        width?: number;
        height?: number;
        displayValue?: boolean;
        fontSize?: number;
        textMargin?: number;
        margin?: number;
        format?: string;
        paperSize?: string;
    }
): string => {
    const defaults = BARCODE_SIZES.small;
    const {
        width = defaults.width,
        height = defaults.height,
        displayValue = defaults.displayValue,
        fontSize = defaults.fontSize,
        textMargin = 2,
        margin = defaults.margin,
        format = 'CODE128',
        paperSize = '2in 1in' // TINY LABEL SIZE
    } = options || {};

    // Generate barcode as SVG
    const barcodeSVG = generateBarcodeSVG(value, {
        width,
        height,
        displayValue,
        fontSize,
        textMargin,
        margin,
        format
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Barcode Label - ${label}</title>
            <meta charset="UTF-8">
            <style>
                @page {
                    size: auto;
                    margin: 10mm;
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
                    margin: 0;
                    padding: 5px;
                    font-family: Arial, sans-serif;
                    background: white;
                }
                
                .label {
                    width: 100%;
                    height: 100%;
                    border: 1px solid #000;
                    padding: 3px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: white;
                }
                
                .label-title {
                    font-size: 8px;
                    font-weight: bold;
                    margin-bottom: 2px;
                    text-align: center;
                    color: #000;
                }
                
                .barcode-container {
                    text-align: center;
                    margin: 2px 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                
                svg {
                    max-width: 100%;
                    height: auto;
                    display: block;
                }
                
                .no-print {
                    display: block;
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                    background: white;
                    padding: 10px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                }
                
                button {
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                    cursor: pointer;
                }
                
                @media print {
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    .label {
                        border: 2px solid #000 !important;
                        background: white !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="padding: 12px 40px; background: #00ff9d; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px;">
                    🖨️ Print Label
                </button>
                <button onclick="window.close()" style="padding: 12px 40px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px;">
                    ✕ Close
                </button>
            </div>
            
            <div class="label">
                <div class="label-title">${label}</div>
                <div class="barcode-container">
                    ${barcodeSVG}
                </div>
            </div>
        </body>
        </html>
    `;
};

/**
 * Generate batch barcode labels HTML (SVG for sharp printing)
 */
export const generateBatchBarcodeLabelsHTML = (
    labels: Array<{ value: string; label: string }>,
    options?: {
        width?: number;
        height?: number;
        displayValue?: boolean;
        fontSize?: number;
        textMargin?: number;
        margin?: number;
        format?: string;
        paperSize?: string;
    }
): string => {
    const {
        width = 2,
        height = 60,
        displayValue = true,
        fontSize = 12,
        textMargin = 4,
        margin = 6,
        format = 'CODE128',
        paperSize = '4in 2in'
    } = options || {};

    const labelHTMLs = labels.map((item) => {
        const barcodeSVG = generateBarcodeSVG(item.value, {
            width,
            height,
            displayValue,
            fontSize,
            textMargin,
            margin,
            format
        });

        return `
            <div class="label">
                <div class="label-title">${item.label}</div>
                <div class="barcode-container">
                    ${barcodeSVG}
                </div>
            </div>
        `;
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Barcode Labels - Batch Print (${labels.length})</title>
            <meta charset="UTF-8">
            <style>
                @page {
                    size: auto;
                    margin: 10mm;
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
                    margin: 0;
                    padding: 10px;
                    font-family: Arial, sans-serif;
                    background: white;
                }
                
                .label {
                    width: 100%;
                    height: 100%;
                    border: 2px solid #000;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 10px;
                    page-break-after: always;
                    background: white;
                }
                
                .label-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-align: center;
                    color: #000;
                }
                
                .barcode-container {
                    text-align: center;
                    margin: 10px 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                
                svg {
                    max-width: 100%;
                    height: auto;
                    display: block;
                }
                
                .no-print {
                    display: block;
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                    background: white;
                    padding: 10px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                }
                
                button {
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                    cursor: pointer;
                }
                
                @media print {
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    .label {
                        margin-bottom: 0;
                        border: 2px solid #000 !important;
                        background: white !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="padding: 12px 40px; background: #00ff9d; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px;">
                    🖨️ Print All Labels (${labels.length})
                </button>
                <button onclick="window.close()" style="padding: 12px 40px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px;">
                    ✕ Close
                </button>
            </div>
            
            ${labelHTMLs.join('\n')}
        </body>
        </html>
    `;
};

// Keep SVG version for backward compatibility (but it won't print well)
export const generateBarcodeSVG = (
    value: string,
    options?: {
        width?: number;
        height?: number;
        displayValue?: boolean;
        fontSize?: number;
        textMargin?: number;
        margin?: number;
        format?: string;
    }
): string => {
    if (typeof document === 'undefined') {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
            <text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="12">Barcode (requires browser)</text>
        </svg>`;
    }

    const {
        width = 2,
        height = 60,
        displayValue = true,
        fontSize = 12,
        textMargin = 4,
        margin = 6,
        format = 'CODE128'
    } = options || {};

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // IMPORTANT: JsBarcode needs the element to be in the DOM for text measurement
    // when displayValue is true.
    svg.style.position = 'absolute';
    svg.style.top = '-9999px';
    svg.style.left = '-9999px';
    svg.style.visibility = 'hidden';
    document.body.appendChild(svg);

    try {
        JsBarcode(svg, value, {
            format: format as any,
            width,
            height,
            displayValue,
            fontSize,
            textMargin,
            margin,
            background: '#ffffff',
            lineColor: '#000000',
            valid: function (valid) {
                if (!valid) throw new Error("Invalid Barcode Data");
            }
        });

        const html = svg.outerHTML;
        document.body.removeChild(svg);
        return html;
    } catch (error) {
        console.warn('Barcode generation failed with text, retrying without text:', error);

        // Retry without displayValue (often fixes text measurement issues)
        try {
            // Clear previous attempt
            while (svg.firstChild) {
                svg.removeChild(svg.firstChild);
            }

            JsBarcode(svg, value, {
                format: format as any,
                width,
                height,
                displayValue: false, // <-- Disable text on retry
                margin,
                background: '#ffffff',
                lineColor: '#000000'
            });

            const html = svg.outerHTML;
            document.body.removeChild(svg);
            return html;
        } catch (retryError) {
            if (document.body.contains(svg)) {
                document.body.removeChild(svg);
            }
            console.error('Final Barcode Error:', retryError, value);
            return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" style="background:#eee;">
                <text x="50%" y="50%" text-anchor="middle" fill="red" font-size="10">Error: ${value}</text>
            </svg>`;
        }
    }
};
