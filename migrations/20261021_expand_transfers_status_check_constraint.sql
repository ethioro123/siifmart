-- Migration: Expand transfers status check constraint to support complete operational lifecycle
-- Applied to supabase-staging per Rule 9

ALTER TABLE public.transfers DROP CONSTRAINT IF EXISTS transfers_status_check;

ALTER TABLE public.transfers ALTER COLUMN status TYPE varchar(50);

ALTER TABLE public.transfers ADD CONSTRAINT transfers_status_check CHECK (
  status IN (
    'Draft',
    'Pending',
    'Requested',
    'Approved',
    'Picking',
    'Packed',
    'Shipped',
    'Dispatched',
    'In-Transit',
    'Delivered',
    'Completed',
    'Rejected',
    'Received',
    'Cancelled',
    'Partially Delivered'
  )
);
