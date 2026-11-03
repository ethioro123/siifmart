# 3 November 2026 feature history

- 2026-11-03: Area operations now uses explicit store assignments, scoped server metrics, a dedicated store overview, narrow read and transfer-request permissions, and database guards against region-wide or sensitive writes. Four migrations applied to staging and production.
- 2026-11-03: Regional governance transitions now check signed-in roles in database triggers; expense approvals use configured limits and a guarded decision RPC; warehouse leadership uses verified employee assignments; regional totals use exact country-local server aggregates. Five migrations applied to staging and production.
- 2026-11-03: Permanent employee, facility, PO and transfer deletion is blocked by database grants and triggers in staging and production. Employee deletion preserves photos; termination proposals no longer auto-approve for the CEO. Lifecycle closure and retention workflows remain pending.

- 2026-11-03: PO creation now offers detailed kitchen/dining categories and everyday household essentials from the shared catalog, with matching specification and count-based handling; pet and animal supplies remain excluded.

- Lifecycle rollout: independent offboarding, facility closure, unexecuted-record cancellation, investigation holds, preserved history, active-session guards and audited own-draft discard are implemented. Production and staging share the final restricted definitions. Deployment and verification: `docs/lifecycle-controls-verification-20261103.md`. No automatic history purge is enabled.
