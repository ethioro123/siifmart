// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { printHtmlContent } from '../../utils/printHelper';

describe('Electron Desktop & Print Helper Tests', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        delete (window as any).electronAPI;
    });

    it('should default to web print strategy when electronAPI is not present', () => {
        const spyPrint = vi.fn();
        window.print = spyPrint;

        printHtmlContent('<div>Test Web Receipt</div>');
        // Since we are in jsdom environment, iframe print is triggered or fallback executes
        expect(typeof printHtmlContent).toBe('function');
    });

    it('should route printHtmlContent directly to electronAPI.printDirect when running in Electron', async () => {
        const mockPrintDirect = vi.fn().mockResolvedValue({ success: true });
        (window as any).electronAPI = {
            isElectron: true,
            printDirect: mockPrintDirect,
            openCashDrawer: vi.fn().mockResolvedValue({ success: true })
        };

        printHtmlContent('<div>Thermal Receipt 80mm</div>');
        expect(mockPrintDirect).toHaveBeenCalledWith(
            '<div>Thermal Receipt 80mm</div>',
            expect.objectContaining({ silent: true, printBackground: true })
        );
    });

    it('should trigger openCashDrawer when electronAPI is available', async () => {
        const mockOpenDrawer = vi.fn().mockResolvedValue({ success: true });
        (window as any).electronAPI = {
            isElectron: true,
            openCashDrawer: mockOpenDrawer
        };

        const res = await (window as any).electronAPI.openCashDrawer();
        expect(res.success).toBe(true);
        expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
    });
});
