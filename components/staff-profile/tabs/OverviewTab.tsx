import React, { useMemo } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Star, Building, TrendingUp, Shield } from 'lucide-react';
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
        return site?.name || 'Headquarters';
    }, [sites, employee]);

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#FAF8F5] dark:bg-black/30 p-6 rounded-2xl border border-[#E2DCCE] dark:border-white/5 text-center group hover:border-[#2C5E3B]/40 transition-all shadow-xs">
                    <p className="text-xs text-stone-500 uppercase font-bold tracking-widest mb-2">Performance Score</p>
                    <p className="text-4xl font-black text-[#1E3F27] dark:text-[#EAE5D9] group-hover:scale-105 transition-transform">
                        {employee.performanceScore ?? 95}
                    </p>
                </div>
                <div className="bg-[#FAF8F5] dark:bg-black/30 p-6 rounded-2xl border border-[#E2DCCE] dark:border-white/5 text-center group hover:border-emerald-500/40 transition-all shadow-xs">
                    <p className="text-xs text-stone-500 uppercase font-bold tracking-widest mb-2">Attendance Rate</p>
                    <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                        {employee.attendanceRate ?? 100}%
                    </p>
                </div>
                <div className="bg-[#FAF8F5] dark:bg-black/30 p-6 rounded-2xl border border-[#E2DCCE] dark:border-white/5 text-center group hover:border-blue-500/40 transition-all shadow-xs">
                    <p className="text-xs text-stone-500 uppercase font-bold tracking-widest mb-2">Tasks Done</p>
                    <p className="text-4xl font-black text-blue-700 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        {employeeTasks.filter(t => t.status === 'Completed').length}
                    </p>
                </div>
            </div>

            {/* Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#FAF8F5] dark:bg-black/30 p-8 rounded-2xl border border-[#E2DCCE] dark:border-white/5 shadow-xs">
                    <h4 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-6 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2]">
                            <User size={18} />
                        </div>
                        Personal Information
                    </h4>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-stone-500 dark:text-stone-400 border border-[#E2DCCE] dark:border-white/10">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-stone-400 uppercase font-black">Email Address</p>
                                <p className="text-stone-800 dark:text-stone-200 font-medium">{employee.email || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-stone-500 dark:text-stone-400 border border-[#E2DCCE] dark:border-white/10">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-stone-400 uppercase font-black">Phone Number</p>
                                <p className="text-stone-800 dark:text-stone-200 font-medium">{employee.phone || 'No phone recorded'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-stone-500 dark:text-stone-400 border border-[#E2DCCE] dark:border-white/10">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-stone-400 uppercase font-black">Residence</p>
                                <p className="text-stone-800 dark:text-stone-200 font-medium">{employee.address || 'No residence address recorded'}</p>
                            </div>
                        </div>
                        {(employee.lastLoginGps || (isOwnProfile && user?.loginLocation)) && (
                            <div className="flex items-center gap-4 group animate-in fade-in duration-300">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-white/10">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-stone-400 uppercase font-black">Last Sync Location</p>
                                    <p className="text-stone-800 dark:text-stone-200 font-medium">
                                        {canSeeLocation ? (employee.lastLoginGps || user?.loginLocation) : 'Protected'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#FAF8F5] dark:bg-black/30 p-8 rounded-2xl border border-[#E2DCCE] dark:border-white/5 shadow-xs">
                    <h4 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Briefcase size={18} />
                        </div>
                        Employment Details
                    </h4>
                    <div className="space-y-4">
                        {[
                            { label: 'Joined Date', value: employee.joinDate || 'N/A', icon: Calendar },
                            { label: 'Specialization', value: employee.specialization || 'General Operations', icon: Star },
                            { label: 'Workplace', value: workplace, icon: Building, color: 'text-[#2C5E3B] dark:text-[#A9CBA2]' }
                        ].map((row, idx) => (
                            <div key={idx} className="flex justify-between items-center py-3 border-b border-[#E2DCCE]/60 dark:border-white/5 last:border-0">
                                <span className="text-stone-500 dark:text-stone-400 text-sm flex items-center gap-2">
                                    <row.icon size={14} /> {row.label}
                                </span>
                                <span className={`text-sm font-bold ${row.color || 'text-stone-800 dark:text-stone-200'}`}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                    {employee.emergencyContact && (
                        <div className="mt-8 pt-6 border-t border-[#E2DCCE]/60 dark:border-white/5">
                            <p className="text-xs text-stone-400 uppercase font-black mb-2">Emergency Contact</p>
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{employee.emergencyContact}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Activity (Real Hours from Roster) */}
            <div className="bg-[#FAF8F5] dark:bg-black/30 p-8 rounded-2xl border border-[#E2DCCE] dark:border-white/5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <h4 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-3">
                        <TrendingUp size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        Weekly Scheduled & Attendance Hours
                    </h4>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-[#2C5E3B] dark:text-[#A9CBA2]">
                        {totalScheduledHours} hrs planned this week
                    </span>
                </div>
                <div className="h-64 w-full" role="img" aria-label="Bar chart showing weekly work hours">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-white/10" vertical={false} />
                            <XAxis dataKey="day" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid #E2DCCE', borderRadius: '12px' }}
                                itemStyle={{ color: '#2C5E3B' }}
                            />
                            <Bar dataKey="hours" fill="#2C5E3B" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Device & Login History */}
            <div className="bg-[#FAF8F5] dark:bg-black/30 p-8 rounded-2xl border border-[#E2DCCE] dark:border-white/5 shadow-xs">
                <h4 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-6 flex items-center gap-3">
                    <Shield size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    Device & Login History
                </h4>
                {canSeeLocation ? (
                    <>
                        {employee.lastLoginDevice && (
                            <div className="mb-6 p-4 bg-white dark:bg-white/5 rounded-xl border border-[#E2DCCE] dark:border-white/10 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                <div>
                                    <span className="text-[10px] text-stone-400 uppercase font-black block">Active Device</span>
                                    <span className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{employee.lastLoginDevice}</span>
                                </div>
                                {employee.lastLoginAt && (
                                    <div className="md:text-right">
                                        <span className="text-[10px] text-stone-400 uppercase font-black block">Last Sync Time</span>
                                        <span className="text-xs text-stone-500 font-mono">{new Date(employee.lastLoginAt).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Recent Activity Session History</p>
                                {employee.loginHistory && employee.loginHistory.length > 0 && (
                                    <span className="text-[10px] text-stone-400 font-mono">Last 10 sessions</span>
                                )}
                            </div>
                            {employee.loginHistory && employee.loginHistory.length > 0 ? (
                                <div className="divide-y divide-[#E2DCCE]/60 dark:divide-white/5 border border-[#E2DCCE] dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-white/5">
                                    {employee.loginHistory.slice(0, 10).map((login: any, idx: number) => (
                                        <div key={idx} className="p-3 flex justify-between items-center text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold">{login.device || 'Unknown Device'}</span>
                                                <span className="text-[10px] text-stone-400 font-mono">{login.location || 'Unknown Location'}</span>
                                            </div>
                                            <span className="font-mono text-stone-500">
                                                {new Date(login.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-stone-400 italic">No login history recorded yet.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-xs text-stone-400 italic">This employee's device session history is protected based on security level restrictions.</p>
                )}
            </div>
        </div>
    );
}
