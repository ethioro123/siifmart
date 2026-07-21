-- Migration: Update enforce_product_update_restrictions trigger to allow warehouse managers, store managers, inventory managers, operations managers, procurement staff, and receivers to update product attributes and sync details during receiving.

CREATE OR REPLACE FUNCTION public.enforce_product_update_restrictions()
RETURNS TRIGGER AS $$
DECLARE
  emp_role TEXT;
  has_active_job BOOLEAN;
BEGIN
  -- Get current user's role
  emp_role := public.get_my_role();
  
  -- CEO (super_admin) and admin have bypass for all checks
  IF emp_role IN ('super_admin', 'admin') THEN
    RETURN NEW;
  END IF;

  -- A. PRICE COLUMNS CHECK
  -- Columns: price, sale_price, cost_price, is_on_sale
  IF (OLD.price IS DISTINCT FROM NEW.price OR
      OLD.sale_price IS DISTINCT FROM NEW.sale_price OR
      OLD.cost_price IS DISTINCT FROM NEW.cost_price OR
      OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale) THEN
      
      -- Only authorized managers and procurement staff can modify pricing/cost
      IF emp_role NOT IN ('procurement_manager', 'procurement', 'warehouse_manager', 'store_manager', 'inventory_manager', 'operations_manager', 'regional_manager') THEN
          RAISE EXCEPTION 'Only authorized managers and procurement staff can modify product pricing or cost fields.';
      END IF;
  END IF;

  -- B. PRODUCT DETAILS COLUMNS CHECK
  -- Columns: name, sku, category, brand, size, unit, description, image, custom_attributes, min_stock, max_stock, pack_quantity
  IF (OLD.name IS DISTINCT FROM NEW.name OR
      OLD.sku IS DISTINCT FROM NEW.sku OR
      OLD.category IS DISTINCT FROM NEW.category OR
      OLD.brand IS DISTINCT FROM NEW.brand OR
      OLD.size IS DISTINCT FROM NEW.size OR
      OLD.unit IS DISTINCT FROM NEW.unit OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.image IS DISTINCT FROM NEW.image OR
      OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes OR
      OLD.min_stock IS DISTINCT FROM NEW.min_stock OR
      OLD.max_stock IS DISTINCT FROM NEW.max_stock OR
      OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity) THEN
      
      -- Only regional_manager, operations_manager, warehouse_manager, store_manager, inventory_manager, procurement_manager, procurement, receiver can edit product details
      IF emp_role NOT IN ('regional_manager', 'operations_manager', 'warehouse_manager', 'store_manager', 'inventory_manager', 'procurement_manager', 'procurement', 'receiver') THEN
          RAISE EXCEPTION 'Only authorized managers and receiving staff can edit product details.';
      END IF;
  END IF;

  -- C. GENERAL UPDATE / OPERATIONAL ACCESS CHECK
  -- Requires manager status OR active job assignment
  IF NOT public.is_manager() THEN
      SELECT EXISTS (
          SELECT 1
          FROM public.job_assignments ja
          JOIN public.wms_jobs j ON j.id = ja.job_id
          WHERE ja.employee_id = public.get_my_employee_id()
            AND j.status IN ('Pending', 'In Progress', 'Active')
      ) INTO has_active_job;

      IF NOT has_active_job THEN
          RAISE EXCEPTION 'You do not have permission to update products (requires manager role or active job assignment).';
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger is attached to public.products
DROP TRIGGER IF EXISTS trg_enforce_product_update_restrictions ON public.products;
CREATE TRIGGER trg_enforce_product_update_restrictions
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_product_update_restrictions();
