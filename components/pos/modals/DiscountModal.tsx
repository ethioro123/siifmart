import React from 'react';
import { usePOS } from '../POSContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { Tag, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

export const DiscountModal: React.FC = () => {
    const {
        isDiscountModalOpen,
        setIsDiscountModalOpen,
        appliedDiscountCodeDetails,
        cartDiscount,
        handleRemoveDiscount,
        discountCodeInput,
        setDiscountCodeInput,
        setDiscountCodeError,
        discountCodeError,
        handleValidateDiscountCode,
        isValidatingCode,
        subtotal,
    } = usePOS();

    return (
        <Modal isOpen={isDiscountModalOpen} onClose={() => { setIsDiscountModalOpen(false); setDiscountCodeError(''); }} title="Apply Discount Code" size="sm">
            <div className="space-y-5">
                {/* Current Applied Discount */}
                {appliedDiscountCodeDetails && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-emerald-500 text-sm">{appliedDiscountCodeDetails.code}</p>
                                    <p className="text-xs text-[var(--theme-text-secondary)]">{appliedDiscountCodeDetails.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-base font-bold text-emerald-500">
                                    {appliedDiscountCodeDetails.type === 'PERCENTAGE'
                                        ? `-${appliedDiscountCodeDetails.value}%`
                                        : `-${CURRENCY_SYMBOL} ${appliedDiscountCodeDetails.value}`
                                    }
                                </p>
                                <p className="text-xs text-[var(--theme-text-secondary)]">
                                    Saving: {formatCompactNumber(cartDiscount, { currency: CURRENCY_SYMBOL })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveDiscount}
                            className="w-full mt-3 py-2 text-rose-500 text-xs font-bold border border-rose-500/20 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                            Remove Discount
                        </button>
                    </div>
                )}

                {/* Discount Code Entry */}
                {!appliedDiscountCodeDetails && (
                    <>
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-3 bg-[var(--theme-bg-subtle)] rounded-xl flex items-center justify-center border border-[var(--theme-border)]">
                                <Tag className="w-7 h-7 text-[var(--theme-text-secondary)]" />
                            </div>
                            <p className="text-[var(--theme-text-secondary)] text-xs">
                                Enter the discount code provided to the customer
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold mb-1.5 block">
                                    Discount Code
                                </label>
                                <input
                                    type="text"
                                    value={discountCodeInput}
                                    onChange={(e) => {
                                        setDiscountCodeInput(e.target.value.toUpperCase());
                                        setDiscountCodeError('');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleValidateDiscountCode();
                                    }}
                                    placeholder="Enter code (e.g., SAVE10)"
                                    className={`w-full bg-[var(--theme-bg-subtle)] border ${discountCodeError ? 'border-rose-500' : 'border-[var(--theme-border)]'} rounded-xl px-4 py-2.5 text-[var(--theme-text-primary)] text-center text-base font-mono tracking-wider uppercase focus:border-[var(--theme-border-focus)] transition-colors`}
                                    autoFocus
                                />
                                {discountCodeError && (
                                    <p className="mt-1.5 text-rose-500 text-xs flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        {discountCodeError}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleValidateDiscountCode}
                                disabled={!discountCodeInput.trim() || isValidatingCode}
                                className="w-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-30 border border-transparent disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-colors cursor-pointer shadow-xs text-xs uppercase tracking-wider"
                            >
                                {isValidatingCode ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Apply Code
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Anti-Fraud Security Policy Section */}
                        <div className="bg-[var(--theme-bg-subtle)] rounded-xl p-4 border border-[var(--theme-border)] space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--theme-text-primary)]">
                                <Tag className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                Zero-Trust Promotion Policy
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                                Arbitrary manual cashier or manager discounts are strictly disabled. Discounts can only be redeemed through verified promotional campaign codes generated and audited centrally by HQ Finance.
                            </p>
                        </div>

                        {/* Cart Summary */}
                        <div className="flex justify-between text-sm text-[var(--theme-text-secondary)] pt-2 border-t border-[var(--theme-border)]">
                            <span>Cart Subtotal:</span>
                            <span className="text-[var(--theme-text-primary)] font-semibold tabular-nums">{formatCompactNumber(subtotal, { currency: CURRENCY_SYMBOL })}</span>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};
