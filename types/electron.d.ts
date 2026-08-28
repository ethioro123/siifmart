export interface PrinterInfo {
    name: string;
    displayName: string;
    description: string;
    status?: number;
    isDefault?: boolean;
    options?: any;
}

export interface PrintOptions {
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

export interface ElectronAPI {
    isElectron: boolean;
    getAppVersion: () => Promise<string>;
    getPrinters: () => Promise<PrinterInfo[]>;
    printDirect: (html: string, options?: PrintOptions) => Promise<{ success: boolean; error?: string }>;
    openCashDrawer: (printerName?: string) => Promise<{ success: boolean; error?: string }>;
    beep: (type?: 'success' | 'warning' | 'error') => void;
    toggleFullscreen: () => Promise<boolean>;
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    onBarcodeScanned: (callback: (barcode: string) => void) => () => void;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}
