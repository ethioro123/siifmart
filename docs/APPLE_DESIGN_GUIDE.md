# SIIFMART UI Design Guide

This guide describes SIIFMART's internal design direction. It is inspired by clear, restrained platform UI; it does not claim to define official Apple web tokens. Existing product requirements, accessibility, and the design tokens in `styles/theme.css` take precedence over examples here.

## 1. Design for the task

- Start from the user's goal, role, device, and operating conditions. Put the primary task and its current status first.
- Reuse established components and patterns. A narrow bug fix should not trigger an unrelated redesign.
- Choose the simplest layout that makes relationships clear. Use whitespace and typography for hierarchy; add a card or divider only when it helps grouping or scanning.
- Keep terminology, control placement, and feedback consistent across modules. Adapt density to the task: operational tables may be compact, while consequential decisions need room to understand and confirm.
- Show the information needed to decide, with progressive disclosure for secondary detail. Do not hide a critical action or safety condition to make a screen look cleaner.

## 2. Tokens and surfaces

- Use semantic theme tokens for color, typography, spacing, borders, radii, and elevation. If a needed token is missing, add it centrally and reuse it; do not create local palettes in components.
- Keep surfaces distinct from the page canvas, with enough contrast in light and dark modes. Status color is supplementary: include a label, icon, or other cue.
- Use translucent materials only for floating controls when they improve context. Provide a solid fallback for reduced transparency, higher contrast, and unsupported browsers.
- Avoid decorative gradients, glow, stacked glass, heavy shadows, and unnecessary nested cards. Never place blur over dense scrolling or frequently updating content.
- Keep the SIIFMART wordmark consistent with the shared logo component.

## 3. Type, spacing, and responsive layout

- Use the established type scale and semantic text tokens. Preserve legibility at browser zoom and on small screens; do not shrink important content to fit.
- Align dense numeric values and codes for quick comparison. Use tabular numerals where the existing type system supports them.
- Follow the existing spacing scale. Group related controls and separate unrelated tasks; do not enforce arbitrary screen-space percentages where content varies.
- Design for narrow widths, keyboard appearance, and browser zoom. Keep important content in normal flow and prevent sticky controls from obscuring fields or results.
- Tables may scroll or change presentation on small screens, but must retain labels and access to every value and action.

## 4. Interaction and accessibility

- Support keyboard, touch, and assistive technology. Every control needs an accessible name, visible focus, correct semantics, and a usable disabled/loading state.
- Aim for touch targets of at least 44 by 44 CSS pixels; enlarge primary controls when the setting, gloves, or movement call for it. Never rely on hover alone.
- Keep validation close to the relevant field, explain how to recover, and preserve entered values after recoverable errors.
- Use confirmation for destructive or high-impact actions and show the actor/reason where approval rules require it. Avoid confirmation steps for routine reversible actions.
- Meet WCAG AA contrast for text and controls. Verify focus, contrast, zoom/reflow, reduced motion, and color-independent status cues in the rendered interface.
- Respect `prefers-reduced-motion`. Motion should communicate state, remain brief, and never delay a time-sensitive task.

## 5. Data and operational states

- Design loading, empty, error, offline, permission-denied, and stale-data states alongside the success state.
- Keep server-side filtering, pagination, and authorization behavior understandable in the UI. Never imply that a hidden or disabled control is the only security boundary.
- For financial, inventory, and approval actions, show the amount or quantity being changed, the relevant source/target, and the result of success or failure.
- Preserve country isolation, site scope, blind-counting, dual-control, and chain-of-custody requirements in every view and state.

## 6. POS and Fulfillment on mobile

POS and Fulfillment must remain responsive on phones and tablets. Fulfillment scanning has the strictest performance needs because workers may use low-powered devices while moving and handling stock.

- Keep the task target, item identity, quantity, and next action glanceable. Use compact layouts only while labels and error recovery remain clear.
- Place frequent actions within comfortable reach and give scanning controls generous touch targets. Avoid unnecessary modal layers in receive, putaway, pick, and pack flows.
- Provide immediate, distinct visual scan feedback for accepted, rejected, and unrecognized codes. Audio or vibration may supplement feedback when supported and permitted; never make them the only signal.
- Support blind receiving without revealing expected quantity or shifting the remaining content unpredictably. Preserve unit and packaging descriptions.
- For putaway, keep the suggested/current location and correction path visible. For pick/pack, make the item and remaining quantity clear, with short-pick and exception paths available.
- Keep scrolling surfaces solid and animations lightweight on constrained Fulfillment devices. Test the critical scan-to-confirm path on representative hardware when available.

## 7. Visual review checklist

- Is the user's main task obvious, and is the next action easy to find?
- Are labels, hierarchy, and density appropriate for the role and device?
- Are loading, empty, error, offline, and permission states covered?
- Can keyboard and touch users complete the workflow? Is focus visible?
- Are contrast, zoom, reduced motion, and non-color status cues verified?
- Are shared tokens and components used consistently?
- Does the design preserve site/country boundaries and operational controls?
- Did a performance decision follow evidence or realistic device constraints?

## 8. Fulfillment workflow references

### Receive

- Summarize supplier/manifest, purchase-order reference, item tally, and intake status without hiding the worker's next action.
- Provide direct access to quality and batch details. Use quantity shortcuts only as optional accelerators; keep precise entry available.
- Keep blind-receiving behavior stable and preserve packaging context.

### Putaway

- Keep the current or suggested zone/location easy to scan, with a clear way to correct it.
- Keep confirmation reachable when the keyboard is open and ensure it cannot cover required fields.

### Pick

- Show target location, item identity, and required quantity together. Provide clear short-pick and exception handling without interrupting the normal path.
- Show scan/checksum status only when backed by actual validation.

### Pack and dispatch

- Make item confirmation and packed-versus-remaining quantities clear. Keep bulk actions safe and reversible until final dispatch where possible.
- Trigger label printing and hardware feedback through supported device capabilities, with a visible fallback when unavailable.

## 9. Performance and design verification

- Profile the actual route and workflow before adding memoization, virtualization, or animation restrictions. Prefer bounded queries, deferred non-critical modules, and simple rendering.
- Measure the critical workflow on representative device/network conditions. Compare with a known baseline and investigate meaningful regressions.
- Validate the actual rendered UI in supported browsers and themes. Do not infer accessibility or contrast solely from token names.
