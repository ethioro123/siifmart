# Remaining deletion-security remediation — 3 November 2026

This is a factual implementation and verification record for the seven audited findings. It is not a certification that every application endpoint or storage use is secure.

## Implemented changes

1. Avatar uploads require an active employee UUID and the employee's own `profile-photos/<employee UUID>/...` path, or an authorized HR/leadership actor within the employee's country and HR scope. Restrictive policies prevent another permissive policy from bypassing these checks. Avatar overwrites, moves and deletion are denied for ordinary authenticated clients. Replacement uploads use new names and preserve old files. The avatar bucket accepts only the configured image MIME types up to 5 MiB. Other Storage writes also require an active employee.
2. Role, site and region helpers resolve the currently active employee by signed-in UUID. Stale role and email claims no longer supply authorization. The live identity audit found no active employee/auth-user email matches with different UUIDs in either environment. Placement at an HQ site alone no longer makes an employee an executive. Additional legacy tables have active-employee read/write guards.
3. Product cleanup no longer nulls sales/stock/PO references or deletes approval requests. All application deletion paths use a verified returned product ID, and server guards reject stocked products and products with movement, sales, PO, approval, price, barcode or warehouse evidence. Remaining foreign keys also enforce references. Stock and sales attribution cannot be detached. A genuinely unused zero-stock product can still be removed by an authorized actor; a trusted audit event is committed with the deletion.
4. Both environments have the same warehouse-assignment history guard. Linked or started assignment history cannot be deleted or reassigned; start evidence cannot be cleared, and completed assignment evidence cannot be rewritten. Warehouse jobs remain protected from hard deletion.
5. Receiving quantities cannot be deleted, zeroed, decreased or moved to another product/order to evade cancellation checks. Such evidence requires a reviewed reversal rather than destructive editing. Existing unreceived draft editing remains available under its original authorization rules.
6. Personnel document deletion is rejected by the client and database. The client no longer claims success or writes a deletion-success log. Document employee, country, file URL, type, uploader and creation identity cannot be replaced; new evidence needs a new row. The database binds the uploader and validates the target country. General audit records and non-price approval history are also protected; existing controlled price-history retention remains separate.
7. Ordinary `anon` and `authenticated` identities have no TRUNCATE privilege on public tables. Default privileges for newly created public tables are hardened too. This removes excessive database permissions; it is not a claim that browsers previously had a direct whole-table-clearing REST endpoint.

Customers and suppliers were not otherwise modified. The global removal of unnecessary TRUNCATE grants covers public tables generally.

## Saved migrations and deployment

Staging: `utykzifrblpyxlvlknsm`. Production: `zdgzpxvorwinugjufkvb`.

| File under `migrations/` | Staging | Production |
|---|---|---|
| `20261103_security_active_identity_boundaries.sql` | Applied | Applied |
| `20261103_security_avatar_ownership_retention.sql` | Applied | Applied |
| `20261103_security_preserve_remaining_evidence.sql` | Applied during validation | Superseded; not applied |
| `20261103_security_final_evidence_guards.sql` | Applied | Applied |
| `20261103_security_unused_product_cleanup_audit.sql` | Applied | Applied |

The final evidence migration uses the verified text key for `inventory_requests.product_id`; the other checked product-reference keys are UUIDs. It supersedes the staging validation definition. Earlier partial remediation was already present in the shared source/live database at inspection; this report records the registered follow-up migrations above. Final relevant function fingerprints match between environments, and both have the same restrictive avatar rules. No deployment blocker remains.

## Verification

- 12 grouped live staging checks in `tests/sql/remaining_security_evidence.sql` passed. They cover stale claims, self/scoped HR uploads, cross-country and coworker denial, inactive identities, Storage row policies, privilege removal, product evidence, receiving evidence, personnel documents, warehouse assignment history and audited safe cleanup. Every fixture rolled back.
- The Storage SQL check inserted only temporary metadata, without uploading file bytes. Supabase's native metadata-delete protection rejected direct SQL deletion; the check accepts that denial. The restrictive Storage delete policy was separately verified. A real authenticated Storage HTTP upload/delete was not exercised.
- The existing 27 lifecycle database checks passed again after these changes, with all fixtures rolled back.
- 41 Vitest regressions passed across evidence retention, lifecycle service/workspace, offboarding, transfer translations, regional PO approval and paused-draft storage. The new service tests verify that replacement failure preserves old photos, unsupported image types and invalid paths are rejected, personnel deletion cannot report success, product evidence is never detached first, and deletion requires a confirmed row.
- `npx tsc --noEmit`, `npm run lint:size` and `git diff --check` passed.
- Production verification used schema, function, policy and privilege inspection. No live business record or stored photo was destroyed as a deployment test.
- Supabase security advisors were reviewed before and after. Existing unrelated findings are not remediated by this scoped rollout. Private helper functions have explicit execute grants; the original controlled lifecycle RPC advisories remain intentional and documented in the lifecycle verification report.

## Practical boundaries

Existing public avatar and system-image URLs remain public. These buckets are not private personnel-document storage. This work restricts writes and preserves image evidence; it does not retroactively make public images confidential.

No new automatic evidence purge was introduced. This rollout does not certify external document URLs, every legacy RPC, backup recovery, penetration testing or legal retention schedules. Those are separate from the seven addressed findings.
