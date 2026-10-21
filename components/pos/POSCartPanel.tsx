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

    const { heldOrders, activeSite } = useData();
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
                lg:static lg:w-[400px] lg:bg-[var(--theme-bg-card)] lg:border lg:border-[var(--theme-border)] lg:rounded-3xl lg:h-full lg:z-auto lg:transform-none lg:shadow-xs overflow-hidden isolate
                ${showCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
            `}>
                {/* Header */}
                <div className="pt-4 pb-3 px-5 border-b border-[var(--theme-border-subtle)] bg-[var(--theme-bg-card)] lg:rounded-t-3xl flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            setShowCart(false);
                            native.haptic();
                        }}
                        className="min-h-11 min-w-11 px-2 -ml-2 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors lg:hidden flex items-center gap-1.5 font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        aria-label={t('pos.backToProducts')}
                    >
                        <ArrowLeft size={18} />
                        <span>Products</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            Cart ({totalItemCount})
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="min-h-11 flex items-center gap-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] px-3 rounded-2xl transition-colors group shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        aria-label={`Customer: ${selectedCustomer ? selectedCustomer.name : 'Walk-in'}. Change customer`}
                    >
                            <div className="w-5 h-5 rounded-md bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <User size={13} aria-hidden="true" />
                        </div>
                        <span className="text-xs font-semibold text-[var(--theme-text-primary)] max-w-[110px] truncate tracking-tight">
                            {selectedCustomer ? selectedCustomer.name : 'Walk-in'}
                        </span>
                    </button>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-8 select-none animate-in fade-in duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-subtle)] flex items-center justify-center mb-3 border border-[var(--theme-border)]">
                                <CreditCard size={24} className="text-teal-500" />
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
                                    className="bg-[var(--theme-bg-subtle)] p-3.5 rounded-2xl border border-[var(--theme-border)] flex items-center justify-between gap-3 animate-in fade-in duration-200 hover:bg-[var(--theme-bg-card-hover)] transition-colors"
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
                                                    aria-label={`Quantity of ${item.name} in ${unit.shortLabel}`}
                                                    step={unit.step}
                                                    min={unit.step}
                                                    value={item.quantity}
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && val > 0) setCartItemQuantity(item.id, val);
                                                    }}
                                                    className="w-12 bg-transparent text-[var(--theme-text-primary)] font-bold text-xs text-center outline-none tabular-nums"
                                                />
                                                <span className="text-xs text-[var(--theme-text-secondary)] font-bold uppercase">{unit.shortLabel}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center bg-[var(--theme-bg-card)] rounded-lg p-0.5 border border-[var(--theme-border)]">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateQuantity(item.id, -1);
                                                        native.haptic();
                                                    }}
                                                    className="min-h-11 min-w-11 rounded-md flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                                    aria-label={`Decrease ${item.name} quantity`}
                                                >
                                                    <Minus size={13} />
                                                </button>
                                                <span className="text-[var(--theme-text-primary)] font-bold text-xs w-6 text-center tabular-nums">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateQuantity(item.id, 1);
                                                        native.haptic();
                                                    }}
                                                    className="min-h-11 min-w-11 rounded-md flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                                    aria-label={`Increase ${item.name} quantity`}
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="w-16 text-right font-bold text-xs text-[var(--theme-text-primary)] font-mono tabular-nums">
                                            {CURRENCY_SYMBOL} {formatPriceValue(item.price * item.quantity)}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                removeFromCart(item.id);
                                                native.haptic();
                                            }}
                                            className="min-h-11 min-w-11 flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-status-danger)] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]"
                                            aria-label={`Remove ${item.name} from cart`}
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
                <div className="p-4 bg-[var(--theme-bg-card)] border-t border-[var(--theme-border-subtle)] lg:rounded-b-3xl shrink-0 shadow-xs">
                    {/* Collapsible Tax / Discount Details Toggle */}
                    <div className="mb-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] tracking-tight">
                                    Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}):
                                </span>
                                <span className="font-bold text-xs text-[var(--theme-text-primary)] font-mono tabular-nums">
                                    {CURRENCY_SYMBOL} {subtotal.toLocaleString()}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowDetails(!showDetails)}
                                aria-expanded={showDetails}
                                className="min-h-11 px-2 text-[11px] font-semibold text-[var(--theme-text-primary)] flex items-center gap-1 hover:bg-[var(--theme-bg-subtle)] rounded-lg tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                            >
                                <span>{showDetails ? 'Hide breakdown' : 'View breakdown'}</span>
                                {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                        </div>

                        {/* Breakdown Panel */}
                        {showDetails && (
                            <div className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-2 text-xs animate-in fade-in duration-200">
                                <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                                    <div className="flex items-center gap-1.5">
                                        <span>Discount</span>
                                        <Protected permission="APPLY_DISCOUNT">
                                            <button
                                                type="button"
                                                onClick={() => setIsDiscountModalOpen(true)}
                                                className="min-h-11 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-2.5 rounded-xl font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                            >
                                                <Tag size={11} className="inline mr-1 text-pink-500" />
                                                {appliedDiscountCodeDetails ? appliedDiscountCodeDetails.code : 'Apply Code'}
                                            </button>
                                        </Protected>
                                    </div>
                                    <span className={cartDiscount > 0 ? "text-[var(--theme-text-primary)] font-bold font-mono tabular-nums" : "font-mono tabular-nums"}>
                                        {cartDiscount > 0 ? `- ${CURRENCY_SYMBOL} ${cartDiscount.toLocaleString()}` : `${CURRENCY_SYMBOL} 0`}
                                    </span>
                                </div>

                                {taxBreakdown.length > 0 && (
                                    <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                                        <span>Tax ({taxBreakdown.map(t => t.name).join(', ')})</span>
                                        <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{CURRENCY_SYMBOL} {tax.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                                    <div className="flex items-center gap-1.5">
                                        <span>Cash Rounding</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={isRoundingEnabled}
                                            aria-label="Cash rounding"
                                            title="Toggle cash rounding"
                                            onClick={() => setIsRoundingEnabled(!isRoundingEnabled)}
                                            className={`min-h-11 min-w-11 rounded-xl transition-colors relative shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${isRoundingEnabled ? 'bg-[var(--theme-accent-muted)]' : 'bg-[var(--theme-bg-subtle)]'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full absolute top-1/2 -translate-y-1/2 transition-all shadow-xs ${isRoundingEnabled ? 'left-5 bg-[var(--theme-accent)]' : 'left-1 bg-[var(--theme-text-muted)]'}`} />
                                        </button>
                                    </div>
                                    <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">+{CURRENCY_SYMBOL} {roundingAdjustment.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {/* Grand Total Row */}
                        <div className="flex justify-between items-baseline pt-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                Total Amount
                            </span>
                            <span className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] tracking-tight tabular-nums">
                                {CURRENCY_SYMBOL} {total.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Quick Functions Bar: Hold, Clear, More */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => {
                                handleHoldOrder();
                                native.haptic();
                            }}
                            disabled={cart.length === 0}
                            className="min-h-11 py-2.5 px-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-2xl text-[11px] font-semibold text-[var(--theme-text-primary)] flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors shadow-2xs tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        >
                            <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                <PauseCircle size={13} />
                            </div>
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
                            className="min-h-11 py-2.5 px-2 bg-[var(--theme-status-danger-bg)] hover:opacity-90 border border-[var(--theme-status-danger-border)] rounded-2xl text-[11px] font-semibold text-[var(--theme-status-danger-text)] flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]"
                            title="Zero-Trust Void (Supervisor Auth Required)"
                        >
                            <div className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                                <Trash2 size={13} />
                            </div>
                            <span>Void</span>
                        </button>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowActions(!showActions)}
                                aria-expanded={showActions}
                                className="w-full min-h-11 py-2.5 px-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-2xl text-[11px] font-semibold text-[var(--theme-text-primary)] flex items-center justify-center gap-1.5 transition-colors shadow-2xs tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                            >
                                <div className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                    <Settings size={13} />
                                </div>
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
                        type="button"
                        onClick={() => {
                            handleInitiatePayment();
                            native.haptic();
                        }}
                        disabled={cart.length === 0}
                        className="w-full min-h-14 py-4 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] disabled:opacity-40 text-[var(--theme-primary-text)] rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-sm font-semibold uppercase tracking-wider text-xs sm:text-sm select-none border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
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
                        type="button"
                        onClick={() => {
                            setShowCart(true);
                            native.haptic();
                        }}
                        className="w-full min-h-14 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] p-3.5 rounded-2xl shadow-xl border border-transparent flex items-center justify-between font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="bg-black/15 dark:bg-black/20 border border-black/10 dark:border-black/25 text-inherit px-2 py-0.5 rounded-lg text-xs font-bold">
                                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">View Cart</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold font-mono tabular-nums">
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


