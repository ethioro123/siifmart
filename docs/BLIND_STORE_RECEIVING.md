# Blind store receiving

Store/Dark Store receiving sessions see product identity and counting units but no expected shipment quantities. Pending shipment cards and API views redact quantities before arrival. Destination sessions cannot read the unredacted pre-arrival WMS/transfer rows. Source operations retain their manifests. Central executives retain their existing authorized visibility; branch managers count blindly too.

Driver arrival remains mandatory. On arrival, the existing private transfer manifest and public quantity-scrubbing mechanism protects the authoritative expected values. The receipt verification RPC never returns expected counts. One authorized receiver owns the physical count and receipt, including observed variances and conditions. No second employee or supervisor recount is required. Only a server-verified count can continue through the existing receipt workflow. Zero counts can be submitted. Damaged items remain excluded from sellable intake by the existing intake service.

Receiver identity, conditions and timestamps remain in transfer_receipt_verifications. The private arrival manifest is retained for reconciliation; the browser does not supply expected quantities or supervisory identity.

Applied to staging utykzifrblpyxlvlknsm: migrations/20261027_blind_receiving_reads.sql, migrations/20261027_blind_receipt_recount.sql, migrations/20261027_blind_receiving_redactor_grant.sql. Production was not changed. Rollback regression: tests/database/blind-store-receiving.sql.

Single-receiver policy restored by `20261027_restore_single_receiver_accountability.sql`, applied to staging `utykzifrblpyxlvlknsm`. This supersedes the recount requirement in the earlier migration.
