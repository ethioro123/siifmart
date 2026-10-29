BEGIN;
CREATE OR REPLACE FUNCTION private.finalize_pos_sale_stock(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE sale public.sales%ROWTYPE; line record; available numeric; v_reason text;
BEGIN
 SELECT * INTO STRICT sale FROM public.sales WHERE id=p_id;
 IF sale.fulfillment_status IS DISTINCT FROM 'Delivered' THEN RETURN; END IF;
 v_reason:='POS Sale — Receipt '||coalesce(sale.receipt_number,sale.id::text);
 FOR line IN SELECT product_id,sum(quantity) AS quantity FROM public.sale_items WHERE sale_id=p_id GROUP BY product_id ORDER BY product_id LOOP
  SELECT stock INTO STRICT available FROM public.products WHERE id=line.product_id FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM public.stock_movements WHERE product_id=line.product_id AND site_id=sale.site_id AND type='OUT' AND stock_movements.reason=v_reason) THEN
   IF available<line.quantity THEN RAISE EXCEPTION 'Insufficient stock for sale'; END IF;
   PERFORM public.pos_decrement_stock(line.product_id,line.quantity,sale.site_id::text,'',v_reason,sale.cashier_name,sale.sale_date);
  END IF;
 END LOOP;
END $$;

COMMIT;
