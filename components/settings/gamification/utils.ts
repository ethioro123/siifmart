import { BonusTier } from '../../../types';

export const TIER_COLORS = [
    { value: 'gray', label: 'Gray', class: 'from-gray-400 to-gray-500' },
    { value: 'amber', label: 'Bronze', class: 'from-amber-500 to-amber-600' },
    { value: 'yellow', label: 'Gold', class: 'from-yellow-400 to-yellow-500' },
    { value: 'cyan', label: 'Platinum', class: 'from-cyan-400 to-cyan-500' },
    { value: 'purple', label: 'Diamond', class: 'from-purple-400 to-purple-600' },
    { value: 'green', label: 'Emerald', class: 'from-green-400 to-green-600' },
    { value: 'rose', label: 'Ruby', class: 'from-rose-400 to-rose-600' },
    { value: 'blue', label: 'Sapphire', class: 'from-blue-400 to-blue-600' },
];

export const getColorClass = (colorValue: string) => {
    return TIER_COLORS.find(c => c.value === colorValue)?.class || 'from-gray-400 to-gray-500';
};

export const calculateExampleBonus = (points: number, bonusTiers: BonusTier[]) => {
    const tier = bonusTiers.find(t =>
        points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints)
    );
    if (!tier) return 0;
    return tier.bonusAmount + (points * (tier.bonusPerPoint || 0));
};
