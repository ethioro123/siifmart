# 06 · Tables, lists and analytics

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Edition 29 October 2026

## Optimize comparison, not decoration

Operational users need to compare similar records, locate exceptions and act on a specific object. Tables are often the correct design. Replacing every row with a tall card can reduce usable information, increase scrolling and hide relationships between values. Conversely, a narrow handheld task may be better as a focused record list. Choose based on the actual reading and action pattern.

A good data surface has an identifiable title, visible scope, understandable columns, a current working set and predictable actions. It should remain useful with realistic record counts, long values, mixed statuses and unavailable fields.

## Table structure

Use semantic tables for ordinary tabular data. Column headings identify the meaning and units of values; numeric columns align consistently and use tabular figures. A row's primary identity should be visible and support navigation to details. Avoid multiple ambiguous unlabeled action icons at the row end.

Start dense desktop rows around 40–48 pixels where the content permits; comfortable/touch rows often need 48–56 or more. These are SIIFMART review starting points, not rigid heights. Wrapped content, translated labels and enlarged text can require taller rows. Do not fix the height so tightly that accessibility settings clip required evidence.

Sort controls must indicate the current column and direction, with an accessible state such as `aria-sort` on the relevant heading. A sorted display needs a stable secondary order where records otherwise tie. Changing a sort should not silently reset meaningful filters or selection without explanation.

## Status and row actions

A status label should describe the object's state, not just display a colored dot. “Pending Finance clearance,” “Ready for commercial review” and “Applied” are distinct. Keep state vocabulary consistent across the row, detail view, notification and export.

Put the frequent row action in a predictable location. Use an overflow menu for less common actions, but do not hide the essential “Review” action behind a menu merely to reduce visual weight. Row navigation and row selection should be distinguishable; clicking a checkbox must not unexpectedly open the record.

Empty cells require a consistent convention. An em dash may represent unavailable noncritical data; a consequential missing cost needs a labeled unavailable state and the correct action restriction. Financial zeros should be explicitly formatted as zeros when real.

## Bounded working sets

Use server-side pagination and explicit projections. The project default is 25 initial records, adjusted for row size and workflow; historical evidence is deferred until requested. Do not preload every request, product, employee or line item simply to populate a count or a filter.

Show the loaded range and the total when an authoritative total is available. If only a continuation token is known, provide a truthful “Load more” contract without inventing a dataset total. Distinguish a truncated preview from a complete list. A pagination control should retain country, filters, sort and relevant object context.

A review queue should count actionable business decisions, not technical child rows. A proposal covering many sites is one queue item; the site details belong inside the review. Do not inflate a badge because its backing query returns many evidence records.

## Bulk selection

Make selection scope explicit: “25 selected on this page” differs from “240 matching products selected.” Before a bulk decision, summarize the included business objects, locations, proposed change and material exceptions. Provide a way to inspect the selected set, remove unintended items and detect records that changed since preview.

Do not keep an invisible selection across a country or identity change. When an operation partially succeeds by design, show precisely which business units succeeded and retain only failed units for retry. For atomic scoped price approvals, do not present a partial-site success option; the application contract is all included locations or none.

## Narrow-screen data

Choose which values define the record and which support comparison. A mobile list can place the reference and status first, then key figures and the primary action. It must retain access to every required field. Do not hide money or exception information in a row that looks complete.

For a genuinely two-dimensional table, preserve a localized horizontal scroll region and enough row/column identity to orient the user. Sticky first columns must not consume nearly the full viewport. Provide a readable detail view for a single record rather than forcing every workflow to operate inside a horizontally scrolling grid.

## Metrics and dashboards

A metric needs a name, unit, scope and time basis. A trend needs a comparison period and a clear direction. “Average margin” should reveal whether it describes the current page, a selected set or the whole authorized catalog. Do not present page-only calculations as country-wide performance.

Use a small set of decision-relevant metrics. A screen does not become more useful because it has twelve equal-weight KPI tiles. Put exceptions and actions close to the figures they explain. Missing data, delayed synchronization and empty periods must not become convincing zeros.

Chart selection should reflect the question: bars compare categories, lines show ordered change, and tables provide precise lookup. Avoid 3D charts, decorative gradients, arbitrary dual axes and unlabeled miniature sparklines used as financial evidence. Do not create a pie chart when many small categories cannot be compared.

## Accessible visualization

Provide a concise textual conclusion and access to underlying values for decision-critical charts. Label axes, units and time periods. Distinguish series through labels, line styles or markers as well as color. Tooltips should work through focus or another equivalent interaction, not only pointer hover.

Maintain chart meaning in both themes and when colors are overridden. Do not allow animated chart entry to delay the user's access to the actual values. Large chart libraries or exported reports should be deferred when the user has not asked for them.

## Exports and historical evidence

Exports retain authorized country/site boundaries and label currency, time range, applied filters and generation time. Displayed rows, exported rows and exported totals should have a documented relationship. Never label a current-page export as a full-country export.

Price history and audit evidence need readable chronology and clear actor attribution. Separate request, approval and applied-change events. Keep raw technical evidence available to authorized support roles without forcing ordinary workers to read it. Retention and legal holds are business/data policy; a cleaner interface must not delete required history.

## Data-surface acceptance

Verify loading, true empty, filtered no-results, partial data, failed totals, stale refresh, next/previous page, selection, sorting and a completed record disappearing from the current filter. Test long site codes, unavailable costs and all supported languages. A visually elegant table that changes scope or misstates a total fails review.
