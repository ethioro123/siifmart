/**
 * Universal printing helper supporting desktop and mobile devices (iOS AirPrint & Android Print).
 * Ensures non-zero layout viewport dimensions and asset load completion before triggering print dialogs.
 */
export const printHtmlContent = (htmlContent: string) => {
    // Strip any auto-print scripts to prevent duplicate print dialog triggers
    const sanitizedHtml = htmlContent.replace(/<script\b[^>]*>([\s\S]*?)window\.print\(\)[\s\S]*?<\/script>/gi, '');

    // Remove old leftover print iframes if any exist
    const oldIframe = document.getElementById('siifmart-print-iframe');
    if (oldIframe && oldIframe.parentNode) {
        oldIframe.parentNode.removeChild(oldIframe);
    }

    // 1. Create iframe with full layout viewport (non-zero width/height for mobile WebKit & Blink engines)
    const iframe = document.createElement('iframe');
    iframe.id = 'siifmart-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-99999';
    document.body.appendChild(iframe);

    // 2. Write content with explicit print media stylesheet
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @media print {
                        @page { margin: 0; }
                        html, body {
                            width: 100% !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                            color: #000000 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            overflow: visible !important;
                        }
                        .no-print, button {
                            display: none !important;
                        }
                    }
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                </style>
            </head>
            <body>
                ${sanitizedHtml}
            </body>
            </html>
        `);
        doc.close();
    }

    const triggerPrint = () => {
        const iframeWin = iframe.contentWindow;
        if (!iframeWin) return;

        // Ensure images and SVGs inside iframe have finished loading
        const iframeDoc = iframeWin.document;
        const images = Array.from(iframeDoc.images || []);

        const executePrint = () => {
            try {
                iframeWin.focus();
                iframeWin.print();
            } catch (err) {
                // Fallback to window.print if iframe print fails
                window.print();
            }

            // Clean up iframe after printing completes or user closes dialog
            setTimeout(() => {
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            }, 3000);
        };

        if (images.length === 0) {
            setTimeout(executePrint, 250);
            return;
        }

        let pendingImages = images.length;
        const onImageFinished = () => {
            pendingImages--;
            if (pendingImages <= 0) {
                setTimeout(executePrint, 250);
            }
        };

        images.forEach((img) => {
            if (img.complete) {
                onImageFinished();
            } else {
                img.addEventListener('load', onImageFinished, { once: true });
                img.addEventListener('error', onImageFinished, { once: true });
            }
        });

        // Max safety fallback timeout if an image stalls
        setTimeout(executePrint, 1200);
    };

    // Trigger asset checking once iframe DOM is initialized
    setTimeout(triggerPrint, 300);
};
