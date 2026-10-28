# 08 · Accessibility and inclusion

[Handbook](../APPLE_DESIGN_GUIDE.md) · Edition 29 October 2026

## Release baseline

Target WCAG 2.2 Level AA for the supported web product, with stronger SIIFMART requirements where defined below. This is a design and verification obligation, not a blanket claim that the current application is compliant. Native platform guidance complements the web standard; native points and browser CSS pixels are not interchangeable specifications.

Accessibility includes perception, operation and understanding. A user may work with a screen reader, physical keyboard, magnifier, voice input, a gloved hand, reduced contrast vision or a temporary injury. Common workflows must remain available without one particular sense, gesture or input device.

## Contrast and visible structure

Normal text needs at least 4.5:1 contrast against its actual background; qualifying large text needs 3:1. Large text has a specific WCAG definition; a semibold 18-pixel label is not automatically large text. Aim for 7:1 on frequently read financial and operational values when practical, while recognizing this as an enhanced product target rather than the AA minimum. See [Text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Essential control boundaries, meaningful graphical information and state indicators need 3:1 contrast against adjacent colors under the relevant criterion. A faint decorative divider need not meet the same condition if it is not necessary to identify the component. See [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Measure the rendered pair in light and dark modes. Include alpha blending, hover, focus, disabled appearance and changing content behind materials. Disabling a control does not justify making nearby explanatory text unreadable. Use text, shape, iconography or position alongside color to identify status and selection.

## Target size and pointer interaction

SIIFMART's normal touch target is 44 by 44 CSS pixels or larger. Apple describes a 44-point touch-control recommendation in its native design tips; this does not make 44 CSS pixels an official Apple web value. Frequent handheld controls should be larger when observed accuracy requires it. See [Apple design tips](https://developer.apple.com/design/tips/).

WCAG 2.2 AA target-size minimum is 24 by 24 CSS pixels, subject to defined exceptions including spacing and inline text. A compact desktop control below our normal touch target needs a verified target/spacing treatment and cannot be justified merely by calling the page enterprise software. See [Target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Provide an alternative to dragging for planogram placement, ordering or moving objects unless dragging is genuinely essential under the criterion. Offer explicit source/destination selection or move controls where appropriate. A precise drag-only interaction on a handheld scanner is not an acceptable default.

## Keyboard and focus

Every essential action must work through a keyboard with a logical traversal order. Use native controls and expected keyboard behavior. Never create a keyboard trap outside an intentional modal context. Menus, tabs, comboboxes and custom grids require their full relevant interaction pattern, not just a role attribute.

Provide a clearly visible focus indicator. SIIFMART's default is an approximately 2-pixel solid outline with useful offset and at least 3:1 visual contrast against its immediate surroundings, verified on the actual shape. This is our stronger design choice; WCAG Focus Appearance is a separate Level AAA criterion, not an AA rule. Browser-native focus may be retained where it meets the supported needs.

Focused elements must not be completely obscured by author-created content under the AA criterion. Our product target is to keep the complete interactive target visible wherever feasible, including under sticky bars and software keyboards. See [Focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

Use a skip link and meaningful landmarks for repeated shell navigation. Route changes and modal closure need a deliberate focus destination. Do not unexpectedly move focus when a background counter updates or a list refreshes.

## Screen-reader semantics

Provide a logical heading structure, descriptive control names and relationships between fields, help and errors. Icon-only actions need names that include their purpose and relevant record context. Decorative icons should not add repeated noise. A selected row and its selected checkbox should expose consistent state.

Use tables for ordinary tables; do not assign an interactive grid role unless the grid keyboard contract is implemented. Associate headers with values and include accessible sorting state. Charts need an understandable text summary and access to decision-critical data.

Use live regions intentionally. Status updates such as “Saved draft” usually need polite announcement. Errors demanding immediate attention may justify an alert. Avoid asserting every realtime counter or background refresh. A busy state should identify the affected area without repeatedly interrupting the whole page.

## Text resizing and reflow

Support 200% text enlargement and test reflow at 400% zoom or the equivalent narrow content width. Required content and actions must remain available. Do not disable user zoom, prevent text selection globally or use a fixed layout to preserve a screenshot.

Most vertical content must reflow at an equivalent 320 CSS pixel width. Meaningful two-dimensional content can require its own scrollable region, but surrounding controls and prose must still reflow. Test tables and planograms individually rather than applying the exception to a whole route. See [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

Allow translated content to grow. Check actual Amharic glyphs, mixed-script names and long Afaan Oromoo labels. A fixed-height button or row that crops a translation fails even if the English screenshot looks clean.

## Preference and environmental support

Honor `prefers-reduced-motion`; remove unnecessary transforms, large movement, parallax and automatic animated changes. Respect forced-colors behavior through semantic structure, borders and system-aware focus. Do not disable forced-color adjustment globally to preserve brand styling.

Support solid materials when reduced transparency is requested or when the browser cannot render blur reliably. The reduced-transparency media feature has uneven browser support; an opaque baseline remains necessary. A user's accessibility choice must apply to administration and POS as well as Fulfillment.

Keep sound and haptics supplementary. A scan failure must have a visible and programmatic equivalent. Do not expose sensitive expected quantities through spoken or hidden accessibility text in a blind workflow. Accessibility support must preserve the same authorized information boundary as the visual interface.

## Accessible authentication and recovery

Support password managers and paste where the authentication workflow permits; use correct autocomplete. Do not require memorization or manual transcription as the only login path when an assistive mechanism is needed. Provide meaningful challenge errors without leaking account existence or private credentials. See [Accessible authentication](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html).

Supervisor approval and OTP flows still follow their security contract. Never log secrets, display another employee's challenge or weaken separation of duties to remove a difficult interaction. Improve the authorized input and recovery path instead.

## Verification responsibility

Automated accessibility checks help identify some failures, but cannot certify focus order, meaningful names, task comprehension or real contrast over dynamic content. Complete critical tasks with keyboard-only operation and at least one relevant screen-reader/browser pairing. Record the device, browser, version, theme, zoom and tested workflow. Unverified behavior remains unverified; do not turn incomplete testing into a conformance statement.
