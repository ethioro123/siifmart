# 14 · Precise component contracts

[Handbook](../APPLE_DESIGN_GUIDE.md) · Revision B, 29 October 2026

> Revision C visual update: [chapter 18](18-codex-workspace-direction.md) takes precedence for composition, geometry and workspace styling. Earlier reference artifacts are not Revision C acceptance evidence. Accessibility and business controls remain mandatory.

## SIIFMART's own design language

Our direction is modern elegance through simplicity: quiet neutral surfaces, strong alignment, a recognizable action hierarchy, readable business data and deliberate detail. Apple, Material and Fluent are useful references, not themes to copy. No platform-specific material, capsule shape, animation or navigation pattern is mandatory merely because a platform uses it.

This chapter and chapters 15–17 refine the earlier handbook's ranges into implementation defaults. These are normative targets for new or deliberately migrated components, not assertions that every existing component conforms. Prefer an existing conforming component. If it does not conform, change the shared implementation with the relevant tests instead of accumulating page-specific imitations. Security, truthful data and accessibility retain precedence.

## Measurement rules

All dimensions below are CSS pixels at a default 16-pixel root. Implement text in rem, scalable container widths and min-height rather than rigid height where text can wrap. Font metrics and translated content may increase a component's height; never clip required content to preserve a number. One-pixel borders, two-pixel focus outlines and border-compensated insets are intentional optical exceptions to the 4-pixel spacing grid.

Default density is Comfortable. Compact is for deliberate fine-pointer, comparison-heavy desktop work; coarse-pointer interaction must use Comfortable or Operational. A visible small icon may live inside a larger target. Alignment uses the layout box, not whitespace embedded in an SVG. Treat dimensions as border-box unless stated otherwise.

| Foundation | Exact default | Adaptation |
|---|---|---|
| Inline icon | 18 × 18; stroke 1.75 | 20 × 20 in 52-pixel controls; 16 × 16 in metadata |
| Icon/text gap | 8 | 4 only for noninteractive inline metadata |
| Focus outline | 2 solid; offset 2 | Maintain visibility in forced colors; never clip with overflow |
| Field radius | 10 | Same across input, select and searchable combobox |
| Button radius | 10 | Icon-only square also 10; pills reserved for filters/badges |
| Content surface radius | Major panels 28; standard cards 22; compact cards 18 | Major panels may reduce to 22 on narrow screens; preserve readable table content within the surface |
| Border | 1 | Essential boundaries use the verified strong-border role |
| Section spacing | 24 | 16 on narrow layouts; 32 between major work groups on wide layouts |
| Label/value gap | 8 | Supporting description starts 4 below its label |

## Action controls

| Variant | Min height | Inline padding | Type / line height | Icon | Purpose |
|---|---:|---:|---|---:|---|
| Compact | 36 | 12 | 14 / 20, weight 600 | 16 | Fine-pointer dense work only |
| Comfortable | 44 | 16 | 14 / 20, weight 600 | 18 | Default action |
| Operational | 52 | 20 | 16 / 24, weight 600 | 20 | Repeated touch/scanner work |
| Icon-only | 44 × 44 | Centered | Accessible name required | 18 | Familiar secondary action |

Buttons use inline-flex, centered content and an 8-pixel icon gap. Baseline alignment must remain stable when the loading indicator replaces the icon. Reserve label width during loading. Add 8 pixels between related action buttons and 16 between different groups. Primary labels may wrap when localization requires it; increase height with 10-pixel vertical padding rather than ellipsizing the action.

Primary is a neutral filled button using the paired primary foreground/background. Secondary is a bounded surface control. Tertiary is text with an optional subtle hover backing. Danger is an explicit destructive verb with a danger pairing; do not make a standard approval green solely to decorate it. One primary per active decision group is the default. Pending blocks duplicate execution and exposes busy semantics; it is not equivalent to a permission-denied disabled state.

## Text entry, selectors and validation

| Element | Exact default |
|---|---|
| Label | 14 / 20, weight 500; 8 below label before control |
| Input/select | Min height 44; horizontal padding 12; vertical padding 9; text 16 / 24, weight 400; radius 10 |
| Leading/trailing icon | 18; inset 12; text starts 8 after the icon |
| Input with clear action | Separate 44-pixel clear target; reserve trailing space; accessible name includes field |
| Help/error | 14 / 20; margin-top 8; no layout-dependent tooltip requirement |
| Form field group | 20 below preceding independent field group |
| Textarea | Min height 112; padding 12; line height 24; vertical resizing where appropriate |
| Checkbox/radio glyph | 20 × 20 inside min 44-high label target; 12 between glyph and label |
| Switch | Track 40 × 24; thumb 20; enclosing target at least 44 × 44 |
| Required marker | Text/semantic required state; do not rely on red asterisk alone |

Input text remains 16 pixels on touch-oriented forms. Use native semantics and autocomplete. A select must not visually promise a searchable list if it is only a native dropdown. Searchable options need the full combobox keyboard contract. Use at least 8 pixels between popup and anchor; popup padding 4; option min height 44 with horizontal padding 12. The current option and selected option are distinct states.

Errors use a danger boundary plus a textual reason connected through `aria-describedby`; set `aria-invalid` on the field. A validation error never removes the label. A successful save is not represented by permanently turning every field green. Show prerequisites next to an unavailable action, not only on hover over a disabled button.

## Badges, chips and counters

