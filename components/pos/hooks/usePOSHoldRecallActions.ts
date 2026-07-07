import React from 'react';
import { CartItem, HeldOrder, Site } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';

interface UsePOSHoldRecallActionsProps {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    holdOrderNote: string;
    setHoldOrderNote: React.Dispatch<React.SetStateAction<string>>;
    isHoldOrderModalOpen: boolean;
    setIsHoldOrderModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isRecallModalOpen: boolean;
    setIsRecallModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isOverwriteCartModalOpen: boolean;
    setIsOverwriteCartModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    pendingRecallOrderId: string | null;
    setPendingRecallOrderId: React.Dispatch<React.SetStateAction<string | null>>;
    activeSite: Site | undefined;
    holdOrder: any;
    heldOrders: HeldOrder[];
    releaseHold: any;
    clearCart: () => void;
    addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
}

export const usePOSHoldRecallActions = ({
    cart,
    setCart,
    holdOrderNote,
    setHoldOrderNote,
    isHoldOrderModalOpen,
    setIsHoldOrderModalOpen,
    isRecallModalOpen,
    setIsRecallModalOpen,
    isOverwriteCartModalOpen,
    setIsOverwriteCartModalOpen,
    pendingRecallOrderId,
    setPendingRecallOrderId,
    activeSite,
    holdOrder,
    heldOrders,
    releaseHold,
    clearCart,
    addNotification
}: UsePOSHoldRecallActionsProps) => {

    const handleHoldOrder = React.useCallback(() => {
        if (cart.length === 0) return;
        setHoldOrderNote('');
        setIsHoldOrderModalOpen(true);
    }, [cart, setHoldOrderNote, setIsHoldOrderModalOpen]);

    const handleConfirmHoldOrder = React.useCallback(() => {
        const order: HeldOrder = {
            id: `HOLD-${Date.now()}`,
            siteId: activeSite?.id || 'SITE-001',
            time: formatDateTime(new Date(), { showTime: true }),
            items: [...cart],
            note: holdOrderNote || 'No Note'
        };
        holdOrder(order);
        clearCart();
        addNotification('success', "Order Placed on Hold.");
        setIsHoldOrderModalOpen(false);
    }, [cart, activeSite, holdOrderNote, holdOrder, clearCart, addNotification, setIsHoldOrderModalOpen]);

    const handleRecallOrder = React.useCallback((orderId: string) => {
        const order = heldOrders.find(o => o.id === orderId);
        if (order) {
            if (cart.length > 0) {
                setPendingRecallOrderId(orderId);
                setIsOverwriteCartModalOpen(true);
                return;
            }
            setCart(order.items);
            releaseHold(orderId);
            setIsRecallModalOpen(false);
        }
    }, [heldOrders, cart, setPendingRecallOrderId, setIsOverwriteCartModalOpen, setCart, releaseHold, setIsRecallModalOpen]);

    const handleConfirmOverwriteCart = React.useCallback(() => {
        if (!pendingRecallOrderId) return;
        const order = heldOrders.find(o => o.id === pendingRecallOrderId);
        if (order) {
            setCart(order.items);
            releaseHold(pendingRecallOrderId);
            setIsRecallModalOpen(false);
        }
        setIsOverwriteCartModalOpen(false);
        setPendingRecallOrderId(null);
    }, [pendingRecallOrderId, heldOrders, setCart, releaseHold, setIsRecallModalOpen, setIsOverwriteCartModalOpen, setPendingRecallOrderId]);

    return {
        handleHoldOrder,
        handleConfirmHoldOrder,
        handleRecallOrder,
        handleConfirmOverwriteCart
    };
};
