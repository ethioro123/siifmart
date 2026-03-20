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
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-green-400">{appliedDiscountCodeDetails.code}</p>
                                    <p className="text-xs text-green-300/70">{appliedDiscountCodeDetails.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-green-400">
                                    {appliedDiscountCodeDetails.type === 'PERCENTAGE'
                                        ? `-${appliedDiscountCodeDetails.value}%`
                                        : `-${CURRENCY_SYMBOL} ${appliedDiscountCodeDetails.value}`
                                    }
                                </p>
                                <p className="text-xs text-green-300/70">
                                    Saving: {formatCompactNumber(cartDiscount, { currency: CURRENCY_SYMBOL })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveDiscount}
                            className="w-full mt-3 py-2 text-red-400 text-sm border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
                        >
                            Remove Discount
                        </button>
                    </div>
                )}

                {/* Discount Code Entry */}
                {!appliedDiscountCodeDetails && (
                    <>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyber-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                                <Tag className="w-8 h-8 text-cyber-primary" />
                            </div>
                            <p className="text-gray-400 text-sm">
                                Enter the discount code provided to the customer
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
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
                                    className={`w-full bg-black/30 border ${discountCodeError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white text-center text-lg font-mono tracking-wider uppercase focus:border-cyber-primary focus:ring-2 focus:ring-cyber-primary/20 transition-all`}
                                    autoFocus
                                />
                                {discountCodeError && (
                                    <p className="mt-2 text-red-400 text-sm flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        {discountCodeError}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleValidateDiscountCode}
                                disabled={!discountCodeInput.trim() || isValidatingCode}
                                className="w-full bg-gradient-to-r from-cyber-primary to-cyan-400 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyber-primary/30 transition-all"
                            >
                                {isValidatingCode ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Apply Code
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Info Section */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                <strong className="text-white">Note:</strong> Discount codes must be obtained from management or marketing campaigns.
                                Ask the customer for their discount code or promotional number.
                            </p>
                        </div>

                        {/* Cart Summary */}
                        <div className="flex justify-between text-sm text-gray-400 pt-2 border-t border-white/5">
                            <span>Cart Subtotal:</span>
                            <span className="text-white font-semibold">{formatCompactNumber(subtotal, { currency: CURRENCY_SYMBOL })}</span>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};
