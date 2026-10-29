# 15 · State and theme specification

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Revision C, 30 October 2026

## Revision C · Complete workspace palette

These exact colors define SIIFMART's Codex-inspired target, including the main background. They are our chosen values, not official Codex tokens. This table supersedes the previous blue-gray reference palette. Map roles through shared theme tokens; do not scatter hex values into page components. Production CSS and the older reference board are not changed by this documentation update.

| Role | Light | Dark |
|---|---|---|
| Main application canvas | `#FAF9F7` | `#181818` |
| Sidebar/navigation | `#F1F0ED` | `#141414` |
| Toolbar | `#FAF9F7` | `#181818` |
| Working panel/card | `#FFFFFF` | `#202020` |
| Nested subtle surface | `#F5F4F1` | `#262626` |
| Dialog/popover | `#FFFFFF` | `#242424` |
| Input/composer | `#FFFFFF` | `#242424` |
| Hover surface | `#E9E8E4` | `#303030` |
| Pressed surface | `#DEDDD8` | `#383838` |
| Selected row/filter backing | `#E5E4DF` | `#353535` |
| Primary text | `#202020` | `#F2F2F2` |
| Secondary text | `#595959` | `#B8B8B8` |
| Muted supporting text | `#666666` | `#A3A3A3` |
| Placeholder | `#666666` | `#A3A3A3` |
| Icon | `#595959` | `#B8B8B8` |
| Decorative divider | `#DDDCD7` | `#383838` |
| Essential input/control boundary | `#858580` | `#858585` |
| Focus outline/link | `#245DC1` | `#9ABEFF` |
| Neutral selection indicator | `#202020` | `#F2F2F2` |
| Primary button background | `#202020` | `#F2F2F2` |
| Primary button foreground | `#FFFFFF` | `#181818` |
| Primary hover background | `#363636` | `#DCDCDC` |
| Primary pressed background | `#454545` | `#CCCCCC` |
| Secondary button background | `#F5F4F1` | `#262626` |
| Secondary button foreground | `#202020` | `#F2F2F2` |
| Disabled control backing | `#F1F0ED` | `#262626` |
| Disabled control text | `#666666` | `#A3A3A3` |
| Table header backing | `#F5F4F1` | `#262626` |
| Table row backing | `#FFFFFF` | `#202020` |
| Skeleton base / highlight | `#E5E4DF` / `#F1F0ED` | `#303030` / `#383838` |
| Scrollbar thumb | `#858580` | `#858585` |
| Danger foreground / backing | `#A12219` / `#FFF0EE` | `#FFB4AC` / `#39201F` |
| Success foreground / backing | `#17653A` / `#EDF8F0` | `#91D5A6` / `#1D3024` |
| Warning foreground / backing | `#795000` / `#FFF6DD` | `#E8CA82` / `#352C19` |
| Information foreground / backing | `#2453A0` / `#EEF4FF` | `#A8C7FA` / `#202C40` |

The main canvas is warm near-white in Light and neutral charcoal in Dark. Do not replace it with a blue-gray canvas, pure-black page, gradient, texture or decorative glow. The sidebar is one quiet tonal step away from the canvas; the toolbar normally shares the canvas. Main workspaces may share the canvas, while independent panels use the panel role. Do not add a brighter rectangle behind every section.

Color application is part of the layout contract: page gutters use canvas; sidebar rows use navigation; menus and dialogs use overlay; forms use input; tables use row/header roles. Reuse these layers across POS, Command, fulfillment and administration. A module must not invent a separate dark theme.

### Borders, shadows and overlays

Decorative dividers separate already understandable groups and are not essential control boundaries. Inputs and otherwise ambiguous controls use the stronger essential-boundary role. Focus uses a two-pixel outline, offset two, without opacity reduction. Neutral selected backing needs a check, leading mark or semantic selection state; hover is not selection.

Light floating-panel shadow: `0 2px 8px rgba(0,0,0,0.04)`. Light dialog shadow: `0 16px 48px rgba(0,0,0,0.14)`. Dark resting panels use tonal elevation without a default shadow; dark dialog shadow may use `0 16px 48px rgba(0,0,0,0.35)`. Use at most one quiet resting depth cue per surface.

