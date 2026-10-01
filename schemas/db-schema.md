# SIIFMART Database Schema Registry

> **Source of truth** for live Supabase column names. Updated by probing the live DB.
> Last probed: 2026-07-15
>
> If a service file disagrees with this registry, **this registry wins**.
> After any direct DB change in Supabase Dashboard, update this file AND create a migration.

---

## `system_logs`

| Column | Notes |
|--------|-------|
| `id` | PK, auto |
| `user_name` | **NOT NULL** |
| `action` | NOT NULL |
| `details` | nullable |
| `module` | NOT NULL |
| `ip_address` | nullable |
| `created_at` | auto |

> ⚠️ No `user_id`, `ip`, or `timestamp` columns — despite what old migrations say.

---

## `products`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `name` | |
| `sku` | |
| `barcode` | |
| `category` | |
| `price` | |
| `cost` | |
| `stock` | |
| `min_stock` | |
| `max_stock` | |
| `unit` | |
| `status` | |
| `tax_category` | |
| `brand` | |
| `supplier` | |
| `image` | |
| `weight` | |
| `expiry_date` | |
| `created_at` | auto |
| `updated_at` | auto |
| `location` | |
| `reorder_point` | |
| `reorder_qty` | |
| `shelf_life` | |
| `storage_temp` | |
| `is_active` | |
| `zone_id` | FK → warehouse_zones |
| `put_away_zone` | |
| `pick_zone` | |
| `batch_tracked` | |
| `batch_number` | |
| `margin_percentage` | |
| `approved_by` | |
| `approved_at` | |
| `rejected_by` | |
| `rejected_at` | |
| `barcodes` | jsonb, multi-barcode |
| `price_updated_at` | |
| `old_price` | |
| `product_id` | |
| `custom_attributes` | jsonb |
| `description` | |

---

## `sales`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `customer_id` | FK → customers |
| `sale_date` | |
| `subtotal` | |
| `tax` | |
| `total` | |
| `payment_method` | |
| `status` | |
| `amount_tendered` | |
| `change` | |
| `cashier_name` | |
| `created_at` | auto |
| `updated_at` | auto |
| `fulfillment_status` | |
| `receipt_number` | |
| `release_status` | |
| `country_code` | VARCHAR(10) default 'ET' (Tenant isolation) |
| `currency` | VARCHAR(10) default 'ETB' (Local tender) |

---

## `employees`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `name` | |
| `role` | |
| `email` | |
| `phone` | |
| `status` | |
| `join_date` | |
| `department` | |
| `avatar` | |
| `performance_score` | |
| `specialization` | |
| `salary` | |
| `badges` | jsonb |
| `attendance_rate` | |
| `created_at` | auto |
| `updated_at` | auto |
| `code` | employee code |
| `last_login_gps` | |
| `last_login_at` | |
| `last_login_device` | |
| `login_history` | jsonb |

---

## `sites`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `name` | |
| `type` | store / warehouse |
| `address` | |
| `status` | |
| `manager` | |
| `capacity` | |
| `terminal_count` | |
| `created_at` | auto |
| `updated_at` | auto |
| `code` | Human-readable Country-Scoped Site ID (e.g. 'KE-01', 'KE-02', 'UG-01', 'ET-01') |
| `tax_jurisdiction_id` | |
| `warehouse_bonus_enabled` | |
| `bonus_enabled` | |
| `fulfillment_strategy` | |
| `is_fulfillment_node` | |
| `barcode_prefix` | |
| `site_number` | |
| `replenishment_source_id` | FK → sites |
| `region` | |
| `logistics_zone_id` | |
| `country` | 'ET' or 'KE' (operating market) |
| `currency` | 'ETB' or 'KSh' (site local currency) |

---

