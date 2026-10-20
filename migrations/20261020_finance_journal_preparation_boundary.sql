-- Support staff can prepare unposted journals in their assigned scope.
-- Posting and period closing remain finance lead actions.
DROP POLICY IF EXISTS journal_entries_read_scoped ON public.journal_entries;
CREATE POLICY journal_entries_read_finance ON public.journal_entries FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','controller','regional_finance_officer','accountant','treasury_officer','auditor')
  AND private.finance_site_scope(site_id, country_code)
);
DROP POLICY IF EXISTS journal_entries_insert_scoped ON public.journal_entries;
CREATE POLICY journal_entries_insert_finance ON public.journal_entries FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','finance_manager','cfo','controller','regional_finance_officer','accountant','treasury_officer')
  AND private.finance_site_scope(site_id, country_code)
  AND created_by_id = (SELECT auth.uid())
  AND (lower(public.get_my_role()) NOT IN ('accountant','treasury_officer') OR NOT is_posted)
);
DROP POLICY IF EXISTS journal_entries_update_scoped ON public.journal_entries;
CREATE POLICY journal_entries_update_finance ON public.journal_entries FOR UPDATE TO authenticated
USING (
  NOT is_posted
  AND lower(public.get_my_role()) IN ('super_admin','ceo','finance_manager','cfo','controller','regional_finance_officer','accountant','treasury_officer')
  AND private.finance_site_scope(site_id, country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','finance_manager','cfo','controller','regional_finance_officer','accountant','treasury_officer')
  AND private.finance_site_scope(site_id, country_code)
  AND (lower(public.get_my_role()) NOT IN ('accountant','treasury_officer') OR NOT is_posted)
);

DROP POLICY IF EXISTS journal_lines_select ON public.journal_lines;
CREATE POLICY journal_lines_read_finance ON public.journal_lines FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.journal_entries header WHERE header.id = journal_id
));
DROP POLICY IF EXISTS journal_lines_insert ON public.journal_lines;
CREATE POLICY journal_lines_insert_finance ON public.journal_lines FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','finance_manager','cfo','controller','regional_finance_officer','accountant','treasury_officer')
  AND EXISTS (
    SELECT 1 FROM public.journal_entries header
    WHERE header.id = journal_id
      AND (NOT header.is_posted OR lower(public.get_my_role()) NOT IN ('accountant','treasury_officer'))
  )
);
DROP POLICY IF EXISTS journal_lines_update ON public.journal_lines;
CREATE POLICY journal_lines_update_finance ON public.journal_lines FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','finance_manager','cfo','controller','regional_finance_officer','accountant','treasury_officer')
  AND EXISTS (
    SELECT 1 FROM public.journal_entries header
    WHERE header.id = journal_id AND NOT header.is_posted
  )
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','finance_manager','cfo','controller','regional_finance_officer','accountant','treasury_officer')
  AND EXISTS (
    SELECT 1 FROM public.journal_entries header
    WHERE header.id = journal_id AND NOT header.is_posted
  )
);
DROP POLICY IF EXISTS journal_lines_delete ON public.journal_lines;
CREATE POLICY journal_lines_delete_finance ON public.journal_lines FOR DELETE TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','finance_manager','cfo','controller','regional_finance_officer')
  AND EXISTS (
    SELECT 1 FROM public.journal_entries header
    WHERE header.id = journal_id AND NOT header.is_posted
  )
);
