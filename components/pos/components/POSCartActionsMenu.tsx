import React from 'react';
import {
    Tag, PlayCircle, RotateCcw, Box, Lock, Printer,
    ArrowDownCircle, ShoppingBag
} from 'lucide-react';
import { Protected } from '../../Protected';
import { useLanguage } from '../../../contexts/LanguageContext';
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
    const { t } = useLanguage();

    if (!showActions) return null;

    return (
        <>
            <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
            <div className="absolute bottom-full mb-2 right-0 w-60 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-lg p-1.5 z-20 space-y-0.5 animate-in slide-in-from-bottom-2 duration-200">
                <Protected permission="ADD_PRODUCT">
                    <button
                        type="button"
                        onClick={() => {
                            onOpenMiscItem();
                            setShowActions(false);
                            native.haptic();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--theme-bg-subtle)] text-left text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight cursor-pointer transition-colors active:scale-[0.98]"
                    >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <ShoppingBag size={14} />
                        </div>
                        <span>{t('pos.miscItem')}</span>
                    </button>
                </Protected>

                <button
                    type="button"
                    onClick={() => {
                        onOpenPriceUpdates();
                        setShowActions(false);
                        native.haptic();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[var(--theme-bg-subtle)] text-left text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight cursor-pointer transition-colors active:scale-[0.98]"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                            <Tag size={14} />
                        </div>
                        <span>{t('pos.priceUpdates')}</span>
                    </div>
                    {unseenPriceUpdatesCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
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
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--theme-bg-subtle)] text-left text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight disabled:opacity-30 cursor-pointer transition-colors active:scale-[0.98]"
                >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <PlayCircle size={14} />
                    </div>
                    <span>{t('pos.recallHeld')} ({heldOrdersCount})</span>
                </button>

                <div className="my-1 border-t border-[var(--theme-border-subtle)]" />

                <Protected permission="REFUND_SALE">
                    <button
                        type="button"
                        onClick={() => {
                            onOpenReturn();
                            setShowActions(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--theme-bg-subtle)] text-left text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight cursor-pointer transition-colors active:scale-[0.98]"
                    >
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                            <RotateCcw size={14} />
                        </div>
                        <span>{t('pos.returnsAndRefunds')}</span>
                    </button>
                </Protected>

                <button
                    type="button"
                    onClick={() => {
                        onOpenCashDrop();
                        setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--theme-bg-subtle)] text-left text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight cursor-pointer transition-colors active:scale-[0.98]"
                >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <ArrowDownCircle size={14} />
                    </div>
                    <span>{t('pos.safeCashDrop')}</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        onOpenNoSaleKick();
                        setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--theme-bg-subtle)] text-left text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight cursor-pointer transition-colors active:scale-[0.98]"
                >
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                        <Box size={14} />
                    </div>
                    <span>{t('pos.openCashDrawer')}</span>
                </button>

                <div className="my-1 border-t border-[var(--theme-border-subtle)]" />

                <button
                    type="button"
                    onClick={() => {
                        onReprintLast();
                        setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--theme-bg-subtle)] text-left text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight cursor-pointer transition-colors active:scale-[0.98]"
                >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <Printer size={14} />
                    </div>
                    <span>{t('pos.reprintReceipt')}</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        onCloseShift();
                        setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--theme-bg-subtle)] text-left text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight cursor-pointer transition-colors active:scale-[0.98]"
                >
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Lock size={14} />
                    </div>
                    <span>{t('pos.shiftSummary')}</span>
                </button>
            </div>
        </>
    );
};
