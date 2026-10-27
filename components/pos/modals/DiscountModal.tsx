import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { Tag, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

export const DiscountModal: React.FC = () => {
    const { t } = useLanguage();
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
        <Modal isOpen={isDiscountModalOpen} onClose={() => { setIsDiscountModalOpen(false); setDiscountCodeError(''); }} title={t('pos.applyDiscountCode')} size="sm">
            <div className="space-y-5">
                {/* Current Applied Discount */}
                {appliedDiscountCodeDetails && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-emerald-500 text-sm tracking-tight">{appliedDiscountCodeDetails.code}</p>
                                    <p className="text-xs text-[var(--theme-text-secondary)]">{appliedDiscountCodeDetails.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-base font-bold text-emerald-500 font-mono tabular-nums">
                                    {appliedDiscountCodeDetails.type === 'PERCENTAGE'
                                        ? `-${appliedDiscountCodeDetails.value}%`
                                        : `-${CURRENCY_SYMBOL} ${appliedDiscountCodeDetails.value}`
                                    }
                                </p>
                                <p className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                    {t('pos.saving')}: {formatCompactNumber(cartDiscount, { currency: CURRENCY_SYMBOL })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveDiscount}
                            className="w-full mt-3 py-2.5 text-rose-500 text-xs font-semibold border border-rose-500/20 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95 tracking-tight"
                        >
                            {t('pos.removeDiscount')}
                        </button>
                    </div>
                )}

                {/* Discount Code Entry */}
                {!appliedDiscountCodeDetails && (
                    <>
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-3 bg-pink-500/10 rounded-2xl flex items-center justify-center border border-pink-500/20 text-pink-500 shadow-xs">
                                <Tag className="w-7 h-7" />
                            </div>
                            <p className="text-[var(--theme-text-secondary)] text-xs font-medium">
                                {t('pos.enterDiscountCode')}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1.5 block tracking-wider">
                                    {t('pos.discountCode')}
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
                                    className={`w-full bg-[var(--theme-bg-subtle)] border ${discountCodeError ? 'border-rose-500' : 'border-[var(--theme-border)]'} rounded-2xl px-4 py-3 text-[var(--theme-text-primary)] text-center text-base font-mono tracking-wider uppercase focus:border-[var(--theme-border-focus)] focus:ring-1 focus:ring-[var(--theme-border-focus)] transition-all`}
                                    autoFocus
                                />
                                {discountCodeError && (
                                    <p className="mt-1.5 text-rose-500 text-xs flex items-center justify-center gap-1 font-medium">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        {discountCodeError}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleValidateDiscountCode}
                                disabled={!discountCodeInput.trim() || isValidatingCode}
                                className="w-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-30 border border-transparent disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs text-xs tracking-tight uppercase"
                            >
                                {isValidatingCode ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t('pos.validating')}</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>{t('pos.applyCode')}</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Anti-Fraud Security Policy Section */}
                        <div className="bg-[var(--theme-bg-subtle)] rounded-2xl p-4 border border-[var(--theme-border)] space-y-1.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                <div className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                    <Tag className="w-3 h-3" />
                                </div>
                                <span>{t('pos.zeroTrustPromotionPolicy')}</span>
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed font-normal">
                                {t('pos.zeroTrustPromotionDesc')}
                            </p>
                        </div>

                        {/* Cart Summary */}
                        <div className="flex justify-between items-baseline text-xs text-[var(--theme-text-secondary)] pt-2 border-t border-[var(--theme-border-subtle)]">
                            <span className="font-semibold uppercase tracking-wider">{t('pos.cartSubtotal')}:</span>
                            <span className="text-[var(--theme-text-primary)] font-bold font-mono tabular-nums text-sm">{formatCompactNumber(subtotal, { currency: CURRENCY_SYMBOL })}</span>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};
