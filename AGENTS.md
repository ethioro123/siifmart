# SIIFMART AI Development Rules

Follow these rules for all work in this repository. `.agent/RULES.md` is the canonical index; its focused guides hold the details. If guidance conflicts, honor the user's explicit request and security requirements, then this file and the canonical rules. Historical feature notes do not override current policy.

## Before code changes

1. Run `git status --short` and report existing uncommitted work before editing. Preserve unrelated changes.
2. Check the target file's size. Split files over 500 lines before changing behavior; keep source and guidance files under 500 lines.
3. Inspect existing patterns, types, and schema. For Supabase errors, verify the live schema or authoritative types first.
4. Make the smallest complete change. Run `npx tsc --noEmit` after code changes and relevant regression checks required by the task.
5. Auto-commit verified changes: once verification passes, stage the task's modified/created files (excluding secrets or unrelated pre-existing dirty files unless requested) and create a local `git commit` with a clear Conventional Commits message. Do not `git push` unless asked.

## Architecture and data

- UI mutations go through hooks in `/hooks/`; persistence belongs in `/services/`. Use existing query/cache and session patterns.
- Scope all data and cache keys to the authorized site and country. Enforce access in Supabase RLS or trusted server code; client checks alone are not security.
- Use explicit projections, bounded pagination, on-demand history/detail reads, and targeted invalidation. Choose page sizes based on the workflow and measured cost.
- Validate inputs, use explicit database update allowlists, propagate errors, and log safely through `/utils/logger.ts`.
- Make a rule configurable only when authorized operations genuinely need to vary it. Country-specific settings must be isolated by `country_code`.

## Security, operations, and database changes

- Apply least privilege and deny-by-default access. Never expose service-role keys, credentials, PINs, or sensitive personal data in client code or logs.
- Keep audit trails for sensitive actions, require approvals/dual control where defined, and preserve blind counts and chain of custody.
- For any SQL: create a persistent `/migrations/YYYYMMDD_description.sql` file before writing or proposing SQL. Do not apply it without authorization. Include complete runnable SQL in the final response and state whether it has been applied.
- Keep all country data, money, settings, and event cascades within their authorized national boundary. The country switch is central and executive-only; branch staff see a seamless single-country app.

## Design, performance, and completion

- Use semantic theme tokens, shared components, accessible contrast/focus, responsive layouts, and zero decorative UI emoji. Adapt the design to the task; avoid unrelated redesigns.
- Measure performance before adding memoization or virtualization. Keep mobile POS responsive; give Fulfillment scanning flows extra care on constrained hardware.
- New routes use lazy loading and `ModuleErrorBoundary`. New services/utils and bug fixes follow the testing rules in `.agent/rules/05-delivery-and-verification.md`.
- Update `.agent/FEATURE_REGISTRY.md` for new features or significant bug fixes. Keep documentation below 500 lines.
- Finish in plain language: explain the user-visible change and verification, without code dumps or line-by-line diffs.

See `.agent/RULES.md`, `.agent/TROUBLESHOOTING.md`, and `docs/APPLE_DESIGN_GUIDE.md` for the full guidance.
