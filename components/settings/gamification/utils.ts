import { BonusTier } from '../../../types';

export const TIER_COLORS = [
    { value: 'gray', label: 'Gray', class: 'from-[var(--theme-accent)] to-[var(--theme-accent)]' },
    { value: 'amber', label: 'Bronze', class: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]' },
    { value: 'yellow', label: 'Gold', class: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]' },
    { value: 'cyan', label: 'Platinum', class: 'from-[var(--theme-status-info)] to-[var(--theme-status-info)]' },
    { value: 'purple', label: 'Diamond', class: 'from-[var(--theme-accent)] to-[var(--theme-accent)]' },
    { value: 'green', label: 'Emerald', class: 'from-[var(--theme-status-success)] to-[var(--theme-status-success)]' },
    { value: 'rose', label: 'Ruby', class: 'from-[var(--theme-status-danger)] to-[var(--theme-status-danger)]' },
    { value: 'blue', label: 'Sapphire', class: 'from-[var(--theme-status-info)] to-[var(--theme-status-info)]' },
];

export const getColorClass = (colorValue: string) => {
    return TIER_COLORS.find(c => c.value === colorValue)?.class || 'from-[var(--theme-accent)] to-[var(--theme-accent)]';
};

export const calculateExampleBonus = (points: number, bonusTiers: BonusTier[]) => {
    const tier = bonusTiers.find(t =>
        points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints)
    );
    if (!tier) return 0;
    return tier.bonusAmount + (points * (tier.bonusPerPoint || 0));
};
