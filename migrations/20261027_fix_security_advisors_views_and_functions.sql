-- Migration: Fix Supabase Security Advisor Lints (0010_security_definer_view & 0028_anon_security_definer_function_executable)
-- 1. Enforce SECURITY INVOKER on public.role_hierarchy view
-- 2. Revoke anon/PUBLIC EXECUTE permissions from internal trigger functions

BEGIN;

-- 1. Security Invoker for public.role_hierarchy
ALTER VIEW public.role_hierarchy SET (security_invoker = true);

-- 2. Revoke execute on trigger functions from anon and PUBLIC
REVOKE EXECUTE ON FUNCTION public.guard_salary_request_decision() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.guard_transfer_country_sovereignty() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_salary_request_approval() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trg_inbound_qc_resolve_po_context() FROM PUBLIC, anon;

COMMIT;
