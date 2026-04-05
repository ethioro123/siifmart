-- =============================================================================
-- FIX: Auto-confirm Employee Accounts
-- =============================================================================
-- ROOT CAUSE: When HR creates a new employee through the app (using auth.signUp),
-- Supabase by default requires email confirmation before the user can log in.
-- Since employees have company emails (e.g., @siifmart.com) and cannot confirm
-- them immediately, they cannot log in.
--
-- FIX: Create a database trigger on auth.users to automatically confirm
-- emails when an employee is created via the app.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_confirm_employee_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Automatically confirm the email account to allow immediate login
  -- This is safe because HR is creating the account from an authenticated admin session
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  NEW.confirmed_at = COALESCE(NEW.confirmed_at, NOW());
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_confirm_employee ON auth.users;

CREATE TRIGGER trigger_auto_confirm_employee
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_employee_accounts();
