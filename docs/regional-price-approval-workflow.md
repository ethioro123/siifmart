# Regional and country price approvals

Implemented on 2026-10-28. This changes price-only proposals, including selling price, sale price/on-sale state and recorded cost. Product-detail and shelf-layout approvals retain their existing three-department workflow.

## Authority

- A Regional Merchandising Manager can approve another employee's price proposal in their own region and country at any percentage change, provided the resulting effective selling margin is at least 15%.
- A Country Commercial Director or Country Managing Director can give final price approval across any region in their assigned country.
- A proposal created by a Regional Merchandising Manager goes to country leadership. A Country Commercial Director's own request can be approved by the Country Managing Director or another independently authorized country commercial approver. No requester may approve their own request.
- Below 15% margin requires an independent Country Finance Director clearance, followed by country commercial final approval. A regional manager cannot finalize below-floor pricing even after clearance. Regional Finance and Group executives do not replace country Finance in this price-specific flow.
- Exactly 15% qualifies for regional approval. There is no percentage-change cap, as explicitly selected by the user. Positive recorded cost, positive effective selling price and whole-number price/cost inputs are required.

## Database enforcement

The existing `approve_product_edit` API dispatches price-only requests to a private authenticated decision implementation. It applies the price atomically and records one final approver, without inserting Operations/Supply Chain/Merchandising votes. It continues to dispatch catalog and complete layout revisions to the preserved three-way implementation.

Country and region scope derives from active employee and site records. No client-supplied approver identity or role is trusted. A complete price/cost/on-sale baseline is captured at submission; changed pricing invalidates the proposal. Finance clearance is bound to the current pricing baseline, the active country Finance employee and the exact request. The Finance signer and final approver must be different people. Older finance fields alone do not grant clearance under the new workflow.

Private clearance and decision evidence tables have RLS enabled and no authenticated/anonymous table grants. Decision settings alone cannot authorize a product write. The existing immutable-request, controlled approval identity and product-field restrictions remain in force. Public decision/read wrappers use security invoker and deny anonymous execution; the scoped private implementation performs the privileged write. The migration does not introduce direct client product-update permissions.

Unchanged form fields are stripped before specialist preparation checks, so description-only changes containing unchanged form prices remain catalog proposals. Actual mixed price/detail edits must be submitted separately; legacy mixed proposals display that requirement instead of using a one-approval shortcut. Existing price proposals keep their audit history, but old regional votes do not authorize the new price decision.

## UI and inbox

The bounded Proposals read obtains server-computed decision routes for visible price requests. Cards and review modals show the correct commercial/Finance stage, final approval eligibility and blocking reason. Country Finance sees its clearance action; authorized country commercial managers see final approval. Price progress no longer says 0/3 regional approvals. A successful final action reports that the price was approved and applied.

Global inbox counts use the same server decision route. Price tasks are removed from Operations/Supply Chain votes, routed to regional merchandising or country commercial as appropriate, and routed to Country Finance for clearance. Completed approvals and clearances leave the respective actionable queues. Existing role/module access and scope checks still apply to the review destination.

## Migration and validation

Saved and applied to staging (`utykzifrblpyxlvlknsm`) and production (`zdgzpxvorwinugjufkvb`):

- `migrations/20261028_regional_price_approval_workflow.sql`
- `migrations/20261028_price_clearance_conflict_fix.sql`
- `migrations/20261028_price_patch_normalization.sql`
- `migrations/20261028_price_preparation_order.sql`
- `migrations/20261028_price_patch_allowlist_integrity.sql`

Each has a matching Supabase CLI migration file. Follow-ups preserve the tested final definition and remote migration history; the main migration also contains the final implementation.

`tests/sql/regional_price_approval_workflow.sql` executes real authenticated staging decisions and rolls back all fixtures, prices, clearances and logs. It verifies uncapped compliant changes, exactly/below 15%, region/country isolation, director and manager self-approval denial, country escalation, distinct Finance/commercial actors, requester escalation, duplicate decisions, forged markers/direct-write rejection, mixed-edit rejection, form-field normalization, allowlist integrity, rejection without price changes and inbox routing/removal. The existing complete-layout approval regression also passes unchanged.

49 focused UI/service/route/cache tests, TypeScript checking, production build and file-size checks passed. Post-DDL security checks confirm anonymous execution is denied in both environments. Advisors identify the two intentionally inaccessible private evidence tables as RLS-without-policy informational entries; these tables are written only by scoped private routines. Existing unrelated project advisor findings remain outside this change.

Only schema and workflow definitions were applied remotely. No production price was changed for testing. Frontend release follows the normal app deployment process.
