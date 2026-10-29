# 02 · Visual foundations and materials

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Edition 29 October 2026

> Revision C visual update: [chapter 18](18-codex-workspace-direction.md) takes precedence for composition, geometry and workspace styling. Earlier reference artifacts are not Revision C acceptance evidence. Accessibility and business controls remain mandatory.

## A coherent visual language

The intended character is precise, composed and tactile. Neutral surfaces frame the business content. A deliberate accent identifies interactive emphasis. Semantic colors communicate real conditions. Corners, borders and shadows establish consistent grouping rather than ornamenting every container.

These principles apply to both themes. Light mode should remain legible in bright retail environments; dark mode should provide separation between surfaces without relying on large glows or saturated outlines. Neither theme is a special presentation mode with fewer controls or different information.

## Token authority

`styles/theme.css` is the existing semantic token source; `index.css` maps theme values into Tailwind v4 and supplies global styles. Use the semantic role of a token rather than selecting a visually convenient hex value. Inspect legacy remapping and the final computed style when a component does not look as expected. Do not patch the same contrast issue through unrelated local color overrides.

| Role | Existing token family | Use |
|---|---|---|
| App canvas | `--theme-bg-app` | Page backdrop and major empty canvas |
| Structural panel | `--theme-bg-panel` | Navigation or surrounding workspace structure |
| Content surface | `--theme-bg-card`, `--theme-bg-card-hover` | Stable records, tables, forms and hover states |
| Local distinction | `--theme-bg-subtle` | Low-emphasis groups where text contrast is still verified |
| Primary action | `--theme-primary`, `--theme-primary-text` | Primary button background/text pair |
| Accent | `--theme-accent` and related states | Links, active emphasis and selected interaction cues |
| Text | `--theme-text-primary`, `--theme-text-secondary`, `--theme-text-muted` | Reading hierarchy; every actual pairing still needs testing |
| Borders | `--theme-border`, `--theme-border-strong`, `--theme-border-focus` | Separation, essential outlines and focus treatment |
| Status | `--theme-status-{success,warning,danger,info,neutral}-*` | Observed semantic state with text or icon support |

A token name does not prove accessibility. The current light secondary/muted colors and low-opacity borders require particular scrutiny. Existing comments claiming universal contrast ratios must not be repeated as verified results. If an intended token pair fails its role, correct the shared pair with representative regression checks rather than declaring the exception compliant.

## Surface hierarchy

Use a quiet canvas, softly sculpted main panels and purposeful object cards. A table already supplies structure through its heading, columns and rows; it rarely needs a separate card around every row. A form section can use a heading and space without another translucent panel. A selected record may justify an inspector; a basic status label does not.

Elevation should indicate temporary overlap or spatial relationship. Menus and dialogs can sit above content. Content cards need less elevation than overlays. Do not use the same strong shadow on the sidebar, header, every card, every button and every input. If a design remains understandable with shadows disabled, its basic hierarchy is probably sound.

## Material policy for October 2026

Apple places Liquid Glass primarily in a functional layer of controls and navigation. It advises restraint and distinguishes that layer from content surfaces. SIIFMART adopts that hierarchy through its own browser implementation; CSS backdrop blur is an approximation, not the native material. See [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials).

| Surface | SIIFMART default | Optional treatment |
|---|---|---|
| Global navigation or floating local toolbar | Legible panel with a clear boundary | Restrained translucency after contrast/performance checks |
| Temporary menu or small action cluster | Solid readable backing | Local material where overlap helps orientation |
| Table, chart plot, form body, financial comparison | Solid content surface | No decorative backdrop blur |
| Modal or sheet body | Solid content surface | Separate dimmed backdrop; keep text independent of underlying content |
| Continuous scanning and fast-changing worklists | Solid content surface | No background-dependent material |
| Empty state or error message | Ordinary page/content surface | No special glass or glow treatment |

The existing `.glass-clear`, `.glass-standard` and `.glass-strong` classes are implementation utilities, not compulsory tiers or official Apple web presets. A class name does not authorize its use. Never stack blurred layers or add clear glass simply because a screen feels insufficiently modern.

## Transparency and capability fallback

Start with a readable solid background. Add material only where supported and verified. Provide an opaque result when blur is unavailable, a reduced-transparency preference is detected, forced colors are active, or measured performance makes the effect unsuitable. Reduced-transparency browser support varies; do not rely on that media query as the only fallback. An explicit accessibility appearance option can supplement detection when implemented as a supported product capability.

