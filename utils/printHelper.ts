/**
 * Safely prints HTML content using a hidden iframe to prevent blocking the main JS event loop.
 * Bypasses browser popup blockers entirely.
 */
export const printHtmlContent = (htmlContent: string) => {
    // Strip any auto-print scripts to prevent duplicate print dialog triggers
    const sanitizedHtml = htmlContent.replace(/<script\b[^>]*>([\s\S]*?)window\.print\(\)[\s\S]*?<\/script>/gi, '');

    // 1. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // 2. Write content directly into it
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
        doc.write(sanitizedHtml);
        doc.close();
    }

    // 3. Trigger printing once loaded
    setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // 4. Clean up the DOM after printing has initialized
        setTimeout(() => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 1500);
    }, 500);
};
