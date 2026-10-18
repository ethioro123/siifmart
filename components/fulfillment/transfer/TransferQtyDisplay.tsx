import React from 'react';
import { getTransferPackageSizeLabel } from './transferQuantity';

interface TransferQtyDisplayProps {
    qty: number;
    size?: string | number | null;
    unit?: any;
    color?: 'red' | 'green';
    measureQty?: boolean;
    t: (key: string) => string;
}

export const TransferQtyDisplay: React.FC<TransferQtyDisplayProps> = ({ qty, size, unit, color, t, measureQty = false }) => {
    const textColor = color === 'red'
        ? 'text-red-600 dark:text-red-400'
        : color === 'green'
            ? 'text-green-600 dark:text-green-400'
            : 'text-[var(--theme-text-primary)]';
    const isWeightVol = unit && (unit.category === 'weight' || unit.category === 'volume');

    let unitLabel = unit?.code !== 'UNIT' ? unit?.shortLabel : (qty === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural'));
    if (measureQty || (isWeightVol && !size)) {
        unitLabel = unit?.shortLabel;
    } else if (isWeightVol && size) {
        const packageSize = getTransferPackageSizeLabel({ unit: unit.code, size: String(size) });
        unitLabel = `packs (${packageSize || unit.shortLabel})`;
    }

    return (
        <span className={`text-sm font-mono tabular-nums font-bold ${textColor}`}>
            {(qty ?? 0).toLocaleString()} <span className="text-[11px] opacity-75 font-normal uppercase">{unitLabel}</span>
        </span>
    );
};

export default TransferQtyDisplay;