## `purchase_orders`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `supplier_id` | FK → suppliers |
| `supplier_name` | |
| `order_date` | |
| `status` | |
| `total_amount` | |
| `items_count` | |
| `expected_delivery` | |
| `shipping_cost` | |
| `tax_amount` | |
| `notes` | |
| `payment_terms` | |
| `incoterms` | |
| `destination` | |
| `discount` | |
| `temp_req` | |
| `shelf_life` | |
| `dock_slot` | |
| `created_at` | auto |
| `updated_at` | auto |
| `po_number` | |
| `requested_by` | |
| `created_by` | |
| `priority` | |
| `received_by` | Name of employee who physically received the goods |
| `currency` | 'ETB' or 'KSh' (transaction currency) |
| `country_code` | 'ET' or 'KE' (multi-country tenant isolation) |

---

## `po_items`

| Column | Notes |
|--------|-------|
| `id` | PK (UUID) |
| `po_id` | FK → purchase_orders.id |
| `product_id` | FK → products.id (nullable for custom items) |
| `product_name` | Full manifest product title |
| `sku` | Master SKU (e.g. KE-GR001) |
| `quantity` | Manifest order quantity (e.g. 12 bales) |
| `unit_cost` | Wholesale cost per manifest unit |
| `total_cost` | Line total (quantity × unit_cost) |
| `retail_price` | Target consumer retail price per sellable unit |
| `image` | Product image URL |
| `brand` | Product brand name |
| `size` | Net package size (e.g. 1kg, 500g) |
| `unit` | Consumer sell unit (e.g. kg, pk, ea) |
| `category` | Product category taxonomy |
| `identity_type` | 'known' \| 'variant' \| 'new' |
| `received_qty` | Physically received quantity |
| `rejected_qty` | Rejected quantity during inbound QC |
| `pack_quantity` | Consumer units per package/bale (e.g. 12) |
| `case_size` | Packs per case (0 if direct pack) |
| `package_type` | Manifest package type (Bale, Case, Carton, Box, Sack) |
| `description` | Additional manifest / supplier notes |
| `min_stock` | Threshold minimum stock |
| `max_stock` | Threshold maximum stock |
| `custom_attributes` | JSONB 6-layer enterprise attributes |

---

## `customers`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `name` | |
| `phone` | |
| `email` | |
| `loyalty_points` | |
| `total_spent` | |
| `last_visit` | |
| `tier` | |
| `notes` | |
| `created_at` | auto |
| `updated_at` | auto |

---

## `expenses`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `created_at` | auto |
| `updated_at` | auto |
| `site_id` | FK → sites |
| `status` | |
| `amount` | |
| `category` | |
| `description` | |
| `approved_by` | |

---

## `transfers`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `created_at` | auto |
| `updated_at` | auto |
| `status` | |
| `notes` | |
| `items` | jsonb |

---

## `wms_jobs`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `type` | pick / pack / putaway / receive / transfer |
| `priority` | |
| `status` | |
| `items_count` | INTEGER (must be rounded integer, e.g. Math.ceil/round) |
| `assigned_to` | |
| `location` | |
| `order_ref` | |
| `created_at` | auto |
| `updated_at` | auto |
| `line_items` | jsonb |
| `job_number` | |
| `source_site_id` | FK → sites |
| `dest_site_id` | FK → sites |
| `transfer_status` | |
| `requested_by` | |
| `approved_by` | |
| `shipped_at` | |
| `received_at` | |
| `delivery_method` | |
| `notes` | |
| `has_discrepancy` | |
| `discrepancy_details` | jsonb |
| `tracking_number` | |
| `received_by` | |
| `delivered_at` | |
| `completed_at` | |
| `completed_by` | |
| `external_carrier_name` | |
| `assigned_by` | |

---

## `job_assignments`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `job_id` | FK → wms_jobs |
| `employee_id` | FK → employees |
| `employee_name` | |
| `assigned_at` | |
| `started_at` | |
| `completed_at` | |
| `status` | |
| `notes` | |
| `estimated_duration` | |
| `actual_duration` | |
| `units_processed` | |
| `accuracy_rate` | |
| `created_at` | auto |
| `updated_at` | auto |

---

## `warehouse_zones`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `created_at` | auto |
| `site_id` | FK → sites |
| `name` | |
| `type` | |

---

## `category_zones`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `category` | |
| `default_zone` | |
| `created_at` | auto |
| `updated_at` | auto |

---

