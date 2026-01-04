import React, { useMemo } from 'react';
import {
    Trophy, Target, Zap, TrendingUp, Users, Award,
    Star, Flame, Crown, Medal, BarChart3, PieChart as PieChartIcon,
    Rocket, Shield, Lightbulb, Activity
} from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
    LineChart, Line, CartesianGrid
} from 'recharts';
import { WorkerPoints, StorePoints } from '../types';
import { formatCompactNumber } from '../utils/formatting';

interface PointsPerformanceDashboardProps {
    workerPoints: WorkerPoints[];
    storePoints: StorePoints[];
}

const PointsPerformanceDashboard: React.FC<PointsPerformanceDashboardProps> = ({ workerPoints, storePoints }) => {
    // 1. CALCULATE TOP METRICS
    const globalStats = useMemo(() => {
        const totalIndividualPoints = workerPoints.reduce((sum, w) => sum + w.totalPoints, 0);
        const totalTeamPoints = storePoints.reduce((sum, s) => sum + s.totalPoints, 0);
        const avgAccuracy = workerPoints.length > 0
            ? workerPoints.reduce((sum, w) => sum + (w.averageAccuracy || 0), 0) / workerPoints.length
            : 0;
        const totalBonuses = storePoints.reduce((sum, s) => sum + (s.monthlyPoints * 0.5), 0); // Mock bonus calc

        return {
            totalIndividualPoints,
            totalTeamPoints,
            avgAccuracy,
            totalBonuses,
            activeWorkers: workerPoints.filter(w => w.todayPoints > 0).length,
            activeTeams: storePoints.filter(s => s.todayPoints > 0).length
        };
    }, [workerPoints, storePoints]);

    // 2. RADAR DATA (Balanced Network Scorecard)
    const radarData = useMemo(() => {
        const avgPickingSpeed = workerPoints.length > 0
            ? Math.min(100, (workerPoints.reduce((sum, w) => sum + (w.averageTimePerJob || 0), 0) / workerPoints.length))
            : 0;

        return [
            { subject: 'Picking Speed', A: 100 - avgPickingSpeed, fullMark: 100 },
            { subject: 'Accuracy', A: globalStats.avgAccuracy, fullMark: 100 },
            { subject: 'Team Synergy', A: 85, fullMark: 100 },
            { subject: 'Volume', A: Math.min(100, (globalStats.totalIndividualPoints / 10000) * 100), fullMark: 100 },
            { subject: 'Innovation', A: 70, fullMark: 100 },
            { subject: 'Reliability', A: 92, fullMark: 100 },
        ];
    }, [workerPoints, globalStats]);

    // 3. LEADERBOARD DATA
    const topIndividual = useMemo(() =>
        [...workerPoints].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 5),
        [workerPoints]);

    const topTeams = useMemo(() =>
        [...storePoints].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 5),
        [storePoints]);

    return (
        <div className="col-span-1 md:col-span-4 space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* SECTION HEADER */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                            <Trophy className="text-yellow-400" size={24} />
                        </div>
                        OPERATIONAL PERFORMANCE <span className="text-yellow-400">& GAMIFICATION</span>
                    </h2>
                    <p className="text-gray-400 text-sm font-medium mt-1">Real-time engagement and productivity metrics across the central network.</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md flex items-center gap-2">
                        <Activity size={14} className="text-cyber-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Status: OPTIMAL</span>
                    </div>
                </div>
            </div>

            {/* PERFORMANCE KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PerformanceCard
                    title="Network Total Pts"
                    value={formatCompactNumber(globalStats.totalIndividualPoints + globalStats.totalTeamPoints)}
                    sub={`${globalStats.activeWorkers + globalStats.activeTeams} Active Participants`}
                    icon={Rocket}
                    color="cyan"
                />
                <PerformanceCard
                    title="Avg Pick Accuracy"
                    value={`${globalStats.avgAccuracy.toFixed(1)}%`}
                    sub="Global Fulfillment Rate"
                    icon={Target}
                    color="emerald"
                />
                <PerformanceCard
                    title="Projected Bonuses"
                    value={`ETB ${formatCompactNumber(globalStats.totalBonuses)}`}
                    sub="Monthly Reward Pool"
                    icon={Award}
                    color="purple"
                />
                <PerformanceCard
                    title="Engagement Level"
                    value="94.2%"
                    sub="+2.4% from last period"
                    icon={Flame}
                    color="orange"
                />
            </div>

            {/* MAIN PERFORMANCE BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. NETWORK RADAR (Balanced Scorecard) */}
                <div className="lg:col-span-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-cyber-primary" />
                        Network Synergy Score
                    </h3>
                    <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#999', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Performance"
                                    dataKey="A"
                                    stroke="#00ff9d"
                                    fill="#00ff9d"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 w-full text-center">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Efficiency</p>
                            <p className="text-sm font-bold text-white">88/100</p>
                        </div>
                        <div className="border-x border-white/10 px-2">
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Accuracy</p>
                            <p className="text-sm font-bold text-white">96/100</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Morale</p>
                            <p className="text-sm font-bold text-white">92/100</p>
                        </div>
                    </div>
                </div>

                {/* 2. GLOBAL INDIVIDUAL LEADERBOARD */}
                <div className="lg:col-span-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Crown size={18} className="text-yellow-400" />
                        Top Individual Performers
                    </h3>
                    <div className="space-y-4">
                        {topIndividual.map((w, i) => (
                            <div key={w.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all duration-300 group/item hover:-translate-x-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-500 text-black' :
                                    i === 1 ? 'bg-gray-300 text-black' :
                                        i === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-400'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{w.employeeName}</p>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase truncate">{w.levelTitle} • LVL {w.level}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-cyber-primary">{formatCompactNumber(w.totalPoints)}</p>
                                    <p className="text-[8px] text-gray-500 uppercase font-bold">Total Pts</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-auto pt-6 text-xs text-cyber-primary font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                        View Full Global Ranks <TrendingUp size={14} />
                    </button>
                </div>

                {/* 3. GLOBAL TEAM LEADERBOARD */}
                <div className="lg:col-span-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Users size={18} className="text-blue-400" />
                        Top Performing Teams
                    </h3>
                    <div className="space-y-4">
                        {topTeams.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all duration-300 group/item hover:-translate-x-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-cyber-primary text-black' : 'bg-white/10 text-gray-400'
                                    }`}>
                                    <Shield size={14} className={i === 0 ? 'text-black' : 'text-gray-400'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{s.siteName}</p>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase truncate">Team Score • {s.monthlyPoints > 1000 ? 'GOLD TIER' : 'SILVER TIER'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-blue-400">{formatCompactNumber(s.totalPoints)}</p>
                                    <p className="text-[8px] text-gray-500 uppercase font-bold">Team Pts</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto pt-6 flex items-center justify-between">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Performance Pool</p>
                        <p className="text-sm font-bold text-white">ETB 145,000 Dist.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

// MINI COMPONENTS
const PerformanceCard = ({ title, value, sub, icon: Icon, color }: any) => {
    const colors: any = {
        cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    };

    const style = colors[color] || colors.cyan;

    return (
        <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 group hover:bg-white/10 transition-all duration-500">
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${style.bg} blur-2xl rounded-full group-hover:scale-150 transition-transform duration-700`} />

            <div className="flex justify-between items-start relative z-10">
                <div className={`p-2.5 rounded-xl ${style.bg} border ${style.border}`}>
                    <Icon className={style.text} size={20} />
                </div>
            </div>

            <div className="mt-4 relative z-10">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{title}</p>
                <h3 className="text-2xl font-mono font-black text-white mt-1 break-all">{value}</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-cyber-primary" />
                    {sub}
                </p>
            </div>
        </div>
    );
};

export default PointsPerformanceDashboard;
