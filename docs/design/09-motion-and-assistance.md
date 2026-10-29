# 09 · Motion, feedback and assistance

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Edition 29 October 2026

## Motion explains change

Use motion to show a relationship: a disclosure opens, a selected record becomes an inspector, an object moves to a new position or a temporary overlay appears above the current task. It should reduce uncertainty. Movement added merely to make a table, metric or navigation feel active usually competes with the work.

The existing tokens provide 120 ms, 200 ms and 320 ms durations with an application easing curve. Treat these as SIIFMART starting values: short feedback around 120 ms, ordinary local transitions around 200 ms and larger temporary-surface transitions up to about 320 ms. Do not claim these are Apple-prescribed timings. Validate the actual interaction and avoid waiting for a transition before the next action becomes possible.

## Stable geometry

Keep the primary action, amount and next scanning target spatially stable during updates. Animate opacity or a contained transition when it helps; avoid layout movement that causes a person to activate the wrong row. Realtime updates should not continuously reorder a queue under the pointer or keyboard without a deliberate ordering contract.

Reserve space for asynchronous counts, images and validation where possible. A button should not change width drastically when “Submit” becomes “Submitting.” A chart or image placeholder should have the eventual aspect ratio. A compact badge should not push every neighboring control when it crosses from 9 to 10.

Avoid animated blur, large shadow interpolation, shimmering whole-screen backgrounds and perpetual decorative pulses. No celebratory confetti after operational approvals, purchases or stock movements. A concise confirmed state is more appropriate to repeated business work.

## Reduced motion

When reduced motion is requested, remove unnecessary positional animation, scaling, parallax and large cross-screen transitions. Preserve comprehensible state changes through instant updates or brief nonspatial feedback where appropriate. Do not reduce an infinite animation to a faster infinite animation and call that support.

Loading indicators should remain understandable without movement. Use a text label such as “Checking stock…” or a static busy indication when the normal animation is suppressed. Never make motion the only way a user can tell that an operation is pending.

## Loading and progress

Choose feedback according to what is known. A brief local request may need only an inline busy state. A longer operation needs a persistent description and an indication that the rest of the interface remains usable where safe. A progress bar requires real progress information; do not invent a percentage while waiting for a server response.

Skeletons are appropriate for predictable content structure during first load. Do not show fake rows or amounts that can be mistaken for real financial data. On background refresh, preserve the readable prior content where safe and identify its freshness; do not replace the whole table with a skeleton on every navigation.

For long-running operations, distinguish accepted, queued, processing, completed and failed only when those states are backed by the actual contract. A client timeout is not proof that the server did nothing. Provide a status or reconciliation path before suggesting the user repeat an irreversible action.

## Feedback channels

| Channel | Appropriate purpose | Avoid |
|---|---|---|
| Inline field message | Format, validation or a local prerequisite | Repeated global toasts for each keystroke |
| Local status area | Refresh, saving, conflict or unavailable evidence | Clearing the working object after recoverable failure |
| Toast | Brief confirmed outcome with a durable destination if needed | Sole evidence for critical decisions or failures |
| Persistent notification | Observed event or work that can be revisited | Unverified delivery claims and duplicate event storms |
| Dialog/alert | A focused consequential decision or blocking condition | Routine navigation confirmations |
| Sound/haptic | Supplementary supported-device feedback | Exclusive confirmation or unsupported hardware promises |

Do not obscure a form field or scanner target with repeated notifications. A toast that includes an action needs enough time and an accessible route to use that action. Critical outcomes should also be visible in the underlying record or history.

## Optimism, undo and reconciliation

Optimistic presentation can improve reversible local preferences or low-impact editing where rollback is clear. It must not fabricate successful financial approval, persisted assignment, completed receipt, dispatched stock or an audit record. Use the confirmed server state for consequential operations.

If undo is offered, state what it reverses and how long it remains available. The inverse must exist in the real data contract. An undo that merely removes a row from the current screen while leaving a committed operation intact is misleading.

When another actor changes a record, preserve the current user's safe input and explain the conflict. Do not overwrite a draft silently or let a stale action appear to succeed. A refresh should keep the person oriented to the same business object and identify the updated evidence.

## Assistance and AI

AI assistance is optional to the core workflow unless a product requirement explicitly establishes otherwise. Label generated recommendations and separate them from authoritative product data or policy. Show the inputs, time basis and scope needed to judge a suggestion. Do not present a model-generated number as an observed stock count or a verified supplier fact.

Apple's [Generative AI guidance](https://developer.apple.com/design/human-interface-guidelines/generative-ai) supports honest disclosure and user understanding of generated content. SIIFMART additionally requires that recommendations cannot authorize price, procurement, finance or employee decisions. The ordinary server workflow and separation rules still apply.

Let users inspect and edit a proposed result before submission. A generated price plan should become a reviewable proposal with recorded costs and scope, not a direct product update. Keep a visible cancel/stop action for generation where supported, and distinguish stopping display from canceling server-side work. Never fabricate model confidence, source citations or completion status.

If assistance is unavailable, retain manual search, editing and review wherever the underlying product supports them. Do not strand a cashier or store worker behind an AI error screen when the normal deterministic task remains possible.

## Feedback acceptance

Test a fast response, slow response, failed response, interruption, reduced-motion preference and a record changed by another actor. Check that the correct state remains visible after a toast expires or the page reloads. Motion is accepted when it helps orientation without changing the meaning or timing of the business transaction.