## `stock_movements`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `product_id` | FK → products |
| `product_name` | |
| `type` | IN / OUT / ADJUST |
| `quantity` | |
| `movement_date` | |
| `performed_by` | |
| `reason` | |
| `batch_number` | |
| `created_at` | auto |

---

## `inventory_requests`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `product_id` | FK → products |
| `product_name` | |
| `product_sku` | |
| `change_type` | |
| `requested_by` | |
| `requested_at` | |
| `status` | |
| `proposed_changes` | jsonb |
| `adjustment_type` | |
| `adjustment_qty` | |
| `adjustment_reason` | |
| `approved_by` | |
| `approved_at` | |
| `rejection_reason` | |
| `rejected_by` | |
| `rejected_at` | |

---

## `suppliers`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `name` | |
| `type` | |
| `contact` | |
| `email` | |
| `phone` | |
| `category` | |
| `status` | |
| `rating` | |
| `lead_time` | |
| `tax_id` | |
| `national_id` | |
| `location` | |
| `created_at` | auto |
| `updated_at` | auto |

---

## `barcode_approvals`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `product_id` | FK → products |
| `barcode` | |
| `image_url` | |
| `status` | |
| `site_id` | FK → sites |
| `created_by` | |
| `created_at` | auto |
| `reviewed_by` | |
| `reviewed_at` | |
| `rejection_reason` | |

---

## `brainstorm_nodes`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `created_at` | auto |
| `updated_at` | auto |
| `status` | |
| `description` | |
| `notes` | |
| `completed_at` | |
| `priority` | |
| `due_date` | |

---

## `worker_points`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `employee_id` | FK → employees |
| `employee_name` | |
| `employee_avatar` | |
| `total_points` | |
| `weekly_points` | |
| `monthly_points` | |
| `today_points` | |
| `total_jobs_completed` | |
| `total_items_picked` | |
| `average_accuracy` | |
| `average_time_per_job` | |
| `current_streak` | |
| `longest_streak` | |
| `rank` | |
| `level` | |
| `level_title` | |
| `current_bonus_tier` | |
| `estimated_bonus` | |
| `bonus_period_points` | |
| `achievements` | jsonb |
| `last_job_completed_at` | |
| `last_updated` | |

---

## `points_transactions`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `employee_id` | FK → employees |
| `job_id` | FK → wms_jobs |
| `points` | |
| `type` | |
| `description` | |
| `timestamp` | |
| `created_at` | auto |

---

## `store_points`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `site_id` | FK → sites |
| `site_name` | |
| `total_points` | |
| `weekly_points` | |
| `monthly_points` | |
| `today_points` | |
| `total_transactions` | |
| `total_revenue` | |
| `average_ticket_size` | |
| `customer_satisfaction` | |
| `last_transaction_at` | |
| `last_updated` | |
| `current_tier` | |
| `estimated_bonus` | |
| `created_at` | auto |

---

## `shifts`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `created_at` | auto |
| `updated_at` | auto |
| `site_id` | FK → sites |
| `status` | Open / Closed / Audited / Flagged |
| `notes` | |
| `shift_number` | text |
| `cashier_id` | text |
| `cashier_name` | text |
| `start_time` | timestamptz |
| `end_time` | timestamptz |
| `opening_float` | numeric |
| `cash_sales` | numeric |
| `card_sales` | numeric |
| `mobile_sales` | numeric |
| `expenses` | numeric |
| `expected_cash` | numeric |
| `actual_cash` | numeric |
| `variance` | numeric |
| `denominations` | jsonb |
| `discrepancy_reason` | text |
| `closed_by` | text |
| `reconciled_by` | text (HQ approver) |
| `reconciled_at` | timestamptz |
| `reconciliation_status` | Pending / Reconciled / Discrepancy_Flagged |
| `hq_notes` | text |

---

## `staff_schedules`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `created_at` | auto |
| `updated_at` | auto |
| `site_id` | FK → sites |
| `status` | |
| `role` | |
| `employee_id` | FK → employees |
| `notes` | |

---

## `discrepancy_reports`

