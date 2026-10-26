# Pick and Pack discrepancy control

The first physical count and an independently entered recount are recorded separately from the original manifest. A recount that matches the manifest can be corrected before submission without opening an exception.

If a difference remains, the assigned worker reports it with observed facts. The server captures the actor, job, country, site, manifest snapshot, both counts and timestamp. The job and downstream dispatch are held while any report remains unresolved. Direct updates cannot remove the hold or rewrite the original picked count or source lot.

A supervisor signs into their own account and opens the job's **Physical discrepancy / supervisor reconciliation** control. There is no browser PIN or employee-ID approval. The reporter, assigned worker and employees who handled linked Pick/Pack jobs cannot approve the discrepancy.

- Pick shortage: the supervisor may approve only the recounted quantity. Reserved online orders still require their full quantities. The picker must then resume normal source-bin/product verification; completion deducts the approved physical quantity once.
- Pick excess: return the excess to the appropriate controlled location and verify the requested quantity. Do not increase the order quantity.
- Pack shortage: locate the missing goods or use a separately authorized stock workflow to supply replacements. Confirm the original manifest quantity before release. This feature does not authorize short shipment.
- Pack excess: segregate the excess for a controlled return, verify SKU/lot and origin, and reconcile packing to the original manifest quantity. The reconciliation action does not itself post a stock return.

Supervisor notes capture the observed corrective action and reconciled quantity. Reports and decisions remain in job history. Any inventory movement must use its own authorized, audited workflow; reporting and resolving an exception never automatically adjusts stock or assigns blame.

## Verification

Applied to staging `utykzifrblpyxlvlknsm`: `migrations/20261027_pick_pack_discrepancies.sql` and `migrations/20261027_exact_pack_reconciliation.sql`. Production was not changed.

Rollback-only `tests/database/pick-pack-discrepancies.sql` checks 23/20 shortages, 23/25 excess, immutable picked quantities, held-job updates and dispatch rejection, independent supervisor decisions, rejection of short packing and tolerance bypasses, worker/anonymous scope, and exact approved Pick deduction. `tests/database/atomic-picking.sql` covers the existing stock, retry, partial/zero and online-reservation cases with the new shortage approvals.
