-- Migration: Calibrate Sovereign Expense Approval Threshold & Clean False 500 ETB Escalations
-- Applied to supabase-staging per Rule 9

DO $$
BEGIN
  -- 1. Calibrate system-wide default expense approval threshold to 100,000 ETB
  UPDATE public.system_config
  SET expense_approval_limit = 100000.00
  WHERE id = '00000000-0000-0000-0000-000000000001';

  -- 2. Clear legacy false escalations caused by former 500 ETB demo threshold
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  UPDATE public.expenses
  SET escalated_to_ceo = false,
      escalation_reason = null
  WHERE amount <= 35000.00 
    AND country_code = 'ET' 
    AND escalated_to_ceo = true 
    AND (escalation_reason LIKE '%threshold (500)%' OR escalation_reason IS NULL);
END $$;
