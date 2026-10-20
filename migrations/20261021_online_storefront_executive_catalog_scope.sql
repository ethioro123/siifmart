-- Keep merchandising-site rules and allow central CEO/super-admin oversight.
drop policy if exists storefront_catalog_merchandising_select on public.storefront_catalog;
create policy storefront_catalog_merchandising_select on public.storefront_catalog
  for select to authenticated
  using (
    private.merchandising_site_scope(site_id::text, null)
    or public.is_ceo()
  );

drop policy if exists storefront_catalog_merchandising_insert on public.storefront_catalog;
create policy storefront_catalog_merchandising_insert on public.storefront_catalog
  for insert to authenticated
  with check (
    private.merchandising_site_scope(site_id::text, null)
    or public.is_ceo()
  );

drop policy if exists storefront_catalog_merchandising_update on public.storefront_catalog;
create policy storefront_catalog_merchandising_update on public.storefront_catalog
  for update to authenticated
  using (
    private.merchandising_site_scope(site_id::text, null)
    or public.is_ceo()
  )
  with check (
    private.merchandising_site_scope(site_id::text, null)
    or public.is_ceo()
  );

drop policy if exists storefront_catalog_merchandising_delete on public.storefront_catalog;
create policy storefront_catalog_merchandising_delete on public.storefront_catalog
  for delete to authenticated
  using (
    private.merchandising_site_scope(site_id::text, null)
    or public.is_ceo()
  );
