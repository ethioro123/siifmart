# 19 · Complete UI and UX coverage

[Handbook](../APPLE_DESIGN_GUIDE.md) · Revision D, 30 October 2026

## Scope and authority

The Codex-inspired direction governs the entire SIIFMART interface and the experience of completing work. It MUST cover every route, role, module, shared component, nested surface, temporary overlay and interaction state. A palette change or a shared stylesheet alone is not a complete redesign.

Read this chapter with chapter 18 for visual direction and chapters 01–17 for the detailed contracts. This chapter strengthens coverage and evidence requirements; it does not replace workflow, accessibility, localization or security requirements. Existing implementation is not an exception to this standard.

The goal is a coherent, calm, modern workspace: clear hierarchy, softly shaped independent panels, restrained decoration, readable operational content and predictable interaction. Avoid heavy rectangular framing and repeated boxes within boxes. Preserve useful panel identity and operational evidence.

## Required coverage inventory

For an application-wide rollout, maintain an inventory of routes and their nested components. Include low-use administration, authentication and recovery paths. Every item needs an owner or responsible implementation area, applicable requirements, evidence and a current status. New routes and components enter the same inventory.

| Interface area | Required coverage |
| --- | --- |
| Application shell | Canvas, sidebar/rail, top bar, account and appearance controls, country/site context, search, breadcrumbs, route changes and session transitions |
| Navigation | Active/current/expanded states, collapsed navigation, drawers, nested menus, tabs, links, browser back/forward, deep links and return-to-work behavior |
| Page composition | Title and actions, work-region hierarchy, panel identity, whitespace, alignment, density, inspectors, sticky regions and progressive disclosure |
| Identity and typography | Heading hierarchy, body/instruction text, metadata, identifiers, amounts, long names, localization, wrapping and readable line lengths |
| Controls | Buttons, icon actions, links, toggles, checkboxes, radios, segmented controls, menus, tooltips, sliders, date/time and file controls |
| Forms | Labels, help, required/optional states, validation, error summaries, autocomplete, keyboard submission, dirty state, draft recovery and server rejection |
| Data surfaces | Lists, tables, grids, trees, org charts, pagination, sorting, search, filters, selection, bulk actions, totals and record detail |
| Analytics | Chart colors, axes, legends, tooltips, summaries, accessible data alternatives, unavailable values and loading/refresh behavior |
| Overlays | Dialogs, sheets, popovers, confirmations, nested overlays, focus containment/restoration, background inertness and dismissal |
| Feedback | Notifications, toasts, approval counts, banners, inline status, progress, validation, undo, retry and persistent history |
| Operational work | POS, scanning, receiving, putaway, picking, packing, dispatch, stock counts, transfers, procurement, merchandising, finance and people workflows |
| System paths | Login, quick login where enabled, onboarding, location selection, permission denial, session expiry, maintenance, migration/admin tools and not-found routes |
| Device and output | Scanner/camera states, device permission, software keyboards, receipt/label/ID previews, printing, downloads and export feedback |
| Assistance | Context help, onboarding tips and AI-assisted suggestions, with clear provenance, user control and confirmed outcomes |

An item may be marked not applicable only with a concrete reason. No row, toolbar, badge, dropdown, hover action, tooltip or error path is exempt because it appears inside an already-reviewed page.

## One semantic theme system

All application appearance MUST resolve through the shared semantic token system. Modules MUST NOT define their own Light/Dark palette or force an appearance preference. System appearance is the default; explicit user preferences remain respected throughout the application.

- Put theme color values in the canonical shared theme definition. Components consume semantic surface, text, action, status, selection, focus, overlay and chart tokens.
- Do not put theme hex/RGB/HSL literals, fixed Tailwind palette utilities or theme-dependent color branches in component styles, chart configuration, SVG attributes or canvas drawing. Resolve shared tokens for APIs that cannot consume CSS variables directly.
- Use shared geometry, spacing, typography, elevation, density and motion contracts. A documented layout measurement may remain local; a competing visual system may not.
- Backdrops, shadows, focus rings, hover/pressed/selected states, disabled treatment, chart cursors and transient feedback belong to the token system too.
- Compatibility adapters may support migration temporarily. They do not make a component fully migrated and must not become the default for new code. Replace the original legacy styles with semantic tokens at the shared component or workflow boundary.
- A broad substring selector must not turn a hover-only style into a permanent state or collapse distinct opacity/state treatments. Inspect the actual cascade and rendered states.
- Preserve colors that are actual content, such as a product swatch or user-selected annotation. Reliable barcode/QR output and physical print contracts may require fixed ink/paper colors. Isolate these from application chrome and document the reason; their preview controls still follow the theme.

