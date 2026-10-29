# 18 · Codex-inspired workspace direction

[Handbook](../APPLE_DESIGN_GUIDE.md) · Revision C, 30 October 2026

## Authority and intent

The user explicitly requested a Codex app design direction. This chapter defines SIIFMART's interpretation: calm, precise, neutral, content-led workspaces with compact navigation and progressive disclosure. It is not an official OpenAI specification or a pixel-identical reproduction. The numerical defaults are SIIFMART decisions. Do not guess undocumented Codex tokens or copy its branding.

For visual composition this chapter supersedes earlier Apple-led material guidance and mandatory floating-panel treatment. Chapters 01–17 continue to govern behavior, accessibility, operational safety and details not revised here. The protected requirement for explicit permission before editing rules remains unchanged.

## The visual target

The application should feel like one considered workspace. Give the work generous room, keep navigation quieter than content, and reveal detail on demand. Use neutral tonal layers, readable text, restrained icons and a small number of deliberate actions. Elegance comes from alignment and proportion, rather than decoration.

Cards and panels remain welcome. They must feel soft and intentional, never like stacks of outlined boxes. A sidebar or full-height workspace can meet the viewport edge; a floating object card uses rounded corners. Do not wrap every heading, metric, row or group of controls in a separate card. Do not remove meaningful catalog and basket panels merely to imitate a text chat.

## Workspace anatomy

| Region | Default contract |
| --- | --- |
| Desktop navigation | 240–272 wide; 256 starting target; quiet tonal backing; resizable or collapsible where supported |
| Compact navigation | 56–64 rail only when icons remain understandable and have accessible labels; mobile uses an explicit drawer |
| Global toolbar | 52–56 minimum height, one quiet separator if needed; location, search and account controls grouped predictably |
| Page identity | One title, optional short description, nearby primary action; avoid repeated title banners |
| Main workspace | Flexible width, 24 padding desktop and 16 mobile; 16–24 between independent work regions |
| Reading/review content | 760–960 comfortable measure; center where useful; operational tables and POS may use full available width |
| Detail inspector | 320–400 desktop, sharing the work area without hiding required evidence; narrow screens use an accessible sheet |
| Supporting information | Inline metadata, disclosure or inspector; avoid permanent diagnostic cards above the task |

At narrow widths preserve the active task and its primary action. A responsive layout is not a squeezed desktop sidebar. Retain existing country/site authority boundaries; navigation does not create a new country selector.

## Surfaces and geometry

Use a small number of semantic layers: canvas, navigation, main working surface and temporary overlay. Adjacent layers should differ subtly enough to feel coherent, while essential controls and focus remain clearly visible.

| Surface | Radius | Padding | Boundary/depth |
| --- | --- | --- | --- |
| Full-height workspace/sidebar | 0 at viewport edges | 12–16 navigation; 16–24 content | Tonal change or one separator; no decorative outer shadow |
| Independent major panel | 22–28; 24 starting target | 20–24 desktop, 16 mobile | Quiet tone; optional hairline or very soft shadow |
| Object/product card | 18–22; 20 starting target | 16–20 | Neutral resting state; clear hover/focus/selected states |
| Compact grouped surface | 14–18 | 12–16 | Avoid nested borders around related fields |
| Dialog | 24; mobile sheet follows viewport edges | 20–24, 16 narrow | Solid readable backing; overlay shadow reserved for actual elevation |
| Control | 10–12 | Existing accessible control contract | Quiet neutral hover; obvious focus; pills for chips and badges |

Do not combine a visible outline, ring, shadow and contrasting backing on every panel. Avoid oversized rounding that makes a table or dense record feel like a bubble. No neon edges, decorative gradients, repeated glass layers or glowing cards. The earlier 28/22/18 panel/card values remain compatible choices, not mandatory geometry for every surface.

## Color and theme

Use the existing semantic token system and the exact [Revision C palette in chapter 15](15-states-and-theme-pairs.md), including the main canvas, sidebar, panels, overlays, controls and states. This documentation does not change production CSS colors. Default appearance follows the device; preserve explicit Light and Dark choices.

