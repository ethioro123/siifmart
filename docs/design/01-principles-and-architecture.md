# 01 · Product principles and information architecture

[Handbook](../APPLE_DESIGN_GUIDE.md) · Edition 29 October 2026

## Design quality is observable

A good SIIFMART screen answers three questions quickly: where am I, what needs my attention, and what happens next? Visual polish supports these answers through proportion, typographic hierarchy, consistent alignment and calm state changes. A fashionable surface cannot compensate for a misleading number, a missing review destination or an action whose consequence is unclear.

Measure quality against real work. A warehouse operator should distinguish the next location and item without reading an administrative dashboard. A country commercial director should compare price impact across locations without opening a hundred independent requests. A cashier should finish a normal sale without navigating configuration. These are different information architectures inside one coherent product.

## Begin with a task contract

Before choosing a component, specify the actor, trigger, object, scope, action and confirmed result. For example: a country commercial director opens a pending price proposal, compares the included locations and approves a frozen set of changes. The interface must identify the requester, show the scope, provide review evidence and distinguish approval from application. If any part is unknown, design an honest unavailable state.

Describe the normal path and meaningful exceptions together. Examples include a cost changing during review, a disconnected scanner, an expired approval identity and a request already completed by someone else. An exception should explain the current situation without forcing the person to reconstruct the whole workflow.

## Information hierarchy

Use three reading levels. First is task identity: title, object reference and current state. Second is decision information: values, exceptions and the primary action. Third is supporting evidence: history, raw payloads, system identifiers and diagnostic detail. The third level remains available where useful but should not occupy the default reading path.

One primary action per active decision area is the default. A page may contain multiple independent objects, but each object must have an unambiguous next step. Separate global actions such as creating a request from row actions such as reviewing one existing request. Avoid presenting every available capability at equal visual weight.

Page headings should name the work. Prefer “Purchase orders,” “Price proposals” and “Receiving” to decorative command language. Existing product names can remain where necessary, but new names should help a worker predict the contents. Do not add subtitles that repeat the heading without improving orientation.

## Navigation layers

| Layer | Purpose | Expected behavior |
|---|---|---|
| Application shell | Move between authorized modules; reach account and global inbox | Stable location and naming across routes |
| Module navigation | Move between a small set of related workflows | Current destination clearly selected and deep-linkable |
| Working-set controls | Search, filter, sort, switch status and paginate | Preserve scope and show active restrictions |
| Object navigation | Open a record, compare evidence or return to a queue | Restore useful list context on return |
| Temporary tools | Resolve a focused choice or confirmation | Close predictably and return focus |

Do not let these layers compete for the same horizontal strip. A module with a crowded header should demote secondary tools into a labeled menu or a second local toolbar. It should not squeeze all controls into icon-only buttons with identical shapes.

## Progressive disclosure

Keep common information visible and reveal specialist detail when requested. A compact approval indicator can show an actionable count and open the full review queue. A proposal summary can show the affected SKU, location count and a material exception while a dedicated review provides per-location evidence. A receipt can show the business reference while technical trace identifiers remain copyable under details.

Disclosure must preserve agency. Do not hide fees, affected locations, irreversible consequences or reasons an action is blocked. Do not require hover to discover essential facts. Hidden technical detail is appropriate; hidden decision evidence is not.

A collapsed area should have a clear label and meaningful initial summary. Preserve expansion within the same task when helpful, but do not carry sensitive content or stale record selection between identities or countries. Expanding a section must not unexpectedly move the primary action far from keyboard focus.

## Density and attention

Allocate space according to information value. The main content should begin soon after page identity and essential controls. Avoid tall introductions, repeated metric cards and oversized empty surfaces on frequently used operational pages. Compactness is achieved by removing repetition and grouping related facts, not by making text difficult to read.

Use banners for immediate, consequential conditions. Use inline status for local validation or refresh. Use the inbox for persistent work. A request awaiting someone else's review does not justify a warning banner on every page. Reserve visual urgency for urgency supported by real state or policy.

If a page has several important tasks, group them into predictable sections with distinct headings. Do not arbitrarily limit every page to three cards or impose an aesthetic percentage of empty space. Compare the proposed design with the user's actual working set and task frequency.

## Context and authority

Country and site context are part of the work, but must not become an invitation to bypass scope. The central authorized country switch is the only country-switching surface. Ordinary employees inherit their permitted country and site. Do not introduce per-page country pickers or repeated tenancy banners.

Display a specific object's scope when needed for a decision: “ADD regional scope · 12 locations” or “Country scope · ET · 30 locations.” This is contextual evidence, not a new tenant selector. If scope cannot be established, show an unavailable state and prevent a consequential decision until the server can validate it.

## Search and discoverability

Use visible search where the user routinely locates an item by name, SKU, reference or site display code. State what is searchable through a concise accessible label. Keep advanced filters separate from plain text search, and show how to clear restrictions. A no-results state should help distinguish an empty business dataset from an over-restrictive search.

A command palette may accelerate navigation for experienced desktop users. It must not become the only route to a task, invent a global shortcut that conflicts with browser or assistive technology, or surface unauthorized records. Search results need object identity and enough context to distinguish similar names.

## Architecture acceptance

The reviewer should be able to identify the page's purpose, current scope and next action without reading hidden help. A new employee should have a visible route to the normal task; an experienced employee should have a short repeatable path. Return navigation should preserve useful state without reviving a completed decision. Error and permission states should explain the next available step, not expose implementation internals.

Apple's [layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout) informs the emphasis on related information and familiar structure. The specific navigation layers and task contracts here are SIIFMART standards.
