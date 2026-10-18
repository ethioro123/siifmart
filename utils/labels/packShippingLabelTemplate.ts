interface PackShippingLabelTemplateData {
    fromName: string;
    fromAddress: string;
    recipient: string;
    address: string;
    city: string;
    orderRef: string;
    trackingNumber: string;
    packDate: string;
    itemCount: number;
    packageNumber: number;
    totalPackages: number;
    qr: string;
    barcode: string;
    handlingHtml: string;
}

export const buildPackShippingLabel = (data: PackShippingLabelTemplateData): string => `
    <article class="pack-shipping-label">
        <header class="shipping-header">
            <div class="brand-block">
                <div class="brand-name">SIIFMART</div>
                <div class="brand-subtitle">PARCEL SHIPPING LABEL</div>
            </div>
            <div class="qr-code">${data.qr}</div>
        </header>

        <div class="origin">
            <span class="field-label">FROM</span>
            <span class="origin-value">${data.fromName}${data.fromAddress ? ` · ${data.fromAddress}` : ''}</span>
        </div>

        <section class="destination">
            <div class="field-label">SHIP TO</div>
            <div class="recipient">${data.recipient}</div>
            ${data.address ? `<div class="address">${data.address}</div>` : ''}
            ${data.city ? `<div class="city">${data.city}</div>` : ''}
        </section>

        ${data.handlingHtml ? `<div class="handling">${data.handlingHtml}</div>` : ''}

        <div class="shipment-meta">
            <span>${data.itemCount} ${data.itemCount === 1 ? 'ITEM' : 'ITEMS'}</span>
            <span>PARCEL ${data.packageNumber} OF ${data.totalPackages}</span>
            <span>JOB ${data.orderRef}</span>
        </div>

        <div class="tracking-block">
            <div class="barcode">${data.barcode}</div>
            <div class="tracking-number">${data.trackingNumber}</div>
        </div>

        <footer class="shipping-footer">
            <span>PACKED ${data.packDate}</span>
            <span>SIIFMART LOGISTICS</span>
        </footer>
    </article>
`;

export const packShippingLabelStyles = `
    .pack-shipping-label {
        width: 100%;
        height: 100%;
        padding: 18px 20px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow: hidden;
        box-sizing: border-box;
        background: #fff;
        color: #111;
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.2;
    }
    .shipping-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 66px;
        padding-bottom: 8px;
        border-bottom: 2px solid #111;
    }
    .brand-name {
        font-size: 25px;
        font-weight: 800;
        letter-spacing: 1.2px;
    }
    .brand-subtitle, .field-label {
        color: #444;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 1.2px;
    }
    .qr-code {
        width: 58px;
        height: 58px;
        flex: 0 0 58px;
        padding: 2px;
        border: 1px solid #aaa;
        box-sizing: border-box;
    }
    .qr-code svg { width: 100%; height: 100%; display: block; }
    .origin {
        display: flex;
        gap: 8px;
        font-size: 9px;
        line-height: 1.2;
    }
    .origin .field-label { flex: 0 0 auto; }
    .origin-value { font-weight: 600; }
    .destination {
        padding: 8px 10px 10px;
        border: 2px solid #111;
    }
    .recipient {
        margin-top: 3px;
        font-size: 23px;
        font-weight: 800;
        line-height: 1.05;
        overflow-wrap: anywhere;
    }
    .address, .city {
        margin-top: 4px;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.2;
        overflow-wrap: anywhere;
    }
    .city { font-weight: 800; }
    .handling { display: flex; flex-wrap: wrap; gap: 4px; }
    .handling > div { padding: 3px 5px !important; }
    .shipment-meta {
        display: flex;
        justify-content: space-between;
        gap: 6px;
        padding: 6px 0;
        border-top: 1px solid #aaa;
        border-bottom: 1px solid #aaa;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: .3px;
    }
    .tracking-block {
        margin-top: auto;
        text-align: center;
    }
    .barcode {
        height: 58px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .barcode svg { height: 56px; width: auto; max-width: 100%; display: block; }
    .tracking-number {
        margin-top: 3px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 1.5px;
        overflow-wrap: anywhere;
    }
    .shipping-footer {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        padding-top: 6px;
        border-top: 1px solid #111;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: .5px;
    }
`;
