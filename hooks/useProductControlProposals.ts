import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useCreateInventoryRequestMutation } from './useInventoryRequestMutations';
import { useSubmitPriceChanges } from './useSubmitPriceChanges';
import { priceManagerService } from '../services/price-manager.service';
import { normalizePriceProposal, type PriceBatch, type PriceBatchResult } from '../utils/priceManager';
import { validateStockThresholds } from '../utils/productDetailLogic';
import type { Product } from '../types';
import type { UnitConfig } from '../components/merchandising/product-control/UnitTab';
import type { PricingConfig } from '../components/merchandising/product-control/PricingTab';
import type { StockConfig } from '../components/merchandising/product-control/StockTab';

export function useProductControlProposals(product: Product | null, country: string, onSaved?: () => void) {
    const { user, showToast } = useStore();
    const createRequest = useCreateInventoryRequestMutation();
    const { submit } = useSubmitPriceChanges(country);
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [priceBatch, setPriceBatch] = useState<PriceBatch | null>(null);
    const [batchFailures, setBatchFailures] = useState<PriceBatchResult['failures']>([]);
    const savePatch = async (patch: Partial<Product>, reason: string) => {
        if (!product) return;
        setIsSaving(true);
        try {
            await createRequest.mutateAsync({ productId: product.id, productName: product.name, productSku: product.sku,
                siteId: product.siteId || product.site_id || '', countryCode: country, changeType: 'edit', status: 'pending',
                requestedBy: user?.name || 'Unknown', requestedAt: new Date().toISOString(), proposedChanges: patch,
                adjustmentReason: `MERCHANDISING: ${reason}` });
            showToast('Proposal submitted for regional Operations, Supply Chain and Merchandising approval.', 'info');
            queryClient.invalidateQueries({ queryKey: ['merchandising_reviews'] });
            onSaved?.();
        } catch (error) { showToast((error as Error).message || 'Proposal was not submitted.', 'error'); }
        finally { setIsSaving(false); }
    };
    const saveUnit = async (cfg: UnitConfig) => {
        if (!product) return;
        const packQuantity = cfg.packOf ? Number(cfg.packOf) : 1;
        if (!Number.isInteger(packQuantity) || packQuantity <= 0) { showToast('Pack quantity must be a positive whole number.', 'error'); return; }
        const attrs = product.customAttributes || {};
        await savePatch({ unit: cfg.sellUnit, size: cfg.physicalQty || undefined, packQuantity,
            customAttributes: { ...attrs,
                physical: { ...(attrs.physical || {}), unit: cfg.physicalUnit, sizeType: cfg.physicalUnit, netWeight: cfg.physicalQty || undefined },
                packaging: { ...(attrs.packaging || {}), packQty: cfg.packOf || undefined, caseSize: cfg.caseOf || undefined },
                commercial: { ...(attrs.commercial || {}), sellBy: cfg.sellMode === 'weight' ? 'Weight' : cfg.sellMode === 'volume' ? 'Volume' : 'Count', sellUnit: cfg.sellUnit, labelOverride: cfg.label || undefined },
            } }, 'Unit and packaging update');
    };
    const saveStock = async (cfg: StockConfig) => {
        try {
            const minStock = cfg.minStock === '' ? undefined : Number(cfg.minStock);
            const maxStock = cfg.maxStock === '' ? undefined : Number(cfg.maxStock);
            validateStockThresholds(minStock ?? product?.minStock, maxStock ?? product?.maxStock);
            if ([minStock, maxStock].some(value => value !== undefined && !Number.isInteger(value))) throw new Error('Stock thresholds must be whole numbers.');
            if (minStock === undefined && maxStock === undefined) throw new Error('Enter at least one stock threshold.');
            await savePatch({ minStock, maxStock }, 'Stock threshold update');
        } catch (error) { showToast((error as Error).message, 'error'); }
    };
    const preparePricing = async (cfg: PricingConfig) => {
        if (!product || isSaving) return;
        setIsSaving(true);
        try {
            // Cost is taken from each target's recorded data, never copied from another location.
            const requested = normalizePriceProposal({ price: cfg.price, salePrice: cfg.salePrice, isOnSale: cfg.isOnSale });
            const targets = cfg.scope === 'single' ? [product] : await priceManagerService.getSkuTargets(country, product.sku, cfg.scope === 'custom' ? cfg.selectedSiteIds : undefined);
            if (!targets.length) throw new Error('No product records found in the selected authorized locations.');
            setBatchFailures([]);
            setPriceBatch({ source: 'Product control pricing update', changes: targets.map(target => ({ product: target, proposal: { ...requested, costPrice: target.costPrice } })) });
        } catch (error) { showToast((error as Error).message || 'Could not prepare proposals.', 'error'); }
        finally { setIsSaving(false); }
    };
    const confirmPricing = async () => {
        if (!priceBatch || isSaving) return;
        setIsSaving(true);
        try {
            const result = await submit(priceBatch.changes, priceBatch.source);
            setBatchFailures(result.failures);
            setPriceBatch(result.failures.length ? { ...priceBatch, changes: priceBatch.changes.filter(change => result.failures.some(failure => failure.productId === change.product.id)) } : null);
            if (result.submitted) onSaved?.();
        } finally { setIsSaving(false); }
    };
    return { isSaving, saveUnit, saveStock, preparePricing, confirmPricing, priceBatch, batchFailures, cancelPricing: () => setPriceBatch(null) };
}
