# Receiving audit — 24 October 2026

## Fixed

- Blind repeated scans no longer compare against or expose expected remaining PO quantities. Server receiving validation remains responsible for enforcing tolerance without revealing the manifest count.
- Blind scan-opened splits start with an empty physical count rather than pre-crediting one unit.
- Barcode and product resolution stays within the current receiving facility. Ordered and partially received POs can be opened from scans.
- Non-blind scan limits convert PO quantities to sellable units before comparing physical scans.
- Identifier matching retains meaningful SKU punctuation. Unknown scans cannot match missing product IDs through undefined equality.
- Receipt confirmation and split persistence reject duplicate submissions immediately.
- Adding aliases in the receipt modal only looks up products at the PO facility. New product checks are site scoped.
- Receiving a new lot does not overwrite the existing stocked product's batch/expiry. Lot information remains on the receipt/putaway line for placement.
- Split job creation waits for every result before handling failures and attempts cleanup of confirmed created jobs. Errors no longer claim Nothing was recorded when cleanup or a multi-call save could be incomplete.

## Existing controls retained

Blind expected counts remain masked in intake/quality screens. Fresh authorized PO details are loaded before receipt persistence. Receiving preserves physical-count entry, quality/condition, batch and expiry capture, label state, and putaway handoff. Printing remains separate from receipt confirmation.

## Verification and limits

Focused tests cover blind scan increments, empty blind intake counts, cross-facility barcode rejection, modal steps, PO-item authorization, receiving policy and label printing. TypeScript and file-size checks pass. Full suite results are reported with the change.

No database changes were made in this pass. The existing receiving implementation still uses multiple calls for product updates, split jobs and PO synchronization; cleanup is best effort and is not an atomic transaction. Concurrent devices, server-only blind-manifest exposure, QC/expiry enforcement, retry idempotency after network loss and physical printer/scanner output remain unverified. A trusted receiving transaction and staging regressions are still required before claiming end-to-end atomic receipt processing.
