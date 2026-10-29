# 16 · Layout and data contracts

[Handbook](../APPLE_DESIGN_GUIDE.md) · Revision B, 29 October 2026

> Revision C visual update: [chapter 18](18-codex-workspace-direction.md) takes precedence for composition, geometry and workspace styling. Earlier reference artifacts are not Revision C acceptance evidence. Accessibility and business controls remain mandatory.

## Exact defaults with content-led escape rules

These breakpoints are SIIFMART's initial layout contracts, expressed in available CSS width. They are not device categories. A panel in a wide application may still have a narrow container. Use container-aware adaptation where supported, with a working baseline; never make a newer browser capability the only way to reach an essential action.

| Available width | Page gutter | Columns / shell | Default density |
|---|---:|---|---|
| 320–599 | 16 | One task column; navigation disclosure | Comfortable; Operational for scanners |
| 600–959 | 24 | One main column; optional local two-column field groups | Comfortable |
| 960–1279 | 24 | Persistent navigation where useful; inspector becomes a route/sheet | Comfortable; Compact explicitly selected for fine-pointer tables |
| 1280+ | 32 | Main workspace and optional 360-pixel inspector, 24 gap | Same input-aware density rule |

At widths below 320 the page must still avoid clipping essentials; 320 is a verification sample, not a hard minimum-width CSS declaration. Text enlargement and long localization can trigger stacking before a breakpoint. Stack when the sum of minimum meaningful widths no longer fits. Do not shrink typography to avoid the transition.

## Shell and headers

Application chrome has a 56-pixel starting min-height, can grow with wrapping, and is separate from the page heading. A persistent sidebar starts at 240 pixels; a compact rail at 72 is optional only with fully named and discoverable destinations. Do not introduce a rail on a touch layout merely to preserve desktop geometry.

A page heading uses 28 / 36 weight 600 on wide layouts and 24 / 32 on narrow layouts. Subtitle is 14 / 20 with 4 pixels above; title group to content is 24. Actions have an 8-pixel gap and wrap as a group. On narrow layouts place them below identity with a 12-pixel gap; retain the principal action and move genuine secondary tools into a labeled menu.

No default hero, oversized icon tile or full-width decorative header card is required. Global approval awareness is a 44-high compact entry with an 18-pixel icon and a named count. Do not insert a large queue preview above the working content. A module summary and an object review are different surfaces.

## Forms and inspectors

Default readable form width is 640 pixels. Two-column field groups start only when each column retains at least 240 pixels plus a 24-pixel gap. Labels remain above controls. A textarea and long supporting evidence span the form width. Do not rearrange DOM order to achieve a visual grid that changes keyboard order.

An inspector is 360 pixels wide on a large workspace and uses 20-pixel padding. It opens only with a selected object and a clear title. Under the split-view contract, use a focused route or sheet with a visible return action. Restoring the list preserves authorized filter, sort and page context.

## Data-table anatomy

| Element | Comfortable | Compact fine-pointer | Operational touch |
|---|---:|---:|---:|
| Header min height | 44 | 40 | 48 |
| Body row min height | 52 | 40 | 60 |
| Cell horizontal padding | 16 | 12 | 16 |
| Cell vertical padding | 12 | 8 | 16 |
| Text / line height | 14 / 20 | 14 / 20 | 16 / 24 |
| Row action hit target | 44 | At least 24 with verified spacing; prefer 36 | 52 |
| Leading selection column | 52 | 44 | 60 |

Rows grow for wrapping; they do not clip text to these minima. Money/quantity align right, identity and descriptive labels align left, headings follow their data alignment. Use tabular numerals. Row action labels remain explicit. Descriptive details can wrap; exact business identifiers must remain inspectable without hover alone.

Use one decorative horizontal divider between rows. Do not add zebra striping, hover tint, colored status borders and multiple shadows simultaneously. Hover applies only to the interactive row/controls as appropriate. Selected rows use selected surface and a checkbox/marker. Keyboard focus belongs to the focused control; it must remain visible over selection.

## Width and overflow

Start identity columns at a meaningful 220 pixels, numerical columns at 112 and row actions at 120, then test the actual content. These are allocation defaults, not instructions to impose a 1,000-pixel minimum width on the whole page. A genuinely tabular comparison may scroll inside a labeled local region; surrounding controls and summaries reflow.

At narrow widths a record-list alternative shows identity, status, principal value and one review action. Required secondary evidence remains available in the detail view. Do not label a record “complete” after hiding an unavailable cost. A sticky identity column must leave enough space to inspect the comparison values.

## Toolbars, filters and pagination

A working toolbar has 12-pixel group gaps, 8 within a group and 16 below it before data. Search is min width 240 on a wide toolbar and fills the available row on narrow layouts. Filters wrap; if they move into a sheet, retain visible applied-filter count and a clear reset action. Do not hide active scope inside a collapsed sheet.

Pagination is 44-high, with 8 between navigation controls and 16 between control groups. Default page size remains 25 where the business data contract permits. “Showing 1–25 of 240” requires an authoritative total. Separate current-page selection from all-matching selection. Changes to country or identity clear unsafe selection before new records appear.

## Dashboard and analytics anatomy

A metric uses 14 / 20 label, 28 / 36 value and 13 / 20 context. Units, time basis and scope remain adjacent. A metric group has a 16-pixel gap and stacks rather than compressing values. No fixed number of metric tiles is mandatory. A comparison table or exception list can replace an irrelevant chart.

Charts have a labeled title and unit, a readable plot region and an accessible data alternative. Start charts at 240 pixels high, increasing height when labels demand it. Do not silently omit labels to fit an arbitrary chart box. Tooltip data must have an equivalent focus or text route. Loading, unavailable and no-data are separate states.

## Approval review composition

The order is object identity, current workflow stage, explicit scope, before/after evidence, material exceptions, action. Use 16 between these groups and 24 before the final action area. A grouped SKU proposal displays location count and a paginated evidence list. Its anchor site must not masquerade as the full scope. Action copy identifies whether it approves, clears, submits or applies.

A record conflict is an inline persistent condition near the decision, not a transient toast. Preserve safe user input and the selected business object while refreshing authority or evidence. The page must explain the actual next available action without inventing policy limits.

## Main workspace surface contract

Use distinct softly sculpted panels for independent work areas, such as the POS catalog and basket, with 28-pixel wide-layout corners and 16–24 pixels between sibling surfaces. Product cards inside a catalog are legitimate object grouping and use 22-pixel corners. A shared canvas unifies the composition without erasing panel identity. Prefer tonal elevation over full-strength outlines; preserve compact operational density and reachable checkout controls. See the corrected composition rules in chapter 14.
