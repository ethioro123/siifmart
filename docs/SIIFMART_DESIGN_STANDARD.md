# SIIFMART Design Standard

**Edition:** 30 October 2026, Revision D · **Status:** authoritative internal design specification · **Audience:** product, design, engineering and QA.

SIIFMART should feel composed, precise and immediate. People should recognize the next action, understand the business consequence, and trust the result. Our design quality comes from the relationships between information, controls and feedback, supported by disciplined visual craft. Every module must work convincingly in daily use, including a country director's large desktop, a store supervisor's phone and a warehouse worker's scanner.

This is SIIFMART's own platform-neutral web standard: modern elegance through simplicity, precision and readable operational information. It draws selectively on Apple, Material and Fluent guidance for our React, Tailwind and browser-based product. It is not an Apple specification, a native-framework implementation, or a claim that our existing screens already conform. Numerical design targets below are SIIFMART decisions unless an external standard is explicitly identified. Native Apple points and web CSS pixels are different units; CSS approximations do not reproduce native Liquid Glass.

## What changed in this edition

Revision D makes complete UI and UX coverage mandatory. [Chapter 19](design/19-complete-ui-ux-coverage.md) defines the route/component inventory, semantic-theme requirements, interaction and state coverage, and evidence required before claiming a complete rollout. Compatibility color overrides alone do not establish compliance.

The user selected a **Codex-inspired workspace direction**: quiet neutral surfaces, compact navigation, restrained controls, readable typography and progressive disclosure. [Chapter 18](design/18-codex-workspace-direction.md) is the authoritative visual update. [Chapter 15](design/15-states-and-theme-pairs.md) specifies the complete Light/Dark palette, including main backgrounds. It preserves softly rounded cards and panels where useful, while removing mandatory floating-card treatment from full-height workspaces. This is SIIFMART's interpretation, not an official OpenAI specification or a claim of pixel-identical Codex styling.

Apple, Material and Fluent remain supporting references for behavior and accessibility. Glass and Apple-like decoration are optional, not the design identity. Existing business controls, accessibility requirements and rule-edit permission stay in force. Documentation does not deploy a runtime redesign.

## Read the handbook

| Chapter | Use it to decide |
|---|---|
| [01 · Product principles and information architecture](design/01-principles-and-architecture.md) | What belongs on a page, how navigation works, and which task comes first |
| [02 · Visual foundations and materials](design/02-visual-foundations.md) | Surface hierarchy, tokens, color, corners, shadows and restrained glass |
| [03 · Typography, content and localization](design/03-typography-and-content.md) | Type hierarchy, identifiers, dates, currency, language and factual copy |
| [04 · Adaptive layout and navigation](design/04-adaptive-layout.md) | Desktop, tablet, phone, zoom, keyboard and split-view behavior |
| [05 · Controls, forms and overlays](design/05-controls-and-forms.md) | Buttons, validation, search, selection, sheets and dialogs |
| [06 · Tables, lists and analytics](design/06-data-and-analytics.md) | Dense workspaces, pagination, selection, metrics, charts and exports |
| [07 · Approvals, tasks and notifications](design/07-approvals-and-notifications.md) | Compact inboxes, scoped proposals, review evidence and actionable feedback |
| [08 · Accessibility and inclusion](design/08-accessibility.md) | WCAG 2.2 AA, keyboard, assistive technology and display preferences |
| [09 · Motion, feedback and assistance](design/09-motion-and-assistance.md) | Transitions, pending states, progress, undo and AI-assisted work |
| [10 · Operational workflow patterns](design/10-operational-patterns.md) | POS, receiving, putaway, pick, pack, dispatch, finance and people workflows |
| [11 · Engineering and performance](design/11-engineering-and-performance.md) | Shared components, browser capability, data freshness and measurable speed |
| [12 · Review, acceptance and rollout](design/12-review-and-rollout.md) | Definition of done, evidence, severity, migration and maintenance |
| [13 · Sources and design decisions](design/13-sources-and-decisions.md) | Verified references, source boundaries and rationale |
| [14 · Precise component contracts](design/14-component-contracts.md) | Exact dimensions, anatomy, density, spacing and behavior for controls and overlays |
| [15 · State and theme specification](design/15-states-and-theme-pairs.md) | Explicit light/dark pairings, state priority and verified reference colors |
| [16 · Layout and data contracts](design/16-layout-and-data-contracts.md) | Breakpoints, gutters, header, inspector, table and chart composition |
| [17 · Reference and visual acceptance](design/17-reference-and-visual-acceptance.md) | Runnable component board, reference tests and baseline-review discipline |
| [18 · Codex-inspired workspace direction](design/18-codex-workspace-direction.md) | Current visual authority: shell, surfaces, typography, controls and operational adaptation |
| [19 · Complete UI and UX coverage](design/19-complete-ui-ux-coverage.md) | Mandatory application-wide coverage, semantic tokens, interaction/state contracts and truthful rollout status |

Chapters form one standard. Read the relevant workflow chapter together with accessibility and verification before implementing. Do not treat a visual chapter as permission to weaken a business or security rule.

## Earlier reference and implementation precision

Chapters 14–17 add exact component defaults and a [runnable visual reference](design/examples/component-reference.html). Their earlier visual defaults are refined by chapter 18. The reference palette is a contrast-checked migration target; it is not silently applied to production styles. Exact defaults refine prior chapter ranges, while content growth, localization, accessibility and security retain precedence. The reference checker and focused browser tests verify the artifact; they do not certify unrelated production screens.

