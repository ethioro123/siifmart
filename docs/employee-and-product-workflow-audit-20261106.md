# Employee and buying-to-selling investigation — 6 November 2026

## Result and scope

This third investigation found **12 additional gaps**, centered on employee authority, confidential personnel data and payroll integrity. The findings below describe the original audit state. The subsequent [repair and staging verification record](employee-and-product-workflow-fixes-20261106.md) documents their fixes; original reproduction scripts remain historical evidence in commit `297e91d7`.

The highest priorities are executive-role assignment, administrative password resets, payroll approval/settlement authority and personnel-data exposure. Employee authority is upstream of procurement, receiving, warehouse supervision, transfers and finance: a role-assignment gap can undermine otherwise correct operation-specific checks.

The pass examined employee recruitment/access handover, role/site changes, compensation/profile reviews, scheduling, attendance, payroll preparation/approval/disbursement and offboarding, alongside selected purchasing-to-sale controls from the earlier repairs.

### Evidence boundaries

- **Live reproduction:** staging database project `utykzifrblpyxlvlknsm`, authenticated employee roles and rollback transactions. Service-role setup created synthetic fixtures where needed. Actual actions under test used authenticated roles. Existing employee metric changes were also rolled back.
- **Deployed handler simulation:** staging `admin-reset-password`, ACTIVE version 1, retrieved through the Supabase connector. Its handler was executed locally with inert clients. No real password-reset request was sent and no real credential was changed.
- **Application reproduction:** real services/hooks/components with mocked persistence failures. This proves application behavior for the supplied response, not that every client action bypasses live RLS.
- No migrations, lasting business-data changes, promotions, payroll payments or real account changes were applied. Production was not tested or changed. Test results do not certify physical scanning, bank/mobile-money settlement, browser UX or concurrent multi-device behavior.

## Findings

### 1. Critical — facility/regional managers can assign group executive authority without independent review

**Live reproduction.** An authenticated Adama regional HR manager changed a synthetic picker's role directly to `group_cfo`. Separately, the warehouse manager directly inserted an employee with `role=group_cfo` and `status=Active`. Neither required an employee-change approval request.

The employee INSERT/UPDATE policies and `public.enforce_employee_update_privileges` protect an incomplete list of executive roles. Newer group/director roles fall outside that list. UI hiring/governance controls do not constrain direct API writes. The test establishes that the trusted employee role record accepts these assignments; it does not create a login account or execute a CFO payment.

**Impact:** a facility manager can grant authority far above their own position. Operations using the employee record for authorization inherit the changed role.

**Evidence:** `tests/sql/employee_audit_role_escalation.sql`; live `employees_insert`/`employees_update` policies; `public.enforce_employee_update_privileges`.

**Repair:** enforce complete role hierarchy, country/site assignment rules, onboarding state and independent authority at the employee write boundary; derive roles from the canonical trusted hierarchy rather than a partial denylist.

### 2. High — the administrative password-reset endpoint admits ordinary floor roles

**Deployed handler simulation, supported by live employee-read evidence.** The retrieved ACTIVE staging v1 handler accepts a caller whenever its hardcoded numeric rank exceeds the target's. A receiver ranked 22 can reset a driver ranked 20. It does not first require a password-administration role.

The test executes that retrieved handler with a receiver/driver identity pair and confirms a successful call to the inert admin reset client. The live privacy test separately confirms that the actual Adama receiver can read the driver identity used by this lookup. The deployed rank map also differs from the current repository map and still uses legacy role names.

**Impact:** a floor worker can reach an account-control operation intended for authorized administrators. No real account takeover was performed.

**Evidence:** `tests/audits/employeePasswordResetGap.test.ts`; retrieved snapshot `tests/fixtures/employee-audit-deployed-reset.txt:135`; live read assertion in `employee_audit_privacy_and_schedule.sql`; local endpoint `supabase/functions/admin-reset-password/index.ts` has the same rank-only admission pattern.

**Repair:** explicitly authorize active password administrators and target scope, enforce hierarchy from a maintained policy, bind audit identity to the authenticated actor and verify the deployed function matches the reviewed implementation.

### 3. High — payroll can be marked disbursed and its amount changed without sign-offs

**Live reproduction.** A country finance director created an unapproved synthetic payroll run, then updated only its status and totals. The database saved `status=disbursed` and changed the payout from 100 to 999,999 while HR, Finance and disburser fields remained NULL.

`private.guard_payroll_run_signoffs` checks changes to selected signature columns but does not validate a status-only transition or freeze the approved commercial totals. No bank payment occurred.

**Impact:** payroll records can claim payment/approval states without their prerequisite evidence; the amount being approved is not protected through the lifecycle.

**Evidence:** first scenario in `tests/sql/employee_audit_payroll_authority.sql`; live payroll trigger and policies.

