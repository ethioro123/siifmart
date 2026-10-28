# Regional product approval inbox

The global header is now the unified inbox described in `unified-approval-inbox.md`. The product-specific card and RPC below remain available.

Regional Operations, Supply Chain and Merchandising managers see a persistent Product approvals count in the header. Regional Operations and Merchandising landing pages show the oldest five pending requests and links to the relevant review queue. Other landing pages retain the header count.

This inbox covers product edits, price changes and shelf-layout revisions requiring those three departmental votes. Existing procurement alerts remain separate. It does not claim to cover HR, finance or every approval workflow.

The read-only, security-invoker RPC enforces active employee, country and region scope under existing RLS. It excludes requests created by the manager and requests already voted on by that manager or department. A complete shelf revision counts once. Errors show an unavailable state rather than a zero count.

Queries refresh on entry, navigation, window focus, reconnect, relevant mutations and country-filtered inventory request realtime events. A manual refresh is available on the card. No email or push notifications are added.

Review links open the Proposals tab and focus an individual request or whole layout revision. Show all pending requests clears that focus.

Migration: `migrations/20261028_regional_product_approval_inbox.sql`, mirrored in `supabase/migrations/20261028103705_regional_product_approval_inbox.sql`. Applied to staging and production on 2026-10-28.

Verification: 12 focused utility/service/component tests; authenticated, rolled-back staging SQL regression in `tests/sql/regional_product_approval_inbox.sql` covers departmental votes, grouping, requester exclusion and country/region boundaries. Frontend changes require the normal deployment process.
