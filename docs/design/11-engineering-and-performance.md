# 11 · Engineering and performance

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Edition 29 October 2026

## Design and implementation share responsibility

Responsiveness is part of the interface. A polished approval button that starts several duplicate requests, a blurred shell that stalls scanning or an optimistic task that disappears after reload does not meet the design standard. Make the data and interaction contract reviewable alongside the visual treatment.

Use existing architecture: UI mutations through custom hooks, services for persistence, query hooks for server reads, centralized scope and semantic tokens. Keep components focused and follow the repository's 500-line limit. A design-system change should reduce competing patterns rather than add another set of locally styled buttons and dialogs.

## Shared components

Start with an inventory of existing shared behavior. Check buttons, page headers, badges, empty states, dialogs, notification surfaces and table patterns before building a new variant. Prefer a small number of meaningful variants over arbitrary class escape hatches used to restyle every instance differently.

Treat component API changes as product changes. An updated modal must preserve dismissal, focus, scrolling, portal behavior and safe areas across existing callers. A button loading change must preserve form submission semantics and duplicate-action protection. Do not certify a component as accessible because its name includes “shared” or because it has a focus utility class.

Document intended states and examples at the shared boundary. Use existing tests and preview tooling where available; do not add a large dependency solely to display a small visual change. New component tooling needs an actual maintenance and workflow benefit.

## Data-aware interaction

Keys and subscriptions must include the actual authorized identity and scope. A country or role change must not reuse sensitive cached content under an insufficiently scoped key. On logout or identity replacement, clear or isolate domain state according to the session contract. Do not persist business evidence in local storage to avoid a server lookup.

Reusing fresh data should avoid redundant reads. A page mount, navigation effect, query observer and subscription handshake must not independently refetch the same inbox. Use appropriate freshness windows, explicit invalidation and supported realtime updates. A successful unrelated mutation should not cause the entire application to reload its domain data.

Use bounded pages and explicit projections. Load row details, line items, archives and heavy analytics when requested. A count endpoint should return a summary rather than a full dataset that the browser counts. Do not inflate client work by materializing thousands of hidden cards.

## Performance targets and measurement

For relevant route-load experiences, track the current Core Web Vitals “good” thresholds at the 75th percentile: LCP at most 2.5 seconds, INP at most 200 milliseconds and CLS at most 0.1. These are web performance targets, not a guarantee that a specific database request completes in 200 ms. See [Web Vitals](https://web.dev/articles/vitals).

Supplement them with workflow measures: scan-to-visible-feedback, next-item readiness, review-opening latency, count refresh and error recovery. Record the device, browser, network, dataset size and cold/warm cache condition. Compare before and after under equivalent conditions. A fast local SQL plan alone does not establish browser end-to-end speed.

For a changed repeated action, the reviewer should state the observed latency and whether it regressed. Agree any new workflow-specific budget with evidence from representative use rather than inventing an apparently official Apple threshold. A measured blocker requires a fix or a transparent limitation; it should not be hidden by a longer spinner.

## Rendering discipline

Prefer simple layout, bounded content and stable keys. Add memoization or virtualization only after measuring the relevant bottleneck and preserving accessible navigation. A virtualized table must still support focus, selection, meaningful row identity and required evidence access. Do not allow recycled rows to present another record's busy or selected state.

Keep large shadows, backdrop filters and complex compositing away from dense scrolling or continuously changing surfaces. Profile any retained material on representative devices. A solid fallback is available in every module, not only Fulfillment. Removing decoration must preserve layout, hierarchy and all supported actions.

Lazy-load expensive reports, charts, editors and export libraries when the task permits. Avoid blocking the primary work with optional intelligence or historical data. Skeletons and loading labels should reflect the actual dependency rather than concealing an unnecessary waterfall.

## Browser capability and progressive enhancement

A feature must have a usable baseline in the supported browser set before visual enhancement. Treat backdrop blur, reduced-transparency detection, newer CSS layout features, view transitions and device haptics as capabilities to verify, not assumptions implied by the year 2026. Use feature detection and realistic fallbacks where appropriate.

Do not introduce a modern API solely for novelty. It needs a visible task benefit and a tested unsupported path. Native Apple controls automatically inherit platform behavior through native frameworks; a React web component does not automatically receive those semantics, accessibility features or material adaptations.

Avoid browser-specific assumptions about mobile viewport height, software keyboard behavior, autofocus, printing and barcode hardware. Test the supported deployment container, including web/PWA or desktop wrapper where applicable. A browser emulation screenshot does not replace a representative physical-device check for scanning or printing.

## Visual implementation hygiene

Use semantic tokens and the existing Tailwind mapping. Do not sprinkle new hex colors, arbitrary z-index values or font stacks through features. Where a genuinely missing semantic role is needed, introduce it centrally with both themes and evidence for its use.

Scope overrides to their actual component or capability. Avoid broad global selectors that unexpectedly recolor icons, suppress browser focus or disable text selection. Keep important information in DOM text rather than pseudo-elements or images. New visual assets should have correct sizing, appropriate alternatives and a reason to load.

## Engineering acceptance

Run the relevant type checks and behavioral tests for implementation changes. Measure the changed route or repeated action, inspect actual computed styles and check accessibility states. Investigate new build warnings attributable to the change; do not expand a focused task into an unrelated cleanup simply because historical warnings exist. Report incomplete physical-device or browser checks honestly and retain a concrete follow-up criterion.
