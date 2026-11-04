# Receiving finalization — 5 November 2026

AAAA0033 at Adama Industrial Warehouse had 960 recorded received units out of 960 ordered and a Received PO, while its RECEIVE task remained In-Progress. Both immutable receipt records name its assigned receiver. One related PUTAWAY task was Completed and another Pending.

## Change

The receiving hook now calls one authenticated server transaction instead of saving the PO and then separately updating jobs from the browser cache. The server derives full/partial intake from saved PO lines and requires physical receipt evidence. It finds RECEIVE jobs by the real scoped PO reference, applies employee/assignment authorization (including retries), preserves existing operational guards and closes assignments through their existing trigger. A failure rolls back both PO and job changes. PUTAWAY, stock and recorded quantities are unchanged.

Only confirmed server results update local status. Success/failure messages are synchronized in English, Amharic and Afaan Oromoo. No client counts, status, completion identity or timestamp are submitted.

## Applied migrations

All three files were saved before execution and applied to staging `utykzifrblpyxlvlknsm`:

- `migrations/20261105_atomic_receiving_finalization.sql`
- `migrations/20261105_receiving_finalization_retry_authorization.sql`
- `migrations/20261105_repair_aaaa0033_receiving_session.sql`

The maintenance repair checks complete recorded intake and matching receipt handlers before closing the reported RECEIVE task. It logs a maintenance correction, uses the actual correction time and leaves worker completion attribution unchanged; it does not invent a worker attestation. A fresh database read confirmed RECEIVE Completed and the existing PUTAWAY statuses unchanged.

Not applied to production `zdgzpxvorwinugjufkvb`: live inspection confirmed it lacks `private.fulfillment_receipts` and `private.po_expected_sellable_units(public.po_items)`. Those receiving foundations must be deployed before this RPC can work there. This change addresses the reported staging job.

## Verification

- TypeScript passed.
- Complete Vitest suite: 423 files, 2,722 tests passed.
- File-size and whitespace checks passed.
- Staging rollback SQL passed before and after authorization hardening: unsubmitted counts denied, failed job update rolls back the whole finalization, partial remains partial, later full counts finish the PO, retries remain safe, other-site workers denied, anonymous execution denied, pending putaway preserved.
- Security advisor ran; no finding referenced the new finalization function.
- Browser interaction was not manually exercised.
