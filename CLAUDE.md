# SIIFMART Assistant Guidelines

Follow repository `AGENTS.md` for every task and use `.agent/RULES.md` as the canonical index. Focused guides are linked there. Preserve existing user changes and consult the relevant feature/troubleshooting notes before changing behavior.

## Essential safeguards

- Before code changes, check `git status --short`, warn about existing changes, and preserve unrelated work.
- Split any target over 500 lines before changing it. Verify code changes with `npx tsc --noEmit` and applicable regression checks.
- Enforce role, site, and country access in Supabase RLS or trusted server code. A UI guard is never the security boundary.
- Keep country-specific data and settings isolated. Only authorized executives use the central country switch.
- Route writes through hooks and services; validate input, use explicit database field allowlists, propagate errors, and log through the project logger without sensitive data.
- Before writing or proposing SQL, create a version-controlled migration under `/migrations/`. Do not apply it without authorization. Include complete runnable SQL in the final response and state whether it was applied.
- Use shared design tokens and accessible patterns. Measure before optimizing; avoid speculative memoization, fixed virtualization thresholds, and unrelated redesigns.
- Never expose secrets, trust client-supplied prices/roles, or weaken approvals, blind counts, auditability, or chain of custody.

Keep completion summaries clear and business-focused. Do not dump code or diffs.
