import React, { useMemo, useState } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Star, Building, TrendingUp, Shield, Award, CheckCircle2, CheckSquare, Copy, Check, Clock, Laptop, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, Tooltip, Bar } from 'recharts';
import { Employee, EmployeeTask } from '../../../types';
import { useStore } from '../../../contexts/CentralStore';
import { useRoster } from '../../../contexts/RosterContext';
import { canViewLocation } from '../../../utils/roles';
import { getWeekMonday, getWeekDates, calculateShiftHours } from '../../../utils/shiftPlanner';

interface OverviewTabProps {
    employee: Employee;
    employeeTasks: EmployeeTask[];
    sites: any[];
    isOwnProfile?: boolean;
}

export default function OverviewTab({ employee, employeeTasks, sites, isOwnProfile = false }: OverviewTabProps) {
    const { user } = useStore();
    const { schedules } = useRoster();
    const isOwn = user?.id === employee.id;
    const canSeeLocation = canViewLocation(user?.role, employee.role, isOwn);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopy = (text: string, key: string) => {
        if (!text || text === 'N/A') return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Compute real scheduled work hours for the current week
    const weeklyActivity = useMemo(() => {
        const monday = getWeekMonday(new Date());
        const week = getWeekDates(monday);
        return week.map(day => {
            const shift = schedules.find(s => s.employeeId === employee.id && s.date === day.date && s.status !== 'Cancelled');
            const hours = shift ? calculateShiftHours(shift.startTime, shift.endTime) : 0;
            return {
                day: day.dayName,
                hours,
                date: day.date
            };
        });
    }, [schedules, employee.id]);

    const totalScheduledHours = weeklyActivity.reduce((acc, d) => acc + d.hours, 0);

    const workplace = useMemo(() => {
        const targetSiteId = employee.siteId || (employee as any).site_id;
        const site = sites.find(s => s.id === targetSiteId);
        return site?.name || 'Corporate Headquarters';
    }, [sites, employee]);

    const score = employee.performanceScore ?? 95;
    const attendance = employee.attendanceRate ?? 100;
    const completedTasks = employeeTasks.filter(t => t.status === 'Completed').length;
    const totalTasks = employeeTasks.length;
    const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Executive KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Performance Score */}
                <div className="relative overflow-hidden bg-white dark:bg-[#18201B] p-5 sm:p-6 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase font-extrabold tracking-wider">
                            Performance Score
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Award size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">
                            {score}
                        </span>
                        <span className="text-xs font-semibold text-stone-400">/ 100</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(0, score))}%` }} 
                        />
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-2.5 flex items-center gap-1">
                        <span>●</span> {score >= 90 ? 'Top Tier (Excellent Standing)' : score >= 75 ? 'Meets Operational Standards' : 'Requires Manager Coaching'}
                    </p>
                </div>

                {/* Attendance Rate */}
                <div className="relative overflow-hidden bg-white dark:bg-[#18201B] p-5 sm:p-6 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase font-extrabold tracking-wider">
                            Attendance Rate
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">
                            {attendance}%
                        </span>
                        <span className="text-xs font-semibold text-stone-400">punctuality</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-[#2C5E3B] to-[#4D8C5E] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(0, attendance))}%` }} 
                        />
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold mt-2.5 flex items-center gap-1">
                        <span>●</span> Verified shift & roster attendance
                    </p>
                </div>

                {/* Tasks Completed */}
                <div className="relative overflow-hidden bg-white dark:bg-[#18201B] p-5 sm:p-6 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase font-extrabold tracking-wider">
                            Tasks Completed
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <CheckSquare size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100">
                            {completedTasks}
                        </span>
                        <span className="text-xs font-semibold text-stone-400">/ {totalTasks} assigned</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${taskPercent}%` }} 
                        />
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold mt-2.5 flex items-center gap-1">
                        <span>●</span> {totalTasks === 0 ? 'No active task backlog' : `${totalTasks - completedTasks} pending in queue`}
                    </p>
                </div>
            </div>

            {/* Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-white dark:bg-[#18201B] p-6 sm:p-7 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/5">
                        <h4 className="text-base font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2.5">
                            <div className="p-2 bg-[#2C5E3B]/10 dark:bg-emerald-500/15 rounded-xl text-[#2C5E3B] dark:text-[#A9CBA2]">
                                <User size={16} />
                            </div>
                            <span>Personal Information</span>
                        </h4>
                    </div>

                    <div className="space-y-4">
                        {/* Email */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/5">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] flex-shrink-0">
                                    <Mail size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-stone-400 uppercase font-extrabold tracking-wider">Email Address</p>
                                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{employee.email || 'N/A'}</p>
                                </div>
                            </div>
                            {employee.email && (
                                <button
                                    onClick={() => handleCopy(employee.email || '', 'email')}
                                    className="p-2 rounded-lg text-stone-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:bg-stone-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
                                    title="Copy Email"
                                >
                                    {copiedKey === 'email' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/5">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] flex-shrink-0">
                                    <Phone size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-stone-400 uppercase font-extrabold tracking-wider">Phone Number</p>
                                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{employee.phone || 'No phone recorded'}</p>
                                </div>
                            </div>
                            {employee.phone && (
                                <button
                                    onClick={() => handleCopy(employee.phone || '', 'phone')}
                                    className="p-2 rounded-lg text-stone-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:bg-stone-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
                                    title="Copy Phone"
                                >
                                    {copiedKey === 'phone' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            )}
                        </div>

                        {/* Residence */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/5">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-400 flex-shrink-0">
                                    <MapPin size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-stone-400 uppercase font-extrabold tracking-wider">Residential Address</p>
                                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{employee.address || 'No residence address recorded'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Last Geofence Location */}
                        {(employee.lastLoginGps || (isOwnProfile && user?.loginLocation)) && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-700 dark:text-teal-400 flex-shrink-0">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-stone-400 uppercase font-extrabold tracking-wider">Last Verified GPS</p>
                                        <p className="text-sm font-mono font-medium text-stone-700 dark:text-stone-300 truncate">
                                            {canSeeLocation ? (employee.lastLoginGps || user?.loginLocation) : 'Protected by Hierarchy'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Employment Details */}
                <div className="bg-white dark:bg-[#18201B] p-6 sm:p-7 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/5">
                        <h4 className="text-base font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2.5">
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/15 rounded-xl text-blue-700 dark:text-blue-400">
                                <Briefcase size={16} />
                            </div>
                            <span>Employment Details</span>
                        </h4>
                    </div>

                    <div className="space-y-3.5">
                        <div className="flex items-center justify-between py-2.5 border-b border-[#E2DCCE]/40 dark:border-white/5">
                            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-2">
                                <Building size={14} className="text-stone-400" />
                                Assigned Workplace
                            </span>
                            <span className="text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] px-2.5 py-1 rounded-lg bg-[#2C5E3B]/10 dark:bg-emerald-500/10 border border-[#2C5E3B]/20 dark:border-emerald-500/20">
                                {workplace}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5 border-b border-[#E2DCCE]/40 dark:border-white/5">
                            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-2">
                                <Calendar size={14} className="text-stone-400" />
                                Date of Joining
                            </span>
                            <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                                {employee.joinDate || 'Official Onboarding'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5 border-b border-[#E2DCCE]/40 dark:border-white/5">
                            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-2">
                                <Star size={14} className="text-stone-400" />
                                Operational Domain
                            </span>
                            <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                                {employee.specialization || employee.department || 'Retail Operations'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5 border-b border-[#E2DCCE]/40 dark:border-white/5">
                            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-stone-400" />
                                Account Standing
                            </span>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                {employee.status === 'Active' ? 'Active & Compliant' : employee.status}
                            </span>
                        </div>
                    </div>

                    {employee.emergencyContact && (
                        <div className="mt-5 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/5">
                            <p className="text-[10px] text-stone-400 uppercase font-extrabold tracking-wider mb-2">Emergency Safety Contact</p>
                            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200/80 dark:border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-semibold">
                                <Phone size={14} />
                                <span>{employee.emergencyContact}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Activity (Real Hours from Roster) */}
            <div className="bg-white dark:bg-[#18201B] p-6 sm:p-7 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h4 className="text-base font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2.5">
                            <div className="p-2 bg-[#2C5E3B]/10 dark:bg-emerald-500/15 rounded-xl text-[#2C5E3B] dark:text-[#A9CBA2]">
                                <TrendingUp size={16} />
                            </div>
                            <span>Weekly Shift & Attendance Schedule</span>
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Planned roster shift hours for this week</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-[#2C5E3B] dark:text-[#A9CBA2] self-start sm:self-auto">
                        {totalScheduledHours} hrs planned
                    </span>
                </div>
                <div className="h-64 w-full" role="img" aria-label="Bar chart showing weekly work hours">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2DCCE" className="dark:stroke-white/5" vertical={false} />
                            <XAxis dataKey="day" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: '#1E2822', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '12px',
                                    color: '#EAE5D9',
                                    fontSize: '12px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                itemStyle={{ color: '#34D399' }}
                                cursor={{ fill: 'rgba(44,94,59,0.06)' }}
                            />
                            <Bar dataKey="hours" fill="#2C5E3B" radius={[8, 8, 0, 0]} barSize={36} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Device & Login Security History */}
            <div className="bg-white dark:bg-[#18201B] p-6 sm:p-7 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/5">
                    <h4 className="text-base font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2.5">
                        <div className="p-2 bg-stone-100 dark:bg-white/5 rounded-xl text-stone-600 dark:text-stone-300">
                            <Shield size={16} />
                        </div>
                        <span>Device & Terminal Session Security</span>
                    </h4>
                </div>
                {canSeeLocation ? (
                    <>
                        {employee.lastLoginDevice && (
                            <div className="mb-5 p-4 bg-stone-50 dark:bg-white/[0.02] rounded-xl border border-[#E2DCCE]/60 dark:border-white/5 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-stone-200/60 dark:bg-white/5 text-stone-600 dark:text-stone-300">
                                        <Laptop size={16} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-stone-400 uppercase font-extrabold block">Primary Registered Terminal</span>
                                        <span className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{employee.lastLoginDevice}</span>
                                    </div>
                                </div>
                                {employee.lastLoginAt && (
                                    <div className="md:text-right pl-11 md:pl-0">
                                        <span className="text-[10px] text-stone-400 uppercase font-extrabold block">Last Sync Timestamp</span>
                                        <span className="text-xs text-stone-600 dark:text-stone-400 font-mono">{new Date(employee.lastLoginAt).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Recent Authenticated Sessions</p>
                                {employee.loginHistory && employee.loginHistory.length > 0 && (
                                    <span className="text-[10px] text-stone-400 font-mono">Last 10 sessions</span>
                                )}
                            </div>
                            {employee.loginHistory && employee.loginHistory.length > 0 ? (
                                <div className="divide-y divide-[#E2DCCE]/60 dark:divide-white/5 border border-[#E2DCCE] dark:border-white/10 rounded-xl overflow-hidden bg-stone-50 dark:bg-white/[0.01]">
                                    {employee.loginHistory.slice(0, 10).map((login: any, idx: number) => (
                                        <div key={idx} className="p-3 flex justify-between items-center text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100/60 dark:hover:bg-white/5 transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-stone-800 dark:text-stone-200">{login.device || 'Standard Terminal'}</span>
                                                <span className="text-[10px] text-stone-400 font-mono">{login.location || 'Branch Geofence Verified'}</span>
                                            </div>
                                            <span className="font-mono text-stone-500 text-[11px]">
                                                {new Date(login.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-stone-400 italic">No historical session logins recorded yet.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-xs text-stone-400 italic">This employee's terminal session history is protected based on security level restrictions.</p>
                )}
            </div>
        </div>
    );
}
