-- Appointment authority is checked before compensation/budget validation.
ALTER TRIGGER zy_hiring_budget ON public.employees RENAME TO zzz_hiring_budget;
