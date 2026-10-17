# SIIFMART Security and Data Integrity Rules

## Cross-Module Events and Data Integrity

- Model real business dependencies explicitly. A mutation should notify only the systems that need to react; do not trigger every downstream module for every change.
- Define event payloads and owners, use stable IDs/correlation IDs, and make handlers idempotent so retries cannot double-apply inventory, money, rewards, or approvals.
- Use transactional writes or an outbox/retry design when the source change and required follow-up must not diverge. Make failure visible and recoverable; avoid silent partial success.
- Prevent cycles and retry storms with bounded retries, deduplication, backoff, and observable dead-letter handling. Do not rely on arbitrary debounce timers for correctness.
- Keep events and their projections inside the authorized country/site scope. Any cross-border movement must use an explicit approved import/export workflow.
- Use event-driven updates for fresh screens where practical; keep query invalidation specific and avoid synchronous work that blocks checkout, receiving, or scanning.

---

## Security and Abuse-Resistance Rules

> **Threat model**: Assume public networks, compromised or shared devices, malicious insiders, direct API calls that bypass the UI, and external probing of exposed Supabase endpoints.

### 1. Server-Enforced Authorization and RLS
- Enable RLS on every table in an exposed schema and review database grants as well as policies. A policy cannot protect data from a role that should not have table privileges in the first place. Use least-privilege access per operation; deny access by default.
- Enforce country and site boundaries in database policies or trusted server code. Client filters and route guards are usability measures, never security boundaries.
- Derive the actor from the verified auth identity and authorization scope from trusted records or server-managed claims. Never authorize from user-editable `user_metadata`, client-supplied role/site/country values, or stale assumptions about JWT claims. Account for token refresh when roles change.
- Review each operation independently. Updates need visibility to the target row and must verify the resulting row still belongs to the authorized user/site/country; inserts and upserts need checks for the new row too.
- Review views and database functions separately: views can bypass underlying RLS unless configured to respect the invoking user or kept inaccessible in a private schema. Prefer invoker privileges. If a privileged definer function is necessary, constrain its schema/search path, validate the caller and arguments, and explicitly restrict its execute grants; never use it as a shortcut around a failed policy.
- Protect append-only audit and transaction records from edits and deletion by ordinary users. Privileged correction paths must themselves be restricted and audited.
- Test both allowed and denied cases for each sensitive table/action, including cross-site and cross-country attempts.

### 2. Zero Hardcoded Secrets & Key Separation
- **Public client key only**: Browser bundles may include a Supabase publishable key or legacy `anon` key. These identify the project and are not secrets; access still depends on grants, RLS, and authorization.
- **Service-role key protection**: The `service_role`/secret key bypasses RLS. Never place it in client `.env`, browser state, or any file bundled by Vite. Use it only in a trusted server environment or tightly controlled Edge Function.
- **No plaintext credentials**: Hardcoded test passwords, quick-login credentials, PINs, or API secret tokens must never exist in frontend code or git commits.
- **Credential hygiene**: Keep local secrets out of tracked files; use approved secret storage and rotate any credential suspected of exposure. Public client keys are not substitutes for authorization.
- **Dependency hygiene**: Pin dependencies, commit the lockfile, and review package updates for security and compatibility before adopting them.

### 3. Financial & Pricing Anti-Tampering
- **No Client Price Authority**: Never trust unit prices, cart totals, or discount amounts sent by the browser. When a sale is processed:
  - Unit prices must match server catalog prices.
  - Cart totals, tax breakdowns, and discounts must be verified before persisting to `sales`.
  - A cashier modifying HTML inputs or intercepting network requests to pay 1 Birr for a 1,000 Birr item must be rejected immediately and logged as a security alert.
- Enforce critical calculations and state transitions at a trusted boundary, with database constraints or atomic transactions where concurrent updates could otherwise oversell, double-pay, or lose an approval.
- Make retryable financial and inventory commands idempotent. Reject duplicate request IDs instead of applying a side effect twice.

### 4. Input Sanitization & Injection Defense
- **Zod Schema Validation**: Validate all mutation payloads with Zod schemas (`/schemas/`) before submitting to the database.
- **No SQL Injection**: Always use Supabase parameterized query builders (`.eq()`, `.in()`). Never construct raw SQL strings with user input.
- **Mass-Assignment Defense**: Every service `update()` method must explicitly whitelist writable DB columns. Never pass `{ ...updates }` directly to Supabase.
- **Cross-Site Scripting (XSS)**: Never use `dangerouslySetInnerHTML` with raw user inputs (notes, customer names, receipt previews). Sanitize any dynamically rendered HTML.
- Validate payload shape, length, ranges, and permitted enum values at the service boundary; use database constraints for durable invariants. Escape output for its destination context.
- Use explicit writable-field allowlists and reject unexpected fields. Avoid leaking whether protected records exist through error messages.

### 5. Session Hardening & Staff PIN Security
- **Hashed Fast-Switch PINs**: 4-digit/6-digit cashier fast-switch PINs must be cryptographically hashed (e.g. bcrypt/argon2). Never store PINs in plaintext in `employees` table.
- **Brute-force resistance**: Apply server-side rate limits and increasing delays to repeated failures. Configure thresholds and recovery to balance account takeover risk with denial-of-service risk; do not rely on client-side lockout.
- **Short-Lived Sessions**: Sensitive managerial actions expire after inactivity; require re-authentication.
- Apply server-side rate limits and lockout controls to credential and PIN attempts. Do not rely on client timers or local storage to enforce them.
- Revoke or expire privileged sessions promptly after role changes, termination, or device loss.
- Require stronger authentication, such as MFA or step-up verification, for privileged accounts and high-impact actions when supported by the product's auth flow.

### 6. Geofencing & Anti-Theft Device Tracking
- Use location/device signals only for explicitly approved workflows and as risk signals; browser GPS and user-agent values are forgeable and must not be the sole authorization check.
- Minimize collection and retention of location, IP, and device data. Restrict access, avoid logging secrets or unnecessary personal data, and document retention needs.

### 7. Auditability and Incident Handling
- Record actor, action, target, timestamp, and a required reason for sensitive approvals and overrides. Include only the minimum additional context needed to investigate.
- Sanitize logs and never record passwords, PINs, access tokens, full payment credentials, or unnecessary personal data.
- Surface actionable errors to users while keeping stack traces and sensitive internals in restricted server logs. Fail closed for authorization and integrity failures.
- For Supabase Storage, define bucket/object access explicitly; replacing an object with upsert requires the corresponding read and update permissions in addition to insert.

---



