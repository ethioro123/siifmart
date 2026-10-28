import React from 'react';
import { Box } from 'lucide-react';
import { ReceivingItem, Product } from '../../../types';
import { getSellUnit } from '../../../utils/units';

interface TransferReceiveItemCardProps {
    item: ReceivingItem;
    idx: number;
    product?: Product;
    isBlindReceiving: boolean;
    readOnly?: boolean;
    onUpdateItem: (idx: number, updates: Partial<ReceivingItem>) => void;
    t: (key: string) => string;
}

export const TransferReceiveItemCard: React.FC<TransferReceiveItemCardProps> = ({
    item,
    idx,
    product,
    isBlindReceiving,
    readOnly = false,
    onUpdateItem,
    t
}) => {
    const unitDef = getSellUnit(product?.unit);

    return (
        <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 sm:p-4 flex gap-3 sm:gap-4 transition-colors">
            {/* Thumbnail */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--theme-bg-card)] rounded-lg flex items-center justify-center shrink-0 border border-[var(--theme-border)] overflow-hidden">
                {product?.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                    <Box className="text-[var(--theme-text-secondary)]" size={22} />
                )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[var(--theme-text-primary)] truncate text-xs sm:text-sm">{product?.name || item.productName || 'Unknown Item'}</h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">{product?.sku || (item as any).sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="text-[10px] sm:text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">
                            {t('warehouse.expected')}{isBlindReceiving ? ' (Blind)' : ''}
                        </span>
                        <p className="font-mono text-[var(--theme-text-primary)] font-bold tabular-nums text-xs sm:text-sm">
                            {isBlindReceiving ? (
                                <span className="text-amber-500 font-mono tracking-widest font-bold">***</span>
                            ) : (
                                <>
                                    {item.expectedQty}
                                    {unitDef.code !== 'UNIT' && (
                                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium ml-1 uppercase">{unitDef.shortLabel}</span>
                                    )}
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Grid: Qty + Condition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-2">
                    <div>
                        <label htmlFor={`received-qty-${idx}`} className="text-[10px] sm:text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">
                            {t('warehouse.received')}{unitDef.code !== 'UNIT' ? ` (${unitDef.shortLabel})` : ''}
                        </label>
                        <input
                            id={`received-qty-${idx}`}
                            type="number"
                            disabled={readOnly}
                            min="0"
                            placeholder="0"
                            step={unitDef.allowDecimal ? '0.01' : '1'}
                            value={item.receivedQty === 0 ? '' : item.receivedQty}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                                const rawVal = e.target.value;
                                const newQty = rawVal.trim() === '' ? 0 : (unitDef.allowDecimal ? parseFloat(rawVal) || 0 : parseInt(rawVal, 10) || 0);
                                onUpdateItem(idx, { receivedQty: newQty });
                            }}
                            className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] focus:outline-none touch-manipulation font-mono tabular-nums"
                            aria-label={`Received quantity for ${product?.name || 'item'}`}
                        />

                        {/* Rapid Thumb Steppers */}
                        <div className="flex items-center gap-1.5 mt-2">
                            <button
                                type="button"
                                disabled={readOnly}
                                onClick={() => {
                                    const cur = item.receivedQty || 0;
                                    onUpdateItem(idx, { receivedQty: cur + 1 });
                                }}
                                className="flex-1 py-1 px-2 rounded-lg bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[32px]"
                            >
                                +1
                            </button>
                            <button
                                type="button"
                                disabled={readOnly}
                                onClick={() => {
                                    const cur = item.receivedQty || 0;
                                    onUpdateItem(idx, { receivedQty: cur + 5 });
                                }}
                                className="flex-1 py-1 px-2 rounded-lg bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[32px]"
                            >
                                +5
                            </button>
                            {!isBlindReceiving && (
                                <button
                                    type="button"
                                    disabled={readOnly}
                                    onClick={() => onUpdateItem(idx, { receivedQty: item.expectedQty || 1 })}
                                    className="flex-1 py-1 px-2 rounded-lg bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] font-mono text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[32px]"
                                >
                                    Match ({item.expectedQty || 1})
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor={`condition-${idx}`} className="text-[10px] sm:text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-1 block">
                            {t('warehouse.returnCondition')}
                        </label>
                        <select
                            id={`condition-${idx}`}
                            value={item.condition}
                            disabled={readOnly}
                            onChange={(e) => onUpdateItem(idx, { condition: e.target.value as any })}
                            className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs sm:text-sm text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] focus:outline-none touch-manipulation"
                            aria-label={`Condition for ${product?.name || 'item'}`}
                        >
                            <option value="Good">{t('warehouse.conditionGood')}</option>
                            <option value="Damaged">{t('warehouse.conditionDamaged')}</option>
                            <option value="Short">{t('warehouse.conditionShortMissing')}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
