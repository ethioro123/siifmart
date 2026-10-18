# SIIFMART AI Development Rules

This is the entry point for SIIFMART-specific work. Keep these rules consistent with the focused guides below. When two documents disagree, use this precedence: explicit user request, workspace `AGENTS.md`, this file, focused guides, then historical notes and feature records.

## Required workflow

1. At session start, inspect `git status --short`. Report existing changes before editing; preserve them unless the user asks otherwise.
2. Before editing an over-limit file, split it into focused modules while preserving imports and behavior. No source file may exceed 500 lines; keep guidance files focused and below 500 lines too.
3. Inspect the relevant code, types, schema, tests, and existing patterns before deciding on a fix. For Supabase errors, confirm the live schema or authoritative types before changing queries.
4. Make the smallest complete change. Avoid speculative refactors and unmeasured performance work.
5. For code changes, run the required type check and the narrowest relevant regression checks. Report checks that could not be run and why.
6. Automatically stage and commit all verified changes for the current task using a descriptive Conventional Commits message (preserving unrelated pre-existing changes and never staging secrets). Do not push to remote unless requested.
7. Finish with a plain-language summary of the user-visible result, verification, and commit details. Do not dump code or diffs.

## Invariants

- **Security first:** enforce authentication, role authorization, site and country scope on trusted server/database boundaries. Client checks improve usability; they do not grant access. See [security and integrity](rules/03-security-and-integrity.md).
- **Country sovereignty:** keep country data, settings, currency, tax, SKU, and event propagation isolated. Only authorized executives use the single central country switch; ordinary staff should not see tenancy controls. See [country and operations](rules/02-country-and-operations.md).
- **Safe database changes:** create a persistent `/migrations/YYYYMMDD_description.sql` before writing or proposing SQL. Do not apply migrations without authorization. When SQL is created or changed, include the complete runnable SQL in the final response and say whether it has been applied.
- **Data access:** select only needed fields, scope every query, paginate lists, and fetch history on demand. Treat page size as a default that may be tuned to the workflow and query cost, not a universal cap.
- **Architecture:** UI writes go through mutation hooks; services own persistence; reads use the right existing cache/query pattern. Validate input, use explicit writable-field allowlists, propagate errors, and invalidate only affected data.
- **Performance:** optimize from measured bottlenecks. Prefer bounded queries, appropriate indexes, lazy loading, and simple rendering. Memoize or virtualize only where profiling or realistic data sizes justify it.
- **Design:** use the shared design tokens and accessibility standards. Adapt density, motion, and glass to the task and device; do not sacrifice clarity, safety, or accessibility for a visual effect. See [Apple-inspired UI guide](../docs/APPLE_DESIGN_GUIDE.md).
- **Operations:** retain approvals, dual control, blind counts, chain of custody, non-alcoholic catalog policy, and auditable supervisory actions described in the focused guides.
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
