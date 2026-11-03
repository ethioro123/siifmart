import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logger } from '../../../../utils/logger';
import { Product } from '../../../../types';

export interface BarcodeFeedback {
    barcode: string;
    status: 'checking' | 'registered_this' | 'registered_other' | 'available' | 'duplicate';
    message: string;
    productName?: string;
    sku?: string;
}

interface UseReceiveBarcodeCheckOptions {
    splitReceivingItem: any;
    siteId?: string;
    countryCode?: string;
    allProducts?: Product[];
    setSplitVariants: React.Dispatch<React.SetStateAction<any[]>>;
    setBarcodeInput: React.Dispatch<React.SetStateAction<{ [variantId: string]: string }>>;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export function useReceiveBarcodeCheck({
    splitReceivingItem,
    siteId,
    countryCode,
    allProducts = [],
    setSplitVariants,
    setBarcodeInput,
    t
}: UseReceiveBarcodeCheckOptions) {
    const [barcodeFeedback, setBarcodeFeedback] = useState<{ [variantId: string]: BarcodeFeedback | null }>({});

    const cleanSku = (s?: string) => (s ? s.replace(/[-\s]/g, '').toUpperCase() : '');

    const handleAddBarcode = async (variantId: string, customCode?: string) => {
        let codeToProcess = customCode;
        if (!codeToProcess) {
            setBarcodeInput(prev => {
                codeToProcess = prev[variantId] || '';
                return prev;
            });
        }
        const code = (codeToProcess || '').trim();
        if (!code) return;

        // Set checking feedback status
        setBarcodeFeedback(prev => ({
            ...prev,
            [variantId]: {
                barcode: code,
                status: 'checking',
                message: t('warehouse.checkingBarcode') || 'Checking barcode in database…'
            }
        }));

        const currentSku = cleanSku(splitReceivingItem?.sku);
        const currentName = splitReceivingItem?.productName || splitReceivingItem?.name || 'Current Product';
        const currentProductId = splitReceivingItem?.productId || splitReceivingItem?.product_id || splitReceivingItem?.id;

        // Check if barcode is already present in this variant
        let isDuplicate = false;
        setSplitVariants(prev => {
            const variant = prev.find(v => v.id === variantId);
            if (variant && ((variant.barcodes || []).includes(code) || variant.barcode === code)) {
                isDuplicate = true;
            }
            return prev;
        });

        if (isDuplicate) {
            setBarcodeFeedback(prev => ({
                ...prev,
                [variantId]: {
                    barcode: code,
                    status: 'duplicate',
                    message: t('warehouse.barcodeAlreadyInSplit', { code }) || `This barcode is already added to this split: ${code}`
                }
            }));
            return;
        }

        // 1. Inspect in-memory products & current receiving item
        const localMatches = (allProducts || []).filter(p => {
            const matchPrimary = p.barcode === code;
            const matchAliases = Array.isArray(p.barcodes) && p.barcodes.includes(code);
            return matchPrimary || matchAliases;
        });

        let matchedProduct: { id?: string; name: string; sku: string } | null = null;
        let isRegisteredThis = false;
        let isRegisteredOther = false;

        if (
            splitReceivingItem?.barcode === code ||
            (Array.isArray(splitReceivingItem?.barcodes) && splitReceivingItem.barcodes.includes(code))
        ) {
            isRegisteredThis = true;
            matchedProduct = {
                id: currentProductId,
                name: currentName,
                sku: splitReceivingItem?.sku || ''
            };
        } else if (localMatches.length > 0) {
            const matchThis = localMatches.find(p => (
                (currentProductId && p.id === currentProductId) ||
                (currentSku && cleanSku(p.sku) === currentSku)
            ));
            if (matchThis) {
                isRegisteredThis = true;
                matchedProduct = matchThis;
            } else {
                isRegisteredOther = true;
                matchedProduct = localMatches[0];
            }
        }

        // 2. Query Supabase database for authoritative site / market check
        if (!isRegisteredThis && !isRegisteredOther) {
            try {
                let query = supabase
                    .from('products')
                    .select('id, name, sku, barcode, barcodes, site_id')
                    .or(`barcode.eq.${code},barcodes.cs.{${code}}`);

                if (siteId) {
                    query = query.eq('site_id', siteId);
                }

                const { data, error } = await query.limit(5);
                if (error) {
                    logger.warn('useReceiveBarcodeCheck', 'Error querying database for barcode verification', { error: String(error?.message || error) });
                } else if (data && data.length > 0) {
                    const matchThis = data.find((p: any) => (
                        (currentProductId && p.id === currentProductId) ||
                        (currentSku && cleanSku(p.sku) === currentSku)
                    ));
                    if (matchThis) {
                        isRegisteredThis = true;
                        matchedProduct = matchThis;
                    } else {
                        isRegisteredOther = true;
                        matchedProduct = data[0];
                    }
                }
            } catch (err) {
                logger.warn('useReceiveBarcodeCheck', 'Database check exception', { error: (err as Error)?.message || String(err) });
            }
        }

        // 3. Process outcomes
        if (isRegisteredThis) {
            const prodName = matchedProduct?.name || currentName;
            const prodSku = matchedProduct?.sku || splitReceivingItem?.sku || '';
            setBarcodeFeedback(prev => ({
                ...prev,
                [variantId]: {
                    barcode: code,
                    status: 'registered_this',
                    productName: prodName,
                    sku: prodSku,
                    message: t('warehouse.barcodeRegisteredThisProduct', { name: prodName, sku: prodSku }) ||
                        `This barcode is registered under this product: ${prodName} (${prodSku})`
                }
            }));

            // Attach confirmed barcode to variant
            setSplitVariants(prev => prev.map(v => {
                if (v.id === variantId) {
                    const current = v.barcodes || [];
                    if (current.includes(code)) return v;
                    return {
                        ...v,
                        barcodes: [...current, code],
                        sku: (v.sku && v.sku !== 'UNKNOWN') ? v.sku : (matchedProduct?.sku || v.sku),
                        productId: v.productId || matchedProduct?.id
                    };
                }
                return v;
            }));
            setBarcodeInput(prev => ({ ...prev, [variantId]: '' }));
        } else if (isRegisteredOther && matchedProduct) {
            const otherName = matchedProduct.name;
            const otherSku = matchedProduct.sku;
            setBarcodeFeedback(prev => ({
                ...prev,
                [variantId]: {
                    barcode: code,
                    status: 'registered_other',
                    productName: otherName,
                    sku: otherSku,
                    message: t('warehouse.barcodeRegisteredOtherProduct', { name: otherName, sku: otherSku }) ||
                        `This barcode is registered under another product: ${otherName} (${otherSku})`
                }
            }));
        } else {
            // AVAILABLE TO ADD
            setBarcodeFeedback(prev => ({
                ...prev,
                [variantId]: {
                    barcode: code,
                    status: 'available',
                    productName: currentName,
                    sku: splitReceivingItem?.sku || '',
                    message: t('warehouse.barcodeAvailableToAdd', { name: currentName }) ||
                        `This barcode is OK to add to this product automatically: ${currentName}`
                }
            }));

            // Attach new barcode to variant
            setSplitVariants(prev => prev.map(v => {
                if (v.id === variantId) {
                    const current = v.barcodes || [];
                    if (current.includes(code)) return v;
                    return {
                        ...v,
                        barcodes: [...current, code]
                    };
                }
                return v;
            }));
            setBarcodeInput(prev => ({ ...prev, [variantId]: '' }));
        }
    };

    const clearBarcodeFeedback = (variantId: string) => {
        setBarcodeFeedback(prev => ({ ...prev, [variantId]: null }));
    };

    return {
        barcodeFeedback,
        handleAddBarcode,
        clearBarcodeFeedback
    };
}
