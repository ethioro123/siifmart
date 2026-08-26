import React, { useMemo } from 'react';
import {
    Users, User, Award, TrendingUp, ChevronRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import { useRoster } from '../contexts/RosterContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SiteRosterProps {
    layout?: 'grid' | 'list';
    limit?: number;
    highlightUser?: string;
    className?: string;
}

export default function SiteRoster({
    layout = 'grid',
    limit,
    highlightUser,
    className = ""
}: SiteRosterProps) {
    const { employees, activeSite } = useData();
    const { getWorkerPoints } = useGamification();
    const { schedules } = useRoster();
    const { t } = useLanguage();

    const siteEmployees = useMemo(() => {
        if (!activeSite) return [];
        return employees.filter(e => e.siteId === activeSite.id || (e as any).site_id === activeSite.id);
    }, [employees, activeSite]);

    const sortedEmployees = useMemo(() => {
        return siteEmployees.map(emp => {
            const points = getWorkerPoints(emp.id);
            return {
                ...emp,
                points: points?.totalPoints || 0,
                weeklyPoints: points?.weeklyPoints || 0,
                level: points?.level || 1,
                levelTitle: points?.levelTitle || 'Rookie',
                rank: points?.rank || 0,
                isRostered: schedules.some(s => s.employeeId === emp.id && s.date === new Date().toISOString().split('T')[0])
            };
        }).sort((a, b) => b.points - a.points);
    }, [siteEmployees, getWorkerPoints, schedules]);

    const displayEmployees = limit ? sortedEmployees.slice(0, limit) : sortedEmployees;

    if (!activeSite) return null;

    const siteTypeLabel = activeSite.type === 'Warehouse' || activeSite.type === 'Distribution Center'
        ? 'Warehouse Facility'
        : activeSite.type === 'Store' || activeSite.type === 'Dark Store'
            ? 'Store Location'
            : 'Operations Node';

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-black dark:text-[#EAE5D9] text-[#1E3F27] flex items-center gap-3 uppercase tracking-tight">
                        <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30 shadow-inner">
                            <Users size={22} />
                        </div>
                        Site Personnel Roster
                    </h3>
                    <p className="text-stone-500 dark:text-stone-400 text-[10px] mt-1.5 font-bold uppercase tracking-wider">
                        {siteEmployees.length} Total Staff Stationed at {activeSite.name || siteTypeLabel}
                    </p>
                </div>

                <div className="flex -space-x-3 hover:space-x-1 transition-all">
                    {displayEmployees.slice(0, 5).map((e) => (
                        <div key={e.id} className="w-10 h-10 rounded-xl border-2 dark:border-[#18201B] border-white bg-stone-100 dark:bg-black/40 flex items-center justify-center overflow-hidden shadow-md transform transition-transform hover:scale-110 hover:z-10">
                            {e.avatar ? (
                                <img src={e.avatar} alt={e.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={18} className="text-stone-400" />
                            )}
                        </div>
                    ))}
                    {siteEmployees.length > 5 && (
                        <div className="w-10 h-10 rounded-xl border-2 dark:border-[#18201B] border-white bg-[#2C5E3B] text-[#EAE5D9] flex items-center justify-center text-[10px] font-black z-0 shadow-md">
                            +{siteEmployees.length - 5}
                        </div>
                    )}
                </div>
            </div>

            <div className={layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
                {displayEmployees.map((emp) => {
                    const isHighlighted = emp.id === highlightUser;

                    return (
                        <div
                            key={emp.id}
                            className={`
                                relative overflow-hidden group transition-all duration-300
                                ${layout === 'grid'
                                    ? 'p-5 rounded-3xl bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 hover:translate-y-[-3px] hover:shadow-lg hover:border-[#2C5E3B]/40'
                                    : 'p-4 rounded-2xl bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center gap-4'}
                                ${isHighlighted ? 'border-[#2C5E3B] shadow-[0_0_20px_rgba(44,94,59,0.15)]' : ''}
                            `}
                        >
                            {/* Grid Layout Card */}
                            {layout === 'grid' && (
                                <>
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="relative">
                                            <div className={`w-14 h-14 rounded-2xl dark:bg-black/40 bg-stone-50 flex items-center justify-center border ${isHighlighted ? 'border-[#2C5E3B]' : 'border-[#E2DCCE] dark:border-white/10'} overflow-hidden shadow-sm`}>
                                                {emp.avatar ? (
                                                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={24} className="text-stone-400" />
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-[#2C5E3B] border border-white/20 flex items-center justify-center text-[9px] font-black text-white">
                                                {emp.level}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg mb-1 inline-block ${
                                                emp.status === 'Active'
                                                    ? 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30'
                                            }`}>
                                                {emp.status}
                                            </div>
                                            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider leading-none">
                                                {emp.role.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <h4 className="text-base font-black dark:text-[#EAE5D9] text-[#1E3F27] truncate tracking-tight">{emp.name}</h4>
                                        <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold uppercase tracking-wider mt-0.5">{emp.levelTitle}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-5">
                                        <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE]/60 dark:border-white/5">
                                            <p className="text-[8px] text-stone-400 font-bold uppercase tracking-wider mb-1">Efficiency</p>
                                            <span className="text-xs font-black dark:text-white text-[#1E3F27]">{(emp as any).performanceScore || 100}%</span>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE]/60 dark:border-white/5">
                                            <p className="text-[8px] text-stone-400 font-bold uppercase tracking-wider mb-1">Weekly</p>
                                            <span className="text-xs font-black font-mono dark:text-[#A9CBA2] text-[#2C5E3B]">{emp.weeklyPoints.toLocaleString()} PTS</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-[#E2DCCE]/60 dark:border-white/5">
                                        <div className="flex gap-1">
                                            {emp.badges?.slice(0, 3).map((b, i) => (
                                                <div key={i} className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/5 flex items-center justify-center text-xs shadow-sm border border-[#E2DCCE]/60 dark:border-white/5">
                                                    {b}
                                                </div>
                                            )) || (
                                                <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/5 flex items-center justify-center text-xs opacity-30">
                                                    <Award size={13} />
                                                </div>
                                            )}
                                        </div>
                                        {emp.rank > 0 && emp.rank <= 3 && (
                                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-wider">
                                                <TrendingUp size={12} />
                                                Rank #{emp.rank}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* List Layout Component */}
                            {layout === 'list' && (
                                <>
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-xl dark:bg-black/40 bg-stone-50 flex items-center justify-center border border-[#E2DCCE] dark:border-white/10 overflow-hidden">
                                            {emp.avatar ? (
                                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={18} className="text-stone-400" />
                                            )}
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2C5E3B] text-white flex items-center justify-center text-[7px] font-black">
                                            {emp.level}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold dark:text-white text-[#1E3F27] truncate">{emp.name}</h4>
                                        <p className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider leading-none mt-0.5">
                                            {emp.role.replace('_', ' ')} • {emp.levelTitle}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">{emp.weeklyPoints.toLocaleString()} PTS</p>
                                        <p className="text-[8px] text-stone-400 font-bold uppercase tracking-wider leading-none">Weekly</p>
                                    </div>

                                    <div className={`w-2 h-2 rounded-full ${emp.status === 'Active' ? 'bg-[#2C5E3B]' : 'bg-amber-500'} ml-2`} />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
