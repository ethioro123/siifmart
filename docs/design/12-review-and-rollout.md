# 12 · Review, acceptance and rollout

[Handbook](../APPLE_DESIGN_GUIDE.md) · Edition 29 October 2026

## Evidence before approval of a design

Design review evaluates the user task, visual craft, interaction states, information integrity and measured behavior together. A visually attractive resting screenshot is useful, but it cannot establish focus order, server persistence, stale-data handling or safe recovery. A passing test suite does not establish that an Amharic label is readable on a handheld.

The person implementing a change should identify the affected workflow, user roles, data boundaries, devices and known constraints. Review scope should match the change. A small header consolidation needs focused state and responsive evidence; a new multi-step approval workspace requires broader workflow, permission and interruption checks.

## Required design handoff

Provide a concise task statement, entry point and successful outcome. Show the normal state, an informative populated state and relevant loading, error, empty and disabled states. Include realistic long content rather than a perfectly uniform sample dataset.

Document the control meaning and source of truth: what is selected, what is counted, when an operation persists, which action is reversible and what a retry can safely do. Identify any proposed shared-component change and its existing callers. Note which parts are internal SIIFMART choices and which follow an external requirement.

A handoff need not be a separate presentation. It can be a focused issue, PR, annotated artifact or implementation note with enough evidence for another person to assess the actual result. Do not create ceremonial approval steps that delay already-authorized reversible work.

## Review matrix

| Dimension | Minimum evidence for an affected critical workflow |
|---|---|
| Content | Realistic names, site codes, SKUs, money, timestamps, missing values and errors |
| Themes | Light and Dark; System preference follows device changes |
| Layout | Narrow phone, tablet/split view and desktop window; no essential clipped content |
| Zoom/text | 200% text and 400% zoom/reflow where relevant |
| Input | Keyboard-only and touch; scanner/hardware path when affected |
| Assistive technology | Relevant screen-reader/browser task check for changed semantics or critical flow |
| Preferences | Reduced motion; solid-material fallback; forced-colors check where supported |
| Data states | Initial load, background refresh, true empty, filtered empty, partial/unavailable and failure |
| Integrity | Duplicate activation, stale evidence, competing actor, identity/country change and persistence after reload |
| Performance | Before/after repeated action or route evidence on representative conditions |
| Localization | English, Amharic and Afaan Oromoo for affected POS/WMS text and layout |

The supported-browser/device matrix should be recorded in the release evidence for the relevant deployment. Do not silently redefine support by testing only the implementer's browser. When a required device is unavailable, state the missing check and the acceptance criterion still outstanding.

## Visual craft checklist

- The page has a clear title and next action; primary work begins without a tall decorative introduction.
- Text sizes and line heights match the task, and required data is not relegated to tiny metadata.
- Labels, values, controls and section edges share deliberate alignment.
- Grouping uses appropriate spacing before additional borders or nested cards.
- Colors, radii, icons and elevation use the semantic system consistently.
- Status and selection remain distinguishable without color.
- Glass is localized, legible and optional; data surfaces remain stable.
- Actions, badges and filters remain understandable when labels wrap.
- Loading and refresh do not shift the target under the user's pointer or finger.
- Empty and error states give an accurate next step without blaming the employee.

## Interaction and integrity checklist

- Links navigate and buttons act; essential controls have meaningful names and visible focus.
- Modal focus, dismissal, background inertness and restoration work in the rendered implementation.
- Sticky bars do not cover fields, evidence, focused controls or error summaries.
- A query failure cannot become a convincing zero total or current balance.
- A submitted proposal cannot be presented as applied work before server confirmation.
- Country, territory and identity changes isolate data and reset unsafe selection.
- A retry cannot duplicate an irreversible transaction or multiply an identical pending proposal.
- Bulk scope is exact and inspectable; atomic decisions do not report partial-site success.
- Notification delivery, device output and task persistence are only claimed when confirmed.
- Sensitive data, blind quantities and authentication secrets remain protected in every presentation channel.

## Findings and severity

| Severity | Typical finding | Release treatment |
|---|---|---|
| Critical | Wrong country data, unauthorized consequential action, fabricated confirmed outcome | Block the affected release; fix the underlying contract |
| High | Essential task inaccessible, missing decision evidence, duplicate charge/approval risk, unresolvable focus trap | Block the affected workflow until repaired or safely disabled |
| Medium | Significant density, contrast, responsiveness or recovery problem with a usable alternative | Resolve before broad rollout; document a bounded mitigation if sequencing requires it |
| Low | Local spacing, minor alignment or secondary visual inconsistency | Fix within normal iteration without obscuring higher-impact work |

Severity depends on actual user impact. A faint decorative line is not equivalent to unreadable payment text. A color preference is not equivalent to a worker losing an entered receipt after a failed save. Record the observed problem and its consequence rather than attaching severity to a style opinion.

## Definition of done

A design change is done when the affected task is understandable, its required states are implemented, its data contract remains correct, relevant checks pass and material limitations are reported. Visual acceptance requires inspecting the rendered result in the relevant themes and widths. Automated screenshots can support that inspection but should not be blindly approved because a baseline was regenerated.

For code changes, retain the repository's required type check and appropriate tests. Use tests for meaningful behavior and regressions rather than mirroring class strings. For documentation-only changes, validate links, source boundaries, guidance consistency and file-size rules; do not report browser or accessibility certification that was not performed.

Include a plain-language result, verification summary and commit reference. Do not push or deploy a frontend solely because a design guideline was updated. Follow the user's actual authorized scope and the repository's deployment rules.

## Rolling the standard into existing screens

This edition defines the target, not an assertion that every current screen meets it. Begin with the highest-impact gaps: incorrect status, misleading scope/identifiers, blocked keyboard tasks, unreadable financial evidence and repeated-action performance. Then improve shared components and frequently used workspaces before polishing low-use decorative details.

Prefer bounded migrations by component or workflow. Capture a before/after comparison and preserve existing business behavior. Do not start a wholesale visual replacement in a narrow bug fix. A new design-system component should be adopted with a plan for its existing equivalents so the repository does not accumulate parallel patterns indefinitely.

Exceptions require a specific reason, affected scope, evidence and a revisit condition. They are not permission to weaken security or ignore a critical accessibility blocker. Do not ask the user for another confirmation merely because an internal design guideline says to document an exception; determine whether the action is already authorized.

## Maintenance

Keep this main handbook and its chapters under the repository's 500-line limit. Root `APPLE_DESIGN_GUIDE.md` remains a pointer. When tokens, components or business workflows change, update the implementation map and relevant chapter rather than copying the same rule into several competing guides.

Review the source register before claiming a newly current Apple behavior. Record the date and specific source; do not rename an older design convention “Apple 2027” without verification. Reassess this edition when supported platforms, accessibility requirements, shared components or major workflows change, and record substantive decisions with their rationale.
