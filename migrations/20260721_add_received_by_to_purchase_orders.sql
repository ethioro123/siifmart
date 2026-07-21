-- Migration: Add received_by column to purchase_orders
-- Purpose: Track who actually performed the physical receiving action,
-- distinct from approved_by which is the PO procurement approval.

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS received_by TEXT DEFAULT NULL;

COMMENT ON COLUMN public.purchase_orders.received_by IS
  'Name/ID of the employee who physically received the goods (receiver, picker, packer, putaway). Distinct from approved_by (PO procurement approval).';