**Repair:** enforce a complete state machine, freeze a roster and amount snapshot, derive totals from trusted detail, and require recorded settlement evidence before the terminal payout state.

### 4. High — one authenticated employee can supply both payroll signatory identities

**Live reproduction.** The country managing director supplied one invented HR alias and a different Finance alias on the same run. Both updates succeeded and the run became approved. The database checked the actor's broad permissions and a text comparison to the initiator; it did not bind distinct HR/Finance employee IDs to the two decisions.

**Impact:** two names on a payroll run do not prove two independent people reviewed it. The reproduction proves the single-actor dual-signing path, not an actual payout.

**Evidence:** second scenario in `tests/sql/employee_audit_payroll_authority.sql`; `services/payroll-runs.service.ts:186`, `:281`; live payroll signoff trigger.

**Repair:** store authenticated employee IDs for both decisions, enforce distinct authorized people on the server, and bind decisions to an immutable run fingerprint. If an executive exception is intended, record it explicitly rather than manufacturing two departmental signatures.

### 5. High — floor workers can read colleagues' compensation and private address

**Live reproduction using synthetic private data.** The Adama receiver selected another worker's salary and address. The employee row policy permits the facility directory read, and the same row exposes confidential columns. The general employee services use full-row projections, but narrowing the client projection alone would not secure the direct API.

**Impact:** operational roster access exposes personnel data beyond the job's needs. Only fabricated salary/address values were used in the test; real private values are not reproduced in this report.

**Evidence:** first scenario in `tests/sql/employee_audit_privacy_and_schedule.sql`; live employee SELECT policy/grants; `services/employees.service.ts:115` and `:260`.

**Repair:** separate operational directory fields from restricted HR/compensation data through a trusted projection or separately protected records, and limit base-table/column access accordingly.

### 6. Medium — workers can certify their own attendance/performance metrics

**Live reproduction.** The Adama receiver updated their own `attendance_rate` and `performance_score` to 100. The self-update guard blocks role, salary and status changes, but leaves these metrics writable.

The staff overview reads those fields directly and labels attendance “Verified shift & roster attendance.” There is no verification inherent in these self-written numbers. This report does not claim that these fields directly changed a bank payment or bonus.

**Evidence:** `tests/sql/employee_audit_self_attestation.sql`; `public.enforce_employee_update_privileges`; `components/staff-profile/tabs/OverviewTab.tsx:54`, `:114`; employee update allowlist.

**Repair:** derive metrics from trusted evidence or supervisor-reviewed records and protect them from self-service writes; present only the verification status actually established.

### 7. High — an Ethiopian roster can reference a Kenyan employee

**Live reproduction.** The Adama warehouse manager inserted an ET schedule at the ET warehouse with a real active KE employee ID. The write succeeded. RLS checked the schedule's site/country, but did not validate the referenced employee's country or workplace.

**Impact:** cross-border personnel references and misleading site staffing/coverage become durable data, even though the manager cannot normally browse the foreign employee. The test used a privileged lookup only to obtain the foreign fixture ID; the schedule insert itself ran as the ET manager. It does not establish a cross-border payroll payment.

**Evidence:** second scenario in `tests/sql/employee_audit_privacy_and_schedule.sql`; live `staff_schedules` policies/triggers; `services/schedules.service.ts`.

**Repair:** validate subject country, site or approved temporary assignment and employment status inside schedule writes, independently of client roster filtering.

### 8. High — employee-change review is non-atomic and can replay a rejected snapshot

**Application reproduction, two scenarios.** The real approval service first applies the entire proposed employee snapshot and then marks the request approved. When the second request fails, the employee salary remains changed while the approval operation throws. A second test supplies a request already marked rejected; the service still applies its proposed salary and attempts approval.

The path also does not prove that every department named in `requiredApprovers` has signed. The reproduced cases isolate failed persistence and rejected-state replay; live concurrent approval was not tested.

**Impact:** compensation/role/site fields can diverge from their review record, or stale/rejected values can be reapplied.

**Evidence:** fourth and fifth cases in `tests/audits/employeeWorkflowGaps.test.ts`; `services/employee-changes.service.ts:169`–`:201`.

**Repair:** one trusted transaction must lock the pending request and employee, verify current evidence and required independent decisions, apply only approved differences and record the final decision once.

### 9. High — payroll completion is detached from durable expense and payout evidence

**Application reproduction plus inspected call path.** The payroll modal marks the run disbursed before calling `processPayroll`. When that following call fails in the component test, the persisted run status remains disbursed. The actual `processPayroll` hook constructs a local `Paid` expense and updates React state; it makes no database write for that expense. The second test confirms the absence of persistence.

The modal invokes disbursement without an expense ID. No bank or mobile-money settlement call was found in this inspected path. A disbursed record and its success message therefore do not establish employee payment. This is distinct from finding 3: it occurs through the application's ordinary completion sequence, even when two signoffs are present.

