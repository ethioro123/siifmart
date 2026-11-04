import { escapeHtml } from './escapeHtml';
import type { LabelSize } from './types';

export interface LocationSpecializations {
    zoneSpecialization?: string;
    aisleSpecialization?: string;
}
export const SPECIALIZED_LOCATION_CSS = `
    .location-print {
        --label-inset: 10px; --label-hero: 38px; --label-detail: 10px; --label-code: 54px;
        height: 100%; padding: var(--label-inset); display: flex; flex-direction: column;
        gap: 5px; background: #fff; color: #000; font-family: Arial, sans-serif;
    }
    .location-print--large { --label-inset: 16px; --label-hero: 64px; --label-detail: 13px; --label-code: 84px; gap: 8px; }
    .location-print--xl { --label-inset: 22px; --label-hero: 78px; --label-detail: 18px; --label-code: 130px; gap: 16px; }
    .location-print--dense { --label-hero: 30px; --label-detail: 8px; --label-code: 40px; gap: 4px; }
    .location-print__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; font-size: 8px; line-height: 1.2; }
    .location-print__facility { max-width: 80%; overflow-wrap: anywhere; }
    .location-print__brand { font-weight: 900; letter-spacing: .12em; }
    .location-print__site { margin-top: 2px; }
    .location-print__site-code { font-family: monospace; white-space: nowrap; }
    .location-print__location { font-size: var(--label-hero); font-weight: 900; letter-spacing: -.03em; line-height: 1; text-align: center; margin: 2px 0; font-variant-numeric: tabular-nums; }
    .location-print__details { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; border-top: 1px solid #000; padding-top: 5px; }
    .location-print__detail { overflow-wrap: anywhere; font-size: var(--label-detail); line-height: 1.15; }
    .location-print__detail b { display: block; font-size: .75em; font-weight: 400; margin-bottom: 3px; }
    .location-print__detail span { font-weight: 700; }
    .location-print__symbols { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 5px 10px; margin-top: auto; min-height: 0; }
    .location-print__symbol { min-width: 0; display: flex; justify-content: center; }
    .location-print__symbol svg, .location-print__symbol img { height: var(--label-code); max-height: none; max-width: 100%; width: auto; }
    .location-print__number { font: 9px/1 monospace; letter-spacing: .12em; text-align: center; }
    .location-print--large .location-print__header, .location-print--xl .location-print__header { font-size: 10px; }
    .location-print--large .location-print__number, .location-print--xl .location-print__number { font-size: 12px; }
`;
export function specializedLocationLabel(
    item: LocationSpecializations & { humanLabel: string; barcode: string; siteName?: string; siteCode?: string; zone: string; aisle: string },
    barcode: string, qr: string,
    captions: { zone: string; aisle: string; kind?: string },
    size: LabelSize = 'Medium'
) {
    const line = (caption: string, number: string, value?: string) => value?.trim()
        ? `<div class="location-print__detail"><b>${escapeHtml(caption)} ${escapeHtml(number)}:</b><span>${escapeHtml(value)}</span></div>` : '';
    const dense = size === 'Medium' && [item.zoneSpecialization, item.aisleSpecialization, item.siteName].some(v => (v?.length || 0) > 60);
    return `<div class="location-print location-print--${size.toLowerCase()}${dense ? ' location-print--dense' : ''}">
        <header class="location-print__header">
            <div class="location-print__facility"><div class="location-print__brand">SIIFMART · ${escapeHtml(captions.kind || 'LOCATION LABEL')}</div>
                ${item.siteName ? `<div class="location-print__site">${escapeHtml(item.siteName)}</div>` : ''}
            </div>
            ${item.siteCode ? `<div class="location-print__site-code">${escapeHtml(item.siteCode)}</div>` : ''}
        </header>
        <div class="location-print__location">${escapeHtml(item.humanLabel)}</div>
        ${item.zoneSpecialization?.trim() || item.aisleSpecialization?.trim() ? `<div class="location-print__details">
            ${line(captions.zone, item.zone, item.zoneSpecialization)}
            ${line(captions.aisle, item.aisle, item.aisleSpecialization)}
        </div>` : ''}
        <div class="location-print__symbols">
            ${barcode ? `<div class="location-print__symbol">${barcode}</div>` : ''}
            ${qr ? `<div class="location-print__symbol">${qr}</div>` : ''}
        </div>
        <div class="location-print__number">${escapeHtml(item.barcode)}</div>
    </div>`;
}
