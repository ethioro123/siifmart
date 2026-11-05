# Buying-to-selling integrity fixes — 6 November 2026

All nine findings in `product-movement-deep-audit-20261106.md` have implementation changes and regression coverage.

| Finding | Result |
| --- | --- |
| Invoice maker self-approval / fabricated matching | The database derives match status from the linked PO and received units, accounts for previously approved invoices, binds creator/approver to authenticated employees, and rejects self-approval. Unmatched invoices require a justified independent override. Invoice creation and lines save together. |
| Unapproved transfer variance | Saved disputed counts remain unposted until a different supervisor approves and the assigned authenticated driver co-signs. Both signatures bind to the exact saved manifest/count fingerprint. Stale evidence and receiver self-approval are rejected. |
| Order release marks delivered | The release control calls an atomic, scoped warehouse release. It creates one FEFO PICK and sets Picking/RELEASED; retries reuse the handoff. Packing remains the verified-pick completion responsibility. Offline or failed release does not update the cache or announce success. |
| PO partial writes | Header and line creation/replacement now use one transaction, retaining existing lines and header on a failed replacement. |
| Mixed-country/currency payment run | One trusted transaction checks all selected invoices, country, currency, eligibility, independent approval evidence and existing membership before summing amounts. |
| Orphan payment run | Header and invoice association save together; incomplete association raises an error and rolls back. Direct client run creation is revoked; run identity/totals cannot be edited. |
| Unusable assignment after history failure | Job assignment and its required execution-authorization row save together. Retries reuse the assignment row. |
| Duplicate SKU receipt reconciliation | Explicit PO-item identity resolves repeated SKUs; legacy lines still require an unambiguous SKU match. |
| Receivables beyond first page | Server aggregation totals the complete RLS-visible country set. Aggregate failures propagate instead of displaying a partial page or zero debt. Displayed lists remain paginated. |

## Operation of transfer exceptions

Managers open Operations overview, select the transfer exception and use **Transfer variance review**. The saved count is shown without revealing expected quantities. An independent scoped supervisor supplies a reason and approves the counted variance. The assigned internal driver opens the arrived shipment and co-signs from their own authenticated session. The receiving custodian then accepts the saved count. Matching transfers need neither signature.

A receiver who is also a manager cannot approve their own count; another scoped supervisor must decide. Transfers without an assigned authenticated internal driver cannot complete a disputed receipt through this path. External-carrier attestation remains a separate workflow requirement; this change does not impersonate an external driver or accept a typed driver name as a signature.

Both POS-command and warehouse transfer receiving use the same trusted intake. For a store, acceptance posts stock in the transaction. For a warehouse/DC, acceptance creates one putaway job and leaves stock unchanged until the existing physical placement operation posts it. This removes the older warehouse client-side stock writes and compensating balance rollback.

New transfer review controls and order-release messages have English, Amharic and Oromo translations. They use semantic theme tokens, labeled controls, status/error regions and minimum touch targets. Browser/visual verification was not performed.

## Persisted migrations and application status

The following files were saved before execution and **all applied to staging project `utykzifrblpyxlvlknsm`**. Production was not changed.

1. `migrations/20261106_deep_financial_integrity.sql`
2. `migrations/20261106_atomic_purchase_order_documents.sql`
3. `migrations/20261106_atomic_warehouse_handoffs.sql`
4. `migrations/20261106_reconcile_po_item_identity.sql`
5. `migrations/20261106_transfer_variance_dual_control.sql`
6. `migrations/20261106_payment_run_approval_evidence.sql`
7. `migrations/20261106_warehouse_transfer_putaway_handoff.sql`

The seventh migration was initially blocked because automatic approval review hit its usage limit. After the user requested continuation, its retry succeeded. There is no remaining application blocker for these seven migrations.

## Verification

- 64 application tests passed across 16 focused files, including failure propagation, offline release, document payload preservation, assignment failure, supplier matching, returns, picking/packing and single sale stock deduction.
- Eleven persisted SQL scripts passed against staging and rolled back all fixtures. They cover trusted invoice matching and independent approval, payment membership, complete AR totals, PO rollback, assignment retry, FEFO release retry, warehouse putaway handoff, transfer dual control and the four prior stock/sale fixes.
- `npx tsc --noEmit`, `git diff --check` and the commit-time 500-line check are recorded in delivery verification.
- Supabase security advisors were reviewed. Existing project-wide notices remain for definer views/functions, mutable search paths and disabled leaked-password protection. The additional private variance-approval table deliberately has RLS and no direct policies/grants: authenticated access is through narrowly checked commands. These changes do not claim to resolve the separate project-wide advisory backlog.

Invoice matching currently requires an unambiguous PO SKU line; repeated commercial invoice SKU lines requiring an override remain visible as unmatched. Commercial invoice quantities use PO pack units, while received quantities are converted from sellable units. Approval-time matching is conservative and does not silently approve ambiguous legacy evidence.

These are source/service/database regressions, not a complete physical device, bank payout, multi-device load or browser acceptance test. Existing business rows were not rewritten or automatically approved by the fixes.
