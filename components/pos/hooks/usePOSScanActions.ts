import React, { useEffect, useCallback } from 'react';
import { Product, Site } from '../../../types';
import { productsService } from '../../../services/supabase.service';
import { audioFeedback } from '../../../utils/audioFeedback';
import { logger } from '../../../utils/logger';
import { validateCrossBorderSku } from '../../../utils/skuValidation';
import { Country } from '../../../utils/localization';

interface UsePOSScanActionsProps {
    products: Product[];
    activeSite: Site | undefined;
    unknownBarcode: string;
    setUnknownBarcode: React.Dispatch<React.SetStateAction<string>>;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    addToCart: (product: Product) => void;
    addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
    isUnknownBarcodeModalOpen: boolean;
    weightPromptProduct: Product | null;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const usePOSScanActions = ({
    products,
    activeSite,
    unknownBarcode,
    setUnknownBarcode,
    setSearchTerm,
    addToCart,
    addNotification,
    isUnknownBarcodeModalOpen,
    weightPromptProduct,
    searchInputRef
}: UsePOSScanActionsProps) => {

    const activeCountry = (activeSite?.country || (activeSite?.currency === 'KES' || activeSite?.currency === 'KSh' ? 'KE' : 'ET')) as Country;

    // Global scan listener setup
    const handleScanProduct = useCallback(async (barcode: string): Promise<boolean> => {
        if (!barcode) return false;

        // Multi-Country Sovereignty: Reject foreign market barcodes (e.g. ET- in Kenya, KE- in Ethiopia)
        const crossBorderCheck = validateCrossBorderSku(barcode, activeCountry);
        if (!crossBorderCheck.isValid && crossBorderCheck.isForeign) {
            audioFeedback.playScanError();
            addNotification('alert', crossBorderCheck.errorMessage || 'Foreign SKU Detected');
            return false;
        }

        const product = products.find((p: Product) => {
            const matchSku = p.sku.toLowerCase() === barcode.toLowerCase();
            const matchBarcode = p.barcode?.toLowerCase() === barcode.toLowerCase();
            const matchBarcodes = p.barcodes?.some((b: string) => b.toLowerCase() === barcode.toLowerCase());
            const matchId = p.id === barcode;
            return matchSku || matchBarcode || matchBarcodes || matchId;
        });

        if (product) {
            const productSkuCheck = validateCrossBorderSku(product.sku, activeCountry);
            if (!productSkuCheck.isValid && productSkuCheck.isForeign) {
                audioFeedback.playScanError();
                addNotification('alert', productSkuCheck.errorMessage || 'Foreign SKU Detected');
                return false;
            }
            const explicitCountry = (product as any).country || (product as any).country_code;
            if (explicitCountry && explicitCountry !== activeCountry) {
                audioFeedback.playScanError();
                addNotification('alert', `Foreign SKU Detected: Item belongs to ${explicitCountry} market.`);
                return false;
            }
            if (unknownBarcode) setUnknownBarcode('');
            addToCart(product);
            audioFeedback.playScanSuccess();
            addNotification('success', `Added ${product.name}`);
            return true;
        }

        // Try server lookup for newly synchronized products
        try {
            const serverResults = await productsService.getByBarcode(barcode, activeSite?.id);
            if (serverResults.length > 0) {
                const sp = serverResults[0];
                const spCheck = validateCrossBorderSku(sp.sku, activeCountry);
                if (!spCheck.isValid && spCheck.isForeign) {
                    audioFeedback.playScanError();
                    addNotification('alert', spCheck.errorMessage || 'Foreign SKU Detected');
                    return false;
                }
                addToCart(sp);
                audioFeedback.playScanSuccess();
                addNotification('success', `Added ${sp.name} (Found via server)`);
                return true;
            }
        } catch (err) {
            logger.error('usePOSScanActions', 'caught error', err as Error);
        }

        if (barcode.trim().length > 0) {
            setUnknownBarcode(barcode);
            setSearchTerm('');
            audioFeedback.playScanError();
            addNotification('alert', `Unknown Barcode: ${barcode}. Click 'Link Item' to map it.`);
        }
        return false;
    }, [products, activeSite, activeCountry, addNotification, unknownBarcode, setUnknownBarcode, setSearchTerm, addToCart]);

    // Keyboard shortcuts and barcode scanner listener
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();
        let scanTimeout: NodeJS.Timeout;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const char = e.key;
            const now = Date.now();

            if (document.activeElement === searchInputRef.current) return;

            // Global Input Guard: Never intercept typing if actively focused on form input
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            if (isUnknownBarcodeModalOpen) return;
            if (weightPromptProduct) return;
            if (char === 'Shift' || char === 'Control' || char === 'Alt' || char === 'Meta' || char === 'Tab' || char === 'CapsLock') return;

            if (now - lastKeyTime > 100) { buffer = ''; }
            lastKeyTime = now;
            clearTimeout(scanTimeout);

            if (char === 'Enter') {
                if (document.activeElement === searchInputRef.current) { buffer = ''; return; }
                if (buffer.length > 0) {
                    handleScanProduct(buffer);
                    if (document.activeElement !== searchInputRef.current) setSearchTerm('');
                    buffer = '';
                    if (e.target instanceof HTMLInputElement) {
                        e.preventDefault(); e.stopPropagation();
                    }
                }
            } else if (char.length === 1) {
                const isValidBarcodeChar = /^[a-zA-Z0-9\-_\/\.\+\*\$\%\@\!\#\^\&\(\)\[\]\{\}\|\:\;\'\"\,\<\>\?\=\~\`\\ ]$/.test(char);
                if (isValidBarcodeChar) {
                    buffer += char;
                    scanTimeout = setTimeout(() => {
                        if (buffer.length > 0) {
                            handleScanProduct(buffer);
                            if (document.activeElement !== searchInputRef.current) setSearchTerm('');
                            buffer = '';
                        }
                    }, 300);
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown, true);
            clearTimeout(scanTimeout);
        };
    }, [handleScanProduct, isUnknownBarcodeModalOpen, weightPromptProduct, searchInputRef, setSearchTerm]);

    const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const inputValue = searchInputRef.current?.value?.trim();
            if (!inputValue) return;
            if (inputValue.length < 3) {
                addNotification('alert', 'Input too short.');
                setSearchTerm('');
                if (searchInputRef.current) searchInputRef.current.value = '';
                return;
            }
            await handleScanProduct(inputValue);
            setSearchTerm('');
            if (searchInputRef.current) searchInputRef.current.value = '';
            setTimeout(() => { if (searchInputRef.current) searchInputRef.current.focus(); }, 100);
        }
    };

    return {
        handleScanProduct,
        handleSearchKeyDown
    };
};
