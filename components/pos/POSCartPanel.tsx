import React, { useState } from 'react';
import { WeightEntryModal } from './modals/WeightEntryModal';
import { usePOS } from './POSContext';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Protected } from '../Protected';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatPriceValue } from '../../utils/formatting';
import { getSellUnit, formatQuantityWithUnit } from '../../utils/units';
import { native } from '../../utils/native';
import {
    ArrowLeft, ArrowRight, User, CreditCard, Minus, Plus, Trash2,
    Tag, PlayCircle, PauseCircle, RotateCcw, Box, Lock, Printer,
    DollarSign, Settings, Scale, X, ChevronDown, ChevronUp
} from 'lucide-react';

export const POSCartPanel: React.FC = () => {
    const { t } = useLanguage();
    const {
        showCart,
        setShowCart,
        setIsCustomerModalOpen,
        selectedCustomer,
        cart,
        updateQuantity,
        setCartItemQuantity,
        removeFromCart,
        weightPromptProduct,
        setWeightPromptProduct,
        confirmWeightEntry,
        subtotal,
        appliedDiscountCodeDetails,
        setIsDiscountModalOpen,
        cartDiscount,
        taxBreakdown,
        tax,
        isRoundingEnabled,
        setIsRoundingEnabled,
        roundingAdjustment,
        total,
        rawTotal,
        setIsRecallModalOpen,
        handleHoldOrder,
        clearCart,
        setIsReturnModalOpen,
        handleOpenDrawer,
        handleCloseShift,
        handleReprintLast,
        setIsPriceUpdatesModalOpen,
        priceUpdatedProducts,
        lastSeenPriceUpdate,
        handleInitiatePayment,
    } = usePOS();

    const { heldOrders } = useData();
    const [showActions, setShowActions] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Compute unseen price updates count
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const unseenPriceUpdatesCount = priceUpdatedProducts.filter((p: any) => {
        const priceTime = p.priceUpdatedAt || p.price_updated_at || p.updatedAt || p.updated_at;
        if (!priceTime) return true;
        const ts = new Date(priceTime).getTime();
        return ts > cutoff && ts > (lastSeenPriceUpdate || 0);
    }).length;

    const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <>
            {/* Cart Panel: Desktop Side Panel / Mobile Full-Screen Sheet */}
            <div className={`
                fixed inset-0 z-[200] bg-[#F6F4EE] dark:bg-[#0D130F] flex flex-col transition-transform duration-300 ease-out
                lg:static lg:w-[400px] lg:bg-white/85 lg:dark:bg-[#18201B]/60 lg:backdrop-blur-2xl lg:border lg:border-[#E2DCCE] lg:dark:border-emerald-950/20 lg:rounded-[32px] lg:h-full lg:z-auto lg:transform-none lg:shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] lg:dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)]
                ${showCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
            `}>
                {/* Header */}
                <div className="pt-3 pb-3 px-4 border-b border-[#E2DCCE] dark:border-emerald-950/30 bg-white dark:bg-[#131A15] flex items-center justify-between shrink-0 shadow-xs">
                    <button
                        onClick={() => {
                            setShowCart(false);
                            native.haptic();
                        }}
                        className="p-2 -ml-2 rounded-xl text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 active:scale-95 transition-all lg:hidden flex items-center gap-1.5 font-extrabold text-sm"
                        aria-label={t('pos.backToProducts')}
                    >
                        <ArrowLeft size={18} />
                        <span>Catalog</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9]">
                            Cart ({totalItemCount})
                        </span>
                    </div>

                    <button
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="flex items-center gap-2 bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 dark:bg-white/5 dark:hover:bg-white/10 border border-[#2C5E3B]/20 dark:border-white/10 px-3 py-1.5 rounded-xl transition-all active:scale-95 group"
                    >
                        <User size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] max-w-[110px] truncate">
                            {selectedCustomer ? selectedCustomer.name : 'Walk-in'}
                        </span>
                    </button>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-300">
                            <div className="w-16 h-16 rounded-2xl bg-[#2C5E3B]/10 dark:bg-white/5 flex items-center justify-center mb-3 border border-[#2C5E3B]/15 dark:border-white/10">
                                <CreditCard size={28} className="text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60" />
                            </div>
                            <h4 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9] mb-1">{t('pos.cartEmpty')}</h4>
                            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">Tap items from the catalog or scan barcodes to start sale.</p>
                        </div>
                    ) : (
                        cart.map(item => {
                            const unit = getSellUnit(item.unit);
                            return (
                                <div
                                    key={item.id}
                                    className="bg-white dark:bg-[#151D18] p-3 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-200"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[#1E3F27] dark:text-[#EAE5D9] text-xs font-extrabold truncate leading-snug">
                                            {item.name}
                                        </h4>
                                        <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-black text-[11px] mt-0.5">
                                            {CURRENCY_SYMBOL} {formatPriceValue(item.price)}{unit.code !== 'UNIT' ? `/${unit.shortLabel}` : ''}
                                        </p>
                                    </div>

                                    {/* Stepper / Quantity Controls */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {unit.allowDecimal ? (
                                            <div className="flex items-center bg-[#F4F0E6] dark:bg-black/40 rounded-xl px-2 py-1 border border-[#E2DCCE] dark:border-white/10 gap-1">
                                                <input
                                                    type="number"
                                                    title="Quantity"
                                                    step={unit.step}
                                                    min={unit.step}
                                                    value={item.quantity}
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && val > 0) setCartItemQuantity(item.id, val);
                                                    }}
                                                    className="w-12 bg-transparent text-[#1E3F27] dark:text-white font-black text-xs text-center outline-none tabular-nums"
                                                />
                                                <span className="text-[10px] text-[#4D6E56] dark:text-gray-400 font-bold uppercase">{unit.shortLabel}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center bg-[#F4F0E6] dark:bg-black/40 rounded-xl p-0.5 border border-[#E2DCCE] dark:border-white/10">
                                                <button
                                                    onClick={() => {
                                                        updateQuantity(item.id, -1);
                                                        native.haptic();
                                                    }}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4D6E56] dark:text-gray-300 hover:text-[#1E3F27] dark:hover:text-white active:bg-white/20 transition-all active:scale-90"
                                                    title="Decrease quantity"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-[#1E3F27] dark:text-white font-black text-xs w-6 text-center tabular-nums">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        updateQuantity(item.id, 1);
                                                        native.haptic();
                                                    }}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4D6E56] dark:text-gray-300 hover:text-[#1E3F27] dark:hover:text-white active:bg-white/20 transition-all active:scale-90"
                                                    title="Increase quantity"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="w-16 text-right font-black text-xs text-[#1E3F27] dark:text-white tabular-nums">
                                            {CURRENCY_SYMBOL} {formatPriceValue(item.price * item.quantity)}
                                        </div>

                                        <button
                                            onClick={() => {
                                                removeFromCart(item.id);
                                                native.haptic();
                                            }}
                                            className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg active:scale-90 transition-all"
                                            title="Remove item"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Bottom Summary & Payment Section */}
                <div className="p-4 bg-white dark:bg-[#111713] border-t border-[#E2DCCE] dark:border-emerald-950/30 lg:rounded-b-[32px] shrink-0 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
                    {/* Collapsible Tax / Discount Details Toggle */}
                    <div className="mb-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#4D6E56] dark:text-[#7A9E83]">
                                    Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}):
                                </span>
                                <span className="font-extrabold text-xs text-[#1E3F27] dark:text-[#EAE5D9] tabular-nums">
                                    {CURRENCY_SYMBOL} {subtotal.toLocaleString()}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-[11px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center gap-0.5 hover:underline"
                            >
                                <span>{showDetails ? 'Hide breakdown' : 'View breakdown'}</span>
                                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>

                        {/* Breakdown Panel */}
                        {showDetails && (
                            <div className="p-2.5 rounded-xl bg-[#F8F6F0] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/5 space-y-1.5 text-xs animate-in fade-in duration-200">
                                <div className="flex justify-between items-center text-[#4D6E56] dark:text-[#7A9E83]">
                                    <div className="flex items-center gap-1.5">
                                        <span>Discount</span>
                                        <Protected permission="APPLY_DISCOUNT">
                                            <button
                                                onClick={() => setIsDiscountModalOpen(true)}
                                                className="text-[9px] bg-white dark:bg-white/10 border border-[#E2DCCE] dark:border-white/10 px-1.5 py-0.5 rounded font-bold text-[#2C5E3B] dark:text-[#A9CBA2]"
                                            >
                                                <Tag size={8} className="inline mr-0.5" />
                                                {appliedDiscountCodeDetails ? appliedDiscountCodeDetails.code : 'Apply Code'}
                                            </button>
                                        </Protected>
                                    </div>
                                    <span className={cartDiscount > 0 ? "text-[#2C5E3B] dark:text-[#A9CBA2] font-bold tabular-nums" : "tabular-nums"}>
                                        {cartDiscount > 0 ? `- ${CURRENCY_SYMBOL} ${cartDiscount.toLocaleString()}` : `${CURRENCY_SYMBOL} 0`}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-[#4D6E56] dark:text-[#7A9E83]">
                                    <span>Tax ({taxBreakdown.map(t => t.name).join(', ') || 'Standard'})</span>
                                    <span className="tabular-nums font-medium">{CURRENCY_SYMBOL} {tax.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center text-[#4D6E56] dark:text-[#7A9E83]">
                                    <div className="flex items-center gap-1.5">
                                        <span>Cash Rounding</span>
                                        <button
                                            title="Toggle cash rounding"
                                            onClick={() => setIsRoundingEnabled(!isRoundingEnabled)}
                                            className={`w-6 h-3.5 rounded-full transition-all relative shrink-0 ${isRoundingEnabled ? 'bg-amber-500' : 'bg-stone-300 dark:bg-white/20'}`}
                                        >
                                            <div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-all shadow ${isRoundingEnabled ? 'left-3' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    <span className="tabular-nums font-medium">+{CURRENCY_SYMBOL} {roundingAdjustment.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {/* Grand Total Row */}
                        <div className="flex justify-between items-baseline pt-1">
                            <span className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">
                                Total Amount
                            </span>
                            <span className="text-2xl font-black text-[#2C5E3B] dark:text-[#A9CBA2] tracking-tight tabular-nums">
                                {CURRENCY_SYMBOL} {total.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Quick Functions Bar: Hold, Clear, More */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                        <button
                            type="button"
                            onClick={() => {
                                handleHoldOrder();
                                native.haptic();
                            }}
                            disabled={cart.length === 0}
                            className="py-2 px-2 bg-[#F4F0E6] hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-[11px] font-extrabold text-[#2C4D35] dark:text-[#A9CBA2] flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all active:scale-95"
                        >
                            <PauseCircle size={14} />
                            <span>Hold</span>
                        </button>

                        <Protected permission="VOID_SALE">
                            <button
                                type="button"
                                onClick={() => {
                                    clearCart();
                                    native.haptic();
                                }}
                                disabled={cart.length === 0}
                                className="py-2 px-2 bg-[#F4F0E6] hover:bg-red-500/10 dark:bg-white/5 dark:hover:bg-red-500/20 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-[11px] font-extrabold text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all active:scale-95"
                            >
                                <Trash2 size={14} />
                                <span>Clear</span>
                            </button>
                        </Protected>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowActions(!showActions)}
                                className="w-full py-2 px-2 bg-[#F4F0E6] hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-[11px] font-extrabold text-stone-700 dark:text-gray-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            >
                                <Settings size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                <span>More</span>
                                {unseenPriceUpdatesCount > 0 && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                )}
                            </button>

                            {showActions && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                                    <div className="absolute bottom-full mb-2 right-0 w-48 bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-emerald-950/40 rounded-2xl shadow-2xl p-2 z-20 space-y-1 animate-in slide-in-from-bottom-2">
                                        <button
                                            type="button"
                                            onClick={() => { setIsRecallModalOpen(true); setShowActions(false); }}
                                            disabled={heldOrders.length === 0}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 text-left text-xs font-bold text-stone-700 dark:text-gray-300 disabled:opacity-30"
                                        >
                                            <PlayCircle size={14} className="text-amber-600" />
                                            <span>Recall ({heldOrders.length})</span>
                                        </button>
                                        <Protected permission="REFUND_SALE">
                                            <button
                                                type="button"
                                                onClick={() => { setIsReturnModalOpen(true); setShowActions(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 text-left text-xs font-bold text-stone-700 dark:text-gray-300"
                                            >
                                                <RotateCcw size={14} className="text-red-500" />
                                                <span>Returns / Refund</span>
                                            </button>
                                        </Protected>
                                        <button
                                            type="button"
                                            onClick={() => { handleOpenDrawer(); setShowActions(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 text-left text-xs font-bold text-stone-700 dark:text-gray-300"
                                        >
                                            <Box size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                            <span>Open Cash Drawer</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { handleReprintLast(); setShowActions(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 text-left text-xs font-bold text-stone-700 dark:text-gray-300"
                                        >
                                            <Printer size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                            <span>Reprint Receipt</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { handleCloseShift(); setShowActions(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 text-left text-xs font-bold text-amber-600"
                                        >
                                            <Lock size={14} />
                                            <span>Shift Summary</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Big 1-Tap Initialize Payment Button */}
                    <button
                        onClick={() => {
                            handleInitiatePayment();
                            native.haptic();
                        }}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-[#1E3F27] via-[#2C5E3B] to-[#224429] hover:opacity-95 disabled:bg-stone-200 dark:disabled:bg-white/5 text-white disabled:text-stone-400 dark:disabled:text-stone-600 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] font-black uppercase tracking-widest text-sm select-none cursor-pointer border border-emerald-400/20"
                    >
                        <CreditCard size={20} />
                        <span>Charge {CURRENCY_SYMBOL} {total.toLocaleString()}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Floating Checkout Bar - Visible when cart is closed and has items */}
            {!showCart && cart.length > 0 && (
                <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={() => {
                            setShowCart(true);
                            native.haptic();
                        }}
                        className="w-full bg-gradient-to-r from-[#1E3F27] via-[#2C5E3B] to-[#224429] text-white p-4 rounded-2xl shadow-[0_16px_40px_-6px_rgba(44,94,59,0.5)] border border-emerald-400/30 flex items-center justify-between font-extrabold active:scale-95 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 px-2.5 py-1 rounded-xl text-xs font-black">
                                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                            </div>
                            <span className="text-sm font-black uppercase tracking-wider">View Cart</span>
                        </div>
                        <div className="flex items-center gap-2 text-base font-black">
                            <span>{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
                            <ArrowRight size={20} className="text-amber-400" />
                        </div>
                    </button>
                </div>
            )}

            {/* Weight Entry Modal */}
            {weightPromptProduct && (
                <WeightEntryModal
                    product={weightPromptProduct}
                    onConfirm={confirmWeightEntry}
                    onCancel={() => setWeightPromptProduct(null)}
                />
            )}
        </>
    );
};
export default POSCartPanel;