**Evidence:** `tests/audits/employeePayrollHandoffGap.test.tsx`; `components/financials/PayrollModal.tsx:168`–`:175`; `contexts/hooks/useFinanceActions.ts:100`, `:119`; `services/payroll-runs.service.ts:335`.

**Repair:** distinguish approved, prepared, submitted and confirmed settlement; persist the expense/ledger association with the run, use idempotent payout references, and report disbursement only from verified settlement evidence.

### 10. Medium — a requested payroll period can resolve to a different month

**Application reproduction.** `getLatestRun` reads the latest 25 runs, searches that page for the requested period, and returns the first run when no match is found. The test requests November and receives October. A valid older requested month outside the page is likewise missed.

The payroll modal uses this method to select its active batch, so its actions may be attached to a different period instead of a new/current-month batch. The test does not initiate or pay that returned run.

**Evidence:** sixth case in `tests/audits/employeeWorkflowGaps.test.ts`; `services/payroll-runs.service.ts:113`; `components/financials/PayrollModal.tsx:58`.

**Repair:** filter by the requested period in the server query and return no run when that period has no eligible record; keep history pagination separate from identity selection.

### 11. Medium — attendance persistence is absent, and its service can manufacture completion/cache results

**Live deployment inspection and three application reproductions.** `public.employee_attendance` does not exist on staging, although the attendance service reads/writes it. On a rejected clock-in, the service returns a Present record, writes it to local storage and attempts a clock-in audit event. A thrown scoped fetch falls back to another site's cached attendance because that catch path omits the site filter. Clocking out a record absent from the device cache writes an invented eight hours.

No current UI caller of these attendance service methods was found. This is an unavailable/dormant service contract with unsafe fallback behavior, rather than a claim that the current clock-in screen was exercised. The staff profile's existing attendance field is covered separately in finding 6.

**Evidence:** `tests/sql/employee_audit_missing_attendance_attestation.sql`; first three cases in `tests/audits/employeeWorkflowGaps.test.ts`; `services/attendance.service.ts:56`, `:90`, `:171`.

**Repair:** establish the intended trusted attendance workflow and deployed schema, derive duration from a server session, and distinguish failed/queued/server-confirmed records. Scope caches to actor/site/country/session and never return a local attempt as a verified server clock-in.

### 12. Medium — Regional HR payroll attestation has no deployed command

**Live deployment inspection.** `public.attest_payroll_regional_hr(text,text)` is absent from staging. The payroll service calls it, and the repository contains the migration defining it. Adding the `regional_attested_by_id` column in the previous repair did not deploy this missing function.

**Impact:** the advertised regional attestation action cannot complete through that RPC. Existing unit tests mock the RPC and therefore do not detect deployment absence.

**Evidence:** `tests/sql/employee_audit_missing_attendance_attestation.sql`; `services/payroll-runs.service.ts:240`; `migrations/20261018_secure_regional_payroll_attestation.sql:82`.

**Repair:** reconcile the full attestation schema/function/authorization contract against staging and add a deployment integration test, rather than applying only its missing column.

## Controls that held

- A facility manager could not directly terminate the synthetic employee outside reviewed offboarding.
- An authenticated terminated employee received no operational role and could not save a POS sale.
- An ET store manager could not initiate a KE sale.
- Order release still created one FEFO pick job, remained Picking and reused the handoff on retry.
- Disputed transfer intake still required an independent supervisor and assigned driver signature; routine intake remained atomic and retry-safe.
- Source inspection of lifecycle decisions found explicit effective-date, open-drawer and active-job dependency checks for employee offboarding. Those dependency paths were inspected, not all executed in this pass.

## Verification and delivery limits

- **71 tests passed across 11 focused files**, including nine new characterization scenarios. Passing characterization tests mean the documented gap is reproduced, not that the behavior is correct.
- **Nine persisted staging SQL scripts completed successfully:** six employee investigation/control scripts and three previous workflow regression scripts. Five employee scripts use rollback transactions; the missing-contract check is read-only. No lasting fixture or business mutation remained.
- The retrieved password-reset handler was tested with inert clients, not a real account reset. The deployed snapshot is retained as a test fixture for reproducibility.
- TypeScript, diff and commit-time file-size results are reported with delivery. Browser/device testing, physical staff identity, actual payroll transfer/settlement and multi-device load remain outside this investigation.
- Existing concurrent POS work was preserved. This audit changes tests and factual documentation; it does not change application behavior, database schema, security policies or project rules.

## Repair order

First close role assignment and reset authority, then payroll state/identity/settlement integrity and confidential employee reads. Next repair employee-change transactions and country-safe scheduling. Finally correct metrics provenance, period selection and the missing attendance/attestation contracts. Keep normal product movement automatic while preserving independently recorded decisions for exceptions and sensitive employee changes.
