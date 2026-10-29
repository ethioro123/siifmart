# 03 · Typography, content and localization

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Edition 29 October 2026

## Typography is an information system

Type communicates priority before a person reads every word. A page title identifies the workspace; section titles divide decisions; body text carries instructions and evidence; metadata supports identification. A design that expresses these levels only through faint colors will fail in bright stores, low vision and high-contrast environments.

Use the font system already defined in `index.css`: the application sans stack begins with Inter and includes platform fallbacks; the mono stack begins with JetBrains Mono. Use available fonts legally and through supported assets. Do not download and embed Apple proprietary fonts to imitate a platform screenshot. System fallback behavior and script coverage matter more than a particular brand of typeface.

## Working type scale

The following is a SIIFMART starting scale, expressed in CSS pixels at the default root size. Implement scalable text in relative units where appropriate and allow layouts to grow. These sizes are not official Apple type styles.

| Role | Starting size / line height | Typical weight | Use |
|---|---|---|---|
| Page title | 24–32 / 30–40 | 600 | One clear workspace identity |
| Section title | 18–20 / 24–28 | 600 | Main groups and decision sections |
| Record title | 16–18 / 22–26 | 600 | Product, employee or business object |
| Body and form value | 16 / 24 | 400–500 | Instructions and frequent interaction |
| Desktop data row | 14 / 20 | 400–500 | Dense comparison with sufficient spacing |
| Supporting label | 13–14 / 18–20 | 400–500 | Secondary facts that remain readable |
| Compact metadata | 12 / 16 | 400–500 | Nonessential supporting identifiers only |
| Operational task quantity | 24–40 / adaptive | 600–700 | Scanner quantity or next-location emphasis |

Do not use 10–11 pixel text for required instructions, money, errors, approval evidence or primary table values. A metadata exception must remain optional and readable when enlarged. Avoid excessive weight changes, all-caps sentences and tightly tracked labels. Reserve monospaced styling for codes and aligned numerical information where it improves comparison.

Use tabular figures for prices, stock counts, totals and side-by-side metrics. Align decimal structure only where the underlying domain permits decimal values. Do not visually pad identifiers in ways that change their meaning. A receipt number is an identifier, not a quantity to abbreviate.

## Identifiers and location names

Show the name people recognize alongside the business identifier they use. For a proposal, “Addis Ababa Distribution Center · ADD-DC-01” is useful. A database UUID belongs under technical details with an explicitly labeled copy action when support needs it. Do not silently replace an unresolved site with the currently selected site; that produces a plausible but false location.

Display missing information honestly: “Site unavailable,” “Cost unavailable” or an em dash with sufficient context. Unknown is not zero. Distinguish a real recorded zero price from an absent price. Avoid formatting `null`, an empty string or a missing relationship as a valid financial amount.

Long SKUs and references may wrap at sensible boundaries or remain in a localized scroll area. Truncation is acceptable only when the full value is available through keyboard/touch interaction and the truncated form is not the only evidence supporting a consequential action. A hover-only tooltip is insufficient.

## Money, quantities and time

Currency comes from the authorized country's configuration. Identify currency wherever ambiguity is possible, especially in cross-module exports and records. Do not infer money units from the user's browser locale or aggregate different country currencies into a single total. Keep tax presentation consistent with the authorized finance configuration.

Merchandising display and calculation rules retain the repository's whole-number policy. Use the approved rounding behavior and never let formatting alter stored financial rules. When a displayed rounded margin could conceal a below-floor condition, retain an explicit Finance-clearance indicator derived from the authoritative exact comparison.

Use locale-aware formatting while preserving the underlying timestamp and timezone. For ambiguous decisions, show an unambiguous date such as “29 Oct 2026” and a timezone where relevant. Distinguish submission time, approval time, application time and last refresh. “Today” and “2 hours ago” can help scanning but should not be the only timestamp in an audit or export.

## Plain, factual interface language

Use specific verbs: “Review proposal,” “Submit request,” “Approve price change,” “Save draft” and “Retry loading.” Do not label a staged submission “Save changes” when it creates a request that still needs review. Do not say “Applied” merely because the browser sent an RPC.

An error should identify the observed failure and the available recovery. For example: “A location price changed during review. Refresh the proposal before approving.” Do not infer network failure from arbitrary error keywords or announce a solution that has not been verified. Technical details may be available separately without dominating the main message.

Prefer a short heading plus one useful sentence. Avoid redundant explanatory blocks on repeat-use screens. Be direct without blaming the worker. A permission message should explain the relevant authority boundary without publishing hidden employee data or suggesting an unauthorized workaround.

## Localization is structural

English, Amharic and Afaan Oromoo are active operational languages. POS and WMS text changes require synchronized dictionaries, including labels, status, errors, modal copy, screen-reader labels and scanner feedback. Use the established language conventions and authentic East Hararghe Afaan Oromoo terminology where the repository requires it. Never concatenate fragments that translators cannot order naturally.

Allow longer translations to wrap. Avoid fixed-height labels, compressed line height and text inserted into SVG images. Test Ethiopic script coverage and baseline alignment with the actual deployed fonts; Latin screenshots cannot establish Amharic legibility. Search and sorting need locale-aware behavior where supported, with identifiers preserved exactly.

Keep amounts, dates, variable names and plural forms in translation-aware messages. Do not build a singular/plural rule that only works in English. Persisted business codes should remain stable while their human labels are translated. Future right-to-left support must have an explicit implementation and review plan rather than an untested claim of automatic support.

## Content acceptance

A reviewer should be able to distinguish unknown, zero and unavailable; identify the correct site without reading a UUID; understand whether an action saves a draft or applies a decision; and read all required evidence with enlarged text. Test long names, non-Latin scripts, mixed-length currencies, zero/negative values where permitted and realistic error messages. Brand consistency must never depend on clipping a worker's language.
