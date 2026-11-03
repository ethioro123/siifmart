-- Area oversight is read-only for staff records. Stock requests may be opened
-- within the assigned cluster, while dispatch and receiving remain with the
-- operational roles that perform the dual handshake.
BEGIN;

DROP POLICY IF EXISTS area_manager_employee_insert_guard ON public.employees;
CREATE POLICY area_manager_employee_insert_guard ON public.employees AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
);

DROP POLICY IF EXISTS area_manager_employee_update_guard ON public.employees;
CREATE POLICY area_manager_employee_update_guard ON public.employees AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (public.normalize_role(public.get_my_role()) <> 'area_operations_manager')
WITH CHECK (public.normalize_role(public.get_my_role()) <> 'area_operations_manager');

DROP POLICY IF EXISTS area_manager_transfer_update_guard ON public.transfers;
CREATE POLICY area_manager_transfer_update_guard ON public.transfers AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (public.normalize_role(public.get_my_role()) <> 'area_operations_manager')
WITH CHECK (public.normalize_role(public.get_my_role()) <> 'area_operations_manager');

COMMIT;
