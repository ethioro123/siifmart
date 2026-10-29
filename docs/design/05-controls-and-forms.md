# 05 · Controls, forms and overlays

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Edition 29 October 2026

## Controls express a contract

A control must reveal what it does, whether it is available and what happened after activation. Use semantic HTML first. Buttons perform actions; links navigate. A clickable `div` with a pointer cursor is not an equivalent starting point. Shared controls should centralize behavior as well as appearance, including focus, busy state and accessible names.

The existing shared button and modal are reuse candidates, not certified implementations. Review the rendered states and semantics before adopting them into a new consequential workflow. Fix shared deficiencies where appropriate without forcing an unrelated module redesign.

## Button hierarchy and sizing

Use a primary button for the next principal action within an active task area. Secondary actions retain sufficient visual weight to remain discoverable. Ghost actions are suitable for genuinely lower-priority tools; they should not conceal “Cancel,” “Close” or a required recovery route against a visually busy surface.

The standard touch target is at least 44 by 44 CSS pixels. Frequent gloved or handheld actions should generally use 48–52 pixels or more when hardware testing warrants it. The existing control-height tokens provide 36, 44 and 52-pixel starting sizes. The 36-pixel variant is a desktop-density option, not a universal mobile size; it must satisfy the accessibility and spacing policy in chapter 08.

| State | Required presentation |
|---|---|
| Resting | Clear verb, stable size, identifiable boundary or grouping |
| Hover | Helpful emphasis without moving content or carrying exclusive information |
| Focus | Visible indicator independent of hover and color alone |
| Pressed/selected | Perceptible feedback and correct semantic state |
| Pending | Prevent duplicate execution where necessary; name the pending action |
| Disabled | Explain the relevant prerequisite close to the task |
| Failed | Restore a safe retry path while preserving entered information |

A spinner must not collapse the label and shift neighboring controls. For a high-impact action, keep the object or scope visible while the request runs. An icon-only action needs an accessible name and a usable hit target; where its meaning is not obvious, retain a visible label or another discoverable explanation.

## Forms and input

Put visible labels above or beside fields with a consistent relationship. Placeholder text may provide an example, but it must not be the only label or the only explanation of format. Mark required fields consistently and expose that requirement semantically. Help should describe the business expectation rather than an internal column type.

Choose input modes to support the data: numeric entry for quantities, decimal input only for domains that permit decimals, and appropriate autocomplete for identity information. Preserve leading zeroes in identifiers and PIN-like business references where they matter. Do not apply numeric quantity rules to a SKU or receipt number.

Defaults must be safe and factual. A location can default from authorized scope; an approval must not default to a broader region because a relationship lookup failed. An unavailable price or cost must not default to zero. Preserve entered values after a recoverable server error and identify any values that need fresh validation.

## Validation timing

Validate obvious format constraints before submission and authoritative business rules on the server. Show inline errors at the relevant field with an error summary when multiple fields need attention. Move focus to an appropriate summary or first invalid field on failed submission without trapping the user in repeated validation announcements.

Do not show errors for untouched fields as soon as a form opens. Validate dependencies when they change, but avoid interrupting every keystroke with a toast. When an action is unavailable because of permission, separate that fact from data-entry validation: changing a price field does not grant approval authority.

## Search, filters and selection

Search should retain the user's text during loading and expose a clear affordance for clearing it. Debounce remote search appropriately for the workflow, preserve keyboard operation and cancel or ignore obsolete results. Do not show a stale result set as though it matches the latest typed query.

Show selected filters as understandable conditions. Distinguish “Clear filters” from “Reset all settings.” For selection, state whether a checkbox selects the current page or all matching authorized records. Select-all across an entire dataset requires a precise count and scope contract; a visual checkbox cannot silently mean every location in the country.

Comboboxes and searchable selectors need correct active-option behavior, keyboard navigation and an announced selected value. Multi-select controls must remain usable with long labels and many values. Do not use a multi-select as a replacement for understanding the business scope of a bulk action.

## Overlay choice

Use an inline disclosure for supporting content that belongs in the reading flow. Use a popover for a small anchored tool or choice. Use a dialog for a focused decision that temporarily interrupts the current task. Use a full detail route when evidence, editing, history or navigation is substantial. Large workflows should not become a stack of nested modals.

Dialogs need an accessible name, deliberate initial focus, contained focus traversal, an inert background and sensible focus restoration. Escape should normally close a dismissible dialog. During a critical noncancelable operation, keep the state understandable and avoid offering a close action that falsely implies cancellation. See the [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Keep dialog bodies readable and solid. Limit height to the usable viewport and allow the content body to scroll. The action footer must not cover the last field, validation message or evidence row. On a phone, a well-structured full-screen detail can be better than a tiny centered box.

## Consequential actions

Confirmation is appropriate for irreversible or materially risky actions. State the specific object, affected count/scope and consequence. Use the actual action as the confirm label: “Reject proposal” or “Finalize dispatch.” Avoid generic “Are you sure?” copy that makes users reread the prior screen.

Do not add confirmations to ordinary reversible navigation, searching, opening review or expanding details. For reversible work, a reliable undo can be better than an interruption. Never offer undo after the server has executed an irreversible financial or inventory event unless a supported compensating workflow really exists.

## Component acceptance

Check mouse, touch and keyboard operation; resting, hover, focus, active, selected, disabled, loading and error states; long translated labels; repeated activation; and server denial. A component is ready when its behavior is predictable under interruption and its visual hierarchy remains coherent in both themes. A screenshot of the resting state is only one piece of that evidence.
