# 17 · Reference implementation and visual acceptance

[Handbook](../APPLE_DESIGN_GUIDE.md) · Revision B, 29 October 2026

## Reference status

The [component board](examples/component-reference.html) is a runnable, dependency-free visual specification for the target language: neutral surfaces, one action hierarchy, compact status, readable records and explicit states. Open it in a browser or through the project's development server. It contains synthetic, nonproduction examples. It does not fetch business data or grant approval authority.

The board is the specified visual baseline for new component implementation. It is not a claim of stakeholder approval of every pixel, nor proof that existing production components already match it. Future implementation should reproduce the contract through shared components and central tokens rather than importing this demonstration's CSS wholesale.

## Covered references

The board displays light and dark surface pairs; resting, secondary, invalid, disabled and busy controls; a labeled field with persistent help; selected/read-only data; status badges; a compact approval entry; and a semantic table with exact per-location identifiers. Its test suite verifies the reference itself. Dialogs, comboboxes, menus and complex operational screens still require their dedicated behavior implementations and workflow evidence.

Reference controls intentionally have no production side effects. A review example may open a local demonstration dialog, but no button should imply that an actual price was saved. Every artifact carries a reference-only label. A visual baseline is not permitted to become a parallel application UI kit.

## State fixtures required for a shared component

Before promoting a shared component to conforming status, render named fixtures for default, hover, focus-visible, pressed when relevant, selected, disabled, pending, invalid, read-only and unavailable. Include the combinations most likely to regress: focused-invalid input, focused-selected row action, disabled-hover button, long localized busy label and background refresh failure with previously loaded data.

Use deterministic synthetic data, stable timestamps, fixed locale and no external font/image dependency in screenshot fixtures. Do not freeze dynamic business values in production merely to stabilize a test. Disable decorative animation for snapshots; test meaningful reduced-motion behavior separately. Wait for actual fixture readiness instead of inserting arbitrary delays.

## Visual regression matrix

| Fixture | Viewports | Modes | Acceptance |
|---|---|---|---|
| Component board | 390 × 844; 1440 × 1000 | Light and Dark shown side by side/stacked | No page overflow, clipped required labels or unexpected baseline change |
| Buttons and fields | 320; 768; 1440 widths | Both themes; keyboard focus; reduced motion | Stable targets, readable labels, preserved focus/error cues |
| Data workspace | Narrow and wide | Selected, empty, failure, long names | Accurate identity, localized table overflow only, visible actions |
| Dialog/menu | Narrow and wide with scroll | Keyboard; zoom; long translated text | Contained and restored focus; no obscured controls |
| Operational task | Representative real device | Bright environment, keyboard/scanner, interruption | Short repeatable path, safe recovery and factual confirmation |

Check screenshots at a consistent browser version and rendering environment. A baseline produced on one operating system may differ in font rasterization from another. Store baselines in a reproducible CI/browser environment; never accept a large generic pixel-difference threshold to hide structural regressions.

## Baseline update discipline

The first reference screenshots establish an initial baseline; they do not prove a regression against a prior approved product. Subsequent updates require examining the diff and explaining intentional changes. Do not run an update-snapshots command merely to make failing tests green. Investigate layout, typography, rendering and actual component changes first.

A reference-only snapshot test must not require production credentials or seed production records. Tests should isolate the static fixture and avoid the application's login/session state. Business workflow regression tests remain separate and must still verify persistence, scope and authority.

## Contrast and link checks

Run `python3 scripts/check-design-reference.py` to check reference palette pairings and local handbook links. The checker reports ratios without rounding a failing value upward to a passing threshold. It also detects mismatches between the fixture's palette and the target palette. This is useful evidence for these declared solid pairs, not certification of transparency compositing or every application screen.

Run `npx playwright test --config tests/design/playwright.config.ts` for the focused Playwright reference test to verify narrow/wide rendering and review interaction. Record any unavailable browser or sandbox blocker honestly. The checked-in reference contract must remain useful without requiring a new product dependency.

## Component migration gate

A component is ready for broad reuse when dimensions, states, semantics, themes, resizing and keyboard behavior conform; reference and behavioral tests pass; and its affected callers have been inspected. A class-name assertion alone does not meet this gate. A screenshot alone does not prove correct focus, selected scope or a confirmed database outcome.

When the specification and a prior chapter differ in an exact internal measurement, chapters 14–16 provide the refined default; accessibility, business and security requirements still win. Record a justified content-driven deviation where necessary. Do not seek extra human permission merely to document an already-authorized implementation choice.
