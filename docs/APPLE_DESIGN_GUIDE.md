# SIIFMART Apple Design Guide (iOS 27 / Liquid Glass, refined)

> Reference guideline for all web UI. Referenced from `.agents/AGENTS.md`.
> Values are a web translation of Apple's Liquid Glass language (iOS/macOS 26, refined in iOS 27). Verify against Apple's Human Interface Guidelines before treating them as official Apple tokens.
> Project rules in `.agents/AGENTS.md` (multi-country, Fulfillment low-end mobile, brand logo, zero emoji) take precedence over this guide.

---

## 1. What iOS 27 changes for us

| iOS 27 shift | Web implication |
|---|---|
| Transparency is user-controlled | Every glass surface needs a solid fallback. Use `prefers-reduced-transparency` / `prefers-contrast`; glass opacity is a CSS variable. |
| Legibility over spectacle | Glass fills are more opaque (70-88%). Text must pass WCAG AA over any content scrolling underneath. |
| Smoother, quieter edges | Thin 1px highlight, soft shadows, no heavy outlines, no neon/rim glows. |
| Sharper, layered icons | Crisp strokes, squircle tile with tinted fill. No blurry or flat-gradient icons. |
| Cross-platform consistency | Same tokens everywhere: radius ladder, type scale, one accent. |

## 2. Principles

1. **Content first.** Glass is only for the floating control layer: top bar, sidebar, toolbars, sheets, modals.
2. **Three depth levels.** Canvas -> solid surfaces (cards) -> glass (floating controls).
3. **Concentric corners.** `inner radius = outer radius - padding`.
4. **Restraint.** One accent colour, hairline borders, minimal shadows.
5. **Legibility wins.** If glass hurts contrast, make it more solid.

## 3. Typography

- **UI font:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, system-ui, sans-serif`
- **Numbers, SKUs, codes:** `ui-monospace, "SF Mono", Menlo` with `font-variant-numeric: tabular-nums` for money columns.
- **Editorial / report text only:** `ui-serif` (New York).

| Style | Size / line-height | Weight |
|---|---|---|
| Large Title | 34 / 41 | 700 |
| Title 1 | 28 / 34 | 700 |
| Title 2 | 22 / 28 | 600 |
| Title 3 | 20 / 25 | 600 |
| Headline | 17 / 22 | 600 |
| Body | 17 / 22 (dense desktop UI: 14-15 / 20) | 400 |
| Subhead | 15 / 20 | 400-500 |
| Footnote | 13 / 18 | 400 |
| Caption | 12 / 16 and 11 / 13 | 400-500 |

Rules:
- Allowed weights: 400, 500, 600, 700. **No `font-extrabold` / `font-black`.**
- Titles: `-0.01em` tracking. Body: neutral tracking.
- Uppercase micro-labels are rare: 11-12px, weight 600, `tracking-wide`. Avoid 9-10px uppercase badges.
- Minimum text size: 11px.

## 4. Colour

**Light:** canvas `#F5F5F7`, surface `#FFFFFF`, primary text `#1D1D1F`, secondary `#6E6E73`, hairline `rgba(0,0,0,.08)`.

**Dark:** canvas `#000000`, surface `#1D1D1F`, primary text `#F5F5F7`, secondary `#A1A1A6`, hairline `rgba(255,255,255,.10)`.

**Accent:** only `#0071E3` (light) / `#2997FF` (dark).

**Semantic:**

| | Light | Dark |
|---|---|---|
| Green | `#34C759` | `#30D158` |
| Orange | `#FF9500` | `#FF9F0A` |
| Red | `#FF3B30` | `#FF453A` |

- Use semantic colours as tints: `/10` fill, `/20` border, full colour on text/icon.
- No decorative gradients, glow blobs, or multi-colour progress bars.
- Consume tokens from `styles/theme.css` (`var(--theme-bg-app)`, `var(--theme-bg-card)`, `var(--theme-text-primary)`, `var(--theme-border)`), not raw hex.

## 5. Cards and panels

Cards are **solid** with a 1px hairline. They are not glass.

