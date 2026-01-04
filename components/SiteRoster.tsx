
import React, { useMemo } from 'react';
import {
    Users, User, Star, Award, Zap, TrendingUp,
    MapPin, Shield, Clock, Phone, Mail, ChevronRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Employee, POINTS_CONFIG } from '../types';

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
    const { employees, activeSite, workerPoints } = useData();

    const siteEmployees = useMemo(() => {
        if (!activeSite) return [];
        return employees.filter(e => e.siteId === activeSite.id || (e as any).site_id === activeSite.id);
    }, [employees, activeSite]);

    const sortedEmployees = useMemo(() => {
        // Merge with points data and sort by points or name
        return siteEmployees.map(emp => {
            const points = workerPoints.find(wp => wp.employeeId === emp.id);
            return {
                ...emp,
                points: points?.totalPoints || 0,
                weeklyPoints: points?.weeklyPoints || 0,
                level: points?.level || 1,
                levelTitle: points?.levelTitle || 'Rookie',
                rank: points?.rank || 0
            };
        }).sort((a, b) => b.points - a.points);
    }, [siteEmployees, workerPoints]);

    const displayEmployees = limit ? sortedEmployees.slice(0, limit) : sortedEmployees;

    if (!activeSite) return null;

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <div>
                        <h3 className="text-xl font-black dark:text-white text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="p-2.5 rounded-xl dark:bg-cyber-primary/10 bg-cyber-primary/5 border dark:border-cyber-primary/20 border-black/5 shadow-inner">
                                <Users size={22} className="text-cyber-primary" />
                            </div>
                            Site Personnel Roster
                        </h3>
                        <p className="dark:text-gray-500 text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-[0.2em] opacity-60">
                            {siteEmployees.length} Total Workers Employed at this Terminal
                        </p>
                    </div>
                </div>
                <div className="flex -space-x-3 hover:space-x-1 transition-all">
                    {displayEmployees.slice(0, 5).map((e) => (
                        <div key={e.id} className="w-10 h-10 rounded-xl border-2 dark:border-cyber-black border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-lg transform transition-transform hover:scale-110 hover:z-10">
                            {e.avatar ? (
                                <img src={e.avatar} alt={e.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={18} className="text-slate-400" />
                            )}
                        </div>
                    ))}
                    {siteEmployees.length > 5 && (
                        <div className="w-10 h-10 rounded-xl border-2 dark:border-cyber-black border-white bg-cyber-primary flex items-center justify-center text-[10px] font-black text-black z-0 shadow-lg">
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
                                    ? 'p-5 rounded-[2rem] dark:bg-white/[0.03] bg-white border dark:border-white/5 border-black/[0.03] hover:translate-y-[-4px] hover:shadow-2xl'
                                    : 'p-4 rounded-2xl dark:bg-white/[0.02] bg-white border dark:border-white/5 border-black/[0.03] flex items-center gap-4'}
                ${isHighlighted ? 'border-cyber-primary/40 shadow-[0_0_20px_rgba(0,255,157,0.1)]' : ''}
              `}
                        >
                            {/* Status Glow */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-10 transition-opacity group-hover:opacity-20 ${emp.status === 'Active' ? 'bg-cyber-primary' : 'bg-orange-500'}`} />

                            {/* Grid Layout Card */}
                            {layout === 'grid' && (
                                <>
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="relative">
                                            <div className={`w-16 h-16 rounded-2xl dark:bg-black/40 bg-slate-50 flex items-center justify-center border-2 ${isHighlighted ? 'border-cyber-primary' : 'dark:border-white/5 border-black/5'} overflow-hidden shadow-xl`}>
                                                {emp.avatar ? (
                                                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={28} className="dark:text-white/20 text-slate-300" />
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-lg bg-cyber-black border border-white/10 flex items-center justify-center text-[9px] font-black text-cyber-primary`}>
                                                {emp.level}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-1 inline-block ${emp.status === 'Active' ? 'dark:bg-cyber-primary/10 bg-cyber-primary/5 text-cyber-primary' : 'bg-orange-500/10 text-orange-400'
                                                }`}>
                                                {emp.status}
                                            </div>
                                            <p className="text-[10px] dark:text-gray-500 text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                {emp.role.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="text-lg font-black dark:text-white text-slate-900 truncate tracking-tight">{emp.name}</h4>
                                        <p className="text-[10px] dark:text-cyber-primary/70 text-cyber-primary font-bold uppercase tracking-[0.2em]">{emp.levelTitle}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-6">
                                        <div className="p-3 rounded-xl dark:bg-white/[0.02] bg-slate-50 border dark:border-white/5 border-black/[0.02]">
                                            <p className="text-[8px] dark:text-gray-500 text-slate-400 font-black uppercase tracking-widest mb-1">Efficiency</p>
                                            <span className="text-sm font-bold dark:text-white text-slate-900">{(emp as any).performanceScore || 95}%</span>
                                        </div>
                                        <div className="p-3 rounded-xl dark:bg-white/[0.02] bg-slate-50 border dark:border-white/5 border-black/[0.02]">
                                            <p className="text-[8px] dark:text-gray-500 text-slate-400 font-black uppercase tracking-widest mb-1">Weekly</p>
                                            <span className="text-sm font-bold dark:text-white text-slate-900">{emp.weeklyPoints.toLocaleString()} <span className="text-[9px] text-cyber-primary">PTS</span></span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t dark:border-white/5 border-black/5">
                                        <div className="flex gap-1">
                                            {emp.badges?.slice(0, 3).map((b, i) => (
                                                <div key={i} className="w-7 h-7 rounded-lg dark:bg-white/5 bg-slate-100 flex items-center justify-center text-xs shadow-sm border dark:border-white/5 border-black/5">
                                                    {b}
                                                </div>
                                            )) || (
                                                    <div className="w-7 h-7 rounded-lg dark:bg-white/5 bg-slate-100 flex items-center justify-center text-xs opacity-20">
                                                        <Award size={14} />
                                                    </div>
                                                )}
                                        </div>
                                        {emp.rank > 0 && emp.rank <= 3 && (
                                            <div className="flex items-center gap-1.5 text-yellow-400 font-black text-[10px] uppercase tracking-widest animate-pulse">
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
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-xl dark:bg-black/40 bg-slate-50 flex items-center justify-center border dark:border-white/10 border-black/5 overflow-hidden">
                                            {emp.avatar ? (
                                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} className="dark:text-white/20 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyber-primary flex items-center justify-center text-[7px] font-black text-black">
                                            {emp.level}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black dark:text-white text-slate-900 truncate tracking-tight">{emp.name}</h4>
                                        <p className="text-[9px] dark:text-gray-500 text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                                            {emp.role.replace('_', ' ')} • {emp.levelTitle}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm font-black dark:text-cyber-primary text-cyber-primary font-mono">{emp.weeklyPoints.toLocaleString()}</p>
                                        <p className="text-[8px] dark:text-gray-600 text-slate-400 font-bold uppercase tracking-widest leading-none">PTS THIS WEEK</p>
                                    </div>

                                    <div className={`w-2 h-2 rounded-full ${emp.status === 'Active' ? 'bg-cyber-primary shadow-[0_0_8px_rgba(0,255,157,0.5)]' : 'bg-orange-500'} ml-2 animate-pulse`} />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
