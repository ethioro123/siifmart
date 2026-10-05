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
    DollarSign, Settings, Scale, X, ChevronDown, ChevronUp, ArrowDownCircle
} from 'lucide-react';
import { CashDropModal } from './modals/CashDropModal';
import { NoSaleKickModal } from './modals/NoSaleKickModal';
import { VoidAuthorizationModal } from './modals/VoidAuthorizationModal';
import { POSCartActionsMenu } from './components/POSCartActionsMenu';

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
        setIsMiscItemModalOpen,
    } = usePOS();

    const { heldOrders } = useData();
    const [showActions, setShowActions] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isNoSaleKickModalOpen, setIsNoSaleKickModalOpen] = useState(false);
    const [isCashDropModalOpen, setIsCashDropModalOpen] = useState(false);
    const [isVoidAuthModalOpen, setIsVoidAuthModalOpen] = useState(false);

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
                fixed inset-0 z-[200] bg-[var(--theme-bg-app)] flex flex-col transition-transform duration-300 ease-out
                lg:static lg:w-[400px] lg:bg-[var(--theme-bg-card)] lg:border lg:border-[var(--theme-border)] lg:rounded-2xl lg:h-full lg:z-auto lg:transform-none lg:shadow-xs
                ${showCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
            `}>
                {/* Header */}
                <div className="pt-3 pb-3 px-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex items-center justify-between shrink-0 shadow-xs">
                    <button
                        onClick={() => {
                            setShowCart(false);
                            native.haptic();
                        }}
                        className="p-2 -ml-2 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] active:scale-95 transition-colors lg:hidden flex items-center gap-1.5 font-bold text-sm cursor-pointer"
                        aria-label={t('pos.backToProducts')}
                    >
                        <ArrowLeft size={18} />
                        <span>Products</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--theme-text-primary)]">
                            Cart ({totalItemCount})
                        </span>
                    </div>

                    <button
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="flex items-center gap-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] px-3 py-1.5 rounded-xl transition-colors active:scale-95 group cursor-pointer"
                    >
                        <User size={14} className="text-[var(--theme-text-secondary)]" />
                        <span className="text-xs font-bold text-[var(--theme-text-primary)] max-w-[110px] truncate">
                            {selectedCustomer ? selectedCustomer.name : 'Walk-in'}
                        </span>
                    </button>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-subtle)] flex items-center justify-center mb-3 border border-[var(--theme-border)]">
                                <CreditCard size={24} className="text-[var(--theme-text-secondary)]" />
                            </div>
                            <h4 className="text-sm font-bold text-[var(--theme-text-primary)] mb-1">{t('pos.cartEmpty')}</h4>
                            <p className="text-xs text-[var(--theme-text-secondary)]">Tap items from the catalog or scan barcodes to start sale.</p>
                        </div>
                    ) : (
                        cart.map(item => {
                            const unit = getSellUnit(item.unit);
                            return (
                                <div
                                    key={item.id}
                                    className="bg-[var(--theme-bg-subtle)] p-3 rounded-xl border border-[var(--theme-border)] flex items-center justify-between gap-3 animate-in fade-in duration-200"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[var(--theme-text-primary)] text-xs font-bold truncate leading-snug">
                                            {item.name}
                                        </h4>
                                        <p className="text-[var(--theme-text-secondary)] font-mono font-bold text-[11px] mt-0.5">
                                            {CURRENCY_SYMBOL} {formatPriceValue(item.price)}{unit.code !== 'UNIT' ? `/${unit.shortLabel}` : ''}
                                        </p>
                                    </div>

                                    {/* Stepper / Quantity Controls */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {unit.allowDecimal ? (
                                            <div className="flex items-center bg-[var(--theme-bg-card)] rounded-lg px-2 py-1 border border-[var(--theme-border)] gap-1">
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
                                                    className="w-12 bg-transparent text-[var(--theme-text-primary)] font-bold text-xs text-center outline-none tabular-nums"
                                                />
                                                <span className="text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase">{unit.shortLabel}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center bg-[var(--theme-bg-card)] rounded-lg p-0.5 border border-[var(--theme-border)]">
                                                <button
                                                    onClick={() => {
                                                        updateQuantity(item.id, -1);
                                                        native.haptic();
                                                    }}
                                                    className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors active:scale-90 cursor-pointer"
                                                    title="Decrease quantity"
                                                >
                                                    <Minus size={13} />
                                                </button>
                                                <span className="text-[var(--theme-text-primary)] font-bold text-xs w-6 text-center tabular-nums">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        updateQuantity(item.id, 1);
                                                        native.haptic();
                                                    }}
                                                    className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors active:scale-90 cursor-pointer"
                                                    title="Increase quantity"
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="w-16 text-right font-bold text-xs text-[var(--theme-text-primary)] font-mono tabular-nums">
                                            {CURRENCY_SYMBOL} {formatPriceValue(item.price * item.quantity)}
                                        </div>

                                        <button
                                            onClick={() => {
                                                removeFromCart(item.id);
                                                native.haptic();
                                            }}
                                            className="p-1.5 text-[var(--theme-text-muted)] hover:text-rose-500 rounded-lg active:scale-90 transition-colors cursor-pointer"
                                            title="Remove item"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Bottom Summary & Payment Section */}
                <div className="p-4 bg-[var(--theme-bg-card)] border-t border-[var(--theme-border)] lg:rounded-b-2xl shrink-0 shadow-xs">
                    {/* Collapsible Tax / Discount Details Toggle */}
                    <div className="mb-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[var(--theme-text-secondary)]">
                                    Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}):
                                </span>
                                <span className="font-bold text-xs text-[var(--theme-text-primary)] font-mono tabular-nums">
                                    {CURRENCY_SYMBOL} {subtotal.toLocaleString()}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-[11px] font-bold text-[var(--theme-text-primary)] flex items-center gap-0.5 hover:opacity-80 cursor-pointer"
                            >
                                <span>{showDetails ? 'Hide breakdown' : 'View breakdown'}</span>
                                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>

                        {/* Breakdown Panel */}
                        {showDetails && (
                            <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-1.5 text-xs animate-in fade-in duration-200">
                                <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                                    <div className="flex items-center gap-1.5">
                                        <span>Discount</span>
                                        <Protected permission="APPLY_DISCOUNT">
                                            <button
                                                onClick={() => setIsDiscountModalOpen(true)}
                                                className="text-[9px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded font-bold text-[var(--theme-text-primary)] cursor-pointer"
                                            >
                                                <Tag size={8} className="inline mr-0.5" />
                                                {appliedDiscountCodeDetails ? appliedDiscountCodeDetails.code : 'Apply Code'}
                                            </button>
                                        </Protected>
                                    </div>
                                    <span className={cartDiscount > 0 ? "text-[var(--theme-text-primary)] font-bold tabular-nums" : "tabular-nums"}>
                                        {cartDiscount > 0 ? `- ${CURRENCY_SYMBOL} ${cartDiscount.toLocaleString()}` : `${CURRENCY_SYMBOL} 0`}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                                    <span>Tax ({taxBreakdown.map(t => t.name).join(', ') || 'Standard'})</span>
                                    <span className="tabular-nums font-medium">{CURRENCY_SYMBOL} {tax.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                                    <div className="flex items-center gap-1.5">
                                        <span>Cash Rounding</span>
                                        <button
                                            title="Toggle cash rounding"
                                            onClick={() => setIsRoundingEnabled(!isRoundingEnabled)}
                                            className={`w-6 h-3.5 rounded-full transition-colors relative shrink-0 cursor-pointer ${isRoundingEnabled ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-border)]'}`}
                                        >
                                            <div className={`w-2.5 h-2.5 bg-[var(--theme-primary-text)] rounded-full absolute top-0.5 transition-all shadow-xs ${isRoundingEnabled ? 'left-3' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    <span className="tabular-nums font-medium">+{CURRENCY_SYMBOL} {roundingAdjustment.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {/* Grand Total Row */}
                        <div className="flex justify-between items-baseline pt-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                Total Amount
                            </span>
                            <span className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] tracking-tight tabular-nums">
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
                            className="py-2 px-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl text-[11px] font-bold text-[var(--theme-text-primary)] flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors active:scale-95 cursor-pointer"
                        >
                            <PauseCircle size={14} />
                            <span>Hold</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (cart.length > 0) {
                                    setIsVoidAuthModalOpen(true);
                                }
                                native.haptic();
                            }}
                            disabled={cart.length === 0}
                            className="py-2 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-[11px] font-bold text-rose-500 flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors active:scale-95 cursor-pointer"
                            title="Zero-Trust Void (Supervisor Auth Required)"
                        >
                            <Trash2 size={14} />
                            <span>Void</span>
                        </button>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowActions(!showActions)}
                                className="w-full py-2 px-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl text-[11px] font-bold text-[var(--theme-text-primary)] flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
                            >
                                <Settings size={14} className="text-[var(--theme-text-secondary)]" />
                                <span>More</span>
                                {unseenPriceUpdatesCount > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                )}
                            </button>

                            <POSCartActionsMenu
                                showActions={showActions}
                                setShowActions={setShowActions}
                                unseenPriceUpdatesCount={unseenPriceUpdatesCount}
                                heldOrdersCount={heldOrders.length}
                                onOpenPriceUpdates={() => setIsPriceUpdatesModalOpen(true)}
                                onOpenRecall={() => setIsRecallModalOpen(true)}
                                onOpenReturn={() => setIsReturnModalOpen(true)}
                                onOpenCashDrop={() => setIsCashDropModalOpen(true)}
                                onOpenNoSaleKick={() => setIsNoSaleKickModalOpen(true)}
                                onReprintLast={() => handleReprintLast()}
                                onCloseShift={() => handleCloseShift()}
                                onOpenMiscItem={() => setIsMiscItemModalOpen(true)}
                            />
                        </div>
                    </div>

                    {/* Big 1-Tap Initialize Payment Button */}
                    <button
                        onClick={() => {
                            handleInitiatePayment();
                            native.haptic();
                        }}
                        disabled={cart.length === 0}
                        className="w-full py-3.5 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-30 text-[var(--theme-primary-text)] rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-[0.98] font-bold uppercase tracking-wider text-xs sm:text-sm select-none cursor-pointer border border-transparent"
                    >
                        <CreditCard size={18} />
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
                        className="w-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] p-3.5 rounded-xl shadow-lg border border-transparent flex items-center justify-between font-bold active:scale-95 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="bg-[var(--theme-pill-bg)] border border-[var(--theme-border)] px-2 py-0.5 rounded-lg text-xs font-bold">
                                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">View Cart</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold font-mono">
                            <span>{CURRENCY_SYMBOL} {total.toLocaleString()}</span>
                            <ArrowRight size={16} />
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

            {/* Zero-Trust Modals */}
            <NoSaleKickModal isOpen={isNoSaleKickModalOpen} onClose={() => setIsNoSaleKickModalOpen(false)} />
            <CashDropModal isOpen={isCashDropModalOpen} onClose={() => setIsCashDropModalOpen(false)} />
            <VoidAuthorizationModal
                isOpen={isVoidAuthModalOpen}
                onClose={() => setIsVoidAuthModalOpen(false)}
                onAuthorized={clearCart}
                itemsCount={cart.reduce((s, i) => s + i.quantity, 0)}
                voidTotal={total}
                itemsSummary={cart.map(i => `${i.quantity}x ${i.name}`).join(', ')}
            />
        </>
    );
};
export default POSCartPanel;


