import React from 'react';
import { Trophy, Target, Zap, Award, Store, UserCheck, Star, Plus, Package, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber, formatRole } from '../../../utils/formatting';
import { calculateBonus } from '../../WorkerPointsDisplay';
import { calculateStoreBonus } from '../../StoreBonusDisplay';
import { Employee, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION, DEFAULT_BONUS_TIERS } from '../../../types';

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
            gray: 'from-gray-400 to-gray-500',
            amber: 'from-amber-500 to-amber-600',
            yellow: 'from-yellow-400 to-yellow-500',
            cyan: 'from-cyan-400 to-cyan-500',
            purple: 'from-purple-400 to-purple-600',
        };
        return colors[color] || 'from-gray-400 to-gray-500';
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header Stats Card */}
            <div className={`p-6 rounded-3xl border relative overflow-hidden ${isWarehouse
                ? 'bg-gradient-to-r from-cyber-primary/20 to-green-500/10 border-cyber-primary/20'
                : 'bg-gradient-to-r from-blue-500/20 to-purple-500/10 border-blue-500/20'
                }`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getTierColorClass(tierColor)} flex items-center justify-center shadow-lg shadow-black/20`}>
                            <Trophy size={32} className="text-white" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white">
                                {isWarehouse ? 'Warehouse Pro' : 'Store Elite'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r ${getTierColorClass(tierColor)} text-white uppercase tracking-widest`}>
                                    {empTierName || 'Standard'}
                                </span>
                                <span className="text-gray-400 text-xs font-bold">
                                    {isWarehouse ? 'Individual Level' : `Team Share: ${empSite?.name}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {empBonus > 0 && (
                        <div className="bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center md:text-right">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Estimated Bonus</p>
                            <p className="text-3xl font-black text-green-400">
                                {formatCompactNumber(empBonus, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Background decoration */}
                <div className="absolute -right-10 -bottom-10 opacity-10">
                    <Trophy size={150} className="text-white rotate-12" />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isWarehouse && empPoints ? (
                    <>
                        <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-cyber-primary/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-cyber-primary/10 flex items-center justify-center mx-auto mb-3">
                                <Trophy className="text-cyber-primary" size={20} />
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{empPoints.totalPoints.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mt-1">Lifetime</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-blue-400/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center mx-auto mb-3">
                                <Target className="text-blue-400" size={20} />
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{empPoints.monthlyPoints.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mt-1">This Month</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-purple-400/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center mx-auto mb-3">
                                <Zap className="text-purple-400" size={20} />
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">Lv. {empPoints.level}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mt-1">{empPoints.levelTitle}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-yellow-400/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-3">
                                <Award className="text-yellow-400" size={20} />
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">#{empPoints.rank || '12'}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mt-1">Leaderboard</p>
                        </div>
                    </>
                ) : storePointsData ? (
                    <>
                        <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-blue-400/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center mx-auto mb-3">
                                <Store className="text-blue-400" size={20} />
                            </div>
                            <p className="text-lg font-black text-gray-900 dark:text-white truncate">{empSite?.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mt-1">Origin Site</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-yellow-400/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-3">
                                <Trophy className="text-yellow-400" size={20} />
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{storePointsData.monthlyPoints.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mt-1">Store Total</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-purple-400/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center mx-auto mb-3">
                                <UserCheck size={20} className="text-purple-400" />
                            </div>
                            <p className="text-lg font-black text-gray-900 dark:text-white capitalize">{formatRole(employee.role)}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Role Type</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-cyan-400/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center mx-auto mb-3">
                                <Target className="text-cyan-400" size={20} />
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{storePointsData.totalTransactions}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mt-1">Volume</p>
                        </div>
                    </>
                ) : (
                    <div className="col-span-4 text-center py-12 bg-gray-50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                        <Trophy size={48} className="mx-auto mb-4 text-gray-300 dark:text-white/5" />
                        <p className="text-gray-500 font-bold">No gamification data recorded yet.</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Start processing orders to earn points and climb the ranks!</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Badges & Achievements */}
                <div className="bg-gray-50 dark:bg-black/30 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Star size={18} className="text-yellow-400" /> Badges & Achievements
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                        {(employee.badges || ['Early Bird', 'Fast Picker', 'No Errors']).map((badge, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 group cursor-help">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                    <Award size={24} className="text-white" />
                                </div>
                                <span className="text-[8px] text-gray-400 font-black uppercase text-center tracking-tighter leading-tight">{badge}</span>
                            </div>
                        ))}
                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, 10 - (employee.badges?.length || 3)) }).map((_, i) => (
                            <div key={`empty-${i}`} className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center border-dashed">
                                    <Plus size={16} className="text-gray-300 dark:text-white/10" />
                                </div>
                                <span className="text-[8px] text-gray-400 dark:text-gray-600 font-black uppercase text-center tracking-tighter leading-tight">Locked</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Point History Log (Simulation) */}
                <div className="bg-gray-50 dark:bg-black/30 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-cyber-primary" /> Recent Activity
                    </h4>
                    <div className="space-y-3">
                        {[
                            { action: 'PICK completed', points: '+15', time: '2 hours ago', icon: Package, color: 'text-blue-400' },
                            { action: '100% Accuracy Bonus', points: '+50', time: 'Yesterday', icon: CheckCircle, color: 'text-green-400' },
                            { action: 'Shift Finished', points: '+10', time: '2 days ago', icon: Clock, color: 'text-purple-400' },
                            { action: 'Team Multiplier', points: 'x2', time: 'Active', icon: Zap, color: 'text-yellow-400' },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/5 flex items-center justify-center ${log.color}`}>
                                        <log.icon size={14} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">{log.action}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">{log.time}</p>
                                    </div>
                                </div>
                                <span className={`text-sm font-black ${log.points.startsWith('+') ? 'text-green-400' : 'text-yellow-400'}`}>
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
