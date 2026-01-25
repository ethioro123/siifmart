# Mutation Hooks Reference

This directory contains React Query mutation hooks for data modifications.

## Available Hooks

| Hook | File | Purpose | Invalidates |
|------|------|---------|-------------|
| `useAdjustStockMutation` | `useAdjustStockMutation.ts` | Stock IN/OUT movements | `products` |
| `useRelocateProductMutation` | `useRelocateProductMutation.ts` | Bin/zone relocations | `products` |
| `useDeleteProductMutation` | `useDeleteProductMutation.ts` | Product deletion | `products` |
| `useBarcodeApprovalMutations` | `useBarcodeApprovalMutations.ts` | Approve/reject barcodes | `barcode_approvals` |
| `useInventoryRequestMutations` | `useInventoryRequestMutations.ts` | Pending change approvals | `inventory_requests` |

## Usage Pattern

```typescript
import { useAdjustStockMutation } from '../hooks/useAdjustStockMutation';

function MyComponent() {
  const mutation = useAdjustStockMutation();
  
  const handleAdjust = async () => {
    await mutation.mutateAsync({
      productId: 'xxx',
      quantity: 5,
      direction: 'IN',
      reason: 'Received shipment',
      performedBy: user?.name || 'System',
      canApprove: true // Determines if instant or pending
    });
  };
  
  return (
    <button 
      onClick={handleAdjust}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Processing...' : 'Adjust Stock'}
    </button>
  );
}
```

## Creating New Hooks

1. Create file: `/hooks/useXxxMutation.ts`
2. Define params interface
3. Implement with `useMutation`
4. Add query invalidation in `onSuccess`
5. Document in this README
