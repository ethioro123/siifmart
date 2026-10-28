# SIIFMART AI Development Rules

This is the entry point for SIIFMART-specific work. Keep these rules consistent with the focused guides below. When two documents disagree, use this precedence: explicit user request, workspace `AGENTS.md`, this file, focused guides, then historical notes and feature records.

## Rule-change permission

Follow the protected **Permission Required Before Editing Rules** section in root `AGENTS.md`. Before any rule or normative-guideline change that the user has not explicitly authorized, describe the proposed change, ask the user for permission, and wait. General application work, automatic maintenance and filesystem access do not authorize rule edits. This applies to design specifications and to this permission rule itself. Explicit authorization for a particular change must not be extended to other rules.

## Required workflow

1. At session start, inspect `git status --short`. Report existing changes before editing; preserve them unless the user asks otherwise.
2. Before editing an over-limit file, split it into focused modules while preserving imports and behavior. No source file may exceed 500 lines; keep guidance files focused and below 500 lines too.
3. Inspect the relevant code, types, schema, tests, and existing patterns before deciding on a fix. For Supabase errors, confirm the live schema or authoritative types before changing queries.
4. Make the smallest complete change. Avoid speculative refactors and unmeasured performance work.
5. For code changes, run the required type check and the narrowest relevant regression checks. Report checks that could not be run and why.
6. Automatically stage and commit all changes (`git add -A` excluding `.env*` secrets, then `git commit`) before finishing your turn without waiting for user input, even if follow-up fixes are planned for later. A `.agents/hooks.json` `Stop` hook also enforces this automatically. Do not push to remote unless requested.
7. Finish with a plain-language summary of the user-visible result, verification, and commit details. Do not dump code or diffs.

## Invariants

- **Security first:** enforce authentication, role authorization, site and country scope on trusted server/database boundaries. Client checks improve usability; they do not grant access. See [security and integrity](rules/03-security-and-integrity.md).
- **Country sovereignty:** keep country data, settings, currency, tax, SKU, and event propagation isolated. Only authorized executives use the single central country switch; ordinary staff should not see tenancy controls. See [country and operations](rules/02-country-and-operations.md).
- **Database changes and SQL execution:** for every requested database change, save the complete SQL in a persistent `/migrations/YYYYMMDD_description.sql` before execution, inspect the linked Supabase project's live schema and migration history, and automatically apply the migration to that linked project as part of the request. Do not ask for separate authorization to apply SQL. If no project is linked or the execution tool blocks application, keep the migration file and report the specific blocker. In the final response, identify the saved migration file(s), state whether each was applied and to which project/environment, and report any blocker. Do not paste SQL into chat unless the user asks to see it.
- **Data access:** select only needed fields, scope every query, paginate lists, and fetch history on demand. Treat page size as a default that may be tuned to the workflow and query cost, not a universal cap.
- **Architecture:** UI writes go through mutation hooks; services own persistence; reads use the right existing cache/query pattern. Validate input, use explicit writable-field allowlists, propagate errors, and invalidate only affected data.
- **Performance:** optimize from measured bottlenecks. Prefer bounded queries, appropriate indexes, lazy loading, and simple rendering. Memoize or virtualize only where profiling or realistic data sizes justify it.
- **Design:** use the shared design tokens and accessibility standards. Adapt density, motion, and glass to the task and device; do not sacrifice clarity, safety, or accessibility for a visual effect. See the canonical [SIIFMART Design Standard, 29 October 2026 Revision B](../docs/APPLE_DESIGN_GUIDE.md) and its focused chapters.
- **Notification accuracy:** report observed facts only. Do not infer causes or fixes from message keywords, present cached estimates as current balances, or announce success before the relevant save is confirmed. Distinguish queued work from server completion and omit unverified notices. Scope history to the current user, site, country, and session.
- **Operations:** retain approvals, dual control, blind counts, chain of custody, non-alcoholic catalog policy, and auditable supervisory actions described in the focused guides.
- **POS and WMS translations:** any code change to POS or WMS that introduces, alters, or displays user-visible information (labels, buttons, modal dialogs, status chips, table headers, error alerts) must be accompanied by synchronized translations in the corresponding dictionary (`utils/translations/pos.ts`, `utils/translations/posCommand.ts`, `utils/translations/warehouse/*`) across all supported languages (`en`, `am`, `or`). Never introduce untranslated or hardcoded UI strings into POS or WMS.
- **Merchandising whole numbers:** all merchandising prices, pricing rules, markdown glide paths, promotion adjustments, and forecasting must strictly be whole numbers (integers). Never produce or store fractional values; always round to the nearest whole number (`Math.round()`).
- **No secrets or unsafe logging:** never expose privileged keys, credentials, PINs, or sensitive personal data in client code or logs. Use the project logger and sanitize log context.
- **No unnecessary configuration:** make business policies configurable only when the policy genuinely varies by country/site or needs authorized operational control. Define safe defaults, bounds, ownership, and auditability.

## Focused guides

- [Architecture and data flow](rules/01-architecture-and-data.md)
- [Country and operations rules](rules/02-country-and-operations.md)
- [Security and data integrity](rules/03-security-and-integrity.md)
- [Engineering, UI, and performance](rules/04-engineering-and-performance.md)
- [Delivery and verification](rules/05-delivery-and-verification.md)
- [Troubleshooting guide](TROUBLESHOOTING.md)
- [Feature registry](FEATURE_REGISTRY.md) — historical implementation notes; not policy authority.

## Resolve conflicts and exceptions

Prefer a specific security or legal requirement over a general convenience or style rule. If a policy is unclear or conflicts with the user’s requested behavior, inspect the implementation and available evidence, choose the safest reversible interpretation, and ask only when a material decision cannot be inferred. Document approved exceptions near the relevant code or configuration.
