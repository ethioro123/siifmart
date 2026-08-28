import { BrowserWindow } from 'electron';

export interface ElectronPrinterInfo {
    name: string;
    displayName: string;
    description: string;
    status?: number;
    isDefault?: boolean;
    options?: any;
}

export interface ElectronPrintOptions {
    printerName?: string;
    silent?: boolean;
    printBackground?: boolean;
    color?: boolean;
    margin?: {
        marginType?: 'default' | 'none' | 'printableArea' | 'custom';
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
    };
    landscape?: boolean;
    pagesPerSheet?: number;
    collate?: boolean;
    copies?: number;
    header?: string;
    footer?: string;
    pageSize?: 'A4' | 'A5' | 'A6' | 'Letter' | 'Legal' | { width: number; height: number };
}

export async function getSystemPrinters(window: BrowserWindow): Promise<ElectronPrinterInfo[]> {
    try {
        const printers = await window.webContents.getPrintersAsync();
        return printers.map((p: any) => ({
            name: p.name || '',
            displayName: p.displayName || p.name || '',
            description: p.description || '',
            status: typeof p.status === 'number' ? p.status : 0,
            isDefault: Boolean(p.isDefault),
            options: p.options || {}
        }));
    } catch (err) {
        console.error('[Electron:Printer] Failed to fetch system printers:', err);
        return [];
    }
}

export async function printHtmlDirect(html: string, options: ElectronPrintOptions = {}): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
        let printWindow: BrowserWindow | null = new BrowserWindow({
            show: false,
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true
            }
        });

        const cleanup = () => {
            if (printWindow && !printWindow.isDestroyed()) {
                printWindow.close();
                printWindow = null;
            }
        };

        printWindow.webContents.on('did-finish-load', () => {
            if (!printWindow || printWindow.isDestroyed()) {
                return resolve({ success: false, error: 'Print window destroyed before printing' });
            }

            const printSettings: Electron.WebContentsPrintOptions = {
                silent: options.silent ?? true,
                printBackground: options.printBackground ?? true,
                deviceName: options.printerName || '',
                color: options.color ?? true,
                margins: options.margin || { marginType: 'none' },
                landscape: options.landscape ?? false,
                pagesPerSheet: options.pagesPerSheet ?? 1,
                collate: options.collate ?? true,
                copies: options.copies ?? 1,
                header: options.header,
                footer: options.footer,
                pageSize: options.pageSize as any || { width: 80000, height: 297000 } // Default ~80mm receipt width
            };

            printWindow.webContents.print(printSettings, (success, failureReason) => {
                cleanup();
                if (success) {
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: failureReason });
                }
            });
        });

        printWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
            cleanup();
            resolve({ success: false, error: `Failed to load print payload: [${errorCode}] ${errorDescription}` });
        });

        // Load data URL
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
        printWindow.loadURL(dataUrl);

        // Safety timeout in case print hangs
        setTimeout(() => {
            if (printWindow && !printWindow.isDestroyed()) {
                cleanup();
                resolve({ success: false, error: 'Print operation timed out after 15 seconds' });
            }
        }, 15000);
    });
}

export async function openCashDrawer(printerName?: string): Promise<{ success: boolean; error?: string }> {
    // ESC/POS Drawer kick pulse: standard command ESC p 0 25 250
    const drawerKickHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { size: 80mm 20mm; margin: 0; }
                body { margin: 0; padding: 0; visibility: hidden; }
            </style>
        </head>
        <body>
            <span>\x1B\x70\x00\x19\xFA</span>
        </body>
        </html>
    `;

    return printHtmlDirect(drawerKickHtml, {
        printerName,
        silent: true,
        printBackground: false,
        margin: { marginType: 'none' }
    });
}
