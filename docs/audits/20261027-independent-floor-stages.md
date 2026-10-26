# Independent warehouse stages

Implemented on staging `utykzifrblpyxlvlknsm`. Production was not changed.

Each employee may handle one floor stage per linked order within the same country. Stages: RECEIVE, PUTAWAY, PICK, PACK, COUNT, REPLENISH, WASTE and RETURNS. Another order or continued work in the same stage remains eligible. Role titles provide no exception. Transport jobs retain their existing delivery restrictions.

Manual and automatic assignment fetch authoritative exclusions. The team panel disables prior handlers. Database triggers reject conflicting assignment records, assigned/completed identities and execution updates. Unassigned pending downstream creation remains a permitted handoff. Completed packing must identify the authenticated assigned independent worker.

Order identity is immutable. Private handler history retains original workers across reassignment/cancellation, including assignments whose separate history save was previously missed. Existing completed operational data was not rewritten; legacy conflicting assignments require a supervisor to select an independent worker.

## Applied migrations

All four migrations were applied successfully to staging:

- [Independent packing](../../migrations/20261027_independent_pack_verification.sql)
- [All floor stages](../../migrations/20261027_independent_floor_stages.sql)
- [Identity and history guards](../../migrations/20261027_floor_stage_identity_guards.sql)
- [Retained handler records](../../migrations/20261027_floor_stage_handler_history.sql)

No migration application blocker remains.

## Verification

- TypeScript: `npx tsc --noEmit` passed.
- Focused UI/service regressions: 7 passed.
- Staging rollback regression `tests/database/independent-floor-stages.sql` passed: conflicting assignment and execution blocked for each floor stage; identity bypass rejected; same-stage and other-order work allowed; supervisor cancellation/reassignment preserves the original handler; independent packer completes.
- Database tests use authenticated actor claims with privileged row access to test the triggers rather than accidentally passing because RLS updated zero rows. They do not constitute browser end-to-end tests.
- Full Vitest suite: 1,871 passed, 98 failed across 28 files, consistent with known unrelated baseline failures.
- File-size validation and whitespace checks passed.
- Security advisors retain existing unrelated findings; the new handler table is private, RLS enabled and denied direct client access. Public eligibility wrappers are invoker functions and deny anonymous execution.

The order link is the stored `order_ref`, scoped by country. Tasks with unrelated order references are separate orders; jobs without an order reference have no order-level separation link. This change does not introduce a new order ancestry mapping or alter blind-count visibility.
