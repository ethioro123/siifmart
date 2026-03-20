import React from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Star, Building, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, Tooltip, Bar } from 'recharts';
import { Employee, EmployeeTask } from '../../../types';

// Mock attendance data
const ATTENDANCE_DATA = [
    { day: 'Mon', hours: 8.5 },
    { day: 'Tue', hours: 7.8 },
    { day: 'Wed', hours: 8.2 },
    { day: 'Thu', hours: 9.0 },
    { day: 'Fri', hours: 8.0 },
];

interface OverviewTabProps {
    employee: Employee;
    employeeTasks: EmployeeTask[];
    sites: any[];
}

export default function OverviewTab({ employee, employeeTasks, sites }: OverviewTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-black/30 p-6 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-cyber-primary/30 transition-all">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-2">Performance Score</p>
                    <p className="text-4xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform">{employee.performanceScore}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black/30 p-6 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-green-500/30 transition-all">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-2">Attendance Rate</p>
                    <p className="text-4xl font-black text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">{employee.attendanceRate}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-black/30 p-6 rounded-2xl border border-gray-100 dark:border-white/5 text-center group hover:border-blue-500/30 transition-all">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-2">Tasks Done</p>
                    <p className="text-4xl font-black text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        {employeeTasks.filter(t => t.status === 'Completed').length}
                    </p>
                </div>
            </div>

            {/* Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-black/30 p-8 rounded-2xl border border-gray-100 dark:border-white/5">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-cyber-primary/20 rounded-lg text-cyber-primary">
                            <User size={18} />
                        </div>
                        Personal Information
                    </h4>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-black">Email Address</p>
                                <p className="text-gray-900 dark:text-white font-medium">{employee.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-black">Phone Number</p>
                                <p className="text-gray-900 dark:text-white font-medium">{employee.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-black">Residence</p>
                                <p className="text-gray-900 dark:text-white font-medium">{employee.address || 'No address provided'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/30 p-8 rounded-2xl border border-gray-100 dark:border-white/5">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500 dark:text-blue-400">
                            <Briefcase size={18} />
                        </div>
                        Employment Details
                    </h4>
                    <div className="space-y-4">
                        {[
                            { label: 'Joined Date', value: employee.joinDate, icon: Calendar },
                            { label: 'Specialization', value: employee.specialization || 'Generalist', icon: Star },
                            { label: 'Workplace', value: sites.find(s => s.id === employee.siteId)?.name || 'Headquarters', icon: Building, color: 'text-cyber-primary' }
                        ].map((row, idx) => (
                            <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
                                <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                                    <row.icon size={14} /> {row.label}
                                </span>
                                <span className={`text-sm font-bold ${row.color || 'text-gray-900 dark:text-white'}`}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                    {employee.emergencyContact && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-500 uppercase font-black mb-2">Emergency Contact</p>
                            <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10">
                                <p className="text-sm text-red-700 dark:text-red-200 font-medium">{employee.emergencyContact}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Activity */}
            <div className="bg-gray-50 dark:bg-black/30 p-8 rounded-2xl border border-gray-100 dark:border-white/5">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <TrendingUp size={18} className="text-green-500 dark:text-green-400" />
                    Weekly Activity Log
                </h4>
                <div className="h-64 w-full" role="img" aria-label="Bar chart showing weekly work hours">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ATTENDANCE_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-[#333]" vertical={false} />
                            <XAxis dataKey="day" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid #ddd', borderRadius: '8px' }}
                                itemStyle={{ color: '#00ff9d' }}
                            />
                            <Bar dataKey="hours" fill="#00ff9d" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
