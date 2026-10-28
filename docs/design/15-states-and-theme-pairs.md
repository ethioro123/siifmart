# 15 · State and theme specification

[Handbook](../APPLE_DESIGN_GUIDE.md) · Revision B, 29 October 2026

## A target palette, not an unverified deployment claim

The reference board uses the exact pairs below. They define a contrast-checked target for component migration. They deliberately strengthen several legacy light-mode boundaries/text colors. Production `styles/theme.css` remains unchanged by this specification task; adoption must map semantic roles centrally and verify existing callers. Never copy reference hex values independently into product pages.

The [reference checker](../../scripts/check-design-reference.py) verifies the declared solid foreground/background pairs and required boundaries mathematically. Browser inspection still verifies focus, compositing, text size and interaction. A palette check is not application-wide WCAG certification.

| Role | Light | Dark |
|---|---|---|
| Canvas | `#F6F7F9` | `#111318` |
| Content surface | `#FFFFFF` | `#1B1F27` |
| Hover surface | `#EEF1F5` | `#262D38` |
| Primary text | `#18212F` | `#F3F4F6` |
| Secondary text | `#4B5563` | `#C2C8D2` |
| Muted supporting text | `#596579` | `#A3ADBC` |
| Essential boundary | `#798493` | `#788393` |
| Decorative divider | `#D9DEE7` | `#394150` |
| Accent/focus/link | `#175CD3` | `#8AB4FF` |
| Primary button background | `#18212F` | `#F3F4F6` |
| Primary button foreground | `#FFFFFF` | `#111318` |
| Primary hover background | `#273444` | `#DDE3EC` |
| Selected surface | `#EDF3FF` | `#23344F` |
| Danger foreground / backing | `#B42318` / `#FEF3F2` | `#FDA29B` / `#341C1F` |
| Success foreground / backing | `#166534` / `#F0FDF4` | `#86EFAC` / `#142B1C` |
| Warning foreground / backing | `#854D0E` / `#FEFCE8` | `#FDE68A` / `#302714` |

Keep primary and secondary text readable on content, hover and selected surfaces. Essential boundaries are stronger than decorative dividers. The selected backing is supplemental: add a check, leading marker, appropriate selected semantics or a visible state label. A focus indicator uses the accent with a 2-pixel offset; its adjacent surface must remain known and tested.

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
