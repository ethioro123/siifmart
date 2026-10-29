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
        gray: 'from-[var(--theme-accent)] to-[var(--theme-accent)]',
        amber: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]',
        yellow: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]',
        cyan: 'from-[var(--theme-status-info)] to-[var(--theme-status-info)]',
        purple: 'from-[var(--theme-accent)] to-[var(--theme-accent)]',
    };
    return colors[tierColor] || 'from-[var(--theme-accent)] to-[var(--theme-accent)]';
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
    if (rank === 1) return { bg: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]', text: 'text-[var(--theme-status-warning-text)]', icon: '🥇' };
    if (rank === 2) return { bg: 'from-[var(--theme-accent)] to-[var(--theme-accent)]', text: 'text-[var(--theme-text-primary)]', icon: '🥈' };
    if (rank === 3) return { bg: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]', text: 'text-[var(--theme-status-warning-text)]', icon: '🥉' };
    return { bg: 'from-[var(--theme-accent)] to-[var(--theme-accent)]', text: 'text-[var(--theme-text-primary)]', icon: `#${rank}` };
};

// Level badge colors
export const getLevelColor = (level: number) => {
    const colors = [
        'from-[var(--theme-accent)] to-[var(--theme-accent)]', // 1 - Rookie
        'from-[var(--theme-status-success)] to-[var(--theme-status-success)]', // 2 - Apprentice
        'from-[var(--theme-status-info)] to-[var(--theme-status-info)]', // 3 - Worker
        'from-[var(--theme-accent)] to-[var(--theme-accent)]', // 4 - Skilled
        'from-[var(--theme-accent)] to-[var(--theme-accent)]', // 5 - Expert
        'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]', // 6 - Pro
        'from-[var(--theme-status-danger)] to-[var(--theme-status-danger)]', // 7 - Master
        'from-[var(--theme-status-info)] to-[var(--theme-status-info)]', // 8 - Elite
        'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]', // 9 - Champion
        'from-[var(--theme-status-warning)] via-[var(--theme-status-warning)] to-[var(--theme-status-warning)]', // 10 - Legend
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