| Element | Radius |
|---|---|
| Modals, page-level panels | 24-28px (`rounded-3xl`) |
| Cards | 16-20px (`rounded-2xl`) |
| Inputs, buttons, rows | 12-14px (`rounded-xl`) |
| Chips, badges, segmented controls | pill (`rounded-full`) |

- Add `isolate overflow-hidden` to any card containing a table or a filled header (prevents WebKit corner bleed). Give filled headers/footers matching `rounded-t-*` / `rounded-b-*`.
- Group with spacing first, hairlines second. Avoid boxes inside boxes.
- Light shadow: `0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)`. In dark mode use borders, not shadows.

## 6. Liquid Glass tokens (floating layer only)

```css
:root { --glass-alpha: .78; --glass-blur: 24px; }

.glass {
  background: rgba(255,255,255,var(--glass-alpha));
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid rgba(255,255,255,.5);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.6), 0 8px 32px rgba(0,0,0,.08);
}
.dark .glass { background: rgba(29,29,31,var(--glass-alpha)); border-color: rgba(255,255,255,.10); }

@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass { background: var(--theme-bg-card); backdrop-filter: none; }
}
```

| Tier | Use | Blur | Alpha |
|---|---|---|---|
| Clear | Top bar, toolbars | 16px | .70 |
| Standard | Sidebar, popovers | 24px | .78 |
| Strong | Modals, sheets | 32px | .86 |

- Never stack glass on glass.
- Fulfillment / warehouse mobile stays **solid, no blur** (project rule).

## 7. Icons

- **Set:** Lucide (closest web match to SF Symbols). 1.5-2px stroke, `currentColor`.
- **Sizes:** 14px inline, 16px buttons, 20px headers, 24px empty states.
- **Squircle tile:** `w-7 h-7 rounded-xl bg-{color}-500/10 text-{color}-500` (20px tile for dense rows).
- One colour per meaning: action = blue, success = green, warning = amber, danger = red, info = indigo.
- No emojis. One icon weight per screen.

## 8. Controls

- **Buttons:** primary = filled accent, `rounded-xl`, 36-44px high. Secondary = subtle fill + hairline. Hover changes opacity; press `scale-[.98]`.
- **Inputs:** 40-44px high, `rounded-xl`, hairline border, 2px accent focus ring (`ring-[#0071E3]/40`).
- **Search:** `rounded-2xl` field, blue squircle search tile, `Cmd+K` hint, circular clear (`X`) button.
- **Segmented control / tabs:** pill track on subtle fill, elevated thumb.
- **Tables:** no zebra striping; 1px row hairline; sticky header on subtle fill; numbers right-aligned, mono, tabular.
- **Badges:** `rounded-full`, 11px, weight 600, tinted.
- **Touch targets:** >= 44px on touch devices.

## 9. Motion

- Easing `cubic-bezier(.2,.8,.2,1)`; 150-250ms for state changes, 300-400ms for sheets.
- Fade plus short slide (<= 8px); spring-like press scale.
- Honour `prefers-reduced-motion`. No heavy animation in Fulfillment mobile.

## 10. Layout

- 8pt spacing grid (4px for fine adjustments).
- Gutters: 16px mobile, 24-32px desktop. Max content width 1600px.
- Sidebar and top bar float as glass; the canvas scrolls underneath.

## 11. Don'ts

- No glass on cards or tables.
- No gradients, glows, or neon.
- No muddy greys (`#2C2C2E`, `#1C1C1E`) as card or page backgrounds; dark surfaces are `#000000` / `#1D1D1F` only.
- No `font-black`, no 9-10px uppercase labels, no raw hex in components.
- No per-screen accent colours beyond the single blue.

## 12. Pre-merge UI checklist

- [ ] Cards solid, correct radius ladder, concentric inner radii
- [ ] `isolate overflow-hidden` on cards with tables / filled headers
- [ ] Glass used only on floating layer, with reduced-transparency fallback
- [ ] Font weights <= 700, no text below 11px
- [ ] Semantic tokens only; one accent; zero emojis
- [ ] Lucide icons in squircle tiles with correct sizes
- [ ] Focus ring visible; touch targets >= 44px
- [ ] Contrast AA in light and dark
