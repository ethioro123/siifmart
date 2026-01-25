# Database Schema Reference

This document describes the key database tables and their relationships.

## Core Tables

### `products`
Main inventory table for all product data.
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `sku` | TEXT | Stock Keeping Unit |
| `name` | TEXT | Product name |
| `price` | NUMERIC | Retail price |
| `cost` | NUMERIC | Cost price |
| `stock` | INTEGER | Current quantity |
| `site_id` | UUID | FK to `sites` |
| `category` | TEXT | Product category |
| `barcodes` | TEXT[] | Array of associated barcodes |
| `bin_location` | TEXT | Warehouse bin location |
| `locations` | TEXT[] | Array of locations |
| `approval_status` | TEXT | 'approved', 'pending', 'rejected' |

### `sites`
Stores and warehouse locations.
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | TEXT | Site code (e.g., SITE-0001) |
| `name` | TEXT | Site name |
| `type` | TEXT | 'store', 'warehouse', 'hub' |
| `is_fulfillment_node` | BOOLEAN | Can fulfill orders |

### `purchase_orders`
Procurement orders.
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `po_number` | TEXT | Human-readable PO number |
| `site_id` | UUID | FK to `sites` |
| `supplier_id` | UUID | FK to `suppliers` |
| `status` | TEXT | 'Draft', 'Pending', 'Approved', 'Received', 'Closed' |
| `total_amount` | NUMERIC | Total order value |

### `po_items`
Line items within purchase orders.
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `po_id` | UUID | FK to `purchase_orders` |
| `product_id` | UUID | FK to `products` (nullable for unknown items) |
| `quantity` | INTEGER | Ordered quantity |
| `received_qty` | INTEGER | Actually received |

### `wms_jobs`
Warehouse management jobs.
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `job_number` | TEXT | Human-readable job number |
| `type` | TEXT | 'PICK', 'PACK', 'PUTAWAY', 'TRANSFER', 'RECEIVE' |
| `status` | TEXT | 'pending', 'in_progress', 'completed' |
| `site_id` | UUID | FK to `sites` |

### `barcode_approvals`
Audit trail for barcode-to-product mappings.
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `product_id` | UUID | FK to `products` |
| `barcode` | TEXT | The mapped barcode |
| `status` | TEXT | 'pending', 'approved', 'rejected' |
| `image_url` | TEXT | Evidence photo URL |
| `created_by` | UUID | FK to user |

### `inventory_requests`
Pending inventory changes awaiting approval.
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `product_id` | UUID | FK to `products` |
| `request_type` | TEXT | 'edit', 'delete', 'stock_adjustment' |
| `status` | TEXT | 'pending', 'approved', 'rejected' |
| `requested_by` | TEXT | Requester name |

---

## Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `system-assets` | Evidence photos, logos | Public read, auth write |
| `avatars` | Employee profile photos | Public read, auth write |

---

## Key Relationships

```
sites ────< products
sites ────< purchase_orders ────< po_items
sites ────< wms_jobs ────< job_assignments
products ────< barcode_approvals
products ────< inventory_requests
products ────< stock_movements
```