- Light: near-white canvas, gently differentiated neutral sidebar and working surfaces; dark neutral text.
- Dark: charcoal canvas with subtle tonal elevation; avoid pure-black slabs surrounded by bright borders.
- Primary actions: high-contrast neutral fill. Brand color may identify selection or a meaningful action sparingly.
- Status: color belongs to actual warning, failure, success or business state. Pair it with text or an icon.
- Selection: quiet backing plus a persistent indicator. Hover must not look like selection.
- Focus: retain the two-pixel visible outline and required contrast; subtle aesthetics never justify invisible controls.

Do not introduce a second palette through page-specific hex values. Verify actual contrast in both themes before changing tokens.

## Typography and content

Use the existing system sans-serif stack and full Amharic/Oromo coverage. Normal body text is 14–16 with 20–24 line height. Page titles are generally 22–26, weight 600; section headings 16–18, weight 600; metadata 12–13 with sufficient contrast. Operational instructions and financial values must not shrink into metadata.

Use sentence case for headings and actions. Avoid pervasive uppercase, wide letter spacing, oversized dashboard titles and excessive bold. Use tabular numerals for amounts and counts; monospace is for identifiers or scanning evidence, not entire interfaces. Long product names wrap where identity matters.

Copy should be brief and factual. Distinguish queued, saved, approved, arrived, inspected and accepted. A tidy design must not conceal missing evidence or turn an error into zero.

## Controls, lists and interaction

Keep one recognizable primary action per decision group. Secondary actions are neutral; tertiary actions use quiet text/icon treatment. Icon-only controls need labels, tooltips where useful and accessible target areas. Preserve 44-pixel touch targets and 52-pixel repeated scanner actions. A compact 36-pixel desktop control requires the fine-pointer density rules in chapter 14.

Prefer aligned rows with subtle separators for activity, employees, approvals and history. Use cards for objects with independent identity and action. Tables retain sortable headers, bounded pagination, readable amounts and explicit loading/error states. Do not convert every row into an oversized tile.

Search and filters sit near the affected content. Use a compact filter entry and clear active-filter state; move advanced options to a drawer. Approval and product-update entry points remain compact and open one coherent review surface. Do not add duplicate bells or price-review dialogs to the same workflow.

Show actions on hover only when keyboard focus also reveals them and essential actions remain discoverable on touch. Keep undo, retry and stale-data recovery close to the affected action. Motion is short and functional, typically 120–180 ms, with reduced-motion support. Avoid continuous decorative animation.

## Operational adaptation

| Workflow | Apply the direction without losing the work |
| --- | --- |
| POS Terminal | One calm catalog region and a distinct basket; restrained product cards, readable prices, reachable Charge; no ornamental metric cards |
| POS Command | Compact identity/actions, concise operational summaries, row-based transactions; details behind deliberate disclosure |
| Fulfillment | Scanner/task-first layout, large physical actions, explicit location/item/quantity and custody state; never hide safety warnings for minimalism |
| Approvals | Compact entry, clear scope and evidence, explicit approve/reject consequences; reviewer authority remains server-enforced |
| Finance and HR | Quiet tables and inspectors; sensitive evidence only for authorized users; factual saved outcomes |

## Acceptance and rollout

Before shipping a redesigned screen, verify desktop and narrow layouts, Light/Dark, keyboard focus, touch targets, long translated labels, empty/loading/failed/stale states and the real task with representative records. Confirm panel hierarchy and primary action are clear without relying on color.

Reject a design when it has repeated framed sections, excessive pills, mandatory glass, tiny labels, low-contrast controls, hidden critical states or a decorative dashboard above the actual task. Also reject an entirely flattened layout that removes useful panel identity or makes POS/warehouse work harder.

Migrate shared primitives and one representative workflow first; review the rendered result before expanding. Do not silently restyle the whole application from a documentation task. The existing component reference remains a historical baseline until deliberately updated and visually verified for Revision C; it must not be presented as proof that this direction is deployed.
