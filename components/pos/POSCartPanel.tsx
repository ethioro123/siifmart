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
        fixed inset-0 z-50 bg-black/60 backdrop-blur-3xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        lg:static lg:w-[400px] lg:bg-black/40 lg:border lg:border-white/[0.08] lg:rounded-2xl lg:h-full lg:z-auto lg:transform-none lg:shadow-2xl
        ${showCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
      `}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
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
                        className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-2xl transition-all duration-300 group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-cyber-primary/10 border border-cyber-primary/20 flex items-center justify-center text-cyber-primary group-hover:scale-110 group-hover:bg-cyber-primary/20 transition-all">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-0.5">{t('pos.terminalSelection')}</p>
                            <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-cyber-primary transition-colors">{selectedCustomer ? selectedCustomer.name : t('pos.walkInCustomer')}</p>
                        </div>
                    </button>
                    <div className="flex gap-1">
                        {/* Actions moved to Functions Grid below */}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                            <CreditCard size={48} className="mb-4" />
                            <p>{t('pos.cartEmpty')}</p>
                        </div>
                    ) : (
                        cart.map(item => {
                            const unit = getSellUnit(item.unit);
                            return (
                                <div key={item.id} className="group relative bg-white/[0.03] hover:bg-white/[0.08] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white text-xs font-bold group-hover:text-cyber-primary transition-colors leading-tight truncate">{item.name}</h4>
                                            <p className="text-cyber-primary font-black text-[10px]">
                                                {CURRENCY_SYMBOL}{item.price}{unit.code !== 'UNIT' ? `/${unit.shortLabel}` : ''} × {formatQuantityWithUnit(item.quantity, item.unit)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {unit.allowDecimal ? (
                                                /* Weight/Volume: editable input */
                                                <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5 gap-1">
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
                                                        className="w-14 bg-transparent text-white font-black text-[10px] text-center outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    />
                                                    <span className="text-[9px] text-gray-400 font-bold pr-1.5 uppercase">{unit.shortLabel}</span>
                                                </div>
                                            ) : (
                                                /* Count: +/- stepper */
                                                <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                                        title="Decrease quantity"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-white font-black text-[10px] w-5 text-center tabular-nums">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                                        title="Increase quantity"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            <p className="text-white font-black text-xs tracking-tighter w-16 text-right">
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

                <div className="p-4 bg-black/40 backdrop-blur-3xl border-t border-white/10 rounded-b-2xl relative overflow-hidden flex flex-col shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-cyber-primary/5 to-transparent pointer-events-none" />
                    <div className="space-y-2 mb-3 relative z-10">
                        <div className="flex justify-between items-center text-gray-400">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate mr-2">{t('pos.subtotal')}</span>
                            <span className="font-bold tabular-nums text-sm whitespace-nowrap">{CURRENCY_SYMBOL} {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate">{t('pos.discount')}</span>
                                {appliedDiscountCodeDetails && (
                                    <div className="bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest truncate max-w-[60px]">
                                        {appliedDiscountCodeDetails.code}
                                    </div>
                                )}
                                <Protected permission="APPLY_DISCOUNT">
                                    <button onClick={() => setIsDiscountModalOpen(true)} className="text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded hover:bg-white/10 transition-all flex items-center gap-1 font-bold text-gray-300 whitespace-nowrap shrink-0">
                                        <Tag size={8} className="text-cyber-primary" /> {appliedDiscountCodeDetails ? t('common.edit').toUpperCase() : 'CODE'}
                                    </button>
                                </Protected>
                            </div>
                            <span className={cartDiscount > 0 ? "text-cyber-primary font-black tabular-nums text-sm whitespace-nowrap ml-2" : "text-gray-600 tabular-nums text-sm whitespace-nowrap ml-2"}>
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

                        <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 truncate mr-2">{t('common.total')}</span>
                            <span className="text-2xl font-black text-cyber-primary tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(0,255,157,0.3)] whitespace-nowrap">{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Command Grid - Compact */}
                    <div className="grid grid-cols-4 gap-1.5 mb-3 relative z-10">
                        <button
                            onClick={() => setIsRecallModalOpen(true)}
                            disabled={heldOrders.length === 0}
                            className="group relative flex flex-col items-center justify-center p-2 bg-yellow-400/5 hover:bg-yellow-400/10 rounded-xl border border-yellow-400/10 transition-all active:scale-95 disabled:opacity-20 aspect-square min-w-0"
                        >
                            <div className="relative mb-0.5 group-hover:scale-110 transition-transform">
                                <PlayCircle size={14} className="text-yellow-400" />
                                {heldOrders.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[6px] w-3 h-3 rounded-full flex items-center justify-center animate-pulse">
                                        {heldOrders.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-widest text-yellow-400/60 group-hover:text-yellow-400 truncate w-full text-center">{t('pos.recall')}</span>
                        </button>

                        <button
                            onClick={handleHoldOrder}
                            className="group relative flex flex-col items-center justify-center p-2 bg-blue-400/5 hover:bg-blue-400/10 rounded-xl border border-blue-400/10 transition-all active:scale-95 aspect-square min-w-0"
                        >
                            <PauseCircle size={14} className="text-blue-400 mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-blue-400/60 group-hover:text-blue-400 truncate w-full text-center">{t('pos.hold')}</span>
                        </button>

                        <Protected permission="VOID_SALE">
                            <button
                                onClick={clearCart}
                                className="group relative flex flex-col items-center justify-center p-2 bg-red-400/5 hover:bg-red-400/10 rounded-xl border border-red-400/10 transition-all active:scale-95 aspect-square min-w-0"
                            >
                                <Trash2 size={14} className="text-red-400 mb-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-red-400/60 group-hover:text-red-400 truncate w-full text-center">{t('pos.clear')}</span>
                            </button>
                        </Protected>

                        <Protected permission="REFUND_SALE">
                            <button
                                onClick={() => setIsReturnModalOpen(true)}
                                className="group relative flex flex-col items-center justify-center p-2 bg-white/[0.03] hover:bg-red-500/[0.05] rounded-xl border border-white/5 hover:border-red-500/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                            >
                                <RotateCcw size={14} className="text-red-400/60 group-hover:text-red-400 mb-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-gray-500 group-hover:text-red-400 transition-colors uppercase truncate w-full text-center">{t('pos.returns')}</span>
                            </button>
                        </Protected>

                        <button
                            onClick={handleOpenDrawer}
                            className="group relative flex flex-col items-center justify-center p-2 bg-white/[0.03] hover:bg-cyan-500/[0.05] rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                        >
                            <Box size={14} className="text-cyan-400/60 group-hover:text-cyan-400 mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-gray-500 group-hover:text-cyan-400 transition-colors uppercase truncate w-full text-center">{t('pos.drawer')}</span>
                        </button>

                        <button
                            onClick={handleCloseShift}
                            className="group relative flex flex-col items-center justify-center p-2 bg-white/[0.03] hover:bg-amber-500/[0.05] rounded-xl border border-white/5 hover:border-amber-500/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                        >
                            <Lock size={14} className="text-amber-400/60 group-hover:text-amber-400 mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-gray-500 group-hover:text-amber-400 transition-colors uppercase truncate w-full text-center">{t('pos.shift')}</span>
                        </button>

                        <button
                            onClick={handleReprintLast}
                            className="group relative flex flex-col items-center justify-center p-2 bg-white/[0.03] hover:bg-purple-500/[0.05] rounded-xl border border-white/5 hover:border-purple-500/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                        >
                            <Printer size={14} className="text-purple-400/60 group-hover:text-purple-400 mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-gray-500 group-hover:text-purple-400 transition-colors uppercase truncate w-full text-center">{t('pos.reprintShort')}</span>
                        </button>

                        {/* Price Updates Button */}
                        <button
                            onClick={() => setIsPriceUpdatesModalOpen(true)}
                            className="group relative flex flex-col items-center justify-center p-2 bg-white/[0.03] hover:bg-yellow-500/[0.05] rounded-xl border border-white/5 hover:border-yellow-500/20 transition-all duration-300 active:scale-[0.97] aspect-square min-w-0"
                        >
                            <div className="relative">
                                <DollarSign size={14} className="text-yellow-400/60 group-hover:text-yellow-400 mb-0.5 group-hover:scale-110 transition-transform" />
                                {priceUpdatedProducts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center text-[6px] font-bold text-white shadow-sm border border-black/50">
                                        {priceUpdatedProducts.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-widest text-gray-500 group-hover:text-yellow-400 transition-colors uppercase truncate w-full text-center">PRICES</span>
                        </button>

                        <div className="bg-white/[0.01] rounded-2xl border border-white/[0.02] flex items-center justify-center">
                            <Settings size={12} className="text-white/5" />
                        </div>
                    </div>

                    <button
                        onClick={handleInitiatePayment}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-cyber-primary hover:bg-cyber-primary/90 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-cyber-primary/20 active:scale-[0.98] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <CreditCard size={20} className="relative z-10 text-black" />
                        <span className="relative z-10 text-black font-black uppercase tracking-[0.3em] text-sm">{t('pos.initializePayment')}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Floating Checkout Bar - Visible when cart is closed */}
            {!showCart && cart.length > 0 && (
                <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={() => setShowCart(true)}
                        className="w-full bg-cyber-primary text-black p-4 rounded-2xl shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center justify-between font-bold active:scale-95 transition-transform"
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
                className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 fade-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 flex items-center justify-center">
                            <Scale size={16} className="text-cyber-primary" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-white text-sm font-bold leading-tight truncate">{product.name}</h3>
                            <p className="text-[10px] text-gray-400 truncate">
                                {CURRENCY_SYMBOL}{effectivePrice.toLocaleString()} per {unit.shortLabel}
                            </p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Close">
                        <X size={16} />
                    </button>
                </div>

                {/* Input */}
                <div className="p-6">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">
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
                            className="flex-1 min-w-0 bg-black/60 border border-white/10 rounded-xl px-2 py-3 lg:px-4 text-xl lg:text-2xl text-white font-mono text-center focus:border-cyber-primary/50 outline-none transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="text-sm lg:text-lg text-gray-400 font-bold uppercase shrink-0 w-8 lg:w-10 text-right">{unit.shortLabel}</span>
                    </div>

                    {unit.category === 'weight' && (
                        <div className="grid grid-cols-3 gap-1.5 lg:gap-2 mt-3">
                            {[0.25, 0.5, 1, 1.5, 2, 5].map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setValue(preset.toString())}
                                    className="py-1.5 lg:py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] lg:text-[10px] text-gray-300 font-bold transition-all active:scale-95 shadow-sm truncate whitespace-nowrap px-1"
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
                                    className="py-1.5 lg:py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] lg:text-[10px] text-gray-300 font-bold transition-all active:scale-95 shadow-sm truncate whitespace-nowrap px-1"
                                >
                                    {preset} {unit.shortLabel}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Line total preview */}
                    {numericValue > 0 && (
                        <div className="mt-4 p-3 bg-cyber-primary/5 border border-cyber-primary/10 rounded-xl flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Line Total</span>
                            <span className="text-lg text-cyber-primary font-black tabular-nums">
                                {CURRENCY_SYMBOL} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-sm transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => numericValue > 0 && onConfirm(numericValue)}
                        disabled={numericValue <= 0}
                        className="flex-1 py-3 bg-cyber-primary hover:bg-cyber-primary/90 disabled:bg-white/5 disabled:text-gray-600 text-black rounded-xl font-black text-sm transition-all uppercase tracking-wider"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};
