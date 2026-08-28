import { useState, useEffect, useCallback } from 'react';
import type { PrinterInfo, PrintOptions } from '../types/electron';

export interface UseElectronReturn {
    isElectron: boolean;
    appVersion: string;
    printers: PrinterInfo[];
    isLoadingPrinters: boolean;
    fetchPrinters: () => Promise<PrinterInfo[]>;
    printDirect: (html: string, options?: PrintOptions) => Promise<{ success: boolean; error?: string }>;
    openCashDrawer: (printerName?: string) => Promise<{ success: boolean; error?: string }>;
    beep: (type?: 'success' | 'warning' | 'error') => void;
    toggleFullscreen: () => Promise<boolean>;
    minimize: () => void;
    maximize: () => void;
    close: () => void;
}

export function useElectron(): UseElectronReturn {
    const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
    const [appVersion, setAppVersion] = useState<string>('');
    const [printers, setPrinters] = useState<PrinterInfo[]>([]);
    const [isLoadingPrinters, setIsLoadingPrinters] = useState<boolean>(false);

    useEffect(() => {
        if (isElectron && window.electronAPI) {
            window.electronAPI.getAppVersion().then(setAppVersion).catch(() => {});
        }
    }, [isElectron]);

    const fetchPrinters = useCallback(async (): Promise<PrinterInfo[]> => {
        if (!isElectron || !window.electronAPI) return [];
        setIsLoadingPrinters(true);
        try {
            const list = await window.electronAPI.getPrinters();
            setPrinters(list);
            return list;
        } catch {
            return [];
        } finally {
            setIsLoadingPrinters(false);
        }
    }, [isElectron]);

    const printDirect = useCallback(async (html: string, options?: PrintOptions): Promise<{ success: boolean; error?: string }> => {
        if (isElectron && window.electronAPI) {
            return window.electronAPI.printDirect(html, options);
        }

        // Web fallback: standard iframe print
        try {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (!doc) throw new Error('Cannot access print iframe');

            doc.open();
            doc.write(html);
            doc.close();

            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 2000);

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err?.message || 'Print failed' };
        }
    }, [isElectron]);

    const openCashDrawer = useCallback(async (printerName?: string): Promise<{ success: boolean; error?: string }> => {
        if (isElectron && window.electronAPI) {
            return window.electronAPI.openCashDrawer(printerName);
        }
        return { success: false, error: 'Cash drawer trigger requires Electron desktop environment' };
    }, [isElectron]);

    const beep = useCallback((type: 'success' | 'warning' | 'error' = 'success') => {
        if (isElectron && window.electronAPI) {
            window.electronAPI.beep(type);
        } else {
            // Web Audio API synth beep fallback
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = type === 'error' ? 300 : type === 'warning' ? 600 : 900;
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } catch {}
        }
    }, [isElectron]);

    const toggleFullscreen = useCallback(async (): Promise<boolean> => {
        if (isElectron && window.electronAPI) {
            return window.electronAPI.toggleFullscreen();
        }
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            return true;
        } else {
            await document.exitFullscreen();
            return false;
        }
    }, [isElectron]);

    const minimize = useCallback(() => {
        if (isElectron && window.electronAPI) window.electronAPI.minimize();
    }, [isElectron]);

    const maximize = useCallback(() => {
        if (isElectron && window.electronAPI) window.electronAPI.maximize();
    }, [isElectron]);

    const close = useCallback(() => {
        if (isElectron && window.electronAPI) window.electronAPI.close();
    }, [isElectron]);

    return {
        isElectron,
        appVersion,
        printers,
        isLoadingPrinters,
        fetchPrinters,
        printDirect,
        openCashDrawer,
        beep,
        toggleFullscreen,
        minimize,
        maximize,
        close
    };
}
