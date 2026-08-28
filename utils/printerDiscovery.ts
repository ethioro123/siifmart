// --- Hardware Thermal Printer Diagnostic & Discovery Tool ---

export interface PrinterDeviceInfo {
    name: string;
    isDefault?: boolean;
    status?: string;
    type: 'usb' | 'network' | 'bluetooth' | 'system';
}

export interface PrinterTestResult {
    success: boolean;
    message: string;
    latencyMs?: number;
}

/**
 * Generates an 80mm / 58mm test receipt HTML payload.
 */
export function generateTestReceiptHtml(stationName = 'POS-01', siteName = 'SIIFMART Main'): string {
    const now = new Date().toLocaleString();
    return `
    <div style="font-family: monospace; width: 280px; padding: 10px; font-size: 12px; line-height: 1.4; color: black;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
            <h2 style="margin: 0; font-size: 18px; font-weight: bold;">SIIFMART</h2>
            <p style="margin: 2px 0; font-size: 11px;">${siteName}</p>
            <p style="margin: 2px 0; font-size: 10px;">PRINTER DIAGNOSTIC TEST</p>
        </div>

        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between;">
                <span>STATION:</span>
                <span><b>${stationName}</b></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>TIMESTAMP:</span>
                <span>${now}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>FEED STATUS:</span>
                <span>OK (Thermal 80mm)</span>
            </div>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 8px; text-align: center;">
            <p style="margin: 0; font-size: 10px; font-weight: bold;">BARCODE & DENSITY TEST</p>
            <div style="font-family: monospace; font-size: 14px; letter-spacing: 2px; margin-top: 4px;">*SIIFMART-OK*</div>
        </div>

        <div style="text-align: center; font-size: 10px; padding-top: 4px;">
            <p style="margin: 0;">HARDWARE COMMUNICATION VERIFIED</p>
            <p style="margin: 2px 0; color: #555;">Ready for transactions</p>
        </div>
    </div>
    `;
}

/**
 * Tests direct IP reachability for a network ESC/POS receipt printer on port 9100.
 */
export async function testNetworkPrinter(ip: string, timeoutMs = 3000): Promise<PrinterTestResult> {
    if (!ip || !ip.trim()) {
        return { success: false, message: 'Please enter a valid printer IP address.' };
    }

    const trimmedIp = ip.trim();
    const t0 = performance.now();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        // Attempt HTTP/RAW probe to port 9100 (or HTTP web portal port 80/9100)
        await fetch(`http://${trimmedIp}:9100`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });

        clearTimeout(timeout);
        const latencyMs = Math.round(performance.now() - t0);
        return {
            success: true,
            message: `Printer reached at ${trimmedIp} (${latencyMs}ms)`,
            latencyMs
        };
    } catch (err: any) {
        if (err.name === 'AbortError') {
            return { success: false, message: `Printer probe timed out at ${trimmedIp} after ${timeoutMs}ms.` };
        }
        return {
            success: false,
            message: `Unable to connect to printer at ${trimmedIp}: ${err.message || 'Host unreachable'}`
        };
    }
}
