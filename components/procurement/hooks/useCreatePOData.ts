import { useState, useEffect, useMemo } from 'react';
import { Supplier, Product, Site } from '../../../types';
import { suppliersService, productsService } from '../../../services/supabase.service';
import { deduplicateCatalogProducts } from '../createPOHelpers';
import { logger } from '../../../utils/logger';
import type { Country } from '../../../utils/localization';

import { getProcurementScope, filterProcurementSites } from '../../../utils/procurementScope';

interface UseCreatePODataParams {
    user?: Parameters<typeof getProcurementScope>[0];
    isOpen: boolean;
    activeCountry: Country;
    allProducts: Product[];
    contextSuppliers: Supplier[];
    sites: Site[];
    countrySites?: Site[];
    destinationSiteIds: string[];
    isRegionalUser: boolean;
    activeRegionCode: string | null;
}

export function useCreatePOData({
    isOpen,
    activeCountry,
    allProducts,
    contextSuppliers,
    sites,
    countrySites,
    destinationSiteIds,
    isRegionalUser,
    activeRegionCode,
    user
}: UseCreatePODataParams) {
    const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]);
    const [localProducts, setLocalProducts] = useState<Product[]>([]);

    useEffect(() => {
        setLocalSuppliers([]);
        setLocalProducts([]);
    }, [activeCountry]);

    const assignedScope = useMemo(() => getProcurementScope(user, countrySites?.length ? countrySites : sites), [user, countrySites, sites]);

    const countrySitePool = useMemo(() => {
        const pool = countrySites?.length ? countrySites : sites;
        return filterProcurementSites(pool, activeCountry, assignedScope);
    }, [countrySites, sites, activeCountry, assignedScope]);

    const countrySiteIds = useMemo(() => new Set(countrySitePool.map(s => s.id)), [countrySitePool]);

    const countryWarehouses = useMemo(() => {
        return countrySitePool.filter(s =>
            (s.type === 'Warehouse' || s.type === 'Distribution Center') &&
            s.status !== 'Closed' &&
            (!isRegionalUser || (Boolean(activeRegionCode) && (s.regionCode || s.region_code) === activeRegionCode))
        );
    }, [countrySitePool, isRegionalUser, activeRegionCode]);

    useEffect(() => {
        if (isOpen && contextSuppliers.length === 0 && localSuppliers.length === 0) {
            suppliersService.getAll(50, 0, activeCountry, false).then(res => {
                setLocalSuppliers(res.data);
            }).catch(err => logger.error('CreatePOModal', 'Direct supplier fetch failed', err as Error));
        }
    }, [isOpen, contextSuppliers.length, localSuppliers.length, activeCountry]);

    useEffect(() => {
        if (isOpen && (!allProducts || allProducts.length === 0) && localProducts.length === 0) {
            const targetSiteId = countryWarehouses[0]?.id;
            if (!targetSiteId) return;
            productsService.getAll(targetSiteId, 100, 0, undefined, undefined, false).then(res => {
                setLocalProducts((res.data || []) as Product[]);
            }).catch(err => logger.error('CreatePOModal', 'Direct products fetch failed', err as Error));
        }
    }, [isOpen, allProducts?.length, localProducts.length, countryWarehouses]);

    const allSuppliers = useMemo(() => {
        if (assignedScope.kind === 'none') return [];
        const raw = contextSuppliers.length > 0 ? contextSuppliers : localSuppliers;
        return raw.filter(s =>
            (!s.countryCode || s.countryCode === activeCountry) &&
            (['global', 'country'].includes(assignedScope.kind) || (Boolean(assignedScope.regionCode) && s.regionCode === assignedScope.regionCode))
        );
    }, [contextSuppliers, localSuppliers, activeCountry, assignedScope]);

    const effectiveProducts = useMemo(() => {
        const raw = (allProducts && allProducts.length > 0) ? allProducts : localProducts;
        return deduplicateCatalogProducts(raw, destinationSiteIds, countrySiteIds, activeCountry);
    }, [allProducts, localProducts, destinationSiteIds, countrySiteIds, activeCountry]);

    return {
        countryWarehouses,
        allSuppliers,
        effectiveProducts
    };
}
