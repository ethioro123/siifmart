import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { barcodeApprovalsService } from '../services/barcode-approvals.service';
import { validateBarcodeFormat } from '../utils/barcodeValidation';
import type { Product } from '../types';

/** All scanning contexts submit evidence to the same pending-review workflow. */
export function useBarcodeResolutionMutation() {
    const { user } = useStore();
    const { activeSite, effectiveCountry } = useData();
    const cache = useQueryClient();
    const submitting = useRef(false);
    return useMutation({
        mutationFn: async ({ product, barcode, imageFile }: { product: Product; barcode: string; imageFile: File | null }) => {
            if (submitting.current) throw new Error('Barcode request is already being submitted');
            submitting.current = true;
            try {
                const country = effectiveCountry || activeSite?.country;
                if (!user?.id || !activeSite?.id || !country) throw new Error('Missing barcode request scope');
                if ((product.siteId || product.site_id) !== activeSite.id) throw new Error('Product is outside the active site');
                if (!imageFile) throw new Error('Barcode evidence is required');
                const clean = barcode.trim();
                if (!validateBarcodeFormat(clean).isValid) throw new Error('Invalid barcode');
                if (product.barcode === clean || product.barcodes?.includes(clean)) throw new Error('Barcode is already active');
                const imageUrl = imageFile ? await barcodeApprovalsService.uploadEvidence(imageFile) : undefined;
                const saved = await barcodeApprovalsService.create({
                    product_id: product.id, barcode: clean, image_url: imageUrl,
                    site_id: activeSite.id, country_code: country, created_by: user.id
                });
                if (!saved?.id || saved.status !== 'pending') throw new Error('Barcode request was not confirmed');
                return saved;
            } finally { submitting.current = false; }
        },
        onSuccess: async () => {
            await cache.invalidateQueries({ queryKey: ['barcode_approvals'] });
        }
    });
}
