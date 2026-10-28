import { useData } from '../contexts/DataContext';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useCreateInventoryRequestMutation } from './useInventoryRequestMutations';
import { useSubmitPriceChanges } from './useSubmitPriceChanges';
import { priceManagerService } from '../services/price-manager.service';
import { normalizePriceProposal, type PriceBatch, type PriceBatchResult } from '../utils/priceManager';
import { unitProposal, profileProposal, stockPolicyPreview } from '../utils/productControlLogic';
import type { ProfileConfig } from '../types/product-control';
import type { Product } from '../types';
import type { UnitConfig, PricingConfig, StockConfig } from '../types/product-control';

export function useProductControlProposals(product: Product | null, country: string, onSaved?: () => void) {
    const { activeRegionCode, sites } = useData();
    const { user, showToast } = useStore();
    const createRequest = useCreateInventoryRequestMutation();
    const { submit } = useSubmitPriceChanges(country);
    const queryClient = useQueryClient();
    const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [priceBatch, setPriceBatch] = useState<PriceBatch | null>(null);
    const [batchFailures, setBatchFailures] = useState<PriceBatchResult['failures']>([]);
    useEffect(() => { setPriceBatch(null); setBatchFailures([]); }, [product?.id, country, activeRegionCode]);
    const savePatch = async (patch: Partial<Product>, reason: string) => {
        if (!product || isSaving) return false;
        if (!Object.keys(patch).some(key => patch[key as keyof Product] !== undefined)) { showToast('No changes to submit.', 'info'); return false; }
        setIsSaving(true);
        try {
            await createRequest.mutateAsync({ productId: product.id, productName: product.name, productSku: product.sku,
                siteId: product.siteId || product.site_id || '', countryCode: country, changeType: 'edit', status: 'pending',
                requestedBy: user?.name || 'Unknown', requestedAt: new Date().toISOString(), proposedChanges: patch,
                adjustmentReason: `MERCHANDISING: ${reason}` });
            showToast('Proposal submitted for regional Operations, Supply Chain and Merchandising approval.', 'info');
            queryClient.invalidateQueries({ queryKey: ['merchandising_reviews'] });
            queryClient.invalidateQueries({ queryKey: ['product_pending_changes'] });
            queryClient.invalidateQueries({ queryKey: ['product_change_history'] });
            setLastSubmitted(reason);
            onSaved?.();
            return true;
        } catch (error) { showToast((error as Error).message || 'Proposal was not submitted.', 'error'); return false; }
        finally { setIsSaving(false); }
    };
    const saveProfile = async (cfg: ProfileConfig) => {
        if (!product) return false;
        try { return await savePatch(profileProposal(product, cfg), 'Product profile update'); }
        catch (error) { showToast((error as Error).message, 'error'); return false; }
    };
    const saveUnit = async (cfg: UnitConfig) => {
        if (!product) return false;
        try { return await savePatch(unitProposal(product, cfg), 'Unit and packaging update'); }
        catch (error) { showToast((error as Error).message, 'error'); return false; }
    };
    const saveStock = async (cfg: StockConfig) => {
        if (!product) return false;
        try {
            const preview = stockPolicyPreview(product, cfg);
            return await savePatch({ ...(preview.min !== product.minStock && preview.min !== undefined ? { minStock: preview.min } : {}), ...(preview.max !== product.maxStock && preview.max !== undefined ? { maxStock: preview.max } : {}) }, 'Stock threshold update');
        } catch (error) { showToast((error as Error).message, 'error'); return false; }
    };
    const preparePricing = async (cfg: PricingConfig) => {
        if (!product || isSaving) return;
        setIsSaving(true);
        try {
            // Cost is taken from each target's recorded data, never copied from another location.
            const requested = normalizePriceProposal({ price: cfg.price, salePrice: cfg.salePrice, isOnSale: cfg.isOnSale });
            const regionalIds = activeRegionCode ? sites.filter(site => (site.regionCode || site.region_code) === activeRegionCode).map(site => site.id) : undefined;
            const targetIds = cfg.scope === 'custom' ? cfg.selectedSiteIds.filter(id => !regionalIds || regionalIds.includes(id)) : regionalIds;
            const targets = cfg.scope === 'single' ? [product] : await priceManagerService.getSkuTargets(country, product.sku, targetIds);
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
            if (result.submitted) { setLastSubmitted(`${result.proposalCount} scoped price proposal(s) for ${result.submitted} locations`); onSaved?.(); }
            return result.submitted > 0 && result.failures.length === 0;
        } finally { setIsSaving(false); }
    };
    return { isSaving, saveProfile, lastSubmitted, clearFeedback: () => setLastSubmitted(null), saveUnit, saveStock, preparePricing, confirmPricing, priceBatch, batchFailures, cancelPricing: () => setPriceBatch(null) };
}
