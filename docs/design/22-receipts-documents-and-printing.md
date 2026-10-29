# 22 · Receipts, documents and printing

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Revision E, 30 October 2026

## Document identity and required anatomy

Use chapter 20 to inventory all implemented document families and chapter 21 for any scannable identifier. Each template MUST identify its purpose, audience, source event/record and current business state.

1. **Header:** document type, actual issuer/facility identity and human business reference. A draft/proposal preview must be visibly distinguishable from an issued record.
2. **Context:** country, applicable currency, date/time with unambiguous timezone where timing matters, relevant parties, source/target and linked order/transaction references.
3. **Body:** item/variant, unit/package, quantities and applicable monetary columns; evidence and exceptions that the audience is authorized to see.
4. **Summary:** relevant totals, adjustments, payments, balance/status, counted/approved differences or operational outcome. Arithmetic must reconcile to the authoritative record.
5. **Footer:** copy/reprint status, page numbering for multi-page documents, template revision and necessary instructions/contact details. Include actor/signature/audit references where required by the workflow.

Required fields vary by document. Do not invent legal identifiers, tax rules, supplier details, signature evidence or addresses to fill a template. Legal/statutory content must come from verified country-specific requirements and authorized configuration.

## Workflow-specific contracts

| Family | Essential distinctions |
|---|---|
| Sale receipt | Actual completed transaction, itemization, quantities/units, applied discounts, enabled taxes, total, tender and change. Separate transaction confirmation from print delivery |
| Refund/exchange/void | Explicit document type, original reference, affected items, returned/refunded amounts and actual approval/event. Do not disguise it as a new positive sale |
| Reprint/customer/merchant copy | Preserve the original business reference and committed values. Clearly mark reprint/duplicate and copy audience; do not create another sale or receipt sequence |
| Payment/credit/debit/voucher | Actual payer/payee or issuer/recipient, amount/currency, source obligation, reason and approved/posted state. A proposal is not proof of payment |
| Procurement | Request versus approved order, supplier/destination, line units and agreed amounts, applicable delivery instructions and approval state |
| Receiving/QC | Manifest versus counted receipt, lot/expiry/condition, discrepancies and confirmed intake. Blind copies omit expected quantities and revealing totals, encoded fields and attachments |
| Picking/packing/dispatch | Stage identity, order/container references, destination and authorized quantities. An instruction list is not completed picking, verified packing or dispatch evidence |
| Delivery/handover | Origin/destination, custody event, actual actors/times, exceptions and required independent co-signature. A blank signature line is not a completed attestation |
| Inventory/count/write-off | Blind count versus reconciliation, observed/approved/posted quantities, stock units, reasons and relevant decision references |
| Cash/shift/X/Z | Counter and shift, opening/count/close state, scoped tender totals, approvals and blind fields. X and final Z reports must be distinct; printing must not close or reopen a shift |
| Reports/exports | Scope, period/timezone, filters, source freshness, completeness, currency and unit definitions. Label partial datasets and unavailable figures explicitly |
| Communications/identity | Recipient/audience, source event, minimal useful content and safe action route. Do not leak blind values or sensitive data through email/SMS/badges |

Country and currency remain isolated. Never combine ETB and KES into a single monetary total. Tax visibility follows the active country's enabled configuration and existing workflow rules; templates cannot introduce a new tax toggle.

## Layout and media profiles

Each template MUST name its supported profiles: actual thermal-roll width and printable width, fixed-label dimensions, or sheet format/orientation such as A4/A5 where implemented. Paper units, CSS pixels and printer dots are different; record how they map for the target output.

- Define margins, columns, typography, alignment, line wrapping, page breaks, header/footer behavior and expected scaling for each profile.
- Thermal output uses a single-column hierarchy unless a tested profile supports more. Right-align comparable amounts and keep currency, sign and value together when possible.
- Repeat column headings on multi-page tables where supported. Keep item identity with its quantity/amount, keep totals together where practical and avoid clipped final rows or trailing blank pages.
- Allow long names and supported scripts without dropping required content. Truncation may be used only for nonessential text with a complete accessible alternative in the source workflow; never truncate references, totals, safety instructions or scan payloads.
- Show complete financial values, not compact “K/M” dashboard abbreviations. Use the authoritative domain precision and rounding rules. Do not round independently in a renderer or recalculate saved financial totals from formatted text.
- Use a deliberate ink-friendly high-contrast print palette. Screen appearance and semantic colors must not cause pale text, dark page backgrounds or unreadable grayscale output.
- Ensure supported fonts/scripts and barcode assets load before output. Do not silently print missing glyphs, unloaded images or an empty barcode box.

