-- Check columns for po_items table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'po_items';
