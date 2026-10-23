import type { LabelSize } from './types';
import { SIZE_CSS } from './types';

/** Fixed thermal page geometry: no growing cards or trailing blank print page. */
export function inboundLabelStyles(size: LabelSize): string {
    const dimensions = SIZE_CSS[size];
    const small = size === 'Small';
    return `
    @page { size: ${dimensions.page}; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: white; color: black; font-family: Arial, sans-serif; }
    .labels-container { width: ${dimensions.width}; }
    .lpn-card { width: ${dimensions.width}; height: ${dimensions.height}; padding: ${small ? '0.7mm' : '1.5mm'};
      display: grid; grid-template-rows: auto auto minmax(0,1fr) auto auto auto; gap: ${small ? '0.3mm' : '0.7mm'};
      overflow: hidden; break-inside: avoid; break-after: page; border: 0.3mm solid black; }
    .lpn-card:last-child { break-after: auto; page-break-after: auto; }
    .font-mono { font-family: monospace; }
    .lpn-header,.lpn-footer,.sku-row,.bay-header { display:flex; align-items:center; justify-content:space-between; gap:1mm; min-width:0; }
    .lpn-header { border-bottom:0.2mm solid black; padding-bottom:0.3mm; }
    .lpn-title { display:flex; gap:1mm; flex-wrap:wrap; font-size:${small ? '4.5' : '6'}pt; font-weight:bold; }
    .lpn-meta { display:flex; flex-direction:column; text-align:right; font-size:${small ? '4' : '5.5'}pt; }
    .meta-tag,.product-name,.sku-pill,.pack-pill,.val,.bay-code,.zone-pill { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; min-width:0; }
    .product-name { font-size:${small ? '6' : '9'}pt; font-weight:bold; }
    .sku-row { font-size:${small ? '4.5' : '6'}pt; font-weight:bold; }
    .lpn-symbology { display:flex; align-items:center; justify-content:center; gap:1mm; min-height:0; overflow:hidden; }
    .barcode-wrap { flex:1; min-width:0; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .barcode-wrap svg { width:100%; max-height:calc(100% - 2mm); display:block; }
    .barcode-digits { font-size:${small ? '4.5' : '6'}pt; line-height:1.1; }
    .qr-wrap { height:100%; aspect-ratio:1; flex-shrink:0; max-width:40%; }
    .qr-wrap svg,.qr-wrap img { height:100%; width:100%; object-fit:contain; display:block; }
    .lpn-symbology.qr .qr-wrap { max-width:100%; }
    .lpn-fefo-grid { display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap:1mm; border-top:0.2mm solid black; padding-top:0.3mm; }
    .fefo-cell { min-width:0; display:flex; flex-direction:column; }
    .lbl,.bay-header { font-size:${small ? '3.5' : '5'}pt; }
    .val { font-size:${small ? '4.5' : '7'}pt; font-weight:bold; }
    .lpn-target-bay { min-width:0; border-top:0.2mm solid black; padding-top:0.3mm; }
    .bay-code { font-size:${small ? '4.5' : '8'}pt; font-weight:bold; }
    .lpn-footer { border-top:0.2mm solid black; padding-top:0.3mm; font-size:${small ? '3.5' : '5'}pt; }
    .lpn-footer > span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .status-stamp { font-weight:bold; }
    `;
}