## The essential rules

1. **Lead with the work.** Give the page one clear identity and a recognizable primary task. Keep secondary diagnostics and historical detail behind deliberate disclosure.
2. **Use a stable visual hierarchy.** Canvas, content and controls have distinct roles. Use spacing and alignment before adding another border, card, color or material. Softly sculpted cards and panels are preferred for main workspaces and independent objects. Avoid heavy rectangular framing; use open groups within panels for related content.
3. **Keep data surfaces clear.** Tables, forms, financial totals, price comparisons and scanning screens use readable solid surfaces. Material treatment is optional and localized to navigation or temporary chrome.
4. **Honor user appearance choices.** System is the default. Respect explicit Light/Dark choices, contrast needs, reduced motion and a solid-surface fallback. Performance fallbacks apply in every module when needed.
5. **Design at the actual density.** Administration can support comparison-heavy layouts; POS and Fulfillment need fast, reachable actions. Neither requires tiny text or giant dashboard decorations.
6. **Make approval entry points compact.** Show the count and route to review without expanding a large preview list on every module. A genuine failure is unavailable, not zero.
7. **Review one coherent business decision.** A scoped price change is one proposal per SKU and selected scope, with per-site evidence available on demand. Preserve required independence and atomic application.
8. **Use human identifiers.** Show site name and display code, SKU and business reference. Keep database UUIDs and payloads under technical details.
9. **Design every state.** Initial loading, background refresh, empty, partial, failed, stale, offline, permission change and completed work each need an intentional representation.
10. **Protect facts.** Distinguish draft, submitted, approved, applied and synchronized. Only announce outcomes that the server or supported device capability has confirmed.
11. **Make all essential work accessible.** Keyboard, screen readers, 200% text, 400% zoom/reflow, touch, language variation and interrupted connectivity are normal design cases.
12. **Prove quality in the rendered product.** A passing token name, screenshot at one width or automated check alone does not establish usability, accessibility or performance.

## Rule-change permission

This handbook and its normative chapters are protected project rules. AI must obtain the user's explicit permission for the specific proposed rule change before editing them, unless that particular edit was already explicitly authorized. A general request to improve or fix a screen does not authorize changing design rules. Follow the protected permission procedure in root `AGENTS.md`; propose unapproved wording in chat and wait before writing it.

## Authority and vocabulary

User instructions, `AGENTS.md`, server-enforced policy and security invariants retain precedence. For visual and interaction decisions this handbook is canonical; there is one handbook entry point at `docs/SIIFMART_DESIGN_STANDARD.md`, supported by the chapters in `docs/design/`. The focused engineering guide must link here rather than restating a contradictory style system.

**MUST** indicates a release requirement. **SHOULD** indicates the expected approach; a departure needs a concrete workflow reason and verification. **MAY** describes an optional treatment. A documented departure is review evidence, not an automatic request for extra user approval. Do not introduce a new permission step into an already authorized task.

Existing component behavior is implementation evidence, not design authority. If a shared component fails these requirements, fix it at the appropriate shared boundary before presenting its reuse as compliance. Existing business rules must be read from their authoritative implementation; this handbook does not create new financial limits or grant roles permission.

## Repository implementation map

| Existing implementation | Responsibility | Important boundary |
|---|---|---|
| `styles/theme.css` | Semantic colors, radii, spacing, control sizes, motion values, material utilities | Values require rendered contrast and state verification; comments are not certification |
| `index.css` | Tailwind v4 theme mapping, font stacks and global/legacy styles | Audit actual cascade, legacy remapping and font coverage |
| `hooks/useTheme.ts` | System/Light/Dark preference and OS-change subscription | Do not hardcode a new dark default in a module |
| `components/ThemeSelector.tsx` | User-facing appearance control | Keep selected preference separate from resolved appearance |
| `components/shared/Button.tsx` | Shared action treatment and loading | Confirm focus, target size, semantics and disabled behavior |
| `components/shared/PageHeader.tsx` | Shared page identity, actions and metrics | Its current card layout is not mandatory for every page |
| `components/Modal.tsx` | Shared overlay shell | Verify focus containment, restoration, background inertness and safe areas |
| `components/Logo.tsx` | Corporate wordmark | Preserve the brand mark; do not create decorative replacements |
| `utils/translations/` | Locale dictionaries | POS/WMS changes synchronize English, Amharic and Afaan Oromoo |
| `components/approvals/` | Compact approval indicators and entry points | Counts must match authorized, reviewable server work |

## Start a design change

Write one sentence describing the user's task and one sentence describing the expected saved outcome. Identify the data owner, site/country scope, affected roles, device/input modes and interrupted-work behavior. Then choose the smallest existing pattern that supports that task. If the pattern is inadequate, improve it with explicit states and evidence rather than adding a competing visual vocabulary.

Use [the acceptance checklist](design/12-review-and-rollout.md) to finish. A documentation update establishes the target standard; it does not silently deploy a full application redesign or certify every existing component.

## Authorized composition clarification — 29 October 2026

The user explicitly clarified that cards and panels are desired: futuristic, clean, elegant and softly shaped. The earlier blanket open-section direction was an incorrect interpretation. Chapters 02 and 14 now define the corrected surface hierarchy, geometry, padding and edge treatment. Removing cards or making the POS entirely transparent is not the target design.
