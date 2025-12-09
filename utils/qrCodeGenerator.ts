import QRCode from 'qrcode';

interface QRCodeGeneratorOptions {
    data: string;
    size?: number;
    includeText?: boolean;
}

/**
 * Generate a QR code as SVG (for high-quality, scalable output)
 */
export const generateQRCode = async (options: QRCodeGeneratorOptions): Promise<string> => {
    const { data, size = 200 } = options;

    try {
        const qrCodeSVG = await QRCode.toString(data, {
            type: 'svg',
            width: size,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeSVG;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
};

/**
 * Generate a QR code as Data URL (PNG image) - Better for printing
 */
export const generateQRCodeImage = async (options: QRCodeGeneratorOptions): Promise<string> => {
    const { data, size = 200 } = options;

    try {
        const qrCodeDataURL = await QRCode.toDataURL(data, {
            width: size,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating QR code image:', error);
        throw error;
    }
};

/**
 * Generate a printable QR code label HTML
 */
export const generateQRCodeLabelHTML = async (
    data: string,
    title: string,
    subtitle?: string,
    size: number = 150,
    pageWidth: string = '4in',
    pageHeight: string = '3in'
): Promise<string> => {
    const qrCodeSVG = await generateQRCode({ data, size });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR Code Label - ${title}</title>
            <style>
                @page {
                    size: auto;
                    margin: 10mm;
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                }
                
                .label-container {
                    page-break-after: always;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 10px;
                    border: 2px solid #000;
                    width: ${pageWidth};
                    height: ${pageHeight};
                    box-sizing: border-box;
                }
                
                .label-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    text-align: center;
                }
                
                .label-subtitle {
                    font-size: 11px;
                    color: #666;
                    margin-bottom: 8px;
                    text-align: center;
                }
                
                .qr-code {
                    margin: 5px 0;
                    width: ${size}px;
                    height: ${size}px;
                }
                
                .qr-code svg {
                    max-width: 100%;
                    height: auto;
                    display: block;
                }
                
                .label-data {
                    font-size: 9px;
                    font-family: monospace;
                    margin-top: 5px;
                    text-align: center;
                    word-break: break-all;
                    max-width: 100%;
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
                
                @media print {
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    .label-container {
                        margin: 0;
                        page-break-after: always;
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" style="padding: 12px 40px; background: #00ff9d; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    🖨️ Print QR Label
                </button>
                <button onclick="window.close()" style="padding: 12px 40px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    ✕ Close
                </button>
            </div>
            
            <div class="label-container">
                <div class="label-title">${title}</div>
                ${subtitle ? `<div class="label-subtitle">${subtitle}</div>` : ''}
                <div class="qr-code">
                    ${qrCodeSVG}
                </div>
                <div class="label-data">${data}</div>
            </div>
        </body>
        </html>
    `;
};

/**
 * Generate batch QR code labels HTML
 */
export const generateBatchQRCodeLabelsHTML = async (
    labels: Array<{ data: string; title: string; subtitle?: string }>
): Promise<string> => {
    const labelHTMLPromises = labels.map(async (label) => {
        const qrCodeSVG = await generateQRCode({ data: label.data, size: 150 });
        return `
            <div class="label-container">
                <div class="label-title">${label.title}</div>
                ${label.subtitle ? `<div class="label-subtitle">${label.subtitle}</div>` : ''}
                <div class="qr-code">
                    ${qrCodeSVG}
                </div>
                <div class="label-data">${label.data}</div>
            </div>
        `;
    });

    const labelHTMLs = await Promise.all(labelHTMLPromises);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR Code Labels - Batch Print</title>
            <style>
                @page {
                    size: auto;
                    margin: 10mm;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                }
                
                .label-container {
                    page-break-after: always;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 10px;
                    border: 2px solid #000;
                    width: 4in;
                    height: 3in;
                    box-sizing: border-box;
                }
                
                .label-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    text-align: center;
                }
                
                .label-subtitle {
                    font-size: 11px;
                    color: #666;
                    margin-bottom: 8px;
                    text-align: center;
                }
                
                .qr-code {
                    margin: 5px 0;
                    width: 150px;
                    height: 150px;
                }
                
                .qr-code svg {
                    max-width: 100%;
                    height: auto;
                    display: block;
                }
                
                .label-data {
                    font-size: 9px;
                    font-family: monospace;
                    margin-top: 5px;
                    text-align: center;
                    word-break: break-all;
                    max-width: 100%;
                }
                
                .no-print {
                    display: block;
                }
                
                @media print {
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                <button onclick="window.print()" style="padding: 12px 40px; background: #00ff9d; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    🖨️ Print All Labels (${labels.length})
                </button>
                <button onclick="window.close()" style="padding: 12px 40px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    ✕ Close
                </button>
            </div>
            
            ${labelHTMLs.join('\\n')}
        </body>
        </html>
    `;
};
