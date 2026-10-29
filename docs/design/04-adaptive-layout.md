# 04 · Adaptive layout and navigation

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Edition 29 October 2026

## Adapt to available space and input

The same task may run in a desktop window, tablet split view, handheld scanner or phone with a keyboard open. Design around available content space and input capability. A device name is not a reliable layout breakpoint, and a wide display does not guarantee a mouse. Touch-enabled laptops and external keyboards on tablets are ordinary cases.

Apple's [layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout) emphasizes adaptation to changing windows, text size and safe areas. SIIFMART implements this in browser terms: flexible containers, relative sizing, meaningful breakpoints and explicit overflow behavior. Do not copy native safe-area dimensions into CSS as a fixed header height.

## Page anatomy

A normal workspace has a stable shell, a compact page heading, local actions/filters and the working content. Use a single visual baseline for headings and adjacent actions. Keep the page title distinguishable from the application navigation title. Do not wrap every header in a tall rounded card simply because the shared header currently offers that treatment.

| Area | Default behavior | When space narrows |
|---|---|---|
| Page identity | Title and concise context | Wrap naturally; avoid forced single-line truncation |
| Primary action | Close to page identity or active work | Remain visible; use a labeled full-width action only when helpful |
| Approval entry | Compact count/action | Keep an accessible name even if visible label shortens |
| Secondary actions | Inline where there is room | Move into a labeled menu without hiding the primary task |
| Filters | Clearly grouped controls | Wrap or open a focused filter sheet with applied-filter summary |
| Main content | One or more task-related panels | Stack in reading order; preserve the task context |
| Inspector | Optional side-by-side evidence | Open as a dedicated detail route or appropriate sheet |

Start with approximately 16 pixels of phone-side content padding, 24 on medium windows and 24–32 on larger workspaces, then verify the actual content. These are starting values, not mandatory empty margins around every table. Wide financial and inventory tables may use more available width than prose forms.

## Responsive transitions

Choose breakpoints when content stops working, then align with existing project conventions where possible. Check a narrow 320 CSS pixel equivalent, a typical 390-pixel phone, a 768-pixel tablet/split view and desktop windows around 1024 and 1440 pixels. These are review samples, not the only supported dimensions.

At narrow widths, prioritize task identity, required evidence and the next action. A dashboard can stack metric groups; a financial comparison may keep a labeled horizontal data region. Never hide a required value just to make a screenshot fit. Do not change the meaning or authority of an action between desktop and phone.

Keep bottom action areas above safe-area insets and the on-screen keyboard. Test real scrolling with the focused input near the bottom. A button that is reachable only after dismissing the keyboard needs a deliberate explanation or a better layout. Use dynamic viewport sizing with a compatible fallback; do not assume `100vh` always represents the visible mobile viewport.

## Reading order and focus order

DOM order should follow the logical task order. Avoid CSS reordering that makes a visual left-to-right path disagree with keyboard or screen-reader navigation. When a two-column form stacks, keep dependent fields and their help together. A right-side inspector should not interrupt the main reading path before the selected record is identified.

After route navigation, update the document/page title and provide a meaningful heading focus strategy. After closing a temporary overlay, return focus to its opener or the nearest sensible surviving control. If a saved row disappears from a filtered list, place focus on a stable queue heading or neighboring item rather than a detached element.

## Persistent and local navigation

The application sidebar must show the current module distinctly. A collapsed sidebar needs accessible labels and discoverable expansion; an icon tooltip alone does not support touch users. Navigation links remain links so they support expected browser behavior. Do not replace navigation with generic click handlers on noninteractive text.

Module tabs should represent stable destinations. Tabs that switch an in-place panel require correct tab semantics and keyboard behavior. Links that navigate routes should remain links. Do not assign `role="tab"` merely to make a row of buttons look segmented.

A horizontal tab strip can scroll locally if its overflow is discoverable and keyboard focus scrolls into view. Avoid dozens of top-level tabs. Group related tasks or provide a local section menu. A worker should not need to swipe through hidden destinations to find a frequent action.

## Sticky elements and overlap

Use stickiness to preserve essential context, not to fill every edge with controls. A sticky table header, page toolbar and bottom action bar must be tested together. Their combined height must not leave a tiny unreadable content window or cover focused controls.

Define overlap relationships intentionally through the shared layering system. Do not solve a clipping bug by inventing a larger arbitrary z-index on each feature. Menus anchored near a viewport edge should reposition or constrain themselves. Popovers must remain within the visible viewport and allow their contents to be read at zoom.

## Tables, diagrams and two-dimensional work

The page itself should reflow. Some meaningful data grids, charts and planograms need a localized two-dimensional area. Give that area a clear boundary and label, preserve visible column/axis context and provide keyboard-accessible panning or an equivalent list where appropriate. Do not use the special case for a table to justify horizontal scrolling for all surrounding text and controls.

## Adaptive acceptance

Complete the workflow in portrait and landscape, at enlarged text, with a physical keyboard and with a software keyboard. Check safe-area insets in the actual web container, including any desktop or native wrapper. Verify that filters and return navigation preserve the correct country, role and object context. A layout is accepted when the task remains understandable and operable, not when every screen has identical geometry.

For the web reflow boundary, see [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Its two-dimensional-content exception must be assessed for the specific content; it is not a blanket exemption for enterprise software.
