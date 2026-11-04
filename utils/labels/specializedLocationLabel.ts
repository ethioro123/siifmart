import { escapeHtml } from './escapeHtml';

export interface LocationSpecializations {
    zoneSpecialization?: string;
    aisleSpecialization?: string;
}
export function specializedLocationLabel(
    item: LocationSpecializations & { humanLabel: string; barcode: string; siteName?: string; zone: string; aisle: string },
    barcode: string, qr: string,
    captions: { zone: string; aisle: string }
) {
    const line = (caption: string, number: string, value?: string) => value?.trim()
        ? `<div style="overflow-wrap:anywhere;"><b>${escapeHtml(caption)} ${escapeHtml(number)}:</b> ${escapeHtml(value)}</div>` : '';
    return `<div style="height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;padding:8px;border:2px solid #000;background:#fff;color:#000;font-family:Arial,sans-serif;">
        <div style="font-size:9px;font-weight:700;overflow-wrap:anywhere;">${escapeHtml(item.siteName || 'SIIFMART')}</div>
        <div style="font-size:24px;line-height:1.1;font-weight:900;text-align:center;">${escapeHtml(item.humanLabel)}</div>
        <div style="display:flex;justify-content:center;align-items:center;gap:8px;min-height:0;flex:1;">
            ${barcode ? `<div class="specialization-code">${barcode}</div>` : ''}
            ${qr ? `<div class="specialization-code">${qr}</div>` : ''}
        </div>
        <div style="font-size:9px;font-family:monospace;text-align:center;">${escapeHtml(item.barcode)}</div>
        <div style="font-size:9px;line-height:1.2;border-top:1px solid #000;padding-top:4px;">
            ${line(captions.zone, item.zone, item.zoneSpecialization)}
            ${line(captions.aisle, item.aisle, item.aisleSpecialization)}
        </div>
    </div>`;
}