Fallback behavior applies across the entire product. Fulfillment has especially strict continuous-scanning constraints, but POS, finance and administration must also remain usable on a constrained device. Do not infer hardware capability from a user-agent name or use assumed device wealth as a reason to remove functionality.

## Scale and geometry

Use the existing 4-pixel spacing foundation: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48 and 64 CSS pixels. Smaller gaps separate tightly related facts; larger gaps separate decisions or sections. Alignment is more important than adding exactly the same padding to every object.

The existing radii are 6, 10, 14, 18, 22 and 28 pixels, with a pill token for capsule shapes. Use 28-pixel major panels, 22-pixel standard cards, 18-pixel compact cards and smaller radii for inner controls. A large outer radius should not force a large empty gutter around dense content. Use capsules for short filter/status affordances when their shape improves recognition; do not make every input, panel and table a pill.

Keep icon sizes consistent within a context, normally 16–20 pixels in compact controls and 20–24 pixels in touch-oriented actions. The hit target can be substantially larger than the glyph. Use Lucide consistently; do not mix unrelated icon families, emoji or decorative pseudo-system symbols.

## Color and brand

Maintain the corporate wordmark through `components/Logo.tsx`. Do not rebuild it inside a new icon container or distribute its green across every control. Preserve neutral primary-action tokens and the application accent system. Status colors describe state; they are not arbitrary category decorations.

Represent selection through more than hue: use label weight, shape, a marker or a checked state. A destructive action must carry an explicit verb, not merely a red icon. A successful amount, financial gain and completed workflow are different concepts; do not assume the same green treatment is meaningful for all three.

## Visual acceptance

Review the complete theme pair with real long text, error text, disabled controls and selected rows. Check material surfaces over the lightest, darkest and most visually busy underlying content they can actually encounter. Inspect focus and contrast without relying on shadows. If the effect adds distraction, obscures evidence or slows repeated work, use the solid treatment and retain the same layout quality.

## Sculpted cards and panels: the intended composition

Cards and panels are a preferred part of SIIFMART's visual identity. The objective is a futuristic, clean and elegant workspace with soft, deliberately shaped surfaces. “Not boxy” means avoiding rigid geometry, heavy outlines, flat slab-like backgrounds and cramped internal framing; it does not mean removing cards, making every surface transparent or flattening the workspace into plain text.

Use major panels to organize independent work areas such as the catalog and basket. Use smaller cards for distinct objects, such as products, where grouping helps recognition and action. Keep related content visibly coherent through shared alignment, balanced proportions and comfortable padding. A main panel may contain object cards: that relationship is intentional. Avoid additional decorative containers around the same content merely to add another border or background.

Use the existing 28-pixel radius for major desktop panels, 22 pixels for standard cards and 18 pixels for compact cards. On narrow screens major panels may use 22 pixels with 16-pixel padding; full-screen sheets respect the actual viewport edge rather than faking floating corners. Inner controls retain their own 10-pixel radius and accessible target sizes. Corners should feel soft and consistent; CSS rounded corners do not claim to reproduce a native continuous-corner algorithm.

Primary separation comes from quiet tonal differences, generous corners, space and one subtle depth cue. Prefer borderless cards with a soft shadow on light canvas, or gentle tonal elevation on dark canvas. If a boundary is needed, use a quiet hairline instead of combining strong border, ring and shadow. High-contrast borders remain appropriate for essential inputs, focus and warnings; accessibility is never sacrificed to make an edge disappear.

Default panel padding is 24 pixels on wide layouts and 16 on narrow layouts. Standard object cards use 16–20 pixels; gaps between sibling panels/cards are 16–24 pixels. These values describe breathing room, not a reason to make operational screens oversized. Keep the next action, item identity and financial evidence readable and reachable.

Depth must remain restrained and functional. No neon outlines, repeated glowing boxes, mandatory gradients, thick frames or heavy shadows on every item. Glass may be used selectively where supported and readable, but is optional. A soft solid surface can be equally futuristic. Open sections remain useful within a panel for related fields and facts; they are not a replacement for the panel/card identity the product calls for.

Review the composition in both themes and at narrow widths. Ask whether a surface feels intentionally shaped, whether its depth is calm, and whether the content has room to breathe. If a panel feels boxy, improve its radius, proportion, padding, tonal relationship and edge treatment before deciding to remove it. This direction supersedes the earlier blanket “open sections by default” correction.
