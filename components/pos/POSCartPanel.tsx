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
        updateCartItemPrice,
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
        unreviewedPriceUpdateCount,
        staleCartPriceChanges,
        handleInitiatePayment,
        setIsMiscItemModalOpen,
    } = usePOS();

    const { heldOrders, activeSite } = useData();
    const [showActions, setShowActions] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isNoSaleKickModalOpen, setIsNoSaleKickModalOpen] = useState(false);
    const [isCashDropModalOpen, setIsCashDropModalOpen] = useState(false);
    const [isVoidAuthModalOpen, setIsVoidAuthModalOpen] = useState(false);

    const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <>
            {/* Cart Panel: Desktop Side Panel / Mobile Full-Screen Sheet */}
            <div className={`
                fixed inset-0 z-[200] bg-[var(--theme-bg-app)] flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none
                lg:static lg:w-[420px] xl:w-[440px] lg:bg-[var(--theme-bg-card)] lg:border lg:border-[var(--theme-border-subtle)] lg:rounded-[28px] lg:shadow-xs lg:h-full lg:z-auto lg:transform-none overflow-hidden isolate
                ${showCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
            `}>
                {/* Header */}
                <div className="py-3 px-5 sm:px-6 border-b border-[var(--theme-border-subtle)] bg-[var(--theme-bg-card)] flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            setShowCart(false);
                            native.haptic();
                        }}
                        className="min-h-11 min-w-11 px-2.5 -ml-2 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors lg:hidden flex items-center gap-1.5 font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        aria-label={t('pos.backToProducts')}
                    >
                        <ArrowLeft size={18} />
                        <span>{t('pos.products')}</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[var(--theme-text-primary)] tracking-tight">
                            {t('pos.cart')} <span className="font-mono text-sm font-semibold text-[var(--theme-text-secondary)]">({totalItemCount})</span>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="min-h-11 flex items-center gap-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border-subtle)] px-3 py-2 rounded-xl transition-all group shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        aria-label={`Customer: ${selectedCustomer ? selectedCustomer.name : t('pos.walkIn')}. Change customer`}
                    >
                        <div className="w-5 h-5 rounded-md bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <User size={13} aria-hidden="true" />
                        </div>
                        <span className="text-xs font-semibold text-[var(--theme-text-primary)] max-w-[110px] truncate tracking-tight">
                            {selectedCustomer ? selectedCustomer.name : t('pos.walkIn')}
                        </span>
                    </button>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1.5 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-8 select-none animate-in fade-in duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] flex items-center justify-center mb-3 shadow-2xs">
                                <CreditCard size={24} className="text-[var(--theme-accent)]" />
                            </div>
                            <h4 className="text-sm font-bold text-[var(--theme-text-primary)] mb-1">{t('pos.cartEmpty')}</h4>
                            <p className="text-xs text-[var(--theme-text-secondary)]">{t('pos.tapItemsToStart')}</p>
                        </div>
                    ) : (
                        cart.map(item => {
                            const unit = getSellUnit(item.unit);
                            const stalePrice = staleCartPriceChanges.find(change => change.itemId === item.id);
                            return (
                                <div
                                    key={item.id}
                                    className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-[14px] border ${stalePrice ? 'bg-[var(--theme-status-warning-bg)]/80 border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)]' : 'bg-[var(--theme-bg-subtle)]/70 hover:bg-[var(--theme-bg-card)] border-[var(--theme-border-subtle)]/80 hover:border-[var(--theme-border)]'} flex items-center gap-2 sm:gap-2.5 min-h-[42px] sm:min-h-[44px] animate-in fade-in duration-200 motion-reduce:animate-none transition-all shadow-2xs`}
                                >
                                    <div className="flex-1 min-w-0 pr-1">
                                        <h4 className="text-[var(--theme-text-primary)] text-xs sm:text-[13px] font-semibold leading-tight truncate" title={item.name}>
                                            {item.name}
                                        </h4>
                                        <p className="text-[var(--theme-text-secondary)] font-mono font-medium text-[11px] leading-tight mt-0.5 whitespace-nowrap">
                                            {CURRENCY_SYMBOL} {formatPriceValue(item.price)}{unit.code !== 'UNIT' ? `/${unit.shortLabel}` : ''}
                                        </p>
                                        {stalePrice && (
                                            <div role="status" className="mt-1 px-2 py-1 rounded-[8px] bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] flex items-center justify-between gap-1.5">
                                                <span className="text-[11px] font-semibold leading-tight truncate">
                                                    {t('pos.catalogPriceChangedTo', { price: `${CURRENCY_SYMBOL} ${formatPriceValue(stalePrice.currentPrice)}` })}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateCartItemPrice(item.id, stalePrice.currentPrice)}
                                                    className="px-2 py-0.5 rounded-[6px] bg-[var(--theme-bg-card)] border border-[var(--theme-status-warning-border)] text-[10px] font-bold hover:bg-[var(--theme-bg-card-hover)] shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)] transition-colors"
                                                >
                                                    {t('pos.useCurrentPrice')}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stepper / Quantity Controls */}
                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                        {unit.allowDecimal ? (
                                            <div className="flex items-center bg-[var(--theme-bg-card)] rounded-[8px] px-1.5 py-0.5 border border-[var(--theme-border-subtle)] gap-1 shadow-2xs h-7 sm:h-8">
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
                                                    className="w-10 sm:w-11 bg-transparent text-[var(--theme-text-primary)] font-bold text-xs text-center outline-none tabular-nums font-mono"
                                                />
                                                <span className="text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase select-none">{unit.shortLabel}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center bg-[var(--theme-bg-card)] rounded-[8px] p-0.5 border border-[var(--theme-border-subtle)] shadow-2xs">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateQuantity(item.id, -1);
                                                        native.haptic();
                                                    }}
                                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-[6px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"
                                                    aria-label={`Decrease ${item.name} quantity`}
                                                >
                                                    <Minus size={13} />
                                                </button>
                                                <span className="text-[var(--theme-text-primary)] font-bold text-xs w-5 sm:w-6 text-center tabular-nums font-mono select-none">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateQuantity(item.id, 1);
                                                        native.haptic();
                                                    }}
                                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-[6px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-accent)]"
                                                    aria-label={`Increase ${item.name} quantity`}
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="min-w-[3.5rem] sm:min-w-[4rem] text-right font-bold text-xs sm:text-[13px] text-[var(--theme-text-primary)] font-mono tabular-nums whitespace-nowrap">
                                            {CURRENCY_SYMBOL} {formatPriceValue(item.price * item.quantity)}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                removeFromCart(item.id);
                                                native.haptic();
                                            }}
                                            className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-status-danger)] hover:bg-[var(--theme-status-danger-bg)]/20 rounded-[6px] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-status-danger)]"
                                            aria-label={`Remove ${item.name} from cart`}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Bottom Summary & Payment Section */}
                <div className="p-4 sm:p-5 bg-[var(--theme-bg-card)] border-t border-[var(--theme-border-subtle)] lg:rounded-b-[28px] shrink-0 space-y-3">
                    {/* Collapsible Tax / Discount Details Toggle */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] tracking-tight">
                                    {t('pos.subtotal')} ({totalItemCount} {totalItemCount === 1 ? t('pos.item') : t('pos.items')}):
                                </span>
                                <span className="font-bold text-xs text-[var(--theme-text-primary)] font-mono tabular-nums">
                                    {CURRENCY_SYMBOL} {subtotal.toLocaleString()}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowDetails(!showDetails)}
                                aria-expanded={showDetails}
                                className="min-h-8 px-2 text-[11px] font-semibold text-[var(--theme-text-primary)] flex items-center gap-1 hover:bg-[var(--theme-bg-subtle)] rounded-lg tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] transition-colors"
                            >
                                <span>{showDetails ? t('pos.hideBreakdown') : t('pos.viewBreakdown')}</span>
                                {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                        </div>

                        {/* Breakdown Panel */}
                        {showDetails && (
                            <div className="p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] space-y-2 text-xs animate-in fade-in duration-200">
                                <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                                    <div className="flex items-center gap-1.5">
                                        <span>{t('pos.discount')}</span>
                                        <Protected permission="APPLY_DISCOUNT">
                                            <button
                                                type="button"
                                                onClick={() => setIsDiscountModalOpen(true)}
                                                className="min-h-8 bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] px-2.5 rounded-lg font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                            >
                                                <Tag size={11} className="inline mr-1 text-pink-500" />
                                                {appliedDiscountCodeDetails ? appliedDiscountCodeDetails.code : t('pos.applyCode')}
                                            </button>
                                        </Protected>
                                    </div>
                                    <span className={cartDiscount > 0 ? "text-[var(--theme-text-primary)] font-bold font-mono tabular-nums" : "font-mono tabular-nums"}>
                                        {cartDiscount > 0 ? `- ${CURRENCY_SYMBOL} ${cartDiscount.toLocaleString()}` : `${CURRENCY_SYMBOL} 0`}
                                    </span>
                                </div>

                                {taxBreakdown.length > 0 && (
                                    <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                                        <span>{t('pos.tax')} ({taxBreakdown.map(t => t.name).join(', ')})</span>
                                        <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{CURRENCY_SYMBOL} {tax.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-[var(--theme-text-secondary)]">
                                    <div className="flex items-center gap-1.5">
                                        <span>{t('pos.cashRounding')}</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={isRoundingEnabled}
                                            aria-label={t('pos.cashRounding')}
                                            title={t('pos.cashRounding')}
                                            onClick={() => setIsRoundingEnabled(!isRoundingEnabled)}
                                            className={`min-h-8 min-w-8 rounded-xl transition-colors relative shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${isRoundingEnabled ? 'bg-[var(--theme-accent-muted)]' : 'bg-[var(--theme-bg-card)]'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2 transition-all shadow-xs ${isRoundingEnabled ? 'left-4 bg-[var(--theme-accent)]' : 'left-0.5 bg-[var(--theme-text-muted)]'}`} />
                                        </button>
                                    </div>
                                    <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">+{CURRENCY_SYMBOL} {roundingAdjustment.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {/* Grand Total Row */}
                        <div className="flex justify-between items-baseline pt-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                {t('pos.totalAmount')}
                            </span>
                            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--theme-text-primary)] tracking-tight tabular-nums">
                                {CURRENCY_SYMBOL} {total.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Quick Functions Bar: Hold, Clear, More */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                handleHoldOrder();
                                native.haptic();
                            }}
                            disabled={cart.length === 0}
                            className="min-h-11 py-2 px-2 bg-[var(--theme-bg-subtle)] enabled:hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border-subtle)] rounded-xl text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] flex items-center justify-center gap-1.5 disabled:text-[var(--theme-text-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] shadow-2xs"
                        >
                            <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                <PauseCircle size={15} />
                            </div>
                            <span>{t('pos.hold')}</span>
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
                            className="min-h-11 py-2 px-2 bg-[var(--theme-status-danger-bg)] enabled:hover:opacity-90 border border-[var(--theme-status-danger-border)] rounded-xl text-xs sm:text-sm font-semibold text-[var(--theme-status-danger-text)] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)] shadow-2xs"
                            title={t('pos.void')}
                        >
                            <div className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                                <Trash2 size={15} />
                            </div>
                            <span>{t('pos.void')}</span>
                        </button>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowActions(!showActions)}
                                aria-expanded={showActions}
                                className="w-full min-h-11 py-2 px-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border-subtle)] rounded-xl text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] flex items-center justify-center gap-1.5 transition-all tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] shadow-2xs"
                            >
                                <div className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                    <Settings size={15} />
                                </div>
                                <span>{t('pos.more')}</span>
                                {unreviewedPriceUpdateCount > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                )}
                            </button>

                            <POSCartActionsMenu
                                showActions={showActions}
                                setShowActions={setShowActions}
                                unseenPriceUpdatesCount={unreviewedPriceUpdateCount}
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
                        className="w-full min-h-[52px] sm:min-h-[56px] py-3 bg-[var(--theme-primary)] enabled:hover:bg-[var(--theme-primary-hover)] active:scale-[0.99] disabled:bg-[var(--theme-bg-subtle)] disabled:text-[var(--theme-text-muted)] disabled:border-[var(--theme-border)] disabled:cursor-not-allowed text-[var(--theme-primary-text)] rounded-[16px] flex items-center justify-center gap-2.5 transition-all font-bold text-base select-none border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] shadow-sm"
                    >
                        <CreditCard size={20} />
                        <span>{t('pos.charge')} {CURRENCY_SYMBOL} {total.toLocaleString()}</span>
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
                                {totalItemCount} {totalItemCount === 1 ? t('pos.item') : t('pos.items')}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">{t('pos.viewCart')}</span>
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


