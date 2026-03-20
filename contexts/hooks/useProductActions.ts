import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Product, Site, SystemLog } from '../../types';
import { productsService } from '../../services/supabase.service';

interface UseProductActionsDeps {
    activeSite: Site | undefined;
    sites: Site[];
    products: Product[];
    allProducts: Product[];
    user: any;
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setAllProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
}

export function useProductActions(deps: UseProductActionsDeps) {
    const {
        activeSite, sites, products, allProducts, user,
        setProducts, setAllProducts, addNotification, logSystemEvent
    } = deps;
    const queryClient = useQueryClient();

    const addProduct = useCallback(async (product: Product): Promise<Product | undefined> => {
        console.log('🧪 DataContext: addProduct called with:', product);
        const targetSiteId = product.siteId || product.site_id || activeSite?.id;
        try {
            if (!activeSite?.id) {
                addNotification('alert', 'No active site selected. Cannot add product.');
                return undefined;
            }

            if (!product.price || product.price <= 0) {
                console.warn(`Creating product "${product.name}" with invalid price: ${product.price}. Proceeding anyway.`);
            }

            const targetSite = sites.find(s => s.id === targetSiteId);

            if (targetSite) {
                const isHQSite = targetSite.type === 'Administration' ||
                    targetSite.type === 'Administrative' ||
                    targetSite.name?.toLowerCase().includes('hq') ||
                    targetSite.name?.toLowerCase().includes('headquarters');

                if (isHQSite) {
                    addNotification('alert', `Cannot add products to "${targetSite.name}". HQ/Administrative sites do not hold inventory. Please select a Warehouse or Store.`);
                    return undefined;
                }
            }

            if (!product.costPrice) {
                console.warn(`Product "${product.name}" created without cost price. Profit margins cannot be calculated.`);
            }

            const newProduct = await productsService.create({
                ...product,
                site_id: targetSiteId
            });

            console.log('🧪 DataContext: Product created in DB:', newProduct);

            setProducts(prev => {
                const next = [...prev, newProduct];
                console.log('🧪 DataContext: Local products updated. Count:', next.length);
                return next;
            });
            setAllProducts(prev => [...prev, newProduct]);

            queryClient.setQueryData(['products', targetSiteId], (old: Product[] | undefined) =>
                old ? [...old, newProduct] : [newProduct]
            );

            addNotification('success', `Product ${product.name} added`);
            logSystemEvent('Product Added', `Product "${product.name}" (SKU: ${product.sku}) created in site ${targetSiteId}`, user?.name || 'System', 'Inventory');
            return newProduct;
        } catch (error: any) {
            console.error('Error adding product:', error);

            if (error?.code === '23505' || error?.message?.includes('unique constraints') || error?.status === 409) {
                console.warn(`Product with SKU "${product.sku}" already exists. Fetching existing record...`);
                try {
                    const existing = await productsService.getBySKU(product.sku, targetSiteId);
                    if (existing) {
                        addNotification('info', `Product ${product.sku} already exists. Using existing record.`);
                        setProducts(prev => {
                            const exists = prev.find(p => p.id === existing.id);
                            if (exists) return prev;
                            return [existing, ...prev];
                        });
                        return existing;
                    }
                } catch (fetchErr) {
                    console.error('Failed to recover existing product:', fetchErr);
                }
                addNotification('alert', `Duplicate SKU! A product with SKU "${product.sku}" already exists but could not be retrieved.`);
            } else {
                addNotification('alert', `Failed to add product: ${error.message || 'Unknown error'}`);
            }
            return undefined;
        }
    }, [activeSite, sites, addNotification, logSystemEvent]);

    const updateProduct = useCallback(async (product: Partial<Product> & { id: string }, updatedBy?: string): Promise<Product | undefined> => {
        try {
            if (product.price !== undefined && product.price <= 0) {
                addNotification('alert', 'Product price must be greater than 0. Please set a valid price.');
                return;
            }

            const targetSiteId = product.siteId || (product as any).site_id;

            if (targetSiteId) {
                const targetSite = sites.find(s => s.id === targetSiteId);
                if (targetSite) {
                    const isHQSite = targetSite.type === 'Administration' ||
                        targetSite.type === 'Administrative' ||
                        targetSite.name?.toLowerCase().includes('hq') ||
                        targetSite.name?.toLowerCase().includes('headquarters');

                    if (isHQSite) {
                        addNotification('alert', `Cannot move product to "${targetSite.name}". HQ/Administrative sites do not hold inventory.`);
                        return;
                    }
                }
            }

            const { createdBy, updatedBy: _updatedBy, ...sanitizedProduct } = product as any;

            const updated = await productsService.update(product.id, sanitizedProduct);

            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updated } : p));
            setAllProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updated } : p));

            const updatedSiteId = updated.siteId || updated.site_id;
            if (updatedSiteId) {
                queryClient.setQueryData(['products', updatedSiteId], (old: Product[] | undefined) =>
                    old ? old.map(p => p.id === product.id ? { ...p, ...updated } : p) : old
                );
            }

            addNotification('success', `Product ${product.name || updated.name} updated`);
            logSystemEvent('Product Updated', `Product "${product.name || updated.name}" updated`, updatedBy || user?.name || 'System', 'Inventory');
            return updated;
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to update product');
            throw error;
        }
    }, [addNotification, logSystemEvent, user, sites]);

    const updatePricesBySKU = useCallback(async (sku: string, updates: { price: number; costPrice?: number; salePrice?: number; isOnSale?: boolean }) => {
        try {
            const updatedProducts = await productsService.updatePricesBySKU(sku, updates);
            const updatedIds = new Set(updatedProducts.map(p => p.id));

            setProducts(prev => prev.map(p => updatedIds.has(p.id) ? { ...p, ...updates } : p));
            setAllProducts(prev => prev.map(p => updatedIds.has(p.id) ? { ...p, ...updates } : p));

            const affectedSiteIds = new Set(updatedProducts.map(p => p.siteId || p.site_id).filter(Boolean));
            affectedSiteIds.forEach(siteId => {
                queryClient.setQueryData(['products', siteId], (old: Product[] | undefined) =>
                    old ? old.map(p => updatedIds.has(p.id) ? { ...p, ...updates } : p) : old
                );
            });

            addNotification('success', `Synchronized prices for SKU ${sku} across ${updatedProducts.length} locations`);
            logSystemEvent('Global Price Sync', `SKU ${sku} prices updated network-wide`, user?.name || 'System', 'Inventory');
        } catch (error) {
            console.error('Global Price Sync Error:', error);
            addNotification('alert', 'Failed to synchronize prices globally');
            throw error;
        }
    }, [addNotification, logSystemEvent, user]);

    const deleteProduct = useCallback(async (id: string) => {
        try {
            await productsService.cascadeDelete(id);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            addNotification('success', 'Product and related records deleted permanently');
            logSystemEvent('Product Deleted', `Product with ID ${id} and all related records deleted permanently`, user?.name || 'System', 'Inventory');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to delete product');
            throw error;
        }
    }, [addNotification, logSystemEvent, user, queryClient]);

    const relocateProduct = useCallback(async (productId: string, newLocation: string, user: string) => {
        try {
            const product = allProducts.find(p => p.id === productId);
            const currentLocations = product?.location ? product.location.split(',').map(l => l.trim()) : [];

            if (currentLocations.includes(newLocation.trim())) {
                console.log(`📍 Product ${productId} already assigned to location ${newLocation}. Skipping append.`);
                return;
            }

            const updatedLocation = newLocation.trim();
            await productsService.update(productId, { location: updatedLocation });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            logSystemEvent('Product Relocated', `Product ${productId} added to location ${newLocation}`, user, 'Inventory');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to relocate product');
        }
    }, [allProducts, queryClient, logSystemEvent, addNotification]);

    const cleanupAdminProducts = useCallback(async () => {
        try {
            const hqProducts = allProducts.filter(p => p.siteId === 'Administration' || p.site_id === 'Administration');

            if (hqProducts.length === 0) {
                addNotification('info', 'No HQ products found. Database is clean!');
                return;
            }

            console.log(`🧹 Found ${hqProducts.length} products in HQ. Removing...`);

            const deletePromises = hqProducts.map(product => productsService.delete(product.id));
            await Promise.all(deletePromises);

            setProducts(prev => prev.filter(p => p.siteId !== 'Administration' && p.site_id !== 'Administration'));
            setAllProducts(prev => prev.filter(p => p.siteId !== 'Administration' && p.site_id !== 'Administration'));

            addNotification('success', `✅ Removed ${hqProducts.length} products from HQ. Database cleaned!`);
            logSystemEvent('Data Cleanup', `Removed ${hqProducts.length} HQ products`, 'System', 'Inventory');
        } catch (error) {
            console.error('Failed to cleanup HQ products:', error);
            addNotification('alert', 'Failed to cleanup HQ products');
        }
    }, [allProducts, addNotification, logSystemEvent]);

    const cleanupDuplicateLocations = useCallback(async () => {
        try {
            const corruptedProducts = allProducts.filter(p =>
                p.location && (p.location.includes(',') || p.location.includes('Aisle'))
            );

            if (corruptedProducts.length === 0) {
                addNotification('info', 'No corrupted locations found. Database is clean!');
                return;
            }

            console.log(`🧹 Found ${corruptedProducts.length} products with corrupted locations. Cleaning...`);

            const extractValidLocation = (location: string): string => {
                const match = location.match(/([A-Z])-(\d{1,2})-(\d{1,2})/);
                if (match) {
                    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
                }
                return '';
            };

            let fixedCount = 0;
            for (const product of corruptedProducts) {
                const cleanLocation = extractValidLocation(product.location!);
                if (cleanLocation && cleanLocation !== product.location) {
                    await productsService.update(product.id, { location: cleanLocation });
                    fixedCount++;
                    console.log(`✅ Fixed: "${product.location}" → "${cleanLocation}" for ${product.name}`);
                }
            }

            queryClient.invalidateQueries({ queryKey: ['products'] });

            addNotification('success', `✅ Fixed ${fixedCount} corrupted locations!`);
            logSystemEvent('Data Cleanup', `Fixed ${fixedCount} corrupted product locations`, 'System', 'Inventory');
        } catch (error) {
            console.error('Failed to cleanup corrupted locations:', error);
            addNotification('alert', 'Failed to cleanup corrupted locations');
        }
    }, [allProducts, addNotification, logSystemEvent, queryClient]);

    return {
        addProduct, updateProduct, updatePricesBySKU, deleteProduct,
        relocateProduct, cleanupAdminProducts, cleanupDuplicateLocations
    };
}
