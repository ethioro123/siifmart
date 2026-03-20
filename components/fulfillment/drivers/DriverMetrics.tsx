import React from 'react';
import { WMSJob, User } from '../../../types';

interface DriverMetricsProps {
    filteredJobs: WMSJob[];
    employees: any[];
    user: User | null;
}

export const DriverMetrics: React.FC<DriverMetricsProps> = ({
    filteredJobs,
    employees,
    user
}) => {
    const currentEmployee = employees.find(e => e.email === user?.email);
    const stats = {
        completed: filteredJobs.filter(j => j.type === 'DISPATCH' && j.assignedTo === currentEmployee?.id && j.status === 'Completed').length,
        active: filteredJobs.filter(j => j.type === 'DISPATCH' && j.assignedTo === currentEmployee?.id && j.status !== 'Completed').length,
        items: filteredJobs.filter(j => j.type === 'DISPATCH' && j.assignedTo === currentEmployee?.id).reduce((sum, j) => sum + (j.items || j.lineItems?.length || 0), 0)
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Performance Metrics
                </h4>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[2rem] p-5 lg:p-6 relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] opacity-10 pointer-events-none" />
                <div className="space-y-6 relative z-10">
                    <div className="flex items-end justify-between border-b border-white/5 pb-6">
                        <div>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">TOTAL ITEMS</p>
                            <p className="text-4xl font-black text-white leading-none tracking-tighter">{stats.items}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-1">RATING</p>
                            <p className="text-2xl font-black text-white leading-none">9.8</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                            <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider mb-1">TOTAL JOBS</p>
                            <p className="text-xl font-black text-white">{stats.completed + stats.active}</p>
                        </div>
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                            <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider mb-1">COMPLETED</p>
                            <p className="text-xl font-black text-green-400">{stats.completed}</p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Shift Progress</span>
                            <span className="text-[9px] text-cyan-400 font-black uppercase">Alpha Stage</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full w-3/4 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
