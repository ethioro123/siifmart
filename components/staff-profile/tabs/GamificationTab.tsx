import React from 'react';
import { Trophy, Target, Zap, Award, Store, UserCheck, Star, Plus, Package, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { calculateBonus } from '../../WorkerPointsDisplay';
import { calculateStoreBonus } from '../../StoreBonusDisplay';
import { Employee, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION, DEFAULT_BONUS_TIERS } from '../../../types';
import { getEmployeeJobTitle } from '../../../utils/roles';

interface GamificationTabProps {
    employee: Employee;
    settings: any;
    sites: any[];
    getWorkerPoints: (id: string) => any;
    getStorePoints: (id: string) => any;
}

export default function GamificationTab({
    employee,
    settings,
    sites,
    getWorkerPoints,
    getStorePoints
}: GamificationTabProps) {
    const empPoints = getWorkerPoints(employee.id);
    const empSite = sites.find(s => s.id === employee.siteId || s.id === employee.site_id);
    const isWarehouse = empSite?.type === 'Warehouse' || empSite?.type === 'Distribution Center';

    let empBonus = 0;
    let empTierName = '';
    let tierColor = 'gray';
    let storePointsData = null;

    if (isWarehouse && empPoints) {
        const bonusTiers = settings.bonusTiers || DEFAULT_BONUS_TIERS;
        const bonusInfo = calculateBonus(empPoints.monthlyPoints, bonusTiers);
        empBonus = bonusInfo.bonus;
        empTierName = bonusInfo.tier.tierName;
        tierColor = bonusInfo.tier.tierColor;
    } else if (!isWarehouse && empSite) {
        storePointsData = getStorePoints(empSite.id);
        if (storePointsData) {
            const bonusTiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
            const roleDistribution = settings.posRoleDistribution || DEFAULT_POS_ROLE_DISTRIBUTION;
            const storeBonus = calculateStoreBonus(storePointsData.monthlyPoints, bonusTiers);
            const roleConfig = roleDistribution.find((r: any) =>
                r.role.toLowerCase() === employee.role.toLowerCase()
            );
            if (roleConfig) {
                empBonus = (storeBonus.bonus * roleConfig.percentage) / 100;
                empTierName = storeBonus.tier.tierName;
                tierColor = storeBonus.tier.tierColor;
            }
        }
    }

    const getTierColorClass = (color: string) => {
        const colors: Record<string, string> = {
            gray: 'from-[var(--theme-accent)] to-[var(--theme-accent)]',
            amber: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]',
            yellow: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]',
            cyan: 'from-[var(--theme-status-info)] to-[var(--theme-status-info)]',
            purple: 'from-[var(--theme-accent)] to-[var(--theme-accent)]',
        };
        return colors[color] || 'from-[var(--theme-accent)] to-[var(--theme-accent)]';
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header Stats Card */}
            <div className="p-6 sm:p-7 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] shadow-xs relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] flex items-center justify-center text-[var(--theme-status-warning-text)] shrink-0">
                            <Trophy size={28} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-[var(--theme-text-primary)]">
                                {isWarehouse ? 'Warehouse Pro' : 'Store Elite'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] uppercase tracking-wider">
                                    {empTierName || 'Standard'}
                                </span>
                                <span className="text-[var(--theme-text-secondary)] text-xs font-medium">
                                    {isWarehouse ? 'Individual Level' : `Team Share: ${empSite?.name}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {empBonus > 0 && (
                        <div className="bg-[var(--theme-bg-subtle)] px-5 py-3 rounded-xl border border-[var(--theme-border)] text-center md:text-right">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-0.5">Estimated Bonus</p>
                            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[var(--theme-status-success-text)]">
                                {formatCompactNumber(empBonus, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isWarehouse && empPoints ? (
                    <>
                        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] text-center shadow-xs group hover:border-[var(--theme-accent)]/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-status-success-text)]">
                                <Trophy size={20} />
                            </div>
                            <p className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{empPoints.totalPoints.toLocaleString()}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mt-1">Lifetime</p>
                        </div>
                        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] text-center shadow-xs group hover:border-[var(--theme-accent)]/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-status-info-text)]">
                                <Target size={20} />
                            </div>
                            <p className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{empPoints.monthlyPoints.toLocaleString()}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mt-1">This Month</p>
                        </div>
                        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] text-center shadow-xs group hover:border-[var(--theme-accent)]/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent-muted)] border border-[var(--theme-border-accent)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-accent)]">
                                <Zap size={20} />
                            </div>
                            <p className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">Lv. {empPoints.level}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mt-1">{empPoints.levelTitle}</p>
                        </div>
                        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] text-center shadow-xs group hover:border-[var(--theme-accent)]/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-status-warning-text)]">
                                <Award size={20} />
                            </div>
                            <p className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">#{empPoints.rank || '12'}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mt-1">Leaderboard</p>
                        </div>
                    </>
                ) : storePointsData ? (
                    <>
                        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] text-center shadow-xs group hover:border-[var(--theme-accent)]/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-status-info-text)]">
                                <Store size={20} />
                            </div>
                            <p className="text-lg font-bold text-[var(--theme-text-primary)] truncate">{empSite?.name}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mt-1">Origin Site</p>
                        </div>
                        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] text-center shadow-xs group hover:border-[var(--theme-accent)]/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-status-warning-text)]">
                                <Trophy size={20} />
                            </div>
                            <p className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{storePointsData.monthlyPoints.toLocaleString()}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mt-1">Store Total</p>
                        </div>
                        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] text-center shadow-xs group hover:border-[var(--theme-accent)]/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent-muted)] border border-[var(--theme-border-accent)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-accent)]">
                                <UserCheck size={20} />
                            </div>
                            <p className="text-lg font-bold text-[var(--theme-text-primary)]">{getEmployeeJobTitle(employee)}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mt-1">Job Title</p>
                        </div>
                        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] text-center shadow-xs group hover:border-[var(--theme-accent)]/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-status-info-text)]">
                                <Target size={20} />
                            </div>
                            <p className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{storePointsData.totalTransactions}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mt-1">Volume</p>
                        </div>
                    </>
                ) : (
                    <div className="col-span-4 text-center py-12 bg-[var(--theme-bg-card)] rounded-2xl border border-dashed border-[var(--theme-border)]">
                        <Trophy size={40} className="mx-auto mb-3 text-[var(--theme-text-muted)]" />
                        <p className="text-[var(--theme-text-primary)] font-semibold text-sm">No gamification data recorded yet.</p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Start processing orders to earn points and climb the ranks.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Badges & Achievements */}
                <div className="bg-[var(--theme-bg-card)] p-6 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Star size={18} className="text-[var(--theme-status-warning-text)]" /> Badges & Achievements
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                        {(employee.badges || ['Early Bird', 'Fast Picker', 'No Errors']).map((badge, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 group cursor-help">
                                <div className="w-12 h-12 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] flex items-center justify-center text-[var(--theme-status-warning-text)] shadow-xs group-hover:scale-105 transition-transform">
                                    <Award size={22} />
                                </div>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium text-center tracking-normal leading-tight max-w-[80px] truncate">{badge}</span>
                            </div>
                        ))}
                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, 10 - (employee.badges?.length || 3)) }).map((_, i) => (
                            <div key={`empty-${i}`} className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] border border-dashed border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)]">
                                    <Plus size={16} />
                                </div>
                                <span className="text-[11px] text-[var(--theme-text-muted)] font-medium text-center tracking-normal leading-tight">Locked</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Point History Log */}
                <div className="bg-[var(--theme-bg-card)] p-6 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-[var(--theme-accent)]" /> Recent Activity
                    </h4>
                    <div className="space-y-3">
                        {[
                            { action: 'PICK completed', points: '+15', time: '2 hours ago', icon: Package, color: 'text-[var(--theme-status-info-text)] bg-[var(--theme-status-info-bg)] border-[var(--theme-status-info-border)]' },
                            { action: '100% Accuracy Bonus', points: '+50', time: 'Yesterday', icon: CheckCircle, color: 'text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]' },
                            { action: 'Shift Finished', points: '+10', time: '2 days ago', icon: Clock, color: 'text-[var(--theme-accent)] bg-[var(--theme-accent-muted)] border-[var(--theme-border-accent)]' },
                            { action: 'Team Multiplier', points: 'x2', time: 'Active', icon: Zap, color: 'text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]' },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${log.color}`}>
                                        <log.icon size={14} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{log.action}</p>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">{log.time}</p>
                                    </div>
                                </div>
                                <span className={`text-sm font-bold font-mono tabular-nums ${log.points.startsWith('+') ? 'text-[var(--theme-status-success-text)]' : 'text-[var(--theme-status-warning-text)]'}`}>
                                    {log.points}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
