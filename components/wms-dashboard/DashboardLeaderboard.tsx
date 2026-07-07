import React from 'react';
import { Trophy, Crown, User } from 'lucide-react';

interface DashboardLeaderboardProps {
    siteLeaderboard: any[];
    activeSite: any;
    t: (key: string) => string;
}

export const DashboardLeaderboard: React.FC<DashboardLeaderboardProps> = ({
    siteLeaderboard,
    activeSite,
    t
}) => {
    return (
        <div className="bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 lg:backdrop-blur-2xl p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-[3rem] shadow-xl relative overflow-hidden group transition-all mt-6">
            <div className="hidden lg:block absolute top-0 right-0 w-[600px] h-[600px] bg-[#2C5E3B]/5 dark:bg-[#1E3F27]/3 rounded-full blur-[120px] -mr-64 -mt-64 transition-opacity opacity-50" />

            <div className="relative">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h3 className="text-2xl font-black text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-4 uppercase tracking-tighter">
                            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-600/20 dark:border-amber-600/10 shadow-inner">
                                <Trophy size={32} className="text-amber-600 dark:text-amber-500" />
                            </div>
                            Performance Elite Hub
                        </h3>
                        <p className="text-[#4D6E56] dark:text-[#7A9E83] text-[10px] mt-2 font-bold uppercase tracking-[0.3em] opacity-60">Site Command: {activeSite?.name || 'Central Network'}</p>
                    </div>
                    <div className="flex items-center gap-4 px-6 py-3 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/45 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest leading-none mb-1">Live Feed</span>
                            <span className="text-xs font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase">Operational Pulse Active</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse shadow-[0_0_8px_rgba(44,94,59,0.5)]" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
                    {siteLeaderboard.slice(0, 5).map((worker: any, idx: number) => {
                        const configurations = [
                            {
                                rank: 1,
                                border: 'border-amber-500/40 dark:border-amber-500/20',
                                glow: 'shadow-[0_0_40px_rgba(217,119,6,0.15)] dark:shadow-[0_0_60px_rgba(217,119,6,0.1)]',
                                crown: true,
                                medal: '🥇',
                                bg: 'from-amber-600 to-amber-700 shadow-[0_0_12px_rgba(217,119,6,0.4)]'
                            },
                            {
                                rank: 2,
                                border: 'border-[#2C5E3B]/30',
                                glow: 'shadow-lg',
                                crown: false,
                                medal: '🥈',
                                bg: 'from-[#2C5E3B] to-[#1E3F27]'
                            },
                            {
                                rank: 3,
                                border: 'border-[#C29F68]/30',
                                glow: 'shadow-lg',
                                crown: false,
                                medal: '🥉',
                                bg: 'from-[#C29F68] to-[#8C6239]'
                            },
                            {
                                rank: 4,
                                border: 'border-stone-500/20',
                                glow: 'shadow-lg',
                                crown: false,
                                medal: '🏅',
                                bg: 'from-stone-500 to-stone-600'
                            },
                            {
                                rank: 5,
                                border: 'border-stone-700/20',
                                glow: 'shadow-lg',
                                crown: false,
                                medal: '🏅',
                                bg: 'from-stone-700 to-stone-800'
                            }
                        ];
                        const config = configurations[idx];

                        return (
                            <div key={worker.id} className={`relative flex flex-col p-4 sm:p-6 rounded-2xl md:rounded-[2rem] bg-white dark:bg-black/35 border ${config.border} ${config.glow} transition-all hover:translate-y-[-8px] hover:bg-[#FAF8F5] hover:dark:bg-[#1C2620]/65 group/card overflow-hidden`}>
                                <div className="absolute top-4 right-6 text-5xl font-black opacity-5 text-[#1E3F27] dark:text-[#EAE5D9] italic select-none">#{config.rank}</div>

                                <div className="flex flex-col items-center text-center mb-8 relative">
                                    <div className="relative mb-6">
                                        <div className="w-24 h-24 rounded-2xl bg-[#FAF8F5] dark:bg-black/35 flex items-center justify-center border-2 border-[#E2DCCE]/50 dark:border-emerald-950/20 overflow-hidden relative shadow-2xl transition-transform group-hover/card:scale-110 duration-700">
                                            <User size={40} className="text-[#4D6E56] dark:text-[#7A9E83] opacity-40" />
                                            <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                                        </div>
                                        <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r ${config.bg} text-[10px] font-black text-white shadow-xl whitespace-nowrap`}>
                                            LVL {worker.level}
                                        </div>
                                        {config.crown && <Crown size={24} className="absolute -top-4 -right-2 text-amber-500 rotate-12 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" />}
                                    </div>
                                    <h4 className="text-xl font-black text-[#1E3F27] dark:text-[#EAE5D9] truncate w-full mb-1 tracking-tight">{worker.employeeName}</h4>
                                    <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-bold uppercase tracking-[0.2em]">{worker.levelTitle}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20">
                                        <p className="text-[8px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-widest mb-1.5">Efficiency</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{worker.averageAccuracy || '98'}</span>
                                            <span className="text-[9px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20">
                                        <p className="text-[8px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-widest mb-1.5">Velocity</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{worker.averageTimePerJob || '4.2'}</span>
                                            <span className="text-[9px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">MNS</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[9px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-widest mb-1.5">Weekly Target</span>
                                        <span className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9]">{worker.weeklyPoints.toLocaleString()} <span className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2]">PTS</span></span>
                                    </div>
                                    <div className="h-3 bg-[#FAF8F5] dark:bg-black/45 rounded-lg overflow-hidden border border-[#E2DCCE]/50 dark:border-emerald-950/20 p-0.5">
                                        <div
                                            className={`h-full rounded-md bg-gradient-to-r ${config.bg} relative`}
                                            style={{ width: `${Math.min(100, (worker.weeklyPoints / 2500) * 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2 overflow-hidden items-center justify-center opacity-70 group-hover/card:opacity-100 transition-opacity">
                                    {(worker.achievements || []).slice(0, 4).map((ach: any, i: number) => (
                                        <div key={i} className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 flex items-center justify-center text-xs grayscale group-hover/card:grayscale-0 transition-all" title={ach.name}>
                                            {ach.icon || '🏆'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default DashboardLeaderboard;
