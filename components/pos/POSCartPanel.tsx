import React, { useState } from 'react';
import { usePOS } from './POSContext';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Protected } from '../Protected';
import { CURRENCY_SYMBOL } from '../../constants';
import { getSellUnit, formatQuantityWithUnit } from '../../utils/units';
import {
    ArrowLeft, ArrowRight, User, CreditCard, Minus, Plus, Trash2, Tag,
    PlayCircle, PauseCircle, RotateCcw, Box, Lock, Printer, DollarSign, Settings, Scale, X
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
        handleInitiatePayment,
    } = usePOS();

    const { heldOrders } = useData();

    return (
        <>
            {/* Right: Cart Summary - Desktop: Side Panel, Mobile: Slide-up Bottom Sheet */}
            <div className={`
        fixed inset-0 z-50 bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-[#E2DCCE] dark:border-emerald-950/20
        lg:static lg:w-[400px] lg:bg-white/85 lg:dark:bg-[#18201B]/60 lg:border lg:border-[#E2DCCE] lg:dark:border-emerald-950/20 lg:rounded-[32px] lg:h-full lg:z-auto lg:transform-none lg:shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] lg:dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)]
        ${showCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
      `}>
                <div className="p-4 border-b border-[#E2DCCE]/50 dark:border-white/5 flex items-center justify-between">
                    <button
                        onClick={() => setShowCart(false)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors lg:hidden flex items-center gap-2"
                        aria-label={t('pos.backToProducts')}
                    >
                        <ArrowLeft size={20} />
                        <span className="font-bold text-white">{t('pos.backToProducts')}</span>
                    </button>
                    <button
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="flex items-center gap-3 hover:bg-[#2C5E3B]/5 dark:hover:bg-white/5 p-2 rounded-2xl transition-all duration-300 group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] group-hover:scale-110 group-hover:bg-[#2C5E3B]/20 transition-all">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-[0.2em] mb-0.5">{t('pos.terminalSelection')}</p>
                            <p className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9] line-clamp-1 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">{selectedCustomer ? selectedCustomer.name : t('pos.walkInCustomer')}</p>
                        </div>
                    </button>
                    <div className="flex gap-1">
                        {/* Actions moved to Functions Grid below */}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-500">
                            <div className="w-16 h-16 rounded-2xl bg-[#2C5E3B]/5 flex items-center justify-center mb-4 border border-[#2C5E3B]/10 dark:border-white/5">
                                <CreditCard size={32} className="text-[#2C5E3B]/40 dark:text-[#A9CBA2]/40" />
                            </div>
                            <h4 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9] mb-1">{t('pos.cartEmpty')}</h4>
                            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">{t('pos.scanOrSelectProducts') || 'Scan barcodes or tap products to build a sale.'}</p>
                        </div>
                    ) : (
                        cart.map(item => {
                            const unit = getSellUnit(item.unit);
                            return (
                                <div key={item.id} className="group relative bg-white/50 dark:bg-black/10 hover:bg-white dark:hover:bg-[#18201B]/40 p-3 rounded-xl border border-[#E2DCCE]/50 dark:border-white/5 hover:border-[#2C5E3B]/20 transition-all duration-300 animate-in fade-in slide-in-from-right-4 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[#1E3F27] dark:text-[#EAE5D9] text-xs font-bold group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors leading-tight truncate">{item.name}</h4>
                                            <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-black text-[10px]">
                                                {CURRENCY_SYMBOL}{item.price}{unit.code !== 'UNIT' ? `/${unit.shortLabel}` : ''} × {formatQuantityWithUnit(item.quantity, item.unit)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {unit.allowDecimal ? (
                                                /* Weight/Volume: editable input */
                                                <div className="flex items-center bg-white/90 dark:bg-black/40 rounded-lg p-0.5 border border-[#E2DCCE] dark:border-white/5 gap-1">
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
                                                        className="w-14 bg-transparent text-[#1E3F27] dark:text-white font-black text-[10px] text-center outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    />
                                                    <span className="text-[9px] text-[#4D6E56] dark:text-gray-400 font-bold pr-1.5 uppercase">{unit.shortLabel}</span>
                                                </div>
                                            ) : (
                                                /* Count: +/- stepper */
                                                <div className="flex items-center bg-white/90 dark:bg-black/40 rounded-lg p-0.5 border border-[#E2DCCE] dark:border-white/5">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="w-6 h-6 rounded flex items-center justify-center text-[#4D6E56] dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                                        title="Decrease quantity"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-[#1E3F27] dark:text-white font-black text-[10px] w-5 text-center tabular-nums">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-6 h-6 rounded flex items-center justify-center text-[#4D6E56] dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                                        title="Increase quantity"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            <p className="text-[#1E3F27] dark:text-white font-black text-xs tracking-tighter w-16 text-right">
                                                {CURRENCY_SYMBOL}{(item.price * item.quantity).toLocaleString()}
                                            </p>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors"
                                                title="Remove item"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 bg-white/50 dark:bg-black/30 border-t border-[#E2DCCE] dark:border-white/10 lg:rounded-b-[32px] relative overflow-hidden flex flex-col shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C5E3B]/5 to-transparent pointer-events-none" />
                    <div className="space-y-2 mb-3 relative z-10">
                        <div className="flex justify-between items-center text-[#4D6E56] dark:text-[#7A9E83]">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate mr-2">{t('pos.subtotal')}</span>
                            <span className="font-bold tabular-nums text-sm whitespace-nowrap">{CURRENCY_SYMBOL} {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[#4D6E56] dark:text-[#7A9E83]">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate">{t('pos.discount')}</span>
                                {appliedDiscountCodeDetails && (
                                    <div className="bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest truncate max-w-[60px]">
                                        {appliedDiscountCodeDetails.code}
                                    </div>
                                )}
                                <Protected permission="APPLY_DISCOUNT">
                                    <button onClick={() => setIsDiscountModalOpen(true)} className="text-[8px] bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 px-1.5 py-0.5 rounded hover:bg-white/10 transition-all flex items-center gap-1 font-bold text-[#2C4D35] dark:text-[#A9CBA2] whitespace-nowrap shrink-0">
                                        <Tag size={8} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> {appliedDiscountCodeDetails ? t('common.edit').toUpperCase() : 'CODE'}
                                    </button>
                                </Protected>
                            </div>
                            <span className={cartDiscount > 0 ? "text-[#2C5E3B] dark:text-[#A9CBA2] font-black tabular-nums text-sm whitespace-nowrap ml-2" : "text-gray-600 tabular-nums text-sm whitespace-nowrap ml-2"}>
                                {cartDiscount > 0 ? `- ${CURRENCY_SYMBOL} ${cartDiscount.toLocaleString()}` : `${CURRENCY_SYMBOL} 0`}
                            </span>
                        </div>

                        {/* Tax Breakdown */}
                        <div className="space-y-0.5">
                            {taxBreakdown.map((rule, idx) => (
                                <div key={idx} className="flex justify-between items-center text-gray-400">
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-1 truncate mr-2">
                                        {rule.name}
                                        {rule.compound && <span className="text-purple-400 text-[8px]">+</span>}
                                    </span>
                                    <span className="font-bold tabular-nums text-xs whitespace-nowrap">{CURRENCY_SYMBOL} {rule.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                            {taxBreakdown.length > 1 && (
                                <div className="flex justify-between items-center text-gray-500 pt-1 border-t border-white/5">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] truncate mr-2">{t('pos.totalTax')}</span>
                                    <span className="font-bold tabular-nums text-sm text-white whitespace-nowrap">{CURRENCY_SYMBOL} {tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>

                        {/* Cash Rounding */}
                        <div className="flex justify-between items-center text-gray-400 py-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] truncate">{t('pos.cashRounding')}</span>
                                <button
                                    title="Toggle cash rounding to nearest 5"
                                    onClick={() => setIsRoundingEnabled(!isRoundingEnabled)}
                                    className={`w-8 h-4 rounded-full transition-all relative shrink-0 ${isRoundingEnabled ? 'bg-amber-500' : 'bg-white/10'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow ${isRoundingEnabled ? 'left-4.5' : 'left-0.5'}`} />
                                </button>
                            </div>
                            <span className={roundingAdjustment > 0 ? "text-amber-400 font-bold tabular-nums text-xs whitespace-nowrap ml-2" : "text-gray-600 tabular-nums text-xs whitespace-nowrap ml-2"}>
                                {roundingAdjustment > 0 ? `+ ${CURRENCY_SYMBOL} ${roundingAdjustment.toFixed(2)}` : `${CURRENCY_SYMBOL} 0`}
                            </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-[#E2DCCE]/50 dark:border-white/10 mt-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 truncate mr-2">{t('common.total')}</span>
                            <span className="text-2xl font-black text-[#2C5E3B] dark:text-[#EAE5D9] tracking-tighter tabular-nums drop-shadow-[0_2px_10px_rgba(44,94,59,0.15)] whitespace-nowrap">{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
                        </div>
                    </div>
                    {/* Command Grid - Compact */}
                    <div className="grid grid-cols-4 gap-1.5 mb-3 relative z-10">
                        <button
                            onClick={() => setIsRecallModalOpen(true)}
                            disabled={heldOrders.length === 0}
                            className="group relative flex flex-col items-center justify-center p-2 bg-amber-600/5 hover:bg-amber-600/10 rounded-xl border border-amber-600/20 transition-all active:scale-95 disabled:opacity-20 aspect-square min-w-0"
                        >
                            <div className="relative mb-0.5 group-hover:scale-110 transition-transform">
                                <PlayCircle size={14} className="text-amber-600 dark:text-amber-500" />
                                {heldOrders.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[6px] w-3 h-3 rounded-full flex items-center justify-center animate-pulse">
                                        {heldOrders.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-widest text-amber-600/60 group-hover:text-amber-600 dark:text-amber-500/60 dark:group-hover:text-amber-500 truncate w-full text-center">{t('pos.recall')}</span>
                        </button>

                        <button
                            onClick={handleHoldOrder}
                            className="group relative flex flex-col items-center justify-center p-2 bg-[#2C5E3B]/5 hover:bg-[#2C5E3B]/10 rounded-xl border border-[#2C5E3B]/20 transition-all active:scale-95 aspect-square min-w-0"
                        >
                            <PauseCircle size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] truncate w-full text-center">{t('pos.hold')}</span>
                        </button>

                        <Protected permission="VOID_SALE">
                            <button
                                onClick={clearCart}
                                className="group relative flex flex-col items-center justify-center p-2 bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/20 transition-all active:scale-95 aspect-square min-w-0"
                            >
                                <Trash2 size={14} className="text-red-500 mb-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-red-500/60 group-hover:text-red-500 truncate w-full text-center">{t('pos.clear')}</span>
                            </button>
                        </Protected>

                        <Protected permission="REFUND_SALE">
                            <button
                                onClick={() => setIsReturnModalOpen(true)}
                                className="group relative flex flex-col items-center justify-center p-2 bg-[#FAF8F5] dark:bg-white/5 hover:bg-red-500/10 rounded-xl border border-[#E2DCCE] dark:border-white/5 hover:border-red-500/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                            >
                                <RotateCcw size={14} className="text-red-500 mb-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-stone-500 dark:text-gray-400 group-hover:text-red-500 transition-colors uppercase truncate w-full text-center">{t('pos.returns')}</span>
                            </button>
                        </Protected>

                        <button
                            onClick={handleOpenDrawer}
                            className="group relative flex flex-col items-center justify-center p-2 bg-[#FAF8F5] dark:bg-white/5 hover:bg-[#2C5E3B]/10 rounded-xl border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                        >
                            <Box size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-stone-500 dark:text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors uppercase truncate w-full text-center">{t('pos.drawer')}</span>
                        </button>

                        <button
                            onClick={handleCloseShift}
                            className="group relative flex flex-col items-center justify-center p-2 bg-[#FAF8F5] dark:bg-white/5 hover:bg-amber-600/10 rounded-xl border border-[#E2DCCE] dark:border-white/5 hover:border-amber-600/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                        >
                            <Lock size={14} className="text-amber-600 dark:text-amber-500 mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-stone-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors uppercase truncate w-full text-center">{t('pos.shift')}</span>
                        </button>

                        <button
                            onClick={handleReprintLast}
                            className="group relative flex flex-col items-center justify-center p-2 bg-[#FAF8F5] dark:bg-white/5 hover:bg-[#2C5E3B]/10 rounded-xl border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                        >
                            <Printer size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-stone-500 dark:text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors uppercase truncate w-full text-center">{t('pos.reprintShort')}</span>
                        </button>

                        {/* Price Updates Button */}
                        <button
                            onClick={() => setIsPriceUpdatesModalOpen(true)}
                            className="group relative flex flex-col items-center justify-center p-2 bg-[#FAF8F5] dark:bg-white/5 hover:bg-amber-600/10 rounded-xl border border-[#E2DCCE] dark:border-white/5 hover:border-amber-600/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                        >
                            <div className="relative">
                                <DollarSign size={14} className="text-amber-600 dark:text-amber-500 mb-0.5 group-hover:scale-110 transition-transform" />
                                {priceUpdatedProducts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center text-[6px] font-bold text-white shadow-sm border border-black/50">
                                        {priceUpdatedProducts.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-widest text-stone-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors uppercase truncate w-full text-center">PRICES</span>
                        </button>
                    </div>

                    <button
                        onClick={handleInitiatePayment}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-[#224429] to-[#2C5E3B] hover:opacity-90 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg active:scale-[0.98] group relative overflow-hidden text-white font-black uppercase tracking-[0.3em] text-sm select-none cursor-pointer"
                    >
                        <CreditCard size={20} className="relative z-10" />
                        <span className="relative z-10">{t('pos.initializePayment')}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Floating Checkout Bar - Visible when cart is closed */}
            {!showCart && cart.length > 0 && (
                <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={() => setShowCart(true)}
                        className="w-full bg-gradient-to-r from-[#224429] to-[#2C5E3B] text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-bold active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-black/20 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                                {cart.reduce((sum, item) => sum + item.quantity, 0)}
                            </div>
                            <span className="text-sm uppercase tracking-wider">{t('pos.viewOrder')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-lg">
                            <span>{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
                            <ArrowRight size={20} />
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

/** Inline weight/quantity entry modal for decimal-unit products */
const WeightEntryModal: React.FC<{
    product: { name: string; price: number; unit?: string; isOnSale?: boolean; salePrice?: number };
    onConfirm: (qty: number) => void;
    onCancel: () => void;
}> = ({ product, onConfirm, onCancel }) => {
    const [value, setValue] = useState('');
    const unit = getSellUnit(product.unit);
    const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
    const numericValue = parseFloat(value) || 0;
    const lineTotal = effectivePrice * numericValue;

    return (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onCancel}>
            <div
                className="bg-white/95 dark:bg-[#18201B] border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 fade-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#E2DCCE]/50 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 flex items-center justify-center">
                            <Scale size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[#1E3F27] dark:text-[#EAE5D9] text-sm font-bold leading-tight truncate">{product.name}</h3>
                            <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] truncate">
                                {CURRENCY_SYMBOL}{effectivePrice.toLocaleString()} per {unit.shortLabel}
                            </p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-1.5 hover:bg-white/10 rounded-lg text-[#4D6E56] dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors" title="Close">
                        <X size={16} />
                    </button>
                </div>

                {/* Input */}
                <div className="p-6">
                    <label className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-bold uppercase tracking-widest block mb-2">
                        Enter {unit.label}
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            step={unit.step}
                            min={unit.step}
                            autoFocus
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && numericValue > 0) onConfirm(numericValue);
                                if (e.key === 'Escape') onCancel();
                            }}
                            placeholder="0.00"
                            className="flex-1 min-w-0 bg-white dark:bg-black/60 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-2 py-3 lg:px-4 text-xl lg:text-2xl text-[#1E3F27] dark:text-white font-mono text-center focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] outline-none transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="text-sm lg:text-lg text-[#4D6E56] dark:text-gray-400 font-bold uppercase shrink-0 w-8 lg:w-10 text-right">{unit.shortLabel}</span>
                    </div>

                    {unit.category === 'weight' && (
                        <div className="grid grid-cols-3 gap-1.5 lg:gap-2 mt-3">
                            {[0.25, 0.5, 1, 1.5, 2, 5].map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setValue(preset.toString())}
                                    className="py-1.5 lg:py-2 bg-white/90 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-[9px] lg:text-[10px] text-[#2C4D35] dark:text-gray-300 font-bold transition-all active:scale-95 shadow-sm truncate whitespace-nowrap px-1"
                                >
                                    {preset} {unit.shortLabel}
                                </button>
                            ))}
                        </div>
                    )}
                    {unit.category === 'volume' && (
                        <div className="grid grid-cols-3 gap-1.5 lg:gap-2 mt-3">
                            {[0.25, 0.5, 1, 2, 5, 10].map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setValue(preset.toString())}
                                    className="py-1.5 lg:py-2 bg-white/90 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-[9px] lg:text-[10px] text-[#2C4D35] dark:text-gray-300 font-bold transition-all active:scale-95 shadow-sm truncate whitespace-nowrap px-1"
                                >
                                    {preset} {unit.shortLabel}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Line total preview */}
                    {numericValue > 0 && (
                        <div className="mt-4 p-3 bg-[#2C5E3B]/5 border border-[#2C5E3B]/10 rounded-xl flex justify-between items-center">
                            <span className="text-[10px] text-[#4D6E56] dark:text-gray-400 font-bold uppercase">Line Total</span>
                            <span className="text-lg text-[#2C5E3B] dark:text-[#A9CBA2] font-black tabular-nums">
                                {CURRENCY_SYMBOL} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#E2DCCE]/50 dark:border-white/5 flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-white/90 dark:bg-black/30 text-[#4D6E56] dark:text-gray-300 rounded-xl font-bold text-sm transition-all border border-[#E2DCCE] dark:border-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => numericValue > 0 && onConfirm(numericValue)}
                        disabled={numericValue <= 0}
                        className="flex-1 py-3 bg-gradient-to-r from-[#224429] to-[#2C5E3B] disabled:bg-white/5 disabled:text-gray-600 text-white rounded-xl font-black text-sm transition-all uppercase tracking-wider"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};
