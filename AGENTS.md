# SIIFMART AI Development Rules

Follow these rules for all work in this repository. `.agent/RULES.md` is the canonical index; its focused guides hold the details. If guidance conflicts, honor the user's explicit request and security requirements, then this file and the canonical rules. Historical feature notes do not override current policy.

## Before code changes

1. Run `git status --short` and report existing uncommitted work before editing. Preserve unrelated changes.
2. Check the target file's size. Split files over 500 lines before changing behavior; keep source and guidance files under 500 lines.
3. Inspect existing patterns, types, and schema. For Supabase errors, verify the live schema or authoritative types first.
4. Make the smallest complete change. Run `npx tsc --noEmit` after code changes and relevant regression checks required by the task.
5. **Mandatory auto-commit before finishing**: Whenever you write or modify any code, migration, or configuration, you MUST automatically stage and commit all changes (`git add -A` excluding `.env*` secrets, then `git commit`) before ending your turn—without waiting for the user to ask or touch anything, and even if non-blocking issues remain to be fixed later. Do not `git push` unless asked.

## Architecture and data

- UI mutations go through hooks in `/hooks/`; persistence belongs in `/services/`. Use existing query/cache and session patterns.
- Scope all data and cache keys to the authorized site and country. Enforce access in Supabase RLS or trusted server code; client checks alone are not security.
- Use explicit projections, bounded pagination, on-demand history/detail reads, and targeted invalidation. Choose page sizes based on the workflow and measured cost.
- Validate inputs, use explicit database update allowlists, propagate errors, and log safely through `/utils/logger.ts`.
- Make a rule configurable only when authorized operations genuinely need to vary it. Country-specific settings must be isolated by `country_code`.

## Security, operations, and database changes

- Apply least privilege and deny-by-default access. Never expose service-role keys, credentials, PINs, or sensitive personal data in client code or logs.
- Keep audit trails for sensitive actions, require approvals/dual control where defined, and preserve blind counts and chain of custody.
- For any requested database change: first save the complete SQL in a persistent `/migrations/YYYYMMDD_description.sql` file, inspect the linked Supabase project's live schema and migration history, then automatically apply the migration to that linked project as part of the request. Do not ask for separate SQL-application authorization. If the project is not linked or the execution tool blocks application, keep the migration file and report the specific blocker. In the final response, identify the saved migration file(s), state whether each was applied and to which project/environment, and report any blocker. Do not paste SQL into chat unless the user asks to see it.
- Keep all country data, money, settings, and event cascades within their authorized national boundary. The country switch is central and executive-only; branch staff see a seamless single-country app.

## Design, performance, and completion

- Use semantic theme tokens, shared components, accessible contrast/focus, responsive layouts, and zero decorative UI emoji. Adapt the design to the task; avoid unrelated redesigns.
- Measure performance before adding memoization or virtualization. Keep mobile POS responsive; give Fulfillment scanning flows extra care on constrained hardware.
- New routes use lazy loading and `ModuleErrorBoundary`. New services/utils and bug fixes follow the testing rules in `.agent/rules/05-delivery-and-verification.md`.
- Update `.agent/FEATURE_REGISTRY.md` for new features or significant bug fixes. Keep documentation below 500 lines.
- Finish in plain language: explain the user-visible change and verification, without code dumps or line-by-line diffs.
- Alerts and notifications must report observed facts. Do not infer causes or recovery steps from message keywords, present cached estimates as current balances, or claim success before the relevant save is confirmed. Distinguish queued work from server completion; omit unverified notices. Keep notification history within the current user, site, country, and session.

See `.agent/RULES.md`, `.agent/TROUBLESHOOTING.md`, and `docs/APPLE_DESIGN_GUIDE.md` for the full guidance.
