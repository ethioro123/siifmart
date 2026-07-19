export function buildLabelPrintHtml(labelContent: string, config: { width: number; height: number }): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Labels</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                @page {
                    size: ${config.width}mm ${config.height}mm;
                    margin: 0;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    background: white;
                    color: black;
                }
                
                .label {
                    width: ${config.width}mm;
                    height: ${config.height}mm;
                    padding: 2mm;
                    border: 0.2mm solid #000;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    page-break-after: always;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    overflow: hidden;
                    background: white;
                }
                
                .label-header {
                    border-bottom: 0.2mm solid #000;
                    padding-bottom: 1mm;
                    margin-bottom: 1mm;
                }
                
                .label-header h3 {
                    font-size: 3.5mm;
                    font-weight: bold;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .label-body {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 1mm 0;
                }
                
                .product-name {
                    font-size: 2.8mm;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 1.5mm;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .barcode-container {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-top: 1mm;
                }
                
                .barcode-container svg {
                    max-width: 100%;
                    height: auto;
                }
                
                .label-footer {
                    border-top: 0.2mm solid #000;
                    padding-top: 1mm;
                    margin-top: 1mm;
                    display: flex;
                    justify-content: space-between;
                    font-size: 2mm;
                    font-family: monospace;
                }
                
                /* Size specific adjustments */
                .label-small {
                    padding: 1mm;
                }
                .label-small .label-header h3 {
                    font-size: 2.8mm;
                }
                .label-small .product-name {
                    font-size: 2.2mm;
                    margin-bottom: 1mm;
                }
                
                .label-small .barcode-container {
                    border: none;
                    margin: 0;
                }
            </style>
        </head>
        <body>
            ${labelContent}
        </body>
        </html>
    `;
}
