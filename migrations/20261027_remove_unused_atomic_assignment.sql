-- Preserve existing assignment permissions and remove the unused experimental RPC.
DROP FUNCTION public.assign_wms_job(uuid,uuid,text);
