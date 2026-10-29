-- Pending requests deliberately have no custody signer. Confirmed records retain mandatory dual control.
ALTER TABLE public.pos_cash_drops ALTER COLUMN supervisor_id DROP NOT NULL;
ALTER TABLE public.pos_cash_drops ALTER COLUMN supervisor_name DROP NOT NULL;
ALTER TABLE public.pos_cash_drops ALTER COLUMN supervisor_role DROP NOT NULL;
ALTER TABLE public.pos_cash_drops ADD CONSTRAINT cash_drop_custody_state CHECK (
 (status IN ('pending_supervisor','cancelled_at_close') AND supervisor_id IS NULL AND supervisor_name IS NULL AND supervisor_role IS NULL)
 OR (status NOT IN ('pending_supervisor','cancelled_at_close') AND supervisor_id IS NOT NULL AND supervisor_name IS NOT NULL AND supervisor_role IS NOT NULL AND supervisor_id<>cashier_id)
) NOT VALID;
