# 20 · Output and pattern inventory

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Revision E, 30 October 2026

## Purpose and authority

Design coverage includes physical output and exported artifacts as well as application screens. A receipt, barcode, shelf tag, spreadsheet or handover record is part of the user's workflow and MUST have an intentional design contract. A page redesign does not establish compliance for the output it generates.

Use chapter 19 for complete UI/UX coverage, chapter 21 for scannable identifiers and labels, and chapter 22 for receipts, documents and print delivery. Existing business, approval, country, privacy and blind-control rules apply in every medium. This inventory does not create new transactions, document obligations, permissions or certification claims.

## Required design families

| Family | Required inventory entries where the workflow exists | Principal contract |
|---|---|---|
| Barcodes and QR codes | Product, location, carton, pallet, tote, shipment, transfer and document identifiers | Chapter 21: symbology, payload, human-readable identifier, scan behavior and physical verification |
| Product labels | Product name, SKU, variant, package size/unit, batch/lot, expiry and facility identification | Chapter 21: distinguish item identity, packaging and stock unit |
| Shelf and promotional tags | Regular price, effective sale price, currency, applicable unit price, discount, validity and shelf location | Chapter 21: authoritative price and evidence-backed claims |
| Warehouse location labels | Facility, zone, aisle, rack, shelf, bay, bin and dock | Chapter 21: readable hierarchy and exact physical target |
| Handling and logistics labels | Carton, pallet, tote, shipping, transfer, return, quarantine and damaged-stock labels | Chapter 21: custody, condition and routing without exposing blind values |
| POS receipts | Sale, refund, exchange, void, reprint, customer and merchant copies | Chapter 22: transaction identity, itemization, totals and copy state |
| Payment documents | Acknowledgement, credit/debit note, voucher and remittance advice | Chapter 22: actual financial event and approval state |
| Purchasing documents | Purchase request, quotation comparison, purchase order and supplier return | Chapter 22: parties, scope, units and decision evidence |
| Receiving documents | Inbound manifest, blind receiving sheet, quality inspection, discrepancy record and goods received note | Chapter 22: expected/count separation, lot, condition and confirmed receipt |
| Fulfillment documents | Pick list, packing list, carton contents, dispatch manifest and delivery note | Chapter 22: task, stage, route, units and version |
| Delivery and handover | Driver collection, custody transfer, proof of delivery, failed delivery and discrepancy co-signing | Chapter 22: actors, event, evidence and required independent confirmation |
| Inventory documents | Blind count, reconciliation, adjustment, write-off and replenishment request | Chapter 22: counted/approved/posted distinctions and stock-unit precision |
| Cash and shift documents | Float handover, cash drop, drawer reconciliation, X-report and Z-report | Chapter 22: actual shift, counter, currency, count visibility and close state |
| Reports and exports | Operational, financial and audit reports; PDF, spreadsheet and printable variants | Chapters 06 and 22: scope, filters, period, completeness and totals |
| Print setup and preview | Thermal roll, label media, A4/A5 where supported, margins, page breaks, copies, printer and reprints | Chapter 22: explicit media profile and truthful device status |
| Scanner screens | Camera, hardware scanner, manual entry where allowed, quantity capture, accepted/rejected scans and offline behavior | Chapters 10 and 21: physical target, identity validation and safe recovery |
| Forms and approval workflows | Required fields, validation, review summary, approval/rejection, reasons and signatures | Chapters 05 and 07: input, actor, decision and confirmed outcome |
| Tables, lists and dashboards | Search, filters, pagination, bulk selection, statuses, charts and mobile layouts | Chapters 06 and 16: bounded working set and exact action scope |
| Shared controls and feedback | Buttons, menus, tabs, modals, drawers, notifications, loading, empty, error and permission states | Chapters 05, 09, 14, 15 and 19: common interaction and state contracts |
| Identity and communication templates | Staff badges, facility identification, operational email, SMS and in-app messages | Chapters 03, 07, 21 and 22: audience, minimum necessary data and evidence-backed content |

Not every listed variant must become a new feature. Inventory an existing output or one being introduced; mark inapplicable entries with a concrete reason. Do not create unused screens, forms or statutory documents merely to fill the inventory.

## Contract required for each implemented template

Before implementing or changing an output, record:

1. **Task and audience:** who reads/scans it, at which physical step, and what action it supports.
2. **Ownership and scope:** generating module, source record, user/role, country, facility, currency and relevant session.
3. **Content anatomy:** required/optional fields, hierarchy, labels, units, language, authoritative data source and unavailable-value treatment.
4. **State:** preview/draft, submitted, approved, posted/applied, void/cancelled, duplicate/reprint or archived, as applicable. Identify whether it is an instruction, proposal or completed-event record.
5. **Medium:** screen, PDF, spreadsheet, thermal roll, fixed label or sheet; physical size, printable area, orientation and supported device profile.
6. **Interaction:** generation, selection/copies, preview, validation, delivery, interruption, retry and explicit completion evidence.
7. **Security:** blind fields, sensitive fields, redaction, authorized recipient and whether the encoded payload needs authenticated resolution.
8. **Traceability:** human business reference, template revision, source version/as-of time and reprint/audit correlation where required.
9. **Acceptance evidence:** rendered samples, edge cases, scope checks, accessible alternatives, physical scan/print checks and known unverified hardware.

Use shared renderers and semantic field definitions when the content contract is the same. Customer copies, internal copies, screen previews and printer variants can differ deliberately; document the difference rather than silently dropping fields.

## Shared presentation requirements

- Lead with the document/object identity and the facts needed for the next action. Separate primary values from metadata and instructions.
- Use readable names alongside identifiers; avoid raw database UUIDs as the main identity. Preserve meaningful leading zeros and identifier characters.
- Show units next to quantities and currency next to monetary values. Apply the existing domain rounding rules; never change an amount for visual convenience.
- Support long names, supported scripts, missing optional fields, large values, refunds/negative values where valid, multi-page output and applicable tax configuration.
- Use explicit status words, not color alone. Screen tokens follow the shared appearance system; physical output uses an intentional high-contrast print profile.
- Do not turn absent evidence into a badge, signature, certification, successful delivery or completed operation.
- A PDF or print preview MUST preserve the source workflow's scope and protected fields. Exports and barcodes are not exceptions to access control.

## Maintenance and rollout

Add the template to the implementation coverage inventory with a responsible area, renderer path, revision, supported profiles and current evidence. A change to shared fields, pricing rules, barcode payloads or print media MUST identify affected templates and scanners before release.

Legacy output is not automatically compliant. Migration work should prioritize scannable identifiers, labels, receipts and critical custody/financial documents, then remaining exports and communication templates. Review actual rendered artifacts and physical results before claiming device compatibility.
