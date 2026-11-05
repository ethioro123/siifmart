# Deeper workflow repairs — 6 November 2026

All fourteen findings in the [deeper scan](deeper-workflow-audit-20261106.md) have fixes in application code and the linked staging database. No external payment, banking, messaging or identity integration was introduced. Production was not changed.

## Result for workers and managers

Routine receiving, putaway, picking, packing and verified transfer intake continue through the existing operational commands. Managers do not approve every incoming item. Unreviewed catalog identities, stock corrections, hiring exceptions and appeal decisions retain their required review paths.

Mobile payment entry is explicitly **manual**: the cashier enters the actual transaction reference and confirms checking the business payment record. The saved sale records the authenticated cashier and confirmation time. The app does not send STK prompts, generate payment references, claim that a customer entered a PIN, confirm a provider transaction or move money. English, Amharic and Afaan Oromoo copy is synchronized. Changing the amount, channel or reference clears the relevant confirmation.

The server requires sales authority and an open assigned counter for POS sales, regardless of client-supplied fulfillment type. New manually recorded mobile references cannot be reused for another sale in the same country/channel. The saved attestation is immutable. These are audited staff attestations, not independent provider verification.

## Findings mapped to repairs

| Finding | Repair |
| --- | --- |
| 1. Simulated STK success | Removed timers, generated references and provider-success UI. Replaced with labeled manual reference entry and explicit receipt confirmation. |
| 2. Direct manager stock writes | A trusted posting guard rejects direct stock changes. Approved HQ adjustments now apply the decision, stock movement and retry ledger in one transaction. |
| 3. Direct delivery claims | Sale fulfillment/release changes require the verified release, pick or shipment command. The client sale-update service no longer forwards arbitrary fields. |
| 4. Unreviewed receiving prices | New unreviewed placeholders remain zero-stock, unpriced and pending. Reviewed catalog creation saves approved commercial identity and one initial putaway handoff atomically; it does not invent physical stock. |
| 5. Floor-role financial sales | Server checks sales roles, site/country and the cashier's open counter. Choosing Delivery does not bypass counter attribution. |
| 6. Missing mobile evidence | The trusted sale path requires a local-country channel, reference and explicit manual confirmation; a private ledger enforces reference reuse protection. |
| 7. Other-site sale reads | Sales reads use explicit authorized site and country scope. Source warehouse release remains a narrow trusted command rather than granting the source manager unrestricted destination-sale reads. |
| 8. Expected PO quantities exposed | Floor roles cannot select underlying PO items. A bounded safe item command supplies identities, actual recorded receipt progress and completion state while masking expected counts/costs. Blind receiving remains usable with server-side intake validation. |
| 9. Hiring quota/salary bypass | Activation locks the site/role budget and checks current headcount, configured quota and compensation ceiling. Missing configuration or exceeded limits requires independently reviewed recruitment exception evidence. |
| 10. Recruitment activation regression | Candidate decisions use authenticated department IDs. One activation transaction creates the pending employee, links the candidate and activates the reviewed hire. Client Active inserts and local approval snapshots are removed from finalization. |
| 11. Cross-country discipline | The notice command derives the target's actual workplace/country and enforces the HR actor's scope. Direct notice mutations are revoked. |
| 12. Self-adjudication | Issuer, employee and appeal reviewer are distinct where required. The command locks pending state, requires decision evidence and records authenticated identities/events. |
| 13. False disciplinary success | Denied/unconfirmed saves reject. Screens announce success only after confirmed persistence and collect a decision reason through mutation hooks. |
| 14. Shared confidential cache | Removed personnel backup/fallback, purged the legacy key, cleared failed reads, isolated read queries by employee/role/site/country, ignored late responses from previous sessions, added bounded pagination and masked confidential HR notes in employee reads and appeal responses. |

Routine hiring inside configured limits requires independent HR and hiring-manager evidence. It does not need Finance or executive action. Budget exceptions require separate Finance and executive clearance. Salary changes invalidate the affected manager/executive evidence before activation. Candidate role and proposed salary are now actually included in enrollment. The missing staging employee-code allocator was restored with a private, country-scoped transactional counter.

Historical candidate signatures that only contain names cannot establish trusted identities: those candidates require fresh reviewed enrollment or a separately controlled reconciliation. Previously approved stock/catalog requests without a posting ledger are not guessed to be unapplied; they require reconciliation. New command retries return their saved result.

Trusted commands restore their prior temporary write context before returning, including retry exits and nested shipment triggers. Automatic approval review rejected a broad runtime regex rewrite for this cleanup. It was replaced with explicit saved function definitions; both replacement migrations were accepted and applied. The rejected rewrite was never executed and is not retained as a pending migration.

## Saved migrations and deployment

Every file below was saved before execution. **All nineteen were successfully applied to SIIFMART Staging `utykzifrblpyxlvlknsm`. None was applied to production by this repair.**

