import { POINTS_CONFIG, BonusTier, DEFAULT_BONUS_TIERS } from '../../../types';

// Calculate bonus from points and tiers
export const calculateBonus = (
    points: number, 
    tiers: BonusTier[] = DEFAULT_BONUS_TIERS
): { tier: BonusTier; bonus: number } => {
    // Find the applicable tier
    const tier = (tiers.length > 0
        ? tiers.find(t => points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints))
        : null) || tiers[0] || DEFAULT_BONUS_TIERS[0];

    // Calculate bonus: base amount + (points * per-point bonus)
    const bonus = tier.bonusAmount + (points * (tier.bonusPerPoint || 0));

    return { tier, bonus };
};

// Get bonus tier color classes
export const getBonusTierColor = (tierColor: string) => {
    const colors: Record<string, string> = {
        gray: 'from-gray-400 to-gray-500',
        amber: 'from-amber-500 to-amber-600',
        yellow: 'from-yellow-400 to-yellow-500',
        cyan: 'from-cyan-400 to-cyan-500',
        purple: 'from-purple-400 to-purple-600',
    };
    return colors[tierColor] || 'from-gray-400 to-gray-500';
};

// Get level info from points
export const getLevelInfo = (totalPoints: number) => {
    const levels = POINTS_CONFIG.LEVELS;
    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = levels.length - 1; i >= 0; i--) {
        if (totalPoints >= levels[i].points) {
            currentLevel = levels[i];
            nextLevel = levels[i + 1] || levels[i];
            break;
        }
    }

    const pointsToNext = nextLevel.points - totalPoints;
    const progressPercent = currentLevel.level === nextLevel.level
        ? 100
        : ((totalPoints - currentLevel.points) / (nextLevel.points - currentLevel.points)) * 100;

    return { currentLevel, nextLevel, pointsToNext, progressPercent };
};

// Get rank medal color
export const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'from-yellow-400 to-amber-500', text: 'text-yellow-900', icon: '🥇' };
    if (rank === 2) return { bg: 'from-gray-300 to-gray-400', text: 'text-gray-800', icon: '🥈' };
    if (rank === 3) return { bg: 'from-amber-600 to-amber-700', text: 'text-amber-100', icon: '🥉' };
    return { bg: 'from-white/10 to-white/5', text: 'text-white', icon: `#${rank}` };
};

// Level badge colors
export const getLevelColor = (level: number) => {
    const colors = [
        'from-gray-500 to-gray-600', // 1 - Rookie
        'from-green-500 to-green-600', // 2 - Apprentice
        'from-blue-500 to-blue-600', // 3 - Worker
        'from-purple-500 to-purple-600', // 4 - Skilled
        'from-pink-500 to-pink-600', // 5 - Expert
        'from-orange-500 to-orange-600', // 6 - Pro
        'from-red-500 to-red-600', // 7 - Master
        'from-cyan-400 to-cyan-500', // 8 - Elite
        'from-amber-400 to-amber-500', // 9 - Champion
        'from-yellow-300 via-yellow-400 to-amber-500', // 10 - Legend
    ];
    return colors[Math.min(level - 1, colors.length - 1)];
};

// Achievement icons
export const getAchievementIcon = (type: string) => {
    const icons: Record<string, string> = {
        first_job: '🎉',
        speed_demon: '⚡',
        perfect_accuracy: '🎯',
        streak_3: '🔥',
        streak_7: '🔥🔥',
        streak_30: '🔥🔥🔥',
        centurion: '💯',
        veteran: '⭐',
        legend: '👑',
        early_bird: '🌅',
        night_owl: '🦉',
        team_player: '🤝',
    };
    return icons[type] || '🏆';
};
