import React from 'react';
import { Product, CartItem, Site } from '../../../types';
import { needsQuantityPrompt, getSellUnit, normalizeQuantity } from '../../../utils/units';

interface UsePOSCartActionsProps {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    weightPromptProduct: Product | null;
    setWeightPromptProduct: React.Dispatch<React.SetStateAction<Product | null>>;
    miscItem: { name: string; price: string };
    setMiscItem: React.Dispatch<React.SetStateAction<{ name: string; price: string }>>;
    setIsMiscItemModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    activeSite: Site | undefined;
    addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
    setCartDiscount: React.Dispatch<React.SetStateAction<number>>;
    setAppliedDiscountCode: React.Dispatch<React.SetStateAction<string | null>>;
    setAppliedDiscountCodeDetails: React.Dispatch<React.SetStateAction<any>>;
    setDiscountCodeInput: React.Dispatch<React.SetStateAction<string>>;
    setDiscountCodeError: React.Dispatch<React.SetStateAction<string>>;
    setIsRoundingEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const usePOSCartActions = ({
    cart,
    setCart,
    weightPromptProduct,
    setWeightPromptProduct,
    miscItem,
    setMiscItem,
    setIsMiscItemModalOpen,
    activeSite,
    addNotification,
    setCartDiscount,
    setAppliedDiscountCode,
    setAppliedDiscountCodeDetails,
    setDiscountCodeInput,
    setDiscountCodeError,
    setIsRoundingEnabled
}: UsePOSCartActionsProps) => {

    const addToCart = React.useCallback((product: Product) => {
        if (needsQuantityPrompt(product.unit)) {
            setWeightPromptProduct(product);
            return;
        }
        const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    addNotification('alert', `Cannot add more. Only ${product.stock} units in stock.`);
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, price: effectivePrice, quantity: 1 }];
        });
    }, [addNotification, setWeightPromptProduct, setCart]);

    const confirmWeightEntry = React.useCallback((qty: number) => {
        if (!weightPromptProduct || qty <= 0) {
            setWeightPromptProduct(null);
            return;
        }
        const product = weightPromptProduct;
        const unit = getSellUnit(product.unit);
        const normalizedQty = normalizeQuantity(qty, product.unit);
        const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                const newQty = existing.quantity + normalizedQty;
                if (newQty > product.stock) {
                    addNotification('alert', `Cannot add more. Only ${product.stock} ${unit.shortLabel} in stock.`);
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, quantity: normalizeQuantity(newQty, product.unit) } : item);
            }
            return [...prev, { ...product, price: effectivePrice, quantity: normalizedQty }];
        });
        setWeightPromptProduct(null);
    }, [weightPromptProduct, addNotification, setWeightPromptProduct, setCart]);

    const addMiscItem = React.useCallback(() => {
        if (!miscItem.price) return;
        const price = parseFloat(miscItem.price);
        const newItem: CartItem = {
            id: `MISC-${Date.now()}`,
            siteId: activeSite?.id || 'SITE-001',
            name: miscItem.name || 'Miscellaneous',
            price,
            quantity: 1,
            category: 'General',
            stock: 9999,
            sku: 'MISC',
            image: 'https://ui-avatars.com/api/?name=Misc+Item&background=random&color=fff',
            status: 'active'
        };
        setCart(prev => [...prev, newItem]);
        setIsMiscItemModalOpen(false);
        setMiscItem({ name: 'Misc Item', price: '' });
    }, [miscItem, activeSite, setCart, setIsMiscItemModalOpen, setMiscItem]);

    const updateQuantity = React.useCallback((id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const unit = getSellUnit(item.unit);
                const step = unit.allowDecimal ? 0.1 : 1;
                const actualDelta = delta > 0 ? step : -step;
                const newQty = normalizeQuantity(item.quantity + actualDelta, item.unit);
                if (actualDelta > 0 && newQty > item.stock) {
                    addNotification('alert', `Stock limit reached! Only ${item.stock} ${unit.shortLabel || 'units'} available.`);
                    return item;
                }
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    }, [addNotification, setCart]);

    const setCartItemQuantity = React.useCallback((id: string, qty: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const unit = getSellUnit(item.unit);
                const normalized = normalizeQuantity(qty, item.unit);
                if (normalized > item.stock) {
                    addNotification('alert', `Stock limit reached! Only ${item.stock} ${unit.shortLabel || 'units'} available.`);
                    return item;
                }
                return normalized > 0 ? { ...item, quantity: normalized } : item;
            }
            return item;
        }));
    }, [addNotification, setCart]);

    const removeFromCart = React.useCallback((id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    }, [setCart]);

    const clearCart = React.useCallback(() => {
        setCart([]);
        setCartDiscount(0);
        setAppliedDiscountCode(null);
        setAppliedDiscountCodeDetails(null);
        setDiscountCodeInput('');
        setDiscountCodeError('');
        setIsRoundingEnabled(true);
    }, [setCart, setCartDiscount, setAppliedDiscountCode, setAppliedDiscountCodeDetails, setDiscountCodeInput, setDiscountCodeError, setIsRoundingEnabled]);

    return {
        addToCart,
        confirmWeightEntry,
        addMiscItem,
        updateQuantity,
        setCartItemQuantity,
        removeFromCart,
        clearCart
    };
};
