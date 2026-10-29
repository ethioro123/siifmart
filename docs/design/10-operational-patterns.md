# 10 · Operational workflow patterns

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Edition 29 October 2026

## One system, different work

SIIFMART's visual foundation is shared, but the layout must reflect the task. A handheld pick confirmation, a checkout transaction and a country finance review should not be forced into the same card arrangement. Each should provide clear identity, stable primary actions, factual progress and an accessible exception path.

The following patterns specify presentation and interaction. Actual permissions, role delegation, tax settings, approval thresholds, stock rules and retention remain authoritative in the server workflow and repository business rules. Do not convert an example here into a hardcoded new policy.

## POS sale and payment

Keep item identity, quantity, line amount and transaction total easy to locate. Scanning and search should feed the same understandable basket state. The cashier must be able to see whether a scan added a new item, increased an existing quantity or failed validation. Repeated scans need deliberate duplicate handling, not a decorative animation.

The payment area should identify the amount due, tender state and confirmed result. A pending payment must not look like a completed sale. If a response is lost, offer reconciliation through the actual payment/transaction status before inviting another charge. Do not clear the basket or announce a receipt as saved before confirmation.

Authorized voids, refunds, drawer actions and overrides retain their required supervisory controls. Keep the reason and scope clear without exposing a supervisor's secret or another user's session. The normal selling path should remain short; exceptional actions can require a focused flow rather than crowding the checkout toolbar.

Respect country currency and configured tax behavior. Tax controls belong to authorized Finance settings, not improvised checkout or procurement fields. Ensure receipts, customer displays and print fallbacks present the same confirmed transaction facts.

## Receiving

Show supplier/manifest identity, purchase-order reference and the worker's current receiving step. Keep quantities, packaging units, batch/expiry information and quality exceptions close to the item being handled. When blind receiving applies, do not display expected quantities through the visible layout, accessible text, tooltip or success message.

Use quantity shortcuts only as optional accelerators. Precise entry and correction remain available within the allowed workflow. A damaged item, unknown barcode or quantity discrepancy needs a direct path that preserves the current item and entered evidence. Do not force workers to abandon the whole receipt to record an exception.

Separate item intake from final receipt reconciliation. A scan acknowledgement, a saved count and a completed purchase-order receipt are different events. Final completion must reflect the actual required putaway, quality and discrepancy contract. A partial delivery cannot be made visually complete by hiding the outstanding lines.

## Putaway and replenishment

Make the current item, suggested zone/location and physical confirmation step glanceable. A suggestion is not a verified destination. Keep the bin scan or other required confirmation intact, including correction when a location is unavailable, full or inaccessible.

Display locations in the worker's actual navigation format. Distinguish site, zone, aisle, bay and bin rather than showing an internal UUID as the operational target. Avoid line wrapping that separates a code into ambiguous fragments. A prominent location must remain readable from the expected handheld distance.

When a suggestion fails, keep the supported alternative path visible. Do not repeatedly return a worker to a bin they have already reported as unusable without updated evidence. Replenishment must preserve the actual source/destination and quantity contract; an attractive progress indicator cannot stand in for confirmed stock movement.

## Picking

Present target location, product identity, packaging and required quantity together. The scanner input path should remain ready after success and should recover predictably after failure. Avoid automatic focus behavior that steals text entry from a worker recording an exception.

Short picks, missing stock, damaged units and wrong-item scans need distinct feedback. Keep “retry scan,” “report issue” and “confirm quantity” meaningfully separate. Do not let a success color mask an incomplete quantity or a checksum that was never validated.

Show picked versus remaining quantities where the workflow permits. Keep blind-control requirements intact when expected values are intentionally restricted. Do not introduce a hover-only product detail in a handheld flow.

## Packing and dispatch

Keep packed versus remaining items visible and make the current container or parcel identity clear. Corrections should be safe until the actual finalization boundary. Label printing needs a supported-device result, a visible retry path and protection against accidental duplicate labels where required.

Dispatch has a meaningful final boundary. Identify shipment, destination, driver/transport eligibility and outstanding discrepancies. Preserve required driver verification and co-sign behavior. A generic “Done” button is insufficient when it commits a shipment and removes stock from the originating site.

Do not claim that a printer, scanner, sound or haptic action completed when the browser only requested it. Where hardware confirmation is unavailable, state the observable action and give a practical fallback.

## Inventory and transfers

Make the item, unit, source/destination and adjustment reason visible. Preserve blind counts where required. A stock adjustment request should clearly remain pending until the actual authorized decision applies it. Do not make a UI role check the only barrier to changing quantities.

Transfers need a recognizable sequence from preparation through dispatch and receiving. Show which party needs to act next and retain evidence for discrepancies. A receiving variance is not an ordinary editable number; preserve the documented dual-handshake and accountability rules.

## Merchandising and planograms

Pricing preview should explain the selected SKU set and locations, not flood the page with a separate proposal card for every site. Review can reveal per-location baselines and margin exceptions. Keep regular price, sale price, effective selling price and recorded cost distinguishable; do not substitute a visually convenient baseline.

Planograms require both spatial understanding and precise item identity. Provide zoom, readable position labels, keyboard-accessible alternatives to dragging and a list/diff view for exact changes. A complete layout revision must remain a coherent decision when the server contract requires atomic review and application.

Show submitted, approved and applied layouts distinctly. A store worker needs to know what to execute on the shelf, while a reviewer needs before/after evidence. Do not use the same “published” label for a draft preview and a confirmed store execution.

## Finance, procurement and people

Financial review needs the business reference, currency, amount, supporting evidence and required clearance/approval stage. Keep requester and approver identity clear while limiting personal data to authorized need. Avoid making an appealing total card more prominent than an unresolved control exception.

A purchase request expresses operational need; a purchase order expresses supplier and commercial terms. Do not require ordinary store or warehouse workers to invent supplier details or buying prices to suggest a product. Separate suggestion, procurement preparation and independent approval in the interface according to the actual workflow.

People workflows need privacy, persistence and clear assignment. Distinguish a draft employee change from an approved change; distinguish a task assigned in the database from a local checklist. HR and payroll screens must not expose salary or sensitive details through global notification previews.

## Operational acceptance

Verify frequent work on representative hardware with realistic noise, light, gloves where relevant, intermittent connectivity and long multilingual labels. Record the observed workflow rather than merely testing that a button can be clicked. The essential outcome is correct, traceable work with a short repeatable path and an honest recovery route.
