import React from 'react';

interface TransferQtyDisplayProps {
    qty: number;
    size?: string | number | null;
    unit?: any;
    color?: 'red' | 'green';
    t: (key: string) => string;
}

export const TransferQtyDisplay: React.FC<TransferQtyDisplayProps> = ({ qty, size, unit, color, t }) => {
    const textColor = color === 'red'
        ? 'text-red-600 dark:text-red-400'
        : color === 'green'
            ? 'text-green-600 dark:text-green-400'
            : 'text-[var(--theme-text-primary)]';
    const isWeightVol = unit && (unit.category === 'weight' || unit.category === 'volume');

    let unitLabel = unit?.code !== 'UNIT' ? unit?.shortLabel : (qty === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural'));
    if (isWeightVol && size) {
        unitLabel = `packs (${size}${unit.shortLabel})`;
    } else if (isWeightVol) {
        unitLabel = `packs (${unit.shortLabel})`;
    }

    return (
        <span className={`text-sm font-mono tabular-nums font-bold ${textColor}`}>
            {(qty ?? 0).toLocaleString()} <span className="text-[11px] opacity-75 font-normal uppercase">{unitLabel}</span>
        </span>
    );
};

export default TransferQtyDisplay;
