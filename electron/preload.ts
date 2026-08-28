import { contextBridge, ipcRenderer } from 'electron';
import type { PrintOptions, PrinterInfo } from '../types/electron';

const electronAPI = {
    isElectron: true,

    getAppVersion: (): Promise<string> => {
        return ipcRenderer.invoke('app:get-version');
    },

    getPrinters: (): Promise<PrinterInfo[]> => {
        return ipcRenderer.invoke('printer:get-list');
    },

    printDirect: (html: string, options?: PrintOptions): Promise<{ success: boolean; error?: string }> => {
        return ipcRenderer.invoke('printer:print-direct', { html, options });
    },

    openCashDrawer: (printerName?: string): Promise<{ success: boolean; error?: string }> => {
        return ipcRenderer.invoke('printer:open-cash-drawer', printerName);
    },

    beep: (type: 'success' | 'warning' | 'error' = 'success'): void => {
        ipcRenderer.send('app:beep', type);
    },

    toggleFullscreen: (): Promise<boolean> => {
        return ipcRenderer.invoke('window:toggle-fullscreen');
    },

    minimize: (): void => {
        ipcRenderer.send('window:minimize');
    },

    maximize: (): void => {
        ipcRenderer.send('window:maximize');
    },

    close: (): void => {
        ipcRenderer.send('window:close');
    },

    onBarcodeScanned: (callback: (barcode: string) => void): (() => void) => {
        const handler = (_event: any, barcode: string) => callback(barcode);
        ipcRenderer.on('scanner:barcode-scanned', handler);
        return () => {
            ipcRenderer.removeListener('scanner:barcode-scanned', handler);
        };
    }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
