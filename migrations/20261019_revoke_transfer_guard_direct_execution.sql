-- Trigger functions are invoked by their table triggers and must not be
-- directly executable through the exposed public RPC schema.
REVOKE ALL ON FUNCTION public.guard_wms_transfer_approval()
FROM PUBLIC, anon, authenticated, service_role;
