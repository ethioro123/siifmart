ALTER TABLE public.pos_cash_drops DROP CONSTRAINT pos_cash_drops_status_check;
ALTER TABLE public.pos_cash_drops ADD CONSTRAINT pos_cash_drops_status_check CHECK (
 status IN ('pending_supervisor','cancelled_at_close','deposited_in_safe','transferred_to_bank','audited','variance_flagged')
);