Status badges use min height 24, horizontal padding 8, gap 4, text 12 / 16 weight 600 and a pill radius. They are not buttons unless they perform a documented action. Selectable filter chips use min height 36 on fine pointer and 44 on touch, padding 12 and a selected indicator in addition to hue. A removable chip needs a full accessible remove action; a tiny decorative × is insufficient.

Count badges use tabular figures and min width 24. Use “99+” only when the full count remains available in the accessible name and queue; do not truncate business amounts. A zero approval count is a real checked state, a checking count is an ellipsis with a checking label, and a failed count is unavailable with a retry path.

## Panels, lists and menus

Major panels use 24-pixel padding on wide layouts and 16 on narrow layouts; object cards use 16–20; internal groups have 16-pixel gaps. Use a tonal surface difference with either a soft shadow or a quiet boundary when needed; do not combine strong framing effects. Do not nest a card simply to gain padding. Lists with mixed content use min row height 56 and 12-pixel vertical padding; allow multiline growth. A simple menu item uses min height 44 and padding 8 × 12. Menu section gaps are 8; separators have 4-pixel vertical margins.

Menus use radius 10, a strong boundary and one restrained elevation. They must reposition to remain within an 8-pixel viewport margin. Long menus scroll inside a labeled region; they must not create a second inaccessible page. Destructive actions are separated from routine actions by a divider and a clear label.

## Dialogs and sheets

| Part | Default |
|---|---|
| Dialog widths | Small 400; normal 560; evidence review 880; all capped at viewport minus 32 |
| Desktop padding | 24; header/body/footer gap 20 |
| Narrow padding | 16; viewport edge gap 16; full-screen route/sheet when evidence needs it |
| Title | 20 / 28, weight 600; close target 44 × 44 |
| Body | 16 / 24; scroll only when necessary; retain heading and action context |
| Footer | 8 between actions; 16 padding above; separator only when useful |
| Radius | 18 on floating dialog; no fake corner at a full-screen viewport edge |
| Maximum height | Visible dynamic viewport minus 32 and safe-area allowance |

Dialogs require focus containment, deliberate initial focus, background inertness and restoration. These are behavior requirements, not a claim that the current shared modal already implements them. Confirmations must identify the object and affected scope. Do not permit nested modal stacks as a substitute for a real detail workflow.

## Supporting components

Tooltips have 8 × 12 padding, 12 / 16 text, max width 280 and no exclusive task information. Hover delay is 400 ms; keyboard focus shows them without requiring a pointer. Escape dismisses. Interactive content belongs in a popover, not a tooltip.

Toast width is min(360, viewport minus 32), padding 16, gap 12, with a 44-pixel dismiss/action target when present. A routine success may remain for 5 seconds; errors or actions requiring attention persist or have a durable visible equivalent. Never let a timeout be the only route to a critical recovery action.

Empty states use a plain heading 18 / 24, body 14 / 20, max readable width 440 and one relevant action. Skeletons reserve actual content geometry and never imitate real money. Progress indicators show a percentage only when measured. Avatars are 32 for rows and 40 for identity summaries; initials and names remain available when an image fails.

## Sculpted cards and panels: the intended composition

Cards and panels are a preferred part of SIIFMART's visual identity. The objective is a futuristic, clean and elegant workspace with soft, deliberately shaped surfaces. “Not boxy” means avoiding rigid geometry, heavy outlines, flat slab-like backgrounds and cramped internal framing; it does not mean removing cards, making every surface transparent or flattening the workspace into plain text.

Use major panels to organize independent work areas such as the catalog and basket. Use smaller cards for distinct objects, such as products, where grouping helps recognition and action. Keep related content visibly coherent through shared alignment, balanced proportions and comfortable padding. A main panel may contain object cards: that relationship is intentional. Avoid additional decorative containers around the same content merely to add another border or background.

Use the existing 28-pixel radius for major desktop panels, 22 pixels for standard cards and 18 pixels for compact cards. On narrow screens major panels may use 22 pixels with 16-pixel padding; full-screen sheets respect the actual viewport edge rather than faking floating corners. Inner controls retain their own 10-pixel radius and accessible target sizes. Corners should feel soft and consistent; CSS rounded corners do not claim to reproduce a native continuous-corner algorithm.

Primary separation comes from quiet tonal differences, generous corners, space and one subtle depth cue. Prefer borderless cards with a soft shadow on light canvas, or gentle tonal elevation on dark canvas. If a boundary is needed, use a quiet hairline instead of combining strong border, ring and shadow. High-contrast borders remain appropriate for essential inputs, focus and warnings; accessibility is never sacrificed to make an edge disappear.

Default panel padding is 24 pixels on wide layouts and 16 on narrow layouts. Standard object cards use 16–20 pixels; gaps between sibling panels/cards are 16–24 pixels. These values describe breathing room, not a reason to make operational screens oversized. Keep the next action, item identity and financial evidence readable and reachable.

Depth must remain restrained and functional. No neon outlines, repeated glowing boxes, mandatory gradients, thick frames or heavy shadows on every item. Glass may be used selectively where supported and readable, but is optional. A soft solid surface can be equally futuristic. Open sections remain useful within a panel for related fields and facts; they are not a replacement for the panel/card identity the product calls for.

Review the composition in both themes and at narrow widths. Ask whether a surface feels intentionally shaped, whether its depth is calm, and whether the content has room to breathe. If a panel feels boxy, improve its radius, proportion, padding, tonal relationship and edge treatment before deciding to remove it. This direction supersedes the earlier blanket “open sections by default” correction.
