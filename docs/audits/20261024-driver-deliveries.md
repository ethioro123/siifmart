# Driver deliveries audit — 24 October 2026

## Fixed

- Delivery summary deduplicates mission IDs across active and history data. It labels the scope as loaded missions/progress rather than claiming a full shift total from on-demand history.
- Driver history and summary history are limited to the active origin facility. History excludes non-arrived missions and resets search pagination.
- Incident routing requires an active manager at the current facility; it no longer selects an arbitrary manager from another site or silently assigns the report to the driver.
- Incident creation uses a mutation hook and requires a returned persisted task ID. Null saves display an error and do not show report success. Duplicate submissions and whitespace-only reports are blocked.
- Incident context comes from an authorized mission, not an unrelated selected job.
- Arrival submissions have an immediate duplicate-submit lock. Background job/product refreshes do not overwrite physical-count drafts while the arrival form is open.
- Arrival product lookup stays within the origin facility and prefers the manifest lot/bin. Arrival confirmation still validates every count against dispatched quantities and leaves destination receiving separate.
- A closed transport job says Transport job closed rather than claiming Receiving accepted without receipt evidence. Mobile summary controls use 44px touch targets; arrival modal height uses the device viewport.

## Retained controls

Drivers see assigned internal shipment missions, not transfer requests or external-carrier jobs. Dispatch remains responsible for allocation/loading/departure. Partial arrival requires a reason. Arrival does not change stock or record destination receipt. Shipment mutation locks and post-save refresh handling from the dock pass remain shared.

## Verification and limits

Focused summary, incident persistence, shipment lookup, mission authorization and shipment mutation tests cover the changed paths. TypeScript and file-size checks pass; the full suite retains the pre-existing 98 failures.

No database changes were made. Live RLS, multi-device arrival races, physical proof-of-delivery and actual mobile/scanner hardware were not re-certified in this pass. The separate unapplied packing migration still requires staging application and verification.
