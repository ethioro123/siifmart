-- Enable RLS on barcode_approvals table

-- 1. Enable RLS
ALTER TABLE public.barcode_approvals ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive policy for authenticated users
CREATE POLICY "barcode_approvals_authenticated_access"
ON public.barcode_approvals
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
