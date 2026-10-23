import React, { useEffect, useState } from 'react';
import { generateInboundPutawayLabelHTML } from '../../../utils/labels/InboundPutawayLabelGenerator';
import { generateUnifiedBatchLabelsHTML } from '../../../utils/labels/ProductLabelGenerator';
import { buildReceivingPalletLabels, type ReceivingPrintItem } from '../../../utils/receivingLabelData';
import { getLabelDimensions, normalizeLabelSize } from '../../../utils/labels/types';
interface Props {
    item: ReceivingPrintItem; type: 'LPN' | 'ITEM'; size: string; format: 'QR' | 'Barcode' | 'Both';
    showPrice: boolean; showCategory: boolean; showName: boolean; currency?: string;
}
export function ReceivingLabelOutputPreview({ item, type, size, format, showPrice, showCategory, showName, currency }: Props) {
    const [html, setHtml] = useState('');
    const [failed, setFailed] = useState(false);
    const normalizedSize = normalizeLabelSize(size);
    const outputSize = type === 'LPN' && ['Tiny', 'Small'].includes(normalizedSize) ? 'Medium' : normalizedSize;
    const dimensions = getLabelDimensions(outputSize);
    useEffect(() => {
        let current = true;
        setHtml(''); setFailed(false);
        const generate = async () => {
            try {
                const output = type === 'LPN'
                    ? await generateInboundPutawayLabelHTML(buildReceivingPalletLabels([{ ...item, copies: 1 }]), { size: outputSize, format })
                    : await generateUnifiedBatchLabelsHTML([{ value: item.sku, sku: item.sku, label: item.name, quantity: 1,
                        price: String(item.price ?? ''), category: item.category, date: item.expiry }], { size: outputSize, format, showPrice, showCategory, showName, currency });
                if (current) setHtml(output.replace('</head>', '<style>.no-print{display:none!important}html,body{margin:0!important;padding:0!important}</style></head>'));
            } catch { if (current) setFailed(true); }
        };
        void generate();
        return () => { current = false; };
    }, [item, type, size, format, showPrice, showCategory, showName, currency]);
    return <div className="space-y-2">
        <p className="text-xs text-[var(--theme-text-secondary)]">Actual label layout · {dimensions.label}. Set printer scale to 100% and disable page headers and footers.</p>
        {failed ? <p role="alert" className="text-sm text-[var(--theme-text-primary)]">Enter a valid SKU and count to preview the label.</p> : !html ? <p role="status">Preparing preview…</p> :
            <div className="overflow-auto rounded-xl border border-[var(--theme-border)] bg-white p-3">
                <iframe title="Receiving label print output" sandbox="" srcDoc={html} style={{ width: dimensions.width, height: dimensions.height, border: 0, display: 'block' }} />
            </div>}
    </div>;
}