| Saved migration | Purpose |
| --- | --- |
| `migrations/20261106_trusted_stock_sales_boundaries_1.sql` | Stock posting guard and trusted physical writers |
| `migrations/20261106_trusted_stock_sales_boundaries_2.sql` | Fulfillment guard, branch sale scope and manual payment ledger/entry checks |
| `migrations/20261106_trusted_stock_sales_boundaries_3.sql` | Manual confirmation input in the atomic sale command |
| `migrations/20261106_trusted_disciplinary_commands.sql` | Scoped notices, appeals, independent decisions and bounded private reads |
| `migrations/20261106_trusted_hiring_activation.sql` | Authenticated candidate decisions, budget checks and atomic activation |
| `migrations/20261106_hiring_activation_compatibility.sql` | Connect independently reviewed candidates to the employee authority guard |
| `migrations/20261106_approved_stock_and_blind_po.sql` | Atomic reviewed stock requests, masked PO item reads and immutable payment attestation |
| `migrations/20261106_approved_stock_compatibility.sql` | Permit only the recorded approved adjustment through the existing product guard |
| `migrations/20261106_blind_receipt_completion.sql` | Safe saved receipt completion evidence |
| `migrations/20261106_reviewed_catalog_activation.sql` | Require commercial review before catalog activation |
| `migrations/20261106_employee_code_reservation_compatibility.sql` | Restore the missing country-scoped employee code allocator |
| `migrations/20261106_disciplinary_response_privacy.sql` | Mask confidential notes in self-service appeal responses |
| `migrations/20261106_reviewed_catalog_creation.sql` | Atomic reviewed catalog identity and physical putaway handoff |
| `migrations/20261106_reviewed_catalog_required_fields.sql` | Preserve required catalog category in the approved insert |
| `migrations/20261106_hiring_guard_order.sql` | Check appointment authority before budget validation |
| `migrations/20261106_hiring_salary_review_evidence.sql` | Invalidate stale manager/executive evidence when proposed salary changes |
| `migrations/20261106_stock_request_replay_evidence.sql` | Deny replay of legacy approvals without posting evidence |
| `migrations/20261106_command_context_restore_1.sql` | Explicit restoration in physical stock/release commands |
| `migrations/20261106_command_context_restore_2.sql` | Explicit restoration in shipment, adjustment, hiring and sale commands |

## Verification

- **115 application tests passed across 23 files**, including the manual-payment form, translated copy, denied personnel reads/writes, trusted hiring, bounded PO hydration, stock command confirmation, receiving, picking, packing, payroll and order release.
- `npx tsc --noEmit` and `git diff --check` passed. All changed source/migration/document files remain below 500 lines; the commit hook checks the repository limit.
- Five new staging rollback scripts passed: `deeper_fixed_operational_boundaries.sql`, `deeper_fixed_manual_payments.sql`, `deeper_fixed_hiring.sql`, `deeper_fixed_disciplinary.sql`, `deeper_fixed_stock_and_receiving.sql`. They test both allowed actions and denials, exact retry behavior, routine and exception hiring, and restoration of temporary authority.
- Eight earlier rollback scripts passed: `employee_audit_controls_that_hold.sql`, `employee_fixed_authority_privacy.sql`, `employee_fixed_payroll.sql`, `employee_fixed_hiring_salary.sql`, `deep_integrity_order_release.sql`, `deep_integrity_warehouse_intake.sql`, `product_movement_sale_loyalty.sql`, `fulfillment_receipt_returns_integrity.sql`.
- Three further current-path rollback scripts passed: `product_movement_atomic_intake.sql`, `fefo_picking.sql` and `tests/database/same-day-putaway-lots.sql`. The latter fixture now identifies the separate receiving and putaway actors during setup. One read-only category/aisle storage validator also passed. Total: **16 passing rollback scripts and one read-only SQL validator**.
- A legacy `tests/database/atomic-picking.sql` run stopped at its intentionally disabled unverified `record_pick_line` call. It is not counted as passing; the current `fefo_picking.sql` verification/scan/completion path passed instead.
- The optional full `buying_to_selling_e2e_simulation.sql` recheck was blocked by an expired SQL-tool confirmation. Its previous results are not represented as a new full-system pass.
- Supabase security advisors were reviewed. Existing advisory categories remain; private implementation tables intentionally have RLS with no direct client policies/grants. This repair does not claim to clear the project's separate advisory backlog. [Advisor reference](https://supabase.com/docs/guides/database/database-advisors).

All test business mutations were rolled back. No real provider payment, employee account provisioning or password reset occurred. Verification covers source, hook/component/service behavior and the staging database; it does not certify production, physical scanners, actual bank/mobile-money settlement, all browser/device layouts or concurrent multi-device load.
