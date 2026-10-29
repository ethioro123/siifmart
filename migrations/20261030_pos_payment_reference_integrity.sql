BEGIN;
ALTER TABLE public.sales ADD CONSTRAINT pos_mobile_reference_shape CHECK (
 (mobile_transaction_ref IS NULL OR (mobile_payment_channel IS NOT NULL AND length(mobile_payment_channel) BETWEEN 1 AND 80 AND length(mobile_transaction_ref) BETWEEN 1 AND 200))
 AND (customer_phone IS NULL OR length(customer_phone)<=40));
CREATE UNIQUE INDEX sales_uuid_receipt_unique ON public.sales(receipt_number) WHERE receipt_number ~ '^POS-[0-9a-f-]{36}$';
CREATE FUNCTION public.guard_pos_payment_metadata() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF ROW(NEW.mobile_payment_channel,NEW.mobile_transaction_ref,NEW.customer_phone) IS DISTINCT FROM ROW(OLD.mobile_payment_channel,OLD.mobile_transaction_ref,OLD.customer_phone) THEN
  RAISE EXCEPTION 'Saved POS payment references are immutable';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_pos_payment_metadata() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_pos_payment_metadata BEFORE UPDATE OF mobile_payment_channel,mobile_transaction_ref,customer_phone ON public.sales FOR EACH ROW EXECUTE FUNCTION public.guard_pos_payment_metadata();
COMMIT;
