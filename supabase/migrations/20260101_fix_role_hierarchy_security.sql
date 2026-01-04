-- Fix Security Definer View issue by enabling security_invoker
-- This ensures the view respects Row Level Security (RLS) policies of the querying user
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#views

ALTER VIEW public.role_hierarchy SET (security_invoker = true);
