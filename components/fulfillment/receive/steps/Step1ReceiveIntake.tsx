import React from 'react';
import { EyeOff } from 'lucide-react';
import { PurchaseOrder, Product } from '../../../../types';
import { ItemAttributeBadges } from '../../ItemAttributeBadges';
import { formatPackBadge } from '../../../procurement/utils';

interface Step1ReceiveIntakeProps {
    splitReceivingItem: any;
    splitReceivingPO: PurchaseOrder;
    allProducts: Product[];
    isBlindReceiving: boolean;
    expectedSellable: number;
    previouslyReceived: number;
    t: (key: string) => string;
}

export const Step1ReceiveIntake: React.FC<Step1ReceiveIntakeProps> = ({
    splitReceivingItem,
    splitReceivingPO,
    allProducts,
    isBlindReceiving,
    expectedSellable,
    previouslyReceived,
    t,
}) => {
    const matchedProduct = allProducts.find(product =>
        (product.siteId || product.site_id) === splitReceivingPO.siteId &&
        (product.sku === splitReceivingItem.sku || product.id === splitReceivingItem.productId));
    const pack = formatPackBadge(splitReceivingItem);
    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)]">
            <p className="text-base leading-relaxed">{t('warehouse.receivingCheckInstruction')}</p>
            <div className="flex items-start gap-4">
                {matchedProduct?.image && <img src={matchedProduct.image} alt="" className="w-20 h-20 rounded-2xl object-cover shrink-0" />}
                <div className="min-w-0 space-y-2">
                    <h3 className="text-xl font-semibold break-words">{splitReceivingItem.name || splitReceivingItem.productName}</h3>
                    <p className="text-sm text-[var(--theme-text-secondary)] break-words">{splitReceivingItem.sku}</p>
                    {pack && <p className="text-base">{pack}</p>}
                </div>
            </div>
            {isBlindReceiving ? (
                <div className="flex items-start gap-3 rounded-2xl p-4 bg-[var(--theme-bg-subtle)] text-sm leading-relaxed">
                    <EyeOff size={20} className="shrink-0" aria-hidden="true" />
                    <div><p className="font-semibold">{t('warehouse.blindModeActiveTitle')}</p><p>{t('warehouse.receivingBlindInstruction')}</p></div>
                </div>
            ) : (
                <dl className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
                    <div><dt className="text-[var(--theme-text-secondary)]">{t('warehouse.expected')}</dt><dd className="text-xl font-semibold tabular-nums">{expectedSellable} {t('warehouse.unitsLabel')}</dd></div>
                    <div><dt className="text-[var(--theme-text-secondary)]">{t('warehouse.previouslyReceived')}</dt><dd className="text-xl font-semibold tabular-nums">{previouslyReceived} {t('warehouse.unitsLabel')}</dd></div>
                </dl>
            )}
            <section aria-label={t('warehouse.receivingHandlingDetails')} className="border-t border-[var(--theme-border)] pt-4">
                <h4 className="text-sm font-semibold mb-3">{t('warehouse.receivingHandlingDetails')}</h4>
                <ItemAttributeBadges item={splitReceivingItem} allProducts={allProducts} />
            </section>
        </div>
    );
};
