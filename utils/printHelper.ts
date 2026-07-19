/**
 * Universal printing helper supporting desktop and mobile devices.
 *
 * MOBILE PRINTING CONTEXT:
 * ─────────────────────────────────────────────────────────────────
 * iOS Safari and Android Chrome both BLOCK iframe.contentWindow.print().
 * The OS print system cannot access the iframe document via that API —
 * it either silently fails or captures the entire main page as a screenshot.
 *
 * Strategy:
 *  1. Desktop (non-mobile): Use hidden iframe → iframe.contentWindow.print()
 *     (original approach, works perfectly on all desktop browsers)
 *  2. Mobile Android / Chrome popup-friendly: Open a new popup window,
 *     write the label HTML, call popup.print() then close it.
 *  3. Mobile iOS Safari (popup blocker): Inject a full-page print overlay
 *     into the main document, use @media print CSS to hide everything EXCEPT
 *     the label overlay, then call window.print() on the main window.
 */

/** Detect if running on a mobile browser */
const isMobileBrowser = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
};

/** Detect if running on iOS (Safari blocks window.open popups without user gesture timeout) */
const isIOS = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Desktop strategy: hidden iframe print.
 * Works on Chrome, Firefox, Edge, Safari desktop.
 */
const printViaIframe = (htmlContent: string): void => {
    // Remove old leftover print iframes
    const oldIframe = document.getElementById('siifmart-print-iframe');
    if (oldIframe?.parentNode) {
        oldIframe.parentNode.removeChild(oldIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'siifmart-print-iframe';
    iframe.style.cssText = [
        'position:fixed',
        'left:0',
        'top:0',
        'width:100vw',
        'height:100vh',
        'border:0',
        'opacity:0',
        'pointer-events:none',
        'z-index:-99999'
    ].join(';');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    const triggerPrint = () => {
        const iframeWin = iframe.contentWindow;
        if (!iframeWin) return;

        const images = Array.from(iframeWin.document.images || []);

        const executePrint = () => {
            try {
                iframeWin.focus();
                iframeWin.print();
            } catch {
                window.print();
            }
            setTimeout(() => {
                if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            }, 3000);
        };

        if (images.length === 0) {
            setTimeout(executePrint, 300);
            return;
        }

        let pending = images.length;
        const onDone = () => { if (--pending <= 0) setTimeout(executePrint, 300); };
        images.forEach(img => {
            if (img.complete) { onDone(); }
            else {
                img.addEventListener('load', onDone, { once: true });
                img.addEventListener('error', onDone, { once: true });
            }
        });
        setTimeout(executePrint, 1500);
    };

    setTimeout(triggerPrint, 400);
};

/**
 * Android / popup-capable mobile strategy: new popup window.
 * window.open() returns a real window object on Android Chrome.
 * We write the label HTML into it, then call print() on it directly.
 */
const printViaPopup = (htmlContent: string): boolean => {
    const popup = window.open('', '_blank', 'width=800,height=600');
    if (!popup) return false; // popup was blocked

    popup.document.open();
    popup.document.write(htmlContent);
    popup.document.close();

    const images = Array.from(popup.document.images || []);

    const executePrint = () => {
        try {
            popup.focus();
            popup.print();
        } catch {
            // ignore
        }
        // Close popup after print dialog dismissed
        setTimeout(() => { try { popup.close(); } catch { /* ignore */ } }, 2000);
    };

    if (images.length === 0) {
        setTimeout(executePrint, 500);
        return true;
    }

    let pending = images.length;
    const onDone = () => { if (--pending <= 0) setTimeout(executePrint, 500); };
    images.forEach(img => {
        if (img.complete) { onDone(); }
        else {
            img.addEventListener('load', onDone, { once: true });
            img.addEventListener('error', onDone, { once: true });
        }
    });
    setTimeout(executePrint, 2000); // safety fallback
    return true;
};

/**
 * iOS Safari strategy: full-page print overlay.
 *
 * iOS Safari cannot call print() on a popup or iframe window.
 * The only reliable approach is to:
 *  1. Inject the label HTML into a fixed full-screen overlay div in the main document.
 *  2. Use @media print CSS injected into <head> to:
 *     a. Hide the entire <body> content (visibility:hidden / display:none).
 *     b. Show ONLY the print overlay (visibility:visible / position:static).
 *  3. Call window.print() on the main window.
 *  4. Clean up immediately after the print dialog returns.
 */
const printViaIOSOverlay = (htmlContent: string): void => {
    // Inject print-isolation styles into <head> once
    const STYLE_ID = 'siifmart-ios-print-style';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            @media print {
                body > *:not(#siifmart-ios-print-overlay) {
                    visibility: hidden !important;
                    display: none !important;
                }
                #siifmart-ios-print-overlay {
                    display: block !important;
                    visibility: visible !important;
                    position: fixed !important;
                    inset: 0 !important;
                    z-index: 2147483647 !important;
                    background: #fff !important;
                    width: 100% !important;
                    height: 100% !important;
                    overflow: visible !important;
                }
                #siifmart-ios-print-overlay iframe {
                    width: 100% !important;
                    height: 100% !important;
                    border: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Remove any old overlay
    const old = document.getElementById('siifmart-ios-print-overlay');
    if (old?.parentNode) old.parentNode.removeChild(old);

    // Create overlay with an inner iframe to isolate the label content
    const overlay = document.createElement('div');
    overlay.id = 'siifmart-ios-print-overlay';
    overlay.style.cssText = [
        'display:none', // hidden on screen, only shown via @media print
        'position:fixed',
        'inset:0',
        'z-index:2147483647',
        'background:#fff',
        'width:100%',
        'height:100%',
        'overflow:hidden'
    ].join(';');

    // Inner iframe to contain the label HTML cleanly
    const innerFrame = document.createElement('iframe');
    innerFrame.style.cssText = 'width:100%;height:100%;border:none;';
    overlay.appendChild(innerFrame);
    document.body.appendChild(overlay);

    // Write label content into inner iframe
    const iDoc = innerFrame.contentWindow?.document || innerFrame.contentDocument;
    if (iDoc) {
        iDoc.open();
        iDoc.write(htmlContent);
        iDoc.close();
    }

    const cleanup = () => {
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 1000);
    };

    const executePrint = () => {
        try {
            window.focus();
            window.print();
        } catch {
            // ignore
        }
        cleanup();
    };

    // Wait for fonts + assets to load
    const images = iDoc ? Array.from(iDoc.images || []) : [];
    if (images.length === 0) {
        setTimeout(executePrint, 600);
        return;
    }

    let pending = images.length;
    const onDone = () => { if (--pending <= 0) setTimeout(executePrint, 600); };
    images.forEach(img => {
        if (img.complete) { onDone(); }
        else {
            img.addEventListener('load', onDone, { once: true });
            img.addEventListener('error', onDone, { once: true });
        }
    });
    setTimeout(executePrint, 2000);
};

/**
 * Main entry point — routes to the appropriate print strategy
 * based on the detected device/browser environment.
 */
export const printHtmlContent = (htmlContent: string): void => {
    // Strip any embedded auto-print scripts to avoid double-dialog triggers
    const sanitized = htmlContent.replace(
        /<script\b[^>]*>([\s\S]*?)window\.print\(\)[\s\S]*?<\/script>/gi,
        ''
    );

    if (!isMobileBrowser()) {
        // ✅ Desktop: iframe strategy (most reliable on all desktop browsers)
        printViaIframe(sanitized);
        return;
    }

    if (isIOS()) {
        // ✅ iOS Safari: overlay strategy (popup is blocked or doesn't support print())
        printViaIOSOverlay(sanitized);
        return;
    }

    // ✅ Android / other mobile: try popup first, fall back to iOS overlay strategy
    const popupSucceeded = printViaPopup(sanitized);
    if (!popupSucceeded) {
        // Popup was blocked (e.g. strict browser settings) — use overlay fallback
        printViaIOSOverlay(sanitized);
    }
};
