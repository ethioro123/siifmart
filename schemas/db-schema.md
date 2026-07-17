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
| `code` | |
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
| `site_id` | FK → sites |
| `status` | |
| `notes` | |

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
