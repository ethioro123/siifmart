import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/supabase.service';
import { useData } from '../contexts/DataContext';

interface RelocateProductParams {
    productId: string;
    newLocation: string;
    user: string;
}

export function useRelocateProductMutation() {
    const queryClient = useQueryClient();
    const { addNotification, logSystemEvent, allProducts } = useData();

    return useMutation({
        mutationFn: async ({ productId, newLocation, user }: RelocateProductParams) => {
            const product = allProducts.find(p => p.id === productId);
            // [FIX] Overwrite location instead of appending to prevent duplicates
            const updatedLocation = newLocation.trim();

            await productsService.update(productId, { location: updatedLocation });
            return { skipped: false, productId, newLocation, user, updatedLocation };
        },
        onSuccess: (result) => {
            if (result.skipped) {
                return;
            }

            queryClient.invalidateQueries({ queryKey: ['products'] });
            logSystemEvent(
                'Product Relocated',
                `Product ${result.productId} added to location ${result.newLocation}`,
                result.user!,
                'Inventory'
            );
        },
        onError: (error: any) => {
            console.error('Relocate product failed:', error);
            addNotification('alert', 'Failed to relocate product');
        }
    });
}
