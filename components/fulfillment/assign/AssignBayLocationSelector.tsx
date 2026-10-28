import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface AssignBayLocationSelectorProps {
    bayConfig: { zone: string; aisle: string; bay: string };
    setBayConfig: (val: { zone: string; aisle: string; bay: string }) => void;
    zoneLetters: string[];
    maxAisles: number;
    maxBays: number;
}

export const AssignBayLocationSelector: React.FC<AssignBayLocationSelectorProps> = ({
    bayConfig,
    setBayConfig,
    zoneLetters,
    maxAisles,
    maxBays
}) => {
    const { t } = useLanguage();
    return (
        <div className="grid grid-cols-3 gap-3">
            <div>
                <label className="text-xs uppercase font-semibold text-[var(--theme-text-secondary)] mb-1.5 block">
                    {t('warehouse.zoneFieldLabel', { min: zoneLetters[0] || 'A', max: zoneLetters[zoneLetters.length - 1] || 'Z' })}
                </label>
                <select
                    title={t('warehouse.zoneTitle')}
                    className="w-full bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm font-semibold min-h-[44px] outline-none cursor-pointer"
                    value={bayConfig.zone}
                    onChange={(e) => setBayConfig({ ...bayConfig, zone: e.target.value })}
                >
                    {zoneLetters.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs uppercase font-semibold text-[var(--theme-text-secondary)] mb-1.5 block">
                    {t('warehouse.aisleFieldLabel', { max: maxAisles })}
                </label>
                <select
                    title={t('warehouse.aisleTitle')}
                    className="w-full bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm font-semibold min-h-[44px] outline-none cursor-pointer"
                    value={bayConfig.aisle}
                    onChange={(e) => setBayConfig({ ...bayConfig, aisle: e.target.value })}
                >
                    {Array.from({ length: maxAisles }, (_, i) => {
                        const val = (i + 1).toString().padStart(2, '0');
                        return <option key={val} value={val}>{val}</option>;
                    })}
                </select>
            </div>
            <div>
                <label className="text-xs uppercase font-semibold text-[var(--theme-text-secondary)] mb-1.5 block">
                    {t('warehouse.bayFieldLabel', { max: maxBays })}
                </label>
                <select
                    title={t('warehouse.bayTitle')}
                    className="w-full bg-[var(--theme-bg-app)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm font-semibold min-h-[44px] outline-none cursor-pointer"
                    value={bayConfig.bay}
                    onChange={(e) => setBayConfig({ ...bayConfig, bay: e.target.value })}
                >
                    {Array.from({ length: maxBays }, (_, i) => {
                        const val = (i + 1).toString().padStart(2, '0');
                        return <option key={val} value={val}>{val}</option>;
                    })}
                </select>
            </div>
        </div>
    );
};
