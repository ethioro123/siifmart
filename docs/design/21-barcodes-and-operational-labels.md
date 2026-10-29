# 21 · Barcodes and operational labels

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Revision E, 30 October 2026

## One contract from identifier to physical scan

Every barcode/QR template MUST name the object being identified, the supported symbology, the canonical payload and the scanner workflow that consumes it. A barcode is a machine-readable identifier, not a decorative graphic or proof that an operation has completed.

Use existing accepted supplier/product identifiers where applicable. Do not fabricate or reassign externally governed identifiers. Internal identifiers follow the authoritative country/facility/document sequence; a renderer MUST NOT generate an independent competing sequence.

- Preserve identifier characters and leading zeros. Validate allowed characters, length and any symbology-required check digits before rendering.
- Choose the format from the actual data and supported scanners. Do not apply CODE128, EAN or QR indiscriminately to all objects or silently substitute another format after an error.
- Provide human-readable identity adjacent to the symbol. When the raw payload is a resolver URL or internal token, show a useful business reference without exposing a secret.
- Do not encode credentials, PINs, OTPs, privileged keys or unnecessary personal information. A token or QR URL MUST NOT bypass the existing authorization requirements for sensitive details/actions.
- Payload prefixes and label headings MUST distinguish product, location, pallet, carton and document references where ambiguity could send a scan into the wrong workflow.

## Physical rendering profile

Each supported profile MUST specify media width/height, orientation, printer DPI, printable area, margins, symbology, module/bar width, symbol height and quiet zones. Record the applicable symbology/device requirements and the tested scan conditions. There is no universal minimum barcode size across all formats and printers.

- Use high-contrast dark symbols on a plain light background. Dark-mode UI MUST NOT invert printed symbols.
- Keep the symbol and its required quiet zones free of borders, text, logos, clipping and background patterns. Do not squeeze a long payload to fit a reserved rectangle.
- Preserve module geometry, aspect ratio and raster sharpness. Prefer vector rendering where supported; otherwise render at the target device's native resolution. Avoid blurred resampling and browser fit-to-page scaling.
- Keep a scannable symbol on one physical label/page. Do not rotate it merely to fit without verifying the target scanner and mounting conditions.
- If a payload does not fit the profile, show an actionable error or select a validated larger profile. Never silently truncate an encoded identifier.
- Verify a printed sample with the intended hardware/camera at realistic distance, angle, lighting and placement. Include the longest supported payload and a worn/low-density print case where relevant. A readable SVG in a browser is not physical scan evidence.

## Content anatomy by label type

| Type | Primary content | Supporting content and safeguards |
|---|---|---|
| Product | Product name/variant, SKU or accepted product identifier | Package description and stock unit; applicable batch/lot, expiry and condition. Do not make a case look like a single piece |
| Shelf/price | Effective price and currency, product/variant and applicable unit/package | Regular price and discount only for a valid active offer; shelf location, validity and relevant price version/as-of evidence. Unit price only from verified pack/unit data |
| Location | Facility and clear location code | Zone → aisle → rack → shelf/bay/bin as applicable; readable from the working position. Never label the parent zone as if it were the exact bin |
| Carton/pallet/tote | Container identity and handling state | Parent order/transfer reference, destination, allowed contents summary, lot/condition and count only when the audience is authorized |
| Shipping/transfer | Shipment/transfer reference and destination | Origin, carrier/service where applicable, container sequence and handling instructions. Protect customer data and blind destination receiving |
| Return/quarantine/damage | Explicit condition/status and object identity | Reason/reference, allowed disposition and responsible workflow. Do not present quarantine as released stock |
| Staff/facility identity | Name or role/facility identity appropriate to the task | Minimal authorized details and useful reference. A printed badge does not grant system authorization |

Use chapter 22 for document-level copies, dates, custody and print delivery. The content table does not require adding protected expected quantities to a blind workflow.

## Prices, evidence and claims

- Shelf prices MUST come from the authoritative applied price for the exact country, site and product. Do not print a pending proposal, a matching SKU from another facility or a guessed fallback as a current price.
- Resolve ambiguous SKU/barcode matches before verifying parity or printing. Show the facility and package/variant where the same SKU has multiple records.
- Revalidate stale prices before generation; identify the price version/as-of time used. Reset unsafe selections and parity results when identity or authorized scope changes.
- Apply the existing whole-number merchandising rules consistently in the UI, preview and printed output. Show unavailable prices as unavailable; do not substitute zero.
- Promotional styling requires a valid effective sale price and applicable dates/status. A campaign plan approval alone is not an active POS discount.
- Show Halal, quality, approval or other verification claims only from the relevant explicit evidence and supported scope. An unknown classification MUST NOT default to “Verified.” A loose substring match is not certification evidence.
- Do not imply that a product's classification certifies its supplier, facility or entire shipment. Existing catalog eligibility rules remain mandatory independently of badge display.

## Scan interaction and parity

Scanner screens MUST identify what to scan next, the physical target and the expected identifier type without revealing protected blind quantities. Distinguish accepted, duplicate, wrong type, wrong site, unknown, unreadable and unavailable-validation results.

Provide visual feedback and usable keyboard/touch controls. Sound/vibration may supplement feedback but cannot be the only signal. Manual fallback is available only where existing operational rules authorize it and must retain validation/audit requirements.

For parity checks, capture an explicitly entered valid physical shelf price; blank, invalid or unsupported fractional input is not zero. Compare with the current authoritative applied price at the exact facility. Record actor, time, product, observed price and applied-price evidence when the workflow requires an audit.

Keep these states separate: discrepancy observed, replacement tag selected, output requested, replacement installed and parity rechecked. A selection or print dialog cannot establish physical replacement or resolution.

## Acceptance evidence

- Confirm the exact encoded payload by decoding the output, not by comparing its displayed text alone.
- Test valid and invalid identifiers, duplicate/ambiguous matches, long payloads, wrong site/country/type and unavailable server validation.
- Verify required text and protected-field omission across all supported output variants and relevant languages/scripts.
- Check current/sale price, invalid/missing price, zero stock, long product names, package differences, lot/expiry and reprint identity.
- Render at the actual media dimensions, print at the intended DPI/scaling, inspect clipping/quiet zones and scan the physical result.
- Record hardware that was tested and hardware still unverified. Never describe an untested printer profile as compatible.
