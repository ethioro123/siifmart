# 13 · Sources and design decisions

[Handbook](../APPLE_DESIGN_GUIDE.md) · Edition 29 October 2026

## Research boundary

Sources below were consulted for this edition on **29 October 2026, Australia/Melbourne**. They are primary platform, standards or platform-documentation sources. Their current published contents were checked; the handbook does not assert that Apple published a specific new standard on this date.

This handbook is original SIIFMART product guidance informed by those sources and the inspected repository. It does not reproduce Apple's HIG or designate our token values as Apple's web specification. Numerical control, spacing, radius, type, density and motion recommendations are internal decisions unless identified otherwise. Links remain references, not evidence that our deployed screens have already passed a conformance audit.

## Source register

| Source | What informed this edition | Boundary |
|---|---|---|
| [Apple WWDC26 Keynote](https://developer.apple.com/videos/play/wwdc2026/101/) | 2026 refinements to transparency customization, toolbar structure and legibility | Native platform behavior does not automatically transfer to a web app |
| [Apple Platforms State of the Union 2026](https://developer.apple.com/videos/play/wwdc2026/102/) | Continued refinement of Liquid Glass consistency and cross-device adaptation | Used as direction, not as a list of required React effects |
| [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | Functional navigation/control material distinct from the content layer | SIIFMART CSS utilities are not native material implementations |
| [Apple HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | Familiar structure, related information, adaptation and safe areas | Browser layout and keyboard behavior need their own verification |
| [Apple UI Design Tips](https://developer.apple.com/design/tips/) | Native touch-target and legibility guidance | Apple points and CSS pixels are distinct; 44 CSS pixels is our policy |
| [Apple Fonts](https://developer.apple.com/fonts/) | Platform typography resources and font-use context | No authorization to redistribute proprietary fonts is implied |
| [Apple HIG: Generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai) | Honest identification and understandable generated assistance | SIIFMART server approval and authority rules remain independent |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Web accessibility conformance framework and AA baseline | A handbook cannot certify application-wide compliance |
| [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Text/background contrast thresholds and large-text distinction | Test actual rendered combinations, not token comments |
| [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | Essential boundaries and graphical information | Decorative separators have a different role |
| [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 24 CSS pixel AA minimum and defined exceptions | Our usual 44-pixel target is intentionally stronger |
| [WCAG focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) | Focus visibility around authored overlays and sticky content | SIIFMART targets full practical visibility beyond the AA minimum |
| [WCAG focus appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) | Enhanced focus-indicator reasoning | This criterion is AAA, not part of the AA minimum |
| [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Narrow-width and zoom behavior with specific two-dimensional exceptions | A table exception is not a whole-page exemption |
| [WCAG accessible authentication](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) | Assistance for authentication rather than memory-only interaction | Does not waive OTP secrecy or independent supervisory authority |
| [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | Modal semantics, contained focus and restoration | Applying a role without behavior is insufficient |
| [MDN reduced transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency) | Browser preference capability and limited availability | Keep an opaque baseline; feature support must be verified |
| [Web Vitals](https://web.dev/articles/vitals) | LCP, INP and CLS thresholds and field-measurement framing | Workflow and API timings require separate measurements |

Some Apple documentation pages expose JavaScript shells or markdown alternatives that individual research tools cannot retrieve. This edition uses verified official indexed text and the accessible official video transcript for its cited platform claims. It avoids inventing detailed typography or animation prescriptions from an unreadable page.

## Internal implementation evidence

Inspected `styles/theme.css`, `index.css`, `hooks/useTheme.ts`, `components/ThemeSelector.tsx`, `components/shared/Button.tsx`, `components/shared/PageHeader.tsx`, `components/Modal.tsx`, the compact product-approval patterns, `AGENTS.md` and the focused engineering guide. This is a bounded implementation review, not a screen-by-screen product audit.

The theme defines colors, radii, spacing, control heights and motion values. The appearance hook defaults to System and follows device changes. The shared components expose useful reuse points, but their actual semantics and contrast still require rendered verification. Some theme comments make broader platform/contrast claims than inspection establishes; this edition explicitly prevents treating those comments as certification.

## Decisions recorded in this edition

| Decision | Reason |
|---|---|
| Compact approval entry points across modules | Keep persistent awareness without repeated large preview cards |
| One scoped price proposal with per-site evidence | Reduce review duplication while preserving exact business consequences |
| Human site names and display codes | Make location context recognizable without exposing UUIDs as primary labels |
| Solid financial, form and scanning content surfaces | Keep decision evidence readable and rendering predictable |
| Optional localized materials with global fallback policy | Preserve visual hierarchy without excluding constrained devices or accessibility preferences |
| Existing neutral primary action tokens plus accent/status roles | Maintain brand consistency without arbitrary page-specific palettes |
| Existing scale values, verified per use | Avoid a parallel token system and unsupported claims of official Apple numbers |
| WCAG 2.2 AA baseline with explicit stronger internal choices | Separate minimum requirements from product-quality targets |
| Factual pending, confirmed and unavailable states | Prevent interface polish from concealing incomplete or failed persistence |
| A handbook with focused chapters and one canonical entry | Provide depth while respecting the repository's file-size and maintainability rules |

## Change log

**29 October 2026:** Replaced the short UI guide with a comprehensive standard and thirteen linked reference chapters. Added the root entry point. Reconciled the focused engineering guide's compulsory-material and Fulfillment-only fallback language with a task-led, accessible, measured approach. Runtime styles and application components are unchanged by this documentation task; adoption requires normal implementation and verification.