Modal backdrop: `rgba(0,0,0,0.32)` in Light and `rgba(0,0,0,0.56)` in Dark. Blur is optional and never required for legibility. Text and controls stay on solid surfaces. Do not lower an entire disabled component's opacity; retain readable explanatory text.

### Verification and mapping

Normal text must achieve 4.5:1 on every surface where it appears; essential control boundaries and focus need 3:1 against adjacent surfaces. Validate hover, selected, pending and disabled combinations, not only a resting card. Status foregrounds are paired with their specified status backing. Do not use a pale status backing as a text color or a decorative divider as an input boundary.

The earlier reference checker and screenshots still describe the old board. They do not validate this new palette. Verify these pairs independently, then migrate theme roles centrally and review representative rendered screens before claiming deployment. Retain device-led appearance, forced-color behavior and user overrides.

## Interaction-state matrix

| State | Visual contract | Behavior/semantics |
|---|---|---|
| Resting | Correct foreground/backing/boundary role | Native control identity and accessible name |
| Hover | Primary uses primary-hover; other controls use hover surface | No layout movement or exclusive information |
| Keyboard focus | 2-pixel accent outline, offset 2 | `:focus-visible`; no outline suppression without replacement |
| Pressed | Primary retains hover pair plus 1-pixel inset cue; secondary uses selected backing | No scale movement required; do not move a repeat-use target |
| Selected | Selected surface, primary text, accent marker/check | Expose checked/selected/pressed state as appropriate |
| Disabled | Surface backing, muted text, essential boundary; no global opacity reduction | Native disabled for unavailable submission, explanatory text adjacent |
| Pending | Original action geometry; spinner/status replaces icon, not the whole label | Busy state; suppress duplicates; preserve safe cancel semantics |
| Invalid | Danger boundary, textual error, primary input value | `aria-invalid`, description association; retain typed value |
| Read-only | Normal readable text and surface; no misleading edit affordance | `readonly` where supported; content remains selectable |
| Unavailable | Clear explanation and supported retry | Do not render zero, success or an empty list as a substitute |

Disabled text here intentionally remains readable rather than relying on the inactive-component contrast exception. Read-only differs from disabled: users can still inspect and copy the value. Avoid adding an unimplemented “pressed” class to every element; use the state contract relevant to that component's semantics.

## State priority

A disabled control does not acquire hover styling. A focused invalid field retains its error boundary and a separate focus outline. A pending action retains its purpose and object context; it cannot simultaneously appear confirmed. A selected row may also be focused, so selection must not replace the focus ring. A background query error must not silently upgrade stale content to current evidence.

Priorities are: security/availability, invalid or conflict information, busy state, focus, selection, hover, resting. This priority determines behavior and preservation of cues; it does not mean hiding a focus indicator because an error exists. Never use one background color to represent several mutually exclusive meanings without text.

## Motion and opacity

Use existing 120 ms for hover/focus color feedback and 200 ms for local disclosure. Temporary larger overlays may use 200–320 ms when profiling supports it. Reduced motion removes positional and scaling transitions. No global opacity multiplier is permitted on a whole record containing required text simply because one action is disabled.

A material effect, if approved for a specific control layer, needs additional compositing tests beyond this solid palette. The reference target does not require glass, gradients, glow, animated backgrounds or wallpaper. Elegance comes from consistent structure and spacing.

## Theme behavior

System remains the default. An explicit theme preference persists independently of the resolved OS theme. Theme changes must not reset entered values, selection or pagination. Both themes use the same information, control hierarchy and keyboard path. Forced colors must retain essential borders and focus through system-aware styling rather than hardcoded palette enforcement.

When migrating a token, test every known role using it: a muted color used for required body text cannot be fixed by declaring that body text “metadata.” Correct semantic use and color together. Status foreground/backing pairs must be kept as pairs; a pale dark-mode foreground cannot be reused on a light status tint.