A sheet of shelf tags and a single thermal shelf label are different profiles. Do not stretch a sheet-grid template onto a label roll or describe one browser preview as universal printer support.

## Preview and generation

Preview MUST use the actual renderer, content and profile that will be sent to the printer/export. Identify draft/sample content and unsupported profiles clearly. A decorative thumbnail alone is not a print preview.

- Show document type/reference, source scope, selected items, copies, media size/orientation and supported printer/profile choice where the application controls it.
- Keep selection exact and inspectable. Explain page-only versus all-filtered selection; retain hidden items only when the user can inspect the full batch. Scope/session changes clear unsafe selection.
- Recheck authoritative current data before printing a current shelf price or mutable work instruction. For an issued receipt/document, preserve committed historical values; do not silently rewrite history using today's product price.
- Identify stale or superseded work and require the relevant refresh/reissue workflow. Reprints preserve the original event identity and add the appropriate copy marker rather than inventing a new transaction.
- Escape untrusted data before inserting it into HTML, SVG or document templates. Do not treat supplier names, notes, product descriptions or encoded URLs as executable markup.
- Protect blind fields in previews, print HTML, PDF text, barcodes/QR payloads, exports, hidden columns and supporting metadata. Redaction must remove the protected value, not merely hide its color.

## Delivery, retries and truthful feedback

Printing MUST remain separate from saving, approving, posting, receiving, handing over or settling the business event. Output retries must not repeat those operations or create duplicate document references.

| Observed event | Appropriate state/copy |
|---|---|
| User selected records or copies | Selected for output; not queued unless a real queue accepted the job |
| Renderer completed | Preview/document generated |
| Browser print interface requested | Print dialog requested; physical printing not confirmed |
| Printer/spooler acknowledged acceptance | Job accepted/queued by the named device/service; not proof the label emerged |
| Device reports supported completion | Device-reported completion, with job correlation |
| User cancelled, device failed, response unavailable | Cancelled/failed/unconfirmed as actually observed; retain retryable content |
| Worker confirms installation/rechecks shelf | Replacement/reverification recorded according to the operational workflow |

Disable duplicate activation while output is being generated or submitted. Preserve the failed batch for retry, distinguish failed from unconfirmed output and make partial completion inspectable where per-job evidence exists. Do not infer physical completion from `window.print()`, a dismissed dialog or a timed callback.

Where audit policy requires a reprint reason, record actor, original reference, time, reason, template/profile and output job identity. Apply existing retention and privacy rules; this standard does not authorize storing duplicate sensitive artifacts indefinitely.

## Accessible digital alternatives

The screen workflow MUST expose meaningful labels, keyboard actions, focus and error recovery for preview/print/export. PDF/document output intended for digital reading SHOULD provide a logical reading order, selectable text and meaningful headings/tables, with an accessible source-view alternative when the generator cannot provide the required semantics.

Screens, printouts and exports must use supported languages/scripts and unambiguous dates, units and currency. POS/WMS UI-copy changes still require the synchronized language dictionaries mandated by the project rules.

## Acceptance matrix

For each supported profile, inspect actual output with short and long content, one/many items, large totals, multi-page boundaries, applicable discounts/taxes, refunds, missing optional data and supported scripts.

Verify arithmetic against saved records, source/version identity, blind-field removal, scope changes, stale prices, duplicate clicks, printer unavailable, cancelled dialog, uncertain response, retry and reprint behavior. Record physical dimensions, printer/DPI, browser/OS and scanner used where applicable.

Render to PDF/image for layout review when useful, but do not substitute that for physical printer/scanner verification. Record missing hardware checks explicitly. Documentation, automated tests and a screenshot alone do not certify all output paths.
