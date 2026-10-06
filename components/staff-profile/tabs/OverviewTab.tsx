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
                <div className="relative overflow-hidden bg-[var(--theme-bg-card)] p-5 sm:p-6 rounded-2xl border border-[var(--theme-border)] shadow-xs transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">
                            Performance Score
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Award size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[var(--theme-text-primary)] tabular-nums">
                            {score}
                        </span>
                        <span className="text-xs font-semibold text-[var(--theme-text-muted)]">/ 100</span>
                    </div>
                    <div className="w-full bg-[var(--theme-bg-subtle)] h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(0, score))}%` }} 
                        />
                    </div>
                    <p className="text-[11px] text-emerald-500 font-semibold mt-2.5 flex items-center gap-1">
                        <span>●</span> {score >= 90 ? 'Top Tier (Excellent Standing)' : score >= 75 ? 'Meets Operational Standards' : 'Requires Manager Coaching'}
                    </p>
                </div>

                {/* Attendance Rate */}
                <div className="relative overflow-hidden bg-[var(--theme-bg-card)] p-5 sm:p-6 rounded-2xl border border-[var(--theme-border)] shadow-xs transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">
                            Attendance Rate
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-primary)] flex items-center justify-center">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[var(--theme-text-primary)] tabular-nums">
                            {attendance}%
                        </span>
                        <span className="text-xs font-semibold text-[var(--theme-text-muted)]">punctuality</span>
                    </div>
                    <div className="w-full bg-[var(--theme-bg-subtle)] h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="bg-[var(--theme-primary)] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(0, attendance))}%` }} 
                        />
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold mt-2.5 flex items-center gap-1">
                        <span>●</span> Verified shift & roster attendance
                    </p>
                </div>

                {/* Tasks Completed */}
                <div className="relative overflow-hidden bg-[var(--theme-bg-card)] p-5 sm:p-6 rounded-2xl border border-[var(--theme-border)] shadow-xs transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">
                            Tasks Completed
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <CheckSquare size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[var(--theme-text-primary)] tabular-nums">
                            {completedTasks}
                        </span>
                        <span className="text-xs font-semibold text-[var(--theme-text-muted)]">/ {totalTasks} assigned</span>
                    </div>
                    <div className="w-full bg-[var(--theme-bg-subtle)] h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${taskPercent}%` }} 
                        />
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold mt-2.5 flex items-center gap-1">
                        <span>●</span> {totalTasks === 0 ? 'No active task backlog' : `${totalTasks - completedTasks} pending in queue`}
                    </p>
                </div>
            </div>

            {/* Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-[var(--theme-bg-card)] p-6 sm:p-7 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--theme-border)]">
                        <h4 className="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5">
                            <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-primary)]">
                                <User size={16} />
                            </div>
                            <span>Personal Information</span>
                        </h4>
                    </div>

                    <div className="space-y-4">
                        {/* Email */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                    <Mail size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider">Email Address</p>
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{employee.email || 'N/A'}</p>
                                </div>
                            </div>
                            {employee.email && (
                                <button
                                    onClick={() => handleCopy(employee.email || '', 'email')}
                                    className="p-2 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer flex-shrink-0"
                                    title="Copy Email"
                                >
                                    {copiedKey === 'email' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                    <Phone size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider">Phone Number</p>
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{employee.phone || 'No phone recorded'}</p>
                                </div>
                            </div>
                            {employee.phone && (
                                <button
                                    onClick={() => handleCopy(employee.phone || '', 'phone')}
                                    className="p-2 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer flex-shrink-0"
                                    title="Copy Phone"
                                >
                                    {copiedKey === 'phone' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            )}
                        </div>

                        {/* Residence */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                                    <MapPin size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider">Residential Address</p>
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{employee.address || 'No residence address recorded'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Last Geofence Location */}
                        {(employee.lastLoginGps || (isOwnProfile && user?.loginLocation)) && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 flex-shrink-0">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider">Last Verified GPS</p>
                                        <p className="text-sm font-mono font-medium text-[var(--theme-text-secondary)] truncate">
                                            {canSeeLocation ? (employee.lastLoginGps || user?.loginLocation) : 'Protected by Hierarchy'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Employment Details */}
                <div className="bg-[var(--theme-bg-card)] p-6 sm:p-7 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--theme-border)]">
                        <h4 className="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                <Briefcase size={16} />
                            </div>
                            <span>Employment Details</span>
                        </h4>
                    </div>

                    <div className="space-y-3.5">
                        <div className="flex items-center justify-between py-2.5 border-b border-[var(--theme-border)]">
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)] flex items-center gap-2">
                                <Building size={14} className="text-[var(--theme-text-muted)]" />
                                Assigned Workplace
                            </span>
                            <span className="text-xs font-bold text-[var(--theme-primary)] px-2.5 py-1 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                                {workplace}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5 border-b border-[var(--theme-border)]">
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)] flex items-center gap-2">
                                <Calendar size={14} className="text-[var(--theme-text-muted)]" />
                                Date of Joining
                            </span>
                            <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                                {employee.joinDate || 'Official Onboarding'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5 border-b border-[var(--theme-border)]">
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)] flex items-center gap-2">
                                <Star size={14} className="text-[var(--theme-text-muted)]" />
                                Operational Domain
                            </span>
                            <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                                {employee.specialization || employee.department || 'Retail Operations'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5 border-b border-[var(--theme-border)]">
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)] flex items-center gap-2">
                                <ShieldCheck size={14} className="text-[var(--theme-text-muted)]" />
                                Account Standing
                            </span>
                            <span className="text-xs font-bold text-emerald-500">
                                {employee.status === 'Active' ? 'Active & Compliant' : employee.status}
                            </span>
                        </div>
                    </div>

                    {employee.emergencyContact && (
                        <div className="mt-5 pt-4 border-t border-[var(--theme-border)]">
                            <p className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider mb-2">Emergency Safety Contact</p>
                            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-500 font-semibold">
                                <Phone size={14} />
                                <span>{employee.emergencyContact}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Activity (Real Hours from Roster) */}
            <div className="bg-[var(--theme-bg-card)] p-6 sm:p-7 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h4 className="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5">
                            <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-primary)]">
                                <TrendingUp size={16} />
                            </div>
                            <span>Weekly Shift & Attendance Schedule</span>
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Planned roster shift hours for this week</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-primary)] self-start sm:self-auto tabular-nums">
                        {totalScheduledHours} hrs planned
                    </span>
                </div>
                <div className="h-64 w-full min-h-[256px] min-w-0 relative overflow-hidden" role="img" aria-label="Bar chart showing weekly work hours">
                    <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={256}>
                        <BarChart data={weeklyActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                            <XAxis dataKey="day" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: 'var(--theme-bg-panel)', 
                                    border: '1px solid var(--theme-border)', 
                                    borderRadius: '12px',
                                    color: 'var(--theme-text-primary)',
                                    fontSize: '12px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                                }}
                                itemStyle={{ color: 'var(--theme-primary)' }}
                                cursor={{ fill: 'var(--theme-bg-subtle)' }}
                            />
                            <Bar dataKey="hours" fill="var(--theme-primary)" radius={[8, 8, 0, 0]} barSize={36} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Device & Login Security History */}
            <div className="bg-[var(--theme-bg-card)] p-6 sm:p-7 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--theme-border)]">
                    <h4 className="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5">
                        <div className="p-2 bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)]">
                            <Shield size={16} />
                        </div>
                        <span>Device & Terminal Session Security</span>
                    </h4>
                </div>
                {canSeeLocation ? (
                    <>
                        {employee.lastLoginDevice && (
                            <div className="mb-5 p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                        <Laptop size={16} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold block">Primary Registered Terminal</span>
                                        <span className="text-sm font-bold text-[var(--theme-text-primary)]">{employee.lastLoginDevice}</span>
                                    </div>
                                </div>
                                {employee.lastLoginAt && (
                                    <div className="md:text-right pl-11 md:pl-0">
                                        <span className="text-[10px] text-[var(--theme-text-muted)] uppercase font-bold block">Last Sync Timestamp</span>
                                        <span className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums">{new Date(employee.lastLoginAt).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Recent Authenticated Sessions</p>
                                {employee.loginHistory && employee.loginHistory.length > 0 && (
                                    <span className="text-[10px] text-[var(--theme-text-muted)] font-mono">Last 10 sessions</span>
                                )}
                            </div>
                            {employee.loginHistory && employee.loginHistory.length > 0 ? (
                                <div className="divide-y divide-[var(--theme-border)] border border-[var(--theme-border)] rounded-xl overflow-hidden bg-[var(--theme-bg-subtle)]">
                                    {employee.loginHistory.slice(0, 10).map((login: any, idx: number) => (
                                        <div key={idx} className="p-3 flex justify-between items-center text-xs text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card)] transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-[var(--theme-text-primary)]">{login.device || 'Standard Terminal'}</span>
                                                <span className="text-[10px] text-[var(--theme-text-muted)] font-mono">{login.location || 'Branch Geofence Verified'}</span>
                                            </div>
                                            <span className="font-mono text-[var(--theme-text-muted)] text-[11px] tabular-nums">
                                                {new Date(login.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-[var(--theme-text-muted)] italic">No historical session logins recorded yet.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-xs text-[var(--theme-text-muted)] italic">This employee's terminal session history is protected based on security level restrictions.</p>
                )}
            </div>
        </div>
    );
}
