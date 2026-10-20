-- Cover the product-side foreign keys used by storefront catalog and order history.
create index if not exists storefront_catalog_product_idx
  on public.storefront_catalog (product_id);

create index if not exists storefront_order_items_product_idx
  on public.storefront_order_items (product_id);