A token name alone is insufficient: verify the resulting foreground/background pair, alpha composition, visible focus and meaning in both themes.

## Component and interaction contracts

Shared primitives MUST implement their complete behavior before reuse is presented as compliance. Do not reproduce a broken primitive across more screens.

| Pattern | Required behavior |
| --- | --- |
| Dialog/sheet | Accessible name and semantics, deliberate initial focus, focus containment, background inertness, appropriate Escape/outside dismissal, focus restoration and safe stacked-overlay behavior |
| Actions | Clear purpose, correct button/link semantics, visible keyboard focus, required target size, readable labels, pending feedback and duplicate-activation protection for consequential work |
| Menus/tabs/selection | Appropriate keyboard model, exposed expanded/selected/current state, predictable focus, touch discovery and no hover-only essential action |
| Forms | Programmatically associated labels/help/errors, actionable validation, retained input after recoverable failures and safe handling of session/scope changes |
| Tables/lists | Meaningful headings, sortable-state semantics, exact selection scope, bounded pagination, discoverable row actions and responsive access to required values |
| Async work | Distinguish pending, queued, saved and applied; expose affected-region busy state and factual error/recovery feedback without replacing failure with an empty result |
| Navigation | Preserve useful work where safe, warn about actual unsaved loss where needed, manage route focus and reset unsafe selection when authority or scope changes |

Normal touch targets are at least 44 by 44 CSS pixels. Repeated scanner actions follow the 52-pixel contract. Smaller fine-pointer controls require the documented chapter 14 density treatment; a compact screenshot is not evidence of touch usability.

Apply the chapter 18 typography hierarchy to actual tasks. Do not shrink instructions, product identity, quantities or financial values into tiny uppercase metadata. Status must be understandable without color. Translation growth and mixed-script content must not hide actions or evidence.

## State coverage

Design and review each applicable state at the affected component and workflow level:

- Resting, hover, focus-visible, pressed, selected/current, expanded and disabled.
- Initial loading, pending mutation, background refresh, progress and completion.
- True empty, filtered empty, partial data, missing value, unavailable data and permission denial.
- Validation failure, server rejection, timeout, connection loss, offline work, queued work, retry and cancellation.
- Stale/conflicting evidence, another actor's change, expired session and changed country/site/identity.
- Long content, translated content, large values, zoom, narrow layout, software keyboard and interrupted work.

Do not invent offline capability or a retry guarantee. Show only states supported by the underlying workflow. Protect blind quantities and private data in visual, spoken, printed and exported representations.

## Acceptance and truthful rollout reporting

Use the chapter 12 review matrix for each affected critical workflow. Review desktop, narrow and intermediate layouts; Light/Dark/System; keyboard/touch/scanner as applicable; translations; accessibility preferences; representative data; and the complete saved outcome.

Use these inventory statuses:

| Status | Meaning |
| --- | --- |
| Not audited | No evidence of compliance yet |
| Gap identified | A specific implementation or behavior gap is recorded |
| Implemented, unverified | Code is changed; required rendered or interaction evidence is missing |
| Verified for stated scope | Required checks have evidence for named routes, states, themes and devices |
| Not applicable | A specific requirement does not apply, with a recorded reason |

Do not describe a screen as fully migrated solely because it imports a theme stylesheet, uses some semantic tokens or passes a build. Do not claim application-wide completion while known routes, states or shared primitives remain unreviewed. Report exact scope and missing checks; keep unresolved gaps visible in the rollout inventory.

A source audit can establish code-level gaps. It cannot establish rendered contrast, touch accuracy, focus order, localization quality or end-to-end usability. Documentation changes define requirements and do not certify deployed screens.

Apply shared primitive fixes first where they address multiple callers, then verify representative operational workflows and expand through the inventory. Preserve business behavior and server authority. Existing authorization governs implementation; this chapter adds no extra user approval gate for routine reversible work.