> ⚠️ Table exists but RLS blocks all reads for the current user. Columns unknown — probe with a service-role key or check Supabase Dashboard.

---

## `system_config`

> Live remote Supabase schema verified via probe on 2026-09-28. Columns marked with ⚠️ are pending DB migration application and are safely filtered out by `config.service.ts` allowlist.

| Column | Status | Notes |
|--------|--------|-------|
| `id` | ✅ Live | PK (uuid) |
| `store_name` | ✅ Live | text |
| `slogan` | ✅ Live | text |
| `logo_url` | ✅ Live | text |
| `brand_color` | ✅ Live | text |
| `legal_business_name` | ✅ Live | text |
| `tax_vat_number` | ✅ Live | text |
| `registered_address` | ✅ Live | text |
| `support_contact` | ✅ Live | text |
| `support_phone` | ✅ Live | text |
| `currency` | ✅ Live | text ('ETB', 'KES', 'KSh', etc.) |
| `timezone` | ✅ Live | text ('Africa/Addis_Ababa', 'Africa/Nairobi') |
| `date_format` | ✅ Live | text ('DD/MM/YYYY', etc.) |
| `number_format` | ✅ Live | text ('1,000.00', etc.) |
| `language` | ✅ Live | text ('en', 'am', 'or') |
| `tax_rate` | ✅ Live | numeric (15 for ET, 16 for KE) |
| `default_vat_rate` | ✅ Live | numeric |
| `low_stock_threshold` | ✅ Live | integer |
| `fefo_rotation` | ✅ Live | boolean |
| `bin_scan` | ✅ Live | boolean |
| `enable_loyalty` | ✅ Live | boolean |
| `enable_wms` | ✅ Live | boolean |
| `multi_currency` | ✅ Live | boolean |
| `require_shift_closure` | ✅ Live | boolean |
| `pos_terminal_id` | ✅ Live | text |
| `pos_register_mode` | ✅ Live | text ('cashier', 'kiosk') |
| `pos_guest_checkout` | ✅ Live | boolean |
| `pos_block_negative_stock` | ✅ Live | boolean |
| `pos_digital_receipts` | ✅ Live | boolean |
| `pos_auto_print` | ✅ Live | boolean |
| `payment_cash` | ✅ Live | boolean |
| `payment_card` | ✅ Live | boolean |
| `payment_mobile_money` | ✅ Live | boolean |
| `payment_store_credit` | ✅ Live | boolean |
| `fiscal_year_start` | ✅ Live | text |
| `accounting_method` | ✅ Live | text |
| `tax_inclusive` | ✅ Live | boolean |
| `tax_on_selling` | ⚠️ Pending Migration | boolean (default true) — toggle VAT/Tax on retail sales / POS |
| `tax_on_purchasing` | ⚠️ Pending Migration | boolean (default true) — toggle VAT/Tax on purchase orders / buying |
| `withholding_tax` | ✅ Live | numeric |
| `max_petty_cash` | ✅ Live | numeric |
| `expense_approval_limit` | ✅ Live | numeric |
| `default_credit_limit` | ✅ Live | numeric |
| `receiving_logic` | ✅ Live | text |
| `qc_sampling_rate` | ✅ Live | numeric |
| `qc_block_on_failure` | ✅ Live | boolean |
| `putaway_logic` | ✅ Live | text |
| `rotation_policy` | ✅ Live | text |
| `require_expiry` | ✅ Live | boolean |
| `cycle_count_strategy` | ✅ Live | text |
| `picking_method` | ✅ Live | text |
| `strict_scanning` | ✅ Live | boolean |
| `reserve_stock_buffer` | ✅ Live | numeric |
| `webhook_order_created` | ✅ Live | text |
| `webhook_inventory_low` | ✅ Live | text |
| `webhook_customer_signup` | ✅ Live | text |
| `scale_ip_address` | ✅ Live | text |
| `scanner_com_port` | ✅ Live | text |
| `pos_receipt_logo` | ✅ Live | text |
| `pos_receipt_show_logo` | ✅ Live | boolean |
| `pos_receipt_header` | ✅ Live | text |
| `pos_receipt_footer` | ✅ Live | text |
| `pos_receipt_address` | ✅ Live | text |
| `pos_receipt_phone` | ✅ Live | text |
| `pos_receipt_email` | ✅ Live | text |
| `pos_receipt_tax_id` | ✅ Live | text |
| `pos_receipt_policy` | ✅ Live | text |
| `pos_receipt_social_handle` | ✅ Live | text |
| `pos_receipt_enable_qr` | ✅ Live | boolean |
| `pos_receipt_qr_link` | ✅ Live | text |
| `pos_receipt_width` | ✅ Live | text |
| `pos_receipt_font` | ✅ Live | text |
| `tax_jurisdictions` | ✅ Live | jsonb |
| `enforce_regional_zoning` | ✅ Live | boolean |
| `updated_at` | ✅ Live | timestamptz |
| `updated_by` | ✅ Live | text |
| `country` | ⚠️ Pending Migration | text ('ET', 'KE') — derived via currency/timezone |
| `tax_authority` | ⚠️ Pending Migration | text — mapped in client |
| `compliance_standard` | ⚠️ Pending Migration | text — mapped in client |
| `e_tims_enabled` | ⚠️ Pending Migration | boolean — mapped in client |
| `country_configs` | ⚠️ Pending Migration | jsonb — stored locally/in-memory |
| `bonus_enabled` | ⚠️ Pending Migration | boolean |
| `bonus_tiers` | ⚠️ Pending Migration | jsonb |
| `bonus_payout_frequency` | ⚠️ Pending Migration | text |
| `warehouse_points_eligible_roles` | ⚠️ Pending Migration | jsonb |
| `warehouse_point_rules` | ⚠️ Pending Migration | jsonb |
| `pos_bonus_enabled` | ⚠️ Pending Migration | boolean |
| `pos_bonus_tiers` | ⚠️ Pending Migration | jsonb |
| `pos_bonus_payout_frequency` | ⚠️ Pending Migration | text |
| `pos_role_distribution` | ⚠️ Pending Migration | jsonb |
| `pos_point_rules` | ⚠️ Pending Migration | jsonb |
| `mpesa_till_enabled` | ⚠️ Pending Migration | boolean |
| `mpesa_till_number` | ⚠️ Pending Migration | text |
| `mpesa_till_name` | ⚠️ Pending Migration | text |
| `mpesa_stk_enabled` | ⚠️ Pending Migration | boolean |
| `mpesa_stk_shortcode` | ⚠️ Pending Migration | text |
| `mpesa_passkey` | ⚠️ Pending Migration | text |
| `mpesa_environment` | ⚠️ Pending Migration | text |
| `mpesa_paybill_enabled` | ⚠️ Pending Migration | boolean |
| `mpesa_paybill_number` | ⚠️ Pending Migration | text |
| `airtel_money_enabled` | ⚠️ Pending Migration | boolean |
| `airtel_till_number` | ⚠️ Pending Migration | text |
| `telebirr_enabled` | ⚠️ Pending Migration | boolean |
| `telebirr_merchant_id` | ⚠️ Pending Migration | text |
| `cbe_birr_enabled` | ⚠️ Pending Migration | boolean |
| `cbe_birr_merchant_code` | ⚠️ Pending Migration | text |

---

## `discount_codes`

| Column | Notes |
|--------|-------|
| `id` | PK (text) |
| `code` | text (unique) |
| `name` | text |
| `type` | PERCENTAGE / FIXED |
| `value` | numeric |
| `min_purchase_amount` | numeric |
| `max_discount_amount` | numeric |
| `valid_from` | timestamptz |
| `valid_until` | timestamptz |
| `usage_limit` | integer |
| `usage_count` | integer |
| `per_customer_limit` | integer |
| `status` | Active / Expired / Disabled / Scheduled |
| `country_code` | text (e.g. 'ET', 'KE') |
| `currency` | text (e.g. 'ETB', 'KSh') |
| `applicable_sites` | text[] |
| `description` | text |
| `created_by` | text |
| `created_at` | timestamptz (auto) |
| `updated_at` | timestamptz (auto) |


