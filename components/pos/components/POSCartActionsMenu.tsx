import React from 'react';
import {
    Tag, PlayCircle, RotateCcw, Box, Lock, Printer,
    ArrowDownCircle, ShoppingBag
} from 'lucide-react';
import { Protected } from '../../Protected';
import { native } from '../../../utils/native';

interface POSCartActionsMenuProps {
    showActions: boolean;
    setShowActions: (show: boolean) => void;
    unseenPriceUpdatesCount: number;
    heldOrdersCount: number;
    onOpenPriceUpdates: () => void;
    onOpenRecall: () => void;
    onOpenReturn: () => void;
    onOpenCashDrop: () => void;
    onOpenNoSaleKick: () => void;
    onReprintLast: () => void;
    onCloseShift: () => void;
    onOpenMiscItem: () => void;
}

export const POSCartActionsMenu: React.FC<POSCartActionsMenuProps> = ({
    showActions,
    setShowActions,
    unseenPriceUpdatesCount,
    heldOrdersCount,
    onOpenPriceUpdates,
    onOpenRecall,
    onOpenReturn,
    onOpenCashDrop,
    onOpenNoSaleKick,
    onReprintLast,
    onCloseShift,
    onOpenMiscItem,
}) => {
    if (!showActions) return null;

    return (
        <>
            <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
            <div className="absolute bottom-full mb-2 right-0 w-52 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl shadow-xl p-2 z-20 space-y-1 animate-in slide-in-from-bottom-2">
                <Protected permission="ADD_PRODUCT">
                    <button
                        type="button"
                        onClick={() => {
                            onOpenMiscItem();
                            setShowActions(false);
                            native.haptic();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--theme-bg-card-hover)] text-left text-xs font-bold text-[var(--theme-text-primary)] cursor-pointer"
                    >
                        <ShoppingBag size={14} className="text-blue-500" />
                        <span>Misc Item</span>
                    </button>
                </Protected>

                <button
                    type="button"
                    onClick={() => {
                        onOpenPriceUpdates();
                        setShowActions(false);
                        native.haptic();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--theme-bg-card-hover)] text-left text-xs font-bold text-[var(--theme-text-primary)] cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <Tag size={14} className="text-blue-500" />
                        <span>Price Updates</span>
                    </div>
                    {unseenPriceUpdatesCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                            {unseenPriceUpdatesCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        onOpenRecall();
                        setShowActions(false);
                    }}
                    disabled={heldOrdersCount === 0}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--theme-bg-card-hover)] text-left text-xs font-bold text-[var(--theme-text-primary)] disabled:opacity-30 cursor-pointer"
                >
                    <PlayCircle size={14} className="text-amber-500" />
                    <span>Recall ({heldOrdersCount})</span>
                </button>

                <Protected permission="REFUND_SALE">
                    <button
                        type="button"
                        onClick={() => {
                            onOpenReturn();
                            setShowActions(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--theme-bg-card-hover)] text-left text-xs font-bold text-[var(--theme-text-primary)] cursor-pointer"
                    >
                        <RotateCcw size={14} className="text-rose-500" />
                        <span>Returns / Refund</span>
                    </button>
                </Protected>

                <button
                    type="button"
                    onClick={() => {
                        onOpenCashDrop();
                        setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--theme-bg-card-hover)] text-left text-xs font-bold text-emerald-500 cursor-pointer"
                >
                    <ArrowDownCircle size={14} />
                    <span>Safe Cash Drop</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        onOpenNoSaleKick();
                        setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--theme-bg-card-hover)] text-left text-xs font-bold text-[var(--theme-text-primary)] cursor-pointer"
                >
                    <Box size={14} className="text-[var(--theme-text-secondary)]" />
                    <span>Open Cash Drawer</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        onReprintLast();
                        setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--theme-bg-card-hover)] text-left text-xs font-bold text-[var(--theme-text-primary)] cursor-pointer"
                >
                    <Printer size={14} className="text-[var(--theme-text-secondary)]" />
                    <span>Reprint Receipt</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        onCloseShift();
                        setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--theme-bg-card-hover)] text-left text-xs font-bold text-amber-500 cursor-pointer"
                >
                    <Lock size={14} />
                    <span>Shift Summary</span>
                </button>
            </div>
        </>
    );
};
